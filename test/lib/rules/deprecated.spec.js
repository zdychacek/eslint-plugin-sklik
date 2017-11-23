'use strict';

const rule = require('../../../lib/rules/deprecated');
const RuleTester = require('eslint').RuleTester;

RuleTester.setDefaultConfig({
	parser: 'babel-eslint',
});

const ruleTester = new RuleTester();

ruleTester.run('deprecated', rule, {
	valid: [
		{
			code:
`
/**
 * @deprecated since 1.0
 */
function fn () {};
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
/**
 * @deprecated since 1.0
 */
class Foo {};
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
class Foo {
	/**
	 * Test method
	 * @param {String} a Some parameter
	 * @deprecated since 1.0
	 */
	method (a) {}
}
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
const Foo = class {
	/**
	 * Test method
	 * @param {String} a Some parameter
	 * @deprecated since 1.0
	 */
	method (a) {}
}
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
/**
 * @deprecated since 1.0
 */
const bar = 1;
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
const obj = {
	/**
	 * @deprecated since 1.0
	 */
	myProp () {}
}
`,
			options: [ { version: '1.0' } ],
		},
		{
			code:
`
/**
 * @deprecated since 1.0
 */
obj.a.b
`,
			options: [ { version: '1.0' } ],
		}
	],
	// ---------------- INVALID ----------------
	invalid: [
		{
			code:
`
/**
* @deprecated since 1.1-featA
*/
function fn () {};`,
			options: [ { version: '2.0.1' } ],
			errors: [ '"fn" is deprecated since version 1.1-featA. Current version is 2.0.1.' ],
		},
		{
			code:
`
/**
* @deprecated since 1.1-featA
*/
class Foo {};
`,
			options: [ { version: '1.2.1' } ],
			errors: [ '"Foo" is deprecated since version 1.1-featA. Current version is 1.2.1.' ],
		},
		{
			code:
`
class Foo {
	/**
	 * Test method
	 * @param {String} a Some parameter
	 * @deprecated since 1.0
	 */
	method (a) {}
}
`,
			options: [ { version: '2.0' } ],
			errors: [ '"Foo#method" is deprecated since version 1.0. Current version is 2.0.' ],
		},
		{
			code:
`
const Foo = class {
	/**
	 * Test method
	 * @param {String} a Some parameter
	 * @deprecated since 1.0
	 */
	method (a) {}
}
`,
			options: [ { version: '2.0' } ],
			errors: [ '"<class>#method" is deprecated since version 1.0. Current version is 2.0.' ],
		},
		{
			code:
`
/**
 * @deprecated since 1.0
 */
const bar = 1;
`,
			options: [ { version: '2.0' } ],
			errors: [ '"bar" is deprecated since version 1.0. Current version is 2.0.' ],
		},
		{
			code:
`
const obj = {
	/**
	 * @deprecated since 1.0
	 * @deprecatedReason That's why on
	 * multiline.
	 */
	myProp () {}
}
`,
			options: [ { version: '2.0' } ],
			errors: [ `"obj.myProp" is deprecated since version 1.0. Current version is 2.0.
Reason: That's why on
multiline.` ],
		},
		{
			code:
`
/**
 * @deprecated since 1.0
 */
obj.a.b
`,
			options: [ { version: '2.0' } ],
			errors: [ '"ExpressionStatement" is deprecated since version 1.0. Current version is 2.0.' ],
		}
	],
});
