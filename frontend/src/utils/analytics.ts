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
  ReactGA.event(name, params);
}

export function setUserProperties(props: Record<string, string | number | boolean | null | undefined>) {
  if (!analyticsReady) return;
  ReactGA.gtag('set', 'user_properties', props);
}
