// The `main` function is called by the host application that enables
// this module. In this example, `options` and `callbacks` are not
// used.
require.def("main", ["context-menu", "my-module", "my-module-cjs"], function(contextMenu, mod, modcjs) {

    return {
        main: function (options, callbacks) {
            console.log('test one: ' + mod.add(5, 3));
            console.log('test two: ' + modcjs.add(3, 5));

            // Create a new context menu item.
            var menuItem = contextMenu.Item({

                label: "Search with Google",

                // A CSS selector. Matching on this selector triggers the
                // display of our context menu.
                context: "a[href]",

                // When the context menu item is clicked, perform a Google
                // search for the link text.
                onClick: function (contextObj, item) {
                    var anchor = contextObj.node;
                    console.log("searching for " + anchor.textContent);
                    var searchUrl = "http://www.google.com/search?q=" +
                                    anchor.textContent;
                    contextObj.window.location.href = searchUrl;
                }
            });

            // Add the new menu item to the application's context menu.
            contextMenu.add(menuItem);
        }
    };    
});
