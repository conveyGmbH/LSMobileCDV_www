// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/fragments/imgSketch/imgSketchController.js" />

(function () {
    "use strict";

    var fragmentName = Application.getFragmentPath("imgSketch");

    Fragments.define(fragmentName, {
        // This function is called whenever a user navigates to this fragment. It
        // populates the fragment elements with the app"s data.
        ready: function (element, options) {
            Log.call(Log.l.trace, fragmentName + ".");
            // TODO: Initialize the fragment here.
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            // add page specific commands to AppBar
            var commandList = [
                { id: "clickZoomIn", label: getResourceText("command.zoomin"), tooltip: getResourceText("tooltip.zoomin"), section: "primary", svg: "zoom_in" },
                { id: "clickZoomOut", label: getResourceText("command.zoomout"), tooltip: getResourceText("tooltip.zoomout"), section: "primary", svg: "zoom_out" },
                { id: "clickRotateLeft", label: getResourceText("command.rotate"), tooltip: getResourceText("tooltip.rotateLeft"), section: "primary", svg: "rotate_left" },
                { id: "clickRotateRight", label: getResourceText("command.rotate"), tooltip: getResourceText("tooltip.rotateRight"), section: "primary", svg: "rotate_right" },
                { id: "clickDelete", label: getResourceText("command.delete"), tooltip: getResourceText("tooltip.delete"), section: "primary", svg: "garbage_can" },
                { id: 'clickOk', label: getResourceText('command.ok'), tooltip: getResourceText('tooltip.ok'), section: 'primary', svg: 'navigate_check', key: WinJS.Utilities.Key.enter }
            ];
            this.controller = new ImgSketch.Controller(element, options, commandList);

            Log.ret(Log.l.trace);
        },

        unload: function () {
            Log.call(Log.l.trace, fragmentName + ".");
            // TODO: Respond to navigations away from this page.
            this.controller = null;
            Log.ret(Log.l.trace);
        },

        canUnload: function (complete, error) {
            Log.call(Log.l.trace, fragmentName + ".");
            var ret;
            if (this.controller) {
                ret = this.controller.saveData(function (response) {
                    // called asynchronously if ok
                    complete(response);
                }, function (errorResponse) {
                    error(errorResponse);
                });
            } else {
                ret = WinJS.Promise.as().then(function () {
                    var err = { status: 500, statusText: "fatal: fragment already deleted!" };
                    error(err);
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        updateLayout: function (element, viewState, lastViewState) {
            var ret = null;
            var that = this;
            Log.call(Log.l.u1, fragmentName + ".");
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    var doccontainer = element.querySelector(".doc-container");
                    if (doccontainer && doccontainer.style) {
                        var fragment = element.querySelector(".contentarea");
                        if (fragment) {
                            var width = fragment.clientWidth;
                            var height = fragment.clientHeight;

                            if (width > 0 && width !== that.prevWidth) {
                                that.prevWidth = width;
                                doccontainer.style.width = width.toString() + "px";
                            }
                            if (height > 0 && height !== that.prevHeight) {
                                that.prevHeight = height;
                                doccontainer.style.height = height.toString() + "px";
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