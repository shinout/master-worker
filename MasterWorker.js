var fork = require("child_process").fork;
var toSource = require("tosource");

/**
 * MasterWorker: constructor
 *
 * @param options
 *        (function) master: distribute data to workers.
 *        (function) worker: process given data and send result to master.
 *        (number)   parallel: the number of workers. default 1
 *        (boolean)  pause: if true, execution is paused until run() is called.
 *
 * @param (function) callback : called when ended.
 *
 **/
function MasterWorker(options, callback) {
  options || (options = {});
  ["master", "worker", "parallel"].forEach(function(v) {
    if (typeof options[v] != "undefined") this[v] = options[v];
  }, this);

  if (!options.pause) this.run(callback);
}


/**
 * extends EventEmitter
 **/
MasterWorker.prototype = new (require("events").EventEmitter);


/**
 * property: parallel
 **/
Object.defineProperty(MasterWorker.prototype, "parallel", {
  get: function() {
    return this._parallel || 1;
  },
  set: function(n) {
    console.assert(typeof n == "number");
    this._parallel= parseInt(n);
    return this;
  }
});


/**
 * property: master
 **/
Object.defineProperty(MasterWorker.prototype, "master", {
  get: function() {
    return this._master || function() { return {} };
  },
  set: function(fn) {
    console.assert(typeof fn == "function");
    this._master = fn;
    return this;
  }
});


/**
 * property: worker
 **/
Object.defineProperty(MasterWorker.prototype, "worker", {
  get: function() {
    return this._worker;
  },
  set: function(fn) {
    console.assert(typeof fn == "function");
    this._worker = fn;
    return this;
  }
});


/**
 * execution
 * @param (function) callback: called when ended.
 **/
MasterWorker.prototype.run = function(callback) {
  if (typeof this.worker != "function") throw new Error("worker function must be set.");

  var that = this;
  var total = 0;     // the number of ended processes
  this.results = [];

  for (var i=0; i<this.parallel; i++) { (function(i) {
    var data = this.master.call(this, i);
    var worker = fork(__dirname + "/worker.js");

    worker.on("message", function(result) {
      that.emit("data", result, i);
      worker.kill();
      that.results[i] = result;
      // worker.kill();
      if (++total < that.parallel) {
        return;
      }
      that.emit("end", that.results);
    });

    worker.send("(" + this.worker.toString() + ")("+ toSource(data) +")");

  }).call(this, i)}

  if (typeof callback == "function") {
    this.on("end", callback);
  }
  return this;
};


module.exports = MasterWorker;
