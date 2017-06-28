'use strict'

const assign = require('object-assign')
const Filter = require('broccoli-persistent-filter')
const Funnel = require('broccoli-funnel')
const postcss = require('postcss')

PostcssFilter.prototype = Object.create(Filter.prototype)
PostcssFilter.prototype.constructor = PostcssFilter

PostcssFilter.prototype.extensions = ['css']
PostcssFilter.prototype.targetExtension = 'css'

function PostcssFilter (inputNode, _options) {
  let options = _options || {}

  if (!(this instanceof PostcssFilter)) {
    return new PostcssFilter(inputNode, _options)
  }

  if (options.exclude || options.include) {
    inputNode = new Funnel(inputNode, {
      exclude: options.exclude,
      include: options.include
    })
  }

  Filter.call(this, inputNode, options)

  this.options = options
  this.warningStream = process.stderr
}

PostcssFilter.prototype.processString = function (content, relativePath) {
  let warningStream = this.warningStream
  let processor = postcss()
  let opts = assign({
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

  opts.plugins.forEach((plugin) => {
    let pluginOptions = assign(opts, plugin.options || {})
    processor.use(plugin.module(pluginOptions))
  })

  return processor.process(content, opts)
    .then((result) => {
      result.warnings().forEach(warn => warningStream.write(warn.toString()))

      return result.css
    })
    .catch((err) => {
      if (err.name === 'CssSyntaxError') {
        err.message += `\n${err.showSourceCode()}`
      }

      throw err
    })
}

module.exports = PostcssFilter
