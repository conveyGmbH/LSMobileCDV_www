﻿// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/account/accountController.js" />

(function () {
    "use strict";

    var pageName = Application.getPagePath("account");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app"s data.
        ready: function(element, options) {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Initialize the page here.
            // add page specific commands to AppBar
            var commandList = [
                { id: "clickOk", label: getResourceText("command.ok"), tooltip: getResourceText("tooltip.ok"), section: "primary", svg: "navigate_check", key: WinJS.Utilities.Key.enter },
                { id: 'clickLogoff', label: getResourceText('command.logoff'), tooltip: getResourceText('tooltip.logoff'), section: 'secondary' }
            ];

            this.controller = new Account.Controller(element, commandList);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickOk.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },

        canUnload: function(complete, error) {
            Log.call(Log.l.trace, pageName + ".");
            var ret;
            var that = this;
            if (AppData._persistentStates.showvisitorFlow === 1 ||
            (AppData._persistentStates.showvisitorFlow === 2 &&
                AppData.generalData.area &&
                AppData.generalData.inOut)) {
                Application.startPage = Application.getPagePath("barcode");
                // static array of menu groups for the split view pane
                Application.navigationBarGroups = [
                    { id: "barcode", group: 1, svg: "lsvFlow", disabled: false },
                    //{ id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                    { id: "info", group: 3, svg: "gearwheel", disabled: false },
                    { id: "support", group: 7, svg: "user_headset", disabled: false }
                ];
            } else {
                // static array of menu groups for the split view pane
                Application.navigationBarGroups = [
                    { id: "start", group: 1, svg: "home", disabled: false },
                    { id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                    { id: "info", group: 3, svg: "gearwheel", disabled: false },
                    { id: "support", group: 7, svg: "user_headset", disabled: false }
                ];
            }
            if (this.controller) {
                if (this.controller.binding.doReloadDb) {
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    ret = confirm(confirmTitle,
                        function (result) {
                            return result;
                        }).then(function(result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            if (result) {
                                ret = that.controller.saveData(function (response) {
                                    // called asynchronously if ok
                                        Application.pageframe.reCheckForLanguage(function () {
                                    complete(response);
                                        }, function () {
                                            var errorResponse = "Error: failed to switch language!";
                                            error(errorResponse);
                                        });
                                },
                                function (errorResponse) {
                                    error(errorResponse);
                                });
                            } else {
                                Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                                error("canceled");
                            }
                        });
                } else {
                    ret = this.controller.saveData(function (response) {
                        // called asynchronously if ok
                            Application.pageframe.reCheckForLanguage(function () {
                        complete(response);
                            }, function () {
                                var errorResponse = "Error: failed to switch language!";
                                error(errorResponse);
                            });
                    },
                    function (errorResponse) {
                        error(errorResponse);
                    });
                }
            } else {
                ret = WinJS.Promise.as().then(function () {
                    var err = { status: 500, statusText: "fatal: page already deleted!" };
                    error(err);
                });
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        unload: function() {
            Log.call(Log.l.trace, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },

        updateLayout: function(element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            // TODO: Respond to changes in viewState.
        }
    });
})();