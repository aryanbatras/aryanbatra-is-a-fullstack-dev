"use client";

import { useEffect, useState } from "react";

/** Real current weather from open-meteo (free, no API key). Jammu coords. */
const WEATHER_LAT = 32.7266;
const WEATHER_LON = 74.857;

export interface LiveWeather {
  temp: number;
  code: number;
  place: string;
}

export const WEATHER_DESC: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫️" },
  48: { label: "Foggy", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌧️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "🌨️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  80: { label: "Rain showers", emoji: "🌦️" },
  81: { label: "Rain showers", emoji: "🌧️" },
  82: { label: "Violent showers", emoji: "⛈️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm", emoji: "⛈️" },
  99: { label: "Thunderstorm", emoji: "⛈️" },
};

/**
 * Real current conditions for Jammu via the open-meteo API (no key needed,
 * CORS-friendly). Returns `{ w, failed }` — `w` is null until the first
 * response arrives, and `failed` is true when the device is offline or the
 * request errored, so widgets can show an honest "—" instead of inventing
 * a temperature.
 */
export default function useLiveWeather() {
  const [w, setW] = useState<LiveWeather | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
        `&current=temperature_2m,weather_code&timezone=auto`;
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          if (cancelled) return;
          const c = d?.current;
          if (c && typeof c.temperature_2m === "number") {
            setW({
              temp: Math.round(c.temperature_2m),
              code: c.weather_code ?? 0,
              place: "Jammu",
            });
            setFailed(false);
          } else {
            setFailed(true);
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };
    load();
    const id = window.setInterval(load, 30 * 60 * 1000); // refresh every 30 min
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { w, failed };
}
