var e10s = require('e10s');
var timer = require('timer');

function makeConsoleTest(options) {
  return function(test) {
    var actions = [];

    if (options.setup)
      options.setup(test);

    function addAction(action) {
      if (options.expect.length == actions.length) {
        test.fail("Didn't expect another action: " + JSON.stringify(action));
        return;
      }
      actions.push(action);
      var expected = options.expect[actions.length-1];
      if (typeof(expected) == "function")
        expected(test, action);
      else
        test.assertEqual(JSON.stringify(action), JSON.stringify(expected));
      if (options.expect.length == actions.length &&
          action[0] == "exception") {
        process.destroy();
        test.done();
      }
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

    var process = e10s.createProcess({
      console: fakeConsole,
      quit: function(status) {
        addAction(["quit", status]);
        process.destroy();
        test.done();
      }
    });
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
    ["exception", "Error: o snap"],
    ["log", "<toString() error>"],
    function testConsoleTrace(test, action) {
      test.assertEqual(action[0], "log",
                       "remote console.trace() issues " +
                       "local console.log()");
      test.assertMatches(action[1], /^Traceback /,
                         "remote console.trace logs traceback");
    },
    ["quit", "OK"]
  ]
});

exports.testStartMainWithNonexistentModule = makeConsoleTest({
  main: "nonexistent-module",
  expect: [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception", "Error: Unknown module 'nonexistent-module'."]
  ]
});

exports.testRemoteSyntaxError = makeConsoleTest({
  main: "e10s-samples/syntax-error",
  expect: [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception", "Error: uncaught exception: SyntaxError: missing ;" +
                  " before statement"]
  ]
});

exports.testRemoteException = makeConsoleTest({
  main: "e10s-samples/thrown-exception",
  expect: [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception", "Error: alas"]
  ]
});

exports.testE10sAdapter = makeConsoleTest({
  main: "e10s-samples/superpower-client",
  setup: function(test) {
    require("e10s-samples/superpower").setDelegate(function(a, b) {      
      test.assertEqual(JSON.stringify([a, b]),
                       JSON.stringify(["hello", "there"]));
      return "thanks dude";
    });
  },
  expect: [
    ["log", "superpower.use returned", "thanks dude"],
    ["quit", "OK"]
  ]
});

exports.testAccessDeniedToLoadModule = makeConsoleTest({
  main: "e10s-samples/chrome-only-module-client",
  expect: [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception",
     "Error: Module 'e10s-samples/chrome-only-module' requires " +
     "chrome privileges and has no e10s adapter."]
  ]
});

exports.testAdapterOnlyModule = makeConsoleTest({
  main: "e10s-samples/adapter-only-client",
  expect: [
    ["log", "hello 1 5"],
    ["quit", "OK"]
  ]
});
