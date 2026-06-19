import { useEffect, useRef, useState } from 'react';

/**
 * PanoramaViewer
 * Renders a 360 equirectangular JPEG and lets the user pan/zoom with
 * mouse drag. This is a lightweight CSS-based viewer with no 3D deps so the
 * skeleton runs out of the box.
 *
 * To upgrade to a true sphere-projected 360 view, swap the inner <div> for a
 * Three.js scene (SphereGeometry with the texture mapped on the inside) or a
 * library such as `pannellum` / `@photo-sphere-viewer/core`.
 *
 * Props:
 *   - src: string  -> path to the equirectangular image (e.g. /assets/images/loc-001.jpg)
 */
export default function PanoramaViewer({ src }) {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState(0); // horizontal pan in px
  const dragState = useRef({ dragging: false, startX: 0, startOffset: 0 });

  // Reset pan whenever the image changes.
  useEffect(() => {
    setOffset(0);
  }, [src]);

  function onPointerDown(e) {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startOffset: offset,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    setOffset(dragState.current.startOffset + dx);
  }

  function onPointerUp(e) {
    dragState.current.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: dragState.current.dragging ? 'grabbing' : 'grab',
        backgroundColor: '#000',
        backgroundImage: src ? `url(${src})` : 'none',
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPosition: `${offset}px center`,
        userSelect: 'none',
        touchAction: 'none',
      }}
      role="img"
      aria-label="360 degree historical panorama"
    >
      {!src && (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          No panorama loaded
        </div>
      )}
    </div>
  );
}
