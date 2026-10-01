"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { removeFriend } from "@/app/(app)/friends/actions";
import { Button } from "@/components/ui/button";

export function RemoveFriendButton({ friendshipId, name }: { friendshipId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="lg"
      className="rounded-full text-muted-foreground"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `${name} ile arkadaşlığı bitirmek istediğine emin misin?\n\nOrtak fotoğraflar ve aktiviteler kaybolmaz; herkesin eklediği, kendi kişisel alanına döner. Notlar silinir.`,
          )
        )
          return;
        startTransition(async () => {
          try {
            await removeFriend(friendshipId);
            toast.success("Arkadaşlık sona erdi");
            router.push("/friends");
          } catch {
            toast.error("Bir şeyler ters gitti");
          }
        });
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <UserMinus />} Arkadaşlıktan çıkar
    </Button>
  );
}
