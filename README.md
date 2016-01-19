# broccoli-postcss-sourcemaps

The broccoli-postcss-sourcemaps plugin runs your `css` through postcss plugins of your choosing.

This is a fork of [broccoli-postcss](https://github.com/jeffjewiss/broccoli-postcss)
which adds support for sourcemaps and other 1-to-many css output scenarios.

## Installation

```shell
npm install --save-dev broccoli-postcss-sourcemaps
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss-sourcemaps');

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
var compileCSS = require('broccoli-postcss-sourcemaps');
var cssnext = require('cssnext');

var options = {
  plugins: [
    {
      module: cssnext,
      options: {
        browsers: ['last 2 version']
      }
    }
  ],
  map: {
    inline: false,
    annotation: false
  }
}

var outputTree = compileCSS(['styles'], options);
module.exports = outputTree;
```

[multifilter]: https://www.npmjs.com/package/broccoli-multi-filter
