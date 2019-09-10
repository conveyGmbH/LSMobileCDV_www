// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/sketch/privacyController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("privacy");

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
            var commandList = [
                { id: 'clickBack', label: getResourceText('command.backward'), tooltip: getResourceText('tooltip.backward'), section: 'primary', svg: 'navigate_left' },
                { id: "clickNew", label: getResourceText("command.new"), tooltip: getResourceText("tooltip.new"), section: "primary", svg: "user_plus" },
                { id: 'clickForward', label: getResourceText('command.ok'), tooltip: getResourceText('tooltip.ok'), section: 'primary', svg: 'navigate_check', key: WinJS.Utilities.Key.enter }
            ];
            
            this.controller = new Sketch.Controller(element, commandList);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        canUnload: function (complete, error) {
            Log.call(Log.l.trace, pageName + ".");
            var ret;
            var that = this;
            if (that.controller) {
                ret = WinJS.Promise.as().then(function () {
                    // called asynchronously if ok
                    // call fragment canUnload
                    var doc = that.controller.docViewer;
                    if (doc && doc.canUnload) {
                        doc.canUnload(complete, error);
                    } else {
                        complete();
                    }
                });
            } else {
                ret = WinJS.Promise.as().then(function () {
                    complete();
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        unload: function () {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },
    
        updateLayout: function (element, viewState, lastViewState) {
            var ret = null;
            var that = this;
            Log.call(Log.l.trace, pageName + ".");
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    var contentarea = element.querySelector(".contentarea");
                    var mySketch = element.querySelector(".signaturefragmenthost");
                    if (contentarea && mySketch && mySketch.style) {
                        var contentHeader = element.querySelector(".content-header");
                        var width = contentarea.clientWidth;
                        var height = contentarea.clientHeight - (contentHeader ? contentHeader.clientHeight : 0);
                        if (width !== that.prevWidth) {
                            mySketch.style.width = width.toString() + "px";
                            that.prevWidth = width;
                        }
                        if (height !== that.prevHeight) {
                            mySketch.style.height = height.toString() + "px";
                            that.prevHeight = height;
                        }
                    }
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.trace);
            return ret || WinJS.Promise.as();
        }
    });

})();





