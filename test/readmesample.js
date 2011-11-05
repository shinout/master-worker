    var MasterWorker = require("../MasterWorker");
    /**
     * example: counts the number of "O"s in str 
     */
    var str = "Oh, the ocean is blue and the sky is orange, what a cool day!";

    var mw = new MasterWorker({
      /**
       * master : function
       *   arguments : i <= a label of each worker
       *   returns data to pass to each worker labeled "i"
       **/
      master: function(i) {
        var delta = Math.floor(str.length / this.parallel);
        return str.slice(i * delta, (i+1 == this.parallel) ? str.length : (i+1)*delta);
      },

      /**
       * worker  : function
       *   arguments : data <= data generated from master(i)
       *   use "send(val)" in this function, (alternatively, process.send() is the same.)
       *   then "val" is passed to the master as a result of this worker.
       **/
      worker: function(data) {
        var theNumberOfOs = data.toLowerCase().split("o").length - 1;
        send(theNumberOfOs);
      },

      parallel: 3 // the number of worker processes. default: 1
    });

    mw.on("data", function(result, i) {
      console.assert(typeof result == "number"); // the result each worker returns
      console.assert([0,1,2].indexOf(i) >= 0); // i is one of 0,1,2 in this case
    });


    mw.on("end", function(results) {
      console.assert(this.results == results);
      console.log(results[0]); // Oh, the ocean is blu  => 2
      console.log(results[1]); // e and the sky is ora  => 1
      console.log(results[2]); // nge, what a cool day! => 2

      var theNumberOfOs = results.reduce(function(total, v) { return total + v }, 0);
      console.log(theNumberOfOs); // 2 + 1 + 2 = 5
    });

