export default {
  plugins: {
    'autoprefixer': {},
    'postcss-prefix-selector': {
      prefix: '.au-root',
      transform: function (prefix, selector, prefixedSelector, filePath) {
        // Skip Tailwind base styles
        if (selector.match(/^(:root|html|body)/)) {
          return selector;
        }
        
        // Skip dark mode selector
        if (selector === '.dark') {
          return selector;
        }

        // Skip if already prefixed
        if (selector.startsWith('.au-root')) {
          return selector;
        }

        if (selector.match(/^(::?[\w-]+)/)) {
          return `${prefix} ${selector}`;
        }
        
        return prefixedSelector;
      },
      exclude: [
        /node_modules/,
        /globals\.css$/ // Exclude globals.css from prefixing
      ],
    },
  }
}
