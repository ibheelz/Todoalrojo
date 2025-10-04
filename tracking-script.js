/**
 * Todo al Rojo CRM Tracking Script
 *
 * This script should be embedded in landing pages to track user journeys.
 * It automatically captures clicks, page visits, and sends data to your CRM.
 *
 * Usage:
 * <script src="https://yourcrm.com/tracking-script.js"></script>
 * <script>
 *   TodoalrojoTracker.init({
 *     crmUrl: 'https://crm.mieladigital.com',
 *     trackClicks: true,
 *     trackPageViews: true
 *   });
 * </script>
 */

(function() {
  'use strict';

  // Configuration
  let config = {
    crmUrl: 'https://crm.mieladigital.com',
    trackClicks: true,
    trackPageViews: true,
    trackFormSubmissions: true,
    debug: false
  };

  // Utility functions
  function log(...args) {
    if (config.debug) {
      console.log('[TodoalrojoTracker]', ...args);
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      clickId: params.get('click_id') || params.get('clickid') || params.get('payload') || '',
      campaign: params.get('campaign') || params.get('utm_campaign') || '',
      source: params.get('source') || params.get('utm_source') || params.get('src') || '',
      medium: params.get('medium') || params.get('utm_medium') || '',
      content: params.get('content') || params.get('utm_content') || '',
      term: params.get('term') || params.get('utm_term') || '',
      subId1: params.get('sub1') || params.get('subid1') || '',
      subId2: params.get('sub2') || params.get('subid2') || '',
      subId3: params.get('sub3') || params.get('subid3') || '',
      subId4: params.get('sub4') || params.get('subid4') || '',
      subId5: params.get('sub5') || params.get('subid5') || ''
    };
  }

  function getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  function getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    };
  }

  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  function generateDeviceId() {
    // Simple device fingerprinting - in production you might want a more sophisticated approach
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return 'device_' + Math.abs(hash).toString(36);
  }

  function getClientIP() {
    // This will be determined server-side, but we can try to get it client-side too
    return fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => data.ip)
      .catch(() => '');
  }

  // Storage functions
  function setStorage(key, value) {
    try {
      localStorage.setItem('todoalrojo_' + key, JSON.stringify(value));
    } catch (e) {
      log('Failed to set localStorage:', e);
    }
  }

  function getStorage(key) {
    try {
      const value = localStorage.getItem('todoalrojo_' + key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      log('Failed to get localStorage:', e);
      return null;
    }
  }

  // Tracking functions
  async function trackClick() {
    try {
      log('Tracking click...');

      const urlParams = getUrlParams();
      const deviceInfo = getDeviceInfo();
      const pageInfo = getPageInfo();

      // Get or generate session and device IDs
      let sessionId = getStorage('sessionId');
      if (!sessionId) {
        sessionId = generateSessionId();
        setStorage('sessionId', sessionId);
      }

      let deviceId = getStorage('deviceId');
      if (!deviceId) {
        deviceId = generateDeviceId();
        setStorage('deviceId', deviceId);
      }

      // Store click_id for form submissions
      if (urlParams.clickId) {
        setStorage('clickId', urlParams.clickId);
      }

      const trackingData = {
        ...urlParams,
        sessionId,
        deviceId,
        ip: '', // Will be determined server-side
        userAgent: deviceInfo.userAgent,
        referrer: pageInfo.referrer,
        landingPage: pageInfo.url,
        pageTitle: pageInfo.title,
        timestamp: new Date().toISOString()
      };

      log('Sending click tracking data:', trackingData);

      const response = await fetch(`${config.crmUrl}/api/tracking/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        const result = await response.json();
        log('Click tracking successful:', result);

        // Store customer ID for later use
        if (result.data?.customerId) {
          setStorage('customerId', result.data.customerId);
        }

        return result;
      } else {
        log('Click tracking failed:', response.status);
      }

    } catch (error) {
      log('Click tracking error:', error);
    }
  }

  async function trackFormSubmission(formData) {
    try {
      log('Tracking form submission...');

      const urlParams = getUrlParams();
      const deviceInfo = getDeviceInfo();
      const pageInfo = getPageInfo();

      // Get stored data
      const sessionId = getStorage('sessionId');
      const deviceId = getStorage('deviceId');
      const clickId = getStorage('clickId') || urlParams.clickId;

      const trackingData = {
        // Form data
        ...formData,

        // Tracking data
        clickId,
        campaign: urlParams.campaign,
        source: urlParams.source,
        medium: urlParams.medium,
        referrer: pageInfo.referrer,
        landingPage: pageInfo.url,

        // Device data
        userAgent: deviceInfo.userAgent,
        language: deviceInfo.language,
        platform: deviceInfo.platform,

        // Timestamps
        timestamp: new Date().toISOString()
      };

      log('Sending form tracking data:', trackingData);

      const response = await fetch(`${config.crmUrl}/api/ingest/lead-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        const result = await response.json();
        log('Form tracking successful:', result);
        return result;
      } else {
        log('Form tracking failed:', response.status);
      }

    } catch (error) {
      log('Form tracking error:', error);
    }
  }

  // Auto-track form submissions
  function setupFormTracking() {
    if (!config.trackFormSubmissions) return;

    // Listen for form submissions
    document.addEventListener('submit', async function(event) {
      const form = event.target;

      // Check if this is a lead form (you can customize this selector)
      if (form.id === 'leadForm' || form.classList.contains('lead-form')) {
        log('Lead form submission detected');

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }

        // Send to CRM
        await trackFormSubmission(data);
      }
    });
  }

  // Initialize tracking
  function init(options = {}) {
    config = { ...config, ...options };
    log('Initializing tracker with config:', config);

    // Track page view immediately
    if (config.trackPageViews) {
      trackClick();
    }

    // Setup form tracking
    if (config.trackFormSubmissions) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFormTracking);
      } else {
        setupFormTracking();
      }
    }

    log('Tracker initialized successfully');
  }

  // Public API
  window.TodoalrojoTracker = {
    init,
    trackClick,
    trackFormSubmission,
    setConfig: function(newConfig) {
      config = { ...config, ...newConfig };
    },
    getConfig: function() {
      return { ...config };
    }
  };

  log('TodoalrojoTracker loaded');

})();