import { useEffect, useMemo, useRef, useState } from 'react';
import { buildLayout, BOX_W, BOX_H } from '../lib/treeLayout.js';
import PersonBox from './PersonBox.jsx';

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;

export default function TreeView({ index, collapsed, onToggleCollapsed, focusPersonId, onFocusHandled, onEditPerson }) {
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 40, y: 40, scale: 1 });
  const dragState = useRef(null);
  const activePointers = useRef(new Map());
  const pinchState = useRef(null);

  const layout = useMemo(() => buildLayout(index, { collapsed }), [index, collapsed]);

  // Center the very first render roughly on the first root.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewport((v) => ({ ...v, x: rect.width / 2 - layout.width / 4, y: 60 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusPersonId) return;
    const box = layout.boxes.find((b) => b.personId === focusPersonId);
    const el = containerRef.current;
    if (!box || !el) {
      onFocusHandled();
      return;
    }
    const rect = el.getBoundingClientRect();
    const scale = Math.min(1, viewport.scale) || 1;
    setViewport((v) => ({
      scale: v.scale,
      x: rect.width / 2 - (box.x + BOX_W / 2) * v.scale,
      y: rect.height / 2 - (box.y + BOX_H / 2) * v.scale,
    }));
    onFocusHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPersonId]);

  function handlePointerDown(e) {
    if (e.target.closest('.person-box')) return;
    containerRef.current.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 2) {
      const [p1, p2] = [...activePointers.current.values()];
      pinchState.current = {
        startDist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
        startScale: viewport.scale,
        startCenter: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        origin: { ...viewport },
      };
      dragState.current = null;
    } else {
      dragState.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, origin: { ...viewport } };
    }
  }

  function handlePointerMove(e) {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 2 && pinchState.current) {
      const [p1, p2] = [...activePointers.current.values()];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const factor = dist / pinchState.current.startDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchState.current.startScale * factor));
      const rect = containerRef.current.getBoundingClientRect();
      const cx = pinchState.current.startCenter.x - rect.left;
      const cy = pinchState.current.startCenter.y - rect.top;
      const worldX = (cx - pinchState.current.origin.x) / pinchState.current.startScale;
      const worldY = (cy - pinchState.current.origin.y) / pinchState.current.startScale;
      setViewport({ scale: newScale, x: cx - worldX * newScale, y: cy - worldY * newScale });
      return;
    }

    if (!dragState.current || dragState.current.id !== e.pointerId) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setViewport((v) => ({ ...v, x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy }));
  }

  function handlePointerUp(e) {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      pinchState.current = null;
    }
    if (dragState.current && dragState.current.id === e.pointerId) {
      dragState.current = null;
    }
  }

  function zoomAt(clientX, clientY, factor) {
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setViewport((v) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const worldX = (px - v.x) / v.scale;
      const worldY = (py - v.y) / v.scale;
      return {
        scale: newScale,
        x: px - worldX * newScale,
        y: py - worldY * newScale,
      };
    });
  }

  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(e.clientX, e.clientY, factor);
  }

  const zoomButtons = (
    <div className="zoom-controls">
      <button aria-label="Zoom in" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.2)}>
        +
      </button>
      <button aria-label="Zoom out" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.2)}>
        −
      </button>
      <button aria-label="Reset zoom" onClick={() => setViewport((v) => ({ ...v, scale: 1 }))}>
        Reset
      </button>
    </div>
  );

  return (
    <div
      className="tree-view"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {zoomButtons}
      <svg width="100%" height="100%">
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          {layout.descentLines.map((l, i) => (
            <line key={`d${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="descent-line" />
          ))}
          {layout.marriageLines.map((l, i) => (
            <line
              key={`m${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              className={l.divorced ? 'marriage-line divorced' : 'marriage-line'}
            />
          ))}
          {layout.boxes.map((box) => (
            <PersonBox
              key={box.personId + (box.isPartner ? '-p' : '')}
              box={box}
              person={index.peopleById.get(box.personId)}
              onToggleCollapsed={onToggleCollapsed}
              onEditPerson={onEditPerson}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
