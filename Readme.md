# Sklik ESLint rules

Instalation:

`npm i @sklik/eslint-plugin-sklik --dev`

## Rules

### Deprecated

This rule informs about deprecated code. It uses JSDoc syntax to mark deprecated code.

**Example:**

Configuration:

```js
{
  plugins: [
    "@sklik/eslint-plugin-sklik"
  ],
  rules: {
    "@sklik/sklik/deprecated": 1 // 2 for errors
  }
}
```

Code:

```js
/**
 * This is a description.
 * @deprecated since 12.0.1
 * @deprecated reason Requires AS >= 15.0
 */
function myFn () {}
 ```

ESLint output:

 `"myFn" is deprecated since version 12.0.1. Current version is 12.5.0. (Reason: "Requires AS >= 15.0") (@sklik/sklik/deprecated)`
