// The app can live at the site root or inside Straight Suite (for example /inventory/).
// BASE has no trailing slash: '' at the root, '/inventory' inside the Suite.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const appPath = (p: string) => BASE + p;
// The page path without the base, for comparing with '/login'
export const pagePath = () => window.location.pathname.slice(BASE.length) || '/';
