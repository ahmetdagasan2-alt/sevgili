export const CATEGORIES = {
  evde: { label: "Evde", emoji: "🏠" },
  disarida: { label: "Dışarıda", emoji: "🌳" },
  yemek: { label: "Yemek", emoji: "🍝" },
  macera: { label: "Macera", emoji: "✈️" },
  diger: { label: "Diğer", emoji: "💫" },
} as const;

export type Category = keyof typeof CATEGORIES;

export function parseCategory(value: unknown): Category {
  return typeof value === "string" && value in CATEGORIES ? (value as Category) : "diger";
}

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  done: boolean;
  done_at: string | null;
  created_at: string;
};

export const STARTER_IDEAS: { title: string; description: string; category: Category }[] = [
  { title: "Film gecesi", description: "Battaniye, patlamış mısır ve sırayla seçilen filmler", category: "evde" },
  { title: "Birlikte yemek yapmak", description: "İkimizin de hiç denemediği bir tarif", category: "yemek" },
  { title: "Gün batımında piknik", description: "Sevdiğimiz atıştırmalıklar ve güzel bir manzara", category: "disarida" },
  { title: "Yıldızları izlemek", description: "Şehir ışıklarından uzakta bir gece", category: "disarida" },
  { title: "Bir günlük kaçamak", description: "Daha önce gitmediğimiz yakın bir kasaba", category: "macera" },
  { title: "Birbirimize mektup yazmak", description: "Bir yıl sonra açmak üzere", category: "evde" },
  { title: "Kahvaltıya gitmek", description: "Uzun, acelesiz bir pazar kahvaltısı", category: "yemek" },
  { title: "Birlikte puzzle bitirmek", description: "Sitedeki puzzle'larda rekor kırmak dahil 😄", category: "evde" },
];
