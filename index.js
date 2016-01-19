var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var assign = require("object-assign");
var includePathSearcher = require('include-path-searcher');
var MultiFilter = require('broccoli-multi-filter');
var postcss = require('postcss');
var CssSyntaxError = require('postcss/lib/css-syntax-error');

function PostcssFilter(inputNode, options) {
    if ( !(this instanceof PostcssFilter) ) {
        return new PostcssFilter(inputNode, options);
    }

    this.warningStream = process.stderr;
    this.options = assign({}, options || {});

    if ( !this.options.plugins || this.options.plugins.length < 1 ) {
        throw new Error('You must provide at least 1 plugin in the plugin array');
    }

    this.resultHandler = this.options.resultHandler;
    delete this.options.resultHandler;

    this.plugins = this.options.plugins;
    delete this.options.plugins;

    MultiFilter.call(this, inputNode);
}

PostcssFilter.prototype = Object.create(MultiFilter.prototype);
PostcssFilter.prototype.constructor = PostcssFilter;
PostcssFilter.prototype.extensions = ['css'];
PostcssFilter.prototype.targetExtension = 'css';

PostcssFilter.prototype.processString = function (str, relativePath, addOutputFile) {
    var opts = this.options;
    var resultHandler = this.resultHandler;
    var plugins = this.plugins;

    var processor = postcss();
    var warningStream = this.warningStream;

    assign(opts, {
        from: relativePath,
        to: relativePath
    });

    plugins.forEach(function (plugin) {
        processor.use(plugin.module(assign(opts, plugin.options)));
    });

    var filter = this;

    return processor.process(str, opts)
        .then(function (result) {
            result.warnings().forEach(function (warn) {
                warningStream.write(warn.toString());
            });
            if (result.map) {
              addOutputFile(result.map, relativePath + '.map');
            }
            if (resultHandler) {
              resultHandler(result, filter, relativePath, addOutputFile);
            }
            return result.css;
        })
        .catch(function (error) {
            if ( 'CssSyntaxError' === error.name ) {
                error.message += "\n" + error.showSourceCode();
            }

            throw error;
        });
};

module.exports = PostcssFilter;
