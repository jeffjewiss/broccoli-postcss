var assert = require('assert');
var fs = require('fs');
var path = require('path');
var broccoli = require('broccoli');
var postcssCompiler = require('./');
var postcss = require('postcss');

var basicPluginSet = [
    {
        module: require('postcss-pseudoelements')
    }
];

var testWarnPluginSet = [
    {
        module: postcss.plugin('postcss-test-warn', function (opts) {
            return function (css, result) {
                result.warn("This is a warning.");
            };
        })
    }
];

var map = {
    inline: false,
    annotation: false
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

it('should process css', function () {


    var outputTree = postcssCompiler(['fixture'], 'fixture.css', 'output.css', basicPluginSet, map);
    outputTree.warningStream = warningStreamStub;

    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'output.css'), 'utf8');
        assert.strictEqual(content.trim(), 'a:before { content: "test"; }');
        assert.deepEqual(warnings, []);
    });
});

it('should expose warnings', function () {
    var outputTree = postcssCompiler(['fixture'], 'warning.css', 'output.css', testWarnPluginSet, map);
    outputTree.warningStream = warningStreamStub;

    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'output.css'), 'utf8');
        assert.strictEqual(content.trim(), "a {}");
        assert.deepEqual(warnings, [ "postcss-test-warn: This is a warning." ]);
    });
});

it('should expose syntax errors', function () {
    var outputTree = postcssCompiler(['fixture'], 'syntax-error.css', 'output.css', testWarnPluginSet, map);
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
    var outputTree = postcssCompiler(['fixture'], 'missing-file.css', 'output.css', testWarnPluginSet, map);
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
