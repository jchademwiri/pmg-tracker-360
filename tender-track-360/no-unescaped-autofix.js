// ESLint rule to detect and fix unescaped entities in JSX
export default {
  meta: {
    fixable: "code"
  },
  create: function(context) {
    // Helper function to escape special regex characters
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    return {
      JSXText: function(node) {
        const text = node.value;

        // Check for common unescaped entities
        const unescapedEntities = [
          { regex: /&(?![a-zA-Z#0-9]+;)/g, replacement: '&' },
          { regex: /</g, replacement: '<' },
          { regex: />/g, replacement: '>' },
          { regex: /"/g, replacement: '"' },
          { regex: /'/g, replacement: '&#x27;' }
        ];

        for (const entity of unescapedEntities) {
          if (entity.regex.test(text)) {
            context.report({
              node: node,
              message: 'Unescaped entity found. Consider using HTML entities.',
              fix: function(fixer) {
                const fixedText = text
                  .replace(/&(?![a-zA-Z#0-9]+;)/g, '&')
                  .replace(/</g, '<')
                  .replace(/>/g, '>')
                  .replace(/"/g, '"')
                  .replace(/'/g, '&#x27;');

                return fixer.replaceText(node, fixedText);
              }
            });
            break; // Only report once per text node
          }
        }
      }
    };
  }
};
