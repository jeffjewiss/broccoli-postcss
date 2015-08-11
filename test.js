var assert = require('assert');
var fs = require('fs');
var path = require('path');
var broccoli = require('broccoli');
var postcssCompiler = require('./');
var postcss = require('postcss');
var rimraf = require('rimraf');
var glob = require('glob');
var async = require('async');

var basicPluginSet = {
    plugins: [
        {
            module: require('postcss-pseudoelements')
        }
    ],
    map: {
        inline: false,
        annotation: false
    }
};

var optionsPluginSet = {
    to: 'newOutput.css',
    plugins: [
        {
            module: require('postcss-pseudoelements')
        }
    ],
    map: {
        inline: false,
        annotation: true
    }
};

var testWarnPluginSet = {
    plugins: [
        {
            module: postcss.plugin('postcss-test-warn', function (opts) {
                return function (css, result) {
                    result.warn("This is a warning.");
                };
            })
        }
    ],
    map: {
        inline: false,
        annotation: false
    }
};


var warnings = [];
var warningStreamStub = {
    write: function (warning) {
        warnings.push(warning);
    }
};

beforeEach(function () {
    warnings = [];
});

afterEach(function () {
    glob('tmp/*', function(err,files) {
        if (err) {
            console.error(er);
        } else {
            async.forEach(files, rimraf);
        }
    });
});

it('should process css', function () {
    var outputTree = postcssCompiler('fixtures/default', basicPluginSet);
    outputTree.warningStream = warningStreamStub;

    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'fixture.css'), 'utf8');
        var sourceMap = JSON.parse(fs.readFileSync(path.join(dir.directory, 'fixture.css.map'), 'utf8'));
        assert.strictEqual(content.trim(), 'a:before { content: "test"; }');
        assert.strictEqual(sourceMap.mappings, 'AAAA,WAAY,gBAAgB,EAAE');
        assert.deepEqual(warnings, []);
    });
});

it('should expose warnings', function () {
    var outputTree = postcssCompiler('fixtures/warning', testWarnPluginSet);
    outputTree.warningStream = warningStreamStub;

    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'fixture.css'), 'utf8');
        assert.strictEqual(content.trim(), "a {}");
        assert.deepEqual(warnings, [ "postcss-test-warn: This is a warning." ]);
    });
});

it('should expose syntax errors', function () {
    var outputTree = postcssCompiler('fixtures/syntax-error', testWarnPluginSet);
    outputTree.warningStream = warningStreamStub;

    var count = 0;

    return (new broccoli.Builder(outputTree)).build()
        .catch(function (error) {
            count++;
            assert.strictEqual(error.name, "CssSyntaxError");
        })
        .then(function () {
            assert.strictEqual(count, 1);
            assert.deepEqual(warnings, []);
        });
});

it('should expose non-syntax errors', function () {
    var outputTree = postcssCompiler('fixture', testWarnPluginSet);
    outputTree.warningStream = warningStreamStub;

    var count = 0;

    return (new broccoli.Builder(outputTree)).build()
        .catch(function () {
            count++;
        })
        .then(function () {
            assert.strictEqual(count, 1);
            assert.deepEqual(warnings, []);
        });
});
