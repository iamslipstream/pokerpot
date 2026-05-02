import Image from "next/image";
import { initials, photoSrcFor, type PhotoMap } from "@/lib/photos";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const RING: Record<"none" | "soft" | "gold", string> = {
  none: "",
  soft: "ring-2 ring-white/70 dark:ring-zinc-900/70",
  gold: "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-black",
};

export function Avatar({
  name,
  photoMap,
  size = "md",
  ring = "soft",
  className = "",
}: {
  name: string;
  photoMap: PhotoMap;
  size?: Size;
  ring?: "none" | "soft" | "gold";
  className?: string;
}) {
  const src = photoSrcFor(name, photoMap);
  const px = SIZE_PX[size];
  const base = `${SIZE_CLASS[size]} ${RING[ring]} shrink-0 rounded-full overflow-hidden`;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`${base} object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${base} flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300 font-semibold text-zinc-600 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-300 ${className}`}
    >
      {initials(name)}
    </div>
  );
}
