"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUploadUrls, savePhotos } from "@/app/(app)/photos/actions";
import { resizeImage } from "@/lib/resize-image";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

const BATCH_SIZE = 20; // matches the server-side limit

/** With a friendshipId, uploads go into that friendship's shared album. */
export function PhotoUploader({ friendshipId }: { friendshipId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const tick = () => setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));

  /** Resize → one request for all upload URLs → parallel uploads → one save. Returns failures. */
  async function uploadBatch(files: File[]): Promise<number> {
    const resized = await Promise.all(files.map((f) => resizeImage(f).catch(() => null)));
    const ready = files.flatMap((file, i) => (resized[i] ? [{ file, image: resized[i] }] : []));
    let failed = files.length - ready.length;
    if (ready.length === 0) return failed;

    const targets = await createUploadUrls(ready.map((r) => r.image.blob.type));
    const bucket = supabaseBrowser().storage.from("photos");
    const results = await Promise.all(
      ready.map(async ({ file, image }, i) => {
        const { path, token } = targets[i];
        const { error } = await bucket.uploadToSignedUrl(path, token, image.blob, { contentType: image.blob.type });
        tick();
        if (error) {
          console.error(error);
          return null;
        }
        return { path, width: image.width, height: image.height, caption: file.name.replace(/\.[^.]+$/, "") };
      }),
    );
    const uploaded = results.filter((r) => r !== null);
    failed += results.length - uploaded.length;
    // The action revalidates /photos, which refreshes this page with the new photos.
    await savePhotos(uploaded, friendshipId);
    return failed;
  }

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => ACCEPT.includes(f.type));
    if (files.length === 0) {
      toast.error("JPG, PNG veya WEBP fotoğraf seç");
      return;
    }
    setProgress({ done: 0, total: files.length });
    let failed = 0;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      try {
        failed += await uploadBatch(batch);
      } catch (err) {
        console.error(err);
        failed += batch.length;
      }
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (failed) toast.error(`${failed} fotoğraf yüklenemedi`);
    if (failed < files.length) toast.success(`${files.length - failed} fotoğraf eklendi 💕`);
  }

  const busy = progress !== null;

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/30 bg-card/70 px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-card",
        dragging && "border-primary bg-blush/40",
        busy && "pointer-events-none opacity-80",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        className="sr-only"
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {busy ? (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium">
            Yükleniyor… {progress.done}/{progress.total}
          </p>
        </>
      ) : (
        <>
          <ImagePlus className="size-8 text-primary" />
          <p className="font-medium">Fotoğraflarını buraya sürükle ya da tıkla</p>
          <p className="text-sm text-muted-foreground">JPG, PNG, WEBP · birden fazla seçebilirsin</p>
        </>
      )}
    </label>
  );
}
