/**
 * @fileoverview Rule to require object keys to be sorted
 * @author Toru Nagashima
 */

'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const astUtils = require('../util/ast-utils')

const naturalCompare = require('natural-compare')

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Gets the property name of the given `Property` node.
 *
 * - If the property's key is an `Identifier` node, this returns the key's name
 *   whether it's a computed property or not.
 * - If the property has a static name, this returns the static name.
 * - Otherwise, this returns null.
 *
 * @param {ASTNode} node - The `Property` node to get.
 * @returns {string|null} The property name or null.
 * @private
 */
function getPropertyName(node) {
  const staticName = astUtils.getStaticPropertyName(node)

  if (staticName !== null) {
    return staticName
  }

  return node.key.name || null
}

/**
 * Functions which check that the given 2 names are in specific order.
 *
 * Postfix `I` is meant insensitive.
 * Postfix `N` is meant natual.
 *
 * @private
 */
const isValidOrders = {
  asc(a, b) {
    return a <= b
  },
  ascI(a, b) {
    return a.toLowerCase() <= b.toLowerCase()
  },
  ascN(a, b) {
    return naturalCompare(a, b) <= 0
  },
  ascIN(a, b) {
    return naturalCompare(a.toLowerCase(), b.toLowerCase()) <= 0
  },
  desc(a, b) {
    return isValidOrders.asc(b, a)
  },
  descI(a, b) {
    return isValidOrders.ascI(b, a)
  },
  descN(a, b) {
    return isValidOrders.ascN(b, a)
  },
  descIN(a, b) {
    return isValidOrders.ascIN(b, a)
  },
}

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'require object keys to be sorted',
      category: 'Stylistic Issues',
      recommended: false,
      url: 'https://github.com/leo-buneev/eslint-plugin-sort-keys-fix',
    },

    schema: [
      {
        enum: ['asc', 'desc'],
      },
      {
        type: 'object',
        properties: {
          caseSensitive: {
            type: 'boolean',
          },
          natural: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    // Parse options.
    const order = context.options[0] || 'asc'
    const options = context.options[1]
    const insensitive = (options && options.caseSensitive) === false
    const natual = Boolean(options && options.natural)
    const isValidOrder = isValidOrders[order + (insensitive ? 'I' : '') + (natual ? 'N' : '')]

    // The stack to save the previous property's name for each object literals.
    let stack = null

    return {
      ObjectExpression() {
        stack = {
          upper: stack,
          prevName: null,
          prevNode: null,
        }
      },

      'ObjectExpression:exit'() {
        stack = stack.upper
      },

      SpreadElement(node) {
        if (node.parent.type === 'ObjectExpression') {
          stack.prevName = null
        }
      },

      Property(node) {
        if (node.parent.type === 'ObjectPattern') {
          return
        }

        const prevName = stack.prevName
        const prevNode = stack.prevNode
        const thisName = getPropertyName(node)

        if (thisName !== null) {
          stack.prevName = thisName
          stack.prevNode = node || prevNode
        }

        if (prevName === null || thisName === null) {
          return
        }

        if (!isValidOrder(prevName, thisName)) {
          context.report({
            node,
            loc: node.key.loc,
            message:
              "Expected object keys to be in {{natual}}{{insensitive}}{{order}}ending order. '{{thisName}}' should be before '{{prevName}}'.",
            data: {
              thisName,
              prevName,
              order,
              insensitive: insensitive ? 'insensitive ' : '',
              natual: natual ? 'natural ' : '',
            },
            fix(fixer) {
              const sourceCode = context.getSourceCode()
              const thisText = sourceCode.getText(node)
              const prevText = sourceCode.getText(prevNode)

              // Find inline comments on the line to be moved, and move them too
              const commaToken = sourceCode.getTokenAfter(node)
              const possibleComment = sourceCode.getTokenAfter(commaToken, { includeComments: true })
              const prevNodeCommaToken = sourceCode.getTokenAfter(prevNode)

              if (commaToken && commaToken.value === ',' && possibleComment && possibleComment.type === 'Line') {
                return [
                  fixer.replaceText(node, prevText),
                  fixer.replaceText(prevNode, thisText),
                  fixer.insertTextAfter(prevNodeCommaToken, ' //' + possibleComment.value),
                  // Tried just removing the comment node: `fixer.remove(possibleComment)` but
                  // that leaves a single whitespace at the end of the line.
                  fixer.replaceTextRange([possibleComment.range[0] - 1, possibleComment.range[1]], ''),
                ]
              }

              return [fixer.replaceText(node, prevText), fixer.replaceText(prevNode, thisText)]
            },
          })
        }
      },
    }
  },
}
