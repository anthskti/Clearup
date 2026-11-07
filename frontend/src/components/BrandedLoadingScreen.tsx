import Image from "next/image";
import { cn } from "@/lib/utils";

const LOADING_ACCENT_SRC = "/assets/clearuploading.webp";

type BrandedLoadingScreenProps = {
  title?: string;
  fullScreen?: boolean;
  className?: string;
};

export default function BrandedLoadingScreen({
  title = "Loading",
  fullScreen = false,
  className,
}: BrandedLoadingScreenProps) {
  return (
    <div
      className={cn(
        "mt-18 flex min-h-[calc(100vh-4.5rem)] w-full items-center justify-center bg-[#F8F8F8] px-6 py-10 text-center",
        fullScreen && "mt-0 min-h-screen",
        className,
      )}
    >
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
        <span className="sr-only">{title}</span>
        <span aria-hidden="true" className="text-sm font-medium text-zinc-600">{title}</span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative h-3 w-3 animate-loading-star motion-reduce:animate-none"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "1.25s",
              }}
            >
              <Image
                src={LOADING_ACCENT_SRC}
                alt=""
                fill
                draggable={false}
                className="object-contain"
                sizes="12px"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
