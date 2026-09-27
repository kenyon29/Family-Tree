import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { buildLayout } from './treeLayout.js';
import { fullName, lifespan } from './familyData.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const PLAIN_BOX = { boxW: 170, boxH: 92, rowHeight: 170 };
const EXTRAS_BOX = { boxW: 210, boxH: 190, rowHeight: 280 };

// PDF points; 1pt = 1/72 inch. Standard Letter, portrait margins etc.
const LETTER = { w: 612, h: 792 };
const PAGE_MARGIN = 24;
const MAX_POSTER_PT = 14000; // stay under PDF's ~200in page-size ceiling

async function toDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function wrapText(text, maxCharsPerLine, maxLines) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{3}$/, '...');
  }
  return lines;
}

async function buildPersonBoxGroup(box, person, includeExtras) {
  const g = el('g', { transform: `translate(${box.x} ${box.y})` });
  const deceased = !!person.deathDate;
  g.appendChild(
    el('rect', {
      width: box.w,
      height: box.h,
      rx: 10,
      fill: deceased ? '#f3f0ea' : '#ffffff',
      stroke: deceased ? '#b9a98f' : '#8a7a5c',
      'stroke-width': 1.5,
    })
  );

  const photoSize = includeExtras ? 56 : 44;
  let textX = 14;
  const showPhoto = person.photoUrl && (includeExtras ? person.showPhotoOnPrint : true);
  if (showPhoto) {
    const dataUrl = await toDataUrl(person.photoUrl);
    if (dataUrl) {
      const cx = photoSize / 2 + 10;
      const cy = includeExtras ? photoSize / 2 + 10 : box.h / 2;
      const clipId = `clip-${box.personId}-${Math.random().toString(36).slice(2)}`;
      const clipPath = el('clipPath', { id: clipId }, [el('circle', { cx, cy, r: photoSize / 2 })]);
      g.appendChild(clipPath);
      g.appendChild(
        el('image', {
          href: dataUrl,
          x: 10,
          y: cy - photoSize / 2,
          width: photoSize,
          height: photoSize,
          'clip-path': `url(#${clipId})`,
          preserveAspectRatio: 'xMidYMid slice',
        })
      );
      textX = includeExtras ? 14 : photoSize + 20;
    }
  }

  const nameY = includeExtras && showPhoto ? photoSize + 30 : box.h / 2 - 4;
  const yearsY = includeExtras && showPhoto ? photoSize + 30 + 16 : box.h / 2 + 16;

  const nameText = el('text', {
    x: textX,
    y: nameY,
    'font-size': 13,
    'font-weight': 700,
    fill: '#2b2418',
    'font-family': 'Helvetica, Arial, sans-serif',
  });
  nameText.textContent = fullName(person);
  g.appendChild(nameText);

  const yearsText = el(
    'text',
    { x: textX, y: yearsY, 'font-size': 11, fill: '#6b5f4a', 'font-family': 'Helvetica, Arial, sans-serif' },
    []
  );
  yearsText.textContent = lifespan(person);
  g.appendChild(yearsText);

  if (includeExtras && person.showNotesOnPrint && person.notes) {
    const lines = wrapText(person.notes, 34, 5);
    let ny = (showPhoto ? photoSize + 10 : nameY) + 36;
    for (const line of lines) {
      const t = el('text', {
        x: 14,
        y: ny,
        'font-size': 9.5,
        fill: '#3d3626',
        'font-family': 'Helvetica, Arial, sans-serif',
      });
      t.textContent = line;
      g.appendChild(t);
      ny += 12;
    }
  }

  return g;
}

async function buildTreeSvg(layout, index, { includeExtras }) {
  const padding = 40;
  const svg = el('svg', {
    xmlns: SVG_NS,
    width: layout.width + padding * 2,
    height: layout.height + padding * 2,
    viewBox: `0 0 ${layout.width + padding * 2} ${layout.height + padding * 2}`,
  });
  const root = el('g', { transform: `translate(${padding} ${padding})` });
  svg.appendChild(root);

  for (const l of layout.descentLines) {
    root.appendChild(el('line', { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: '#8a7a5c', 'stroke-width': 1.5 }));
  }
  for (const l of layout.marriageLines) {
    root.appendChild(
      el('line', { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: '#8a7a5c', 'stroke-width': 1.5 })
    );
  }
  for (const box of layout.boxes) {
    const person = index.peopleById.get(box.personId);
    if (!person) continue;
    // eslint-disable-next-line no-await-in-loop
    const g = await buildPersonBoxGroup(box, person, includeExtras);
    root.appendChild(g);
  }

  return svg;
}

function downloadBlob(doc, filename) {
  doc.save(filename);
}

export async function exportFullTreePdf(index, { includeExtras = false } = {}) {
  const boxOpts = includeExtras ? EXTRAS_BOX : PLAIN_BOX;
  const layout = buildLayout(index, { collapsed: new Set(), ...boxOpts });
  const svg = await buildTreeSvg(layout, index, { includeExtras });

  const pageW = Math.min(MAX_POSTER_PT, layout.width + 80);
  const pageH = Math.min(MAX_POSTER_PT, layout.height + 80);

  const doc = new jsPDF({ orientation: pageW >= pageH ? 'landscape' : 'portrait', unit: 'pt', format: [pageW, pageH] });
  await doc.svg(svg, { x: 0, y: 0, width: pageW, height: pageH });
  downloadBlob(doc, 'family-tree-full.pdf');
}

export async function exportBranchPdf(index, rootPersonId, { includeExtras = false } = {}) {
  const boxOpts = includeExtras ? EXTRAS_BOX : PLAIN_BOX;
  const layout = buildLayout(index, { collapsed: new Set(), ...boxOpts });
  const svg = await buildTreeSvg(layout, index, { includeExtras });

  const contentW = layout.width + 80;
  const contentH = layout.height + 80;
  const usableW = LETTER.w - PAGE_MARGIN * 2;
  const usableH = LETTER.h - PAGE_MARGIN * 2;

  const cols = Math.max(1, Math.ceil(contentW / usableW));
  const rows = Math.max(1, Math.ceil(contentH / usableH));

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  let first = true;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!first) doc.addPage('letter', 'landscape');
      first = false;
      const pageUsableW = LETTER.h - PAGE_MARGIN * 2; // landscape: swap w/h
      const pageUsableH = LETTER.w - PAGE_MARGIN * 2;
      const offsetX = -c * pageUsableW;
      const offsetY = -r * pageUsableH;
      // eslint-disable-next-line no-await-in-loop
      await doc.svg(svg, {
        x: offsetX + PAGE_MARGIN,
        y: offsetY + PAGE_MARGIN,
        width: contentW,
        height: contentH,
      });
    }
  }
  downloadBlob(doc, 'family-tree-branch.pdf');
}
