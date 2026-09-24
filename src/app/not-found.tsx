import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        {/* Title matching screenshot 094706.png */}
        <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-extrabold text-white">
          <span>We couldnt find that</span>
          <SearchX className="h-7 w-7 text-white/80" />
        </div>

        {/* Subtitle text */}
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
          We have searched through our providers and cannot find the media you
          are looking for! We do not host the media and have no control over
          what is available
        </p>

        {/* Go Back button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-white px-7 py-3 text-xs font-bold text-black shadow-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}
