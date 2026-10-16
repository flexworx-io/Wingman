// Google Analytics 4 for wingman.vip. Does nothing until VITE_GA_ID is set at build time.
// Only an id shaped G-XXXXXXXXXX is accepted. GA4 enhanced measurement (on by default)
// records the SPA's client-side route changes, so no manual page_view calls are needed.
const GA_ID: string = import.meta.env.VITE_GA_ID ?? "";
const VALID_GA_ID = /^G-[A-Z0-9]{4,16}$/;

type Gtag = (...args: unknown[]) => void;

export function initGoogleAnalytics(): void {
  if (typeof window === "undefined" || !VALID_GA_ID.test(GA_ID)) return;

  const w = window as unknown as { dataLayer: unknown[]; gtag: Gtag };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js expects the Arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}
