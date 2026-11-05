"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";

interface RoutineShareLinkProps {
  routineId: string;
}

export default function RoutineShareLink({ routineId }: RoutineShareLinkProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/routine/${routineId}`
      : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Link copied");
    } catch {
      setCopyStatus("Couldn't copy the link. Select and copy it from the field.");
    }
  };

  return (
    <div className="w-full min-w-0 max-w-2xl">
    <div className="flex min-w-0 items-center bg-white border border-zinc-200 rounded-md overflow-hidden shadow-sm w-full">
      <div className="bg-zinc-50 px-3 py-2 border-r border-zinc-200 text-zinc-400">
        <ExternalLink size={16} />
      </div>
      <input
        aria-label="Routine share link"
        readOnly
        value={shareUrl}
        className="min-h-11 min-w-0 flex-1 px-3 py-2 text-sm text-zinc-600 bg-transparent focus-visible:outline-2 focus-visible:outline-[#0e4a84]"
      />
      <button
        type="button"
        aria-label="Copy routine link"
        onClick={copyLink}
        className="flex size-11 shrink-0 items-center justify-center hover:bg-zinc-50 border-l border-zinc-200 transition-colors focus-visible:outline-2 focus-visible:outline-[#0e4a84]"
      >
        {copyStatus === "Link copied" ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} className="text-zinc-600" />}
      </button>
    </div>
    <span role="status" className="mt-1 block text-sm text-zinc-600">{copyStatus}</span>
    </div>
  );
}
