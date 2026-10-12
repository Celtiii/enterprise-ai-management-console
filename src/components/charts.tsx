import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { fmtNum } from "@/lib/format";

export const C = { blue: "hsl(213 90% 62%)", cyan: "hsl(187 80% 52%)", violet: "hsl(262 75% 68%)", amber: "hsl(38 90% 58%)", red: "hsl(0 75% 60%)", green: "hsl(152 55% 52%)", slate: "hsl(216 14% 50%)" };
const axis = { stroke: "hsl(216 14% 45%)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: "hsl(222 28% 11%)", border: "1px solid hsl(222 20% 20%)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "hsl(214 25% 85%)" } };

type Row = Record<string, string | number>;
export function AreaSeries({ data, keys, height = 220, x = "t", fmt = fmtNum }: { data: Row[]; keys: { key: string; color: string; name?: string }[]; height?: number; x?: string; fmt?: (n: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -10, right: 6, top: 6 }}>
        <defs>{keys.map((k) => <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={k.color} stopOpacity={0.35} /><stop offset="100%" stopColor={k.color} stopOpacity={0} /></linearGradient>)}</defs>
        <CartesianGrid stroke="hsl(222 20% 16%)" vertical={false} />
        <XAxis dataKey={x} {...axis} minTickGap={24} />
        <YAxis {...axis} tickFormatter={(v) => fmt(Number(v))} width={48} />
        <Tooltip {...tip} formatter={(v) => fmt(Number(v))} />
        {keys.map((k) => <Area key={k.key} type="monotone" dataKey={k.key} name={k.name ?? k.key} stroke={k.color} strokeWidth={1.6} fill={`url(#g-${k.key})`} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, keys, height = 220, x = "t", unit = "" }: { data: Row[]; keys: { key: string; color: string; name?: string }[]; height?: number; x?: string; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 6, top: 6 }}>
        <CartesianGrid stroke="hsl(222 20% 16%)" vertical={false} />
        <XAxis dataKey={x} {...axis} minTickGap={24} />
        <YAxis {...axis} width={48} tickFormatter={(v) => `${v}${unit}`} />
        <Tooltip {...tip} formatter={(v) => `${v}${unit}`} />
        {keys.map((k) => <Line key={k.key} type="monotone" dataKey={k.key} name={k.name ?? k.key} stroke={k.color} strokeWidth={1.6} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, k, x, color = C.blue, height = 220, layout = "horizontal" }: { data: Row[]; k: string; x: string; color?: string; height?: number; layout?: "horizontal" | "vertical" }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ left: layout === "vertical" ? 20 : -10, right: 6, top: 6 }}>
        <CartesianGrid stroke="hsl(222 20% 16%)" vertical={layout === "vertical"} horizontal={layout === "horizontal"} />
        {layout === "horizontal" ? <><XAxis dataKey={x} {...axis} /><YAxis {...axis} width={40} tickFormatter={(v) => fmtNum(Number(v))} /></> : <><XAxis type="number" {...axis} /><YAxis type="category" dataKey={x} {...axis} width={110} /></>}
        <Tooltip {...tip} cursor={{ fill: "hsl(222 20% 16% / .5)" }} />
        <Bar dataKey={k} fill={color} radius={layout === "horizontal" ? [3, 3, 0, 0] : [0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, nameKey, valueKey, height = 200 }: { data: Row[]; nameKey: string; valueKey: string; height?: number }) {
  const colors = [C.blue, C.violet, C.cyan, C.amber, C.slate, C.green];
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip {...tip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={String(d[nameKey])} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="flex-1 text-muted-foreground">{d[nameKey]}</span>
            <span className="tabular-nums">{d[valueKey]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
