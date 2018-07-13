// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/fragments/svgSketch/svg.js" />
/// <reference path="~/www/fragments/svgSketch/svgSketchController.js" />

(function () {
    "use strict";

    var fragmentName = Application.getFragmentPath("svgSketch");

    Fragments.define(fragmentName, {
        // This function is called whenever a user navigates to this fragment. It
        // populates the fragment elements with the app"s data.
        ready: function (element, options) {
            Log.call(Log.l.trace, fragmentName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            if (element) {
                var shapeElements = element.querySelectorAll(".tool-image");
                if (shapeElements && shapeElements.length > 0) {
                    for (var i = 0; i < shapeElements.length; i++) {
                        if (shapeElements[i].id && shapeElements[i].id.length > 0) {
                            var svgObject = shapeElements[i];
                            // insert svg object before span element 
                            if (svgObject && !svgObject.firstChild) {
                                var size = 32;
                                if (svgObject.parentNode &&
                                    svgObject.parentNode.clientWidth) {
                                    size = svgObject.parentNode.clientWidth;
                                }
                                svgObject.setAttribute("width", size.toString());
                                svgObject.setAttribute("height", size.toString());
                                svgObject.style.display = "inline";

                                // overlay span element over svg object to enable user input
                                //winCommandimage.setAttribute("style", "position: relative; top: -28px; width: 24px; height: 24px;");

                                // load the image file
                                Colors.loadSVGImage({
                                    fileName: shapeElements[i].id,
                                    color: Colors.textColor,
                                    size: size,
                                    useFillColor: false,
                                    useStrokeColor: true
                                });
                            }
                        }
                    }
                }
            }

            var commandList = options && options.isLocal ? [
                { id: 'clickUndo', label: getResourceText('command.undo'), tooltip: getResourceText('tooltip.undo'), section: 'primary', svg: 'undo' },
                { id: 'clickRedo', label: getResourceText('command.redo'), tooltip: getResourceText('tooltip.redo'), section: 'primary', svg: 'redo' },
                { id: "clickShare", label: getResourceText("command.share"), tooltip: getResourceText("tooltip.share"), section: "primary", svg: "share" },
                { id: 'clickShapes', label: getResourceText('sketch.shape'), tooltip: getResourceText('sketch.shape'), section: 'secondary' },
                { id: 'clickColors', label: getResourceText('sketch.color'), tooltip: getResourceText('sketch.color'), section: 'secondary' },
                { id: 'clickWidths', label: getResourceText('sketch.width'), tooltip: getResourceText('sketch.width'), section: 'secondary' }
            ] : [
                { id: "clickShare", label: getResourceText("command.share"), tooltip: getResourceText("tooltip.share"), section: "primary", svg: "share" }
            ];
            this.controller = new SvgSketch.Controller(element, options, commandList);

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
                            var bDoEditorResize = false;

                            if (width > 0 && width !== that.prevWidth) {
                                that.prevWidth = width;
                                doccontainer.style.width = width.toString() + "px";
                                bDoEditorResize = true;
                            }
                            if (height > 0 && height !== that.prevHeight) {
                                that.prevHeight = height;
                                doccontainer.style.height = height.toString() + "px";
                                bDoEditorResize = true;
                            }
                            if (bDoEditorResize && that.controller && that.controller.svgEditor) {
                                that.controller.svgEditor.resize(width, height);
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