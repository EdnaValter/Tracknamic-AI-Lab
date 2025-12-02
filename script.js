import { getCurrentUser } from './auth.js';

export const STORAGE_KEY = 'ai-lab-prompts';
const FALLBACK_USER = { id: 'demo-user', name: 'Casey Demo', email: 'casey@tracknamic.com' };
export const CURRENT_USER = getCurrentUser?.() ?? FALLBACK_USER;

const now = () => Date.now();

export const DEFAULT_PROMPTS = [
  {
    id: 'welcome-mentor',
    title: 'Engineering Mentor',
    body: 'You are a senior engineer who explains concepts with crisp examples.',
    tags: ['getting-started', 'mentorship'],
    author: CURRENT_USER,
    tip: 'Preface with a persona and concrete examples.',
    createdAt: now(),
    updatedAt: now(),
    reactions: { like: { count: 4, users: [] }, celebrate: { count: 1, users: [] } },
    comments: [
      {
        id: 'comment-1',
        author: { id: 'alex', name: 'Alex' },
        body: 'Adding a short objective before the persona helps!',
        createdAt: now(),
        parentId: null,
      },
    ],
    saves: ['team-shared'],
    forks: 1,
  },
  {
    id: 'product-writer',
    title: 'Product explainer',
    body: 'Summarize requirements into a one-pager with bullets and risks.',
    tags: ['productivity'],
    author: { id: 'kim', name: 'Kim Tran' },
    tip: 'Keep risks short and add a rollout plan.',
    createdAt: now(),
    updatedAt: now(),
    reactions: { like: { count: 7, users: [] }, celebrate: { count: 2, users: [] } },
    comments: [],
    saves: [],
    forks: 0,
  },
];

let prompts = [];
let selectedPromptId = null;
let activityFeed = [];
const labSaveState = { selectedTags: ['sandbox'], availableTags: [] };
const labPromptState = { prompts: [], activeId: null };

/**
 * Normalize a comma-delimited tag string into an array of trimmed values.
 * @param {string} raw
 * @returns {string[]}
 */
export function normalizeTags(raw = '') {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeLabTag(tag = '') {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function renderSelectedTags() {
  const container = document.getElementById('lab-tag-pills');
  if (!container) return;
  container.innerHTML = '';
  labSaveState.selectedTags.forEach((tag) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.tag = tag;
    chip.textContent = `#${tag}`;
    chip.title = 'Remove tag';
    container.appendChild(chip);
  });
}

function renderTagOptions() {
  const options = document.getElementById('lab-tag-options');
  if (!options) return;
  options.innerHTML = '';
  labSaveState.availableTags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    options.appendChild(option);
  });
}

function addSelectedTag(tag) {
  const normalized = normalizeLabTag(tag);
  if (!normalized) return;
  if (!labSaveState.selectedTags.includes(normalized)) {
    labSaveState.selectedTags.push(normalized);
    renderSelectedTags();
  }
}

function removeSelectedTag(tag) {
  labSaveState.selectedTags = labSaveState.selectedTags.filter((t) => t !== tag);
  renderSelectedTags();
}

function bindTagInputs() {
  const input = document.getElementById('lab-tag-input');
  const addBtn = document.getElementById('lab-tag-add');
  if (!input || input.dataset.bound === 'true') return;
  input.dataset.bound = 'true';
  const submitTag = () => {
    addSelectedTag(input.value);
    input.value = '';
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      submitTag();
    }
  });
  addBtn?.addEventListener('click', submitTag);
  document.getElementById('lab-tag-pills')?.addEventListener('click', (event) => {
    const tag = event.target.dataset?.tag;
    if (tag) {
      removeSelectedTag(tag);
    }
  });
}

function setAvailableLabTags(tags = []) {
  const normalized = tags.map(normalizeLabTag).filter(Boolean);
  labSaveState.availableTags = Array.from(new Set([...labSaveState.availableTags, ...normalized]));
  renderTagOptions();
}

export function getPrompts() {
  return prompts;
}

export function setPrompts(next) {
  prompts = Array.isArray(next) ? next : [];
}

function persistPrompts() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }
}

function recordActivity(entry) {
  activityFeed.unshift({ id: crypto.randomUUID(), createdAt: now(), ...entry });
  if (activityFeed.length > 20) {
    activityFeed = activityFeed.slice(0, 20);
  }
}

export function getSelectedPromptId() {
  return selectedPromptId;
}

export function setSelectedPromptId(id) {
  selectedPromptId = id;
}

