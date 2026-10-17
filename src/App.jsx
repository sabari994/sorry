import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Stars,
  Smile,
  ShieldAlert
} from 'lucide-react';

import memory1 from './img/IMG_20261017_120927.jpg';
import memory2 from './img/IMG_20261017_120940.jpg';
import memory3 from './img/file_00000000b3388246b193d842df3beeb1.jpg';
import loveVideo from './img/video_20261017_130519.mp4';

// Soft audio feedback using Web Audio API (no external file dependencies)
const playChime = (type = 'chime') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'unseal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'dodge') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'celebrate') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.45);
      });
    }
  } catch (e) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
};

export default function App() {
  const [step, setStep] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Step 1 Envelope state & 10-second countdown
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [letterRising, setLetterRising] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownIntervalRef = useRef(null);

  // Video state between Step 4 and Step 5
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  // Step 4 Dodging button state
  const [noCount, setNoCount] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const dodgeAreaRef = useRef(null);
  const lastDodgeTimeRef = useRef(0);

  // Preload all media assets on mount for instantaneous, lag-free transitions
  useEffect(() => {
    [memory1, memory2, memory3].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const video = document.createElement('video');
    video.src = loveVideo;
    video.preload = 'auto';
  }, []);

  // Clear countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Confetti controller for Step 5
  useEffect(() => {
    let intervalId;
    if (step === 5) {
      if (soundEnabled) playChime('celebrate');

      // Initial burst
      const burst = () => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#fbbf24', '#ffffff']
        });
      };
      burst();

      // Continuous falling confetti
      intervalId = setInterval(() => {
        confetti({
          particleCount: 25,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#e11d48', '#fda4af', '#fb7185', '#fef08a']
        });
        confetti({
          particleCount: 25,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e11d48', '#fda4af', '#fb7185', '#fef08a']
        });
      }, 1400);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, soundEnabled]);

  // Navigate immediately to Step 2
  const goToStep2 = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setStep(2);
  };

  // Video handlers
  const handleYesClick = (e) => {
    if (e) {
      e.stopPropagation();
    }
    // Safeguard against ghost clicks/accidental taps right after a No button dodge
    if (Date.now() - lastDodgeTimeRef.current < 450) {
      return;
    }
    setShowVideo(true);
  };

  const handleVideoFinished = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowVideo(false);
    setStep(5);
  };

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  }, [showVideo]);

  // Handle Envelope Click with 5-Second Wait before Step 2
  const handleOpenEnvelope = () => {
    if (envelopeOpened) return;
    if (soundEnabled) playChime('unseal');
    setEnvelopeOpened(true);

    // Letter slides out after flap opens
    setTimeout(() => {
      setLetterRising(true);
    }, 450);

    // 10-second countdown timer before moving to Step 2
    let remaining = 10;
    setCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setStep(2);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  // Dodging button phrases - playful and never confusing with Yes
  const noButtonTexts = [
    "No 💔",
    "Wait, think again! 🥺",
    "Are you sure? 😢",
    "Try the red button! 😜",
    "Pretty please? 🌸",
    "You can't say no! 😉",
    "Give me one chance! 🥺",
    "Still No? Try again! 🙈",
    "I'll buy you chocolate! 🍫",
    "Nope, not allowed! 💖"
  ];

  const handleDodge = (e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    lastDodgeTimeRef.current = Date.now();
    if (soundEnabled) playChime('dodge');
    setNoCount(prev => prev + 1);

    // Ensure it dodges away horizontally or slightly downward.
    // Strictly prevent moving upward (randomY >= 0) so it CANNOT collide with or hover over Yes!
    const side = Math.random() > 0.5 ? 1 : -1;
    const randomX = side * (55 + Math.random() * 55);
    const randomY = Math.random() * 40;

    setNoPosition({
      x: randomX,
      y: randomY
    });
  };

  const handleRestart = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
    setEnvelopeOpened(false);
    setLetterRising(false);
    setCountdown(10);
    setNoCount(0);
    setNoPosition({ x: 0, y: 0 });
    setStep(1);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-gradient-to-tr from-rose-200 via-pink-100 to-rose-100">

      {/* Background Animated Floating Hearts and Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink-300/40 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-300/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-red-200/30 rounded-full blur-2xl animate-float-reverse" />

        {/* Subtle Floating Heart Icons in Background */}
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="absolute text-rose-300/40 select-none animate-float-slow"
            style={{
              top: `${(i * 11) % 95}%`,
              left: `${(i * 13 + 5) % 92}%`,
              animationDelay: `${i * 0.7}s`,
              transform: `scale(${0.6 + (i % 4) * 0.25})`
            }}
          >
            <Heart fill="currentColor" size={26} />
          </div>
        ))}
      </div>

      {/* Sound Toggle Floating Button */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="fixed top-4 right-4 z-50 bg-white/80 hover:bg-white text-rose-600 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 border border-rose-200"
        title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
        aria-label="Sound Toggle"
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Main Responsive Mobile-First Frame */}
      <div className="relative z-10 w-full max-w-md mx-auto min-h-[640px] max-h-[92vh] flex flex-col bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-rose-300/60 border border-white/60 overflow-hidden transition-all duration-500">

        {/* Mobile Status Header & Romantic Breadcrumb Dots */}
        <header className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-rose-100/80 bg-rose-50/50">
          <div className="flex items-center gap-1.5">
            <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-rose-700 uppercase">
              {showVideo ? 'Our Special Video ❤️' : 'For My Alagi ❤️'}
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${s === step
                  ? 'w-6 bg-gradient-to-r from-rose-500 to-pink-500'
                  : s < step
                    ? 'w-2 bg-rose-400'
                    : 'w-2 bg-rose-200'
                  }`}
              />
            ))}
          </div>
        </header>

        {/* Dynamic Step Content Area */}
        <div className="flex-1 flex flex-col p-5 sm:p-7 overflow-y-auto overflow-x-hidden">

          {/* ============================================================ */}
          {/* STEP 1: ENVELOPE OPENING SCREEN */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-between py-2 text-center animate-fadeIn">
              {/* Header with compact, clean spacing */}
              <div className="space-y-1.5 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 shadow-xs">
                  <Sparkles size={13} className="text-rose-500" />
                  A Special Delivery
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
                  For Someone Very Special
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                  Tap the wax seal to unlock this letter ❤️
                </p>
              </div>

              {/* Realistic Interactive Envelope Container with ample headroom */}
              <div className="relative mt-20 sm:mt-24 mb-6 w-72 h-44 sm:w-80 sm:h-48 flex items-center justify-center perspective-1000 select-none">

                {/* Envelope Outer Shadow & Glow */}
                <div className="absolute inset-0 bg-rose-300/30 rounded-2xl blur-xl pointer-events-none" />

                {/* The Envelope Base / Back Liner */}
                <div className="relative w-full h-full bg-[#f6ded3] rounded-2xl shadow-xl border border-rose-200/90 overflow-visible flex items-center justify-center">

                  {/* Envelope Top Flap (sits behind letter when open, in front when closed) */}
                  <div
                    onClick={handleOpenEnvelope}
                    className={`absolute top-0 left-0 right-0 h-[48%] origin-top cursor-pointer transition-all duration-700 ease-in-out ${envelopeOpened
                      ? 'pointer-events-none'
                      : 'hover:brightness-95 z-40'
                      }`}
                    style={{
                      transformOrigin: 'top center',
                      transform: envelopeOpened ? 'rotateX(180deg)' : 'rotateX(0deg)',
                      zIndex: envelopeOpened ? 2 : 40,
                      transition: 'transform 0.7s cubic-bezier(0.34, 1.3, 0.64, 1), z-index 0.2s ease',
                      background: envelopeOpened
                        ? 'linear-gradient(to top, #edd4c6, #f3dfd5)'
                        : 'linear-gradient(to bottom, #edd4c6, #f3ded3)',
                      clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                      boxShadow: envelopeOpened ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                    }}
                  />

                  {/* Inside Letter that slides UP in front of back flap, behind front pocket */}
                  <div
                    onClick={() => { if (envelopeOpened) goToStep2(); }}
                    className={`absolute top-2.5 left-[6%] w-[88%] bg-white rounded-xl shadow-xl border border-rose-200/90 p-2.5 sm:p-3 transition-all duration-700 ease-out z-20 cursor-pointer ${letterRising
                      ? '-translate-y-[115px] opacity-100 scale-100 shadow-2xl ring-2 ring-rose-200/60'
                      : 'translate-y-0 opacity-0 scale-95 pointer-events-none'
                      }`}
                    style={{
                      transition: 'transform 0.85s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease'
                    }}
                  >
                    <div className="border border-dashed border-rose-200 rounded-lg p-2.5 bg-gradient-to-b from-rose-50/50 via-white to-rose-50/30 text-left">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
                          <span className="font-handwriting text-xl text-rose-800 leading-none">
                            My Dear Azhagu Ponnu,
                          </span>
                        </div>
                        <Sparkles size={13} className="text-amber-400" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        I am so deeply sorry for hurting you. Please let me share what's truly on my mind...
                      </p>

                      <div className="mt-2 pt-1 border-t border-rose-100 flex items-center justify-center">
                        <span className="text-[11px] text-rose-700 font-semibold font-sans flex items-center gap-1">
                          <Heart size={12} className="text-rose-500 fill-rose-500" />
                          Tap to view now ➜
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Envelope Front Pocket - Left and Right Folds (z-30) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                      background: 'linear-gradient(to bottom right, #fbf0ea 50%, #f4dfd3 50%)',
                      clipPath: 'polygon(0% 0%, 50% 62%, 0% 100%)'
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                      background: 'linear-gradient(to bottom left, #fbf0ea 50%, #f4dfd3 50%)',
                      clipPath: 'polygon(100% 0%, 50% 62%, 100% 100%)'
                    }}
                  />

                  {/* Envelope Front Pocket - Bottom Fold (z-30) */}
                  <div
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                      background: 'linear-gradient(to top, #edd4c6, #f7e6dc)',
                      clipPath: 'polygon(0% 100%, 50% 62%, 100% 100%)'
                    }}
                  />

                  {/* Wax Seal Heart in Center (z-50) */}
                  <button
                    onClick={handleOpenEnvelope}
                    disabled={envelopeOpened}
                    className={`absolute z-50 transform -translate-y-1 transition-all duration-500 flex items-center justify-center ${envelopeOpened
                      ? 'opacity-0 scale-150 rotate-45 pointer-events-none'
                      : 'hover:scale-110 active:scale-95 animate-heartbeat cursor-pointer'
                      }`}
                    title="Click to unseal the envelope"
                    aria-label="Wax Seal"
                  >
                    {/* Realistic Red Wax Seal */}
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-red-800 via-rose-600 to-red-500 shadow-xl border-2 border-red-900/40 flex items-center justify-center ring-4 ring-rose-300/50">
                      <div className="absolute inset-1 rounded-full border border-dashed border-red-300/40" />
                      <Heart size={24} className="text-red-100 fill-red-100 filter drop-shadow" />
                    </div>
                  </button>

                </div>
              </div>

              {/* Bottom Instructions / Countdown Skip Button */}
              <div className="mt-auto mb-2 flex flex-col items-center">
                <button
                  onClick={envelopeOpened ? goToStep2 : handleOpenEnvelope}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-rose-700 bg-rose-100/90 hover:bg-rose-200 transition-all duration-300 shadow-sm flex items-center gap-2 group cursor-pointer"
                >
                  <Sparkles size={16} className="text-rose-500 group-hover:rotate-12 transition-transform" />
                  {envelopeOpened
                    ? 'View Memories ❤️ ➜'
                    : 'Tap the wax seal to open'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PRECIOUS MEMORIES SCREEN */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="flex-1 flex flex-col justify-between py-1 text-center animate-fadeIn">
              <div className="space-y-1 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                  <Camera size={13} className="text-rose-500" />
                  Moments That Mean Everything
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
                  Our Precious Memories
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                  Every quiet smile and tender memory with you is etched forever in my soul.
                </p>
              </div>

              {/* Grid of 3 Polaroid-Style Photo Cards */}
              <div className="grid grid-cols-1 gap-4 my-2 px-1">

                {/* Polaroid 1 */}
                <div className="relative group bg-white p-3 pb-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-rose-100 hover:-translate-y-1 -rotate-1 hover:rotate-0">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-rose-200/70 rounded-sm backdrop-blur-sm -rotate-3 z-10" />
                  <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-rose-50 border border-rose-100/60 shadow-inner">
                    <img
                      src={memory1}
                      alt="Precious Memory 1"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 font-handwriting text-lg text-slate-800 text-center">
                    "Our most beautiful smiles together"
                  </p>
                </div>

                {/* Polaroid 2 */}
                <div className="relative group bg-white p-3 pb-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-rose-100 hover:-translate-y-1 rotate-1 hover:rotate-0">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-pink-200/70 rounded-sm backdrop-blur-sm rotate-2 z-10" />
                  <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-rose-50 border border-rose-100/60 shadow-inner">
                    <img
                      src={memory2}
                      alt="Precious Memory 2"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 font-handwriting text-lg text-slate-800 text-center">
                    "Every single moment with you is special"
                  </p>
                </div>

                {/* Polaroid 3 */}
                <div className="relative group bg-white p-3 pb-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-rose-100 hover:-translate-y-1 -rotate-1 hover:rotate-0">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-rose-200/70 rounded-sm backdrop-blur-sm -rotate-1 z-10" />
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-rose-50 border border-rose-100/60 shadow-inner">
                    <img
                      src={memory3}
                      alt="Precious Memory 3"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 font-handwriting text-lg text-slate-800 text-center">
                    "Forever keeping this happiness close"
                  </p>
                </div>

              </div>

              {/* Bottom Action Button */}
              <div className="pt-3">
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold shadow-lg shadow-rose-400/40 hover:shadow-rose-400/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Read My Apology</span>
                  <Heart size={18} className="fill-white group-hover:scale-125 transition-transform" />
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: HEARTFELT LETTER SCREEN */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-between py-1 animate-fadeIn">
              {/* Header Badge */}
              <div className="text-center space-y-1 mb-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                  <Heart size={20} className="fill-rose-500" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
                  A Heartfelt Letter
                </h2>
                <p className="text-xs text-rose-600 font-medium tracking-wide uppercase">
                  From My Heart To Yours
                </p>
              </div>

              {/* Paper Textured Letter Card */}
              <div className="paper-texture relative rounded-2xl p-5 sm:p-6 shadow-xl border border-rose-200/90 text-slate-700 space-y-3.5 my-2 overflow-hidden">
                {/* Delicate Watermark Heart */}
                <div className="absolute right-3 bottom-3 text-rose-100/80 pointer-events-none select-none">
                  <Heart size={130} fill="currentColor" />
                </div>

                <div className="relative z-10 space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-slate-700">
                  <p className="font-handwriting text-2xl sm:text-3xl text-rose-800 font-bold">
                    Anbulla Pondatti,
                  </p>

                  <p>
                    Naan thappu senjiten d enaku purithu. Na panna thappu unna romba hurt panni Iruku'nu ennala purinjika mudiuthu d swetha. Unmaiyave ni hurt aagum pothu en manasu valikuthu d. Unkita pesama ennala irukka mudiyala athanala yetho yetho losu mari pannitu iruken d swetha mama va mannichiru d.
                  </p>

                  <p>
                    En life la kedacha priceless gift d ni. Unnoda love, care and unnoda smile dha enna oru nalla manushan ah mathitu varuthu. Unkoda pesum pothu dha d ennala sirikka mudiuthu.
                  </p>

                  <p>
                    Unmaiya've en manasu kulla irunthu solren d enna mannichiru d. Enimel un feelings ah purinjipen unna hurt panna maten d Swetha papa. Enkita pesu Swetha enna mannichiru d.
                  </p>

                  <p className="font-semibold text-rose-900 text-base">
                    Varthai'la solla mudiyatha alavuku unna nan love panren d swetha. I LOVE YOU 😘🫂♥️
                  </p>

                  <div className="pt-3 text-right border-t border-rose-100/80">
                    <p className="font-handwriting text-lg sm:text-xl text-rose-800 leading-snug">
                      Epome unna matum manasula nenachitu irukum,
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-rose-900 mt-1">
                      Unnoda mama, Unnoda husband and unnoda everything 💞
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-3">
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold shadow-lg shadow-rose-400/40 hover:shadow-rose-400/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Click to Continue</span>
                  <Heart size={18} className="fill-white group-hover:scale-125 transition-transform" />
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: FORGIVENESS INTERACTIVE QUESTION SCREEN */}
          {/* ============================================================ */}
          {step === 4 && !showVideo && (
            <div
              ref={dodgeAreaRef}
              className="relative flex-1 flex flex-col items-center justify-between py-3 text-center animate-fadeIn select-none overflow-hidden"
            >
              {/* Bouncing Glowing Heart Icon */}
              <div className="my-auto flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-400 blur-xl opacity-60 animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-2xl animate-bounce">
                    <Heart size={48} className="fill-white drop-shadow-md" />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-800">
                    Do you forgive me?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Nan promise pani solren d hereafter unnoda pricesless heart ah nan hurt panna maten d. Ena mannipiya alagu ponnu..?🌸
                  </p>
                </div>
              </div>

              {/* Dodging "No" & Growing "Yes" Interactive Area */}
              <div className="w-full pt-4 pb-2 relative flex flex-col items-center justify-center min-h-[175px]">

                {/* YES Button - Starts video presentation */}
                <div className="w-full max-w-xs flex justify-center py-2 relative z-10">
                  <button
                    onClick={handleYesClick}
                    style={{
                      transform: `scale(${Math.min(1 + noCount * 0.06, 1.25)})`,
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 text-white font-bold text-lg shadow-xl shadow-rose-500/40 hover:shadow-rose-500/60 transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Heart size={20} className="fill-white group-hover:scale-125 transition-transform" />
                    <span>Yes! ❤️</span>
                  </button>
                </div>

                {/* NO Button - Dodges on hover, touch, pointer, or click without ever overlapping Yes */}
                <div className="h-16 w-full flex items-center justify-center mt-3 relative z-20">
                  <button
                    onPointerEnter={handleDodge}
                    onPointerDown={handleDodge}
                    onTouchStart={handleDodge}
                    onClick={handleDodge}
                    style={{
                      transform: `translate(${noPosition.x}px, ${noPosition.y}px)`,
                      transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold border border-slate-300 shadow-md cursor-pointer transition-colors whitespace-nowrap select-none touch-none"
                  >
                    {noButtonTexts[Math.min(noCount, noButtonTexts.length - 1)]}
                  </button>
                </div>

                {noCount > 0 && (
                  <p className="text-[11px] text-rose-500 italic mt-2 animate-pulse">
                    Plss... that red button looks much happier! 😉
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4.5: VIDEO PLAYBACK SCREEN (AFTER YES) */}
          {/* ============================================================ */}
          {step === 4 && showVideo && (
            <div className="flex-1 flex flex-col justify-between py-1 text-center animate-fadeIn">
              <div className="space-y-1 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 shadow-xs">
                  <Sparkles size={13} className="text-rose-500" />
                  A Special Moment
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
                  Just For You, Swetha ❤️
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Watch this video before our celebration begins...
                </p>
              </div>

              {/* Romantic Video Player */}
              <div className="relative my-auto w-full max-h-[56vh] rounded-2xl overflow-hidden shadow-2xl border-2 border-rose-200/90 bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={loveVideo}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  onEnded={handleVideoFinished}
                  className="w-full h-full max-h-[56vh] object-contain rounded-xl"
                />
              </div>

              {/* Continue to Step 5 Button */}
              <div className="pt-3">
                <button
                  onClick={handleVideoFinished}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-semibold shadow-lg shadow-rose-400/40 hover:shadow-rose-400/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Continue to Celebration ❤️</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: CELEBRATION & THANK YOU SCREEN */}
          {/* ============================================================ */}
          {step === 5 && (
            <div className="flex-1 flex flex-col items-center justify-between py-2 text-center animate-fadeIn">

              {/* Sparkling Badge */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 shadow-sm animate-pulse">
                  <Stars size={14} className="text-rose-500" />
                  You Made My Whole World
                </div>
              </div>

              {/* Center Celebratory Illustration */}
              <div className="my-auto flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-rose-300/60 blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-2xl animate-heartbeat">
                    <Heart size={48} className="text-white fill-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                    <Sparkles size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800">
                    Thank You, My Alagi! ❤️
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Papa enna mannichathuku thanks, ithuku apram unna kandipa happy ah, safe ah vachi pathukuven d alagi.
                  </p>
                </div>

                {/* Sweet Couple Quote Box */}
                <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 shadow-sm max-w-xs">
                  {/* <p className="font-handwriting text-xl text-rose-700 leading-snug">
                    "With you, every storm turns into sunshine."
                  </p> */}
                  <p className="text-[11px] font-semibold text-rose-400 mt-1 uppercase tracking-wider">
                    Together Forever Me & U💍
                  </p>
                </div>
              </div>

              {/* Replay Button to view again from Step 1 */}
              <div className="w-full pt-3">
                <button
                  onClick={handleRestart}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                >
                  <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-300" />
                  <span>Replay Our Story</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
