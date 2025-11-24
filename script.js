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

document.addEventListener('DOMContentLoaded', () => {
  renderModules();
  setupFilters();
  setupTabs();
  renderWorkflows();
  setupMetrics();
  setupForm();
  setupThemeToggle();
});
