import { useMemo } from 'react';
import { activityGrid, practiceByDay } from '../../lib/aggregate';
import type { TestResult } from '../../types';

const WEEKS = 18;
const CELL = 13;
const GAP = 3;
const LEVELS = [0, 0.3, 0.55, 0.8, 1];

function level(tests: number): number {
  if (tests === 0) return 0;
  if (tests < 3) return 1;
  if (tests < 6) return 2;
  if (tests < 10) return 3;
  return 4;
}

export function ActivityHeatmap({ results, now }: { results: readonly TestResult[]; now: number }) {
  const grid = useMemo(() => activityGrid(practiceByDay(results), WEEKS, now), [results, now]);
  const activeDays = grid.flat().filter((c) => c.tests > 0).length;
  const width = WEEKS * (CELL + GAP);
  const height = 7 * (CELL + GAP);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full max-w-[560px]"
        role="img"
        aria-label={`Practice activity for the last ${WEEKS} weeks: ${activeDays} active days.`}
      >
        {grid.map((col, w) =>
          col.map((cell, d) =>
            cell.future ? null : (
              <rect
                key={cell.key}
                x={w * (CELL + GAP)}
                y={d * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx="3"
                fill={cell.tests ? 'var(--tf-accent)' : 'var(--tf-surface-2)'}
                fillOpacity={cell.tests ? LEVELS[level(cell.tests)] : 1}
              >
                <title>{`${cell.key}: ${cell.tests} test${cell.tests === 1 ? '' : 's'}`}</title>
              </rect>
            ),
          ),
        )}
      </svg>
      <figcaption className="mt-2 flex items-center gap-1.5 text-xs text-sub">
        less
        {LEVELS.map((o, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{ background: i === 0 ? 'var(--tf-surface-2)' : 'var(--tf-accent)', opacity: i === 0 ? 1 : o }}
          />
        ))}
        more
      </figcaption>
    </figure>
  );
}
