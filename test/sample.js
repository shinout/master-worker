var MasterWorker = require("../MasterWorker");
var fs = require("fs");
require("termcolor").define();

var parallel = 8;
var file  = __filename;
var size  = fs.statSync(file).size;
var delta = Math.floor(size / parallel); // data size par process

var mw = new MasterWorker({
  master: function(i) { // i : 0 to 5
    return {
      i : i,
      filename: __filename,
      S : i * delta,
      E : (i == parallel - 1) ? size : ((i + 1) * delta - 1)
    }
  },

  worker : function(data) {
    require("termcolor").define();
    var fs = require("fs");
    var str = "";
    var stream = fs.createReadStream(data.filename, {
      start: data.S,
      end  : data.E
    });
    console.green("i", data.i, "start", data.S, "end", data.E);

    stream.setEncoding("utf8");
    stream.on("data", function(d) {
      str += d;
    });

    stream.on("end", function() {
      send(str);
    });
  },

  parallel: parallel
});

mw.on("end", function(result) {
  console.assert(result.join(""), fs.readFileSync(__filename));
  console.green("OK", "multiprocess reading file");
});
