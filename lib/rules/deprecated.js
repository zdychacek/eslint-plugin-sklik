'use strict';

const fs = require('fs');
const semverCompare = require('semver-compare');
const commentParser = require('comment-parser');

function getClassName (node) {
  if (node.parent.parent.id) {
    return node.parent.parent.id.name;
  }

  return '<class>';
}

function fromCamelCase (string) {
  return string
    .replace(/([A-Z])/g, (str) => ` ${str.toLowerCase()}`)
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

function getNodeName (node, context) {
  switch (node.type) {
  case 'Identifier':
    return `"${node.name}"`;
  case 'VariableDeclaration': {
    const [ decl ] = node.declarations;

    if (decl.id.type === 'ObjectPattern') {
      return 'Destructured variable';
    }

    return `"${decl.id.name}"`;
  }
  case 'MethodDefinition': {
    const methodName = node.key.name;

    return `"${getClassName(node, context)}#${methodName}"`;
  }
  case 'Property': {
    const propertyName = node.key.name;

    if (node.parent.parent.id) {
      return `"${node.parent.parent.id.name}.${propertyName}"`;
    }

    return `Property "${propertyName}" of an object`;
  }
  case 'ClassProperty': {
    const className = getClassName(node, context);
    const propertyName = node.key.name;

    if (node.static) {
      return `"${className}.${propertyName}"`;
    }
    else {
      return `"${className}"\'s instance property "${propertyName}"`;
    }
  }
  case 'JSXElement':
    return 'JSX element';
  default:
    return node.id ? `"${node.id.name}"` : fromCamelCase(node.type);
  }
}

function findTag (jsdoc, tag) {
  tag = tag.toLowerCase();

  return jsdoc.tags.filter((doc) => doc.tag.toLowerCase() === tag);
}

const SEMVER_REG_EXP = /^(\d+)(?:.(\d+))?(?:.(\d+))?(?:-.+)?$/;

function cleanVersion (version) {
  const result = SEMVER_REG_EXP.exec(version);

  if (!result) {
    return;
  }

  const [ , ...parts ] = result;

  return parts
    .filter((part) => part)
    .join('.');
}

module.exports = {
  meta: {
    schema: [
      {
        type: 'string',
      },
    ],
  },
  create (context) {
    let currentVersion = context.options[0];

    if (currentVersion === undefined) {
      try {
        ({ version: currentVersion } = JSON.parse(fs.readFileSync('package.json', 'utf8')));
      }
      catch (ex) {
        throw new Error('Cannot load current version from package.json file.');
      }
    }

    if (currentVersion === undefined) {
      throw new Error('Current version was specified nor cannot be loaded from package.json file.');
    }

    if (!currentVersion) {
      throw new Error('Missing actual version option.');
    }

    return {
      '*' (node) {
        const { leadingComments } = node;

        if (!leadingComments || !leadingComments.length) {
          return;
        }

        const comments = node.leadingComments
          .filter((commnent) => commnent.type === 'Block')
          .map((comment) => comment.value);

        const lastComment = comments[comments.length - 1];

        const jsdoc = commentParser(`/*${lastComment}*/`)[0];

        if (!jsdoc) {
          return;
        }

        const deprecatedTags = findTag(jsdoc, 'deprecated');

        if (!deprecatedTags.length) {
          return;
        }

        const sinceTag = deprecatedTags.find((tag) => tag.name.toLowerCase() === 'since');

        if (!sinceTag.description) {
          return;
        }

        const { description: sinceVersion } = sinceTag;
        const cleanedSinceVersion = cleanVersion(sinceVersion);

        if (!cleanedSinceVersion) {
          return;
        }

        const result = semverCompare(cleanedSinceVersion, currentVersion);

        if (!result && currentVersion !== sinceVersion || result <= 0) {
          const nodeName = getNodeName(node, context);
          let msg = `${nodeName} is deprecated since version ${sinceVersion}. Current version is ${currentVersion}.`;

          const reasonTag = deprecatedTags.find((tag) => tag.name.toLowerCase() === 'reason');

          if (reasonTag && reasonTag.description) {
            msg += ` (Reason: "${reasonTag.description}")`;
          }

          context.report(node, msg);
        }
      },
    };
  },
};