export function seedDefaultsIfEmpty() {
  if (typeof localStorage === 'undefined') {
    setPrompts(DEFAULT_PROMPTS);
    persistPrompts();
    setSelectedPromptId(DEFAULT_PROMPTS[0]?.id ?? null);
    return true;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPrompts(parsed);
        setSelectedPromptId(parsed[0].id);
        return false;
      }
    } catch (error) {
      console.error('Failed to parse prompts', error);
    }
  }
  setPrompts(DEFAULT_PROMPTS);
  persistPrompts();
  setSelectedPromptId(DEFAULT_PROMPTS[0]?.id ?? null);
  return true;
}

export function loadPrompts() {
  seedDefaultsIfEmpty();
}

function findPrompt(id) {
  return prompts.find((p) => p.id === id);
}

function upsertPrompts(updated) {
  setPrompts(updated);
  persistPrompts();
}

export function createPrompt({ title, body, tags = [], tip = '' }) {
  if (!title?.trim()) throw new Error('Title is required');
  if (!body?.trim()) throw new Error('Body is required');
  const prompt = {
    id: crypto.randomUUID(),
    title: title.trim(),
    body: body.trim(),
    tags: tags.map((t) => t.toLowerCase()),
    author: CURRENT_USER,
    tip,
    createdAt: now(),
    updatedAt: now(),
    reactions: { like: { count: 0, users: [] }, celebrate: { count: 0, users: [] } },
    comments: [],
    saves: [],
    forks: 0,
  };
  upsertPrompts([prompt, ...prompts]);
  setSelectedPromptId(prompt.id);
  recordActivity({ type: 'create', message: `${prompt.title} published`, actor: CURRENT_USER.name });
  return prompt;
}

export function updatePrompt(id, updates) {
  const target = findPrompt(id);
  if (!target) throw new Error('Prompt not found');
  const next = prompts.map((p) =>
    p.id === id
      ? {
          ...p,
          ...updates,
          updatedAt: now(),
        }
      : p,
  );
  upsertPrompts(next);
  recordActivity({ type: 'update', message: `${target.title} updated`, actor: CURRENT_USER.name });
}

export function deletePrompt(id) {
  const target = findPrompt(id);
  if (!target) return;
  upsertPrompts(prompts.filter((p) => p.id !== id));
  recordActivity({ type: 'delete', message: `${target.title} removed`, actor: CURRENT_USER.name });
}

export function toggleReaction(promptId, type = 'like', userId = CURRENT_USER.id) {
  const prompt = findPrompt(promptId);
  if (!prompt) return null;
  const reaction = prompt.reactions?.[type] ?? { count: 0, users: [] };
  const users = new Set(reaction.users || []);
  if (users.has(userId)) {
    users.delete(userId);
  } else {
    users.add(userId);
  }
  const count = users.size;
  const next = prompts.map((p) =>
    p.id === promptId ? { ...p, reactions: { ...p.reactions, [type]: { count, users: [...users] } } } : p,
  );
  upsertPrompts(next);
  recordActivity({ type: 'reaction', message: `${type} on ${prompt.title}`, actor: CURRENT_USER.name });
  return count;
}

export function addComment(promptId, body, parentId = null) {
  if (!body?.trim()) throw new Error('Comment is required');
  const prompt = findPrompt(promptId);
  if (!prompt) throw new Error('Prompt not found');
  const comment = {
    id: crypto.randomUUID(),
    author: CURRENT_USER,
    body: body.trim(),
    parentId,
    createdAt: now(),
  };
  const next = prompts.map((p) => (p.id === promptId ? { ...p, comments: [comment, ...p.comments] } : p));
  upsertPrompts(next);
  recordActivity({ type: 'comment', message: `Commented on ${prompt.title}`, actor: CURRENT_USER.name });
  return comment;
}

function getTopPromptsBy(field = 'createdAt', limit = 3) {
  const sorted = [...prompts].sort((a, b) => (b[field] || 0) - (a[field] || 0));
  return sorted.slice(0, limit);
}


function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
}

export function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn || btn.dataset.bound === 'true') return;
  btn.dataset.bound = 'true';
  const saved = localStorage.getItem('theme');
  if (saved) applyTheme(saved);
  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderTagRow(container, tags = []) {
  if (!container) return;
  container.innerHTML = '';
  tags.forEach((tag) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = tag;
    chip.dataset.tag = tag;
    container.appendChild(chip);
  });
}

const feedState = { page: 1, pageSize: 5, selectedTag: null, query: '', sort: 'newest' };

