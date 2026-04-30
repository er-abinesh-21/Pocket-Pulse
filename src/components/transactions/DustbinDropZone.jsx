import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * DustbinDropZone
 * ---------------
 * Slides in from the left edge of the viewport while a transaction row is being
 * dragged. Highlights and "opens" its lid when the drag pointer enters its hit-box.
 *
 * Props:
 *   active   - boolean, true while a drag is in progress
 *   point    - current drag pointer { x, y } (clientX/clientY)
 *   onHover  - called with `true` when point enters the bin, `false` when it leaves
 *
 * The component imperatively measures its own bounding rect every animation frame
 * while active, so the parent doesn't need to know exact coordinates.
 */
export const DustbinDropZone = ({ active, point, onHover, forceActive, forceOpen }) => {
    const ref = useRef(null);
    const [over, setOver] = useState(false);
    const overRef = useRef(false);

    useEffect(() => {
        if (forceOpen) {
            setOver(true);
            return;
        }

        if (!active || !point || !ref.current) {
            if (overRef.current) {
                overRef.current = false;
                setOver(false);
                if (onHover) onHover(false);
            }
            return;
        }

        const rect = ref.current.getBoundingClientRect();
        // Generous hit-box: anything within 28px of the bin counts (helps mobile)
        const padding = 28;
        const isOver =
            point.x >= rect.left - padding &&
            point.x <= rect.right + padding &&
            point.y >= rect.top - padding &&
            point.y <= rect.bottom + padding;

        if (isOver !== overRef.current) {
            overRef.current = isOver;
            setOver(isOver);
            if (onHover) onHover(isOver);
        }
    }, [active, point, onHover, forceOpen]);

    const displayActive = active || forceActive;
    const displayOver = over || forceOpen;

    return (
        <div
            aria-hidden={!displayActive}
            className={`fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[55] pointer-events-none transition-all duration-300 ${displayActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
                }`}
        >
            <div
                ref={ref}
                id="receipt-dustbin-target"
                className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl flex items-end justify-center px-2 pb-3 transition-all duration-200 ${displayOver
                        ? 'bg-red-500/30 border-2 border-red-400 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.55)]'
                        : 'bg-purple-500/15 border-2 border-purple-400/70 shadow-[0_0_30px_rgba(139,92,246,0.35)]'
                    }`}
            >
                {/* Bin lid */}
                <div
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-[110%] h-2.5 rounded-t-md transition-transform duration-200 origin-bottom-left ${displayOver ? 'bg-red-400 -rotate-12 -translate-x-[60%] -translate-y-1' : 'bg-purple-400'
                        }`}
                />
                {/* Lid handle */}
                <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-1.5 rounded-full transition-transform duration-200 ${displayOver ? 'bg-red-300 -rotate-12 -translate-x-[60%] -translate-y-1' : 'bg-purple-300'
                        }`}
                />

                {/* Trash icon */}
                <Trash2
                    className={`w-9 h-9 sm:w-10 sm:h-10 mb-1 transition-colors duration-200 ${displayOver ? 'text-white' : 'text-purple-100'
                        }`}
                />

                {/* Vertical "ribs" inside the bin */}
                <div className="absolute inset-x-3 top-3 bottom-2 flex justify-around opacity-30 pointer-events-none">
                    <span className="w-px h-full bg-white/60" />
                    <span className="w-px h-full bg-white/60" />
                    <span className="w-px h-full bg-white/60" />
                </div>
            </div>

            <p
                className={`mt-2 text-center text-[11px] font-semibold tracking-wide transition-colors ${displayOver ? 'text-red-300' : 'text-purple-200'
                    }`}
            >
                {displayOver ? 'Deleting...' : 'Drop here'}
            </p>
        </div>
    );
};

export default DustbinDropZone;
