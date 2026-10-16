/** Register PWA service worker in production builds only. */
export function registerCounterSalePwa(): void {
  if (!import.meta.env.PROD) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
