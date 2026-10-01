import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** WMO weather interpretation codes used by Open-Meteo. */
export function kindFromCode(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

export const WEATHER: Record<WeatherKind, { label: string; icon: LucideIcon; note: string; gradient: string }> = {
  clear: {
    label: "Açık",
    icon: Sun,
    note: "Güneş bile senin kadar parlak değil ☀️",
    gradient: "from-amber-200 via-orange-100 to-rose-100",
  },
  partly: {
    label: "Parçalı bulutlu",
    icon: CloudSun,
    note: "Biraz bulut, bolca sen. Güzel bir gün olacak 🌤️",
    gradient: "from-sky-100 via-rose-50 to-amber-100",
  },
  cloudy: {
    label: "Bulutlu",
    icon: Cloud,
    note: "Hava kapalı ama gülüşün her şeyi aydınlatır ☁️",
    gradient: "from-slate-200 via-rose-50 to-slate-100",
  },
  fog: {
    label: "Sisli",
    icon: CloudFog,
    note: "Sisli bir gün, dikkatli ol olur mu? 🌫️",
    gradient: "from-slate-200 via-slate-100 to-rose-50",
  },
  drizzle: {
    label: "Çiseliyor",
    icon: CloudDrizzle,
    note: "Hafif bir çisenti var, ince bir şey al yanına 🌦️",
    gradient: "from-sky-200 via-slate-100 to-rose-50",
  },
  rain: {
    label: "Yağmurlu",
    icon: CloudRain,
    note: "Şemsiyeni unutma, ıslanmanı istemem ☔",
    gradient: "from-sky-300 via-sky-100 to-rose-50",
  },
  snow: {
    label: "Karlı",
    icon: CloudSnow,
    note: "Kar yağıyor! Sıkı giyin, sıcak bir çikolata hak ettin ❄️",
    gradient: "from-sky-100 via-white to-rose-50",
  },
  storm: {
    label: "Fırtınalı",
    icon: CloudLightning,
    note: "Dışarısı fırtınalı, bugün içeride kalalım mı? ⛈️",
    gradient: "from-slate-400 via-slate-200 to-rose-100",
  },
};

export const NightIcon = Moon;
