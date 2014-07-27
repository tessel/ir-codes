#!/usr/bin/env node

var spawn = require('child_process').spawn;
var parse = require('shell-quote').parse;
var quote = require('shell-quote').quote;
var stream = require('stream');
var glob = require('glob');

var tinytap = require('../src/parser');

var args = process.argv.slice(2);
var list = [[null]];

for (var i = 0; i < args.length; i++) {
	if (args[i] == '-e' || args[i] == '--exec') {
		i += 1;
    list.push([args[i]]);
	} else {
		list[list.length - 1].push(args[i]);
	}
}

if (list[0].length > 1) {
  throw new Error('Test ' + list[0][1] + 'specified without an executable.');
}
list.shift();

var total = 0, currentttest = 1, testsuccess = 0;

for (var i = 0; i < list.length; i++) {
  var globbed = Array.prototype.concat.apply([], list[i].slice(1).map(function (match) {
    return glob.sync(match); 
  }));
  total += globbed.length * 2;
  list[i].splice(1, list[i].length - 1, globbed);
}

console.log('1..' + total);

(function all (command) {
  var commandProg = command[0];

  (function next (file) {

    var usedarg = false;
    var spawncmd = parse(commandProg, process.env).map(function (arg) {
      if (arg == '{}') {
        usedarg = true;
        return file;
      }
      return arg;
    }).concat(usedarg ? [] : [file]);

    var proc = spawn(spawncmd[0], spawncmd.slice(1));
    var tap = proc.stdout.pipe(tinytap.parseStream());

    function prefixStream () {
      var transform = new stream.Transform()
      var buf = '';
      transform._transform = function (chunk, encoding, callback) {
        buf += chunk.toString(encoding == 'buffer' ? null : encoding);
        var pos;
        while ((pos = buf.indexOf('\n')) > -1) {
          this.push(' | ' + buf.slice(0, pos) + '\n');
          buf = buf.slice(pos + 1);
        }
        callback();
      }
      return transform;
    }

    if ('TAP_VERBOSE' in process.env || 'TAPV' in process.env) {
      proc.stdout.pipe(prefixStream()).pipe(process.stderr);
      proc.stderr.pipe(prefixStream()).pipe(process.stderr);
    }

    var exited = false;
    proc.on('exit', function (code) {
      exited = true;
      testsuccess += code ? 0 : 1;
      console.log(code == 0 ? 'ok' : 'not ok', currentttest++, '- test exited with code ' + code);
      // if (code) {
      //   console.error('test failed with', code);
      // }
    })

    tap.on('complete', function () {
      testsuccess += tap.success ? 1 : 0;
      console.log(tap.success ? 'ok' : 'not ok', currentttest++, '-', file);

      if (!command[1].length) {
        if (!list.length) {
          if (exited) {
            finish();
          } else {
            proc.once('exit', finish);
          }
          return;
        }
        return all(list.slice(1));
      }
      next(command[1].shift());
    });
  })(command[1].shift());
})(list.shift());

function finish (code) {
  process.exit(total - testsuccess);
}
