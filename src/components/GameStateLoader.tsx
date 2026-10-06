"use client";

import { useEffect } from "react";
import { useDisciplineStore } from "@/lib/store";

export default function GameStateLoader() {
  const loadFromServer = useDisciplineStore((s) => s.loadFromServer);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return null;
}
