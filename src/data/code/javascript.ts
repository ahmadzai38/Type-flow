import type { CodeSnippet } from './types';

/** 47 original javascript snippets. Indentation is auto-filled while typing. */
export const JAVASCRIPT_SNIPPETS: readonly CodeSnippet[] = [
  {
    title: "Debounce",
    code: `function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}`,
  },
  {
    title: "Group by",
    code: `const groupBy = (items, key) =>
  items.reduce((acc, item) => {
    (acc[item[key]] ||= []).push(item);
    return acc;
  }, {});`,
  },
  {
    title: "Fetch JSON",
    code: `async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`,
  },
  {
    title: "Clamp",
    code: `export const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

console.log(clamp(42, 0, 10)); // 10`,
  },
  {
    title: "Throttle",
    code: `function throttle(fn, interval) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn(...args);
    }
  };
}`,
  },
  {
    title: "Array methods",
    code: `const orders = [
  { id: 1, total: 40, paid: true },
  { id: 2, total: 15, paid: false },
  { id: 3, total: 60, paid: true },
];
const revenue = orders
  .filter((o) => o.paid)
  .map((o) => o.total)
  .reduce((sum, t) => sum + t, 0);`,
  },
  {
    title: "Counter closure",
    code: `function createCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}`,
  },
  {
    title: "Class with getter",
    code: `class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  get area() {
    return this.width * this.height;
  }
}

console.log(new Rectangle(3, 4).area);`,
  },
  {
    title: "Unique values",
    code: `const tags = ["js", "css", "js", "html", "css"];
const unique = [...new Set(tags)];
const counts = tags.reduce((map, tag) => map.set(tag, (map.get(tag) ?? 0) + 1), new Map());
console.log(unique, Object.fromEntries(counts));`,
  },
  {
    title: "Event listener",
    code: `const button = document.querySelector("#save");
button.addEventListener("click", (event) => {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Saved";
});`,
  },
  {
    title: "Promise all",
    code: `async function loadDashboard() {
  const [user, posts] = await Promise.all([
    fetch("/api/user").then((r) => r.json()),
    fetch("/api/posts").then((r) => r.json()),
  ]);
  return { user, posts };
}`,
  },
  {
    title: "Destructuring",
    code: `const settings = { theme: "dark", fontSize: 16, sound: false };
const { theme, fontSize: size = 14, ...rest } = settings;
const [first, , third] = ["a", "b", "c"];
console.log(theme, size, rest, first, third);`,
  },
  {
    title: "Deep clone",
    code: `function deepClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepClone);
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, deepClone(v)]),
  );
}`,
  },
  {
    title: "Sleep helper",
    code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function countdown(from) {
  for (let i = from; i > 0; i--) {
    console.log(i);
    await sleep(1000);
  }
}`,
  },
  {
    title: "Capitalize words",
    code: `function titleCase(sentence) {
  return sentence
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

console.log(titleCase("hello wORLD from js"));`,
  },
  {
    title: "Local storage",
    code: `function saveNote(id, text) {
  const notes = JSON.parse(localStorage.getItem("notes") ?? "{}");
  notes[id] = { text, updated: Date.now() };
  localStorage.setItem("notes", JSON.stringify(notes));
}`,
  },
  {
    title: "Chunk array",
    code: `function chunk(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}`,
  },
  {
    title: "Try catch finally",
    code: `async function submitForm(data) {
  try {
    const res = await fetch("/api/form", { method: "POST", body: JSON.stringify(data) });
    return await res.json();
  } catch (error) {
    console.error("submit failed:", error.message);
    return null;
  } finally {
    console.log("request finished");
  }
}`,
  },
  {
    title: "Event emitter",
    code: `class Emitter {
  #handlers = new Map();

  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(fn);
  }

  emit(event, payload) {
    for (const fn of this.#handlers.get(event) ?? []) fn(payload);
  }
}`,
  },
  {
    title: "Optional chaining",
    code: `const user = { profile: { address: { city: "Queens" } } };
const city = user.profile?.address?.city ?? "unknown";
const zip = user.profile?.address?.zip ?? "n/a";
const callback = user.onLogin?.();
console.log(city, zip, callback);`,
  },
  {
    title: "Memoize",
    code: `function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}

const slowSquare = (n) => n * n;
const fastSquare = memoize(slowSquare);`,
  },
  {
    title: "Fizz buzz",
    code: `for (let n = 1; n <= 30; n++) {
  let out = "";
  if (n % 3 === 0) out += "Fizz";
  if (n % 5 === 0) out += "Buzz";
  console.log(out || n);
}`,
  },
  {
    title: "Sort by key",
    code: `const people = [
  { name: "Zoe", age: 31 },
  { name: "Adam", age: 25 },
  { name: "Mia", age: 28 },
];
const byAge = [...people].sort((a, b) => a.age - b.age);
const byName = [...people].sort((a, b) => a.name.localeCompare(b.name));`,
  },
  {
    title: "Range generator",
    code: `function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

console.log([...range(0, 10, 2)]);`,
  },
  {
    title: "Create element",
    code: `function renderList(items) {
  const list = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  }
  document.body.append(list);
}`,
  },
  {
    title: "Format currency",
    code: `const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

console.log(formatter.format(1234.5)); // $1,234.50`,
  },
  {
    title: "Reverse string",
    code: `const reverse = (text) => [...text].reverse().join("");
const isPalindrome = (text) => {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === reverse(clean);
};
console.log(isPalindrome("Never odd or even"));`,
  },
  {
    title: "Object entries",
    code: `const stock = { apples: 12, pears: 0, plums: 7 };
for (const [fruit, qty] of Object.entries(stock)) {
  if (qty === 0) {
    console.log(\`\${fruit} is sold out\`);
  }
}`,
  },
  {
    title: "Retry with backoff",
    code: `async function retry(task, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await task();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 2 ** i * 200));
    }
  }
}`,
  },
  {
    title: "Shuffle array",
    code: `function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}`,
  },
  {
    title: "Express route",
    code: `import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.listen(3000);`,
  },
  {
    title: "Todo reducer",
    code: `function todoReducer(state, action) {
  switch (action.type) {
    case "add":
      return [...state, { id: Date.now(), text: action.text, done: false }];
    case "toggle":
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    default:
      return state;
  }
}`,
  },
  {
    title: "Flatten nested",
    code: `const nested = [1, [2, [3, [4]]], 5];
const flat = nested.flat(Infinity);
const doubled = [[1, 2], [3]].flatMap((pair) => pair.map((n) => n * 2));
console.log(flat, doubled);`,
  },
  {
    title: "Query string",
    code: `function toQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => \`\${encodeURIComponent(key)}=\${encodeURIComponent(value)}\`)
    .join("&");
}`,
  },
  {
    title: "Stack class",
    code: `class Stack {
  #items = [];

  push(item) {
    this.#items.push(item);
    return this;
  }

  pop() {
    return this.#items.pop();
  }

  get size() {
    return this.#items.length;
  }
}`,
  },
  {
    title: "Date difference",
    code: `function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(a);
  const end = new Date(b);
  return Math.round((end - start) / msPerDay);
}

console.log(daysBetween("2026-01-01", "2026-12-31"));`,
  },
  {
    title: "Array includes",
    code: `const allowed = ["admin", "editor"];
function canEdit(user) {
  return user.roles.some((role) => allowed.includes(role));
}

console.log(canEdit({ roles: ["viewer", "editor"] }));`,
  },
  {
    title: "Binary search",
    code: `function binarySearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
  },
  {
    title: "Intersection observer",
    code: `const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }
});
document.querySelectorAll(".fade").forEach((el) => observer.observe(el));`,
  },
  {
    title: "Pick and omit",
    code: `const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));`,
  },
  {
    title: "Word count",
    code: `function wordCount(text) {
  const words = text.trim().split(/ +/).filter(Boolean);
  return words.length;
}

