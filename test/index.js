/* global beforeEach, afterEach, it */

var assert = require('assert')
var fs = require('fs')
var path = require('path')
var broccoli = require('broccoli')
var postcssFilter = require('../')
var postcss = require('postcss')
var rimraf = require('rimraf')
var glob = require('glob')
var async = require('async')

var basicPluginSet = [
  {
    module: require('postcss-pseudoelements')
  }
]

var testWarnPluginSet = [
  {
    module: postcss.plugin('postcss-test-warn', function (opts) {
      return function (css, result) {
        result.warn('This is a warning.')
      }
    })
  }
]

var warnings = []
var warningStreamStub = {
  write: function (warning) {
    warnings.push(warning)
  }
}

beforeEach(function () {
  warnings = []
})

afterEach(function () {
  glob('tmp/*', function (err, files) {
    if (err) {
      console.error(err)
    } else {
      async.forEach(files, rimraf)
    }
  })
})

it('should process css', function () {
  var outputTree = postcssFilter('fixture/success', { plugins: basicPluginSet, map: true })
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    var content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'a:before { content: "test"; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVksZ0JBQWdCLEVBQUUiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJhOjpiZWZvcmUgeyBjb250ZW50OiBcInRlc3RcIjsgfVxuIl19 */')
    assert.deepEqual(warnings, [])
  })
})

it('should expose warnings', function () {
  var outputTree = postcssFilter('fixture/warning', { plugins: testWarnPluginSet })
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function () {
    var content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepEqual(warnings, [ 'postcss-test-warn: This is a warning.' ])
  })
})

it('should expose syntax errors', function () {
  var outputTree = postcssFilter('fixture/syntax-error', { plugins: testWarnPluginSet })
  var builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  var count = 0

  return builder.build()
  .catch(function (error) {
    count++
    assert.strictEqual(error.broccoliPayload.originalError.name, 'CssSyntaxError')
    assert.strictEqual(error.broccoliPayload.originalError.message, `${error.broccoliPayload.originalError.input.file}:1:1: Unknown word\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 1 | \u001b[39ma \u001b[33m}\u001b[39m\n \u001b[90m   | \u001b[39m\u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 2 | \u001b[39m`)
  })
  .then(function () {
    assert.strictEqual(count, 1)
    assert.deepEqual(warnings, [])
  })
})

it('should expose non-syntax errors', function () {
  var outputTree = postcssFilter('fixture/missing-file', { plugins: testWarnPluginSet })
  var count = 0

  outputTree.warningStream = warningStreamStub

  try {
    new broccoli.Builder(outputTree) // eslint-disable-line no-new
  } catch (err) {
    count++
    assert.strictEqual(err.name, 'BuilderError')
  }

  assert.strictEqual(count, 1)
  assert.deepEqual(warnings, [])
})
