const workspaceView = `
  <section class="panel prompts" id="prompts">
    <div class="section-header">
      <div>
        <p class="eyebrow">Prompt workspace</p>
        <h2>Shareable prompt feed</h2>
        <p class="muted">Create, edit, react, and discuss with your team. Search, sort, and save prompts to your workspace.</p>
      </div>
      <div class="prompt-controls">
        <label class="search" for="prompt-search">
          <span class="sr-only">Search prompts</span>
          <input id="prompt-search" type="search" placeholder="Search prompts or @mention" />
        </label>
        <select id="prompt-sort" aria-label="Sort prompts">
          <option value="newest">Newest</option>
          <option value="reactions">Most reacted</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>
    </div>

    <div class="prompt-layout">
      <div class="prompt-composer" aria-label="Prompt composer">
        <h3>Compose prompt</h3>
        <form id="prompt-form" novalidate>
          <label>
            <span>Title</span>
            <input id="prompt-title" type="text" name="title" required placeholder="Summarize API logs for anomalies" />
            <small class="error" id="error-title" aria-live="polite"></small>
          </label>
          <label>
            <span>Body</span>
            <textarea id="prompt-body" name="body" rows="5" required placeholder="You are an observability expert…"></textarea>
            <small class="error" id="error-body" aria-live="polite"></small>
          </label>
          <label>
            <span>Tags (comma separated)</span>
            <input id="prompt-tags" type="text" name="tags" placeholder="ops, observability, incidents" />
          </label>
          <label>
            <span>What works</span>
            <input id="prompt-tip" type="text" name="tip" placeholder="Add runbook links and severity scale" />
          </label>
          <div class="composer-actions">
            <div class="inline">
              <button class="primary" type="submit" id="prompt-submit">Submit</button>
              <button class="secondary" type="button" id="prompt-preview-btn">Preview</button>
              <button class="ghost" type="button" id="prompt-reset">Reset</button>
            </div>
            <div class="status" id="prompt-status" aria-live="polite"></div>
          </div>
          <div class="preview" id="prompt-preview" hidden>
            <div class="preview-header">Preview</div>
            <div class="preview-body" id="prompt-preview-body"></div>
          </div>
        </form>
      </div>

      <div class="prompt-feed" aria-live="polite">
        <div class="feed-toolbar">
          <div class="chip-row" id="tag-filter" aria-label="Filter by tag"></div>
          <div class="pill" id="pagination-status">Loading…</div>
        </div>
        <div id="prompt-list" class="prompt-list"></div>
        <button class="secondary" id="load-more" type="button">Load more</button>
      </div>

      <aside class="prompt-sidebar" aria-label="Discovery">
        <div class="card">
          <h4>Top prompts this week</h4>
          <ul id="top-prompts" class="sidebar-list"></ul>
        </div>
        <div class="card">
          <h4>Trending tags</h4>
          <div id="trending-tags" class="chip-row"></div>
        </div>
        <div class="card">
          <h4>Recently updated</h4>
          <ul id="recent-prompts" class="sidebar-list"></ul>
        </div>
        <div class="card">
          <h4>Activity</h4>
          <ul id="activity-feed" class="sidebar-list"></ul>
        </div>
      </aside>
    </div>
  </section>
  <section class="panel overview" id="overview">
    <div class="section-header">
      <div>
        <p class="eyebrow">What's included</p>
        <h2>Everything you can explore on this page</h2>
        <p class="muted">Preview the full lab experience at a glance: authoring, collaboration, AI services, and the sandbox you can launch from the top bar.</p>
      </div>
      <div class="pill">Prompt feed · AI lab · Sandbox</div>
    </div>
    <div class="grid grid-3 feature-grid">
      <div class="card feature-card">
        <div class="feature-icon" aria-hidden="true">🧠</div>
        <h3>Prompt workspace</h3>
        <p class="muted">Compose prompts with validation, see real-time previews, and publish to the shared feed.</p>
        <ul class="bullets">
          <li>Compose, preview, and reset controls in the left rail</li>
          <li>Sortable feed with tag filters, reactions, and pagination</li>
          <li>Detail modal with comments, related prompts, and sharing</li>
        </ul>
      </div>
      <div class="card feature-card">
        <div class="feature-icon" aria-hidden="true">⚙️</div>
        <h3>AI service layer</h3>
        <p class="muted">A guided overview of the optimizers, summarizers, and retrieval utilities we expose.</p>
        <ul class="bullets">
          <li>Model-agnostic APIs with rate limits and observability hooks</li>
          <li>Latency-aware summaries for feeds and notifications</li>
          <li>Hybrid discovery powered by embeddings, tags, and recency</li>
        </ul>
      </div>
      <div class="card feature-card">
        <div class="feature-icon" aria-hidden="true">🧪</div>
        <h3>Sandbox launch</h3>
        <p class="muted">Jump into the sandbox to tweak providers, prompts, temperature, and safety settings.</p>
        <ul class="bullets">
          <li>Launch via the header button for live prompt experiments</li>
          <li>Provider, model, and safety controls with instant feedback</li>
          <li>Response history to compare outputs across iterations</li>
        </ul>
      </div>
    </div>
  </section>
  <section class="hero" id="hero">
    <div class="hero-text">
      <p class="eyebrow">Developer-first prompt lab</p>
      <h1>Experiment, share, and scale AI prompts with confidence.</h1>
      <p class="lede">Tracknamic AI Lab bundles structured prompt authoring, team collaboration, and real-time insights into one sleek workspace.</p>
      <div class="cta-row">
        <button class="primary">Start building</button>
        <button class="ghost">View public gallery</button>
      </div>
      <div class="stats" role="list">
        <div class="stat" role="listitem">
          <span class="value">120+</span>
          <span class="label">Optimized prompts</span>
        </div>
        <div class="stat" role="listitem">
          <span class="value">16ms</span>
          <span class="label">Median latency</span>
        </div>
        <div class="stat" role="listitem">
          <span class="value">99.9%</span>
          <span class="label">Uptime</span>
        </div>
      </div>
    </div>
    <div class="hero-card" aria-label="Prompt editor preview">
      <div class="card-header">
        <div class="pill">Prompt draft</div>
        <div class="status success">Optimized</div>
      </div>
      <div class="editor">
        <div class="editor-line"># Persona</div>
        <div class="editor-line">You are a senior TS mentor teaching clean architecture.</div>
        <div class="editor-line"># Task</div>
        <div class="editor-line">Explain repository patterns with examples.</div>
      </div>
      <div class="card-footer">
        <button class="secondary">Improve</button>
        <button class="primary">Summarize</button>
      </div>
    </div>
  </section>
  <section class="modal" id="prompt-modal" hidden aria-label="Prompt detail">
    <div class="modal-content">
      <header class="modal-header">
        <div>
          <p class="eyebrow" id="modal-meta"></p>
          <h3 id="modal-title"></h3>
        </div>
        <button class="ghost" id="prompt-modal-close" aria-label="Close">✕</button>
      </header>
      <p class="muted" id="modal-tip"></p>
      <div class="pill-row" id="modal-tags"></div>
      <p id="modal-body"></p>
      <div class="modal-footer">
        <span id="modal-reactions"></span>
        <div class="inline">
          <button class="secondary" data-action="react" data-type="like">👍 Like</button>
          <button class="ghost" data-action="react" data-type="celebrate">🎉 Celebrate</button>
          <button class="ghost" data-action="share">Copy prompt</button>
        </div>
      </div>
      <div class="comments">
        <h4>Threaded comments</h4>
        <form id="comment-form" data-prompt="" aria-label="Add comment">
          <input type="hidden" name="parentId" />
          <label class="sr-only" for="comment-input">Comment</label>
          <textarea id="comment-input" name="comment" rows="3" placeholder="Add a markdown-friendly comment"></textarea>
          <div class="inline">
            <button class="primary" type="submit">Comment</button>
            <button class="ghost" type="button" onclick="document.getElementById('comment-form').reset()">Reset</button>
          </div>
        </form>
        <ul id="comment-list" class="comment-list"></ul>
      </div>
      <div class="related">
        <h4>Related prompts</h4>
        <ul id="related-prompts"></ul>
      </div>
    </div>
  </section>
`;

