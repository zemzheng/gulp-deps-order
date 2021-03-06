'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var depsOrder = require('./index');

it('should sort files by dependencies defined using @requires', function (cb) {
	var order = depsOrder();
    var original = order.findOrder();
    var ordered = order.sortFiles();
    
    /*
     *   === DEPS ===
     * 
     *         e.js
     *        /    \
     * sub/b.js    d.js
     *    |    \   |
     *    |   sub/c.js
     *    \    /
     *     a.js
     * 
     */
    
    var orderedFiles = ['e.js', 'd.js', 'sub/b.js', 'sub/c.js', 'a.js'];

	ordered.on('data', function (file) {
		assert.equal(file.relative, orderedFiles.shift());
	});

	ordered.on('end', cb);

	original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/a.js',
		contents: new Buffer('/* @requires sub/b.js, c.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/d.js',
		contents: new Buffer('/* @requires e.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/e.js',
		contents: new Buffer('')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/sub/b.js',
		contents: new Buffer('/* @requires ../e.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/sub/c.js',
		contents: new Buffer('/* @requires b.js, ../d.js\n */')
	}));

	original.end();
});

it('should emit an error if there is a cyclic dependency', function (cb) {
	var order = depsOrder();
    var original = order.findOrder();
    var ordered = order.sortFiles();
    
    /*
     *   === DEPS ===
     * 
     *    a.js <-- b.js
     *     |        ^
     *     v        |
     *    d.js --> c.js
     * 
     */
    
    var orderedFiles = ['e.js', 'd.js', 'sub/b.js', 'sub/c.js', 'a.js'];

	original.on('error', function (err) {
        assert.notEqual(err, undefined);
        cb();
    });
    
    ordered.on('data', function () {
        throw 'Cyclic dependency must emit an error';
        cb();
    });

	original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/a.js',
		contents: new Buffer('/* @requires d.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/b.js',
		contents: new Buffer('/* @requires a.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/c.js',
		contents: new Buffer('/* @requires b.js\n */')
	}));
    
    original.write(new gutil.File({
		base: __dirname,
		path: __dirname + '/d.js',
		contents: new Buffer('/* @requires c.js\n */')
	}));

	original.end();
});
