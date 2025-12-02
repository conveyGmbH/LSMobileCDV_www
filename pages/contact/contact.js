// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/contact/contactController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("contact");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            // add page specific commands to AppBar
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;
            var commandList = [
                { id: "clickBack", label: getResourceText("command.backward"), tooltip: getResourceText("tooltip.backward"), section: "primary", svg: "navigate_left" },
                { id: "clickNew", label: getResourceText("command.new"), tooltip: getResourceText("tooltip.new"), section: "primary", svg: "user_plus" },
                /*{ id: "clickOpen", label: getResourceText("command.open"), tooltip: getResourceText("tooltip.open"), section: "primary", svg: "id_card" },*/
                { id: "clickShare", label: getResourceText("command.share"), tooltip: getResourceText("tooltip.share"), section: "primary", svg: "share" },
                { id: "clickBarcodeEdit", label: getResourceText("command.barcodeEdit"), tooltip: getResourceText("tooltip.barcodeEdit"), section: "primary", svg: "barcode_hand_point_up" },
                { id: "clickLinkedinOauth", label: getResourceText("command.linkedinOauth"), tooltip: getResourceText("tooltip.linkedinOauth"), section: "primary", svg: "linkedin" },
                { id: "clickForward", label: getResourceText("command.ok"), tooltip: getResourceText("tooltip.ok"), section: "primary", svg: "navigate_check", key: WinJS.Utilities.Key.enter },
                { id: "clickDelete", label: getResourceText("command.delete"), tooltip: getResourceText("tooltip.delete"), section: "secondary", svg: "garbage_can" }
            ];

            this.controller = new Contact.Controller(element, commandList);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        canUnload: function (complete, error) {
            Log.call(Log.l.trace, pageName + ".");
            var ret;
            if (this.controller) {
                ret = this.controller.saveData(function (response) {
                    // called asynchronously if ok
                    complete(response);
                }, function(errorResponse) {
                    error(errorResponse);
                });
            } else {
                ret = WinJS.Promise.as().then(function () {
                    var err = { status: 500, statusText: "fatal: page already deleted!" };
                    error(err);
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
            /// <param name="element" domElement="true" />
            Log.call(Log.l.u1, pageName + ".");
            // TODO: Respond to changes in viewState.
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(100).then(function() {
                    var waitCircleContainer = element.querySelector(".wait-circle-container");
                    var comment = element.querySelector("#comment");
                    var waitCircle = element.querySelector(".wait-circle");
                    var rect1 = waitCircle.getBoundingClientRect();
                    var rect2 = comment.getBoundingClientRect();
                    var overlap = !(rect1.right < rect2.left ||
                        rect1.left > rect2.right ||
                        rect1.bottom < rect2.top ||
                        rect1.top > rect2.bottom);
                    if (that.controller.binding.dataContact && that.controller.binding.dataContact.Flag_NoEdit) {
                        if (overlap) {
                            waitCircleContainer.style.display = "none";
                        } else {
                            if (waitCircleContainer.style.display === "none") {
                                waitCircleContainer.style.display = "";
                            }
                        }
                    } else {
                        waitCircleContainer.style.display = "none";
                    }
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
