# broccoli-postcss

[![Build Status][build-img]][build-url]
[![npm version][npm-img]][npm-url]
[![Coverage Status][coveralls-img]][coveralls-url]
[![monthly downloads][monthly-downloads-img]][monthly-downloads-url]
[![total downloads][total-downloads-img]][total-downloads-url]

The broccoli-postcss plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss
```

## Usage

```javascript
const compileCSS = require('broccoli-postcss')
const outputTree = compileCSS(tree, options)
```

## Compatibility

Due to changes in the plugin API of Postcss V8 some plugins will need to be updated after upgrading Postcss. This should be as simple as updating this package from V5 to V6, however compatibility is not guaranteed.

- V6 broccoli-postcss -> Postcss V8
- V5 broccoli-postcss -> Postcss V7

## API

### broccoliPostcss(tree, [options])

#### options

##### plugins

Type: `array`

A list of plugin objects to be used by Postcss (a minimum of 1 plugin is required).

There are two supported methods for defining plugins:

1. Object form

    ```javascript
    plugins: [
      {
        module: require('some-plugin'),
        options: { /* options for `some-plugin` */ }
      }
    ]
    ```

2. Function form

    ```javascript
    plugins: [
      require('some-plugin')({ /* options for `some-plugin` */ })
    ]
    ```

Note: additional options (defined below) that are merged with the individual plugin options are *only* supported for plugins defined in "object form".

#### browsers

Type: `array`

A list of browsers to support. Follows the [browserslist](https://github.com/ai/browserslist) format. Will be passed to each plugin and can be overridden using the plugin’s options.

##### map

Type: `object`
Default: `{ inline: false, annotation: false }`

An object of options to describe how Postcss should [handle source maps](https://github.com/postcss/postcss/blob/master/docs/source-maps.md).

##### include

Type: `array`
Default: `[]`

Array of GlobStrings|RegExps|Functions to describe a whitelist of files to get processed by Postcss.

##### exclude

Type: `array`
Default: `[]`

Array of GlobStrings|RegExps|Functions to describe a blacklist of files to be ignored by Postcss.


## Example

```javascript
/* Brocfile.js */
var compileCSS = require('broccoli-postcss')
var cssnext = require('postcss-cssnext')

var options =  {
  plugins: [
    {
      module: cssnext,
      options: {
          browsers: ['last 2 version']
      }
    },
  ],
  map: false,
  include: ['styles/*.css'],
  exclude: ['vendor/bootstrap/**/*']
}

var outputTree = compileCSS('app/styles', options)
module.exports = outputTree
```

[build-img]: https://github.com/jeffjewiss/broccoli-postcss/workflows/CI/badge.svg
[build-url]: https://github.com/jeffjewiss/broccoli-postcss/actions?query=workflow%3ACI
[npm-img]: https://badge.fury.io/js/broccoli-postcss.svg
[npm-url]: https://www.npmjs.com/package/broccoli-postcss
[monthly-downloads-img]: https://img.shields.io/npm/dm/broccoli-postcss.svg
[monthly-downloads-url]: https://www.npmjs.com/package/broccoli-postcss
[total-downloads-img]: https://img.shields.io/npm/dt/broccoli-postcss.svg
[total-downloads-url]: https://www.npmjs.com/package/broccoli-postcss
[coveralls-img]: https://coveralls.io/repos/github/jeffjewiss/broccoli-postcss/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/jeffjewiss/broccoli-postcss?branch=master
