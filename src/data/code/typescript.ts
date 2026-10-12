import type { CodeSnippet } from './types';

/** 44 original typescript snippets. Indentation is auto-filled while typing. */
export const TYPESCRIPT_SNIPPETS: readonly CodeSnippet[] = [
  {
    title: "Result type",
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
    title: "Interface",
    code: `interface User {
  id: number;
  name: string;
  email?: string;
}

const users: User[] = [{ id: 1, name: "Ada" }];`,
  },
  {
    title: "Generic cache",
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
    title: "Sum with reduce",
    code: `const total = (values: number[]): number =>
  values.reduce((sum, v) => sum + v, 0);`,
  },
  {
    title: "Enum",
    code: `enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

function opposite(d: Direction): Direction {
  const map = { UP: Direction.Down, DOWN: Direction.Up, LEFT: Direction.Right, RIGHT: Direction.Left };
  return map[d];
}`,
  },
  {
    title: "Discriminated union",
    code: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
  }
}`,
  },
  {
    title: "Partial update",
    code: `interface Settings {
  theme: "light" | "dark";
  fontSize: number;
  sound: boolean;
}

function update(current: Settings, patch: Partial<Settings>): Settings {
  return { ...current, ...patch };
}`,
  },
  {
    title: "Generic identity",
    code: `function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const n = first([3, 1, 2]);
const s = first(["a", "b"]);`,
  },
  {
    title: "Type guard",
    code: `interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(pet: Cat | Dog): pet is Cat {
  return "meow" in pet;
}

function speak(pet: Cat | Dog) {
  if (isCat(pet)) pet.meow();
  else pet.bark();
}`,
  },
  {
    title: "Record type",
    code: `type Role = "admin" | "editor" | "viewer";

const permissions: Record<Role, string[]> = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};`,
  },
  {
    title: "Readonly tuple",
    code: `const point = [10, 20] as const;
type Point = typeof point;

function translate([x, y]: readonly [number, number], dx: number): [number, number] {
  return [x + dx, y];
}`,
  },
  {
    title: "Async typed fetch",
    code: `interface Post {
  id: number;
  title: string;
}