function getFilteredPrompts() {
  const normalizedQuery = feedState.query.toLowerCase();
  const filtered = prompts.filter((prompt) => {
    const matchesTag = feedState.selectedTag ? prompt.tags.includes(feedState.selectedTag) : true;
    const matchesQuery = normalizedQuery
      ? [prompt.title, prompt.body, prompt.author?.name, prompt.tip].some((field) =>
          (field || '').toLowerCase().includes(normalizedQuery),
        )
      : true;
    return matchesTag && matchesQuery;
  });

  const sorted = filtered.sort((a, b) => {
    if (feedState.sort === 'reactions') {
      const reactionsA = (a.reactions?.like?.count || 0) + (a.reactions?.celebrate?.count || 0);
      const reactionsB = (b.reactions?.like?.count || 0) + (b.reactions?.celebrate?.count || 0);
      return reactionsB - reactionsA;
    }
    if (feedState.sort === 'updated') {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  return sorted;
}

function renderPaginationStatus(total) {
  const el = document.getElementById('pagination-status');
  if (!el) return;
  const showing = Math.min(feedState.page * feedState.pageSize, total);
  el.textContent = `${showing} of ${total} prompts`;
}

function renderPromptCard(prompt) {
  const card = document.createElement('article');
  card.className = 'prompt-card';
  card.dataset.id = prompt.id;
  const likeCount = prompt.reactions?.like?.count || 0;
  const celebrateCount = prompt.reactions?.celebrate?.count || 0;
  const combinedTags = prompt.tags?.map((tag) => `<span class="pill">${tag}</span>`).join('') || '';
  card.innerHTML = `
    <header class="prompt-card__header">
      <div>
        <p class="eyebrow">${prompt.author?.name || 'Unknown'} • ${formatDate(prompt.createdAt)}</p>
        <h3>${prompt.title}</h3>
        <p class="muted">${prompt.tip || 'Add what works to guide collaborators.'}</p>
      </div>
      <div class="prompt-actions">
        <button class="ghost" data-action="share" aria-label="Copy prompt">Copy</button>
        <button class="ghost" data-action="open">Details</button>
      </div>
    </header>
    <p class="prompt-card__body">${prompt.body.slice(0, 200)}${prompt.body.length > 200 ? '…' : ''}</p>
    <div class="prompt-meta">${combinedTags}</div>
    <div class="prompt-footer">
      <div class="reactions" role="group" aria-label="Reactions">
        <button class="chip" data-action="react" data-type="like">👍 ${likeCount}</button>
        <button class="chip" data-action="react" data-type="celebrate">🎉 ${celebrateCount}</button>
      </div>
      <div class="prompt-cta">
        <button class="secondary" data-action="save">Save</button>
        <button class="ghost" data-action="fork">Fork</button>
        <button class="ghost" data-action="comment">Comment</button>
      </div>
    </div>
  `;
  return card;
}

function renderPromptFeed() {
  const list = document.getElementById('prompt-list');
  const loadMore = document.getElementById('load-more');
  if (!list) return;
  list.innerHTML = '';
  const filtered = getFilteredPrompts();
  const start = 0;
  const end = feedState.page * feedState.pageSize;
  const page = filtered.slice(start, end);
  page.forEach((prompt) => list.appendChild(renderPromptCard(prompt)));
  renderPaginationStatus(filtered.length);
  if (loadMore) loadMore.disabled = end >= filtered.length;
  renderDiscoveryPanels();
}

function renderDiscoveryPanels() {
  const topList = document.getElementById('top-prompts');
  const trending = document.getElementById('trending-tags');
  const recent = document.getElementById('recent-prompts');
  const activity = document.getElementById('activity-feed');
  if (topList) {
    topList.innerHTML = '';
    getTopPromptsBy('createdAt', 3).forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.title} · 👍 ${p.reactions?.like?.count ?? 0}`;
      topList.appendChild(li);
    });
  }
  if (recent) {
    recent.innerHTML = '';
    getTopPromptsBy('updatedAt', 3).forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.title} · Updated ${formatDate(p.updatedAt)}`;
      recent.appendChild(li);
    });
  }
  if (trending) {
    const allTags = prompts.flatMap((p) => p.tags || []);
    const counts = allTags.reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {});
    const sortedTags = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
    renderTagRow(trending, sortedTags);
  }
  if (activity) {
    activity.innerHTML = '';
    activityFeed.slice(0, 6).forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = `${entry.actor}: ${entry.message}`;
      activity.appendChild(li);
    });
  }
}

