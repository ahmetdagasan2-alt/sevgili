"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Copy, Loader2, Pencil, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  cancelRequest,
  respondToRequest,
  sendFriendRequest,
  updateDisplayName,
} from "@/app/(app)/friends/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FriendRequest } from "@/lib/friends";
import { Avatar } from "./avatar";

export function MyProfileCard({ name, code }: { name: string; code: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kod kopyalandı");
    } catch {
      toast.error("Kopyalanamadı, kodu elle seçebilirsin");
    }
  }

  return (
    <div className="rounded-3xl bg-linear-to-br from-rose-200 via-rose-100 to-orange-100 p-5">
      <p className="text-sm font-medium text-rose-ink/70">Arkadaş kodun</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="select-all font-heading text-3xl font-semibold tracking-wider text-rose-ink">{code}</span>
        <Button size="icon-lg" variant="ghost" aria-label="Kodu kopyala" onClick={copy} className="rounded-full">
          <Copy />
        </Button>
      </div>
      <p className="mt-1 text-sm text-rose-ink/70">Bu kodu paylaş; seni bununla ekleyebilirler.</p>

      <div className="mt-4 rounded-2xl bg-white/60 p-3">
        <p className="text-xs font-medium text-rose-ink/60">Arkadaşlarının gördüğü adın</p>
        {editing ? (
          <form
            className="mt-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const res = await updateDisplayName(value);
                if (res.ok) {
                  toast.success(res.message);
                  setEditing(false);
                } else toast.error(res.message);
              });
            }}
          >
            <Input value={value} maxLength={40} autoFocus onChange={(e) => setValue(e.target.value)} />
            <Button type="submit" size="lg" disabled={pending || !value.trim()} className="rounded-full">
              {pending ? <Loader2 className="animate-spin" /> : <Check />} Kaydet
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-0.5 flex cursor-pointer items-center gap-2 font-semibold text-rose-ink hover:underline"
          >
            {name} <Pencil className="size-3.5 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AddFriendForm() {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="rounded-3xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            const res = await sendFriendRequest(code);
            if (res.ok) {
              toast.success(res.message);
              setCode("");
            } else toast.error(res.message);
          } catch {
            toast.error("İstek gönderilemedi, tekrar dene");
          }
        });
      }}
    >
      <p className="font-heading text-lg font-semibold text-rose-ink">Arkadaş ekle</p>
      <p className="mb-3 text-sm text-muted-foreground">Arkadaşının kodunu yaz, istek gitsin.</p>
      <div className="flex gap-2">
        <Input
          placeholder="ör. K7Q2-M9XP"
          value={code}
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase tracking-wider"
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={pending || code.trim().length < 8} className="rounded-full px-4">
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Gönder
        </Button>
      </div>
    </form>
  );
}

export function RequestLists({ incoming, outgoing }: { incoming: FriendRequest[]; outgoing: FriendRequest[] }) {
  const [, startTransition] = useTransition();
  // Hide a request the moment it's answered; the refreshed page confirms it.
  const [hidden, hide] = useOptimistic<string[], string>([], (ids, id) => [...ids, id]);

  function act(id: string, action: () => Promise<void>, success: string) {
    startTransition(async () => {
      hide(id);
      try {
        await action();
        toast.success(success);
      } catch {
        toast.error("Bir şeyler ters gitti, tekrar dene");
      }
    });
  }

  const inc = incoming.filter((r) => !hidden.includes(r.friendshipId));
  const out = outgoing.filter((r) => !hidden.includes(r.friendshipId));
  if (inc.length === 0 && out.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {inc.map((r) => (
        <div key={r.friendshipId} className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3">
          <Avatar name={r.profile.displayName} src={r.profile.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.profile.displayName}</p>
            <p className="text-xs text-muted-foreground">seninle arkadaş olmak istiyor</p>
          </div>
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => act(r.friendshipId, () => respondToRequest(r.friendshipId, true), "Artık arkadaşsınız 💕")}
          >
            <Check /> Kabul
          </Button>
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label="Reddet"
            className="rounded-full"
            onClick={() => act(r.friendshipId, () => respondToRequest(r.friendshipId, false), "İstek reddedildi")}
          >
            <X />
          </Button>
        </div>
      ))}
      {out.map((r) => (
        <div key={r.friendshipId} className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3">
          <Avatar name={r.profile.displayName} src={r.profile.avatarUrl} className="opacity-70" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{r.profile.displayName}</p>
            <p className="text-xs text-muted-foreground">cevap bekleniyor…</p>
          </div>
          <Button
            size="lg"
            variant="ghost"
            className="rounded-full"
            onClick={() => act(r.friendshipId, () => cancelRequest(r.friendshipId), "İstek geri çekildi")}
          >
            Geri çek
          </Button>
        </div>
      ))}
    </div>
  );
}
