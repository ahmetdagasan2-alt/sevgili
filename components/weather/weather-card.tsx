"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Loader2, MapPin, Umbrella, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { kindFromCode, NightIcon, WEATHER, type WeatherKind } from "./weather-codes";

const FALLBACK = { latitude: 41.0082, longitude: 28.9784, city: "İstanbul" };

type Forecast = {
  city: string;
  approximate: boolean;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  isDay: boolean;
  kind: WeatherKind;
  daily: { date: string; max: number; min: number; kind: WeatherKind; rain: number }[];
};

function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

async function cityName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`,
    );
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

async function loadForecast(): Promise<Forecast> {
  const pos = await getPosition();
  const { latitude, longitude } = pos ?? FALLBACK;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "4",
  });
  const [res, city] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
    pos ? cityName(latitude, longitude) : Promise.resolve(FALLBACK.city),
  ]);
  if (!res.ok) throw new Error("weather");
  const d = await res.json();
  return {
    city: city ?? "Bulunduğun yer",
    approximate: !pos,
    temp: Math.round(d.current.temperature_2m),
    feelsLike: Math.round(d.current.apparent_temperature),
    humidity: d.current.relative_humidity_2m,
    wind: Math.round(d.current.wind_speed_10m),
    isDay: d.current.is_day === 1,
    kind: kindFromCode(d.current.weather_code),
    daily: d.daily.time.map((date: string, i: number) => ({
      date,
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
      kind: kindFromCode(d.daily.weather_code[i]),
      rain: d.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
}

export function WeatherCard({ className }: { className?: string }) {
  const [data, setData] = useState<Forecast | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadForecast()
      .then((f) => !cancelled && setData(f))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className={cn("rounded-3xl border border-border bg-card p-6 text-muted-foreground", className)}>
        Hava durumu şu an alınamadı. Biraz sonra tekrar dene 🌈
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("flex min-h-64 items-center justify-center rounded-3xl border border-border bg-card", className)}>
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const info = WEATHER[data.kind];
  const Icon = data.kind === "clear" && !data.isDay ? NightIcon : info.icon;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-linear-to-br p-6 shadow-sm", info.gradient, className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-rose-ink/80">
            <MapPin className="size-3.5" /> {data.city}
            {data.approximate ? <span className="opacity-60">(konum izni yok)</span> : null}
          </p>
          <p className="mt-2 font-heading text-6xl font-semibold tracking-tight text-rose-ink">{data.temp}°</p>
          <p className="text-rose-ink/80">
            {info.label} · hissedilen {data.feelsLike}°
          </p>
        </div>
        <AnimatedIcon kind={data.kind}>
          <Icon className="size-20 text-rose-ink/80" strokeWidth={1.4} />
        </AnimatedIcon>
      </div>

      <p className="mt-4 font-hand text-2xl leading-snug text-rose-ink">{info.note}</p>

      <div className="mt-4 flex gap-4 text-sm text-rose-ink/80">
        <span className="flex items-center gap-1">
          <Droplets className="size-4" /> %{data.humidity}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="size-4" /> {data.wind} km/s
        </span>
        <span className="flex items-center gap-1">
          <Umbrella className="size-4" /> %{data.daily[0]?.rain ?? 0}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {data.daily.map((day, i) => {
          const DayIcon = WEATHER[day.kind].icon;
          return (
            <div key={day.date} className="flex flex-col items-center gap-1 rounded-2xl bg-white/55 py-3 text-rose-ink">
              <span className="text-xs font-semibold">
                {i === 0 ? "Bugün" : new Date(`${day.date}T12:00`).toLocaleDateString("tr-TR", { weekday: "short" })}
              </span>
              <DayIcon className="size-5" />
              <span className="text-xs tabular-nums">
                {day.max}° <span className="opacity-60">{day.min}°</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedIcon({ kind, children }: { kind: WeatherKind; children: React.ReactNode }) {
  const animation =
    kind === "clear"
      ? { rotate: [0, 12, 0, -12, 0] }
      : kind === "rain" || kind === "drizzle" || kind === "storm"
        ? { y: [0, 4, 0] }
        : { x: [0, 6, 0, -6, 0] };
  return (
    <motion.div animate={animation} transition={{ duration: kind === "clear" ? 8 : 4, repeat: Infinity, ease: "easeInOut" }}>
      {children}
    </motion.div>
  );
}
