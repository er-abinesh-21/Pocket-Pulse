import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Share2, Edit2, X, Printer, Scissors, Trash2 } from 'lucide-react';
import {
    buildReceiptLines,
    downloadThermalReceipt,
    getThermalReceiptBlob
} from '../../utils/thermalReceiptPdf';
import { useLongPressDrag } from '../../hooks/useLongPressDrag';
import { DustbinDropZone } from './DustbinDropZone';

const LINE_DELAY = 110; // ms between lines being "printed"

/**
 * Render a single receipt line for the in-modal preview, mirroring the PDF.
 */
const ReceiptLine = ({ line }) => {
    if (line.kind === 'spacer') return <div className="h-1.5" />;
    if (line.kind === 'divider') {
        return <div className="border-t border-dashed border-gray-700/70 my-1" />;
    }
    if (line.kind === 'header') {
        return (
            <div className="text-center font-bold tracking-widest text-[13px] uppercase">
                {line.text}
            </div>
        );
    }
    if (line.kind === 'title') {
        return (
            <div className="text-center font-semibold text-[12px] my-0.5">
                {line.text}
            </div>
        );
    }
    if (line.kind === 'kv') {
        return (
            <div className="flex justify-between items-baseline gap-1 text-[11px] font-mono">
                <span className="text-gray-700">{line.label}</span>
                <span className="flex-1 mx-1 border-b border-dotted border-gray-400/80 translate-y-[-3px]" />
                <span className="font-semibold text-gray-900">{line.value}</span>
            </div>
        );
    }
    if (line.kind === 'amount') {
        return (
            <div className="flex justify-between items-center text-[14px] font-mono font-bold py-0.5">
                <span>{line.label}</span>
                <span>{line.value}</span>
            </div>
        );
    }
    if (line.kind === 'stamp') {
        return (
            <div className="flex justify-center my-1">
                <span className="px-3 py-1 border-2 border-emerald-600 text-emerald-700 font-extrabold tracking-wider rounded-sm rotate-[-4deg] text-[12px] bg-emerald-50/80">
                    ✓ {line.text}
                </span>
            </div>
        );
    }
    if (line.kind === 'footer') {
        return <div className="text-center text-[10px] text-gray-600 italic">{line.text}</div>;
    }
    return null;
};

/**
 * PrinterReceiptModal
 * -------------------
 * Full-screen overlay with a thermal-printer animation.
 *
 * Lifecycle:
 *   1. Modal opens → printer body drops in, paper rolls down line-by-line
 *      ending with a "✓ GENERATED" stamp.
 *   2. After printing finishes the user can:
 *        • Tap "Tear"  → entire receipt tears free at the top, falls/rotates
 *          away, and the PDF downloads.
 *        • Tap "Share" → uses Web Share API (with clipboard fallback).
 *        • Tap "Edit"  → closes the modal and opens the existing edit form.
 *        • Long-press + drag the receipt → a dustbin slides in from the left;
 *          dropping on the bin triggers `onDelete` (parent shows the Undo
 *          snackbar). Releasing elsewhere just snaps the paper back.
 *
 * Props:
 *   transaction, accountName, currency, balanceAfter
 *   onClose   - close the modal
 *   onEdit    - called with (transaction) when user picks Edit
 *   onDelete  - called with (transaction) when receipt is dropped on the bin
 *   sfx       - optional { play, muted } from useReceiptSfx
 */
