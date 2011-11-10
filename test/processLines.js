var MasterWorker = require("../MasterWorker");

MasterWorker.processLines({
  /**
   * a file to read
   **/

  file: __dirname + "/data.tsv",

  context: {
    a: "b"
  },

  /**
   * function to process each line
   * @param line: line
   * @param result: a variable passed to master. The initial value is {}.
   * @param data  : data passed from master.
   **/
  each: function(line, result, data) {
    if (!result.total) result.total = 0;

    var d = line.split(/ +/g);
    if (d.length < 3) {
      return;
    }
    var num = Number(d[2]);
    if (num > 0.5) {
      result.total++;
    }
  },
  parallel: 4

}, function(results) {
  var total = results.reduce(function(total, v) {
    return total + v.total;
  }, 0);

  var LS = require("linestream");
  var lines = new LS(this.file);
  var each = this.each;

  var total2 = 0;
  var result = {};
  lines.on("data", function(line) {
    each(line, result);
  });

  lines.on("end", function() {
    console.log(total, result.total);
    console.assert(total == result.total);
  });

});
