var e10s = require('e10s');

function makeConsoleTest(options) {
  return function(test) {
    var actions = [];

    function addAction(action) {
      actions.push(action);
      test.assertEqual(JSON.stringify(actions[actions.length-1]),
                       JSON.stringify(options.expect[actions.length-1]));

      // TODO: It'd be nice to keep going w/ the remote process and
      // make sure it doesn't log more stuff.
      if (options.expect.length == actions.length)
        test.done();
    }
  
    function msg(name, args) {
      var action = [name];
      for (var i = 0; i < args.length; i++)
        action.push(args[i]);
      addAction(action);
    }
  
    var fakeConsole = {
      exception: function(ex) {
        addAction(["exception", ex.toString()]);
      }
    };

    ["log", "warn", "debug", "error", "info"].forEach(function(name) {
      fakeConsole[name] = function() { msg(name, arguments); };
    });

    var process = e10s.createProcess({console: fakeConsole});
    process.sendMessage("startMain", options.main);
    test.waitUntilDone();
  };
}

exports.testStartMain = makeConsoleTest({
  main: "e10s-samples/hello-world",
  expect: [
    ["log", "hello", "world"],
    ["info", "sup", "dogg"],
    ["warn", "how", "r", "u"],
    ["debug", "gud"],
    ["error", "NO U"],
    ["log", "<toString() error>"]
  ]
});

exports.testStartMainWithNonexistentModule = makeConsoleTest({
  main: "nonexistent-module",
  expect: [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception", "Error: Unknown module 'nonexistent-module'."]
  ]
});
