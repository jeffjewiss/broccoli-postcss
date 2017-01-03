# broccoli-postcss

[![Travis Build Status][travis-img]][travis-url]
[![npm version][npm-img]][npm-url]
[![Coverage Status][coveralls-img]][coveralls-url]
[![bitHound Overall Score][bithound-img]][bithound-url]

The broccoli-postcss plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss')
var outputTree = compileCSS(tree, options)
```

## API

### broccoliPostcss(tree, [options])

#### options

##### plugins

Type: `array`

A list of plugin objects to be used by Postcss (a minimum of 1 plugin is required). The supported object format is `module`: the plugin module itself, and `options`: an object of supported options for the given plugin.

##### map

Type: `object`
Default: `{ inline: false, annotation: false }`

An object of options to describe how Postcss should [handle source maps](https://github.com/postcss/postcss/blob/master/docs/source-maps.md).


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
  ]
}

var outputTree = compileCSS('app/styles', options)
module.exports = outputTree
```

[travis-img]: https://travis-ci.org/jeffjewiss/broccoli-postcss.svg?branch=master
[travis-url]: https://travis-ci.org/jeffjewiss/broccoli-postcss
[npm-img]: https://badge.fury.io/js/broccoli-postcss.svg
[npm-url]: http://badge.fury.io/js/broccoli-postcss
[coveralls-img]: https://coveralls.io/repos/github/jeffjewiss/broccoli-postcss/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/jeffjewiss/broccoli-postcss?branch=master
[bitHound-img]: https://www.bithound.io/github/jeffjewiss/broccoli-postcss/badges/score.svg
[bitHound-url]: https://www.bithound.io/github/jeffjewiss/broccoli-postcss
