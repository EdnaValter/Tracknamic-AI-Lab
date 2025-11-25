const modules = [
  { title: 'Authentication', description: 'NextAuth with email + GitHub/Google, onboarding interests.', tag: 'safety' },
  { title: 'Feed & Search', description: 'Personalized feeds, infinite scroll, tag filters, semantic search.', tag: 'collab' },
  { title: 'Prompt Studio', description: 'Markdown editor, previews, copy buttons, model badges.', tag: 'collab' },
  { title: 'Interactions', description: 'Likes, bookmarks, forks, threaded comments with mentions.', tag: 'collab' },
  { title: 'Notifications', description: 'Real-time via WebSocket with read/unread states.', tag: 'collab' },
  { title: 'AI Helpers', description: 'Optimize and summarize prompts with caching and rate limits.', tag: 'ai' },
  { title: 'Moderation', description: 'Reports, hide/unhide, audit notes for moderators.', tag: 'safety' },
  { title: 'Teams', description: 'Spaces with invites, roles, and shared libraries.', tag: 'collab' },
];

export const STORAGE_KEY = 'ai-lab-prompts';

export const DEFAULT_PROMPTS = [
  {
    id: 'welcome-mentor',
    title: 'Engineering Mentor',
    body: 'You are a senior engineer who explains concepts with crisp examples.',
    tags: ['getting-started', 'mentorship'],
    model: 'gpt-4o',
    temperature: '0.35',
    savedAt: Date.now(),
  },
  {
    id: 'product-writer',
    title: 'Product explainer',
    body: 'Summarize requirements into a one-pager with bullets and risks.',
    tags: ['productivity'],
    model: 'gpt-4.1-mini',
    temperature: '0.25',
    savedAt: Date.now(),
  },
];

let prompts = [];
let selectedPromptId = null;

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

const workflows = [
  { title: 'Onboarding', desc: 'Select interests, preferred models, set avatar/bio.', details: 'Gated posting until email verified. Suggest accounts to follow with curated tags.' },
  { title: 'Authoring', desc: 'Draft prompt with markdown + AI improvements.', details: 'Save draft, run Optimize/Summarize, attach tags and visibility. Preview renders code blocks with copy buttons.' },
  { title: 'Publish & Share', desc: 'Publish to feed and search with OG previews.', details: 'Followers notified. Fork lineage maintained. Related prompts appear via hybrid retrieval.' },
  { title: 'Moderation', desc: 'Report/hide content with RBAC roles.', details: 'Moderators can hide/unhide, admins manage users/teams and feature flags.' },
];

const metricSeeds = [
  { label: 'API latency', suffix: 'ms', min: 12, max: 28 },
  { label: 'Success rate', suffix: '%', min: 99.2, max: 99.9 },
  { label: 'Prompts optimized', suffix: '', min: 102, max: 152 },
  { label: 'Live sessions', suffix: '', min: 42, max: 78 },
];

function renderModules(filter = 'all') {
  const grid = document.getElementById('module-grid');
  grid.innerHTML = '';
  const filtered = modules.filter((m) => filter === 'all' || m.tag === filter);
  filtered.forEach((m) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<h3>${m.title}</h3><p class="muted">${m.description}</p><span class="pill">${m.tag}</span>`;
    grid.appendChild(card);
  });
}

function setupFilters() {
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderModules(chip.dataset.filter);
    });
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${target}`);
      });
    });
  });
}

function renderWorkflows() {
  const container = document.getElementById('workflow-accordion');
  container.innerHTML = '';
  workflows.forEach((wf, idx) => {
    const button = document.createElement('button');
    button.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
    button.innerHTML = `<span class="title">${wf.title}</span><span class="desc">${wf.desc}</span>`;
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = wf.details;
    content.hidden = idx !== 0;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      content.hidden = expanded;
    });
    const wrapper = document.createElement('div');
    wrapper.appendChild(button);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
  });
}

function randomBetween(min, max) {
  return (Math.random() * (max - min) + min).toFixed(1);
}

function renderMetrics() {
  const container = document.getElementById('metrics');
  container.innerHTML = '';
  metricSeeds.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'metric-row';
    const value = `${randomBetween(m.min, m.max)}${m.suffix}`;
    row.innerHTML = `<span class="label">${m.label}</span><span class="value">${value}</span>`;
    container.appendChild(row);
  });
}

