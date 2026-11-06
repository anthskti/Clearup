"use client";

import { Avatar } from "radix-ui";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserAvatar({
  src,
  label,
  className,
}: {
  src?: string | null;
  label?: string;
  className?: string;
}) {
  return (
    <Avatar.Root
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-brand-soft text-brand",
        className,
      )}
    >
      <Avatar.Image src={src || undefined} alt="" className="h-full w-full object-cover" />
      <Avatar.Fallback className="flex h-full w-full items-center justify-center">
        <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
      </Avatar.Fallback>
    </Avatar.Root>
  );
}
