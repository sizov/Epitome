#!/usr/bin/env node

var requirejs = require('../node_modules/requirejs/bin/r.js'),
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	ps = require('child_process'),
	host = '127.0.0.1',
	port = 39170,
	config,
	appBuild = ({
		baseUrl: '../../src/',
		optimize: 'uglify',
		out:'./Epitome-min.js',
		name:'epitome',
		include: [
			'../build_server/hash/test.js'
		]
	}),
	generateUID = function(uniqueIndex) {
		var now = new Date();
		return Math.floor(Math.random() * 10) + parseInt(now.getTime()).toString(36).toUpperCase();
	};

function respond(res, code, contents) {
	res.writeHead(code, {
		'Content-Type': (code === 200 ? 'application/javascript;charset=UTF-8' : 'text/plain'),
		'Content-Length': contents.length
	});

	res.write(contents, 'utf8');
	res.end();
}

http.createServer(function (req, res) {
	var	u = url.parse(req.url, true),
		query = u['query'],
		out = 'require([',
		id = generateUID(),
		file = './hash/epitome-' + id + '.js';

	req.on('close', function (err) {
		res.end();
	});

	req.on('end', function () {
		var deps = [],
			depsArray = []

		// anything in the ?build= arg? needs to be comma separated.
		if (query.build) {
			// make a file that requires all
			deps = query.build.split(',');

			deps.forEach(function(el) {
				depsArray.push('"../../src/'+el+'"');
			});

			out += depsArray.join(',');
			out += '], function(){});';

			console.log('Created a custom include with ' + deps.join(', '));

			fs.writeFile(file, out, function(error) {});
			appBuild.include = ['../build_server/hash/epitome-' + id];
		}
		else if (u.pathname != '/' && u.pathname.length == 10 && u.pathname.match(/\/([A-Z0-9]+)/)) {
			id = u.pathname.replace('/', ''),
				// see if the old build exists
				orig = './hash/epitome-' + id + '.js';

			fs.exists(orig, function(exists) {
				if (!exists)
					respond(res, 404, 'Failed to find existing build for ' + id);
				else {
					console.log('Found existing hash id, rebuilding...');
				}
			});
		}
		else {
			console.log('No custom includes found, returning main instead');
			id = '';
			deps = ['all'];
			appBuild.include = ['main'];
		}

		// set output folder in out for quick reference
		appBuild.out = '../out/epitome-'+ id +'-min.js';

		var handleBuilding = function() {
			try {

				ps.exec('r.js -o ./hash/' + id + '.json', function(error, output) {
					console.log(output);

					// remove the temporary module file, leave just config hash.
					/*
					var orig = './hash/epitome-' + id + '.js';
					fs.exists(orig, function(exists) {
						if (!exists)
							return;
						fs.unlink(orig, function(error) {
							if (error)
								throw error;
							console.log('deleted base include file');
						});
					});
					*/


					// if error, output 500 internal code with dump
					if (error) {
						respond(res, 500, error.toString());
						return;
					}

					// read the generated file and pipe through to stdout (er, browser).
					fs.readFile('./out/epitome-' + id + '-min.js', function(error, contents) {
						// add a hash so same build config can be reused.
						contents = '/*Epitome hash: ' + id + '\n  Download: http://' + host + ':' + port + '/' + id +'\n  Selected: ' +  deps.join(', ') + ' */\n' + contents;
						respond(res, 200, contents);

						// clean up the out file also, we can rebuild
						fs.unlink('./out/epitome-' + id + '-min.js', function(error) {
							if (error)
								throw error;
							console.log('deleted built js file');
						});
					});
				});
			} catch (e) {
				// something went wrong.
				respond(res, 500, e.toString());
			}
		};

		fs.writeFile('./hash/' + id + '.json', JSON.stringify(appBuild), function() {
			// what we will actually run now
			console.log('running: r.js -o ./hash/' + id + '.json');

			handleBuilding();
		});
	});

}).listen(port, host);

console.log('Server running at http://' + host + ':' + port + '/');
