/** Lazy TTL/LRU: no timers, bounded storage, injectable clock for deterministic tests. */
export class Cache<T> {
  private items = new Map<string, { value: T; expires: number }>();
  constructor(readonly limit: number, readonly ttl: number, private now = Date.now) {}
  get(key: string): T | undefined {
    const item = this.items.get(key);
    if (!item) return;
    this.items.delete(key);
    if (item.expires <= this.now()) return;
    this.items.set(key, item);
    return item.value;
  }
  set(key: string, value: T): void {
    this.items.delete(key);
    this.items.set(key, { value, expires: this.now() + this.ttl });
    while (this.items.size > this.limit) this.items.delete(this.items.keys().next().value!);
  }
  clear(): void { this.items.clear(); }
  get size(): number { return this.items.size; }
}
