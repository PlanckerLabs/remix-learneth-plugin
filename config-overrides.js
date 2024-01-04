module.exports = function override(config, env) {
  // ignore source-map-loader warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
};
