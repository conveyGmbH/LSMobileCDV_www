// controller for page: account
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/account/accountService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Account", {
        getClassNameOffline: function (useOffline) {
            return useOffline ? "field_line field_line_even" : "hide-element";
        },
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Account.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: AppData._persistentStates.odata.login,
                    Password: AppData._persistentStates.odata.password
                },
                doEdit: false,
                doReloadDb: false,
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            } ]);

            var prevLogin = AppData._persistentStates.odata.login;
            var prevPassword = AppData._persistentStates.odata.password;
            var prevHostName = AppData._persistentStates.odata.hostName;
            var prevOnlinePort = AppData._persistentStates.odata.onlinePort;
            var prevOnlinePath = AppData._persistentStates.odata.onlinePath;
            var prevUseOffline = AppData._persistentStates.odata.useOffline;
            if (!prevLogin || !prevPassword || !prevHostName || !prevUseOffline) {
                // enable edit per default on empty settings
                this.binding.doEdit = true;
            }
            var portalLink = pageElement.querySelector("#portalLink");
            if (portalLink) {
                var portalLinkUrl = (AppData._persistentStates.odata.https ? "https://" : "http://") +
                    AppData._persistentStates.odata.hostName + getResourceText("account.portalPath");
                portalLink.innerHTML = "<a href=\"" + portalLinkUrl + "\">" + portalLinkUrl + "</a>";
            }
            var contentarea = pageElement.querySelector(".contentarea");

            var that = this;

            var applyColorSetting = function (colorProperty, color) {
                Log.call(Log.l.trace, "Settings.Controller.", "colorProperty=" + colorProperty + " color=" + color);

                Colors[colorProperty] = color;
                that.binding.generalData[colorProperty] = color;
                switch (colorProperty) {
                    case "accentColor":
                        /* that.createColorPicker("backgroundColor");
                         that.createColorPicker("textColor");
                         that.createColorPicker("labelColor");
                         that.createColorPicker("tileTextColor");
                         that.createColorPicker("tileBackgroundColor");
                         that.createColorPicker("navigationColor");*/
                        // fall through...
                    case "navigationColor":
                        AppBar.loadIcons();
                        NavigationBar.groups = Application.navigationBarGroups;
                        break;
                }
                Log.ret(Log.l.trace);
            }
            this.applyColorSetting = applyColorSetting;

            var resultConverter = function (item, index) {
                if (item.INITOptionTypeID > 10) {
                    switch (item.INITOptionTypeID) {
                        case 11:
                            item.colorPickerId = "accentColor";
                            break;
                        case 12:
                            item.colorPickerId = "backgroundColor";
                            break;
                        case 13:
                            item.colorPickerId = "navigationColor";
                            break;
                        case 14:
                            item.colorPickerId = "textColor";
                            break;
                        case 15:
                            item.colorPickerId = "labelColor";
                            break;
                        case 16:
                            item.colorPickerId = "tileTextColor";
                            break;
                        case 17:
                            item.colorPickerId = "tileBackgroundColor";
                            break;
                        case 20:
                            item.pageProperty = "questionnaire";
                            break;
                        case 21:
                            item.pageProperty = "sketch";
                            break;
                        default:
                            // defaultvalues
                    }
                    if (item.colorPickerId) {
                        item.colorValue = "#" + item.LocalValue;
                        that.applyColorSetting(item.colorPickerId, item.colorValue);
                    }
                    if (item.pageProperty) {
                        if (item.LocalValue === "1") {
                            NavigationBar.enablePage(item.pageProperty);
                        } else if (item.LocalValue === "0") {
                            NavigationBar.disablePage(item.pageProperty);
                        }
                    }
                }
            }
            this.resultConverter = resultConverter;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    //that.binding.doEdit -> hat sich was geändert?
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle,
                        function (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            if (result) {
                                Application.navigateById("login", event);
                            } else {
                                Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                            }
                        });


                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickDoEdit: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.doEdit = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickDoReloadDb: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.doReloadDb = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickHttps: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.appSettings.odata.https = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseOffline: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (event.currentTarget && AppBar.notifyModified && that.binding.doEdit) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.appSettings.odata.useOffline = toggle.checked;
                            AppBar.triggerDisableHandlers();
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function() {
                    // work on user change handling!
                    if (!that.binding.appSettings.odata.useOffline) {
                        that.binding.doReloadDb = false;
                    } else if (that.binding.dataLogin.Login !== prevLogin ||
                        that.binding.dataLogin.Password !== prevPassword ||
                        that.binding.appSettings.odata.hostName !== prevHostName ||
                        that.binding.appSettings.odata.onlinePort !== prevOnlinePort ||
                        that.binding.appSettings.odata.onlinePath !== prevOnlinePath ||
                        !prevUseOffline) {
                        if (that.binding.appSettings.odata.hostName !== prevHostName) {
                            that.binding.doReloadDb = true;
                        }
                        that.binding.doEdit = true;
                    }
                    if (AppBar.busy) {
                        NavigationBar.disablePage("start");
                    } else {
                        NavigationBar.enablePage("start");
                    }
                    return AppBar.busy;
                }
            };

            var openDb = function (complete, error) {
                var ret;
                Log.call(Log.l.info, "Account.Controller.");
                if (AppRepl.replicator &&
                    AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        that.openDb(complete, error);
                    });
                } else {
                    ret = AppData.openDB(function (json) {
                        AppBar.busy = false;
                        AppData._curGetUserDataId = 0;
                        AppData.getUserData();
                        complete(json);
                    }, function (curerr) {
                        AppBar.busy = false;
                        AppData.setErrorMsg(that.binding, curerr);
                        AppData._persistentStates.odata.dbSiteId = 0;
                        Application.pageframe.savePersistentStates();
                        error(curerr);
                    }, function (res) {
                        if (res) {
                            that.binding.progress = {
                                percent: res.percent,
                                text: res.statusText,
                                show: 1
                            };
                        }
                    }, true);
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            var saveData = function (complete, error) {
                var err = null, ret;
                Log.call(Log.l.trace, "Account.Controller.");
                if (contentarea) {
                    contentarea.scrollTop = 0;
                }
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                if (!that.binding.doEdit) {
                    ret = WinJS.Promise.as();
                    complete({});
                } else {
                    AppBar.busy = true;
                    that.binding.appSettings.odata.onlinePath = AppData._persistentStatesDefaults.odata.onlinePath;
                    that.binding.appSettings.odata.registerPath = AppData._persistentStatesDefaults.odata.registerPath;
                    ret = Account.loginRequest.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.call(Log.l.trace, "loginRequest: success!");
                        // loginData returns object already parsed from json file in response
                        if (json && json.d && json.d.ODataLocation) {
                            if (json.d.InactiveFlag) {
                                AppBar.busy = false;
                                err = { status: 503, statusText: getResourceText("account.inactive") };
                                AppData.setErrorMsg(that.binding, err);
                                error(err);
                            } else {
                                var location = json.d.ODataLocation;
                                if (location !== that.binding.appSettings.odata.onlinePath) {
                                    that.binding.appSettings.odata.onlinePath = location + AppData._persistentStatesDefaults.odata.onlinePath;
                                    that.binding.appSettings.odata.registerPath = location + AppData._persistentStatesDefaults.odata.registerPath;
                                }
                                Application.pageframe.savePersistentStates();
                            }
                        } else {
                            AppBar.busy = false;
                            err = { status: 404, statusText: getResourceText("account.unknown") };
                            AppData.setErrorMsg(that.binding, err);
                            error(err);
                        }
                        return WinJS.Promise.as();
                    }, function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                        // ignore this error here for compatibility!
                        return WinJS.Promise.as();
                    }, {
                        LoginName: that.binding.dataLogin.Login
                    }).then(function () {
                        if (!err) {
                            var dataLogin = {
                                Login: that.binding.dataLogin.Login,
                                Password: that.binding.dataLogin.Password,
                                LanguageID: AppData.getLanguageId()
                            };
                            return Account.loginView.insert(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "loginData: success!");
                                // loginData returns object already parsed from json file in response
                                if (json && json.d) {
                                    dataLogin = json.d;
                                    if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                        that.binding.appSettings.odata.login = that.binding.dataLogin.Login;
                                        that.binding.appSettings.odata.password = that.binding.dataLogin.Password;
                                        NavigationBar.enablePage("settings");
                                        NavigationBar.enablePage("info");
                                        NavigationBar.enablePage("search");
                                        var prevMitarbeiterId = AppData.generalData.getRecordId("Mitarbeiter");
                                        var doReloadDb = false;
                                        if (!AppData._persistentStates.odata.dbSiteId ||
                                            prevMitarbeiterId !== dataLogin.MitarbeiterID ||
                                            that.binding.doReloadDb) {
                                            doReloadDb = true;
                                        }
                                        Log.print(Log.l.info, "loginData: doReloadDb=" + doReloadDb + " useOffline=" + that.binding.appSettings.odata.useOffline);
                                        if (doReloadDb) {
                                            AppData._persistentStates.allRestrictions = {};
                                            AppData._persistentStates.allRecIds = {};
                                            AppData._userData = {};
                                            AppData._userRemoteData = {};
                                            AppData._contactData = {};
                                            AppData._photoData = null;
                                            AppData._barcodeType = null;
                                            AppData._barcodeRequest = null;
                                            AppData.generalData.setRecordId("Mitarbeiter", dataLogin.MitarbeiterID);
                                        }
                                        if (that.binding.appSettings.odata.useOffline) {
                                            if (doReloadDb) {
                                                if (!that.binding.doReloadDb) {
                                                    that.binding.doReloadDb = true;
                                                }
                                                AppData._persistentStates.odata.dbSiteId = dataLogin.Mitarbeiter_AnmeldungVIEWID;
                                                Application.pageframe.savePersistentStates();
                                                return that.openDb(complete, error);
                                            } else {
                                                AppBar.busy = false;
                                                AppData._curGetUserDataId = 0;
                                                AppData.getUserData();
                                                complete(json);
                                                return WinJS.Promise.as();
                                            }
                                        } else {
                                            AppBar.busy = false;
                                            AppData.generalData.setRecordId("Kontakt", dataLogin.KontaktID);
                                            AppData._curGetUserDataId = 0;
                                            AppData.getUserData();
                                            complete(json);
                                            return WinJS.Promise.as();
                                        }
                                    } else {
                                        AppBar.busy = false;
                                        that.binding.messageText = dataLogin.MessageText;
                                        err = { status: 401, statusText: dataLogin.MessageText };
                                        AppData.setErrorMsg(that.binding, err);
                                        error(err);
                                        return WinJS.Promise.as();
                                    }
                                } else {
                                    AppBar.busy = false;
                                    err = { status: 404, statusText: "no data found" };
                                    AppData.setErrorMsg(that.binding, err);
                                    error(err);
                                    return WinJS.Promise.as();
                                }
                            }, function (errorResponse) {
                                AppBar.busy = false;
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                                error(errorResponse);
                                return WinJS.Promise.as();
                            }, dataLogin);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (!err) {
                            // load color settings
                            return Account.CR_VERANSTOPTION_ODataView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "Account: success!");
                                // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    var results = json.d.results;
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                } else {
                                    AppData._persistentStates.individualColors = false;
                                    AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                                    var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }).then(function () {
                                Colors.updateColors();
                                return WinJS.Promise.as();
                            });
                        } else {
                            return WinJS.Promise.as();
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                Application.pageframe.hideSplashScreen();
            });
            Log.ret(Log.l.trace);
        })
    });
})();


