'use strict';

const fs = require('fs');
const semverCompare = require('semver-compare');
const commentParser = require('comment-parser');

const DEPRECATED_REASON_TAG = 'deprecatedReason';
const DEPRECATED_REASON_PARSE_REG_EXP = new RegExp(`@${DEPRECATED_REASON_TAG}\\s*`);

function getClassName (node, context) {
	if (node.parent.parent.id) {
		return node.parent.parent.id.name;
	}

	return '<class>';
}

function fromCamelCase (str) {
	return str
		.replace(/([A-Z])/g, (str) => ` ${str.toLowerCase()}`)
		.trim()
		.replace(/^./, (str) => str.toUpperCase());
}

function getNodeName (node, context) {
	switch (node.type) {
		case 'Identifier':
			return `"${node.name}"`;
		case 'VariableDeclaration': {
			const [ decl, ] = node.declarations;

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
		default:
			return node.id ? `"${node.id.name}"` : fromCamelCase(node.type);
	}
}

function findTag (jsdoc, tagName) {
	const tagNameLower = tagName.toLowerCase();

	return jsdoc.tags.filter((doc) => doc.tag.toLowerCase() === tagNameLower);
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

				const jsdoc = commentParser(`/*${lastComment}*/`)[0] || {};

				if (!Object.keys(jsdoc).length) {
					return;
				}

				const deprecatedTags = findTag(jsdoc, 'deprecated');

				if (!deprecatedTags.length) {
					return;
				}

				const [ firstTag ] = deprecatedTags;

				if (!firstTag.description) {
					return;
				}

				const { description: sinceVersion } = firstTag;
				const cleanedSinceVersion = cleanVersion(sinceVersion);

				if (!cleanedSinceVersion) {
					return;
				}

				const result = semverCompare(cleanedSinceVersion, currentVersion);

				if (!result && currentVersion !== sinceVersion || result <= 0) {
					const nodeName = getNodeName(node, context);
					let msg = `${nodeName} is deprecated since version ${sinceVersion}. Current version is ${currentVersion}.`;

					const deprecatedReason = findTag(jsdoc, DEPRECATED_REASON_TAG)[0];

					if (deprecatedReason) {
						const reason = deprecatedReason.source.replace(DEPRECATED_REASON_PARSE_REG_EXP, '');

						if (reason.length) {
							msg +=  ` (Reason: "${reason}")`;
						}
					}

					context.report(node, msg);
				}
			}
		};
	}
};
