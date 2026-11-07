import { useState, useSyncExternalStore } from "react";
import type { SkinType } from "@/types/product";
import { ROUTINE_SKIN_TYPE_OPTIONS } from "@/lib/routineSkinTypeTags";
import { useBuilderDraftPersistence } from "@/hooks/useBuilderDraftPersistence";

const STORAGE_KEY = "builder-skin-type-tags";
const emptySubscribe = () => () => {};
const serialize = (tags: SkinType[]) => tags.length ? JSON.stringify(tags) : null;

function readTags(): SkinType[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored)
      ? ROUTINE_SKIN_TYPE_OPTIONS.filter((tag) => stored.includes(tag))
      : [];
  } catch {
    return [];
  }
}

export function useBuilderSkinTypeTags() {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tags, setTags] = useState<SkinType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  if (isClient && !isLoaded) {
    setTags(readTags());
    setIsLoaded(true);
  }
  const persistence = useBuilderDraftPersistence(STORAGE_KEY, tags, isLoaded, serialize);
  return { tags, setTags, isLoaded, persistence };
}
