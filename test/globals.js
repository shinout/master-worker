
var fn = function() {
  return Object.getOwnPropertyNames(this);
};

var arr = require("vm").createScript("(" + fn.toString() + ")()").runInNewContext();

fn().forEach(function(name) {
  if (arr.indexOf(name) == -1)
    console.log(name);
});


console.log("global.require", global.require)
