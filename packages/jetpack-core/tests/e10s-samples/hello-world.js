exports.main = function(options, callbacks) {
  console.log("hello", "world");
  console.info("sup", "dogg");
  console.warn("how", "r", "u");
  console.debug("gud");
  console.error("NO U");
  console.log({toString: function() { throw new Error(); }});
  callbacks.quit();
};
