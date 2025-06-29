module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-nested": {},
    // 'postcss-prefix-selector': {
    //   prefix: '.au-root',
    //   transform: function (prefix, selector, prefixedSelector) {
    //     if (selector.match(/^(html|body)/)) {
    //       return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
    //     }
        
    //     if (selector.match(/^(::?[\w-]+)/)) {
    //       return `${prefix}${selector}`;
    //     }
        
    //     if (selector.includes('*')) {
    //       return prefixedSelector;
    //     }
        
    //     return prefixedSelector;
    //   },
    // },
  }
}