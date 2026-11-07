"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";


export default function RoutineShareLink({ routineId }: { routineId: string }) {
  const [status, setStatus] = useState("");

  async function copyLink() {
    const origin = window.location.hostname === "localhost"
      ? window.location.origin
      : "https://clearup.skin";
    try {
      await navigator.clipboard.writeText(`${origin}/routine/${routineId}`);
      setStatus("Link copied");
    } catch {
      setStatus("Couldn't copy the link. Copy it from your browser's address bar.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex h-11 min-w-0 items-center overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
        <span className="flex h-full shrink-0 items-center border-r border-zinc-200 bg-zinc-50 px-3 text-zinc-400">
          <ExternalLink size={16} aria-hidden="true" />
        </span>
        <input
          aria-label="Routine share link"
          readOnly
          value={`clearup.skin/routine/${routineId}`}
          onFocus={(event) => event.target.select()}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-600 focus-visible:outline-2 focus-visible:outline-[#0e4a84]"
        />
        <button
          type="button"
          aria-label={status === "Link copied" ? "Link copied" : "Copy routine link"}
          onClick={copyLink}
          className="flex h-full w-11 shrink-0 items-center justify-center border-l border-zinc-200 text-zinc-600 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-[#0e4a84]"
        >
          {status === "Link copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
      </div>
      <p role="status" className="mt-1 text-xs text-zinc-600">{status}</p>
    </div>
  );
}