function handlePromptActions(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const card = target.closest('.prompt-card');
  const modal = target.closest('#prompt-modal');
  const promptId = card?.dataset.id || modal?.dataset.promptId;
  const action = target.dataset.action;
  if (!promptId) return;
  if (action === 'react') {
    toggleReaction(promptId, target.dataset.type);
    renderPromptFeed();
    openPromptDetail(promptId);
  }
  if (action === 'share') {
    navigator.clipboard?.writeText(findPrompt(promptId)?.body || '');
    target.textContent = 'Copied';
    setTimeout(() => (target.textContent = 'Copy'), 800);
  }
  if (action === 'save') {
    updatePrompt(promptId, { saves: [...new Set([...(findPrompt(promptId)?.saves || []), CURRENT_USER.id])] });
    renderPromptFeed();
  }
  if (action === 'fork') {
    const prompt = findPrompt(promptId);
    updatePrompt(promptId, { forks: (prompt?.forks || 0) + 1 });
    renderPromptFeed();
  }
  if (action === 'open' || action === 'comment') {
    openPromptDetail(promptId);
  }
}

function renderCommentList(prompt) {
  const list = document.getElementById('comment-list');
  if (!list) return;
  const commentsByParent = prompt.comments.reduce((acc, comment) => {
    const key = comment.parentId || 'root';
    acc[key] = acc[key] || [];
    acc[key].push(comment);
    return acc;
  }, {});
  list.innerHTML = '';

  function renderThread(parentId = null, indent = 0) {
    const items = commentsByParent[parentId || 'root'] || [];
    items.forEach((comment) => {
      const li = document.createElement('li');
      li.className = 'comment';
      li.style.paddingLeft = `${indent * 12}px`;
      li.innerHTML = `
        <div class="comment-meta">${comment.author?.name || 'Anon'} • ${formatDate(comment.createdAt)}</div>
        <p>${comment.body}</p>
        <button class="ghost" data-reply="${comment.id}">Reply</button>
      `;
      list.appendChild(li);
      renderThread(comment.id, indent + 1);
    });
  }

  renderThread();
}

function openPromptDetail(promptId) {
  const prompt = findPrompt(promptId);
  const modal = document.getElementById('prompt-modal');
  if (!prompt || !modal) return;
  modal.hidden = false;
  modal.dataset.promptId = promptId;
  modal.querySelector('#modal-title').textContent = prompt.title;
  modal.querySelector('#modal-body').textContent = prompt.body;
  modal.querySelector('#modal-tip').textContent = prompt.tip || 'Add notes about what works best.';
  modal.querySelector('#modal-meta').textContent = `${prompt.author?.name || 'Unknown'} • ${formatDate(prompt.createdAt)}`;
  renderTagRow(modal.querySelector('#modal-tags'), prompt.tags);
  modal.querySelector('#modal-reactions').textContent = `👍 ${prompt.reactions?.like?.count || 0} · 🎉 ${
    prompt.reactions?.celebrate?.count || 0
  }`;
  renderCommentList(prompt);
  const related = document.getElementById('related-prompts');
  if (related) {
    related.innerHTML = '';
    const relatedPrompts = prompts.filter((p) => p.id !== promptId && p.tags.some((tag) => prompt.tags.includes(tag))).slice(0, 3);
    relatedPrompts.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = `${p.title} · ${p.tags.slice(0, 2).join(', ')}`;
      related.appendChild(li);
    });
  }
  modal.querySelector('#comment-form')?.setAttribute('data-prompt', promptId);
}

function closePromptDetail() {
  const modal = document.getElementById('prompt-modal');
  if (modal) modal.hidden = true;
}

function setupPromptComposer() {
  const form = document.getElementById('prompt-form');
  if (!form) return;
  const preview = document.getElementById('prompt-preview');
  const previewBody = document.getElementById('prompt-preview-body');
  const status = document.getElementById('prompt-status');
  const titleInput = document.getElementById('prompt-title');
  const bodyInput = document.getElementById('prompt-body');
  const tagInput = document.getElementById('prompt-tags');
  const tipInput = document.getElementById('prompt-tip');

  document.getElementById('prompt-preview-btn')?.addEventListener('click', () => {
    previewBody.textContent = `${titleInput.value}\n\n${bodyInput.value}`;
    preview.hidden = false;
  });

  document.getElementById('prompt-reset')?.addEventListener('click', () => {
    form.reset();
    preview.hidden = true;
    status.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    document.getElementById('error-title').textContent = '';
    document.getElementById('error-body').textContent = '';
    try {
      const prompt = createPrompt({
        title: titleInput.value,
        body: bodyInput.value,
        tags: normalizeTags(tagInput.value),
        tip: tipInput.value,
      });
      status.textContent = 'Prompt submitted with optimistic update.';
      form.reset();
      preview.hidden = true;
      renderPromptFeed();
      openPromptDetail(prompt.id);
    } catch (error) {
      status.textContent = 'Please fix the errors below.';
      if (error.message.includes('Title')) document.getElementById('error-title').textContent = error.message;
      if (error.message.includes('Body')) document.getElementById('error-body').textContent = error.message;
    }
  });
}

