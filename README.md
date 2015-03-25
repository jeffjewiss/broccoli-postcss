# broccoli-postcss

The broccoli-postcss plugin runs your `css` through postcss plugins of your choosing.

## Installation

```shell
npm install --save-dev broccoli-postcss
```

## Usage

```javascript
var compileCSS = require('broccoli-postcss');

var outputTree = compileCSS(inputFile, outputFile, plugins);
```

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

var outputTree = compileCSS('styles/app.css', 'assets/app.css', plugins);
```
