import { renderLayout, routes } from './layout.js';
import { getViewTemplate } from './views.js';
import { getUserApiShape, renderUserControls, requireAuth } from './auth.js';
import { initializeLabUI, initializeSandboxUI, initializeWorkspaceUI, setupThemeToggle } from './script.js';

function resolveRouteFromPath() {
  const path = window.location.pathname;
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
    const userJson = document.getElementById('user-json');
    const user = getUserApiShape?.();
    if (user && userJson) {
      userJson.textContent = JSON.stringify(user, null, 2);
    }
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
