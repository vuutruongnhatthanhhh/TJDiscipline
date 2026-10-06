"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Mood, Species } from "@/lib/types";
import { STAGE_MAX } from "@/lib/species";
import ImageCreature from "./ImageCreature";

interface CreatureStageProps {
  species: Species;
  stage: number;
  mood: Mood;
  size?: number;
  className?: string;
}

export default function CreatureStage({ species, stage, mood, size = 220, className }: CreatureStageProps) {
  const imageUrl = species.stageImages[Math.min(stage, species.stageImages.length - 1)];

  return (
    <div
      className={`relative mx-auto ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${species.id}-${stage}-${mood}`}
          initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="animate-breathe h-full w-full"
        >
          {imageUrl && <ImageCreature url={imageUrl} mood={mood} />}
        </motion.div>
      </AnimatePresence>

      {stage >= STAGE_MAX && mood !== "sad" && (
        <>
          <span className="animate-sparkle absolute left-2 top-6 text-lg" style={{ animationDelay: "0.2s" }}>
            ✨
          </span>
          <span className="animate-sparkle absolute right-3 top-14 text-base" style={{ animationDelay: "0.9s" }}>
            ✨
          </span>
          <span className="animate-sparkle absolute bottom-10 left-6 text-sm" style={{ animationDelay: "1.4s" }}>
            ✨
          </span>
        </>
      )}
    </div>
  );
}
