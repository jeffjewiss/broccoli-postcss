import test from 'ava'

const fs = require('fs')
const path = require('path')
const broccoli = require('broccoli')
const postcssFilter = require('../')
const postcss = require('postcss')
const rimraf = require('rimraf')
const glob = require('glob')
const async = require('async')

let basicPluginSet = [
  {
    module: require('postcss-color-rebeccapurple')
  }
]

let testWarnPluginSet = [
  {
    module: postcss.plugin('postcss-test-warn', function (opts) {
      return function (css, result) {
        result.warn('This is a warning.')
      }
    })
  }
]

let warnings = []
let warningStreamStub = {
  write: function (warning) {
    warnings.push(warning)
  }
}

test.beforeEach(t => {
  warnings = []
})

test.afterEach(t => {
  glob('tmp/*', (err, files) => {
    if (err) {
      console.error(err)
    } else {
      async.forEach(files, rimraf)
    }
  })
})

test('should process css', async t => {
  let outputTree = postcssFilter('fixture/success', { plugins: basicPluginSet, map: true })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  await builder.build()

  let content = await fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

  t.is(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBb0I7Q0FDckIiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJib2R5IHtcbiAgY29sb3I6IHJlYmVjY2FwdXJwbGVcbn1cbiJdfQ== */')
  t.deepEqual(warnings, [])
})

test.skip('should only include css from include patterns', async t => {
  let outputTree = postcssFilter('fixture/include', { plugins: basicPluginSet, map: true, include: ['fixture.css'] })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  await builder.build()

  let fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
  let missing = ''

  try {
    missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
  } catch (err) {
    // NO-OP
  }

  let content = `${fixture.trim()}${missing.trim()}`

  t.is(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBb0I7Q0FDckIiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJib2R5IHtcbiAgY29sb3I6IHJlYmVjY2FwdXJwbGVcbn1cbiJdfQ== */')
  t.deepEqual(warnings, [])
})

test.skip('should not include css from exclude patterns', t => {
  let outputTree = postcssFilter('fixture/exclude', { plugins: basicPluginSet, map: true, exclude: ['missing.css'] })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  return builder.build().then(function () {
    let fixture = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')
    let missing = ''

    try {
      missing = fs.readFileSync(path.join(builder.outputPath, 'missing.css'), 'utf8')
    } catch (err) {
      // NO-OP
    }

    let content = `${fixture.trim()}${missing.trim()}`

    t.is(content.trim(), 'body {\n  color: #639;\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsWUFBcUI7Q0FDdEIiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJib2R5IHtcbiAgY29sb3I6IHJlYmVjY2FwdXJwbGU7XG59XG4iXX0= */')
    t.deepEqual(warnings, [])
  })
})

test.skip('should expose warnings', async t => {
  let outputTree = postcssFilter('fixture/warning', { plugins: testWarnPluginSet })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new

  outputTree.warningStream = warningStreamStub

  await builder.build()

  let content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

  t.is(content.trim(), 'a {}')
  t.deepEqual(warnings, [ 'postcss-test-warn: This is a warning.' ])
})

test.skip('should expose syntax errors', t => {
  let outputTree = postcssFilter('fixture/syntax-error', {
    errors: {
      showSourceCode: true,
      terminalColors: false
    },
    plugins: testWarnPluginSet
  })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  outputTree.warningStream = warningStreamStub

  let count = 0

  return builder.build()
    .catch((error) => {
      count++
      t.is(error.broccoliPayload.originalError.name, 'CssSyntaxError')
      t.is(error.broccoliPayload.originalError.message, `${error.broccoliPayload.originalError.input.file}:1:1: Unknown word\n> 1 | a }\n    | ^\n  2 | `)
    })
    .then(() => {
      t.is(count, 1)
      t.deepEqual(warnings, [])
    })
})

test.skip('should expose non-syntax errors', t => {
  let outputTree = postcssFilter('fixture/missing-file', { plugins: testWarnPluginSet })
  let count = 0

  outputTree.warningStream = warningStreamStub

  try {
    new broccoli.Builder(outputTree) // eslint-disable-line no-new
  } catch (err) {
    count++
    t.is(err.name, 'BuilderError')
  }

  t.is(count, 1)
  t.deepEqual(warnings, [])
})

test.skip('should throw an error if there is not at least 1 plugin', t => {
  let outputTree = postcssFilter('fixture/success', {})
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  let count = 0

  outputTree.warningStream = warningStreamStub

  return builder.build()
    .catch((error) => {
      count++
      t.is(error.broccoliPayload.originalError.name, 'Error')
      t.is(error.broccoliPayload.originalError.message, `You must provide at least 1 plugin in the plugin array`)
    })
    .then(() => {
      t.is(count, 1)
      t.deepEqual(warnings, [])
    })
})

test.skip('supports an array of plugin instances', async t => {
  let basicPlugin = basicPluginSet[0].module
  let basicOptions = basicPluginSet[0].options
  let pluginInstance = basicPlugin(basicOptions)

  let outputTree = postcssFilter('fixture/success', {
    plugins: [
      pluginInstance
    ],
    map: true
  })
  let builder = new broccoli.Builder(outputTree) // eslint-disable-line no-new
  postcssFilter.warningStream = warningStreamStub

  await builder.build()

  let content = fs.readFileSync(path.join(builder.outputPath, 'fixture.css'), 'utf8')

  t.is(content.trim(), 'body {\n  color: #639\n}\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpeHR1cmUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBb0I7Q0FDckIiLCJmaWxlIjoiZml4dHVyZS5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyJib2R5IHtcbiAgY29sb3I6IHJlYmVjY2FwdXJwbGVcbn1cbiJdfQ== */')
  t.deepEqual(warnings, [])
})
