require("termcolor").define();

process.on("message", function(data) {
  require("vm").createScript(data).runInNewContext({
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

    send         : process.send
  });
});
