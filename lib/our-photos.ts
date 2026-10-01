import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "images", "ours");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

/** Photos dropped into public/images/ours, used on the public landing page. */
export async function listOurPhotos(max = 7): Promise<string[]> {
  try {
    const files = await readdir(DIR);
    return files
      .filter((f) => IMAGE_EXT.test(f))
      .sort()
      .slice(0, max)
      .map((f) => `/images/ours/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}
