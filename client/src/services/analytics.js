const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;

export const initMetaPixel = () => {
  if (initialized || !META_PIXEL_ID || typeof window === 'undefined') return false;

  if (typeof window.fbq === 'function' && window.fbq.loaded) {
    initialized = true;
    window.fbq('init', META_PIXEL_ID);
    return true;
  }

  window.fbq = window.fbq || function (...args) {
    window.fbq.callMethod ? window.fbq.callMethod(...args) : window.fbq.queue.push(args);
  };
  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = window.fbq.queue || [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', META_PIXEL_ID);
  initialized = true;
  return true;
};

export const trackEvent = (eventName, parameters = {}) => {
  if (!META_PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, parameters);
};

export const trackPageView = () => trackEvent('PageView');

export const trackEventOnce = (eventName, eventId, parameters = {}) => {
  if (typeof window === 'undefined') return false;

  const storageKey = `meta_pixel_${eventName}_${eventId}`;
  if (window.sessionStorage.getItem(storageKey)) return false;

  window.sessionStorage.setItem(storageKey, '1');
  trackEvent(eventName, parameters);
  return true;
};

export const isAnalyticsConfigured = Boolean(META_PIXEL_ID);
