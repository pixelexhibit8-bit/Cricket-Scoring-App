const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'otf', 'ttf', 'OTF', 'TTF'])];

module.exports = config;
