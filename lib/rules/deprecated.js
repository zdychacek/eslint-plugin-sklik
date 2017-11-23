'use strict';

const fs = require('fs');
const semverCompare = require('semver-compare');
const commentParser = require('comment-parser');

const DEPRECATED_REASON_TAG = 'deprecatedReason';
const DEPRECATED_REASON_PARSE_REG_EXP = new RegExp(`@${DEPRECATED_REASON_TAG}\\s*`);

function getNodeName (node) {
	switch (node.type) {
		case 'VariableDeclaration': {
			const [ decl, ] = node.declarations;

			return decl.id.name;
		}
		case 'MethodDefinition': {
			const methodName = node.key.name;
			let className = '<class>';

			if (node.parent.parent.id) {
				className = node.parent.parent.id.name;
			}

			return `${className}#${methodName}`;
		}
		case 'Property': {
			const objName = node.parent.parent.id.name;

			return `${objName}.${node.key.name}`;
		}
		default:
			return node.id ? node.id.name : node.type;
	}

	return node.type;
}

function findTag (jsdoc, tagName) {
	const tagNameLower = tagName.toLowerCase();

	return jsdoc.tags.filter((doc) => doc.tag.toLowerCase() === tagNameLower);
}

const SEMVER_REG_EXP = /^(\d+)(?:.(\d+))?(?:.(\d+))?(?:-.+)?$/;

function cleanVersion (version) {
	const [ , ...parts ] = SEMVER_REG_EXP.exec(version);

	return parts
		.filter((part) => part)
		.join('.');
}

function compareSemver (versionA, versionB) {
	return semverCompare(cleanVersion(versionA), cleanVersion(versionB));
}

module.exports = {
	meta: {
		schema: [
			{
				type: 'object',
				properties: {
					version: { type: 'string' },
				},
				additionalProperties: false,
			},
		],
	},
	create (context) {
		let currentVersionOption = context.options[0];

		if (currentVersionOption === undefined) {
			try {
				currentVersionOption = require('package.json').version;
			}
			catch (ex) {
				throw new Error('Cannot load current version from package.json file.');
			}
		}

		if (currentVersionOption === undefined) {
			throw new Error('Current version was specified nor cannot be loaded from package.json file.');
		}

		if (!currentVersionOption) {
			throw new Error('Missing actual version option.');
		}

		const { version: currentVersion } = currentVersionOption;

		return {
			'*'(node) {
				const { leadingComments } = node;

				if (!leadingComments || !leadingComments.length) {
					return;
				}

				const comments = node.leadingComments
					.filter((commnent) => commnent.type === 'Block')
					.map((comment) => comment.value);

				const lastComment = comments[comments.length - 1];

				const jsdoc = commentParser(`/*${lastComment}*/`)[0] || {};
				const deprecatedTags = findTag(jsdoc, 'deprecated');

				if (!deprecatedTags.length) {
					return;
				}

				const sinceVersion = deprecatedTags[0].description;

				if (compareSemver(sinceVersion, currentVersion)) {
					const nodeName = getNodeName(node);
					let msg = `"${nodeName}" is deprecated since version ${sinceVersion}. Current version is ${currentVersion}.`;

					const deprecatedReason = findTag(jsdoc, DEPRECATED_REASON_TAG)[0];

					if (deprecatedReason) {
						const reason = deprecatedReason.source.replace(DEPRECATED_REASON_PARSE_REG_EXP, '');

						msg += `\nReason: ${reason}`;
					}

					context.report(node, msg);
				}
			}
		};
	}
};
