import { useCallback, useEffect, useState } from 'react';

/**
 * Encapsulates pan/zoom management for the SVG map.
 * The math converts pixel deltas into SVG units by comparing the current viewBox
 * width/height with the rendered clientWidth/clientHeight of the SVG. This keeps
 * the movement proportional regardless of zoom level or screen size.
 */
export const usePanZoom = (initialViewBox, svgRef) => {
    const [viewBox, setViewBox] = useState(initialViewBox);

    const resetView = useCallback(() => {
        setViewBox(initialViewBox);
    }, [initialViewBox]);

    const panByPixels = useCallback((dxPixels, dyPixels) => {
        setViewBox((prev) => {
            const svg = svgRef.current;
            const { clientWidth = 1, clientHeight = 1 } = svg || {};
            // Scale pixel movement into SVG units. Using client dimensions avoids relying
            // on DOM matrices (CTM) and remains consistent across browsers/resizes.
            const scaleX = prev.width / clientWidth;
            const scaleY = prev.height / clientHeight;

            return {
                ...prev,
                x: prev.x - dxPixels * scaleX,
                y: prev.y - dyPixels * scaleY,
            };
        });
    }, [svgRef]);

    const zoomByFactor = useCallback((factor, centerPoint) => {
        setViewBox((prev) => {
            const cx = centerPoint?.x ?? prev.x + prev.width / 2;
            const cy = centerPoint?.y ?? prev.y + prev.height / 2;
            const newWidth = prev.width * factor;
            const newHeight = prev.height * factor;

            return {
                x: cx - (newWidth / 2),
                y: cy - (newHeight / 2),
                width: newWidth,
                height: newHeight,
            };
        });
    }, []);

    const screenToSvg = useCallback((clientX, clientY) => {
        const svg = svgRef.current;
        if (!svg) return null;

        const rect = svg.getBoundingClientRect();
        // Translate pixel position into the current viewBox coordinate system.
        const x = ((clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
        const y = ((clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;
        return { x, y };
    }, [svgRef, viewBox]);

    // Keep viewBox synced when initialViewBox changes (e.g., reset defaults updated).
    useEffect(() => {
        setViewBox(initialViewBox);
    }, [initialViewBox]);

    return {
        viewBox,
        setViewBox,
        resetView,
        panByPixels,
        zoomByFactor,
        screenToSvg,
    };
};

export default usePanZoom;
