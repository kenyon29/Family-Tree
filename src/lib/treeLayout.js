// Computes positions for every person box and every connector line in the tree.
// Pure/deterministic: same input (people, collapsed set) -> same layout, which
// is what lets us reuse it both for the on-screen SVG and for PDF export.

export const BOX_W = 170;
export const BOX_H = 92;
export const COUPLE_GAP = 14;
export const SIBLING_GAP = 36;
export const ROW_HEIGHT = 170;

export function buildLayout(
  index,
  { collapsed = new Set(), boxW = BOX_W, boxH = BOX_H, rowHeight = ROW_HEIGHT } = {}
) {
  const visited = new Set();
  const nodesById = new Map();

  function buildNode(personId, depth) {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const partnerEntries = index.getPartners(personId);
    const partners = [];
    const childIdsInOrder = [];

    for (const entry of partnerEntries) {
      if (entry.partnerId && !visited.has(entry.partnerId)) {
        visited.add(entry.partnerId);
        partners.push({ id: entry.partnerId, marriage: entry.marriage });
      } else if (entry.partnerId && visited.has(entry.partnerId)) {
        // Already rendered elsewhere (rare/blended case); still show the
        // connector but don't duplicate the box.
        partners.push({ id: entry.partnerId, marriage: entry.marriage, renderedElsewhere: true });
      }
      childIdsInOrder.push(...entry.childIds);
    }

    const isCollapsed = collapsed.has(personId);
    const rawChildIds = childIdsInOrder.filter((id) => !visited.has(id));
    const hasChildren = rawChildIds.length > 0;

    const node = {
      id: personId,
      depth,
      partners,
      children: [],
      hasHiddenChildren: isCollapsed && hasChildren,
    };
    nodesById.set(personId, node);

    if (!isCollapsed) {
      for (const childId of rawChildIds) {
        const childNode = buildNode(childId, depth + 1);
        if (childNode) node.children.push(childNode);
      }
    }

    return node;
  }

  const roots = [];
  for (const person of index.roots) {
    const node = buildNode(person.id, 0);
    if (node) roots.push(node);
  }
  // Anyone left un-visited (e.g. data with a cycle, or an orphaned partner
  // reference) still needs to show up somewhere.
  for (const person of index.people) {
    if (!visited.has(person.id)) {
      const node = buildNode(person.id, 0);
      if (node) roots.push(node);
    }
  }

  function rowWidth(node) {
    const boxCount = 1 + node.partners.length;
    return boxCount * boxW + (boxCount - 1) * COUPLE_GAP;
  }

  function computeWidth(node) {
    node.rowWidth = rowWidth(node);
    if (node.children.length === 0) {
      node.width = node.rowWidth;
      return node.width;
    }
    const childWidths = node.children.map(computeWidth);
    const childrenWidth =
      childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * SIBLING_GAP;
    node.width = Math.max(node.rowWidth, childrenWidth);
    return node.width;
  }

  let maxDepth = 0;
  function assignPositions(node, leftX) {
    maxDepth = Math.max(maxDepth, node.depth);
    node.y = node.depth * rowHeight;
    node.centerX = leftX + node.width / 2;

    const rowLeft = node.centerX - node.rowWidth / 2;
    node.boxes = [{ personId: node.id, x: rowLeft, y: node.y }];
    let cursor = rowLeft + boxW + COUPLE_GAP;
    for (const partner of node.partners) {
      if (!partner.renderedElsewhere) {
        node.boxes.push({ personId: partner.id, x: cursor, y: node.y, isPartner: true });
        cursor += boxW + COUPLE_GAP;
      }
    }

    if (node.children.length > 0) {
      const childrenWidth =
        node.children.reduce((a, c) => a + c.width, 0) + (node.children.length - 1) * SIBLING_GAP;
      let childLeft = node.centerX - childrenWidth / 2;
      for (const child of node.children) {
        assignPositions(child, childLeft);
        childLeft += child.width + SIBLING_GAP;
      }
    }
  }

  let cursor = 0;
  for (const root of roots) {
    computeWidth(root);
    assignPositions(root, cursor);
    cursor += root.width + SIBLING_GAP * 2;
  }

  // Flatten into render-friendly lists.
  const boxes = [];
  const marriageLines = [];
  const descentLines = [];

  function walk(node) {
    for (const box of node.boxes) {
      boxes.push({ ...box, w: boxW, h: boxH, hasHiddenChildren: box.isPartner ? false : node.hasHiddenChildren });
    }
    const visiblePartners = node.partners.filter((p) => !p.renderedElsewhere);
    for (let i = 0; i < node.boxes.length - 1; i++) {
      const a = node.boxes[i];
      const b = node.boxes[i + 1];
      marriageLines.push({
        x1: a.x + boxW,
        y1: a.y + boxH / 2,
        x2: b.x,
        y2: b.y + boxH / 2,
        divorced: !!visiblePartners[i]?.marriage?.divorceDate,
      });
    }

    if (node.children.length > 0) {
      const rowBottomY = node.y + boxH;
      const childRowY = (node.depth + 1) * rowHeight;
      const midY = rowBottomY + (childRowY - rowBottomY) / 2;
      descentLines.push({ x1: node.centerX, y1: rowBottomY, x2: node.centerX, y2: midY });
      if (node.children.length > 1) {
        const first = node.children[0];
        const last = node.children[node.children.length - 1];
        descentLines.push({ x1: first.centerX, y1: midY, x2: last.centerX, y2: midY });
      }
      for (const child of node.children) {
        descentLines.push({ x1: child.centerX, y1: midY, x2: child.centerX, y2: childRowY });
        walk(child);
      }
    }
  }
  for (const root of roots) walk(root);

  const maxX = Math.max(0, ...boxes.map((b) => b.x + boxW));
  const maxY = (maxDepth + 1) * rowHeight;

  return { roots, boxes, marriageLines, descentLines, width: maxX, height: maxY, nodesById };
}