export const PrinterReceiptModal = ({
    transaction,
    accountName,
    currency = 'USD',
    balanceAfter,
    onClose,
    onEdit,
    onDelete,
    sfx
}) => {
    const lines = useMemo(
        () => buildReceiptLines(transaction || {}, { accountName, currency, balanceAfter }),
        [transaction, accountName, currency, balanceAfter]
    );

    const [visibleCount, setVisibleCount] = useState(0);
    const [done, setDone] = useState(false);
    const [cutting, setCutting] = useState(false);    // scissor traveling across the top
    const [torn, setTorn] = useState(false);          // paper falling away after the cut
    const [crushing, setCrushing] = useState(false);  // 'drop' or 'fly' or false
    const [autoDeleting, setAutoDeleting] = useState(false); // manual delete triggered
    const [shareStatus, setShareStatus] = useState(''); // '', 'copied', 'shared', 'failed'
    const [paperBits, setPaperBits] = useState([]);
    const [overBin, setOverBin] = useState(false);

    const printerSoundFiredRef = useRef(false);
    const reduceMotion = useRef(false);
    const paperRef = useRef(null);
    const overBinRef = useRef(false);
    // Capture the paper's center ONCE when drag begins. Re-measuring on every
    // pointermove causes a feedback loop because getBoundingClientRect() already
    // includes the transform we just applied → dx oscillates → paper flickers.
    const dragOriginRef = useRef(null);
    // Vector from paper center to bin center, captured on drop. Used by the
    // receipt-crush keyframe so the paper actually flies into the bin instead
    // of just shrinking in place.
    const [binVector, setBinVector] = useState(null); // { dx, dy } | null

    // Detect prefers-reduced-motion once
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    // Reset state on new transaction
    useEffect(() => {
        if (!transaction) return;
        setVisibleCount(0);
        setDone(false);
        setCutting(false);
        setTorn(false);
        setCrushing(false);
        setAutoDeleting(false);
        setShareStatus('');
        setPaperBits([]);
        setOverBin(false);
        overBinRef.current = false;
        dragOriginRef.current = null;
        printerSoundFiredRef.current = false;
    }, [transaction]);

    // Drive the line-by-line reveal
    useEffect(() => {
        if (!transaction) return undefined;
        if (visibleCount >= lines.length) {
            if (!done) setDone(true);
            return undefined;
        }

        const delay = reduceMotion.current ? 0 : LINE_DELAY;
        const id = setTimeout(() => setVisibleCount((c) => c + 1), delay);

        if (!printerSoundFiredRef.current && sfx && !sfx.muted) {
            printerSoundFiredRef.current = true;
            sfx.play('printer');
        }

        return () => clearTimeout(id);
    }, [transaction, lines.length, visibleCount, done, sfx]);

    // Esc closes
    useEffect(() => {
        if (!transaction) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose && onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [transaction, onClose]);

    // Spawn paper-bit particles for the crush effect
    const spawnPaperBits = (rect) => {
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const bits = Array.from({ length: 14 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
            const distance = 70 + Math.random() * 70;
            return {
                id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                x: cx,
                y: cy,
                dx: Math.cos(angle) * distance,
                dy: Math.sin(angle) * distance - 30,
                rot: (Math.random() * 540 - 270) | 0
            };
        });
        setPaperBits(bits);
        setTimeout(() => setPaperBits([]), 800);
    };

    const getBinVector = () => {
        const binEl = document.getElementById('receipt-dustbin-target');
        if (!binEl || !paperRef.current) return { dx: 0, dy: 0 };
        const bRect = binEl.getBoundingClientRect();
        const bCx = bRect.left + bRect.width / 2;
        const bCy = bRect.top + bRect.height / 2;

        let pCx, pCy;
        if (dragOriginRef.current) {
            pCx = dragOriginRef.current.cx;
            pCy = dragOriginRef.current.cy;
        } else {
            const pRect = paperRef.current.getBoundingClientRect();
            pCx = pRect.left + pRect.width / 2;
            pCy = pRect.top + pRect.height / 2;
        }
        return { dx: bCx - pCx, dy: bCy - pCy };
    };

    const handleDeleteClick = () => {
        if (!done || cutting || torn || crushing || autoDeleting) return;

        setAutoDeleting(true);
        if (sfx) sfx.play('pickup');

        const vec = getBinVector();
        setBinVector(vec);

        setTimeout(() => {
            if (sfx) sfx.play('crunch');
            setCrushing('fly');
            
            // Wait for throw animation to almost reach the bin before spawning bits
            setTimeout(() => {
                const bRect = document.getElementById('receipt-dustbin-target')?.getBoundingClientRect();
                if (bRect) spawnPaperBits(bRect);
                else if (paperRef.current) spawnPaperBits(paperRef.current.getBoundingClientRect());
                
                // Then complete the deletion
                setTimeout(() => {
                    if (onDelete) onDelete(transaction);
                    if (onClose) onClose();
                }, 200);
            }, 550); // 550ms into the 650ms fly animation
        }, 300); // Wait for bin to slide in
    };

    // ---- Long-press drag (only after printing finishes) ----
    const dragDisabled = !done || cutting || torn || crushing || autoDeleting;

    const { dragging, position, handlers } = useLongPressDrag({
        threshold: 350,
        cancelMoveThreshold: 8,
        disabled: dragDisabled,
        onActivate: () => {
            // Anchor the drag origin to the paper's CURRENT center, before we
            // start applying transforms. This avoids a measure → transform →
            // re-measure feedback loop that causes flicker.
            if (paperRef.current) {
                const rect = paperRef.current.getBoundingClientRect();
                dragOriginRef.current = {
                    cx: rect.left + rect.width / 2,
                    cy: rect.top + rect.height / 2
                };
            }
            if (sfx) sfx.play('pickup');
        },
        onDrop: () => {
            if (overBinRef.current) {
                if (sfx) sfx.play('crunch');
                const vec = getBinVector();
                setBinVector(vec);
                
                const bRect = document.getElementById('receipt-dustbin-target')?.getBoundingClientRect();
                if (bRect) spawnPaperBits(bRect);
                else if (paperRef.current) spawnPaperBits(paperRef.current.getBoundingClientRect());
                
                setCrushing('drop');
                // Wait for the crush keyframe to play before notifying the parent.
                setTimeout(() => {
                    if (onDelete) onDelete(transaction);
                    if (onClose) onClose();
                }, 450);
            } else {
                // Released elsewhere: forget the captured origin so future drags re-anchor.
                dragOriginRef.current = null;
            }
        }
    });

    // Keep ref in sync so the drop callback reads the latest hover state
    useEffect(() => { overBinRef.current = overBin; }, [overBin]);

    if (!transaction) return null;

    // Floating drag transform when the receipt is being dragged toward the bin.
    // Uses the captured drag origin so the rect we measure does NOT include the
    // transform we are about to apply (preventing flicker).
    let paperDragStyle;
    if (dragging && dragOriginRef.current) {
        const dx = position.x - dragOriginRef.current.cx;
        const dy = position.y - dragOriginRef.current.cy;
        paperDragStyle = {
            transform: `translate(${dx}px, ${dy}px) rotate(-3deg) scale(1.03)`,
            transition: 'box-shadow 150ms ease',
            boxShadow: overBin
                ? '0 0 0 3px rgba(248,113,113,0.7), 0 25px 50px -12px rgba(0,0,0,0.6)'
                : '0 25px 50px -12px rgba(0,0,0,0.6)',
            zIndex: 65,
            cursor: 'grabbing',
            willChange: 'transform'
        };
    }

    const handleTear = () => {
        if (!done || cutting || torn || crushing) return;
        // Phase 1: scissor visibly travels across the top of the receipt
        setCutting(true);
        if (sfx) sfx.play('tear');

        const cutMs = reduceMotion.current ? 0 : 750;
        setTimeout(() => {
            // Phase 2: paper detaches & falls; PDF download fires now
            setCutting(false);
            setTorn(true);
            try {
                downloadThermalReceipt(transaction, { accountName, currency, balanceAfter });
            } catch (err) {
                console.error('Receipt download failed:', err);
            }
            // Phase 3: close once the fall finishes
            const fallMs = reduceMotion.current ? 0 : 750;
            setTimeout(() => {
                if (onClose) onClose();
            }, fallMs);
        }, cutMs);
    };

    const handleShare = async () => {
        try {
            const { blob, filename } = getThermalReceiptBlob(transaction, {
                accountName,
                currency,
                balanceAfter
            });
            const file =
                typeof File !== 'undefined' ? new File([blob], filename, { type: 'application/pdf' }) : null;

            if (
                file &&
                typeof navigator !== 'undefined' &&
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {
                await navigator.share({
                    files: [file],
                    title: 'Pocket Pulse receipt',
                    text: transaction.description || 'Receipt'
                });
                setShareStatus('shared');
                return;
            }

            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                const summary = `${transaction.description || 'Transaction'} — ${transaction.type === 'income' ? '+' : '-'
                    }${Math.abs(transaction.amount)} on ${transaction.date}`;
                await navigator.clipboard.writeText(summary);
                setShareStatus('copied');
                setTimeout(() => setShareStatus(''), 1800);
                return;
            }

            setShareStatus('failed');
            setTimeout(() => setShareStatus(''), 1800);
        } catch (err) {
            console.error('Share failed:', err);
            setShareStatus('failed');
            setTimeout(() => setShareStatus(''), 1800);
        }
    };

    const handleEdit = () => {
        if (onEdit) onEdit(transaction);
        if (onClose) onClose();
    };

    // Animation class on the paper container itself.
    //  - while printing  → paper-roll
    //  - after tear cut  → receipt-fall
    //  - dropped on bin  → receipt-crush
    //  - while dragging  → none (transform driven by inline style)
    const paperAnimationClass = torn
        ? 'animate-receipt-fall'
        : crushing === 'drop'
            ? 'animate-receipt-crush-drop'
            : crushing === 'fly'
                ? 'animate-receipt-crush-fly'
                : (!dragging && visibleCount > 0 ? 'animate-paper-roll' : '');

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-3 sm:p-6"
            onClick={dragging ? undefined : onClose}
        >
            <div
                className="relative w-full sm:max-w-sm flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 right-0 sm:right-2 z-20 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Printer body — stays put while paper tears away */}
                <div className="relative w-[90%] max-w-xs animate-printer-drop">
                    <div className="relative h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-2xl shadow-2xl flex items-center justify-between px-4 border border-gray-900">
                        <Printer className="w-5 h-5 text-purple-300" />
                        <span className="text-purple-100 text-xs font-bold tracking-widest">
                            {cutting ? 'CUTTING…' : (torn || crushing ? 'READY' : 'PRINTING…')}
                        </span>
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse [animation-delay:200ms]" />
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse [animation-delay:400ms]" />
                        </div>
                    </div>
                    {/* Slot lip */}
                    <div className="h-3 bg-gray-900 mx-2 rounded-b-md shadow-inner border-x border-b border-black/40" />
                </div>

                {/* Receipt area */}
                <div className="relative w-[88%] max-w-xs -mt-1">
                    {/* Stub left in the printer once paper has been torn off / crushed */}
                    {(torn || crushing) && (
                        <div
                            className="h-1 mx-auto"
                            style={{
                                width: '100%',
                                backgroundImage:
                                    'linear-gradient(135deg, transparent 33%, #f5f0e6 33% 66%, transparent 66%), linear-gradient(45deg, transparent 33%, #f5f0e6 33% 66%, transparent 66%)',
                                backgroundSize: '8px 8px'
                            }}
                        />
                    )}

                    {/* The PAPER — long-press to drag, Tear button to detach */}
                    {!torn && (
                        <div
                            ref={paperRef}
                            {...handlers}
                            style={{
                                ...handlers.style,
                                ...paperDragStyle,
                                ...(crushing && binVector
                                    ? {
                                        '--crush-x': `${binVector.dx}px`,
                                        '--crush-y': `${binVector.dy}px`
                                    }
                                    : {}),
                                touchAction: dragging ? 'none' : 'pan-y',
                                cursor: dragDisabled
                                    ? 'default'
                                    : (dragging ? 'grabbing' : 'grab')
                            }}
                            className={`relative ${paperAnimationClass}`}
                        >
                            {/* Scissor cutting across the top while "Tear" is in progress */}
                            {cutting && (
                                <div className="absolute -top-3 left-0 right-0 h-6 pointer-events-none z-20">
                                    {/* The growing tear line that the scissor leaves behind */}
                                    <div
                                        className="absolute top-3 left-0 h-px bg-gray-800/80 animate-tear-line"
                                        style={{ width: 0 }}
                                    />
                                    {/* The traveling scissor */}
                                    <Scissors className="w-5 h-5 text-purple-600 absolute top-0 -left-2 animate-scissor-cut drop-shadow-md" />
                                </div>
                            )}

                            {/* Top torn edge (the tear point at the top of the paper) */}
                            <div
                                className="h-1 mx-auto"
                                style={{
                                    width: '100%',
                                    backgroundImage:
                                        'linear-gradient(135deg, transparent 33%, #f5f0e6 33% 66%, transparent 66%), linear-gradient(45deg, transparent 33%, #f5f0e6 33% 66%, transparent 66%)',
                                    backgroundSize: '8px 8px'
                                }}
                            />

                            <div
                                className="bg-[#f8f4ea] text-gray-900 px-4 py-3 shadow-2xl font-mono leading-tight overflow-hidden select-none"
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0 2px, transparent 2px 4px)'
                                }}
                            >
                                <div className="space-y-0.5">
                                    {lines.slice(0, visibleCount).map((line, idx) => (
                                        <div key={idx} className="animate-line-print">
                                            <ReceiptLine line={line} />
                                        </div>
                                    ))}
                                </div>

                                {done && (
                                    <div className="mt-3 select-none">
                                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-gray-500">
                                            <Scissors className="w-3 h-3" />
                                            <span>Tear off receipt</span>
                                        </div>
                                    </div>
                                )}

                                {done && !dragging && (
                                    <p className="mt-2 text-center text-[9px] uppercase tracking-widest text-gray-400">
                                        Long-press &amp; drag to bin to delete
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons (after printing completes; hidden while torn/crushing) */}
                <div
                    className={`mt-5 grid grid-cols-4 gap-2 w-[88%] max-w-xs transition-opacity duration-300 ${done && !torn && !crushing ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <button
                        onClick={handleTear}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg transition-colors disabled:opacity-50"
                        disabled={cutting}
                        title="Tear off & download"
                    >
                        <Scissors className="w-4 h-4" />
                        Tear
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold shadow-lg transition-colors relative"
                        title="Share receipt"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                        {shareStatus && (
                            <span className="absolute -top-2 -right-1 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                                {shareStatus === 'copied'
                                    ? 'Copied'
                                    : shareStatus === 'shared'
                                        ? 'OK'
                                        : 'Err'}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleEdit}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-colors"
                        title="Edit transaction"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg transition-colors"
                        title="Delete transaction"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Dustbin slides in only while the user is dragging the receipt or auto deleting */}
            <DustbinDropZone
                active={dragging}
                point={dragging ? position : null}
                onHover={setOverBin}
                forceActive={autoDeleting}
                forceOpen={autoDeleting}
            />

            {/* Paper-bit particles after a successful drop in the bin */}
            {paperBits.length > 0 && (
                <div className="fixed inset-0 z-[66] pointer-events-none">
                    {paperBits.map((b) => (
                        <span
                            key={b.id}
                            className="absolute block w-2 h-2.5 bg-gray-100 border border-gray-300 shadow-sm animate-paper-bit"
                            style={{
                                left: b.x,
                                top: b.y,
                                ['--bit-dx']: `${b.dx}px`,
                                ['--bit-dy']: `${b.dy}px`,
                                ['--bit-rot']: `${b.rot}deg`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrinterReceiptModal;
