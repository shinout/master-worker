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


/**
 * MasterWorker.processLines
 * process line independently using LineStream
 *
 * @param options
 *        (string) file: filepath to read. 
 *        (number) parallel : the number of workers. default 1
 *        (function) each : processor of each line.
 *        (function) master
 *
 * @param (function) callback : called when ended.
 *
 **/
MasterWorker.processLines = function(options, callback) {
  options || (options = {});

  var file = options.file;
  console.assert(typeof file == "string", "options.file must be a string.");

  var each = options.each;
  console.assert(typeof each == "function", "options.each must be a function.");

  var fs = require("fs");
  var size = fs.statSync(file).size;


  /**
   * create MasterWorker
   **/
  var mw = new MasterWorker({

    parallel: options.parallel,

    pause: !!options.pause,

    /**
     * master function. extends options.master
     **/
    master: function(i) {
      var data = {};
      if (typeof options.master == "function") {
        data = options.master(i);
      }

      var delta = Math.floor(size / this.parallel); // data size par process

      data.file  = file;
      data.each = each;
      data.start = i * delta;
      data.end = (i == this.parallel - 1) ? size : ((i + 1) * delta - 1);

      return data;
    },
    
    /**
     * worker function. extends options.master
     **/
    worker: function(data) {
      var LS = require("linestream");
      var fs = require("fs");
      var result = {};
      var start, end;
      var n = 0;

      var lines = new LS(data.file, {
        start : data.start,
        end   : data.end,
        trim  : true
      });

      lines.on("data", function(line, isEnd) {
        if (n++ == 0) {
          start = line;
          return;
        }

        if (isEnd) {
          end = line;
          return;
        }

        data.each(line, result, data);
      });

      lines.on("end", function() {
        send({
          r: result,
          s: start,
          e: end
        });
      });
    }
  }, 

  // on End
  function(results) {
    /**
     * process split lines
     **/
    for (var i=-1, l=this.parallel; i<l; i++) {
      var concatLine = ((i == -1) ? "" : results[i].e) + 
                       ((i == l-1) ? "" : results[i+1].s);

      var data   = (i > -1) ? this.master(i): this.master(i+1);
      var result = (i > -1) ? results[i].r : results[i+1].r;
      each(concatLine, result, data);
    }

    if (typeof callback == "function") {
      callback.call(this, results.map(function(result) {
        return result.r;
      }));
    }
  });

  /**
   * assign file and each for using on("end")
   **/
  mw.file = file;
  mw.each = each;

  return mw;
};

module.exports = MasterWorker;
