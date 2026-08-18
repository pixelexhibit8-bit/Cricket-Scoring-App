/**
 * CricFlow Text & Name Utilities
 * Automatically capitalizes the first letter of each word in names, teams, and cities.
 */

export const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatPlayerName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return capitalizeWords(name.trim());
};
