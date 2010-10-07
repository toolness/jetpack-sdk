var e10s = require('e10s');

exports.testStartMain = function(test) {
  var actions = [];
  var expectedActions = [
    ["log", "hello", "world"]
  ];

  var fakeConsole = {
    log: function log(a, b) {
      actions.push(["log", a, b]);
      test.assertEqual(JSON.stringify(actions),
                       JSON.stringify(expectedActions));
      test.done();
    }
  };

  var process = e10s.createProcess({console: fakeConsole});
  process.sendMessage("startMain", "e10s-samples/hello-world");
  test.waitUntilDone();
};

exports.testStartMainWithNonexistentModuleWorks = function(test) {
  var actions = [];
  var expectedActions = [
    ["log", "An exception occurred in the child Jetpack process."],
    ["exception", "Error: Unknown module 'blah'."]
  ];

  var fakeConsole = {
    log: function log(msg) {
      actions.push(["log", msg]);
    },
    exception: function exception(e) {
      actions.push(["exception", e.toString()]);
      test.assertEqual(JSON.stringify(actions),
                       JSON.stringify(expectedActions));
      test.done();
    }
  };

  var process = e10s.createProcess({console: fakeConsole});
  process.sendMessage("startMain", "blah");
  test.waitUntilDone();
};