const labView = `
  <section class="panel lab-panel lab-feed">
    <div class="lab-hero">
      <div>
        <p class="eyebrow">AI Lab</p>
        <h1>Explore shared prompts</h1>
        <p class="muted">Browse curated prompts, then jump into details to iterate in the sandbox.</p>
      </div>
      <div class="lab-search-row">
        <label class="search" for="lab-search">
          <span>Search prompts</span>
          <input id="lab-search" type="search" placeholder="Search by title, problem, or context" />
        </label>
        <div class="chip-row" id="lab-tag-chips" aria-label="Filter by tag"></div>
      </div>
    </div>

    <div class="lab-sections">
      <section class="lab-section" aria-label="Featured prompt">
        <div class="section-header compact">
          <div>
            <p class="eyebrow">Featured</p>
            <h2>Prompt spotlight</h2>
          </div>
        </div>
        <div id="featured-card" class="prompt-grid"></div>
      </section>

      <section class="lab-section" aria-label="Latest prompts">
        <div class="section-header compact">
          <div>
            <p class="eyebrow">Latest</p>
            <h2>Latest prompts</h2>
          </div>
          <div class="lab-controls" aria-label="Prompt controls">
            <div class="active-filter-row" id="lab-active-filters"></div>
            <label class="sr-only" for="lab-sort">Sort prompts</label>
            <select id="lab-sort" aria-label="Sort prompts">
              <option value="newest">Newest</option>
              <option value="liked">Most liked</option>
              <option value="bookmarked">Most bookmarked</option>
            </select>
          </div>
        </div>
        <p class="muted small" id="lab-status" role="status">Loading prompts...</p>
        <div id="prompt-grid" class="prompt-grid"></div>
      </section>

      <section class="lab-section" id="prompt-detail" hidden aria-live="polite"></section>
    </div>
  </section>
`;

