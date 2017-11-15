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
            this.prevTileHeight = 0;

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

        online: function () {
            Log.call(Log.l.trace, pageName + ".");
            if (AppData._userRemoteDataPromise) {
                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                AppData._userRemoteDataPromise.cancel();
            }
            AppData._userRemoteDataPromise = WinJS.Promise.timeout(1000).then(function () {
                Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + 1000 + "s is over!");
                AppData._curGetUserRemoteDataId = 0;
                AppData.getUserRemoteData();
            });
            Log.ret(Log.l.trace);
        },

        offline: function () {
            Log.call(Log.l.trace, pageName + ".");
            if (!AppData.appSettings.odata.serverFailure) {
                AppData.appSettings.odata.serverFailure = true;
                NavigationBar.disablePage("listRemote");
                NavigationBar.disablePage("search");
                if (this.controller) {
                    this.controller.updateActions();
                }
            }
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
                        var startActionList = contentarea.querySelector("#startActions.listview");
                        if (startActionList && startActionList.winControl) {
                            var startActionListSurface = startActionList.querySelector("#startActions .win-surface");
                            var width = contentarea.clientWidth - 4;
                            var height = contentarea.clientHeight;
                            var tileHeight = 0;
                            if (height > 420) {
                                tileHeight = height / 3 - 2;
                                if (tileHeight > 198) {
                                    tileHeight = 198;
                                }
                            } else {
                                tileHeight = 140;
                            }
                            if (startActionListSurface) {
                                // ensure no scrolling except main direction
                                startActionListSurface.style.overflowX = "hidden";
                                startActionListSurface.style.overflowY = "visible";
                            }
                            if (width !== that.prevWidth) {
                                that.prevWidth = width;
                                startActionList.style.width = width.toString() + "px";
                                if (width > 4) {
                                    var strTileWidth = (Math.floor(width * 100) / 100).toString();
                                    //Colors.changeCSS(".tile", "width", strTileWidth + "px");
                                    //strTileWidth = (Math.floor((width - 4) * 100)/100).toString();
                                    //Colors.changeCSS(".tile-header", "width", strTileWidth + "px");
                                    //Colors.changeCSS(".tile-row", "width", strTileWidth + "px");
                                    Colors.changeCSS(".tile-content-wide", "width", strTileWidth + "px");
                                    //strTileWidth = (Math.floor((width - 4) / 3.0 * 100) / 100).toString();
                                    strTileWidth = (Math.floor(width / 3.0 * 100) / 100).toString();
                                    Colors.changeCSS(".tile-content", "width", strTileWidth + "px");
                                }
                            }
                            if (height !== that.prevHeight) {
                                that.prevHeight = height;
                                startActionList.style.height = height.toString() + "px";
                            }
                            if (tileHeight !== that.prevTileHeight && tileHeight > 44) {
                                that.prevTileHeight = tileHeight;
                                var strTileHeight = (Math.floor((tileHeight - 44) * 100)/100).toString();
                                Colors.changeCSS(".tile-row", "height", strTileHeight + "px");
                                Colors.changeCSS(".start-photo-container", "height", strTileHeight + "px");
                            }
                            var businessCardImage = startActionList.querySelector("#startImage.start-business-card");
                            if (businessCardImage && businessCardImage.clientWidth) {
                                var marginLeft = Math.floor((width - 16 - businessCardImage.clientWidth) / 2);
                                if (marginLeft < 0) {
                                    marginLeft = 0;
                                }
                                businessCardImage.setAttribute("style", "margin-left: " + marginLeft.toString() + "px");
                            }
                            var recentTile = startActionList.querySelector(".tile-recent");
                            if (recentTile && recentTile.style) {
                                var tiles = startActionList.querySelectorAll(".tile");
                                if (tiles && tiles.length > 0) {
                                    if (height > 420) {
                                        var tilesHeight = 0;
                                        for (var i = tiles.length - 1; i > 0; i--) {
                                            tilesHeight += tiles[i].clientHeight + 2;
                                        }
                                        recentTile.style.height = (height - tilesHeight).toString() + "px";
                                    } else {
                                        recentTile.style.height = tileHeight.toString() + "px";
                                    }
                                    startActionList.style.visibility = "";
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
