"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { markNotesRead, sendNote } from "@/app/(app)/friends/actions";
import { NOTIFICATIONS_CHANGED } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import type { Note } from "@/lib/notes";
import { cn } from "@/lib/utils";

const MAX = 280;

export function NotesPanel({
  friendshipId,
  notes: serverNotes,
  currentUserId,
  friendName,
  newestUnreadId,
}: {
  friendshipId: string;
  notes: Note[];
  currentUserId: string;
  friendName: string;
  /** Id of the newest unread note from the friend, or null. */
  newestUnreadId: string | null;
}) {
  const [notes, addOptimistic] = useOptimistic(serverNotes, (list, note: Note) => [...list, note]);
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();
  const markedUpTo = useRef<string | null>(null);

  // Opening the space counts as reading the friend's notes — including ones
  // that arrive live while it's open.
  useEffect(() => {
    if (!newestUnreadId || markedUpTo.current === newestUnreadId) return;
    markedUpTo.current = newestUnreadId;
    markNotesRead(friendshipId)
      // Let the bell pick up that those notifications are read now.
      .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)))
      .catch(() => (markedUpTo.current = null));
  }, [friendshipId, newestUnreadId]);

  function submit() {
    const body = text.trim();
    if (!body) return;
    setText("");
    startTransition(async () => {
      addOptimistic({
        id: `temp-${crypto.randomUUID()}`,
        authorId: currentUserId,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
      });
      try {
        await sendNote(friendshipId, body);
      } catch {
        toast.error("Not gönderilemedi");
        setText(body);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            Henüz not yok. {friendName} için ilk küçük notu sen bırak 💌
          </p>
        ) : (
          notes.map((n) => {
            const mine = n.authorId === currentUserId;
            return (
              <div key={n.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-3xl px-4 py-2.5 shadow-xs",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card",
                    n.id.startsWith("temp-") && "opacity-70",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{n.body}</p>
                  <p className={cn("mt-1 text-[11px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {new Date(n.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {mine && n.readAt ? " · görüldü" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="sticky bottom-20 flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm md:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          value={text}
          maxLength={MAX}
          rows={1}
          placeholder={`${friendName} için bir not…`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 outline-none field-sizing-content"
        />
        <span className="pb-2.5 text-xs tabular-nums text-muted-foreground">{MAX - text.length}</span>
        <Button type="submit" size="icon-lg" aria-label="Gönder" disabled={!text.trim()} className="rounded-full">
          <Send />
        </Button>
      </form>
    </div>
  );
}
