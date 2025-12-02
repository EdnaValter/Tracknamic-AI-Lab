import { renderLayout, routes } from './layout.js';
import { getViewTemplate } from './views.js';
import { getUserApiShape, renderUserControls, requireAuth } from './auth.js';
import { initializeSandboxUI, initializeWorkspaceUI, setupThemeToggle } from './script.js';
import { initializeLabUI } from './lab.js';

function resolveRouteFromPath() {
  const path = window.location.pathname;
  if (path.includes('library')) return 'library';
  if (path.includes('lab')) return 'lab';
  if (path.includes('sandbox')) return 'sandbox';
  return 'workspace';
}

function mountView(mainEl, route) {
  const template = getViewTemplate(route);
  mainEl.innerHTML = template;

  if (route === 'workspace') {
    initializeWorkspaceUI();
  }
  if (route === 'sandbox') {
    initializeSandboxUI();
  }
  if (route === 'lab') {
    initializeLabUI();
  }
}

function bootApp() {
  requireAuth('/login.html');
  const appRoot = document.getElementById('app-root');
  const initialRoute = resolveRouteFromPath();
  const { main, bindNavigation, setActiveNav } = renderLayout(appRoot, initialRoute);

  renderUserControls();
  setupThemeToggle();
  mountView(main, initialRoute);
  let activeRoute = initialRoute;
  bindNavigation((nextRoute) => {
    if (!routes[nextRoute]) return;
    if (nextRoute === activeRoute) return;
    activeRoute = nextRoute;
    window.history.pushState({}, '', routes[nextRoute].href);
    mountView(main, nextRoute);
  });

  window.addEventListener('popstate', () => {
    const route = resolveRouteFromPath();
    activeRoute = route;
    setActiveNav(route);
    mountView(main, route);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bootApp);
}