console.log(wordCount("  practice   makes progress  "));`,
  },
  {
    title: "Async iteration",
    code: `async function* pages(url) {
  let next = url;
  while (next) {
    const res = await fetch(next);
    const data = await res.json();
    yield data.items;
    next = data.nextPage;
  }
}`,
  },
  {
    title: "Form validation",
    code: `function validate({ email, password }) {
  const errors = {};
  if (!email.includes("@")) errors.email = "Enter a valid email";
  if (password.length < 8) errors.password = "Use at least 8 characters";
  return { valid: Object.keys(errors).length === 0, errors };
}`,
  },
  {
    title: "Max by",
    code: `function maxBy(items, score) {
  let best = items[0];
  for (const item of items.slice(1)) {
    if (score(item) > score(best)) best = item;
  }
  return best;
}

console.log(maxBy(["kiwi", "banana", "fig"], (s) => s.length));`,
  },
  {
    title: "Timer class",
    code: `class Stopwatch {
  start() {
    this.startedAt = performance.now();
  }

  stop() {
    const ms = performance.now() - this.startedAt;
    return \`\${(ms / 1000).toFixed(2)}s\`;
  }
}`,
  },
  {
    title: "Template literal",
    code: `const product = { name: "Keyboard", price: 79.99, qty: 2 };
const line = \`\${product.qty} x \${product.name} = $\${(product.price * product.qty).toFixed(2)}\`;
console.log(line);`,
  },
  {
    title: "Zip arrays",
    code: `const zip = (...arrays) =>
  Array.from({ length: Math.min(...arrays.map((a) => a.length)) }, (_, i) =>
    arrays.map((a) => a[i]),
  );

console.log(zip([1, 2, 3], ["a", "b", "c"]));`,
  },
];
