// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/start/startController.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Application.StartLayout", {
        ActionsLayout: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;
        },
        {
            // This sets up any state and CSS layout on the surface of the custom layout
            initialize: function (site) {
                this._site = site;
                this._surface = this._site.surface;

                // Add a CSS class to control the surface level layout
                WinJS.Utilities.addClass(this._surface, "startLayout");

                return WinJS.UI.Orientation.vertical;
            },

            // Reset the layout to its initial state
            uninitialize: function () {
                WinJS.Utilities.removeClass(this._surface, "startLayout");
                this._site = null;
                this._surface = null;
            }
        })
    });

    var pageName = Application.getPagePath("start");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            // add page specific commands to AppBar
            var commandList = [];

            this.controller = new Start.Controller(element, commandList);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        unload: function () {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },

        updateLayout: function (element, viewState, lastViewState) {
            var ret = null;
            var that = this;
            Log.call(Log.l.u1, pageName + ".");
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function() {
                    var contentarea = element.querySelector(".contentarea");
                    if (contentarea) {
                        var listView = contentarea.querySelector("#startActions.listview");
                        if (listView && listView.winControl) {
                            var listSurface = listView.querySelector("#startActions .win-surface");
                            var width = contentarea.clientWidth - 4;
                            var height = contentarea.clientHeight;
                            var numTiles = Start.actions.length;
                            if (width > 0 && height > 0 && numTiles > 0) {
                                var tileWidth = Math.floor(width / numTiles * 100) / 100;
                                var tileHeight;
                                if (height > numTiles * 140) {
                                    tileHeight = Math.floor(height / numTiles * 100) / 100 - 46;
                                    if (tileHeight > 154) {
                                        tileHeight = 154;
                                    }
                                } else {
                                    tileHeight = 96;
                                }
                                if (listSurface) {
                                    // ensure no scrolling except main direction
                                    listSurface.style.overflowX = "hidden";
                                    listSurface.style.overflowY = "visible";
                                }
                                if (width !== that.prevWidth) {
                                    that.prevWidth = width;
                                    Start.prevWidth = width;
                                    listView.style.width = width.toString() + "px";
                                    if (tileWidth !== Start.prevTileWidth) {
                                        Start.prevTileWidth = tileWidth;
                                    }
                                }
                                if (height !== that.prevHeight) {
                                    that.prevHeight = height;
                                    Start.prevHeight = height;
                                    listView.style.height = height.toString() + "px";
                                    if (tileHeight !== Start.prevTileHeight) {
                                        Start.prevTileHeight = tileHeight;
                                    }
                                }
                            }
                        }
                    }
                    that.inResize = 0;
                    return WinJS.Promise.as();
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
