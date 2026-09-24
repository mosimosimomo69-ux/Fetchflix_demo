"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/watch")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-white/5 py-12 pb-24 md:pb-12 bg-black/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-4">
        {/* Fetchflix logo */}
        <Link href="/" className="inline-block">
          <div className="relative h-5 w-20">

            <Image
              src="/fetchflix.png"
              alt="Fetchflix"
              fill
              className="object-contain object-left"
              unoptimized
            />
          </div>
        </Link>

        {/* Disclaimer text */}
        <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-white/50">
          This site does not store any files on our server, we only linked to the
          media which is hosted on 3rd party services.
        </p>

        {/* Email link */}
        <div>
          <a
            href="mailto:contact@fetchflix.com"
            className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
          >
            contact@fetchflix.com
          </a>
        </div>
      </div>
    </footer>
  );
}
