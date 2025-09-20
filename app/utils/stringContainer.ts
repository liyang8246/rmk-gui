interface Stringable {
  toString: () => string
}

export class StringMap<K extends Stringable, V> {
  private inner: Map<string, V> = new Map()

  set(key: K, value: V): void {
    this.inner.set(key.toString(), value)
  }

  get(key: K): V | undefined {
    return this.inner.get(key.toString())
  }

  has(key: K): boolean {
    return this.inner.has(key.toString())
  }

  delete(key: K): boolean {
    return this.inner.delete(key.toString())
  }

  clear(): void {
    return this.inner.clear()
  }

  entries(): MapIterator<[string, V]> {
    return this.inner.entries()
  }

  get size(): number {
    return this.inner.size
  }
}

export class StringSet<K extends Stringable> {
  private inner: Set<string> = new Set()

  add(key: K): void {
    this.inner.add(key.toString())
  }

  has(key: K): boolean {
    return this.inner.has(key.toString())
  }

  delete(key: K): boolean {
    return this.inner.delete(key.toString())
  }

  clear(): void {
    this.inner.clear()
  }

  values(): IterableIterator<string> {
    return this.inner.values()
  }

  get size(): number {
    return this.inner.size
  }
}