function setupPromptFeed() {
  const list = document.getElementById('prompt-list');
  if (!list) return;
  loadPrompts();
  renderTagRow(document.getElementById('tag-filter'), Array.from(new Set(prompts.flatMap((p) => p.tags || []))));
  renderPromptFeed();
  document.getElementById('prompt-search')?.addEventListener('input', (event) => {
    feedState.query = event.target.value;
    feedState.page = 1;
    renderPromptFeed();
  });
  document.getElementById('prompt-sort')?.addEventListener('change', (event) => {
    feedState.sort = event.target.value;
    renderPromptFeed();
  });
  document.getElementById('tag-filter')?.addEventListener('click', (event) => {
    if (event.target.matches('.chip')) {
      feedState.selectedTag = event.target.dataset.tag;
      renderPromptFeed();
    }
  });
  list.addEventListener('click', handlePromptActions);
  document.getElementById('load-more')?.addEventListener('click', () => {
    feedState.page += 1;
    renderPromptFeed();
  });
  document.getElementById('prompt-modal-close')?.addEventListener('click', closePromptDetail);
  document.getElementById('comment-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const promptId = event.target.getAttribute('data-prompt');
    const body = event.target.comment?.value || '';
    addComment(promptId, body, event.target.parentId?.value || null);
    event.target.reset();
    renderPromptFeed();
    openPromptDetail(promptId);
  });
  document.getElementById('comment-list')?.addEventListener('click', (event) => {
    const replyId = event.target.dataset.reply;
    if (!replyId) return;
    const form = document.getElementById('comment-form');
    form.parentId.value = replyId;
    form.comment.focus();
  });
  document.getElementById('prompt-modal')?.addEventListener('click', handlePromptActions);
}

const sandboxState = {
  runs: [],
  activeResponse: '',
  loading: false,
};

export function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapRunRecord(run = {}) {
  return {
    id: run.id ?? crypto.randomUUID(),
    system: run.systemText ?? run.system ?? '',
    prompt: run.promptText ?? run.prompt ?? '',
    input: run.inputText ?? run.input ?? '',
    response: run.outputText ?? run.response ?? '',
    model: run.model ?? 'gpt-4o',
    temperature: typeof run.temperature === 'number' ? run.temperature : 0.2,
    maxTokens: typeof run.maxTokens === 'number' ? run.maxTokens : 512,
    createdAt: run.createdAt ? new Date(run.createdAt).getTime() : Date.now(),
  };
}

export async function runSandboxExperiment({ system, prompt, input, model, temperature, maxTokens }) {
  const response = await fetch('/api/sandbox/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemText: system,
      promptText: prompt,
      inputText: input,
      model,
      temperature,
      maxTokens,
      user: CURRENT_USER,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to reach sandbox service');
  }

  const run = payload.run
    ? mapRunRecord({ ...payload.run, systemText: system, model, temperature, maxTokens })
    : mapRunRecord({ system, prompt, input, response: payload.text, model, temperature, maxTokens });

  return { text: payload.text ?? run.response, run };
}

