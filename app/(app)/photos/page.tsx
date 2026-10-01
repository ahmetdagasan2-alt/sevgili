import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { PhotoUploader } from "@/components/gallery/photo-uploader";
import { PageHeader } from "@/components/page-header";
import { listPhotos } from "@/lib/photos";
import { requireUser } from "@/lib/session";

export default async function PhotosPage() {
  const user = await requireUser("/photos");
  const photos = await listPhotos(user.id);

  return (
    <>
      <PageHeader
        eyebrow="anılarımız"
        title="Fotoğraflarımız"
        description="Birlikte biriktirdiğimiz anlar. Bir fotoğrafa tıkla, büyüt ya da onunla puzzle yap."
      />
      <PhotoUploader />
      <div className="mt-10">
        {photos.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Henüz fotoğraf yok. İlk anımızı ekleyerek başla 📸
          </p>
        ) : (
          <PhotoGallery photos={photos} editable />
        )}
      </div>
    </>
  );
}
