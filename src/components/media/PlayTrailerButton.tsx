"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { TrailerModal } from "./TrailerModal";

interface PlayTrailerButtonProps {
  videoKey: string;
  title?: string;
  autoPlay?: boolean;
}

export function PlayTrailerButton({
  videoKey,
  title,
  autoPlay = false,
}: PlayTrailerButtonProps) {
  const [open, setOpen] = useState(autoPlay);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
      >
        <Play className="h-4 w-4 fill-black" />
        Play now
      </button>
      {open && (
        <TrailerModal
          videoKey={videoKey}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
