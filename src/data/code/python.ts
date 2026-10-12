import type { CodeSnippet } from './types';

/** 53 original python snippets. Indentation is auto-filled while typing. */
export const PYTHON_SNIPPETS: readonly CodeSnippet[] = [
  {
    title: "Word frequency",
    code: `def word_counts(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts`,
  },
  {
    title: "Binary search",
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
    title: "Dataclass",
    code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def distance(self, other: "Point") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5`,
  },
  {
    title: "Read lines",
    code: `with open("notes.txt", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]
print(f"{len(lines)} lines read")`,
  },
  {
    title: "FizzBuzz",
    code: `for n in range(1, 31):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)`,
  },
  {
    title: "Fibonacci generator",
    code: `def fibonacci(limit):
    a, b = 0, 1
    while a < limit:
        yield a
        a, b = b, a + b

print(list(fibonacci(100)))`,
  },
  {
    title: "Palindrome check",
    code: `def is_palindrome(text: str) -> bool:
    cleaned = [c.lower() for c in text if c.isalnum()]
    return cleaned == cleaned[::-1]

print(is_palindrome("A man, a plan, a canal: Panama"))`,
  },
  {
    title: "Stack class",
    code: `class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def __len__(self):
        return len(self._items)`,
  },
  {
    title: "Timer decorator",
    code: `import time
from functools import wraps

def timed(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper`,
  },
  {
    title: "Merge sort",
    code: `def merge_sort(values):
    if len(values) <= 1:
        return values
    mid = len(values) // 2
    left = merge_sort(values[:mid])
    right = merge_sort(values[mid:])
    merged = []
    while left and right:
        merged.append(left.pop(0) if left[0] <= right[0] else right.pop(0))
    return merged + left + right`,
  },
  {
    title: "Counter top words",
    code: `from collections import Counter

def top_words(text, n=3):
    words = text.lower().split()
    return Counter(words).most_common(n)

print(top_words("the cat and the hat and the bat"))`,
  },
  {
    title: "Dictionary comprehension",
    code: `prices = {"apple": 1.20, "bread": 2.50, "milk": 0.99}
discounted = {item: round(price * 0.9, 2) for item, price in prices.items()}
expensive = [item for item, price in prices.items() if price > 1]
print(discounted, expensive)`,
  },
  {
    title: "Context manager",
    code: `from contextlib import contextmanager

@contextmanager
def opened(path, mode="r"):
    handle = open(path, mode, encoding="utf-8")
    try:
        yield handle
    finally:
        handle.close()`,
  },
  {
    title: "Bank account",
    code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        return self.balance`,
  },
  {
    title: "JSON round trip",
    code: `import json

profile = {"name": "Sam", "skills": ["python", "sql"], "active": True}
text = json.dumps(profile, indent=2)
loaded = json.loads(text)
assert loaded == profile`,
  },
  {
    title: "Flatten a list",
    code: `def flatten(nested):
    result = []
    for item in nested:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

print(flatten([1, [2, [3, 4]], 5]))`,
  },
  {
    title: "Prime sieve",
    code: `def primes_up_to(n):
    is_prime = [True] * (n + 1)
    is_prime[0:2] = [False, False]
    for i in range(2, int(n ** 0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False
    return [i for i, p in enumerate(is_prime) if p]`,
  },
  {
    title: "Enumerate and zip",
    code: `names = ["Ada", "Grace", "Linus"]
scores = [92, 88, 95]
for rank, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"{rank}. {name}: {score}")`,
  },
  {
    title: "Default dict grouping",
    code: `from collections import defaultdict

def group_by_length(words):
    groups = defaultdict(list)
    for word in words:
        groups[len(word)].append(word)
    return dict(groups)`,
  },
  {
    title: "Exception handling",
    code: `def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("cannot divide by zero")
        return None
    finally:
        print("done")`,
  },
  {
    title: "Inheritance",
    code: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return f"{self.name} says woof"`,
  },
  {
    title: "Two sum",
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        need = target - num
        if need in seen:
            return seen[need], i
        seen[num] = i
    return None`,
  },
  {
    title: "Async fetch",
    code: `import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} finished"

async def main():
    results = await asyncio.gather(fetch("a", 1), fetch("b", 2))
    print(results)

asyncio.run(main())`,
  },
  {
    title: "Property setter",
    code: `class Temperature:
    def __init__(self, celsius=0.0):
        self._celsius = celsius

    @property
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self._celsius = (value - 32) * 5 / 9`,
  },
  {
    title: "Matrix transpose",
    code: `matrix = [
    [1, 2, 3],
    [4, 5, 6],
]
transposed = [list(row) for row in zip(*matrix)]
print(transposed)`,
  },
  {
    title: "Queue with deque",
    code: `from collections import deque

queue = deque(["first", "second"])
queue.append("third")
while queue:
    task = queue.popleft()
    print("processing", task)`,
  },
  {
    title: "Lambda sorting",
    code: `students = [("maya", 21, 3.8), ("leo", 19, 3.5), ("ana", 22, 3.9)]
by_gpa = sorted(students, key=lambda s: s[2], reverse=True)
youngest = min(students, key=lambda s: s[1])
print(by_gpa[0][0], youngest[0])`,
  },
  {
    title: "Pathlib files",
    code: `from pathlib import Path

def list_python_files(folder):
    root = Path(folder)
    return sorted(p.name for p in root.glob("*.py"))

print(list_python_files("."))`,
  },
  {
    title: "Caesar cipher",
    code: `def caesar(text, shift):
    result = []
    for ch in text:
        if ch.isalpha():
            base = ord("a") if ch.islower() else ord("A")
            result.append(chr((ord(ch) - base + shift) % 26 + base))
        else:
            result.append(ch)
    return "".join(result)`,
  },
  {
    title: "Memoized factorial",
    code: `from functools import lru_cache

@lru_cache(maxsize=None)
def factorial(n: int) -> int:
    return 1 if n < 2 else n * factorial(n - 1)

print(factorial(20))`,
  },
  {
    title: "Linked list node",
    code: `class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

def to_list(head):
    values = []
    while head:
        values.append(head.value)
        head = head.next
    return values`,
  },
  {
    title: "CSV summary",
    code: `import csv

def average_column(path, column):
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    values = [float(row[column]) for row in rows]
    return sum(values) / len(values) if values else 0.0`,
  },
  {
    title: "Enum status",
    code: `from enum import Enum

class Status(Enum):
    TODO = "todo"
    DOING = "doing"
    DONE = "done"

def is_open(status: Status) -> bool:
    return status is not Status.DONE`,
  },
  {
    title: "Type hints",
    code: `from typing import Optional

def find_user(users: list[dict], user_id: int) -> Optional[dict]:
    for user in users:
        if user.get("id") == user_id:
            return user
    return None`,
  },
  {
    title: "Chunk a list",
    code: `def chunks(items, size):
    for start in range(0, len(items), size):
        yield items[start:start + size]

for batch in chunks(list(range(10)), 3):
    print(batch)`,
  },
  {
    title: "Anagram groups",
    code: `def group_anagrams(words):
    groups = {}
    for word in words:
        key = "".join(sorted(word))
        groups.setdefault(key, []).append(word)
    return list(groups.values())

print(group_anagrams(["eat", "tea", "tan", "ate", "nat"]))`,
  },
  {
    title: "Rate limiter",
    code: `import time

class RateLimiter:
    def __init__(self, per_second):
        self.interval = 1 / per_second
        self.last = 0.0

    def wait(self):
        now = time.monotonic()
        delay = self.last + self.interval - now
        if delay > 0:
            time.sleep(delay)
        self.last = time.monotonic()`,
  },
  {
    title: "Simple HTTP request",
    code: `from urllib.request import urlopen
import json

def get_json(url):
    with urlopen(url, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))`,
  },
  {
    title: "Unpacking",
    code: `first, *middle, last = [10, 20, 30, 40, 50]
point = {"x": 3, "y": 4}
x, y = point["x"], point["y"]
print(first, middle, last, (x ** 2 + y ** 2) ** 0.5)`,
  },
  {
    title: "Validate email",
    code: `def looks_like_email(value: str) -> bool:
    if value.count("@") != 1:
        return False
    user, domain = value.split("@")
    return bool(user) and "." in domain and not domain.startswith(".")`,
  },
  {
    title: "Running average",
    code: `class RunningAverage:
    def __init__(self):
        self.count = 0
        self.total = 0.0

    def add(self, value):
        self.count += 1
        self.total += value
        return self.total / self.count`,
  },
  {
    title: "Walrus operator",
    code: `data = [4, 8, 15, 16, 23, 42]
if (n := len(data)) > 5:
    print(f"list is long ({n} items)")
evens = [y for x in data if (y := x * 2) > 20]
print(evens)`,
  },
  {
    title: "Bubble sort",
    code: `def bubble_sort(values):
    items = list(values)
    for end in range(len(items) - 1, 0, -1):
        swapped = False
        for i in range(end):
            if items[i] > items[i + 1]:
                items[i], items[i + 1] = items[i + 1], items[i]
                swapped = True
        if not swapped:
            break
    return items`,
  },
  {
    title: "Match statement",
    code: `def describe(command):
    match command.split():
        case ["go", direction]:
            return f"moving {direction}"
        case ["pick", "up", item]:
            return f"picked up {item}"
        case ["quit"]:
            return "goodbye"
        case _:
            return "unknown command"`,
  },
  {
    title: "Count vowels",
    code: `def count_vowels(text):
    return sum(1 for ch in text.lower() if ch in "aeiou")

print(count_vowels("Programming is fun"))`,
  },
  {
    title: "Gradebook",
    code: `def letter_grade(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    return "F"

grades = {name: letter_grade(s) for name, s in {"ana": 93, "ben": 78}.items()}`,
  },
  {
    title: "Retry helper",
    code: `import time

def retry(action, attempts=3, delay=0.5):
    for attempt in range(1, attempts + 1):
        try:
            return action()
        except Exception as error:
            if attempt == attempts:
                raise
            print(f"attempt {attempt} failed: {error}")
            time.sleep(delay)`,
  },
  {
    title: "Set operations",
    code: `backend = {"python", "sql", "docker"}
frontend = {"react", "css", "typescript", "docker"}
print("both:", backend & frontend)
print("either:", backend | frontend)
print("only backend:", backend - frontend)`,
  },
  {
    title: "Reverse words",
    code: `def reverse_words(sentence: str) -> str:
    return " ".join(reversed(sentence.split()))

assert reverse_words("hello big world") == "world big hello"`,
  },
  {
    title: "Inventory class",
    code: `class Inventory:
    def __init__(self):
        self.stock = {}

    def add(self, item, qty=1):
        self.stock[item] = self.stock.get(item, 0) + qty

    def remove(self, item, qty=1):
        if self.stock.get(item, 0) < qty:
            raise ValueError(f"not enough {item}")
        self.stock[item] -= qty`,
  },
  {
    title: "Dates",
    code: `from datetime import date, timedelta

today = date.today()
next_week = today + timedelta(days=7)
days_left = (date(today.year, 12, 31) - today).days
print(next_week.isoformat(), days_left)`,
  },
  {
    title: "Breadth-first search",
    code: `from collections import deque

def bfs(graph, start):
    seen = {start}
    order = []
    queue = deque([start])
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph.get(node, []):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return order`,
  },
  {
    title: "Random password",
    code: `import secrets
import string

def make_password(length=12):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

print(make_password())`,
  },
];
