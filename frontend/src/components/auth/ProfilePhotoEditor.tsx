"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/UserAvatar";
import { authClient } from "@/lib/auth-client";
import { getAvatarFileError, uploadAvatar } from "@/lib/avatar";

type SelectedPhoto = { file: File; previewUrl: string };

export default function ProfilePhotoEditor({ image }: { image: string | null }) {
  const [currentImage, setCurrentImage] = useState(image);
  const [previousImage, setPreviousImage] = useState(image);
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  if (image !== previousImage) {
    setPreviousImage(image);
    setCurrentImage(image);
  }

  const previewUrl = selected?.previewUrl;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus("");

    const fileError = getAvatarFileError(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setError("");
    setSelected({ file, previewUrl: URL.createObjectURL(file) });
  }

  function cancelSelection() {
    setSelected(null);
    setError("");
    setStatus("");
  }

  async function savePhoto() {
    if (!selected || submitting.current) return;
    submitting.current = true;
    setPending("save");
    setError("");
    setStatus("");

    try {
      const imageUrl = await uploadAvatar(selected.file);
      const { error } = await authClient.updateUser({ image: imageUrl });
      if (error) {
        setError(error.message || "Could not save your photo. Please try again.");
        return;
      }
      setCurrentImage(imageUrl);
      setSelected(null);
      setStatus("Profile photo updated.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save your photo. Please try again.");
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  async function removePhoto() {
    if (submitting.current) return;
    submitting.current = true;
    setPending("remove");
    setError("");
    setStatus("");

    try {
      const { error } = await authClient.updateUser({ image: null });
      if (error) {
        setError(error.message || "Could not remove your photo. Please try again.");
        return;
      }
      setCurrentImage(null);
      setSelected(null);
      setStatus("Profile photo removed.");
    } catch {
      setError("Could not remove your photo. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <UserAvatar
          src={selected?.previewUrl ?? currentImage}
          label={selected ? "New profile photo preview" : "Current profile photo"}
          className="size-20"
        />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-zinc-900">Profile photo</h3>
          <p id="profile-photo-help" className="mt-1 text-sm leading-relaxed text-zinc-500">
            JPEG, PNG, or WebP, up to 5 MB. Photos are cropped to a square.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a profile photo"
            aria-describedby="profile-photo-help"
            onChange={selectPhoto}
            disabled={pending !== null}
            className="hidden"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-zinc-300 bg-white"
              onClick={() => inputRef.current?.click()}
              disabled={pending !== null}
            >
              Change photo
            </Button>
            {currentImage && !selected && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 border-zinc-200 bg-white text-zinc-600"
                onClick={removePhoto}
                disabled={pending !== null}
              >
                {pending === "remove" ? "Removing…" : "Remove photo"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {selected && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={savePhoto}
            disabled={pending !== null}
          >
            {pending === "save" ? "Saving photo…" : "Save photo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 border-zinc-300 bg-white"
            onClick={cancelSelection}
            disabled={pending !== null}
          >
            Cancel
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <p role="status" className="mt-3 text-sm text-zinc-600">{status}</p>
    </div>
  );
}