const sandboxView = `
  <div class="sandbox-main">
  <section class="sandbox-hero">
    <div>
      <p class="eyebrow">Launch Sandbox</p>
      <h1>Experiment with prompts in real-time.</h1>
      <p class="lede">Tune system behavior, prompt wording, and model parameters. Capture great experiments as reusable prompts for your team.</p>
      <div class="pill-row">
        <span class="pill">Model router ready</span>
        <span class="pill">Local history</span>
        <span class="pill">Dark mode friendly</span>
      </div>
    </div>
    <div class="hero-card">
      <div class="card-header">
        <div class="pill">Session state</div>
        <div class="status success">Live</div>
      </div>
      <div class="mini-grid">
        <div>
          <p class="muted small">Last run</p>
          <p class="value" id="last-run-time">—</p>
        </div>
        <div>
          <p class="muted small">Saved prompts</p>
          <p class="value" id="prompt-count">—</p>
        </div>
      </div>
    </div>
  </section>
  <section class="panel sandbox-shell" id="sandbox-app">
    <div class="sandbox-grid">
      <div class="sandbox-column">
        <div class="section-header compact">
          <div>
            <p class="eyebrow">Prompt configuration</p>
            <h2>Compose your experiment</h2>
            <p class="muted">Adjust the system role, user prompt, and inference settings before launching.</p>
          </div>
          <div class="sandbox-actions">
            <button class="ghost" id="reset-btn" type="button">Reset</button>
            <button class="primary" id="launch-btn" type="button">Launch</button>
          </div>
        </div>
        <div class="field-group">
          <label class="field">
            <span>System / instructions <span class="muted">(optional)</span></span>
            <textarea id="system-input" rows="4" placeholder="You are a concise assistant that answers with short code snippets and explanations."></textarea>
          </label>
          <label class="field">
            <span>User prompt</span>
            <textarea id="user-input" rows="6" placeholder="Ask the model anything..."></textarea>
          </label>
          <label class="field">
            <span>Input</span>
            <textarea id="input-text" rows="4" placeholder="Paste relevant context or data for the model..."></textarea>
          </label>
          <div class="grid grid-2">
            <label class="field">
              <span>Model</span>
              <select id="model-select">
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              </select>
            </label>
            <label class="field slider-field">
              <div class="field-label">
                <span>Temperature</span>
                <span class="muted" id="temperature-value">0.20</span>
              </div>
              <input type="range" id="temperature-input" min="0" max="1" step="0.01" value="0.2" />
            </label>
            <label class="field slider-field">
              <div class="field-label">
                <span>Max tokens</span>
                <span class="muted" id="max-tokens-value">512</span>
              </div>
              <input type="range" id="max-tokens-input" min="64" max="2048" step="16" value="512" />
            </label>
          </div>
        </div>
        <p class="muted small" id="sandbox-status" role="status">Waiting for your first experiment.</p>
      </div>

      <div class="sandbox-column response-column">
        <div class="section-header compact">
          <div>
            <p class="eyebrow">AI response</p>
            <h2>Results & history</h2>
            <p class="muted">Review the latest output or restore a previous run.</p>
          </div>
          <button class="secondary" id="save-prompt-btn" type="button">Save as prompt</button>
        </div>
        <div class="response-card" aria-live="polite">
          <div class="response-meta">
            <span id="token-usage" class="muted small"></span>
            <span id="response-model" class="pill">Live sandbox</span>
          </div>
          <pre id="response-body" class="response-body">Run the sandbox to see output.</pre>
        </div>
        <div class="history-panel">
          <div class="history-header">
            <h3>Session history</h3>
            <span class="muted small">Click an item to restore</span>
          </div>
          <div id="history-list" class="history-list" aria-live="polite"></div>
        </div>
      </div>
    </div>
  </section>
  </div>
`;

export function getViewTemplate(route) {
  if (route === 'lab') return labView;
  if (route === 'sandbox') return sandboxView;
  return workspaceView;
}
