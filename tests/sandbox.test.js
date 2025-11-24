import test from 'node:test';
import assert from 'node:assert';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

const sandboxModulePromise = import('../script.js');

test('normalizeTags trims whitespace and removes empties', async () => {
  const { normalizeTags } = await sandboxModulePromise;
  assert.deepStrictEqual(normalizeTags('a,  b , , c '), ['a', 'b', 'c']);
});

test('loadPrompts falls back to defaults when storage is empty', async () => {
  const { loadPrompts, getPrompts, getSelectedPromptId, DEFAULT_PROMPTS, setPrompts, setSelectedPromptId } =
    await sandboxModulePromise;
  localStorage.clear();
  setPrompts([]);
  setSelectedPromptId(null);

  loadPrompts();

  assert.strictEqual(getPrompts().length, DEFAULT_PROMPTS.length);
  assert.strictEqual(getSelectedPromptId(), DEFAULT_PROMPTS[0].id);
});

test('loadPrompts prefers stored prompts when present', async () => {
  const { loadPrompts, getPrompts, getSelectedPromptId, setPrompts, setSelectedPromptId, STORAGE_KEY } =
    await sandboxModulePromise;
  const stored = [
    { id: 'persisted-1', title: 'Persisted', body: 'Body', tags: [], model: 'gpt-4o', temperature: '0.20', savedAt: Date.now() },
  ];
  localStorage.clear();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  setPrompts([]);
  setSelectedPromptId(null);

  loadPrompts();

  assert.deepStrictEqual(getPrompts()[0].id, 'persisted-1');
  assert.strictEqual(getSelectedPromptId(), 'persisted-1');
});

test('seedDefaultsIfEmpty only seeds once and persists', async () => {
  const { seedDefaultsIfEmpty, getPrompts, setPrompts, setSelectedPromptId, STORAGE_KEY, DEFAULT_PROMPTS } =
    await sandboxModulePromise;
  localStorage.clear();
  setPrompts([]);
  setSelectedPromptId(null);

  const first = seedDefaultsIfEmpty();
  assert.strictEqual(first, true);
  assert.strictEqual(getPrompts().length, DEFAULT_PROMPTS.length);
  assert.strictEqual(localStorage.getItem(STORAGE_KEY) !== null, true);

  const second = seedDefaultsIfEmpty();
  assert.strictEqual(second, false);
});
