"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

export function InfoTooltip() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="rounded-full p-1 text-white/50 hover:text-white transition-colors"
        aria-label="Info"
      >
        <Info className="h-4 w-4" />
      </button>

      {show && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30 w-64 rounded-xl border border-white/10 bg-[#161622] p-3 text-xs leading-relaxed text-white/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          Make sure that you select <strong>Yoru</strong> server to watch 4K content.
        </div>
      )}
    </div>
  );
}
