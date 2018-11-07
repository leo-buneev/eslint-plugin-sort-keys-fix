# eslint-plugin-sort-keys-fix

Fork of eslint rule that sorts keys in objects (https://eslint.org/docs/rules/sort-keys) with autofix enabled

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-sort-keys-fix`:

```
$ npm install eslint-plugin-sort-keys-fix --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-sort-keys-fix` globally.

## Usage

Add `sort-keys-fix` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "sort-keys-fix"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "sort-keys-fix/rule-name": 2
    }
}
```

## Supported Rules

* Fill in provided rules here





