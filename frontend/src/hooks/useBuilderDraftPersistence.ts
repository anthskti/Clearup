import { useEffect, useState } from "react";

// Keep the draft message tied to the exact value successfully written.
export function useBuilderDraftPersistence<T>(
  key: string,
  value: T,
  enabled: boolean,
  serialize: (value: T) => string | null,
) {
  const [result, setResult] = useState<{ value: T; failed: boolean } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let failed = false;
    try {
      const stored = serialize(value);
      if (stored === null) localStorage.removeItem(key);
      else localStorage.setItem(key, stored);
    } catch {
      failed = true;
    }
    const timer = window.setTimeout(() => setResult({ value, failed }), 0);
    return () => window.clearTimeout(timer);
  }, [key, value, enabled, serialize]);

  if (!enabled || result?.value !== value) return "pending";
  return result.failed ? "error" : "saved";
}