function setSandboxStatus(message, tone = 'muted') {
  const el = document.getElementById('sandbox-status');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function getSandboxFormValues() {
  const system = document.getElementById('system-input')?.value ?? '';
  const prompt = document.getElementById('user-input')?.value ?? '';
  const input = document.getElementById('input-text')?.value ?? '';
  const model = document.getElementById('model-select')?.value ?? 'gpt-4o';
  const temperature = Number(document.getElementById('temperature-input')?.value ?? 0.2);
  const maxTokens = Number(document.getElementById('max-tokens-input')?.value ?? 512);
  return { system, prompt, input, model, temperature, maxTokens };
}

function hydrateForm(run) {
  document.getElementById('system-input').value = run.system || '';
  document.getElementById('user-input').value = run.prompt || '';
  document.getElementById('input-text').value = run.input || '';
  document.getElementById('model-select').value = run.model;
  document.getElementById('temperature-input').value = run.temperature;
  document.getElementById('temperature-value').textContent = Number(run.temperature).toFixed(2);
  document.getElementById('max-tokens-input').value = run.maxTokens;
  document.getElementById('max-tokens-value').textContent = String(run.maxTokens);
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '';
  sandboxState.runs.forEach((run) => {
    const button = document.createElement('button');
    button.className = 'history-item';
    button.type = 'button';
    const previewSource = run.prompt || run.promptText || '';
    const preview = previewSource.length > 42 ? `${previewSource.slice(0, 42)}…` : previewSource;
    button.innerHTML = `<span class="history-title">${preview || 'Untitled prompt'}</span><span class="history-meta">${formatTimestamp(new Date(run.createdAt))} · ${run.model}</span>`;
    button.addEventListener('click', () => {
      hydrateForm(run);
      sandboxState.activeResponse = run.response;
      renderResponse();
      setSandboxStatus('Restored settings from history.');
    });
    list.appendChild(button);
  });
}

function renderResponse() {
  const container = document.getElementById('response-body');
  const usage = document.getElementById('token-usage');
  if (!container || !usage) return;
  if (!sandboxState.activeResponse) {
    container.textContent = 'Run the sandbox to see output.';
    usage.textContent = '';
    return;
  }
  container.textContent = sandboxState.activeResponse;
  usage.textContent = 'Tokens: ~estimate';
}

function updateSessionBadges(runTime = null) {
  const countEl = document.getElementById('prompt-count');
  const lastRunEl = document.getElementById('last-run-time');
  if (countEl) countEl.textContent = String(getPrompts().length || '—');
  if (lastRunEl && runTime) lastRunEl.textContent = formatTimestamp(new Date(runTime));
}

function setLoading(isLoading) {
  sandboxState.loading = isLoading;
  const button = document.getElementById('launch-btn');
  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Running…' : 'Launch';
  }
}

async function handleRun(event) {
  event?.preventDefault?.();
  const values = getSandboxFormValues();
  if (!values.prompt.trim()) {
    setSandboxStatus('Please provide a user prompt before launching.', 'danger');
    return;
  }
  setLoading(true);
  setSandboxStatus('Sending prompt to the AI layer…');
  try {
    const { text, run } = await runSandboxExperiment(values);
    sandboxState.activeResponse = text;
    sandboxState.runs.unshift(run);
    if (sandboxState.runs.length > 20) {
      sandboxState.runs = sandboxState.runs.slice(0, 20);
    }
    renderHistory();
    renderResponse();
    updateSessionBadges(run.createdAt);
    setSandboxStatus('Experiment completed. Review the response below.', 'success');
  } catch (error) {
    console.error(error);
    setSandboxStatus(error?.message || 'Failed to reach the AI service. Please try again.', 'danger');
  } finally {
    setLoading(false);
  }
}

function handleReset() {
  document.getElementById('system-input').value = '';
  document.getElementById('user-input').value = '';
  document.getElementById('input-text').value = '';
  document.getElementById('model-select').value = 'gpt-4o';
  document.getElementById('temperature-input').value = 0.2;
  document.getElementById('temperature-value').textContent = '0.20';
  document.getElementById('max-tokens-input').value = 512;
  document.getElementById('max-tokens-value').textContent = '512';
  sandboxState.activeResponse = '';
  renderResponse();
  setSandboxStatus('Inputs have been reset.');
}

function resetLabSaveState(defaultTags = ['sandbox']) {
  labSaveState.selectedTags = [...defaultTags];
  renderSelectedTags();
}

function hydrateSaveFormFromSandbox() {
  const modal = document.getElementById('lab-save-modal');
  if (!modal) return false;
  const values = getSandboxFormValues();
  const lastRun = sandboxState.runs[0];
  if (!values.prompt.trim() && !lastRun?.prompt) {
    setSandboxStatus('Please provide a user prompt before saving to AI Lab.', 'danger');
    return false;
  }
  if (!sandboxState.activeResponse && !lastRun?.response) {
    setSandboxStatus('Run the sandbox before saving to AI Lab so we can include example output.', 'danger');
    return false;
  }

  const titleSeed = values.prompt.trim() || lastRun?.prompt || 'Sandbox experiment';
  document.getElementById('lab-save-title').value = `Sandbox – ${titleSeed.slice(0, 60)}`;
  document.getElementById('lab-save-problem').value = `Capture the sandbox run for "${titleSeed}" so teammates can reuse it.`;
  document.getElementById('lab-save-context').value = values.system || 'Context captured from sandbox system instructions.';
  document.getElementById('lab-save-prompt').value = values.prompt || lastRun?.prompt || '';
  document.getElementById('lab-save-example-input').value = lastRun?.input || values.input || '';
  document.getElementById('lab-save-example-output').value = sandboxState.activeResponse || lastRun?.response || '';
  document.getElementById('lab-save-reflection').value = '';
  document.getElementById('lab-save-status').textContent = 'Ready to publish this run to AI Lab.';
  resetLabSaveState();
  bindTagInputs();
  modal.hidden = false;
  return true;
}

