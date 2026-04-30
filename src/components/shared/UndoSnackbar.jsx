import React, { useEffect, useRef, useState } from 'react';
import { Undo2, X } from 'lucide-react';

/**
 * UndoSnackbar
 * ------------
 * Bottom-center toast that auto-dismisses after `duration` ms with an animated
 * progress ring. Calls `onUndo` if the user taps Undo before timeout, otherwise
 * `onTimeout` once it expires. `onClose` always fires when the toast goes away.
 *
 * Pass a falsy `transaction` (or call onClose) to hide the snackbar.
 */
export const UndoSnackbar = ({
    open,
    message = 'Transaction deleted',
    duration = 5000,
    onUndo,
    onTimeout,
    onClose
}) => {
    const [progress, setProgress] = useState(1); // 1 → 0
    const startRef = useRef(0);
    const rafRef = useRef(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        startRef.current = performance.now();
        setProgress(1);

        const tick = () => {
            const elapsed = performance.now() - startRef.current;
            const remaining = Math.max(0, 1 - elapsed / duration);
            setProgress(remaining);
            if (remaining > 0) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);

        timeoutRef.current = setTimeout(() => {
            if (onTimeout) onTimeout();
            if (onClose) onClose();
        }, duration);

        return () => {
            cancelAnimationFrame(rafRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [open, duration, onTimeout, onClose]);

    if (!open) return null;

    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    const handleUndo = () => {
        if (onUndo) onUndo();
        if (onClose) onClose();
    };

    const handleDismiss = () => {
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-[60] flex justify-center pointer-events-none px-4">
            <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/60 max-w-md w-full sm:w-auto animate-snackbar-in"
            >
                {/* Countdown ring */}
                <div className="relative w-7 h-7 flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 -rotate-90">
                        <circle cx="12" cy="12" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
                        <circle
                            cx="12"
                            cy="12"
                            r={radius}
                            stroke="#a78bfa"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                        {Math.ceil((progress * duration) / 1000)}
                    </div>
                </div>

                <span className="text-sm flex-1 truncate">{message}</span>

                <button
                    onClick={handleUndo}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold transition-colors"
                >
                    <Undo2 className="w-4 h-4" />
                    Undo
                </button>

                <button
                    onClick={handleDismiss}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4 text-gray-300" />
                </button>
            </div>
        </div>
    );
};

export default UndoSnackbar;
