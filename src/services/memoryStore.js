// Simple in-memory store to replace localStorage fallbacks during dev.
// Resets on page reload; DO NOT use for persistence.

const store = new Map();

export const memoryStore = {
  get(key) {
    return store.get(key) ?? null;
  },
  set(key, value) {
    store.set(key, value);
  },
  remove(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
};