async function prefetchLabTags() {
  try {
    const response = await fetch('/api/prompts');
    if (!response.ok) return;
    const promptsFromLab = await response.json();
    const tags = promptsFromLab.flatMap((prompt) => prompt.tags?.map((t) => t.tag?.name) || []);
    setAvailableLabTags(tags);
  } catch (error) {
    console.error(error);
  }
}

async function handleSaveAsPrompt() {
  await prefetchLabTags();
  hydrateSaveFormFromSandbox();
}

async function loadSandboxHistory() {
  try {
    const response = await fetch('/api/sandbox/runs');
    if (!response.ok) throw new Error('Failed to fetch runs');
    const runs = await response.json();
    sandboxState.runs = Array.isArray(runs) ? runs.map(mapRunRecord) : [];
    renderHistory();
    if (sandboxState.runs[0]) {
      sandboxState.activeResponse = sandboxState.runs[0].response;
      hydrateForm(sandboxState.runs[0]);
      renderResponse();
      setSandboxStatus('Restored your latest sandbox run.');
    }
    if (!sandboxState.runs.length) {
      setSandboxStatus('Waiting for your first experiment.');
    }
  } catch (error) {
    console.error(error);
    setSandboxStatus('Unable to load previous runs.', 'danger');
  }
}

async function publishPromptToLab(event) {
  event?.preventDefault?.();
  const form = document.getElementById('lab-save-form');
  if (!form) return;
  const status = document.getElementById('lab-save-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const title = form.title.value.trim();
  const problem = form.problem.value.trim();
  const context = form.context.value.trim();
  const promptText = form.promptText.value.trim();
  const exampleInput = form.exampleInput.value.trim();
  const exampleOutput = form.exampleOutput.value.trim();
  const reflection = form.reflection.value.trim();

  if (!title || !problem || !context || !promptText) {
    status.textContent = 'Title, problem, context, and prompt text are required.';
    return;
  }

  submitBtn.disabled = true;
  status.textContent = 'Publishing prompt to AI Lab…';
  try {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        problem,
        context,
        promptText,
        exampleInput,
        exampleOutput,
        reflection: reflection || null,
        tags: labSaveState.selectedTags,
        user: CURRENT_USER,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to save prompt.');
    }

    status.textContent = 'Redirecting to AI Lab…';
    document.getElementById('lab-save-modal').hidden = true;
    window.location.href = `/lab/${payload.id}`;
  } catch (error) {
    console.error(error);
    status.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
  }
}

function closeSaveModal(event) {
  event?.preventDefault?.();
  const modal = document.getElementById('lab-save-modal');
  if (!modal) return;
  modal.hidden = true;
  document.getElementById('lab-save-status').textContent = '';
}

function getLabPromptIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'lab') return null;
  const id = Number(parts[1]);
  return Number.isNaN(id) ? null : id;
}

async function fetchLabPrompts() {
  const response = await fetch('/api/prompts');
  if (!response.ok) throw new Error('Unable to load AI Lab prompts.');
  const promptsFromApi = await response.json();
  const tags = promptsFromApi.flatMap((prompt) => prompt.tags?.map((t) => t.tag?.name) || []);
  setAvailableLabTags(tags);
  return promptsFromApi;
}

