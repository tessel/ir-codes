// Temporary function until https://github.com/tessel/runtime/issues/306
// is fixed
var get16BitsComplement = function (number) {
  return number < 0 ? (65536 + number) : number;
};
 
// Dictionary of manufacturers
// and the corresponding code generator function
var generators = {
  "sony" : sonyGenerator
}

// Get an array of available manufacturers
function availableManufacturers() {
  return Object.keys(generators);
}

function generate(manufacturer, code) {
  manufacturer = manufacturer.toLowerCase();

  var generator = generators[manufacturer];

  if (!generator) {
    return;
  }

  return generator(code || new Buffer([]));
}
 
function sonyGenerator(hexValue) {
  var headerBytes = [2400, get16BitsComplement(-600)];
  var oneOnDuration = 1200;
  var zeroOnDuration = 600;
  var offDuration = get16BitsComplement(-600);
  var repeatDuration = get16BitsComplement(-25700);
  var bodyLen = 12;


  var headerBuf = new Buffer(4);
  headerBuf.writeUInt16BE(headerBytes[0], 0);
  headerBuf.writeUInt16BE(headerBytes[1], 2);
 
  // multiply by 4 b/c we're sending int16s (2 8-byte words) for each duration
  // and there is both an on and an off duration
  var bodyBuf = new Buffer(bodyLen * 2 * 2);
 
  for (var i = 0; i < bodyLen; i++) {
    // If the next bit is a 1
    if ((hexValue >> (bodyLen - i - 1)) & 1) {
      // Write the one ON duration
      bodyBuf.writeUInt16BE(oneOnDuration, i * 4);
    } else {
      // Write the zero ON duration
      bodyBuf.writeUInt16BE(zeroOnDuration, i * 4);
    }
 
    // Write the standard OFF duration
    bodyBuf.writeUInt16BE(offDuration, (i * 4) + 2);
 
  }
  bodyBuf.writeUInt16BE(repeatDuration, bodyBuf.length - 2);

  var packet = Buffer.concat([headerBuf, bodyBuf]);
  return Buffer.concat([packet, packet, packet]);
};

module.exports.generate = generate;
module.exports.availableManufacturers = availableManufacturers;