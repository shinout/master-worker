var MasterWorker = require("../MasterWorker");
var fs = require("fs");
var cl = require("termcolor").define();
var LS = require("linestream");

var parallel = 3;
var file  = __dirname + "/data.tsv";
var size  = fs.statSync(file).size;
var delta = Math.floor(size / parallel); // data size par process


var checkValid = function(line) {
  var d = line.split(/ +/g);
  if (d.length < 3) {
    return false;
  }
  var num = Number(d[2]);
  return (num > 0.5);
};

var mw = new MasterWorker({
  master: function(i) {
    return {
      start: i * delta,
      filename: file,
      end  : (i == this.parallel - 1) ? size : ((i + 1) * delta - 1),
      checkValid: checkValid
    };
  },

  worker: function(data) {
    var LS = require("linestream");
    var fs = require("fs");
    var result = {count: 0};
    var n = 0;

    var lines = new LS(fs.createReadStream(data.filename, {
      start : data.start,
      end   : data.end
    }));

    lines.on("data", function(line, isEnd) {
      if (n++ == 0) {
        result.start = line;
        return;
      }

      if (isEnd) {
        result.end = line;
        return;
      }

      if (data.checkValid(line)) {
        result.count++;
      }
    });

    lines.on("end", function() {
      send(result);
    });
  },

  parallel : parallel
});

mw.on("end", function(results) {
  var total = results.reduce(function(sofar, v) {
    return sofar + v.count;
  }, 0);

  for (var i=-1, l=this.parallel; i<l; i++) {
    var concatLine = ((i == -1) ? "" : results[i].end) + ((i == l-1) ? "" : results[i+1].start);
    if (checkValid(concatLine)) {
      total++;
    }
  }

  var lines = new LS(file);
  var total2 = 0;
  lines.on("data", function(line) {
    if (checkValid(line)) {
      total2++;
    }
  });

  lines.on("end", function() {
    console.log(total, total2);
    console.assert(total == total2);
  });
});
