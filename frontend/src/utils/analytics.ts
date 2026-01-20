import ReactGA from 'react-ga4';

let analyticsReady = false;

export function initAnalytics(measurementId?: string) {
  if (!measurementId || analyticsReady) return;
  ReactGA.initialize(measurementId);
  analyticsReady = true;
}

export function trackPageView(path: string) {
  if (!analyticsReady) return;
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!analyticsReady) return;
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
  ReactGA.event(name, cleaned);
}

export function setUserProperties(props: Record<string, string | number | boolean | null | undefined>) {
  if (!analyticsReady) return;
  const cleaned = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  );
  ReactGA.gtag('set', 'user_properties', cleaned);
}
