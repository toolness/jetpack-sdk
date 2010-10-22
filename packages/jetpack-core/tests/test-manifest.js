exports.testManifest = function(test) {
  var nullModule = {
    code: '',
    moduleInfo: {
      dependencies: {},
      needsChrome: false
    }
  };

  var fakeModules = {
    "foo": {
      code: 'require("bar");',
      moduleInfo: {
        dependencies: {"bar": {}},
        needsChrome: false
      }
    },
    "bar": nullModule,
    "sorta-bad": {
      code: 'require("f" + "oo")',
      moduleInfo: {
        dependencies: {},
        needsChrome: false
      }
    },
    "loads-wrong-thing": {
      code: 'require("bar")',
      moduleInfo: {
        dependencies: {"bar": {url: "wrong"} },
        needsChrome: false
      }
    },
    "pure-evil": {
      code: 'require("ch" + "rome")',
      moduleInfo: {
        dependencies: {},
        needsChrome: false
      }
    },
    "superpower-client": {
      code: 'require("superpower"); exports.main = function main(options, callbacks) { callbacks.quit(); };',
      moduleInfo: {
        dependencies: {"superpower": {url: "superpower-e10s-adapter"}},
        needsChrome: false
      }
    },
    "superpower": {
      code: 'require("chrome")',
      moduleInfo: {
        dependencies: {},
        'e10s-adapter': 'superpower-e10s-adapter',
        needsChrome: true
      }
    },
    "superpower-e10s-adapter": {
      code: 'exports.register = function(process) {}',
      moduleInfo: {
        dependencies: {},
        needsChrome: false
      }
    },
    "es5": nullModule,
  };

  var fakePackaging = {
    getModuleInfo: function getModuleInfo(basePath) {
      if (basePath in fakeModules)
        return fakeModules[basePath].moduleInfo;
      throw new Error("assertion error: no module called " + basePath);
    }
  };

  var fakeFs = {
    resolveModule: function(root, path) {
      if (path in fakeModules)
        return path;
      return null;
    },
    getFile: function(path) {
      return {contents: fakeModules[path].code};
    }
  };

  var warnings = [];
  function checkWarnings(expected, msg) {
    test.assertEqual(JSON.stringify(warnings),
                     JSON.stringify(expected),
                     msg);
    warnings = [];
  }

  var fakeConsole = {
    log: function(msg) {
      console.log("um", msg);
    },
    warn: function(msg) {
      warnings.push(msg);
    },
    exception: function(e) {
      console.exception(e);
    }
  };

  var loader = require("cuddlefish").Loader({
    packaging: fakePackaging,
    fs: fakeFs,
    console: fakeConsole,
    memory: memory
  });

  checkWarnings([], "init of loader does not trigger warnings");
  
  loader.require("foo"); // this triggers warnings
  checkWarnings(["require(bar) (called from foo) is loading bar, but the manifest couldn't find it", 
                 "require(bar) (called from foo) is loading bar, but the manifest couldn't find it"],
                "require() of non-chrome module w/ expected deps works");

  loader.require("sorta-bad");
  checkWarnings(["undeclared require(foo) called from sorta-bad"],
                "require() of non-chrome module w/ unexpected " +
                "non-chrome dep triggers warning");

  loader.require("loads-wrong-thing"); // also triggers warnings
  checkWarnings(["require(bar) (called from loads-wrong-thing) is loading bar, but is supposed to be loading wrong"
                 ],
                "require() loading wrong module is noticed");

  loader.require("pure-evil");
  checkWarnings(["undeclared require(chrome) called from pure-evil"],
                "require() of non-chrome modulue w/ unexpected " +
                "chrome dep triggers warning");

  test.pass("OK");

  var process = require("e10s").createProcess({
    packaging: fakePackaging,
    loader: loader,
    console: fakeConsole,
    quit: function(status) {
      // TODO: Test that 'hacked' manifests trigger console warnings.
      test.done();
    }
  });

  test.waitUntilDone();

  process.sendMessage("startMain", "superpower-client");
}
