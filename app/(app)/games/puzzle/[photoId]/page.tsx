import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PuzzleGame } from "@/components/puzzle/puzzle-game";
import { requireFriendship } from "@/lib/friends";
import { getPhoto } from "@/lib/photos";
import { parseGridSize, shuffledBoard } from "@/lib/puzzle";
import { getBestScoresFor } from "@/lib/scores";
import { requireUser } from "@/lib/session";

export default async function PuzzlePage(props: PageProps<"/games/puzzle/[photoId]">) {
  const { photoId } = await props.params;
  const { size } = await props.searchParams;
  const user = await requireUser(`/games/puzzle/${photoId}`);
  const gridSize = parseGridSize(size);

  const photo = await getPhoto(user.id, photoId);
  if (!photo) notFound();

  // In a shared album, this is a race against the friend.
  const shared = photo.friendshipId ? await requireFriendship(user.id, photo.friendshipId) : null;
  const players = shared ? [user.id, shared.friendId] : [user.id];
  const scores = await getBestScoresFor(photo.id, players);

  return (
    <>
      <Link
        href={shared ? `/friends/${photo.friendshipId}?tab=puzzle` : "/games/puzzle"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {shared ? `${shared.friend.displayName} ile ortak alana dön` : "Başka bir fotoğraf seç"}
      </Link>
      <PuzzleGame
        photo={{ id: photo.id, url: photo.url, width: photo.width ?? 1, height: photo.height ?? 1 }}
        initialSize={gridSize}
        // Shuffled on the server so the first render matches during hydration
        initialBoard={shuffledBoard(gridSize * gridSize)}
        bests={scores[user.id]}
        rival={shared ? { name: shared.friend.displayName, bests: scores[shared.friendId] } : undefined}
      />
    </>
  );
}
