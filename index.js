var assign = require('object-assign')
var Filter = require('broccoli-persistent-filter')
var Funnel = require('broccoli-funnel')
var postcss = require('postcss')

PostcssFilter.prototype = Object.create(Filter.prototype)
PostcssFilter.prototype.constructor = PostcssFilter

PostcssFilter.prototype.extensions = ['css']
PostcssFilter.prototype.targetExtension = 'css'

function PostcssFilter (inputTree, _options) {
  var options = _options || {}
  if (!(this instanceof PostcssFilter)) {
    return new PostcssFilter(inputTree, _options)
  }

  if (options.exclude || options.include) {
    inputTree = new Funnel(inputTree, {
      exclude: options.exclude,
      include: options.include
    })
  }

  Filter.call(this, inputTree, options)

  this.inputTree = inputTree
  this.options = options
  this.warningStream = process.stderr
}

PostcssFilter.prototype.processString = function (str, relativePath) {
  var warningStream = this.warningStream
  var processor = postcss()
  var opts = assign({
    from: relativePath,
    to: relativePath,
    map: {
      inline: false,
      annotation: false
    }
  }, this.options)

  if (!opts.plugins || opts.plugins.length < 1) {
    throw new Error('You must provide at least 1 plugin in the plugin array')
  }

  opts.plugins.forEach(function (plugin) {
    var pluginOptions = assign(opts, plugin.options || {})
    processor.use(plugin.module(pluginOptions))
  })

  return processor.process(str, opts)
  .then(function (result) {
    result.warnings().forEach(function (warn) {
      warningStream.write(warn.toString())
    })

    return result.css
  })
  .catch(function (err) {
    if (err.name === 'CssSyntaxError') {
      err.message += '\n' + err.showSourceCode()
    }

    throw err
  })
}

module.exports = PostcssFilter
