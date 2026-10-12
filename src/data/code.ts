import type { CodeLanguage } from '../types';

export interface CodeSnippet {
  title: string;
  code: string;
}

/** Short, original snippets. Indentation is auto-filled after each newline. */
export const CODE_SNIPPETS: Record<CodeLanguage, readonly CodeSnippet[]> = {
  python: [
    {
      title: 'Word frequency',
      code: `def word_counts(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts`,
    },
    {
      title: 'Binary search',
      code: `def binary_search(items, target):
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    },
    {
      title: 'Dataclass',
      code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def distance(self, other: "Point") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5`,
    },
    {
      title: 'Read lines',
      code: `with open("notes.txt", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]
print(f"{len(lines)} lines read")`,
    },
  ],
  javascript: [
    {
      title: 'Debounce',
      code: `function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}`,
    },
    {
      title: 'Group by',
      code: `const groupBy = (items, key) =>
  items.reduce((acc, item) => {
    (acc[item[key]] ||= []).push(item);
    return acc;
  }, {});`,
    },
    {
      title: 'Fetch JSON',
      code: `async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`,
    },
    {
      title: 'Clamp',
      code: `export const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

console.log(clamp(42, 0, 10)); // 10`,
    },
  ],
  typescript: [
    {
      title: 'Result type',
      code: `type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function parseAge(input: string): Result<number> {
  const n = Number(input);
  return Number.isInteger(n) && n >= 0
    ? { ok: true, value: n }
    : { ok: false, error: "invalid age" };
}`,
    },
    {
      title: 'Interface',
      code: `interface User {
  id: number;
  name: string;
  email?: string;
}

const users: User[] = [{ id: 1, name: "Ada" }];`,
    },
    {
      title: 'Generic cache',
      code: `class Cache<K, V> {
  private store = new Map<K, V>();

  get(key: K): V | undefined {
    return this.store.get(key);
  }

  set(key: K, value: V): void {
    this.store.set(key, value);
  }
}`,
    },
    {
      title: 'Sum with reduce',
      code: `const total = (values: number[]): number =>
  values.reduce((sum, v) => sum + v, 0);`,
    },
  ],
};
