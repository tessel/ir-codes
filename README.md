**[UNMAINTAINED] This library does not have a maintainer. The source code and repository will be kept at this URL indefinitely. If you'd like to help maintain this codebase, create an issue on this repo explaining why you'd like to become a maintainer and tag @tessel/maintainers in the body.**

ir-codes
==============

Generates signal buffers for different infrared device manufacturers. Designed to be used with Tessel's `ir-attx4` module. The signals generated are buffers with 16-bit words representing on and off durations of the LED. Positive numbers for on durations and negative numbers for off durations.

Loosely based off of @shirriff's [Arduino-IRRemote](https://github.com/shirriff/Arduino-IRremote) library. 

Contributions
==============
Contributions needed! In order to create and test IR codes, we need developers with different kinds of IR devices to add that functionality. 

Check out [this Tessel forum post](https://forums.tessel.io/t/ir-example-usage-docs/150/2?u=jon) for guidance on how to figure out a manufacturer's IR codes.

Installation
===============

`npm install ir-codes`

Example
===============

To get a Sony IR code to send to Tessel:

```.js
var ir = require('ir-codes');

var code = ir.generate('sony', 0xA50)
```