function setupMetrics() {
  renderMetrics();
  const refreshBtn = document.getElementById('refresh-metrics');
  refreshBtn.addEventListener('click', renderMetrics);
  setInterval(renderMetrics, 20000);
}

function setupForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = 'Submitting...';
    setTimeout(() => {
      status.textContent = 'Thanks! We will reach out within one business day.';
      form.reset();
    }, 700);
  });
}

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved) applyTheme(saved);
  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

const sandboxState = {
  runs: [],
  activeResponse: '',
  loading: false,
};

export function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function runSandboxExperiment({ system, prompt, model, temperature, maxTokens }) {
  const latency = 800 + Math.random() * 800;
  await new Promise((resolve) => setTimeout(resolve, latency));
  const header = system ? `System instructions respected.\n\n` : '';
  const body = `${header}This is a simulated response — AI keys are not configured yet.\n\nModel: ${model}\nTemperature: ${temperature}\nTokens: ~${maxTokens}\n\nEcho:\n${prompt}`;
  return { text: body };
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
  const model = document.getElementById('model-select')?.value ?? 'gpt-4o';
  const temperature = Number(document.getElementById('temperature-input')?.value ?? 0.2);
  const maxTokens = Number(document.getElementById('max-tokens-input')?.value ?? 512);
  return { system, prompt, model, temperature, maxTokens };
}

function hydrateForm(run) {
  document.getElementById('system-input').value = run.system || '';
  document.getElementById('user-input').value = run.prompt || '';
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
    const preview = run.prompt.length > 42 ? `${run.prompt.slice(0, 42)}…` : run.prompt;
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
    const response = await runSandboxExperiment(values);
    const run = {
      id: crypto.randomUUID(),
      ...values,
      response: response.text,
      createdAt: Date.now(),
    };
    sandboxState.activeResponse = response.text;
    sandboxState.runs.unshift(run);
    renderHistory();
    renderResponse();
    updateSessionBadges(run.createdAt);
    setSandboxStatus('Experiment completed. Review the response below.', 'success');
  } catch (error) {
    console.error(error);
    setSandboxStatus('Failed to reach the AI service. Please try again.', 'danger');
  } finally {
    setLoading(false);
  }
}

function handleReset() {
  document.getElementById('system-input').value = '';
  document.getElementById('user-input').value = '';
  document.getElementById('model-select').value = 'gpt-4o';
  document.getElementById('temperature-input').value = 0.2;
  document.getElementById('temperature-value').textContent = '0.20';
  document.getElementById('max-tokens-input').value = 512;
  document.getElementById('max-tokens-value').textContent = '512';
  sandboxState.activeResponse = '';
  renderResponse();
  setSandboxStatus('Inputs have been reset.');
}

function handleSaveAsPrompt() {
  if (!sandboxState.activeResponse) {
    setSandboxStatus('Run an experiment first to save it.', 'danger');
    return;
  }
  loadPrompts();
  const values = getSandboxFormValues();
  const titlePreview = values.prompt.trim().slice(0, 32) || 'Sandbox Experiment';
  const newPrompt = {
    id: `sandbox-${Date.now()}`,
    title: `Sandbox Experiment – ${titlePreview}`,
    body: `${values.system ? `System:\n${values.system}\n\n` : ''}Prompt:\n${values.prompt}`,
    tags: ['sandbox'],
    model: values.model,
    temperature: values.temperature.toFixed(2),
    savedAt: Date.now(),
  };
  const updated = [...getPrompts(), newPrompt];
  setPrompts(updated);
  persistPrompts();
  setSelectedPromptId(newPrompt.id);
  updateSessionBadges(Date.now());
  setSandboxStatus('Saved as a prompt draft locally. Wire this into your prompts backend to persist.', 'success');
}

function setupSandboxPage() {
  const shell = document.getElementById('sandbox-app');
  if (!shell) return;
  loadPrompts();
  updateSessionBadges();
  renderHistory();
  renderResponse();
  document.getElementById('launch-btn')?.addEventListener('click', handleRun);
  document.getElementById('reset-btn')?.addEventListener('click', handleReset);
  document.getElementById('save-prompt-btn')?.addEventListener('click', handleSaveAsPrompt);
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

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('module-grid')) {
      renderModules();
      setupFilters();
      setupTabs();
      renderWorkflows();
      setupMetrics();
      setupForm();
    }
    setupThemeToggle();
    setupSandboxPage();
  });
}
