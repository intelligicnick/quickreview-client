/** Keep counter-sale PWA fresh: check for SW updates and reload when the app is opened again. */

function isCounterSaleRoute(): boolean {
  return window.location.pathname.startsWith('/counter-sale');
}

export function installCounterSalePwaRefresh(): void {
  if (!import.meta.env.PROD || !isCounterSaleRoute()) return;

  let hiddenAt: number | null = null;
  let registering = false;

  const register = () => {
    if (registering) return;
    registering = true;
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            location.reload();
          },
          onRegisteredSW(_url, registration) {
            if (!registration) return;
            void registration.update();
          },
        });
      })
      .catch(() => {
        /* PWA plugin optional in some builds */
      });
  };

  register();

  document.addEventListener('visibilitychange', () => {
    if (!isCounterSaleRoute()) return;

    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }

    if (document.visibilityState !== 'visible') return;

    void navigator.serviceWorker?.getRegistration().then((reg) => {
      void reg?.update();
    });

    if (hiddenAt !== null) {
      hiddenAt = null;
      location.reload();
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (!isCounterSaleRoute()) return;
    if (event.persisted) location.reload();
  });
}
