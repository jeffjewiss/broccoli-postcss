var assert = require('assert');
var fs = require('fs');
var path = require('path');
var broccoli = require('broccoli');
var postcssCompiler = require('./');
var pe = require('postcss-pseudoelements');

var plugins = [
    {
        module: pe
    }
];
var map = {
    inline: false,
    annotation: false
};

var outputTree = postcssCompiler(['fixture'], 'fixture.css', 'output.css', plugins, map);

it('should process css', function () {
    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'output.css'), 'utf8');
        assert.strictEqual(content.trim(), 'a:before { content: "test"; }');
    });
});
