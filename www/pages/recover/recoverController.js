// controller for page: recover
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/recover/recoverService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Recover", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Recover.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataRecover: getEmptyDefaultValue(Recover.recoverView.defaultValue),
                emailOkFlag: null,
                recoverOkFlag: null
            }, commandList]);

            var that = this;

            var getEmailOkFlag = function () {
                if (that.binding.dataRecover &&
                    (that.binding.dataRecover.ErfassungsStatus === 1 ||
                     that.binding.dataRecover.Freischaltung > 0)) {
                    return 1;
                } else {
                    return null;
                }
            };
            this.getEmailOkFlag = getEmailOkFlag;

            var getRecoverOkFlag = function () {
                if (that.binding.dataRecover &&
                    that.binding.dataRecover.Freischaltung === 3 &&
                    that.binding.dataRecover.ErfassungsStatus === 1) {
                    return 1;
                } else {
                    return null;
                }
            };
            this.getRecoverOkFlag = getRecoverOkFlag;

            var setDataRecover = function (newDataRecover) {
                var i, recoverEmail, recoverComplete;
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataRecover = newDataRecover;
                that.binding.emailOkFlag = that.getEmailOkFlag();
                that.binding.recoverOkFlag = that.getRecoverOkFlag();
                if (that.binding.dataRecover.ErfassungsStatus === 1 &&
                    that.binding.dataRecover.Freischaltung === 0) {
                    that.binding.dataRecover.Freischaltung = 2;
                    recoverEmail = pageElement.querySelectorAll(".recover-email");
                    if (recoverEmail && recoverEmail.length > 0) {
                        WinJS.UI.Animation.exitContent(recoverEmail, null).then(function() {
                            for (i = 0; i < recoverEmail.length; i++) {
                                if (recoverEmail[i].style) {
                                    recoverEmail[i].style.visibility = "hidden";
                                    recoverEmail[i].style.display = "none";
                                }
                            }
                        });
                    }
                }
                if (that.binding.dataRecover.Freischaltung === 3) {
                    recoverComplete = pageElement.querySelectorAll(".recover-complete");
                    if (recoverComplete && recoverComplete.length > 0) {
                        for (i = 0; i < recoverComplete.length; i++) {
                            if (recoverComplete[i].style) {
                                recoverComplete[i].style.display = "inline";
                                recoverComplete[i].style.visibility = "visible";
                            }
                        }
                        //WinJS.UI.Animation.enterContent(recoverComplete, null, { mechanism: "transition" });
                        WinJS.UI.Animation.slideUp(recoverComplete);
                    }
                }
                if (that.binding.dataRecover.MessageText) {
                    AppData.setErrorMsg(that.binding, that.binding.dataRecover.MessageText);
                }
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setDataRecover = setDataRecover;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Recover.Controller.");
                    that.saveData(function (response) {
                        // called asynchronously if ok
                    }, function (errorResponse) {
                        // called asynchronously on error
                    });
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Recover.Controller.");
                    if (AppData.generalData.logOffOptionActive) {
                        var anchor = document.getElementById("menuButton");
                        var menu = document.getElementById("menu1").winControl;
                        var placement = "bottom";
                        menu.show(anchor, placement);
                    } else {
                        Application.navigateById("userinfo", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            Application.navigateById("login", event);
                        } else {
                            Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                        }
                    });
                    /*AppData._persistentStates.privacyPolicyFlag = false;
                    if (AppHeader && AppHeader.controller && AppHeader.controller.binding.userData) {
                        AppHeader.controller.binding.userData = {};
                        if (!AppHeader.controller.binding.userData.VeranstaltungName) {
                            AppHeader.controller.binding.userData.VeranstaltungName = "";
                        }
                    }*/
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function () {
                    if (!that.binding.dataRecover.Freischaltung ||
                        that.binding.dataRecover.Freischaltung < 3) {
                        return AppBar.busy;
                    } else {
                        return true;
                    }
                },
                clickLogoff: function () {
                    var logoffbutton = document.getElementById("logoffbutton");
                    if (logoffbutton) {
                        logoffbutton.disabled = that.binding.generalData.notAuthorizedUser ? false : that.binding.generalData.logOffOptionActive ? false : true;
                    }
                    if (that.binding.generalData.notAuthorizedUser) {
                        return false;
                    }
                    return !that.binding.generalData.logOffOptionActive;
                }
            }

            var saveData = function (complete, error) {
                var err;
                Log.call(Log.l.trace, "Recover.Controller.");
                // reset ErfassungsStatus!
                that.binding.dataRecover.ErfassungsStatus = 0;
                AppData.setErrorMsg(that.binding);
                AppBar.busy = true;
                var ret = Recover.recoverView.insert(function (json) {
                    AppBar.busy = false;
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "recoverData: success!");
                    // loginData returns object already parsed from json file in response
                    if (json && json.d) {
                        that.setDataRecover(json.d);
                    } else {
                        err = { status: 404, statusText: "no data found" };
                        AppData.setErrorMsg(that.binding, err);
                        error(err);
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    AppBar.busy = false;
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                    error(errorResponse);
                    return WinJS.Promise.as();
                }, that.binding.dataRecover);
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;
            
            that.setDataRecover(getEmptyDefaultValue(Recover.recoverView.defaultValue));
            that.binding.dataRecover.LanguageID = AppData.getLanguageId();
            Log.print(Log.l.trace, "LanguageID=" + that.binding.dataRecover.LanguageID);

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                AppBar.notifyModified = true;
            });
            Log.ret(Log.l.trace);
        })
    });
})();


