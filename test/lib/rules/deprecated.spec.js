'use strict';

const rule = require('../../../lib/rules/deprecated');
const { RuleTester } = require('eslint');

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
 * @deprecated since 1.1.0
 */
function fn () {};
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
/**
 * @deprecated since 1.1
 */
class Foo {};
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
class Foo {
  /**
   * Test method
   * @param {String} a Some parameter
   * @deprecated since 1.1.0
   */
  method (a) {}
}
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
const Foo = class {
  /**
   * Test method
   * @param {String} a Some parameter
   * @deprecated since 1.1.0
   */
  method (a) {}
}
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
/**
 * @deprecated since 1.1.0
 */
const bar = 1;
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
const obj = {
  /**
   * @deprecated since 1.1.0
   */
  myProp () {}
}
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
/**
 * @deprecated since 1.1.0
 */
obj.a.b
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
/**
 * @deprecated since .1.0
 */
const a = 1;
`,
      options: [ '1.0.0' ],
    },
    {
      code:
`
/**
 * @deprecated
 */
const a = 1;
`,
      options: [ '1.0.0' ],
    },
  ],
  // ---------------- INVALID ----------------
  invalid: [
    {
      code:
`
/**
* @deprecated since 1.1.0-featA
*/
function fn () {};`,
      options: [ '2.0.1' ],
      errors: [ '"fn" is deprecated since version 1.1.0-featA. Current version is 2.0.1.' ],
    },
    {
      code:
`
/**
* @deprecated since 1.1.0-featA
*/
class Foo {};
`,
      options: [ '1.2.1' ],
      errors: [ '"Foo" is deprecated since version 1.1.0-featA. Current version is 1.2.1.' ],
    },
    {
      code:
`
class Foo {
  /**
   * Test method
   * @param {String} a Some parameter
   * @deprecated since 1.0.0
   */
  method (a) {}
}
`,
      options: [ '2.0.0' ],
      errors: [ '"Foo#method" is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
const Foo = class {
  /**
   * Test method
   * @param {String} a Some parameter
   * @deprecated since 1.0.0
   */
  method (a) {}
}
`,
      options: [ '2.0.0' ],
      errors: [ '"<class>#method" is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
/**
 * @deprecated since 1.0.0
 */
const bar = 1;
`,
      options: [ '2.0.0' ],
      errors: [ '"bar" is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
const obj = {
  /**
   * @deprecated since 1.0.0
   * @deprecated reason That's why on
   * multiline.
   */
  myProp () {}
}
`,
      options: [ '2.0.0' ],
      errors: [ `"obj.myProp" is deprecated since version 1.0.0. Current version is 2.0.0. (Reason: "That's why on
multiline.")` ],
    },
    {
      code:
`
/**
 * @deprecated since 1.0.0
 */
obj.a.b
`,
      options: [ '2.0.0' ],
      errors: [ 'Expression statement is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
class Foo {
  /**
   * @deprecated since 1.0.0
   */
  method = (a) => {};
}
`,
      options: [ '2.0.0' ],
      errors: [ '"Foo"\'s instance property "method" is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
class Foo {
  /**
   * @deprecated since 1.0.0
   */
  static myProperty = 'Ondrej';
}
`,
      options: [ '2.0.0' ],
      errors: [ '"Foo.myProperty" is deprecated since version 1.0.0. Current version is 2.0.0.' ],
    },
    {
      code:
`
/**
 * @deprecated since 1.2.0-feat
 */
const a = 1;
`,
      options: [ '1.2.0' ],
      errors: [ '"a" is deprecated since version 1.2.0-feat. Current version is 1.2.0.' ],
    },
    {
      code:
`
fn({
  /**
   * @deprecated since 1.2.0
   */
  name: 'Ondrej'
})
`,
      options: [ '1.2.0' ],
      errors: [ 'Property "name" of an object is deprecated since version 1.2.0. Current version is 1.2.0.' ],
    },
  ],
});
