/**
 * Check if the app is running in PWA / standalone mode.
 * Works on both Android (display-mode: standalone) and iOS (navigator.standalone).
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true
  );
}
