import { useEffect, useRef, useState } from 'react';

type Size = { width: number; height: number; isResizing: boolean };

/**
 * Tracks the size of `element` (pass it as state via a callback ref so the observer
 * re-attaches whenever the node is mounted/unmounted) and whether it is currently being resized.
 * `isResizing` becomes true on each size change after the first measurement and
 * returns to false once no change has happened for `idleMs`.
 */
export const useResizeObserver = (element: HTMLElement | null, idleMs = 200): Size => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const idleTimer = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!element) {
            return;
        }

        let isFirstMeasurement = true;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }

            if (isFirstMeasurement) {
                isFirstMeasurement = false;
                return;
            }

            setIsResizing(true);
            window.clearTimeout(idleTimer.current);
            idleTimer.current = window.setTimeout(() => setIsResizing(false), idleMs);
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
            window.clearTimeout(idleTimer.current);
        };
    }, [element, idleMs]);

    return { ...size, isResizing };
};
