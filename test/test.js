var ir = require('../');
var test = require('tinytap');

test.count(5);

test('generating a sony code', function(t) {
  var code = ir.generate('sony', 0xA50)
  t.ok(code, 'a code was not generated.');
  console.log('code length', code.length);
  t.equal(code.length, 156, 'incorrect length of buffer returned.');
  t.end();
});

test('generating a code for non-existant manufacturer', function(t) {
  var code = ir.generate('bloop', 0x00);
  t.equal(code, undefined, 'code returned for non-existant manufacturer.');
  t.end();
});

test('getting number of manufacturers available', function(t) {
  var mans = ir.availableManufacturers();
  t.ok(mans, 'No manufacturers available.');
  t.ok(mans.length, 'returned manufacturs has a falsy length value');
  t.end();
});
