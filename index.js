var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var CachingWriter = require('broccoli-caching-writer');
var postcss = require('postcss');

function PostcssCompiler (inputTrees, inputFile, outputFile, plugins) {
    if (!(this instanceof PostcssCompiler)) {
        return new PostcssCompiler(inputTrees, inputFile, outputFile, plugins);
    }

    if (!Array.isArray(inputTrees)) {
        throw new Error('Expected array for first argument - did you mean [tree] instead of tree?');
    }

    CachingWriter.call(this, inputTrees, inputFile);

    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.plugins = plugins || [];
}

PostcssCompiler.prototype = Object.create(CachingWriter.prototype);
PostcssCompiler.prototype.constructor = PostcssCompiler;

PostcssCompiler.prototype.updateCache = function (includePaths, destDir) {
    var toFilePath = path.join(destDir, this.outputFile);
    var fromFilePath = path.join(includePaths[0], this.inputFile);

    if (!this.plugins || this.plugins.length < 1) {
        throw new Error('You must provide at least 1 plugin in the plugin array');
    }

    var processor = postcss();
    var css = fs.readFileSync(fromFilePath, 'utf8');

    this.plugins.forEach(function (plugin) {
        var options = plugin.options || {};
        processor.use(plugin.module(options));
    });

    var result = processor.process(css, {
        from: fromFilePath,
        to: toFilePath,
        map: { inline: false }
    });

    mkdirp.sync(path.dirname(toFilePath));

    fs.writeFileSync(toFilePath, result.css);
};

module.exports = PostcssCompiler;
