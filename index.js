var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var CachingWriter = require('broccoli-caching-writer');
var postcss = require('postcss');

function PostcssCompiler (inputFile, outputFile, plugins) {
    if (!(this instanceof PostcssCompiler)) {
        return new PostcssCompiler(inputFile, outputFile, plugins);
    }

    CachingWriter.call(this, inputFile);

    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.plugins = plugins || [];
}

PostcssCompiler.prototype = Object.create(CachingWriter.prototype);
PostcssCompiler.prototype.constructor = PostcssCompiler;

PostcssCompiler.prototype.updateCache = function (includePaths, destDir) {
    var toFilePath = path.join(destDir, this.outputFile);
    var fromFilePath = this.inputFile;

    if (!this.plugins || this.length < 1) {
        throw new Error('You must provide at least 1 plugin in the plugin array');
    }

    var plugins = this.plugins;
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
}

module.exports = PostcssCompiler;
