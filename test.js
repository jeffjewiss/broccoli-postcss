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

var outputTree = postcssCompiler(['fixture'], 'fixture.css', 'output.css', plugins);

it('should process css', function () {
    return (new broccoli.Builder(outputTree)).build().then(function (dir) {
        var content = fs.readFileSync(path.join(dir.directory, 'output.css'), 'utf8');
        assert.strictEqual(content.trim(), 'a:before { content: "test"; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2ZpeHR1cmUvZml4dHVyZS5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBWSxnQkFBZ0IsRUFBRSIsImZpbGUiOiJvdXRwdXQuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiYTo6YmVmb3JlIHsgY29udGVudDogXCJ0ZXN0XCI7IH1cbiJdfQ== */');
    });
});
