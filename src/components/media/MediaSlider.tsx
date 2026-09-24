"use client";

import React, { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

interface MediaSliderProps {
  children: React.ReactNode;
  className?: string;
  spaceBetween?: number;
  variant?: "backdrop" | "poster" | "top10" | "auto";
}

const BACKDROP_BREAKPOINTS = {
  320: { slidesPerView: 1.25, spaceBetween: 10 },
  480: { slidesPerView: 1.75, spaceBetween: 12 },
  640: { slidesPerView: 2.3, spaceBetween: 12 },
  768: { slidesPerView: 3, spaceBetween: 14 },
  1024: { slidesPerView: 3.5, spaceBetween: 14 },
  1280: { slidesPerView: 4, spaceBetween: 16 },
};

const POSTER_BREAKPOINTS = {
  320: { slidesPerView: 2.2, spaceBetween: 10 },
  480: { slidesPerView: 2.8, spaceBetween: 10 },
  640: { slidesPerView: 3.5, spaceBetween: 12 },
  768: { slidesPerView: 4.5, spaceBetween: 12 },
  1024: { slidesPerView: 5.5, spaceBetween: 14 },
  1280: { slidesPerView: 6, spaceBetween: 14 },
};

const TOP10_BREAKPOINTS = {
  320: { slidesPerView: 2.1, spaceBetween: 8 },
  480: { slidesPerView: 2.5, spaceBetween: 8 },
  640: { slidesPerView: 3.2, spaceBetween: 10 },
  768: { slidesPerView: 4.1, spaceBetween: 10 },
  1024: { slidesPerView: 4.8, spaceBetween: 10 },
  1280: { slidesPerView: 5.2, spaceBetween: 10 },
};

export function MediaSlider({
  children,
  className,
  spaceBetween = 16,
  variant = "backdrop",
}: MediaSliderProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const thumb = root.querySelector<HTMLElement>(
      ".swiper-slide:first-child [data-thumb]"
    );
    if (!thumb) return;

    const apply = () => {
      root.style.setProperty("--wash-h", `${thumb.offsetHeight}px`);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(thumb);
    return () => observer.disconnect();
  }, [children]);

  const breakpoints =
    variant === "top10"
      ? TOP10_BREAKPOINTS
      : variant === "poster"
      ? POSTER_BREAKPOINTS
      : variant === "backdrop"
      ? BACKDROP_BREAKPOINTS
      : undefined;

  return (
    <div ref={rootRef} className={`home-swiper relative ${className ?? ""}`}>
      <Swiper
        modules={[Navigation]}
        navigation
        slidesPerView={variant === "auto" ? "auto" : undefined}
        breakpoints={breakpoints}
        spaceBetween={spaceBetween}
        grabCursor
        speed={450}
        watchOverflow
      >
        {React.Children.map(children, (child) => (
          <SwiperSlide className={variant === "auto" ? "!w-auto" : "h-auto"}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
