"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

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
        title={isPlaying ? "Mute Ambient Audio" : "Enable Ambient Audio (Fireplace & Candles)"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 font-sans text-xs uppercase tracking-wider backdrop-blur-md cursor-pointer ${
          isPlaying
            ? "bg-[#1f150e]/90 text-[#e5c378] border-[#c6a15b] shadow-[0_0_15px_rgba(198,161,91,0.4)]"
            : "bg-[#0f0c0a]/80 text-[#8a7966] border-[#382b20] hover:text-[#d6c4ad] hover:border-[#6b533e]"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#e5c378] animate-ping" : "bg-neutral-600"}`} />
        <span>{isPlaying ? "Ambient: ON" : "Ambient: OFF"}</span>
        {isPlaying ? <Volume2 className="w-3.5 h-3.5 text-[#e5c378]" /> : <VolumeX className="w-3.5 h-3.5 opacity-70" />}
      </button>
    </div>
  );
}
