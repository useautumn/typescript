module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-prefix-selector': {
      prefix: '.au-root',
      transform: function (prefix, selector, prefixedSelector, filePath) {
        // Skip processing if selector already starts with our prefix
        if (selector.startsWith('.au-root')) {
          return selector;
        }

        if (selector.match(/^(html|body)/)) {
          return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
        }
        
        if (selector.match(/^(::?[\w-]+)/)) {
          return `${prefix} ${selector}`;
        }
        
        return prefixedSelector;
      },
      exclude: [/node_modules/],
    },
  }
}