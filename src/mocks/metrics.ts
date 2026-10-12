import type { Environment, TimeRange } from "@/types";

/** Deterministic pseudo-random generator so simulated charts are stable per env/range. */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const envScale: Record<Environment, number> = { production: 1, staging: 0.22, development: 0.06 };
const envSeed: Record<Environment, number> = { production: 11, staging: 23, development: 37 };
const rangeCfg: Record<TimeRange, { points: number; stepMin: number; label: (d: Date) => string }> = {
  "1h": { points: 30, stepMin: 2, label: (d) => d.toTimeString().slice(0, 5) },
  "24h": { points: 24, stepMin: 60, label: (d) => `${String(d.getHours()).padStart(2, "0")}:00` },
  "7d": { points: 28, stepMin: 360, label: (d) => d.toLocaleDateString(undefined, { weekday: "short", hour: "2-digit" }) },
  "30d": { points: 30, stepMin: 1440, label: (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
};

export interface SeriesPoint { t: string; requests: number; errors: number; latencyP50: number; latencyP95: number; tokens: number; gpu: number; vram: number; cpu: number; ram: number }

export function timeSeries(env: Environment, range: TimeRange): SeriesPoint[] {
  const cfg = rangeCfg[range];
  const rnd = seeded(envSeed[env] * 100 + cfg.points);
  const scale = envScale[env];
  const now = Date.now();
  return Array.from({ length: cfg.points }, (_, i) => {
    const d = new Date(now - (cfg.points - 1 - i) * cfg.stepMin * 60_000);
    const diurnal = 0.6 + 0.4 * Math.sin(((d.getHours() - 6) / 24) * Math.PI * 2);
    const base = (range === "1h" ? 900 : range === "24h" ? 26000 : range === "7d" ? 160000 : 620000) * scale;
    const req = Math.round(base * diurnal * (0.85 + rnd() * 0.3));
    const errRate = 0.004 + rnd() * 0.01 + (i === Math.floor(cfg.points * 0.7) ? 0.03 : 0);
    return {
      t: cfg.label(d),
      requests: req,
      errors: Math.round(req * errRate),
      latencyP50: Math.round(320 + rnd() * 120 + diurnal * 80),
      latencyP95: Math.round(980 + rnd() * 500 + diurnal * 300),
      tokens: Math.round(req * (380 + rnd() * 120)),
      gpu: Math.round(Math.min(98, (45 + diurnal * 40 + rnd() * 8) * (env === "production" ? 1 : 0.5))),
      vram: Math.round(Math.min(96, 62 + rnd() * 10 + (env === "production" ? 18 : 0))),
      cpu: Math.round(30 + diurnal * 25 + rnd() * 10),
      ram: Math.round(48 + rnd() * 12),
    };
  });
}

export function latencyHistogram(env: Environment) {
  const rnd = seeded(envSeed[env] + 5);
  const buckets = ["<100", "100-250", "250-500", "500-1k", "1-2k", "2-5k", ">5k"];
  const shape = [4, 18, 34, 26, 12, 5, 1];
  return buckets.map((b, i) => ({ bucket: b + " ms", count: Math.round(shape[i] * 120 * envScale[env] * (0.8 + rnd() * 0.4)) }));
}

export function modelUsage(env: Environment) {
  const rnd = seeded(envSeed[env] + 9);
  const rows = [
    { model: "Qwen3-8B", share: 46 }, { model: "Qwen3-Coder-30B", share: 24 }, { model: "BGE-M3 (embed)", share: 18 }, { model: "Qwen3-0.6B", share: 9 }, { model: "Other", share: 3 },
  ];
  return rows.map((r) => ({ ...r, share: Math.max(1, Math.round(r.share * (0.8 + rnd() * 0.4))) }));
}

export function sumBy<T>(arr: T[], f: (x: T) => number) { return arr.reduce((a, x) => a + f(x), 0); }

export const envScaleFactor = envScale;
