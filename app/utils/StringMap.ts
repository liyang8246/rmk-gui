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
    this.inner.clear()
  }

  get size(): number {
    return this.inner.size
  }
}