async function getPosts(): Promise<Post[]> {
  const res = await fetch("/api/posts");
  if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
  return (await res.json()) as Post[];
}`,
  },
  {
    title: "Pick and Omit",
    code: `interface Account {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicAccount = Omit<Account, "password">;
type Login = Pick<Account, "email" | "password">;`,
  },
  {
    title: "Abstract class",
    code: `abstract class Employee {
  constructor(public readonly name: string) {}

  abstract monthlyPay(): number;

  describe(): string {
    return \`\${this.name} earns \${this.monthlyPay()} per month\`;
  }
}

class Salaried extends Employee {
  constructor(name: string, private salary: number) {
    super(name);
  }

  monthlyPay(): number {
    return this.salary / 12;
  }
}`,
  },
  {
    title: "Keyof lookup",
    code: `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const car = { make: "Honda", year: 2020 };
const year: number = getProp(car, "year");`,
  },
  {
    title: "Stack generic",
    code: `class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
}`,
  },
  {
    title: "Utility function types",
    code: `function logCall<A extends unknown[], R>(fn: (...args: A) => R) {
  return (...args: A): R => {
    console.log("calling with", args);
    return fn(...args);
  };
}

const add = logCall((a: number, b: number) => a + b);`,
  },
  {
    title: "Mapped type",
    code: `type Flags<T> = {
  [K in keyof T]: boolean;
};

interface Features {
  darkMode: string;
  beta: number;
}

const enabled: Flags<Features> = { darkMode: true, beta: false };`,
  },
  {
    title: "Satisfies",
    code: `type Color = "red" | "green" | "blue";

const palette = {
  primary: "blue",
  danger: "red",
} satisfies Record<string, Color>;

const primary: Color = palette.primary;`,
  },
  {
    title: "Event map",
    code: `interface Events {
  login: { userId: string };
  logout: undefined;
}

function emit<E extends keyof Events>(event: E, payload: Events[E]): void {
  console.log(event, payload);
}

emit("login", { userId: "42" });`,
  },
  {
    title: "Never exhaustive",
    code: `type Status = "idle" | "loading" | "done";

function label(status: Status): string {
  switch (status) {
    case "idle":
      return "Waiting";
    case "loading":
      return "Loading...";
    case "done":
      return "Finished";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}`,
  },
  {
    title: "Optional params",
    code: `function greet(name: string, greeting = "Hello", punctuation?: string): string {
  return \`\${greeting}, \${name}\${punctuation ?? "!"}\`;
}

console.log(greet("Sam"));
console.log(greet("Lee", "Welcome", "."));`,
  },
  {
    title: "Class implements",
    code: `interface Shape {
  area(): number;
  perimeter(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}`,
  },
  {
    title: "Debounce typed",
    code: `function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}`,
  },
  {
    title: "Group by key",
    code: `function groupBy<T, K extends PropertyKey>(items: T[], getKey: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = getKey(item);
    (out[key] ??= []).push(item);
  }
  return out;
}`,
  },
  {
    title: "Unknown narrowing",
    code: `function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

try {
  JSON.parse("{oops");
} catch (e) {
  console.log(toMessage(e));
}`,
  },
  {
    title: "Template literal types",
    code: `type Size = "sm" | "md" | "lg";
type Side = "top" | "bottom";
type Spacing = \`margin-\${Side}-\${Size}\`;

const value: Spacing = "margin-top-md";`,
  },
  {
    title: "Readonly config",
    code: `interface Config {
  readonly apiUrl: string;
  readonly retries: number;
}

const config: Config = Object.freeze({
  apiUrl: "https://example.com/api",
  retries: 3,
});`,
  },
  {
    title: "Linked list",
    code: `class ListNode<T> {
  constructor(
    public value: T,
    public next: ListNode<T> | null = null,
  ) {}
}

function toArray<T>(head: ListNode<T> | null): T[] {
  const out: T[] = [];
  for (let node = head; node; node = node.next) out.push(node.value);
  return out;
}`,
  },
  {
    title: "Async queue",
    code: `async function runInOrder<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}`,
  },
  {
    title: "Function overloads",
    code: `function format(value: number): string;
function format(value: Date): string;
function format(value: number | Date): string {
  return typeof value === "number"
    ? value.toFixed(2)
    : value.toISOString().slice(0, 10);
}`,
  },
  {
    title: "Indexed access",
    code: `type ApiResponse = {
  data: { users: { id: number; name: string }[] };
  meta: { page: number };
};

type UserItem = ApiResponse["data"]["users"][number];
const u: UserItem = { id: 1, name: "Kim" };`,
  },
  {
    title: "Tuple return",
    code: `function useToggle(initial = false): [boolean, () => void] {
  let state = initial;
  const toggle = () => {
    state = !state;
  };
  return [state, toggle];
}

const [isOpen, toggleOpen] = useToggle();`,
  },
  {
    title: "Map with types",
    code: `const scores = new Map<string, number>();
scores.set("ana", 91);
scores.set("raj", 84);

for (const [name, score] of scores) {
  console.log(\`\${name}: \${score >= 90 ? "A" : "B"}\`);
}`,
  },
  {
    title: "Non-null and optional",
    code: `interface Order {
  id: number;
  coupon?: { code: string; percent: number };
}

function discount(order: Order, price: number): number {
  const percent = order.coupon?.percent ?? 0;
  return price * (1 - percent / 100);
}`,
  },
  {
    title: "Generic constraint",
    code: `interface HasId {
  id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

const task = findById([{ id: 1, title: "Write tests" }], 1);`,
  },
  {
    title: "Return type helper",
    code: `function createUser(name: string, admin = false) {
  return { name, admin, createdAt: new Date() };
}

type NewUser = ReturnType<typeof createUser>;
const guest: NewUser = createUser("guest");`,
  },
  {
    title: "Static members",
    code: `class IdGenerator {
  private static next = 1;

  static create(prefix: string): string {
    return \`\${prefix}-\${IdGenerator.next++}\`;
  }
}

console.log(IdGenerator.create("task"));`,
  },
  {
    title: "Validate input",
    code: `type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface SignUp {
  email: string;
  password: string;
}

function validate(form: SignUp): FieldErrors<SignUp> {
  const errors: FieldErrors<SignUp> = {};
  if (!form.email.includes("@")) errors.email = "Invalid email";
  if (form.password.length < 8) errors.password = "Too short";
  return errors;
}`,
  },
  {
    title: "Promise timeout",
    code: `function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(\`Timed out after \${ms}ms\`)), ms),
  );
  return Promise.race([promise, timeout]);
}`,
  },
  {
    title: "Getters and setters",
    code: `class Temperature {
  private celsius = 0;

  get fahrenheit(): number {
    return this.celsius * 1.8 + 32;
  }

  set fahrenheit(value: number) {
    this.celsius = (value - 32) / 1.8;
  }
}`,
  },
  {
    title: "Array of objects",
    code: `interface Product {
  name: string;
  price: number;
  inStock: boolean;
}

const cheapest = (products: Product[]): Product | undefined =>
  products
    .filter((p) => p.inStock)
    .sort((a, b) => a.price - b.price)[0];`,
  },
  {
    title: "Event handler types",
    code: `const input = document.querySelector<HTMLInputElement>("#search");

input?.addEventListener("input", (event: Event) => {
  const target = event.target as HTMLInputElement;
  console.log(target.value.trim());
});`,
  },
  {
    title: "Required type",
    code: `interface Draft {
  title?: string;
  body?: string;
}

function publish(post: Required<Draft>): string {
  return \`\${post.title}: \${post.body.length} characters\`;
}

publish({ title: "Hello", body: "First post" });`,
  },
];
