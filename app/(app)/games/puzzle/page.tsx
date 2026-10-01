import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PuzzlePicker, type PickerSection } from "@/components/puzzle/puzzle-picker";
import { buttonVariants } from "@/components/ui/button";
import { listFriendships } from "@/lib/friends";
import { listPhotos, listSharedPhotos, type Photo } from "@/lib/photos";
import { parseGridSize } from "@/lib/puzzle";
import { requireUser } from "@/lib/session";

const toPicker = (photos: Photo[]) => photos.map(({ id, url, caption }) => ({ id, url, caption }));

export default async function PuzzlePickerPage(props: PageProps<"/games/puzzle">) {
  const user = await requireUser("/games/puzzle");
  const { size } = await props.searchParams;
  const [mine, { friends }] = await Promise.all([listPhotos(user.id), listFriendships(user.id)]);
  const shared = await listSharedPhotos(friends.map((f) => f.friendshipId));

  const sections: PickerSection[] = [
    { title: "Benim fotoğraflarım", photos: toPicker(mine) },
    ...friends.map((f) => ({
      title: `${f.profile.displayName} ile ortak albüm · yarışma 🏆`,
      photos: toPicker(shared.filter((p) => p.friendshipId === f.friendshipId)),
    })),
  ].filter((s) => s.photos.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="fotoğraf puzzle"
        title="Bir anı seç"
        description="Zorluğu seç, sonra parçalara ayırmak istediğin fotoğrafa dokun. Ortak albümlerde arkadaşınla rekor yarışı var."
      />

      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">Puzzle için önce birkaç fotoğraf yüklemelisin.</p>
          <Link href="/photos" className={buttonVariants({ size: "lg", className: "rounded-full px-5" })}>
            Fotoğraf yükle
          </Link>
        </div>
      ) : (
        <PuzzlePicker sections={sections} initialSize={parseGridSize(size)} />
      )}
    </>
  );
}
