// controller for page: dbinit
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
/// <reference path="~/www/pages/dbinit/dbinitService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("DBInit", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "DBInit.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataLogin: {
                    Login: "",
                    Password: "",
                    privacyPolicyFlag: false,
                    privacyPolicydisabled: false
                },
                progress: {
                    percent: 0,
                    text: "",
                    show: null
                }
            }, commandList]);

            var isAppleDevice = AppData.checkIPhoneBug();
            var isWindowsDevice = AppData.checkWindows();
            var isAndroidDevice = AppData.checkAndroid();

            var that = this;

            var userId = null;
            var alertOkButton = document.querySelector("#alertFlyout #okButton");

            var getStartPage = function () {
                var startPage;
                //var userId = null;
                if (typeof AppData._persistentStates.allRecIds !== "undefined" &&
                    typeof AppData._persistentStates.allRecIds["Mitarbeiter"] !== "undefined") {
                    userId = AppData._persistentStates.allRecIds["Mitarbeiter"];
                    Log.print(Log.l.info, "userId=" + userId);
                }
                if (!userId ||
                    !that.binding.appSettings.odata.login ||
                    !that.binding.appSettings.odata.password ||
                    !that.binding.appSettings.odata.dbSiteId) {
                    startPage = "login";
                } else {
                    if ((AppData._persistentStates.showvisitorFlow === 1 ||
                        (AppData._persistentStates.showvisitorFlow === 2 &&
                            AppData.generalData.area &&
                            AppData.generalData.inOut))) {
                        startPage = "barcode";
                        Application.navigationBarGroups = [
                            { id: "barcode", group: 1, svg: "lsvFlow", disabled: false },
                            //{ id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                            { id: "info", group: 3, svg: "gearwheel", disabled: false },
                            { id: "support", group: 7, svg: "user_headset", disabled: false }
                        ];
                    } else {
                        startPage = "start";
                        Application.navigationBarGroups = [
                            { id: "start", group: 1, svg: "home", disabled: false },
                            { id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                            { id: "info", group: 3, svg: "gearwheel", disabled: false },
                            { id: "support", group: 7, svg: "user_headset", disabled: false }
                        ];
                    }
                }
                return startPage;
            }
            this.getStartPage = getStartPage;

            // define handlers
            this.eventHandlers = {
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
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
                    if (AppData.generalData.logOffOptionActive) {
                        var anchor = document.getElementById("menuButton");
                        var menu = document.getElementById("menu1").winControl;
                        var placement = "bottom";
                        menu.show(anchor, placement);
                    } else {
                        Application.navigateById("userinfo", event);
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickLogoff: function () {
                    WinJS.Promise.timeout(10000).then(function () {
                        return false;
                    });
                    return true;
                }
            }

            var checkForNumberReplication = function () {
                var ret = null;
                Log.call(Log.l.info, "DBInit.Controller.");
                if (alertOkButton) {
                    //AppData.getNumberOfReplicationFlowSpecExt()
                    ret = DBInit.replicationFlowSpecView.select(function (json) {
                        if (json &&
                            json.d.results.length > 0) {
                            alertOkButton.disabled = true;
                            that.addDisposablePromise(WinJS.Promise.timeout(500).then(function () {
                                that.checkForNumberReplication();
                            }));
                        } else {
                            alertOkButton.disabled = false;
                        }
                    });
                }
                Log.ret(Log.l.info);
                return ret || WinJS.Promise.as();
            }
            that.checkForNumberReplication = checkForNumberReplication;

            var openDb = function (complete, error, doReloadDb) {
                AppBar.busy = true;
                var ret, loginIsEmpty = false, failed = false, confirmed = false, updateMessage = null, moveMitarbeiterMessage = null, newDBRequired = null;
                Log.call(Log.l.info, "DBInit.Controller.");
                if (AppRepl.replicator && AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "replicator still running - try later!");
                    ret = WinJS.Promise.timeout(500).then(function () {
                        return that.openDb(complete, error, doReloadDb);
                    });
                } else {
                    if (AppData._userRemoteDataPromise) {
                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                        AppData._userRemoteDataPromise.cancel();
                        AppData._userRemoteDataPromise = null;
                    }
                    if (doReloadDb) {
                        if (!AppData._persistentStates.odata.dbinitIncomplete) {
                            AppData._persistentStates.odata.dbinitIncomplete = true;
                            var employeeId = AppData.getRecordId("Mitarbeiter");
                            AppData._persistentStates.allRestrictions = {};
                            AppData._persistentStates.allRecIds = {};
                            AppData._userData = {};
                            AppData._persistentStates.veranstoption = {};
                            AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                            var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            Colors.updateColors();
                            AppData._userRemoteData = {};
                            AppData._contactData = {};
                            AppData._photoData = null;
                            AppData._barcodeType = null;
                            AppData._barcodeRequest = null;
                            AppData.setRecordId("Mitarbeiter", employeeId);
                            Application.pageframe.savePersistentStates();
                        }
                        //NavigationBar.disablePage("start");
                        //NavigationBar.disablePage("textblock");
                        //NavigationBar.disablePage("absence");
                        NavigationBar.groups = Application.navigationBarGroups;
                        if (AppHeader &&
                            AppHeader.controller &&
                            typeof AppHeader.controller.reloadMenu === "function") {
                            AppHeader.controller.reloadMenu();
                        }
                    }
                    ret = new WinJS.Promise.as().then(function () {
                        return AppData.openDB(function (json) {
                            AppBar.busy = false;
                            Log.print(Log.l.info, "openDB success!");
                            if (!userId ||
                                !that.binding.appSettings.odata.login ||
                                !that.binding.appSettings.odata.password ||
                                !that.binding.appSettings.odata.dbSiteId) {
                                Log.print(Log.l.info, "no login information set yet!");
                                loginIsEmpty = true;
                            } else {
                                AppData._curGetUserDataId = 0;
                                AppData.getUserData();
                            }
                            //AppData._curGetUserDataId = 0;
                            //AppData.getUserData();
                            if (!doReloadDb) {
                                function resultConverter(item, index) {
                                    var property = AppData.getPropertyFromInitoptionTypeID(item);
                                    if (property && property !== "individualColors" && (!item.pageProperty) && item.LocalValue) {
                                        item.colorValue = "#" + item.LocalValue;
                                        AppData.applyColorSetting(property, item.colorValue);
                                    }
                                }
                                var results = AppData._persistentStates.veranstoption;
                                if (results && results.length > 0) {
                                    AppData._persistentStates.serverColors = false;
                                    results.forEach(function (item, index) {
                                        resultConverter(item, index);
                                    });
                                    Application.pageframe.savePersistentStates();
                                }
                                Colors.updateColors();
                            }
                            // important to call complete here in case of db version upgrade
                            if (doReloadDb && typeof complete === "function") {
                                complete({});
                            }
                        }, function (err) {
                            AppBar.busy = false;
                            Log.print(Log.l.error, "openDB error!");
                            failed = true;
                            AppData.setErrorMsg(that.binding, err);
                            if (typeof error === "function") {
                                error(err);
                            }
                        }, function (res) {
                            if (res) {
                                that.binding.progress = {
                                    percent: res.percent,
                                    text: res.statusText,
                                    show: 1
                                }
                            }
                        }, doReloadDb);
                    }).then(function () {
                        if (loginIsEmpty || failed || doReloadDb) {
                            return WinJS.Promise.as();
                        } else {
                            return DBInit.versionView.select(function (json) {
                                AppData._persistentStates.dbVersion = json && json.d && json.d.results && json.d.results[0] && json.d.results[0].Version;
                                Log.print(Log.l.info, "versionView select success! dbVersion=" + AppData._persistentStates.dbVersion);
                                Application.pageframe.savePersistentStates();
                            }, function (err) {
                                Log.print(Log.l.error, "versionView select error - ignore that!");
                            });
                        }
                    }).then(function () {
                        if (loginIsEmpty || failed || doReloadDb) {
                            return WinJS.Promise.as();
                        } else if (AppRepl.replicator &&
                            AppRepl.replicator.networkState !== "Offline" &&
                            AppRepl.replicator.networkState !== "Unknown") {
                            var versionNo;
                            var versionNoPos = (typeof Application.version === "string") && Application.version.lastIndexOf(" ");
                            if (versionNoPos >= 0) {
                                versionNo = Application.version.substr(versionNoPos + 1);
                            } else {
                                versionNo = Application.version;
                            }
                            return AppData.call("PRC_CheckMobileVersion", {
                                pCreatorSiteID: AppData._persistentStates.odata.dbSiteId,
                                pDBVersion: AppData._persistentStates.dbVersion || null,
                                pAppVersion: versionNo,
                                pUser: that.binding.appSettings.odata.login,
                                pLanguageID: AppData.getLanguageId()
                            }, function (json) {
                                Log.print(Log.l.info, "PRC_CheckMobileVersion call success!");
                                if (json && json.d && json.d.results &&
                                    json.d.results[0] && json.d.results[0].UpdateMessage) {
                                    updateMessage = json.d.results[0].UpdateMessage || "Database update required!";
                                    newDBRequired = json.d.results[0].NewDBRequired;
                                }
                            }, function (err) {
                                Log.print(Log.l.error, "PRC_CheckMobileVersion call error - ignore that!");
                                if (err.status === 401) {
                                    // user is not authorized to access this service
                                    AppBar.scope.binding.generalData.notAuthorizedUser = true;
                                    AppBar.scope.binding.generalData.oDataErrorMsg = err;
                                    //var errorMessage = getResourceText("general.unauthorizedUser");
                                    //alert(errorMessage);
                                    //AppData.setErrorMsg(AppBar.scope.binding, err);
                                    // user is not authorized to access this service
                                    WinJS.Promise.timeout(1000).then(function () {
                                        Application.navigateById("account");
                                    });
                                }
                            });
                        } else {
                            Log.print(Log.l.info, "network state=" +
                                (AppRepl.replicator && AppRepl.replicator.networkState));
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (updateMessage) {
                            return checkForNumberReplication();
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (updateMessage) {
                            if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                AppData._persistentStates.odata.replActive = true;
                                AppRepl.replicator.run();
                                Application.pageframe.hideSplashScreen();
                                var confirmFirst = getResourceText("flyout.ok");
                                var confirmSecond = null;
                                // Abfrage ob ich user umhängen möchte oder abwarten 5 min
                                if (!AppData._fromStartPage && newDBRequired === 2) {
                                    confirmFirst = getResourceText("flyout.okChange");
                                    confirmSecond = getResourceText("flyout.cancelToLater");
                                    updateMessage = getResourceText("general.userChanging");
                                }
                                //return alert(updateMessage, function (updateConfirmed) {
                                if (AppData._fromStartPage && newDBRequired === 2) {
                                    confirmed = true;
                                } else {
                                    return confirmModal(null,
                                        updateMessage,
                                        confirmFirst,
                                        confirmSecond,
                                        function (updateConfirmed) {
                                            Log.print(Log.l.info, "updateMessage returned=" + updateConfirmed);
                                            if (updateConfirmed) {
                                                if (newDBRequired === 2) {
                                                    confirmed = true;
                                                }
                                                // neue App Version
                                                if (newDBRequired === 0) {
                                                    updateMessage = null;
                                                    AppData._ignore = true;
                                                    var appleStore = getResourceText("general.appleStore");
                                                    var playStore = getResourceText("general.playStore");
                                                    var microsoftStore = getResourceText("general.microsoftStore");
                                                    if (isAppleDevice && cordova.InAppBrowser) {
                                                        cordova.InAppBrowser.open(appleStore, '_system');
                                                        WinJS.Navigation.back(1).done();
                                                    }
                                                    if (isWindowsDevice && cordova.InAppBrowser) {
                                                        cordova.InAppBrowser.open(microsoftStore, '_system');
                                                        WinJS.Navigation.back(1).done();
                                                    }
                                                    if (isAndroidDevice) {
                                                        window.open(playStore, '_system');
                                                        WinJS.Navigation.back(1).done();
                                                    }
                                                }
                                            } else {
                                                Log.print(Log.l.trace, "User changed: user choice CANCEL");
                                                if (newDBRequired === 2) {
                                                    AppData._ignore = true;
                                                    AppData._alternativeTimeout = 300; //150
                                                    updateMessage = null;
                                                    moveMitarbeiterMessage = null;
                                                    if (!doReloadDb && !failed && typeof complete === "function") {
                                                        complete({});
                                                    }
                                                    //return WinJS.Promise.as();
                                                    //AppData.getUserRemoteData();
                                                }
                                                //confirmed = true;
                                                //Log.print(Log.l.info, "network state=" + (AppRepl.replicator && AppRepl.replicator.networkState));
                                                //return WinJS.Promise.as();
                                            }

                                        });
                                }
                            }
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (loginIsEmpty || failed || doReloadDb) {
                            return WinJS.Promise.as();
                        } else if (AppRepl.replicator &&
                            AppRepl.replicator.networkState !== "Offline" &&
                            AppRepl.replicator.networkState !== "Unknown" && newDBRequired === 2 && confirmed) {
                            return AppData.call("PRC_MoveAppMitarbeiter", {
                                pMitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter")
                            }, function (json) {
                                Log.print(Log.l.info, "PRC_MoveAppMitarbeiter call success!");
                                if (json &&
                                    json.d &&
                                    json.d.results &&
                                    json.d.results[0] &&
                                    json.d.results[0].ResultCode === 0) {
                                    AppData._movedSuccess = json.d.results[0].ResultCode;
                                    moveMitarbeiterMessage = json.d.results[0].ResultMessage || "User moved to new Event!";
                                }
                            }, function (err) {
                                Log.print(Log.l.error, "PRC_MoveAppMitarbeiter call error - ignore that!");
                                if (err.status === 401) {
                                    // user is not authorized to access this service
                                    AppBar.scope.binding.generalData.notAuthorizedUser = true;
                                    AppBar.scope.binding.generalData.oDataErrorMsg = err;
                                    //var errorMessage = getResourceText("general.unauthorizedUser");
                                    //alert(errorMessage);
                                    //AppData.setErrorMsg(AppBar.scope.binding, err);
                                    // user is not authorized to access this service
                                    WinJS.Promise.timeout(1000).then(function () {
                                        Application.navigateById("account");
                                    });
                                }
                            });
                        } else {
                            Log.print(Log.l.info, "network state=" +
                                (AppRepl.replicator && AppRepl.replicator.networkState));
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (updateMessage || moveMitarbeiterMessage) {
                            return WinJS.Promise.timeout(250).then(function () {
                                AppData._persistentStates.odata.dbSiteId = null;
                                return that.saveData(complete, error);
                            });
                        } else {
                            if (!doReloadDb && !failed && typeof complete === "function") {
                                complete({});
                            }
                            return WinJS.Promise.as();
                        }
                    });
                }
                Log.ret(Log.l.info);
                return ret;
            };
            that.openDb = openDb;

            var saveData = function (complete, error) {
                var err = null;
                Log.call(Log.l.trace, "DBInit.Controller.");
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                AppBar.busy = true;
                that.binding.appSettings.odata.onlinePath = AppData._persistentStatesDefaults.odata.onlinePath;
                that.binding.appSettings.odata.registerPath = AppData._persistentStatesDefaults.odata.registerPath;
                var ret = DBInit.loginRequest.insert(function (json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.call(Log.l.trace, "loginRequest: success!");
                    // loginData returns object already parsed from json file in response
                    if (json && json.d && json.d.ODataLocation) {
                        if (json.d.InactiveFlag) {
                            AppBar.busy = false;
                            err = { status: 503, statusText: getResourceText("dbinit.inactive") };
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
                        err = { status: 404, statusText: getResourceText("dbinit.unknown") };
                        AppData.setErrorMsg(that.binding, err);
                        error(err);
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    Log.print(Log.l.error, "loginRequest error: " + AppData.getErrorMsgFromResponse(errorResponse));
                    // ignore this error here for compatibility!
                    return WinJS.Promise.as();
                }, {
                        LoginName: AppData._persistentStates.odata.login
                    }).then(function () {
                        if (!err) {
                            var deviceID = "";
                            if (window.device && window.device.uuid) {
                                deviceID = "DeviceID=" + window.device.uuid;
                            }
                            var dataLogin = {
                                Login: AppData._persistentStates.odata.login,
                                Password: AppData._persistentStates.odata.password,
                                LanguageID: AppData.getLanguageId(),
                                Aktion: deviceID
                            };
                            return DBInit.loginView.insert(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.call(Log.l.trace, "loginData: success!");
                                // loginData returns object already parsed from json file in response
                                if (json && json.d) {
                                    dataLogin = json.d;
                                    if (dataLogin.OK_Flag === "X" && dataLogin.MitarbeiterID) {
                                        NavigationBar.enablePage("settings");
                                        NavigationBar.enablePage("info");
                                        NavigationBar.enablePage("search");
                                        var prevMitarbeiterId = AppData.generalData.getRecordId("Mitarbeiter");
                                        var doReloadDb = false;
                                        if (!AppData._persistentStates.odata.dbSiteId ||
                                            prevMitarbeiterId !== dataLogin.MitarbeiterID ||
                                            AppData._persistentStates.odata.dbinitIncomplete) {
                                            doReloadDb = true;
                                        }
                                        Log.print(Log.l.info, "loginData: doReloadDb=" + doReloadDb + " useOffline=" + that.binding.appSettings.odata.useOffline);
                                        if (doReloadDb) {
                                            AppData._persistentStates.allRestrictions = {};
                                            AppData._persistentStates.allRecIds = {};
                                            AppData._userData = {};
                                            AppData._persistentStates.veranstoption = {};
                                            AppData._userRemoteData = {};
                                            AppData._contactData = {};
                                            AppData._photoData = null;
                                            AppData._barcodeType = null;
                                            AppData._barcodeRequest = null;
                                            AppData.generalData.setRecordId("Mitarbeiter", dataLogin.MitarbeiterID);
                                        }
                                        if (that.binding.appSettings.odata.useOffline) {
                                            if (doReloadDb) {
                                                AppData._persistentStates.odata.dbSiteId = dataLogin.Mitarbeiter_AnmeldungVIEWID;
                                                Application.pageframe.savePersistentStates();
                                            }
                                            return that.openDb(complete, error, doReloadDb);
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
                    });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                // now open the DB
                return WinJS.Promise.timeout(0);
            }).then(function () {
                if (AppData._persistentStates.odata.dbinitIncomplete) {
                    Log.print(Log.l.trace, "Appheader refresh complete");
                    Application.pageframe.hideSplashScreen();
                }
                Application.navigateById(getStartPage(), null, true);
            });
            Log.ret(Log.l.trace);
        })
    });
})();


