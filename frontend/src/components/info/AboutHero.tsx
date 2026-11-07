"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, Pause, Play } from "lucide-react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function allowsMotion() {
  return !window.matchMedia(motionQuery).matches;
}

export function AboutHero({
  videoSrc,
  poster,
}: {
  videoSrc: string;
  poster: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    allowsMotion,
    () => false,
  );
  const useVideo = Boolean(videoSrc) && motionAllowed && !failed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!useVideo) {
      video.pause();
      video.load();
      return;
    }

    // Autoplay may be blocked; keep the still and let the user start playback.
    void video.play().catch(() => {});
    return () => video.pause();
  }, [useVideo, videoSrc]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  return (
    <section
      aria-labelledby="about-heading"
      className="relative mt-18 flex min-h-[calc(100svh-4.5rem)] items-end overflow-hidden bg-zinc-900 bg-cover bg-center text-white [overflow-wrap:anywhere] sm:min-h-[clamp(32rem,calc(100svh-4.5rem),54rem)]"
      style={{ backgroundImage: `url("${poster}")` }}
    >
      <video
        ref={videoRef}
        src={useVideo ? videoSrc : undefined}
        poster={poster}
        preload="none"
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 size-full object-cover ${failed ? "hidden" : ""}`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-black/45 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-5xl px-5 pb-8 pt-24 sm:px-6 sm:pb-12 sm:pt-32">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-white/85">About Clearup</p>
          <h1 id="about-heading" className="text-display font-semibold">
            A little more clarity for your skincare.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90">
            Build your routine, compare products, and learn from the community.
          </p>
        </div>
        <div className="mt-8 flex items-center justify-between gap-4">
          <a
            href="#clearup-story"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Our story <ArrowDown aria-hidden="true" className="size-4" />
          </a>
          {useVideo ? (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause background video" : "Play background video"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/50 bg-black/30 hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {playing ? (
                <Pause aria-hidden="true" className="size-4" />
              ) : (
                <Play aria-hidden="true" className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
