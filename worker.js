process.on("message", function(data) {
  var src = require("vm").createScript(data.source);
  var context = {
    clearInterval: clearInterval,
    Buffer       : Buffer,
    setTimeout   : setTimeout,
    console      : console,
    Uint32Array  : Uint32Array,
    Float32Array : Float32Array,
    root         : root,
    Uint8Array   : Uint8Array,
    DataView     : DataView,
    Int32Array   : Int32Array,
    Int16Array   : Int16Array,
    process      : process,
    clearTimeout : clearTimeout,
    GLOBAL       : GLOBAL,
    Int8Array    : Int8Array,
    setInterval  : setInterval,
    Float64Array : Float64Array,
    global       : global,
    Uint16Array  : Uint16Array,
    ArrayBuffer  : ArrayBuffer,

    require      : require,

    send         : function(data) {
      /**
       * Node >=v0.6.1, process.std.end() cannot be called.
        process.stdout.on("close", function() {
          process.send(data);
          process.exit();
        });
        process.stdout.end();
      **/
      process.send(data);

      setTimeout(function() {
        process.exit();
      }, 100);
    }
  };

  try {
    var requires = data.requires;
    Object.keys(requires).forEach(function(name) {
      var keypath = requires[name];
      if (!Array.isArray(keypath)) keypath = [keypath];
      var req = require(keypath.shift());
      for (var i=0, l=keypath.length; i<l; i++) {
        req = req[keypath[i]];
      }
      context[name] = req;
    });
  } catch (e) {}

  src.runInNewContext(context);
});