async function fetchLabPromptDetail(id) {
  const response = await fetch(`/api/prompts/${id}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Prompt not found');
  }
  return payload;
}

function renderLabSummary() {
  const pill = document.getElementById('lab-summary');
  if (!pill) return;
  if (!labPromptState.prompts.length) {
    pill.textContent = 'No prompts yet';
    return;
  }
  const tagCount = new Set(labPromptState.prompts.flatMap((prompt) => prompt.tags?.map((t) => t.tag?.name) || [])).size;
  pill.textContent = `${labPromptState.prompts.length} prompts · ${tagCount || 0} tags`;
}

function renderLabList() {
  const container = document.getElementById('lab-prompt-list');
  if (!container) return;
  container.innerHTML = '';
  if (!labPromptState.prompts.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Save a sandbox run to see it here.';
    container.appendChild(empty);
    return;
  }

  labPromptState.prompts.forEach((prompt) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card lab-list-item';
    card.dataset.id = prompt.id;
    card.innerHTML = `
      <div class="lab-list-meta">
        <p class="eyebrow">${new Date(prompt.createdAt).toLocaleDateString()}</p>
        <h4>${prompt.title}</h4>
        <p class="muted">${prompt.problem}</p>
      </div>
      <div class="pill-row">${(prompt.tags || [])
        .map((t) => `<span class="pill">${t.tag?.name || ''}</span>`)
        .join('')}</div>
    `;
    card.addEventListener('click', () => {
      labPromptState.activeId = prompt.id;
      window.history.pushState({}, '', `/lab/${prompt.id}`);
      renderLabDetail(prompt);
    });
    container.appendChild(card);
  });
}

function renderLabDetail(prompt) {
  const card = document.getElementById('lab-detail-card');
  const empty = document.getElementById('lab-detail-empty');
  if (!card || !empty) return;
  if (!prompt) {
    card.hidden = true;
    empty.hidden = false;
    return;
  }
  card.hidden = false;
  empty.hidden = true;

  document.getElementById('lab-detail-title').textContent = prompt.title;
  document.getElementById('lab-detail-meta').textContent = `${new Date(prompt.createdAt).toLocaleDateString()} · ${
    prompt.author?.name || 'Unknown'
  }`;
  document.getElementById('lab-detail-problem').textContent = prompt.problem;
  document.getElementById('lab-detail-context').textContent = prompt.context;
  document.getElementById('lab-detail-prompt').textContent = prompt.promptText;
  document.getElementById('lab-detail-input').textContent = prompt.exampleInput || '—';
  document.getElementById('lab-detail-output').textContent = prompt.exampleOutput || '—';

  const reflectionBlock = document.getElementById('lab-detail-reflection-block');
  if (prompt.reflection) {
    document.getElementById('lab-detail-reflection').textContent = prompt.reflection;
    reflectionBlock.hidden = false;
  } else {
    reflectionBlock.hidden = true;
  }

  const tagRow = document.getElementById('lab-detail-tags');
  tagRow.innerHTML = '';
  (prompt.tags || []).forEach((t) => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = t.tag?.name || '';
    tagRow.appendChild(pill);
  });
}

async function hydrateLabView() {
  const list = document.getElementById('lab-prompt-list');
  if (!list) return;
  try {
    labPromptState.prompts = await fetchLabPrompts();
    renderLabList();
    renderLabSummary();
    const idFromPath = getLabPromptIdFromPath();
    if (idFromPath) {
      const promptFromList = labPromptState.prompts.find((p) => p.id === idFromPath);
      if (promptFromList) {
        renderLabDetail(promptFromList);
      } else {
        const detail = await fetchLabPromptDetail(idFromPath);
        renderLabDetail(detail);
      }
    } else {
      renderLabDetail(null);
    }
  } catch (error) {
    console.error(error);
    list.innerHTML = `<p class="muted">${error.message}</p>`;
  }
}

function setupLabPage() {
  const labRoot = document.getElementById('lab-prompts');
  if (!labRoot) return;
  hydrateLabView();
  document.getElementById('lab-back-btn')?.addEventListener('click', () => {
    window.history.pushState({}, '', '/lab');
    renderLabDetail(null);
  });
}

function setupSandboxPage() {
  const shell = document.getElementById('sandbox-app');
  if (!shell) return;
  loadPrompts();
  updateSessionBadges();
  renderHistory();
  renderResponse();
  setSandboxStatus('Loading recent runs…');
  loadSandboxHistory();
  document.getElementById('launch-btn')?.addEventListener('click', handleRun);
  document.getElementById('reset-btn')?.addEventListener('click', handleReset);
  document.getElementById('save-prompt-btn')?.addEventListener('click', handleSaveAsPrompt);
  document.getElementById('lab-save-close')?.addEventListener('click', closeSaveModal);
  document.getElementById('lab-save-cancel')?.addEventListener('click', closeSaveModal);
  document.getElementById('lab-save-form')?.addEventListener('submit', publishPromptToLab);
  const tempInput = document.getElementById('temperature-input');
  const tempValue = document.getElementById('temperature-value');
  tempInput?.addEventListener('input', () => {
    tempValue.textContent = Number(tempInput.value).toFixed(2);
  });
  const maxInput = document.getElementById('max-tokens-input');
  const maxValue = document.getElementById('max-tokens-value');
  maxInput?.addEventListener('input', () => {
    maxValue.textContent = maxInput.value;
  });
}

export function initializeWorkspaceUI() {
  loadPrompts();
  setupPromptComposer();
  setupPromptFeed();
  setupThemeToggle();
}

export function initializeSandboxUI() {
  loadPrompts();
  setupThemeToggle();
  setupSandboxPage();
}

export function initializeLabUI() {
  setupThemeToggle();
  setupLabPage();
}
