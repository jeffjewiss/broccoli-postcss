/* global beforeEach, afterEach, it */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const broccoli = require('broccoli')
const PostcssFilter = require('../')
const postcss = require('postcss')
const rimraf = require('rimraf')
const glob = require('glob')
const async = require('async')

const basicPluginSet = [
  {
    module: require('postcss-color-rebeccapurple')
  }
]

const testWarnPluginSet = [
  {
    module: postcss.plugin('postcss-test-warn', function (opts) {
      return function (css, result) {
        result.warn('This is a warning.')
      }
    })
  }
]

let warnings = []
const warningStreamStub = {
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
  const outputTree = new PostcssFilter('fixture/success', { plugins: basicPluginSet, map: true })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  PostcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0U7QUFDRiIsImZpbGUiOiJmaXh0dXJlLmNzcyIsInNvdXJjZXNDb250ZW50IjpbImJvZHkge1xuICBjb2xvcjogcmViZWNjYXB1cnBsZVxufVxuIl19 */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should only include css from include patterns', function () {
  const outputTree = new PostcssFilter('fixture/include', { plugins: basicPluginSet, map: true, include: ['fixture.css'] })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  PostcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    let missing = ''

    try {
      missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
    } catch (err) {
      // NO-OP
    }

    const content = `${fixture.trim()}${missing.trim()}`

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0U7QUFDRiIsImZpbGUiOiJmaXh0dXJlLmNzcyIsInNvdXJjZXNDb250ZW50IjpbImJvZHkge1xuICBjb2xvcjogcmViZWNjYXB1cnBsZVxufVxuIl19 */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should not include css from exclude patterns', function () {
  const outputTree = new PostcssFilter('fixture/exclude', { plugins: basicPluginSet, map: true, exclude: ['missing.css'] })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  PostcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    let missing = ''

    try {
      missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
    } catch (err) {
      // NO-OP
    }

    const content = `${fixture.trim()}${missing.trim()}`

    assert.strictEqual(content.trim(), 'body {\n  color: #639;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBb0I7QUFDdEIiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJib2R5IHtcbiAgY29sb3I6IHJlYmVjY2FwdXJwbGU7XG59XG4iXX0= */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should expose warnings', function () {
  const outputTree = new PostcssFilter('fixture/warning', { plugins: testWarnPluginSet })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepStrictEqual(warnings, ['postcss-test-warn: This is a warning.'])
  })
})

it('should expose syntax errors', function () {
  const outputTree = new PostcssFilter('fixture/syntax-error', {
    errors: {
      showSourceCode: true,
      terminalColors: false
    },
    plugins: testWarnPluginSet
  })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  let count = 0

  return builder.build()
    .catch((error) => {
      count++
      assert.strictEqual(error.broccoliPayload.originalError.name, 'CssSyntaxError')
      assert.strictEqual(error.broccoliPayload.originalError.message, `${error.broccoliPayload.originalError.input.file}:1:1: Unknown word\n> 1 | a }\n    | ^\n  2 | `)
    })
    .then(() => {
      assert.strictEqual(count, 1)
      assert.deepStrictEqual(warnings, [])
    })
})

it('should expose non-syntax errors', function () {
  const outputTree = new PostcssFilter('fixture/missing-file', { plugins: testWarnPluginSet })
  let count = 0

  outputTree.warningStream = warningStreamStub

  try {
    new broccoli.Builder(outputTree) // eslint-disable-line no-new
  } catch (err) {
    count++
    assert.strictEqual(err.name, 'Error')
  }

  assert.strictEqual(count, 1)
  assert.deepStrictEqual(warnings, [])
})

it('should throw an error if there is not at least 1 plugin', function () {
  const outputTree = new PostcssFilter('fixture/success', {})
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  let count = 0

  outputTree.warningStream = warningStreamStub

  return builder.build()
    .catch((error) => {
      count++
      assert.strictEqual(error.broccoliPayload.originalError.name, 'Error')
      assert.strictEqual(error.broccoliPayload.originalError.message, 'You must provide at least 1 plugin in the plugin array')
    })
    .then(() => {
      assert.strictEqual(count, 1)
      assert.deepStrictEqual(warnings, [])
    })
})

it('supports an array of plugin instances', function () {
  const basicPlugin = basicPluginSet[0].module
  const basicOptions = basicPluginSet[0].options
  const pluginInstance = basicPlugin(basicOptions)

  const outputTree = new PostcssFilter('fixture/success', {
    plugins: [
      pluginInstance
    ],
    map: true
  })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  PostcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0U7QUFDRiIsImZpbGUiOiJmaXh0dXJlLmNzcyIsInNvdXJjZXNDb250ZW50IjpbImJvZHkge1xuICBjb2xvcjogcmViZWNjYXB1cnBsZVxufVxuIl19 */')
    assert.deepStrictEqual(warnings, [])
  })
})
