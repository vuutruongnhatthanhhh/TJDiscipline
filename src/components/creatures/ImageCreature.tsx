"use client";

import { useState } from "react";
import type { Mood } from "@/lib/types";

interface ImageCreatureProps {
  url: string;
  mood: Mood;
}

// The parent CreatureStage remounts this component (via its AnimatePresence
// key) whenever `url` could change, so `loaded` always starts fresh — no
// effect needed to reset it.
export default function ImageCreature({ url, mood }: ImageCreatureProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-[8%] rounded-full bg-white/5" />
      {!loaded && (
        <div className="absolute h-9 w-9 animate-spin rounded-full border-2 border-text-faint/30 border-t-primary" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`relative h-[78%] w-[78%] object-contain drop-shadow-xl transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={mood === "sad" ? { filter: "grayscale(75%) brightness(0.72)" } : undefined}
      />
    </div>
  );
}
