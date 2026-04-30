import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLongPressDrag
 * ----------------
 * Unified pointer-based long-press + drag hook that works for both touch and mouse.
 *
 * Lifecycle:
 *   1. User presses (touch or mouse) on a target → timer starts.
 *   2. If the user moves more than `cancelMoveThreshold` before the threshold elapses,
 *      we treat it as a scroll/click and abort.
 *   3. Once the threshold elapses, `onActivate(point)` fires and `dragging` becomes true.
 *      The caller can render a floating "ghost" of the row at `position`.
 *   4. While dragging, `onMove(point)` runs every move event (caller decides when the
 *      pointer is over the dustbin hit-box, etc.).
 *   5. On pointer up, `onDrop(point)` fires regardless of where; `onCancel()` runs if
 *      drag was never activated.
 *
 * @param {{
 *   threshold?: number,
 *   cancelMoveThreshold?: number,
 *   onActivate?: (point: { x: number, y: number }) => void,
 *   onMove?: (point: { x: number, y: number }) => void,
 *   onDrop?: (point: { x: number, y: number }) => void,
 *   onCancel?: () => void,
 *   disabled?: boolean
 * }} options
 */
export const useLongPressDrag = ({
    threshold = 350,
    cancelMoveThreshold = 8,
    onActivate,
    onMove,
    onDrop,
    onCancel,
    disabled = false
} = {}) => {
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const stateRef = useRef({
        timer: null,
        startPoint: null,
        active: false
    });

    const clearTimer = () => {
        if (stateRef.current.timer) {
            clearTimeout(stateRef.current.timer);
            stateRef.current.timer = null;
        }
    };

    const reset = useCallback(() => {
        clearTimer();
        stateRef.current.startPoint = null;
        stateRef.current.active = false;
        setDragging(false);
    }, []);

    const handlePointerDown = useCallback((e) => {
        if (disabled) return;
        // Ignore right-click / middle-click
        if (e.button !== undefined && e.button !== 0) return;

        const point = { x: e.clientX, y: e.clientY };
        stateRef.current.startPoint = point;
        stateRef.current.active = false;
        setPosition(point);

        clearTimer();
        stateRef.current.timer = setTimeout(() => {
            stateRef.current.active = true;
            setDragging(true);
            // Try to capture the pointer so we keep getting move events when leaving the element
            if (e.target && typeof e.target.setPointerCapture === 'function' && e.pointerId !== undefined) {
                try { e.target.setPointerCapture(e.pointerId); } catch { /* no-op */ }
            }
            if (onActivate) onActivate(point);
        }, threshold);
    }, [disabled, threshold, onActivate]);

    const handlePointerMove = useCallback((e) => {
        const start = stateRef.current.startPoint;
        if (!start) return;

        const point = { x: e.clientX, y: e.clientY };

        if (!stateRef.current.active) {
            // Pre-activation: cancel if we moved too far (likely a scroll)
            const dx = point.x - start.x;
            const dy = point.y - start.y;
            if (Math.hypot(dx, dy) > cancelMoveThreshold) {
                clearTimer();
                stateRef.current.startPoint = null;
                if (onCancel) onCancel();
            }
            return;
        }

        // Active drag — prevent the page from scrolling under us
        if (e.cancelable) e.preventDefault();

        setPosition(point);
        if (onMove) onMove(point);
    }, [cancelMoveThreshold, onMove, onCancel]);

    const handlePointerUp = useCallback((e) => {
        const wasActive = stateRef.current.active;
        const point = { x: e.clientX, y: e.clientY };
        clearTimer();
        stateRef.current.startPoint = null;
        stateRef.current.active = false;
        setDragging(false);

        if (wasActive) {
            if (onDrop) onDrop(point);
        } else if (onCancel) {
            onCancel();
        }
    }, [onDrop, onCancel]);

    const handlePointerCancel = useCallback(() => {
        const wasActive = stateRef.current.active;
        reset();
        if (!wasActive && onCancel) onCancel();
    }, [reset, onCancel]);

    // Cleanup any pending timer on unmount
    useEffect(() => () => clearTimer(), []);

    return {
        dragging,
        position,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerCancel,
            onPointerLeave: handlePointerMove,
            // Hint to browsers that we may want to swallow vertical pan during drag
            style: { touchAction: 'pan-y' }
        }
    };
};

export default useLongPressDrag;
