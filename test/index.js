/* global beforeEach, afterEach, it */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const broccoli = require('broccoli')
const postcssFilter = require('../')
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
  const outputTree = postcssFilter('fixture/success', { plugins: basicPluginSet, map: true })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL2plZmYvQ29kZS9icm9jY29saS1wb3N0Y3NzL2ZpeHR1cmUvc3VjY2Vzcy9maXh0dXJlLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLFdBQW9CO0NBQ3JCIiwiZmlsZSI6ImZpeHR1cmUuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYm9keSB7XG4gIGNvbG9yOiByZWJlY2NhcHVycGxlXG59XG4iXX0= */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should only include css from include patterns', function () {
  const outputTree = postcssFilter('fixture/include', { plugins: basicPluginSet, map: true, include: ['fixture.css'] })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    let missing = ''

    try {
      missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
    } catch (err) {
      // NO-OP
    }

    const content = `${fixture.trim()}${missing.trim()}`

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL291dC0xLWZ1bm5lbC9maXh0dXJlLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLFdBQW9CO0NBQ3JCIiwiZmlsZSI6ImZpeHR1cmUuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYm9keSB7XG4gIGNvbG9yOiByZWJlY2NhcHVycGxlXG59XG4iXX0= */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should not include css from exclude patterns', function () {
  const outputTree = postcssFilter('fixture/exclude', { plugins: basicPluginSet, map: true, exclude: ['missing.css'] })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    let missing = ''

    try {
      missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
    } catch (err) {
      // NO-OP
    }

    const content = `${fixture.trim()}${missing.trim()}`

    assert.strictEqual(content.trim(), 'body {\n  color: #639;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL291dC0xLWZ1bm5lbC9maXh0dXJlLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLFlBQXFCO0NBQ3RCIiwiZmlsZSI6ImZpeHR1cmUuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYm9keSB7XG4gIGNvbG9yOiByZWJlY2NhcHVycGxlO1xufVxuIl19 */')
    assert.deepStrictEqual(warnings, [])
  })
})

it('should expose warnings', function () {
  const outputTree = postcssFilter('fixture/warning', { plugins: testWarnPluginSet })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    assert.strictEqual(content.trim(), 'a {}')
    assert.deepStrictEqual(warnings, ['postcss-test-warn: This is a warning.'])
  })
})

it('should expose syntax errors', function () {
  const outputTree = postcssFilter('fixture/syntax-error', {
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
  const outputTree = postcssFilter('fixture/missing-file', { plugins: testWarnPluginSet })
  let count = 0

  outputTree.warningStream = warningStreamStub

  try {
    new broccoli.Builder(outputTree) // eslint-disable-line no-new
  } catch (err) {
    count++
    assert.strictEqual(err.name, 'BuilderError')
  }

  assert.strictEqual(count, 1)
  assert.deepStrictEqual(warnings, [])
})

it('should throw an error if there is not at least 1 plugin', function () {
  const outputTree = postcssFilter('fixture/success', {})
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

  const outputTree = postcssFilter('fixture/success', {
    plugins: [
      pluginInstance
    ],
    map: true
  })
  const builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    const content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

    assert.strictEqual(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL1VzZXJzL2plZmYvQ29kZS9icm9jY29saS1wb3N0Y3NzL2ZpeHR1cmUvc3VjY2Vzcy9maXh0dXJlLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLFdBQW9CO0NBQ3JCIiwiZmlsZSI6ImZpeHR1cmUuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYm9keSB7XG4gIGNvbG9yOiByZWJlY2NhcHVycGxlXG59XG4iXX0= */')
    assert.deepStrictEqual(warnings, [])
  })
})
