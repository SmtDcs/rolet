"use client";

import React, { useState, useEffect, useRef } from "react";

export function AmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Procedural warm fireplace / vinyl crackle generator (Zero external MP3 dependency)
  const toggleAudio = () => {
    if (isPlaying) {
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1);
        setTimeout(() => {
          audioContextRef.current?.suspend();
          setIsPlaying(false);
        }, 150);
      }
    } else {
      try {
        if (!audioContextRef.current) {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;

          // Generate brownian noise for warm tavern / candle atmosphere
          const bufferSize = ctx.sampleRate * 2;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let lastOut = 0.0;

          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // gain compensation
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          noise.loop = true;
          noise.start(0);

          // Lowpass filter for deep underground rumble / fireplace warmth
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 280;

          const gain = ctx.createGain();
          gain.gain.value = 0.08;

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noiseNodeRef.current = noise;
          gainNodeRef.current = gain;
        }

        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        if (gainNodeRef.current && audioContextRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(0.08, audioContextRef.current.currentTime, 0.1);
        }

        setIsPlaying(true);
      } catch (err) {
        console.warn("Ambient audio could not start:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleAudio}
        title={isPlaying ? "Sesi Kapat" : "Atmosferik Sesi Aç (Şömine & Mum)"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 font-['Cinzel',serif] text-xs uppercase tracking-wider backdrop-blur-md ${
          isPlaying
            ? "bg-[#1f150e]/90 text-[#e5c378] border-[#c6a15b] shadow-[0_0_15px_rgba(198,161,91,0.4)]"
            : "bg-[#0f0c0a]/80 text-[#8a7966] border-[#382b20] hover:text-[#d6c4ad] hover:border-[#6b533e]"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#e5c378] animate-ping" : "bg-neutral-600"}`} />
        <span>{isPlaying ? "Ambient: Açık" : "Ambient: Kapalı"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-3.5 h-3.5 opacity-80"
        >
          {isPlaying ? (
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 0 0 2.25 9.75v4.5a2.25 2.25 0 0 0 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
          ) : (
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 0 0 2.25 9.75v4.5a2.25 2.25 0 0 0 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM17.28 9.22a.75.75 0 1 0-1.06 1.06L17.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L19 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L20.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L19 10.94l-1.72-1.72Z" />
          )}
        </svg>
      </button>
    </div>
  );
}
