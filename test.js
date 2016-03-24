/* global beforeEach, afterEach, it */

var assert = require('assert')
var fs = require('fs')
var path = require('path')
var broccoli = require('broccoli')
var postcssFilter = require('./')
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
  postcssFilter.warningStream = warningStreamStub

  return (new broccoli.Builder(outputTree)).build().then(function (dir) {
    var content = fs.readFileSync(path.join(dir.directory, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'a:before { content: "test"; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVksZ0JBQWdCLEVBQUUiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJhOjpiZWZvcmUgeyBjb250ZW50OiBcInRlc3RcIjsgfVxuIl19 */')
    assert.deepEqual(warnings, [])
  })
})

it('should expose warnings', function () {
  var outputTree = postcssFilter('fixture/warning', { plugins: testWarnPluginSet })
  outputTree.warningStream = warningStreamStub

  return (new broccoli.Builder(outputTree)).build().then(function (dir) {
    var content = fs.readFileSync(path.join(dir.directory, 'fixture.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepEqual(warnings, [ 'postcss-test-warn: This is a warning.' ])
  })
})

it('should expose syntax errors', function () {
  var outputTree = postcssFilter('fixture/syntax-error', { plugins: testWarnPluginSet })
  outputTree.warningStream = warningStreamStub

  var count = 0

  return (new broccoli.Builder(outputTree)).build()
  .catch(function (error) {
    count++
    assert.strictEqual(error.name, 'CssSyntaxError')
  })
  .then(function () {
    assert.strictEqual(count, 1)
    assert.deepEqual(warnings, [])
  })
})

it('should expose non-syntax errors', function () {
  var outputTree = postcssFilter('fixture/missing-file', { plugins: testWarnPluginSet })
  outputTree.warningStream = warningStreamStub

  var count = 0

  return (new broccoli.Builder(outputTree)).build()
  .catch(function () {
    count++
  })
  .then(function () {
    assert.strictEqual(count, 1)
    assert.deepEqual(warnings, [])
  })
})
