"use client";

import { useEffect } from "react";
import { markInboxRead } from "@/server/garden-actions";

export function MarkSeen() {
  useEffect(() => {
    void markInboxRead();
  }, []);
  return null;
}
