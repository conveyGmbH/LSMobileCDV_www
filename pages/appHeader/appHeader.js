// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/appHeader/appHeaderController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("appHeader");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            this.inResize = 0;
            this.controller = new AppHeader.Controller(element);

            var appLogoContainer = document.querySelector(".app-logo-container");
            if (appLogoContainer) {
                NavigationBar._logoLoaded = true;
                var rgb = Colors.hex2rgb(Colors.navigationColor);
                var rgbStr = (rgb.r + rgb.g + rgb.b) / 3 >= 128 ? "#000000" : "#ffffff";
                // load the image file
                var svgObject = appLogoContainer.querySelector(".app-logo");
                if (svgObject && !(svgObject.firstElementChild || svgObject.firstChild)) {
                    Colors.loadSVGImage({
                        fileName: svgObject.id,
                        element: svgObject,
                        size: { width: 182, height: 44 },
                        useStrokeColor: false,
                        strokeWidth: 100
                    });
                }
            }
            var userImage = element.querySelector(".user-image");
            if (userImage) {
                Colors.loadSVGImage({
                    fileName: userImage.id,
                    element: userImage,
                    size: 28,
                    color: "#f0f0f0",
                    strokeWidth: AppData._persistentStates.iconStrokeWidth
                });
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
                    var strStyleWidth;
                    var strStyleFloat;
                    if (document.body.clientWidth <= 899) {
                        strStyleWidth = "100%";
                        strStyleFloat = "left";
                    } else {
                        var widthLogo = 280;
                        var widthMaster = 0;
                        var widthAdd = 12;
                        if (Application.navigator.masterElement && Application.navigator._nextMaster) {
                            widthMaster = Application.navigator.masterElement.clientWidth;
                        }
                        if (widthMaster + widthAdd > widthLogo) {
                            widthLogo = widthMaster + widthAdd;
                        }
                        if (NavigationBar.orientation === "vertical" &&
                            NavigationBar.navVertWidth + widthAdd > widthLogo) {
                            widthLogo = NavigationBar.navVertWidth + widthAdd;
                        }
                        strStyleWidth = "calc(100% - " + widthLogo.toString() + "px)";
                        strStyleFloat = "right";
                    }
                    var eventLine = document.querySelector(".event-line");
                    var menuButton = document.querySelector("#menuButton");
                    var eventField = document.querySelector(".event-field");
                    eventLine.style.width = "calc(100% - " + (menuButton.getBoundingClientRect().width + 48).toString() + "px)";

                    if (eventField && eventField.style) {
                        eventField.style.width = strStyleWidth;
                        eventField.style.float = strStyleFloat;
                    }
                    var eventField = document.querySelector(".event-field");

                    function resize2fit(container) {
                        var child = container.children[0];
                        if (!container.parentElement || child.offsetWidth === 0) return;
                        child.style.fontSize = "1em";
                        var containerRect = {
                            max_width: container.getBoundingClientRect().width + 48,
                            max_height: container.getBoundingClientRect().height + 4
                        };
                        var childRect = {
                            width: child.getBoundingClientRect().width,
                            height: child.getBoundingClientRect().height
                        }
                        if (child && child.style) {
                            child.style.fontSize = Math.min(Math.min(containerRect.max_width / childRect.width, containerRect.max_height / childRect.height), 1.32) + "em";
                            while (container.getBoundingClientRect().height / (1.5 * 14) >= 3) {
                                    child.innerText = child.innerText.replace(/\W*\s(\S)*$/, '...');
                            }
                            if ((child.getBoundingClientRect().height / (1.5 * 14)) >= 2) {
                                container.style.marginTop = "-2px";
                                container.style.lineHeight = "normal";
                            } else {
                                container.style.marginTop = "8px";
                                container.style.lineHeight = "1.5";
                            }
                        }
                    }
                    if (eventField) {
                        resize2fit(eventField);
                    }
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.u1);
            return ret;
        }
    });
})();
