// This is just to serve as an indicator not to run these tests in
// the addon process.
require("chrome");

exports.testModuleOverrides = function(test) {
  var options = {
    moduleOverrides: {
      'unit-test': {
        foo: 5
      }
    }
  };
  var loader = test.makeSandboxedLoader(options);
  test.assertEqual(loader.require('unit-test').foo, 5,
                   "options.moduleOverrides works");
  loader.unload();
};

exports.testE10SSupport = function(test) {
  var {TestFinder} = require("unit-test-finder");
  var {TestRunner} = require("unit-test");
  var url = require("url");

  var thisDir = url.toFilename(url.URL('./', __url__));
  var finder = new TestFinder([thisDir], 'test-api-utils', true);
  var runner = new TestRunner();
  finder.findTests(function(tests) {
    test.assert(tests.length >= 2,
                "api-utils must have at least two tests (one to run in " +
                "chrome, another to run in the addon process)");
    runner.startMany({
      tests: tests,
      onDone: function(runner) {
        test.assertEqual(runner.failed, 0,
                         "No tests in addon process should have failed");
        test.assert(runner.passed > 0,
                    "Some tests in addon process must have been run");
        test.failed += runner.failed;
        test.passed += runner.passed;
        test.done();
      }
    });
  });
  test.waitUntilDone();
};
