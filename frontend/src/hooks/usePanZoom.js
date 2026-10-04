import { useCallback, useState } from 'react';
/** SVG matrices account for letterboxing, unlike raw width/height ratios. */
export default function usePanZoom(initial, svgRef) {
  const [viewBox, setViewBox] = useState(initial);
  const resetView = useCallback(() => setViewBox(initial), [initial]);
  const screenToSvg = useCallback((x, y) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(x, y).matrixTransform(matrix.inverse());
  }, [svgRef]);
  const panByPixels = useCallback((dx, dy) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return;
    setViewBox((prev) => ({ ...prev, x: prev.x - dx / matrix.a, y: prev.y - dy / matrix.d }));
  }, [svgRef]);
  const zoomByFactor = useCallback((factor, center) => {
    setViewBox((prev) => {
      const width = Math.max(80, Math.min(3500, prev.width * factor));
      const ratio = width / prev.width;
      const cx = center?.x ?? prev.x + prev.width / 2;
      const cy = center?.y ?? prev.y + prev.height / 2;
      return { x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio, width, height: prev.height * ratio };
    });
  }, []);
  return { viewBox, setViewBox, resetView, screenToSvg, panByPixels, zoomByFactor };
}
