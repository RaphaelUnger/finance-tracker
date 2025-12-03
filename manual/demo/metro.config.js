const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default Expo configuration
const config = getDefaultConfig(__dirname, {
  // Force this project to use only its own dependencies
  isCSSEnabled: true,
});

// Enable require.context feature
config.transformer.unstable_allowRequireContext = true;

// Completely isolate this project from parent directories
config.watchFolders = [];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Block all parent directories to prevent Metro conflicts
config.resolver.blockList = [
  /.*\/manual\/node_modules\/.*/,
  /.*\/finance-tracker\/node_modules\/.*/,
  // Block anything outside our demo directory
  /^(?!.*demo).*node_modules.*/,
];

// Ensure we only look in our own directory
config.projectRoot = __dirname;

module.exports = config;
