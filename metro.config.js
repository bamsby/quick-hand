// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolve problematic Node.js-specific imports in React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Ignore @supabase/node-fetch in React Native since native fetch is available
  if (moduleName === '@supabase/node-fetch') {
    return {
      type: 'empty',
    };
  }

  // Use the default resolver for all other imports
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

