module.exports = function (api) {
  api.cache.using(() => 'import-meta-polyfill');
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
          native: { unstable_transformImportMeta: true },
        },
      ],
    ],
  };
};
