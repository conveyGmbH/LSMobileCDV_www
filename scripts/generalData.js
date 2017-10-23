// general data services 
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/sqlite.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/www/pages/appHeader/appHeaderController.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("AppData", {
        __generalUserRemoteView: null,
        _generalUserRemoteView: {
            get: function() {
                if (!AppData.__generalUserRemoteView) {
                    // create remote view here always!
                    AppData.__generalUserRemoteView = new AppData.formatViewData("Mitarbeiter", 20431, false);
                }
                return AppData.__generalUserRemoteView;
            }
        },
        generalUserRemoteView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserRemoteView.", "recordId=" + recordId);
                var ret = AppData._generalUserRemoteView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function() {
                    return AppData._generalUserRemoteView.isLocal;
                }
            }
        },
        _generalUserView: {
            get: function() {
                return AppData.getFormatView("Mitarbeiter", 20431);
            }
        },
        generalUserView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserView.", "recordId=" + recordId);
                var ret = AppData._generalUserView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function() {
                    return AppData._generalUserView.isLocal;
                }
            }
        },
        _generalContactView: {
            get: function() {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        generalContactView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalContactView.", "recordId=" + recordId);
                var ret = AppData._generalContactView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _curGetUserDataId: 0,
        _curGetRemoteUserDataId: 0,
        _curGetContactDataId: 0,
        _contactData: {},
        _remoteContactData: {},
        _userData: {
            VeranstaltungName: "",
            Login: "",
            Present: 0
        },
        _userRemoteData: {},
        _photoData: null,
        _barcodeType: null,
        _barcodeRequest: null,
        getRecordId: function (relationName) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName);
            // check for initial values
            if (typeof AppData._persistentStates.allRecIds === "undefined") {
                AppData._persistentStates.allRecIds = {};
            }
            if (typeof AppData._persistentStates.allRecIds[relationName] === "undefined") {
                if (relationName === "Mitarbeiter") {
                    if (AppData._userData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._userData.MitarbeiterVIEWID;
                    }
                } else if (relationName === "IMPORT_CARDSCAN") {
                    if (AppData._contactData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._contactData.IMPORT_CARDSCANID;
                    }
                } else if (relationName === "Veranstaltung") {
                    if (AppData._userData) {
                        AppData._persistentStates.allRecIds[relationName] = AppData._userData.VeranstaltungID;
                    } else {
                        if (typeof AppData.getUserData === "function") {
                            AppData.getUserData();
                        }
                        Log.ret(Log.l.trace, "undefined");
                        return null;
                    }
                } else {
                    Log.ret(Log.l.trace, "undefined");
                    return null;
                }
            }
            var ret = AppData._persistentStates.allRecIds[relationName];
            if (ret) {
                if (relationName === "Kontakt") {
                    if (!AppData._contactData ||
                        !AppData._contactData.KontaktVIEWID ||
                        AppData._contactData.KontaktVIEWID !== ret) {
                        if (typeof AppData.getContactData === "function") {
                            AppData.getContactData(ret);
                        }
                    }
                }
            }
            Log.ret(Log.l.trace, ret);
            return ret;
        },
        setRecordId: function (relationName, newRecordId) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName + " newRecordId=" + newRecordId);
            // check for initial values
            if (typeof AppData._persistentStates.allRecIds === "undefined") {
                AppData._persistentStates.allRecIds = {};
            }
            if (typeof AppData._persistentStates.allRecIds[relationName] === "undefined" ||
                !newRecordId || AppData._persistentStates.allRecIds[relationName] !== newRecordId) {
                AppData._persistentStates.allRecIds[relationName] = newRecordId;
                if (relationName === "Mitarbeiter") {
                    delete AppData._persistentStates.allRecIds["Veranstaltung"];
                    if (typeof AppData.getUserData === "function") {
                        AppData.getUserData();
                    }
                } else if (relationName === "Kontakt") {
                    // delete relationships
                    delete AppData._persistentStates.allRecIds["Zeilenantwort"];
                    delete AppData._persistentStates.allRecIds["KontaktNotiz"];
                    delete AppData._persistentStates.allRecIds["IMPORT_CARDSCAN"];
                    delete AppData._persistentStates.allRecIds["DOC1IMPORT_CARDSCAN"];
                    delete AppData._persistentStates.allRecIds["ImportBarcodeScan"];
                    AppData._photoData = null;
                    AppData._barcodeType = null;
                    AppData._barcodeRequest = null;
                    if (typeof AppData.getContactData === "function") {
                        AppData.getContactData();
                    }
                } else if (relationName === "Kontakt_Remote") {
                    delete AppData._persistentStates.allRecIds["Zeilenantwort_Remote"];
                    delete AppData._persistentStates.allRecIds["KontaktNotiz_Remote"];
                    delete AppData._persistentStates.allRecIds["DOC1IMPORT_CARDSCAN_Remote"];
                    AppData._remotePhotoData = null;
                }
                Application.pageframe.savePersistentStates();
            }
            Log.ret(Log.l.trace);
        },
        getRestriction: function (relationName) {
            Log.call(Log.l.trace, "AppData.", "relationName=" + relationName);
            if (typeof AppData._persistentStates.allRestrictions === "undefined") {
                AppData._persistentStates.allRestrictions = {};
            }
            Log.ret(Log.l.trace);
            return AppData._persistentStates.allRestrictions[relationName];
        },
        setRestriction: function (relationName, newRestriction) {
            Log.call(Log.l.trace, ".", "relationName=" + relationName);
            if (typeof AppData._persistentStates.allRestrictions === "undefined") {
                AppData._persistentStates.allRestrictions = {};
            }
            AppData._persistentStates.allRestrictions[relationName] = newRestriction;
            Application.pageframe.savePersistentStates();
            Log.ret(Log.l.trace);
        },
        getUserData: function () {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            var userId = AppData.getRecordId("Mitarbeiter");
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getUserData: no logon information provided!");
                ret = WinJS.Promise.as();
            } else if (userId && userId !== AppData._curGetUserDataId) {
                if (AppData._persistentStates.odata.useOffline && (!AppData._db || !AppData._dbInit)) {
                    Log.print(Log.l.trace, "getUserData: local db not yet initialized!");
                    ret = WinJS.Promise.as();
                } else {
                    AppData._curGetUserDataId = userId;
                    ret = new WinJS.Promise.as().then(function () {
                        Log.print(Log.l.trace, "calling select generalUserView...");
                        return AppData.generalUserView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "generalUserView: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                AppData._userData = json.d;
                                if (!AppData.generalUserView.isLocal) {
                                    AppData._userRemoteData = json.d;
                                    AppData._userData.AnzLokaleKontakte = AppData._userData.AnzVersendeteKontakte;
                                }
                                if (AppData._userData.Present === null) {
                                    // preset with not-on-site!
                                    AppData._userData.Present = 0;
                                }
                                if (typeof AppHeader === "object" &&
                                    AppHeader.controller && AppHeader.controller.binding) {
                                    AppHeader.controller.binding.userData = AppData._userData;
                                    AppHeader.controller.loadData();
                                }
                                AppData.appSettings.odata.timeZoneAdjustment = AppData._userData.TimeZoneAdjustment;
                                Log.print(Log.l.info, "timeZoneAdjustment=" + AppData.appSettings.odata.timeZoneAdjustment);
                            }
                            AppData._curGetUserDataId = 0;
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "error in select generalUserView statusText=" + errorResponse.statusText);
                            AppData._curGetUserDataId = 0;
                        }, userId);
                    });
                }
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getUserRemoteData: function () {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getUserRemoteData: no logon information provided!");
                ret = WinJS.Promise.as();
            } else if (AppData.generalUserView.isLocal) {
                var userId = AppData.getRecordId("Mitarbeiter");
                if (userId && userId !== AppData._curGetUserRemoteDataId) {
                    if (AppData._persistentStates.odata.useOffline && (!AppData._db || !AppData._dbInit)) {
                        Log.print(Log.l.trace, "getUserRemoteData: local db not yet initialized!");
                        ret = WinJS.Promise.as();
                    } else {
                        var dateLocal = new Date();
                        var millisecondsLocal = dateLocal.getTime();
                        AppData._curGetUserRemoteDataId = userId;
                        ret = new WinJS.Promise.as().then(function () {
                            Log.print(Log.l.trace, "calling select generalUserRemoteView...");
                            return AppData.generalUserRemoteView.select(function (json) {
                                var doUpdate = false;
                                if (AppData.appSettings.odata.serverFailure) {
                                    AppData.appSettings.odata.serverFailure = false;
                                    NavigationBar.enablePage("listRemote");
                                    NavigationBar.enablePage("search");
                                    doUpdate = true;
                                }
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "generalUserRemoteView: success!");
                                // startContact returns object already parsed from json file in response
                                if (json && json.d) {
                                    var prevUserRemoteData = AppData._userRemoteData;
                                    AppData._userRemoteData = json.d;
                                    AppData.appSettings.odata.timeZoneRemoteAdjustment = AppData._userRemoteData.TimeZoneAdjustment;
                                    if (AppData._userRemoteData.CurrentTS) {
                                        var msString = AppData._userRemoteData.CurrentTS.replace("\/Date(", "").replace(")\/", "");
                                        var millisecondsRemote = parseInt(msString) - AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                                        AppData.appSettings.odata.timeZoneRemoteDiffMs = millisecondsLocal - millisecondsRemote;
                                        if (!AppData.appSettings.odata.replPrevSelectMs) {
                                            var now = new Date();
                                            AppData.appSettings.odata.replPrevSelectMs = now.getTime() - AppData.appSettings.odata.timeZoneRemoteDiffMs;
                                        }
                                    }
                                    Log.print(Log.l.info, "timeZoneRemoteAdjustment=" + AppData.appSettings.odata.timeZoneRemoteAdjustment +
                                        " timeZoneRemoteDiffMs=" + AppData.appSettings.odata.timeZoneRemoteDiffMs);
                                    if (AppBar.scope && typeof AppBar.scope.updateActions === "function" &&
                                        (!prevUserRemoteData ||
                                         prevUserRemoteData.AnzVersendeteKontakte !== AppData._userRemoteData.AnzVersendeteKontakte)) {
                                        doUpdate = true;
                                    }
                                }
                                if (AppBar.scope && typeof AppBar.scope.updateActions === "function" && doUpdate) {
                                    AppBar.scope.updateActions();
                                }
                                var timeout = AppData._persistentStates.odata.replInterval || 30;
                                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    AppData._curGetUserRemoteDataId = 0;
                                    AppData.getUserRemoteData();
                                });
                            }, function (errorResponse) {
                                if (!AppData.appSettings.odata.serverFailure) {
                                    AppData.appSettings.odata.serverFailure = true;
                                    NavigationBar.disablePage("listRemote");
                                    NavigationBar.disablePage("search");
                                    if (AppBar.scope && typeof AppBar.scope.updateActions === "function") {
                                        AppBar.scope.updateActions();
                                    }
                                }
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "error in select generalUserRemoteView statusText=" + errorResponse.statusText);
                                AppData._curGetUserRemoteDataId = 0;
                                var timeout = AppData._persistentStates.odata.replInterval || 30;
                                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    AppData.getUserRemoteData();
                                });
                            }, userId);
                        });

                    }
                } else {
                    ret = WinJS.Promise.as();
                }
            } else {
                ret = AppData.getUserData();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getContactData: function (contactId) {
            var ret;
            Log.call(Log.l.trace, "AppData.");
            if (!contactId) {
                contactId = AppData.getRecordId("Kontakt");
            }
            if (!contactId) {
                var prevContactId = AppData._contactData && AppData._contactData.KontaktVIEWID;
                AppData._contactData = {};
                if (typeof AppBar === "object" &&
                    AppBar.scope && AppBar.scope.binding && AppBar.scope.binding.generalData) {
                    AppBar.scope.binding.generalData.contactDate = null;
                    AppBar.scope.binding.generalData.contactId = null;
                    if (typeof AppBar.scope.updateActions === "function" &&
                        prevContactId) {
                        AppBar.scope.updateActions(true);
                    }
                }
                ret = WinJS.Promise.as();
            } else if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getContactData: no logon information provided!");
                ret = WinJS.Promise.as();
            } else if (AppData._persistentStates.odata.useOffline && (!AppData._db || !AppData._dbInit)) {
                Log.print(Log.l.trace, "getContactData: local db not yet initialized!");
                ret = WinJS.Promise.as();
            } else if (contactId !== AppData._curGetContactDataId) {
                AppData._curGetContactDataId = contactId;
                ret = new WinJS.Promise.as().then(function () {
                    Log.print(Log.l.trace, "calling select generalContactView...");
                    return AppData.generalContactView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "generalContactView: success!");
                        // startContact returns object already parsed from json file in response
                        if (json && json.d) {
                            var prevContactData = AppData._contactData;
                            AppData._contactData = json.d;
                            if (AppData._contactData &&
                                typeof AppBar === "object" &&
                                AppBar.scope && AppBar.scope.binding && AppBar.scope.binding.generalData) {
                                AppBar.scope.binding.generalData.contactDate = AppData._contactData.Erfassungsdatum;
                                AppBar.scope.binding.generalData.contactId = AppData._contactData.KontaktVIEWID;
                                if (typeof AppBar.scope.updateActions === "function" &&
                                    (!prevContactData ||
                                     prevContactData !== AppData._contactData)) {
                                    AppBar.scope.updateActions(true);
                                }
                            }
                        }
                        AppData._curGetContactDataId = 0;
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        Log.print(Log.l.error, "error in select generalContactView statusText=" + errorResponse.statusText);
                        AppData._curGetContactDataId = 0;
                    }, contactId);
                });
            } else {
                ret = WinJS.Promise.as();
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        getContactDate: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                ret = AppData._contactData.Erfassungsdatum;
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getContactDateString: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                // value now in UTC ms!
                var msString = AppData._contactData.Erfassungsdatum.replace("\/Date(", "").replace(")\/", "");
                var milliseconds = parseInt(msString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                var date = new Date(milliseconds);
                ret = date.toLocaleDateString();
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getContactTimeString: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._contactData &&
                AppData._contactData.Erfassungsdatum) {
                // value now in UTC ms!
                var msString = AppData._contactData.Erfassungsdatum.replace("\/Date(", "").replace(")\/", "");
                var milliseconds = parseInt(msString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                var date = new Date(milliseconds);
                var hours = date.getHours();
                var minutes = date.getMinutes();
                ret = ((hours < 10) ? "0" : "") + hours.toString() + ":" +
                      ((minutes < 10) ? "0" : "") + minutes.toString();
            } else {
                ret = "";
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getCountLocal: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.AnzLokaleKontakte) {
                ret = AppData._userData.AnzLokaleKontakte;
            } else {
                ret = 0;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getCountRemote: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userRemoteData &&
                AppData._userRemoteData.AnzVersendeteKontakte) {
                ret = AppData._userRemoteData.AnzVersendeteKontakte;
            } else {
                ret = 0;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        generalData: {
            get: function () {
                return {
                    newContactPageId: AppData._persistentStates.prevNavigateNewId,
                    setRecordId: AppData.setRecordId,
                    getRecordId: AppData.getRecordId,
                    setRestriction: AppData.setRestriction,
                    getRestriction: AppData.getRestriction,
                    contactDateTime: (function () {
                        return (AppData.getContactDateString() + " " + AppData.getContactTimeString());
                    })(),
                    individualColors: AppData._persistentStates.individualColors,
                    isDarkTheme: AppData._persistentStates.isDarkTheme,
                    inputBorder: AppData._persistentStates.inputBorder,
                    showAppBkg: AppData._persistentStates.showAppBkg,
                    logEnabled: AppData._persistentStates.logEnabled,
                    logLevel: AppData._persistentStates.logLevel,
                    logGroup: AppData._persistentStates.logGroup,
                    logNoStack: AppData._persistentStates.logNoStack,
                    logTarget: Log.targets.console,
                    cameraQuality: AppData._persistentStates.cameraQuality,
                    cameraUseGrayscale: AppData._persistentStates.cameraUseGrayscale,
                    useClippingCamera: AppData._persistentStates.useClippingCamera,
                    eventName: AppData._userData.VeranstaltungName,
                    userName: AppData._userData.Login,
                    userPresent: AppData._userData.Present,
                    contactDate: (AppData._contactData && AppData._contactData.Erfassungsdatum),
                    contactId: (AppData._contactData && AppData._contactData.KontaktVIEWID),
                    globalContactID: ((AppData._contactData && AppData._contactData.CreatorRecID) ?
                        (AppData._contactData.CreatorSiteID + "/" + AppData._contactData.CreatorRecID) : ""),
                    contactCountLocal: AppData.getCountLocal(),
                    contactCountRemote: AppData.getCountRemote(),
                    on: getResourceText("settings.on"),
                    off: getResourceText("settings.off"),
                    dark: getResourceText("settings.dark"),
                    light: getResourceText("settings.light"),
                    present: getResourceText("userinfo.present"),
                    absend: getResourceText("userinfo.absend"),
                    remoteContactID: ((AppData._remoteContactData && AppData._remoteContactData.CreatorRecID) ?
                        (AppData._remoteContactData.CreatorSiteID + "/" + AppData._remoteContactData.CreatorRecID) : ""),
                    remoteContactDate: (AppData._remoteContactData && AppData._remoteContactData.Erfassungsdatum)
                };
            }
        },
        _initAnredeView: {
            get: function () {
                return AppData.getLgntInit("LGNTINITAnrede");
            }
        },
        _initLandView: {
            get: function () {
                return AppData.getLgntInit("LGNTINITLand");
            }
        },
        initAnredeView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.select(complete, error, recordId, { ordered: true, orderByValue: true });
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, "AppData.initAnredeView.");
                var ret = AppData._initAnredeView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        initLandView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.select(complete, error, recordId, { ordered: true });
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, "AppData.initLandView.");
                var ret = AppData._initLandView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });

    // forward declarations used in binding converters
    WinJS.Namespace.define("Settings", {
        getInputBorderName: null
    });
    WinJS.Namespace.define("Info", {
        getLogLevelName: null
    });
    // usage of binding converters
    //
    //<span 
    //
    //       // display element if value is set:
    //
    //       data-win-bind="textContent: loginModel.userName; style.display: loginModel.userName Binding.Converter.toDisplay" 
    //
    WinJS.Namespace.define("Binding.Converter", {
        toLogLevelName: WinJS.Binding.converter(function (value) {
            return (typeof Info.getLogLevelName === "function" && Info.getLogLevelName(value));
        }),
        toInputBorderName: WinJS.Binding.converter(function (value) {
            return (typeof Settings.getInputBorderName === "function" && Settings.getInputBorderName(value));
        })
    });

})();