const state = {
  prompts: [],
  tags: [],
  featured: null,
  searchTerm: '',
  activeTag: '',
  detailId: null,
};

const debounce = (fn, delay = 250) => {
  let handle;
  return (...args) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
};

function getDetailIdFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'lab') return null;
  return segments[1] ?? null;
}

function applyQueryParams({ q, tag } = {}) {
  const url = new URL(window.location.href);
  if (q) {
    url.searchParams.set('q', q);
  } else {
    url.searchParams.delete('q');
  }
  if (tag) {
    url.searchParams.set('tag', tag);
  } else {
    url.searchParams.delete('tag');
  }
  window.history.replaceState({}, '', url.toString());
}

function formatReactions(summary = {}) {
  const likes = summary.LIKE ?? 0;
  const saves = summary.BOOKMARK ?? 0;
  return { likes, saves };
}

function renderPromptCard(prompt) {
  const { likes, saves } = formatReactions(prompt.reactionSummary);
  const tags = prompt.tags?.map(({ tag }) => `<span class="chip ghost">${tag.name}</span>`).join('') ?? '';
  const author = prompt.author?.name ? `<span class="muted small">by ${prompt.author.name}</span>` : '';
  return `
    <a class="prompt-card" href="/lab/${prompt.id}" data-prompt-id="${prompt.id}">
      <div class="prompt-card-header">
        <div>
          <p class="eyebrow">${new Date(prompt.createdAt).toLocaleDateString()}</p>
          <h3>${prompt.title}</h3>
          ${author}
        </div>
      </div>
      <p class="prompt-problem">${prompt.problem}</p>
      <div class="prompt-card-meta">
        <div class="tag-row">${tags}</div>
        <div class="reaction-row">
          <span class="reaction-badge">👍 ${likes}</span>
          <span class="reaction-badge">🔖 ${saves}</span>
        </div>
      </div>
    </a>
  `;
}

function renderPromptList(container, prompts) {
  if (!container) return;
  if (!prompts?.length) {
    container.innerHTML = '<p class="muted">No prompts found yet.</p>';
    return;
  }
  container.innerHTML = prompts.map(renderPromptCard).join('');
}

function renderTagFilters(container, tags, activeTag) {
  if (!container) return;
  const subset = tags.slice(0, 8);
  container.innerHTML = subset
    .map(
      (tag) => `
        <button class="chip ${tag.name.toLowerCase() === activeTag?.toLowerCase() ? 'active' : ''}" data-tag="${tag.name}">
          #${tag.name}
        </button>
      `,
    )
    .join('');
}

function setStatus(message) {
  const statusEl = document.getElementById('lab-status');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.hidden = !message;
}

function chooseFeatured(prompts) {
  if (!prompts?.length) return null;
  const sorted = [...prompts].sort((a, b) => {
    const likeDiff = (b.reactionSummary?.LIKE ?? 0) - (a.reactionSummary?.LIKE ?? 0);
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return sorted[0];
}

function renderFeatured(prompt) {
  const container = document.getElementById('featured-card');
  if (!container) return;
  if (!prompt) {
    container.innerHTML = '<p class="muted">No featured prompt yet.</p>';
    return;
  }
  container.innerHTML = renderPromptCard(prompt);
}

async function fetchPrompts() {
  const params = new URLSearchParams();
  if (state.searchTerm) params.set('q', state.searchTerm);
  if (state.activeTag) params.set('tag', state.activeTag);
  const query = params.toString();
  const response = await fetch(query ? `/api/prompts?${query}` : '/api/prompts');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Unable to load prompts');
  }
  return response.json();
}

async function fetchPromptDetail(id) {
  if (!id) return null;
  const response = await fetch(`/prompts/${id}`);
  if (!response.ok) throw new Error('Prompt not found');
  return response.json();
}

function renderPromptDetail(prompt) {
  const container = document.getElementById('prompt-detail');
  if (!container) return;
  if (!prompt) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const { likes, saves } = formatReactions(prompt.reactionSummary);
  const tags = prompt.tags?.map(({ tag }) => `<span class="chip ghost">${tag.name}</span>`).join('');
  container.hidden = false;
  container.innerHTML = `
    <div class="detail-card">
      <p class="eyebrow">Prompt detail</p>
      <h2>${prompt.title}</h2>
      <p class="muted">${prompt.problem}</p>
      <div class="detail-meta">
        <div class="tag-row">${tags || ''}</div>
        <div class="reaction-row">
          <span class="reaction-badge">👍 ${likes}</span>
          <span class="reaction-badge">🔖 ${saves}</span>
        </div>
      </div>
      <p class="muted small">Full prompt page coming soon.</p>
    </div>
  `;
}

function bindCardNavigation(container) {
  if (!container) return;
  container.addEventListener('click', (event) => {
    const anchor = event.target.closest('.prompt-card');
    if (!anchor) return;
    const promptId = anchor.dataset.promptId;
    if (!promptId) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.pathname = `/lab/${promptId}`;
    window.history.pushState({}, '', url.toString());
    state.detailId = promptId;
    fetchPromptDetail(promptId)
      .then((prompt) => renderPromptDetail(prompt))
      .catch(() => renderPromptDetail(null));
  });
}

async function hydrateLab() {
  try {
    setStatus('Loading prompts...');
    const data = await fetchPrompts();
    state.prompts = data.prompts ?? [];
    state.tags = data.tags ?? [];
    setStatus(state.prompts.length ? '' : 'No prompts found.');
    renderTagFilters(document.getElementById('lab-tag-chips'), state.tags, state.activeTag);
    renderPromptList(document.getElementById('prompt-grid'), state.prompts);
    state.featured = chooseFeatured(state.prompts);
    renderFeatured(state.featured);
  } catch (error) {
    setStatus(error.message);
  }
}

async function hydrateDetailFromPath() {
  const detailId = getDetailIdFromPath();
  state.detailId = detailId;
  if (!detailId) {
    renderPromptDetail(null);
    return;
  }
  try {
    const prompt = await fetchPromptDetail(detailId);
    renderPromptDetail(prompt);
  } catch (error) {
    renderPromptDetail(null);
    setStatus(error.message);
  }
}

export function initializeLabUI() {
  const searchInput = document.getElementById('lab-search');
  const tagContainer = document.getElementById('lab-tag-chips');
  const promptGrid = document.getElementById('prompt-grid');
  const featuredGrid = document.getElementById('featured-card');

  state.searchTerm = new URLSearchParams(window.location.search).get('q') ?? '';
  state.activeTag = new URLSearchParams(window.location.search).get('tag') ?? '';
  state.detailId = getDetailIdFromPath();

  if (searchInput) {
    searchInput.value = state.searchTerm;
    searchInput.addEventListener(
      'input',
      debounce((event) => {
        state.searchTerm = event.target.value.trim();
        applyQueryParams({ q: state.searchTerm, tag: state.activeTag });
        hydrateLab();
      }, 200),
    );
  }

  if (tagContainer) {
    tagContainer.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      const tagValue = button.dataset.tag;
      state.activeTag = state.activeTag === tagValue ? '' : tagValue;
      applyQueryParams({ q: state.searchTerm, tag: state.activeTag });
      hydrateLab();
    });
  }

  bindCardNavigation(promptGrid);
  bindCardNavigation(featuredGrid);

  hydrateLab();
  hydrateDetailFromPath();
}
