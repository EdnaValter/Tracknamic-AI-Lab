export const routes = {
  workspace: { label: 'AI-Lab', href: 'index.html' },
  lab: { label: 'Lab Guide', href: 'lab.html' },
  sandbox: { label: 'Sandbox', href: 'sandbox.html' },
};

function buildNav(currentRoute) {
  return `
    <header class="top-bar">
      <div class="logo">Tracknamic AI Lab</div>
      <nav class="nav" aria-label="Primary navigation">
        ${Object.entries(routes)
          .map(
            ([key, value]) =>
              `<a href="${value.href}" data-route="${key}" ${key === currentRoute ? 'aria-current="page"' : ''}>${
                value.label
              }</a>`,
          )
          .join('')}
      </nav>
      <div class="actions">
        <button id="theme-toggle" class="ghost" aria-label="Toggle theme">🌗</button>
        <a class="primary" href="sandbox.html" data-route="sandbox">Launch Sandbox</a>
        <div id="user-chip" class="user-chip" hidden>
          <div class="user-text">
            <span id="user-name"></span>
            <span id="user-email" class="muted small"></span>
          </div>
          <button id="logout-button" class="ghost small">Log out</button>
        </div>
      </div>
    </header>
  `;
}

export function renderLayout(appRoot, currentRoute) {
  appRoot.innerHTML = `
    <div class="app-shell">
      ${buildNav(currentRoute)}
      <main class="page-container" role="main"></main>
      <footer class="footer">
        <p>Tracknamic AI Lab · Built for product-minded engineers.</p>
        <div class="footer-links">
          <a href="#hero">Back to top</a>
          <a href="sandbox.html" data-route="sandbox">Sandbox</a>
        </div>
      </footer>
    </div>
  `;

  const main = appRoot.querySelector('.page-container');

  const setActiveNav = (route) => {
    appRoot
      .querySelectorAll('a[data-route]')
      .forEach((anchor) => anchor.removeAttribute('aria-current'));
    const active = appRoot.querySelector(`a[data-route="${route}"]`);
    if (active) {
      active.setAttribute('aria-current', 'page');
    }
  };

  const bindNavigation = (onNavigate) => {
    appRoot.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-route]');
      if (!link) return;
      event.preventDefault();
      const route = link.getAttribute('data-route');
      onNavigate(route);
      setActiveNav(route);
    });
  };

  return { main, bindNavigation, setActiveNav };
}
