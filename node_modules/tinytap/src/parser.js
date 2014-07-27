var fs = require('fs');
var Duplex = require('stream').Duplex;
var util = require('util');

function state (machine) {
  var key = 'start';
  return function caller () {
    var newkey = machine[key].apply(machine, arguments);
    if (newkey) {
      key = newkey;
      return caller.apply(machine, arguments);
    }
  };
}

function parseStream () {
  var test = [];
  var expecting = -1;

  var stream = new Duplex();

  var input = '';

  var m = state({
    start: function (close) {
      if (!close && !input.match(/\n/)) {
        return;
      }

      var line = input.match(/^.*\n?/)[0];

      // parse
      var m;
      if (m = line.match(/^1..(\d+)/)) {
        stream.push(util.format('1..' + m[1]) + '\n');
        stream.expecting = expecting = parseInt(m[1]);
      } else if (m = line.match(/^(not )?ok(?!\w)(?:\s+(\d+))?(?:\s*\-\s*)?\s*(.*?)\s*(?:#\s*(TODO\b|SKIP\b)?\s*(.*))?\s*$/)) {
        m = m.slice(1,6);
        m[0] = !m[0];
        m[1] = parseInt(m[1])

        stream.push(util.format(
          (m[0] ? '' : 'not ') + 'ok',
          (m[1] != null ? m[1] + ' ' : '') + (m[2] ? '- ' + m[2] : ''),
          !m[3] && !m[4] ? '' : ('#' + (m[3] + ' ') + (m[4] || ''))
        ) + '\n');
        test[m[1]] = m;

        stream.total += 1;
        stream.passed += m[0] ? 1 : 0;
      } else if (line.match(/^\s*$/)) {
        stream.push(line);
      } else if (line.length || !close) {
        stream.push(util.format('#', line.replace(/^#\s*|\s*$/g, '')) + '\n');
      }

      input = input.slice(line.length);
      return input.length ? 'start' : null;
    }
  })

  stream._write = function (chunk, encoding, callback) {
    input = input + String(chunk);
    m(false);
    callback();
  }

  stream._read = function () {
    // no real backpressure
  }

  stream.tests = test;
  stream.passed = 0;
  stream.total = 0;
  stream.expecting = -1;

  stream.on('finish', function (piper) {
    m(true);
    stream.success = stream.passed == stream.total && stream.total == stream.expecting;
    stream.emit('complete');
  })

  return stream;
}

exports.parseStream = parseStream;

if (require.main == module) {
  var input;
  if (process.argv[2] == '-') {
    process.stdin.resume()
    input = process.stdin;
  } else {
    fs.createReadStream(process.argv[2], 'utf-8')
  }

  input
    .pipe(parseStream())
    .pipe(process.stdout)
}
