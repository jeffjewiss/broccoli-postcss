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

var outputTree = compileCSS(inputTrees, inputFile, outputFile, plugins);
```

- **`inputTrees`**: An array of trees that specify the directories used by Broccoli. If you have a single tree, pass `[tree]`.
- **`inputFile`**: Relative path of the main CSS file to process.
- **`outputFile`** Relative path of the output CSS file.
- **`plugins`** An array of plugin objects to be used by Postcss (a minimum of 1 plugin is required). The supported object format is `module`: the plugin module itself, and `options`: an object of supported options for the given plugin.

## Example

```javascript
var compileCSS = require('broccoli-postcss');
var cssnext = require(‘cssnext’);

var plugins = [
    {
        module: cssnext,
        options: {
            browsers: ['last 2 version']
        }
    },
];

var outputTree = compileCSS(['styles'], 'app.css', 'app.css', plugins);
```
