// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/photoRemote/photoRemoteController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("photoRemote");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;

            // add page specific commands to AppBar
            var commandList = [
                { id: "clickBack", label: getResourceText("command.backward"), tooltip: getResourceText("tooltip.backward"), section: "primary", svg: "navigate_left" },
                //{ id: "clickNew", label: getResourceText("command.new"), tooltip: getResourceText("tooltip.new"), section: "primary", svg: "user_plus" },
                //{ id: "clickZoomIn", label: getResourceText("command.zoomIn"), tooltip: getResourceText("tooltip.zoomIn"), section: "primary", svg: "zoom_in" },
                //{ id: "clickZoomOut", label: getResourceText("command.zoomOut"), tooltip: getResourceText("tooltip.zoomOut"), section: "primary", svg: "zoom_out" },
                { id: "clickRotate", label: getResourceText("command.rotate"), tooltip: getResourceText("tooltip.rotate"), section: "primary", svg: "rotate_right" }
            ];

            this.controller = new PhotoRemote.Controller(element, commandList);
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
                ret = WinJS.Promise.timeout(0).then(function () {
                    if (element) {
                        var controller = PhotoRemote.controller;
                        if (controller) {
                            //var width = element.clientWidth;
                            var photoContainer = element.querySelector(".photo-container");
                            if (photoContainer &&
                                photoContainer.style) {
                                var imgElement = photoContainer.firstElementChild || photoContainer.firstChild;
                                if (imgElement) {
                                    var height;
                                    if (controller.angle === 90 || controller.angle === 270) {
                                        height = imgElement.width + 16;
                                    } else {
                                        height = imgElement.height + 16;
                                    }
                                    photoContainer.style.height = height + "px";
                                }
                            }
                        }
                    }
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
