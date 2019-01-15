// general data services 
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/sqlite.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dbinit.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/www/pages/appHeader/appHeaderController.js" />
/// <reference path="~/plugins/phonegap-datawedge-intent/www/broadcast_intent_plugin.js" />
/// <reference path="~/plugins/cordova-plugin-x-socialsharing/www/SocialSharing.js" />
/// <reference path="~/www/lib/vcard/scripts/vcardformatter.js" />
/// <reference path="~/www/lib/vcard/scripts/vcard.js" />

(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var b64 = window.base64js;

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
        _userDataPromise: null,
        _userRemoteDataPromise: null,
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
            if (AppData._userDataPromise) {
                Log.print(Log.l.info, "Cancelling previous userDataPromise");
                AppData._userDataPromise.cancel();
            }
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
                            var timeout = AppData._persistentStates.odata.replInterval || 30;
                            Log.print(Log.l.info, "getUserData: Now, wait for timeout=" + timeout + "s");
                            if (AppData._userDataPromise) {
                                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                AppData._userDataPromise.cancel();
                            }
                            AppData._userDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                Log.print(Log.l.info, "getUserData: Now, timeout=" + timeout + "s is over!");
                                AppData.getUserData();
                            });
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "error in select generalUserView statusText=" + errorResponse.statusText);
                            AppData._curGetUserDataId = 0;
                            var timeout = AppData._persistentStates.odata.replInterval || 30;
                            Log.print(Log.l.info, "getUserData: Now, wait for timeout=" + timeout + "s");
                            if (AppData._userDataPromise) {
                                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                AppData._userDataPromise.cancel();
                            }
                            AppData._userDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                Log.print(Log.l.info, "getUserData: Now, timeout=" + timeout + "s is over!");
                                AppData.getUserData();
                            });
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
            if (AppData._userRemoteDataPromise) {
                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                AppData._userRemoteDataPromise.cancel();
            }
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
                                    AppData.appSettings.odata.timeZoneRemoteAdjustment = AppData._userRemoteData.TimeZoneAdjustment || 0;
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
                                    if (AppBar.scope && AppData._userRemoteData.Message) {
                                        Log.print(Log.l.error, "Message=" + AppData._userRemoteData.Message);
                                        AppData.setErrorMsg(AppBar.scope.binding, AppData._userRemoteData.Message);
                                    } else if (AppBar.scope && typeof AppBar.scope.updateActions === "function" &&
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
                                if (AppData._userRemoteDataPromise) {
                                    Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                    AppData._userRemoteDataPromise.cancel();
                                }
                                AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    AppData._curGetUserRemoteDataId = 0;
                                    AppData.getUserRemoteData();
                                });
                            }, function (errorResponse) {
                                if (!AppData.appSettings.odata.serverFailure) {
                                    AppData.appSettings.odata.serverFailure = true;
                                    NavigationBar.disablePage("listRemote");
                                    NavigationBar.disablePage("search");
                                    if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                        AppBar.scope.checkListButtonStates();
                                    }
                                }
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "error in select generalUserRemoteView statusText=" + errorResponse.statusText);
                                var timeout = AppData._persistentStates.odata.replInterval || 30;
                                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s");
                                if (AppData._userRemoteDataPromise) {
                                    Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                    AppData._userRemoteDataPromise.cancel();
                                }
                                AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    AppData._curGetUserRemoteDataId = 0;
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
        getPropertyFromInitoptionTypeID: function (item) {
            Log.call(Log.l.u1, "AppData.");
            var plusRemote = false;
            var property = "";
            var color;
            switch (item.INITOptionTypeID) {
                case 10:
                    property = "individualColors";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.individualColors = true;
                        AppData._persistentStates.serverColors = true;
                    } else {
                        AppData._persistentStates.serverColors = false;
                    }
                    break;
                case 11:
                    if (AppData._persistentStates.serverColors) {
                        property = "accentColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 12:
                    if (AppData._persistentStates.serverColors) {
                        property = "backgroundColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 13:
                    if (AppData._persistentStates.serverColors) {
                        property = "navigationColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 14:
                    if (AppData._persistentStates.serverColors) {
                        property = "textColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 15:
                    if (AppData._persistentStates.serverColors) {
                        property = "labelColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 16:
                    if (AppData._persistentStates.serverColors) {
                        property = "tileTextColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 17:
                    if (AppData._persistentStates.serverColors) {
                        property = "tileBackgroundColor";
                        if (!item.LocalValue && AppData.persistentStatesDefaults.colorSettings) {
                            color = AppData.persistentStatesDefaults.colorSettings[property];
                            item.LocalValue = color && color.replace("#", "");
                        }
                    }
                    break;
                case 18:
                    if (AppData._persistentStates.serverColors) {
                        if (item.LocalValue === "1") {
                            AppData._persistentStates.isDarkTheme = true;
                        } else {
                            AppData._persistentStates.isDarkTheme = false;
                        }
                        Colors.isDarkTheme = AppData._persistentStates.isDarkTheme;
                    }
                    break;
                case 19:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideCameraQuestionnaire = true;
                    } else {
                        AppData._persistentStates.hideCameraQuestionnaire = false;
                    }
                    break;
                case 20:
                    item.pageProperty = "questionnaire";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideQuestionnaire = true;
                    } else {
                        AppData._persistentStates.hideQuestionnaire = false;
                    }
                    plusRemote = true;
                    break;
                case 21:
                    item.pageProperty = "sketch";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideSketch = true;
                    } else {
                        AppData._persistentStates.hideSketch = false;
                    }
                    plusRemote = true;
                    break;
                case 23:
                    item.pageProperty = "barcode";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideBarcodeScan = true;
                    } else {
                        AppData._persistentStates.hideBarcodeScan = false;
                    }
                    break;
                case 24:
                    item.pageProperty = "camera";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideCameraScan = true;
                    } else {
                        AppData._persistentStates.hideCameraScan = false;
                    }
                    break;
                default:
                    // defaultvalues
            }
            if (item.pageProperty) {
                if (item.LocalValue === "1") {
                    NavigationBar.disablePage(item.pageProperty);
                    if (plusRemote) {
                        NavigationBar.disablePage(item.pageProperty + "Remote");
                    }
                } else {
                    NavigationBar.enablePage(item.pageProperty);
                    if (plusRemote) {
                        NavigationBar.enablePage(item.pageProperty + "Remote");
                    }
                }
            }
            Log.ret(Log.l.u1, property);
            return property;
        },
        applyColorSetting: function (colorProperty, color) {
            Log.call(Log.l.u1, "AppData.", "colorProperty=" + colorProperty + " color=" + color);
            Colors[colorProperty] = color;
            switch (colorProperty) {
                case "accentColor":
                    // fall through...
                case "navigationColor":
                    AppBar.loadIcons();
                    NavigationBar.groups = Application.navigationBarGroups;
                    break;
            }
            Log.ret(Log.l.u1);
        },
        generalData: {
            get: function () {
                var data = AppData._persistentStates;
                data.logTarget = Log.targets.console;
                data.setRecordId = AppData.setRecordId;
                data.getRecordId = AppData.getRecordId;
                data.setRestriction = AppData.setRestriction;
                data.getRestriction = AppData.getRestriction;
                data.contactDateTime = (function () {
                    return (AppData.getContactDateString() + " " + AppData.getContactTimeString());
                })();
                data.eventName = AppData._userData.VeranstaltungName;
                data.userName = AppData._userData.Login;
                data.userPresent = AppData._userData.Present;
                data.publishFlag = AppData._userData.PublishFlag;
                data.contactDate = (AppData._contactData && AppData._contactData.Erfassungsdatum);
                data.contactId = (AppData._contactData && AppData._contactData.KontaktVIEWID);
                data.globalContactID = ((AppData._contactData && AppData._contactData.CreatorRecID)
                    ? (AppData._contactData.CreatorSiteID + "/" + AppData._contactData.CreatorRecID)
                    : "");
                data.contactCountLocal = AppData.getCountLocal();
                data.contactCountRemote = AppData.getCountRemote();
                data.remoteContactID = ((AppData._remoteContactData && AppData._remoteContactData.CreatorRecID)
                    ? (AppData._remoteContactData.CreatorSiteID + "/" + AppData._remoteContactData.CreatorRecID)
                    : "");
                data.remoteContactDate = (AppData._remoteContactData && AppData._remoteContactData.Erfassungsdatum);
                data.on = getResourceText("settings.on");
                data.off = getResourceText("settings.off");
                data.dark = getResourceText("settings.dark");
                data.light = getResourceText("settings.light");
                data.present = getResourceText("userinfo.present");
                data.absend = getResourceText("userinfo.absend");
                return data;
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
        },
        createVCardFromContact: function(dataContact, country) {
            if (dataContact) {
                var vCard = new VCard.VCard();
                vCard.organization = dataContact.Firmenname;
                vCard.namePrefix = dataContact.Titel;
                vCard.firstName = dataContact.Vorname;
                vCard.middleName = dataContact.Vorname2;
                vCard.lastName = dataContact.Name;
                vCard.title = dataContact.Position;
                vCard.workAddress = {
                    street: dataContact.Strasse,
                    postalCode: dataContact.PLZ,
                    city: dataContact.Stadt,
                    countryRegion: country
                };
                vCard.email = dataContact.EMail;
                vCard.workPhone = dataContact.TelefonFestnetz;
                vCard.cellPhone = dataContact.TelefonMobil;
                vCard.workFax = dataContact.Fax;
                vCard.url = dataContact.WebAdresse;
                vCard.note = dataContact.Bemerkungen;
                return vCard;
            }
            return null;
        },
        shareContact: function (dataContact, country) {
            if (dataContact) {
                var vCard = AppData.createVCardFromContact(dataContact, country);
                var formattedName = "";
                [vCard.firstName, vCard.middleName, vCard.lastName]
                    .forEach(function (name) {
                        if (name) {
                            if (formattedName) {
                                formattedName += ' ';
                            }
                            formattedName += name;
                        }
                    });
                var content = vCard.getFormattedString();
                var blob = utf8_decode(content);
                var encoded = b64.fromByteArray(blob);
                var data = "data:text/vcf;base64," + encoded;
                var subject = formattedName;
                var message = getResourceText("contact.title");
                if (dataContact.CreatorSiteID && dataContact.CreatorRecID) {
                    message += " ID: " + dataContact.CreatorSiteID + "/" + dataContact.CreatorRecID;
                }
                message +=  " \r\n" + formattedName;
                window.plugins.socialsharing.share(message, subject, data, null);
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
    WinJS.Namespace.define("Barcode", {
        listening: false,
        dontScan: false,
        waitingScans: 0,
        onBarcodeSuccess: function (result, repeatCount) {
            repeatCount = repeatCount || 0;
            Log.call(Log.l.trace, "Barcode.", "repeatCount=" + repeatCount + " result=" + result);
            if (Application.getPageId(nav.location) === "barcode") {
                if (Barcode.dontScan &&
                    AppBar.scope &&
                    typeof AppBar.scope.onBarcodeSuccess === "function") {
                    Barcode.dontScan = false;
                    AppBar.scope.onBarcodeSuccess(result);
                } else {
                    Barcode.waitingScans++;
                    WinJS.Promise.timeout(250).then(function () {
                        Barcode.waitingScans--;
                        Barcode.onBarcodeSuccess(result, repeatCount + 1);
                    });
                }
            } else {
                Barcode.dontScan = true;
                Application.navigateById("barcode");
                WinJS.Promise.timeout(250).then(function () {
                    Barcode.onBarcodeSuccess(result, repeatCount + 1);
                });
            }
            if (!repeatCount) {
                Barcode.startListenDelayed(0);
            }
            Log.ret(Log.l.trace);
        },
        onBarcodeError: function (error, repeatCount) {
            repeatCount = repeatCount || 0;
            Log.call(Log.l.error, "Barcode.", "repeatCount=" + repeatCount + " error=" + error);
            if (Application.getPageId(nav.location) === "barcode") {
                if (Barcode.dontScan &&
                    AppBar.scope &&
                    typeof AppBar.scope.onBarcodeError === "function") {
                    Barcode.dontScan = false;
                    AppBar.scope.onBarcodeError(error);
                } else {
                    Barcode.waitingScans++;
                    WinJS.Promise.timeout(250).then(function () {
                        Barcode.waitingScans--;
                        Barcode.onBarcodeError(error, repeatCount + 1);
                    });
                }
            } else {
                Barcode.dontScan = true;
                Application.navigateById("barcode");
                WinJS.Promise.timeout(250).then(function () {
                    Barcode.onBarcodeError(error, repeatCount + 1);
                });
            }
            if (!repeatCount) {
                Barcode.startListenDelayed(0);
            }
            Log.ret(Log.l.trace);
        },
        onDeviceConnected: function (result) {
            var id = result && result.id;
            var connectionStatus = result && result.connectionStatus;
            var ioStatus = result && result.ioStatus;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " connectionStatus=" + connectionStatus + " ioStatus=" + ioStatus);
            Barcode.startListenDelayed(250);
            Log.ret(Log.l.trace);
        },
        onDeviceConnectFailed: function (error) {
            var id = error && error.id;
            var connectionStatus = error && error.connectionStatus;
            var ioStatus = error && error.ioStatus;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " connectionStatus=" + connectionStatus + " ioStatus=" + ioStatus);
            Barcode.startListenDelayed(2000);
            Log.ret(Log.l.trace);
        },
        DeviceConstants: {
            connectionStatus: {}
        },
        connectionStatus: "",
        ioStatus: "",
        deviceStatus: {
            get: function() {
                if (typeof Barcode === "object") {
                    return Barcode.connectionStatus + (Barcode.ioStatus ? (" / " + Barcode.ioStatus) : "");
                } else {
                    return "";
                }
            }
        },
        startListenDelayed: function(delay) {
            Log.call(Log.l.trace, "Barcode.", "delay=" + delay);
            if (Barcode.listenPromise) {
                Barcode.listenPromise.cancel();
            }
            if (!delay) {
                Barcode.listenPromise = null;
                Barcode.startListen();
            } else {
                Barcode.listenPromise = WinJS.Promise.timeout(delay).then(function () {
                    Barcode.listenPromise = null;
                    Barcode.startListen();
                });
            }
            Log.ret(Log.l.trace);
        },
        startListen: function () {
            Log.call(Log.l.trace, "Barcode.");
            var generalData = AppData.generalData;
            if (typeof device === "object" && device.platform === "Android" &&
                generalData.useBarcodeActivity &&
                navigator &&
                navigator.broadcast_intent_plugin &&
                typeof navigator.broadcast_intent_plugin.listen === "function") {
                Log.print(Log.l.trace, "Android: calling  navigator.broadcast_intent_plugin.start...");
                navigator.broadcast_intent_plugin.listen(Barcode.onBarcodeSuccess, Barcode.onBarcodeError);
                Barcode.listening = true;
            } else if (typeof device === "object" && device.platform === "windows" &&
                generalData.useBarcodeActivity &&
                generalData.barcodeDevice &&
                navigator &&
                navigator.serialDevice) {
                if (Barcode.connectionStatus === Barcode.DeviceConstants.connectionStatus.connected &&
                    Barcode.ioStatus === Barcode.DeviceConstants.ioStatus.read) {
                    Log.print(Log.l.trace, "Windows: already reading...");
                } else if (Barcode.connectionStatus === Barcode.DeviceConstants.connectionStatus.connected) {
                    Barcode.startRead();
                } else if (!Barcode.listening) {
                    navigator.serialDevice.enumConnectionStatus(function (result) {
                        Barcode.DeviceConstants.connectionStatus = result;
                    });
                    navigator.serialDevice.enumIoStatus(function (result) {
                        Barcode.DeviceConstants.ioStatus = result;
                    });
                    navigator.serialDevice.connectDevice(
                        Barcode.connectionStatusChange,
                        Barcode.onDeviceConnectFailed, {
                            id: generalData.barcodeDevice,
                            onDeviceConnectionStatusChange: Barcode.connectionStatusChange
                        });
                    Barcode.listening = true;
                } else {
                    Barcode.startListenDelayed(2000);
                }
            }
            Log.ret(Log.l.trace);
        },
        stopListen: function (id) {
            Log.call(Log.l.trace, "Barcode.");
            if (id &&
                typeof device === "object" && device.platform === "windows" &&
                navigator &&
                navigator.serialDevice) {
                navigator.serialDevice.disconnectDevice(function (result) {
                    if (!AppData.generalData.barcodeDevice) {
                        Barcode.connectionStatusChange(result);
                    }
                }, function (error) {
                    if (!AppData.generalData.barcodeDevice) {
                        Barcode.connectionStatusChange(error);
                    }
                }, {
                    id: id,
                    onDeviceConnectionStatusChange: Barcode.connectionStatusChange
                });
            }
            Log.ret(Log.l.trace);
        },
        startRead: function() {
            var generalData = AppData.generalData;
            Log.call(Log.l.trace, "Barcode.");
            if (navigator &&
                navigator.serialDevice) {
                navigator.serialDevice.readFromDevice(function(readResult) {
                    var data = readResult && readResult.data;
                    Log.print(Log.l.trace, "readFromDevice: success! data=" + data);
                    if (data) {
                        Barcode.onBarcodeSuccess({
                            text: data
                        });
                    } else {
                        WinJS.Promise.timeout(0).then(function() {
                            Barcode.startRead();
                        });
                    }
                }, function(readError) {
                    Log.print(Log.l.error, "readFromDevice: failed!");
                    if (readError && readError.id && readError.id === generalData.barcodeDevice && readError.stack) {
                        Barcode.onBarcodeError(readError.stack);
                    }
                }, {
                    id: generalData.barcodeDevice,
                    onDeviceConnectionStatusChange: Barcode.connectionStatusChange,
                    prefixBinary: "#LSAD",
                    prefixLengthAdd: 2
                });
            }
            Log.ret(Log.l.trace);
        },
        connectionStatusChange: function (result) {
            var id = result && result.id;
            var connectionStatus = result && result.connectionStatus;
            var ioStatus = result && result.ioStatus;
            Log.call(Log.l.trace, "Barcode.", "id=" + id + " connectionStatus=" + connectionStatus + " ioStatus=" + ioStatus);
            var prevConnectionStatus = Barcode.connectionStatus;

            Barcode.connectionStatus = connectionStatus;
            Barcode.ioStatus = ioStatus;
            if (Application.getPageId(nav.location) === "info" &&
                AppBar.scope && AppBar.scope.binding) {
                AppBar.scope.binding.barcodeDeviceStatus = Barcode.deviceStatus;
            }
            switch (connectionStatus) {
                case Barcode.DeviceConstants.connectionStatus.connected:
                    if (prevConnectionStatus !== Barcode.DeviceConstants.connectionStatus.connected) {
                        Barcode.onDeviceConnected();
                    }
                    break;
                case Barcode.DeviceConstants.connectionStatus.connecting:
                case Barcode.DeviceConstants.connectionStatus.disconnecting:
                    break;
                default:
                    Barcode.listening = false;
            }
            Log.ret(Log.l.trace);
        }
    });
    WinJS.Namespace.define("CameraGlobals", {
        listening: false,
        dontCapture: false,
        onPhotoDataSuccess: function (result, retryCount) {
            retryCount = retryCount || 0;
            Log.call(Log.l.trace, "CameraGlobals.", "retryCount=" + retryCount);
            if (Application.getPageId(nav.location) === "camera" &&
                AppBar.scope &&
                typeof AppBar.scope.onPhotoDataSuccess === "function") {
                CameraGlobals.dontCapture = false;
                var ret = AppBar.scope.onPhotoDataSuccess(result, -1);
                if (!ret && retryCount < 5) {
                    Log.print(Log.l.info, "Invalid data retry");
                    WinJS.Promise.timeout(100).then(function () {
                        CameraGlobals.onPhotoDataSuccess(result, retryCount + 1);
                    });
                } else {
                    CameraGlobals.startListenDelayed(1000);
                }
            } else {
                CameraGlobals.dontCapture = true;
                Application.navigateById("camera");
                WinJS.Promise.timeout(250).then(function () {
                    CameraGlobals.onPhotoDataSuccess(result);
                });
            }
            Log.ret(Log.l.trace);
        },
        onPhotoDataFail: function (error) {
            Log.call(Log.l.trace, "CameraGlobals.");
            if (Application.getPageId(nav.location) === "camera" &&
                AppBar.scope && typeof AppBar.scope.onPhotoDataFail === "function") {
                CameraGlobals.dontCapture = false;
                AppBar.scope.onPhotoDataFail(error);
                CameraGlobals.startListenDelayed(1000);
            } else {
                CameraGlobals.dontCapture = true;
                Application.navigateById("camera");
                WinJS.Promise.timeout(250).then(function () {
                    CameraGlobals.onPhotoDataFail(error);
                });
            }
            Log.ret(Log.l.trace);
        },
        startListenDelayed: function(delay) {
            Log.call(Log.l.trace, "Barcode.", "delay=" + delay);
            if (CameraGlobals.listenPromise) {
                CameraGlobals.listenPromise.cancel();
            }
            CameraGlobals.listenPromise = WinJS.Promise.timeout(delay).then(function () {
                CameraGlobals.listenPromise = null;
                CameraGlobals.startListen();
            });
            Log.ret(Log.l.trace);
        },
        startListen: function () {
            Log.call(Log.l.trace, "CameraGlobals.");
            var generalData = AppData.generalData;
            if (generalData.useExternalCamera &&
                generalData.picturesDirectorySubFolder &&
                cordova.file.picturesDirectory &&
                typeof window.resolveLocalFileSystemURL === "function") {
                var picturesDirectory = cordova.file.picturesDirectory + "/" + generalData.picturesDirectorySubFolder;
                Log.print(Log.l.trace, "Windows: calling window.resolveLocalFileSystemURL=" + picturesDirectory);
                if (typeof window.resolveLocalFileSystemURL === "function") {
                    window.resolveLocalFileSystemURL(picturesDirectory, function (dirEntry) {
                        Log.print(Log.l.info, "resolveLocalFileSystemURL: file system open name=" + dirEntry.name);
                        var dirReader = dirEntry.createReader("*.jpg");
                        dirReader.readEntries(function (entries) {
                            var fileEntry = null;
                            for (var i = 0; i < entries.length; i++) {
                                if (entries[i].isFile) {
                                    fileEntry = entries[i];
                                    Log.print(Log.l.info, "found name=" + fileEntry.name);
                                    break;
                                }
                            }
                            if (fileEntry) {
                                var deleteFile = function (fe) {
                                    fe.remove(function () {
                                        Log.print(Log.l.info, "file deleted!");
                                    },
                                    function (errorResponse) {
                                        Log.print(Log.l.error, "file delete: Failed remove file " + fe.name + " error: " + JSON.stringify(errorResponse));
                                    },
                                    function () {
                                        Log.print(Log.l.trace, "file delete: extra ignored!");
                                    });
                                }
                                fileEntry.file(function (file) {
                                    var fileReader = new FileReader("*.jpg");
                                    fileReader.onerror = function(e) {
                                        Log.print(Log.l.error, "Failed file read: " + e.toString());
                                        CameraGlobals.onPhotoDataFail(e);
                                    };
                                    fileReader.onloadend = function () {
                                        var data = new Uint8Array(this.result);
                                        Log.print(Log.l.info,
                                            "Successful file read! data-length=" + data.length);
                                        var encoded = b64.fromByteArray(data);
                                        CameraGlobals.onPhotoDataSuccess(encoded);
                                        deleteFile(fileEntry);
                                    };
                                    fileReader.readAsArrayBuffer(file);
                                }, function(errorResponse) {
                                    Log.print(Log.l.error, "file read error " + errorResponse.toString());
                                    CameraGlobals.onPhotoDataFail(errorResponse);
                                });
                            } else {
                                Log.print(Log.l.trace, "No file found - try again!");
                                CameraGlobals.startListenDelayed(1000);
                            }
                        }, function (errorResponse) {
                            Log.print(Log.l.error, "readEntries: error " + errorResponse.toString());
                            CameraGlobals.startListenDelayed(1000);
                        });
                        CameraGlobals.listening = true;
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "resolveLocalFileSystemURL error " + errorResponse.toString());
                    });
                }
            }
            Log.ret(Log.l.trace);
        }
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