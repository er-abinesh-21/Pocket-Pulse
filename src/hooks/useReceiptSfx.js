import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useReceiptSfx
 * -------------
 * Lightweight sound + haptic feedback for the receipt/dustbin interactions.
 *
 * Strategy:
 *   1. Try to load real audio files from /sounds/<name>.mp3 lazily on first play.
 *   2. If a file is missing or can't be decoded, synthesize a fallback using the Web Audio API.
 *   3. Respect the global mute flag (persisted in localStorage as 'sfxMuted').
 *   4. Fire a haptic pattern for the same event when supported (navigator.vibrate).
 */

const STORAGE_KEY = 'sfxMuted';

const SOUND_SOURCES = {
    printer: '/sounds/printer.mp3',
    tear: '/sounds/tear.mp3',
    crunch: '/sounds/crunch.mp3'
};

const HAPTIC_PATTERNS = {
    printer: [10, 40, 10],
    tear: [25],
    crunch: [40, 30, 40],
    pickup: [12],
    drop: [50]
};

// Public helper for components that don't need the full hook (the muted flag).
export const isSfxMuted = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setSfxMuted = (value) => {
    try {
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
        /* no-op */
    }
};

const synthesize = (ctx, type) => {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    if (type === 'printer') {
        // Series of short clicks to mimic dot matrix / thermal feed
        const duration = 0.55;
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const env = Math.sin(t * 60) > 0.6 ? 1 : 0; // pulses
            data[i] = (Math.random() * 2 - 1) * env * (1 - t / duration);
        }
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        src.connect(filter).connect(master);
        src.start(now);
        src.stop(now + duration);
        return duration;
    }

    if (type === 'tear') {
        // Quick pink-noise burst that ramps down
        const duration = 0.35;
        const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            data[i] = (Math.random() * 2 - 1) * (1 - t / duration);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        src.connect(filter).connect(gain).connect(master);
        src.start(now);
        src.stop(now + duration);
        return duration;
    }

    if (type === 'crunch') {
        // Two short noise bursts overlapping for a paper-crush feel
        const duration = 0.4;
        const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const burst = Math.exp(-t * 8) + Math.exp(-Math.abs(t - 0.18) * 14);
            data[i] = (Math.random() * 2 - 1) * burst;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        src.connect(filter).connect(master);
        src.start(now);
        src.stop(now + duration);
        return duration;
    }

    if (type === 'pickup' || type === 'drop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = type === 'pickup' ? 540 : 220;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + 0.2);
        return 0.2;
    }

    return 0;
};

export const useReceiptSfx = () => {
    const [muted, setMutedState] = useState(() => isSfxMuted());
    const ctxRef = useRef(null);
    const buffersRef = useRef({});      // { name: AudioBuffer }
    const triedLoadRef = useRef({});    // { name: 'pending'|'failed'|'loaded' }

    const ensureContext = useCallback(() => {
        if (typeof window === 'undefined') return null;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        if (!ctxRef.current) {
            ctxRef.current = new Ctor();
        }
        if (ctxRef.current.state === 'suspended') {
            ctxRef.current.resume().catch(() => { });
        }
        return ctxRef.current;
    }, []);

    const tryLoadFile = useCallback((name) => {
        const url = SOUND_SOURCES[name];
        if (!url) return Promise.resolve(null);
        if (triedLoadRef.current[name] === 'failed') return Promise.resolve(null);
        if (buffersRef.current[name]) return Promise.resolve(buffersRef.current[name]);
        if (triedLoadRef.current[name] === 'pending') return Promise.resolve(null);

        const ctx = ensureContext();
        if (!ctx) return Promise.resolve(null);

        triedLoadRef.current[name] = 'pending';
        return fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error('not found');
                return res.arrayBuffer();
            })
            .then((ab) => ctx.decodeAudioData(ab))
            .then((buffer) => {
                buffersRef.current[name] = buffer;
                triedLoadRef.current[name] = 'loaded';
                return buffer;
            })
            .catch(() => {
                triedLoadRef.current[name] = 'failed';
                return null;
            });
    }, [ensureContext]);

    const haptic = useCallback((name) => {
        if (muted) return;
        const pattern = HAPTIC_PATTERNS[name];
        if (!pattern) return;
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            try { navigator.vibrate(pattern); } catch { /* no-op */ }
        }
    }, [muted]);

    const play = useCallback((name) => {
        if (muted) return;
        const ctx = ensureContext();
        if (!ctx) return;

        // Fire-and-forget: try file, fall back to synth
        const buffer = buffersRef.current[name];
        if (buffer) {
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.value = 0.7;
            src.buffer = buffer;
            src.connect(gain).connect(ctx.destination);
            src.start();
        } else if (triedLoadRef.current[name] !== 'failed') {
            tryLoadFile(name).then((buf) => {
                if (!buf) {
                    synthesize(ctx, name);
                } else {
                    const src = ctx.createBufferSource();
                    const gain = ctx.createGain();
                    gain.gain.value = 0.7;
                    src.buffer = buf;
                    src.connect(gain).connect(ctx.destination);
                    src.start();
                }
            });
            // Synthesize an immediate fallback so the user gets feedback right away
            synthesize(ctx, name);
        } else {
            synthesize(ctx, name);
        }

        haptic(name);
    }, [muted, ensureContext, tryLoadFile, haptic]);

    const setMuted = useCallback((next) => {
        setMutedState(next);
        setSfxMuted(next);
    }, []);

    const toggleMuted = useCallback(() => {
        setMutedState((prev) => {
            const next = !prev;
            setSfxMuted(next);
            return next;
        });
    }, []);

    // Cross-tab/window sync of the mute flag
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === STORAGE_KEY) {
                setMutedState(e.newValue === 'true');
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', onStorage);
            return () => window.removeEventListener('storage', onStorage);
        }
    }, []);

    return { play, haptic, muted, setMuted, toggleMuted };
};

export default useReceiptSfx;
