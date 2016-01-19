# broccoli-postcss

[![Build Status](https://travis-ci.org/jeffjewiss/broccoli-postcss.svg?branch=master)](https://travis-ci.org/jeffjewiss/broccoli-postcss) [![npm version](https://badge.fury.io/js/broccoli-postcss.svg)](http://badge.fury.io/js/broccoli-postcss) [![Code Climate](https://codeclimate.com/github/jeffjewiss/broccoli-postcss/badges/gpa.svg)](https://codeclimate.com/github/jeffjewiss/broccoli-postcss)

The broccoli-postcss plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss');

var outputTree = compileCSS(inputTree, options);
```

- **`inputTrees`**: An array of trees that specify the directories used by Broccoli. If you have a single tree, pass `[tree]`.
- **`options`**: Options for PostCSS. Additional options are specified
   below.

### Options not passed to PostCSS

- **`plugins`** An array of plugin objects to be used by PostCSS (a minimum of 1 plugin is required). The supported object format is `module`: the plugin module itself, and `options`: an object of supported options for the given plugin.
- **`resultHandler`**: A callback that is invoked after each file is
  processed by PostCSS. This can be used to process the PostCSS
  result messages or do other per-file operations. Note: the primary output
  file has not yet been written to disk when this callback is invoked.
  It is passed `result, filter, relativePath, addOutputFile`.
  - `result`: [Object] The PostCSS result object.
  - `filter`: [Object] The [Broccoli Multi Filter][multifilter] object.
  - `relativePath`: [String] The relative path of the file being compiled.
  - `addOutputFile`: [Function] A callback that can be used to register
    additional output files with the [Broccoli Multi Filter][multifilter]

## Example

```javascript
/* Brocfile.js */
var compileCSS = require('broccoli-postcss');
var cssnext = require('cssnext');

var options = {
  plugins: [
    {
      module: cssnext,
      options: {
        browsers: ['last 2 version']
      }
    }
  ]
}

var outputTree = compileCSS(['styles'], options);
module.exports = outputTree;
```

[multifilter]: https://www.npmjs.com/package/broccoli-multi-filter
