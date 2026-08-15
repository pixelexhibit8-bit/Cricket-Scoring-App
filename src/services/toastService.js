/**
 * Global Toast & Notification Service for CricFlow
 * Replaces harsh native Alert.alert popups across the entire application.
 */

let listeners = [];

/**
 * Show a global toast feedback across any screen in the app.
 * @param {string} message - Feedback message
 * @param {'success' | 'error' | 'warning' | 'info'} type - Toast type
 * @param {string} [title] - Optional title
 * @param {number} [duration] - Duration in ms (default: 2600)
 */
export function showToast(message, type = 'info', title = '', duration = 2600) {
  listeners.forEach(fn => {
    try {
      fn({ visible: true, message, type, title, duration });
    } catch (e) {
      console.warn('Toast listener error:', e);
    }
  });
}

/**
 * Convenience helpers
 */
export const toast = {
  success: (msg, title = '') => showToast(msg, 'success', title),
  error: (msg, title = '') => showToast(msg, 'error', title),
  warning: (msg, title = '') => showToast(msg, 'warning', title),
  info: (msg, title = '') => showToast(msg, 'info', title)
};

/**
 * Subscribe to global toast notifications
 */
export function subscribeToast(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}
