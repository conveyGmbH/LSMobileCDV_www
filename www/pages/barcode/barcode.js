// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/barcode/barcodeController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("barcode");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            // add page specific commands to AppBar
            var commandList = [
                { id: 'clickBack', label: getResourceText("command.backward"), tooltip: getResourceText("tooltip.backward"), section: 'primary', svg: 'navigate_left' }
            ];

            this.controller = new Barcode.Controller(element, commandList);
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
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
            var ret = null;
            var that = this;
            Log.call(Log.l.u1, pageName + ".");
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    /*var hovercommandcontainer = element.querySelector(".hover-command-container");
                    if (hovercommandcontainer && hovercommandcontainer.style) {
                        var splitViewPane = Application.navigator.splitViewPane;
                        if (splitViewPane) {
                            var width = splitViewPane.clientWidth;
                            if (width > 0 && width !== that.prevWidth) {
                                that.prevWidth = width;
                                hovercommandcontainer.style.left = "calc(50% - 10px)"; //
                            }
                        } else {
                            hovercommandcontainer.style.left = "calc(50% - 58px)";
                        }
                    }*/
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
