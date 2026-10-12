import { useId, useMemo, useState, type PointerEvent } from 'react';

export interface Series {
  key: string;
  label: string;
  values: readonly number[];
  /** CSS color (theme variable). */
  color: string;
  dashed?: boolean;
  width?: number;
}

interface Props {
  title: string;
  x: readonly number[];
  series: readonly Series[];
  /** Optional markers drawn along the top (e.g. errors per second). */
  markers?: { label: string; values: readonly number[]; color: string };
  formatX: (x: number) => string;
  formatTooltipX?: (x: number) => string;
  yLabel: string;
  height?: number;
}

const W = 800;
const PAD = { top: 22, right: 16, bottom: 30, left: 44 };

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];

/** Round axis maximum and step so that ticks land on friendly numbers. */
function niceScale(v: number): { max: number; step: number } {
  const step = STEPS.find((s) => v / s <= 5) ?? 1000;
  return { max: Math.max(step, Math.ceil(v / step) * step), step };
}

/**
 * Dependency-free SVG line chart with a hover crosshair, legend and a
 * screen-reader table. One y-axis only. Kept tiny on purpose.
 */
export function LineChart({ title, x, series, markers, formatX, formatTooltipX = formatX, yLabel, height = 240 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const geom = useMemo(() => {
    const { max: maxY, step } = niceScale(Math.max(10, ...series.flatMap((s) => s.values)));
    const minX = x.length ? x[0] : 0;
    const maxX = x.length ? x[x.length - 1] : 1;
    const spanX = maxX - minX || 1;
    const sx = (v: number) => PAD.left + (x.length === 1 ? innerW / 2 : ((v - minX) / spanX) * innerW);
    const sy = (v: number) => PAD.top + innerH - (Math.min(v, maxY) / maxY) * innerH;
    const paths = series.map((s) =>
      s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(x[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(''),
    );
    const yTicks = Array.from({ length: Math.round(maxY / step) + 1 }, (_, i) => i * step);
    const xTickCount = Math.min(x.length, 8);
    const xTicks =
      xTickCount <= 1
        ? x.slice(0, 1)
        : Array.from({ length: xTickCount }, (_, i) => x[Math.round((i * (x.length - 1)) / (xTickCount - 1))]);
    const seen = new Set<string>();
    const uniqueXTicks = xTicks.filter((t) => {
      const label = formatX(t);
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
    return { sx, sy, paths, yTicks, xTicks: uniqueXTicks };
  }, [x, series, innerW, innerH, formatX]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (x.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < x.length; i++) {
      const d = Math.abs(geom.sx(x[i]) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHover(best);
  };

  if (x.length === 0) {
    return <p className="py-10 text-center text-sm text-sub">Not enough data to draw a chart yet.</p>;
  }

  const hx = hover !== null ? geom.sx(x[hover]) : 0;
  const tooltipLeft = hover !== null ? (hx / W) * 100 : 0;

  return (
    <figure className="relative w-full">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sub">
        <span className="sr-only">{title}. </span>
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <svg width="18" height="6" aria-hidden="true">
              <line x1="1" y1="3" x2="17" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} strokeLinecap="round" />
            </svg>
            {s.label}
          </span>
        ))}
        {markers && markers.values.some((v) => v > 0) && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="font-mono text-[11px] leading-none" style={{ color: markers.color }}>
              ×
            </span>
            {markers.label}
          </span>
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-none select-none overflow-visible"
        role="img"
        aria-label={`${title}. A data table follows.`}
        aria-describedby={tableId}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <g className="text-sub" fontSize="12" fill="currentColor">
          {geom.yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={geom.sy(t)} y2={geom.sy(t)} stroke="var(--tf-line)" strokeWidth="1" />
              <text x={PAD.left - 8} y={geom.sy(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {geom.xTicks.map((t) => (
            <text key={t} x={geom.sx(t)} y={H - 8} textAnchor="middle">
              {formatX(t)}
            </text>
          ))}
          <text x={12} y={PAD.top + innerH / 2} transform={`rotate(-90 12 ${PAD.top + innerH / 2})`} textAnchor="middle">
            {yLabel}
          </text>
        </g>

        {series.map((s, i) => (
          <path
            key={s.key}
            d={geom.paths[i]}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width ?? 2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
          />
        ))}
        {x.length === 1 &&
          series.map((s) => <circle key={s.key} cx={geom.sx(x[0])} cy={geom.sy(s.values[0])} r="4" fill={s.color} />)}

        {markers?.values.map((v, i) =>
          v > 0 ? (
            <text key={i} x={geom.sx(x[i])} y={PAD.top - 6} textAnchor="middle" fontSize="13" fill={markers.color} fontFamily="monospace">
              ×
            </text>
          ) : null,
        )}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--tf-sub)" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.key} cx={hx} cy={geom.sy(s.values[hover])} r="5" fill={s.color} stroke="var(--tf-surface)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 min-w-32 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${tooltipLeft}%`,
            transform: `translateX(${tooltipLeft > 60 ? 'calc(-100% - 12px)' : '12px'})`,
          }}
        >
          <div className="mb-1 text-sub">{formatTooltipX(x[hover])}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-sub">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-mono text-text tabular-nums">{Math.round(s.values[hover])}</span>
            </div>
          ))}
          {markers && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sub">{markers.label}</span>
              <span className="font-mono text-text tabular-nums">{markers.values[hover]}</span>
            </div>
          )}
        </div>
      )}

      <table id={tableId} className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
            {markers && <th scope="col">{markers.label}</th>}
          </tr>
        </thead>
        <tbody>
          {x.map((xv, i) => (
            <tr key={i}>
              <th scope="row">{formatTooltipX(xv)}</th>
              {series.map((s) => (
                <td key={s.key}>{Math.round(s.values[i])}</td>
              ))}
              {markers && <td>{markers.values[i]}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
