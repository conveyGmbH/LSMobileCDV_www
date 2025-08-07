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
/// <reference path="~/www/pages/dbinit/dbinitController.js" />
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
        /**
         * Mitarbeiterview_20431 old view is deprecated
         */
        _generalUserRemoteView: {
            get: function () {
                if (!AppData.__generalUserRemoteView) {
                    // create remote view here always!
                    AppData.__generalUserRemoteView = new AppData.formatViewData("Mitarbeiter", 20603, false);
                }
                return AppData.__generalUserRemoteView;
            }
        },
        generalUserRemoteView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserRemoteView.", "recordId=" + recordId);
                var ret = AppData._generalUserRemoteView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function () {
                    return AppData._generalUserRemoteView.isLocal;
                }
            }
        },
        /**
         * Mitarbeiterview_20431 old view is deprecated
         */
        _generalUserView: {
            get: function () {
                return AppData.getFormatView("Mitarbeiter", 20603);
            }
        },
        generalUserView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "AppData.generalUserView.", "recordId=" + recordId);
                var ret = AppData._generalUserView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            isLocal: {
                get: function () {
                    return AppData._generalUserView.isLocal;
                }
            }
        },
        _CR_VERANSTOPTION_View: {
            get: function () {
                return AppData.getFormatView("CR_VERANSTOPTION", 0, false);
            }
        },
        CR_VERANSTOPTION_ODataView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "CR_VERANSTOPTION_ODataView.");
                var ret = DBInit._CR_VERANSTOPTION_View.select(complete,
                    error,
                    restriction,
                    {
                        ordered: true,
                        orderAttribute: "INITOptionTypeID"
                    });
                Log.ret(Log.l.trace);
                return ret;

            }
        },
        _generalContactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        generalContactView: {
            select: function (complete, error, recordId) {
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
            DatenschutzText: "",
            Login: "",
            Present: 0,//,
            NotUploaded: 0,
            Uploaded: 0
        },
        _userRemoteData: {},
        _prcUserRemoteCallSucceeded: false,
        _photoData: null,
        _barcodeType: null,
        _barcodeRequest: null,
        _alternativeTimeout: null,
        _ignore: false,
        _fromStartPage: false,
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
        cancelPromises: function () {
            Log.call(Log.l.trace, "AppData.");
            if (AppData._userRemoteDataPromise) {
                AppData._userRemoteDataPromise.cancel();
                AppData._userRemoteDataPromise = null;
            }
            Log.ret(Log.l.trace);
        },
        checkForNavigateToLogin: function (errorResponse) {
            Log.call(Log.l.trace, "AppData.");
            if (errorResponse && (errorResponse.status === 401 || errorResponse.status === 404)) {
                var curPageId = Application.getPageId(Application.navigator._lastPage);
                var onLoginPage = curPageId === "dbinit" || curPageId === "login" || curPageId === "account";
                if (errorResponse.status === 401 && !onLoginPage) {
                    // user is not authorized to access this service
                    AppBar.scope.binding.generalData.notAuthorizedUser = true;
                    //var errorMessage = getResourceText("general.unauthorizedUser");
                    AppBar.scope.binding.generalData.oDataErrorMsg = getResourceText("general.unauthorizedUser") + "\n\nError: " + (errorResponse && errorResponse.statusText);
                    alert(AppBar.scope.binding.generalData.oDataErrorMsg);
                }
                AppData.cancelPromises();
                if (!onLoginPage) {
                    WinJS.Promise.timeout(0).then(function () {
                        Application.navigateById("account");
                    });
                }
            }
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
                    var doUpdate = false;
                    ret = new WinJS.Promise.as().then(function () {
                        Log.print(Log.l.trace, "calling select generalUserView...");
                        return AppData.generalUserView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "generalUserView: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                var prevUsereData = AppData._userData;
                                AppData._userData = json.d;
                                if (!AppData.generalUserView.isLocal) {
                                    AppData._userRemoteData = json.d;
                                    AppData._userData.AnzLokaleKontakte = AppData._userData.AnzVersendeteKontakte;
                                    //AppData._userData.NotUploaded = ;
                                }
                                if (AppData._userData.Present === null) {
                                    // preset with not-on-site!
                                    AppData._userData.Present = 0;
                                }
                                if (AppData._userData.Enddatum) {
                                    var actualDate = new Date();
                                    //var value = AppData._userData.Enddatum;
                                    var msString = AppData._userData.Enddatum.replace("\/Date(", "").replace(")\/", "");
                                    var timeZoneAdjustment = AppData.appSettings.odata.timeZoneAdjustment || 0;
                                    var milliseconds = parseInt(msString) - timeZoneAdjustment * 60000;
                                    var endDate = new Date(milliseconds);
                                    var diffTime = actualDate.getTime() - endDate.getTime();
                                    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (diffDays > 23) {
                                        AppData.setErrorMsg(AppBar.scope.binding, getResourceText("general.eventFinishedMsg1"));
                                    }
                                    if (diffDays > 30) {
                                        if (!AppData._persistentStates.disableCaptureContactsButton) {
                                            doUpdate = true;
                                        }
                                        AppData._persistentStates.disableCaptureContactsButton = true;
                                        var message = getResourceText("general.eventFinishedMsg2");
                                        if (AppData._userData.VeranstaltungName) {
                                            message = getResourceText("general.eventFinishedMsg2")
                                                .replace("XXXX", AppData._userData.VeranstaltungName);
                                        }
                                        AppData.setErrorMsg(AppBar.scope.binding, message);
                                    }
                                    if (diffDays <= 30) {
                                        if (AppData._persistentStates.disableCaptureContactsButton) {
                                            doUpdate = true;
                                        }
                                        AppData._persistentStates.disableCaptureContactsButton = false;
                                    }
                                }
                                if ((AppData._persistentStates.showvisitorFlow === 1 ||
                                    (AppData._persistentStates.showvisitorFlow === 2 &&
                                        AppData.generalData.area &&
                                        AppData.generalData.inOut))) {
                                    Application.navigationBarGroups = [
                                        { id: "barcode", group: 1, svg: "lsvFlow", disabled: false },
                                        //{ id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                                        { id: "info", group: 3, svg: "gearwheel", disabled: false },
                                        { id: "support", group: 7, svg: "user_headset", disabled: false }
                                    ];
                                    Application.startPage = Application.getPagePath("barcode");
                                } else {
                                    Application.navigationBarGroups = [
                                        { id: "start", group: 1, svg: "home", disabled: false },
                                        { id: "search", group: 2, svg: "magnifying_glass", disabled: false },
                                        { id: "info", group: 3, svg: "gearwheel", disabled: false },
                                        { id: "support", group: 7, svg: "user_headset", disabled: false }
                                    ];
                                    Application.startPage = Application.getPagePath("start");
                                }
                                if (typeof AppHeader === "object" &&
                                    AppHeader.controller && AppHeader.controller.binding) {
                                    AppHeader.controller.binding.userData = AppData._userData;
                                    AppHeader.controller.binding.replErrorFlag = AppRepl.replicator && AppRepl.replicator.state === "error" ? true : false;; 
                                    AppHeader.controller.loadData();
                                }
                                AppData.getPropertyFromInitoptionTypeID({
                                    INITOptionTypeID: 20,
                                    LocalValue: (AppData._persistentStates.showvisitorFlow === 1 || (AppData._persistentStates.showvisitorFlow === 2 && AppData.generalData.area && AppData.generalData.inOut)) ? "1" : (AppData._persistentStates.hideQuestionnaire ? "1" : "0")
                                });
                                AppData.getPropertyFromInitoptionTypeID({
                                    INITOptionTypeID: 21,
                                    LocalValue: (AppData._persistentStates.showvisitorFlow === 1 || (AppData._persistentStates.showvisitorFlow === 2 && AppData.generalData.area && AppData.generalData.inOut)) ? "1" : (AppData._persistentStates.hideSketch ? "1" : "0")
                                });
                                //NavigationBar.disablePage("privacy");
                                //NavigationBar.disablePage("search");
                                AppData.appSettings.odata.timeZoneAdjustment = AppData._userData.TimeZoneAdjustment;
                                Log.print(Log.l.info, "timeZoneAdjustment=" + AppData.appSettings.odata.timeZoneAdjustment);

                                if (prevUsereData && (prevUsereData.NotUploaded !== AppData._userRemoteData.NotUploaded)) { //
                                    doUpdate = true;
                                }
                                if (AppBar.scope && typeof AppBar.scope.updateActions === "function" && doUpdate) {
                                    AppBar.scope.updateActions();
                                }
                            }
                            if (AppData._userDataPromise) {
                                Log.print(Log.l.info, "Cancelling previous userDataPromise");
                                AppData._userDataPromise.cancel();
                            }
                            AppData._curGetUserDataId = 0;
                            var timeout = AppData._persistentStates.odata.replInterval || 30;
                            Log.print(Log.l.info, "getUserData: Now, wait for timeout=" + timeout + "s");
                            AppData._userDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                Log.print(Log.l.info, "getUserData: Now, timeout=" + timeout + "s is over!");
                                AppData.getUserData();
                            });
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "error in select generalUserView statusText=" + errorResponse.statusText);
                            if (AppData._userDataPromise) {
                                Log.print(Log.l.info, "Cancelling previous userDataPromise");
                                AppData._userDataPromise.cancel();
                            }
                            AppData._curGetUserDataId = 0;
                            var timeout = AppData._persistentStates.odata.replInterval || 30;
                            Log.print(Log.l.info, "getUserData: Now, wait for timeout=" + timeout + "s");
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
        _inGetCRVeranstOption: false,
        _inGetMobileVersion: false,
        getMobileVersion: function () {
            Log.call(Log.l.trace, "AppData.");
            if (AppData._inGetMobileVersion) {
                Log.ret(Log.l.info, "semaphore set: extra ignored");
                return WinJS.Promise.as();
            }
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getMobileVersion: no logon information provided!");
                return WinJS.Promise.as();
            }
            var ret = new WinJS.Promise.as().then(function () {
                return DBInit.versionView.select(function (json) {
                    AppData._persistentStates.dbVersion = json && json.d && json.d.results && json.d.results[0] && json.d.results[0].Version;
                    Log.print(Log.l.info, "versionView select success! dbVersion=" + AppData._persistentStates.dbVersion);
                    Application.pageframe.savePersistentStates();
                }, function (err) {
                    Log.print(Log.l.error, "versionView select error - ignore that!");
                });
            }).then(function () {
                var versionNo;
                var versionNoPos = (typeof Application.version === "string") && Application.version.lastIndexOf(" ");
                if (versionNoPos >= 0) {
                    versionNo = Application.version.substr(versionNoPos + 1);
                } else {
                    versionNo = Application.version;
                }
                var alertFlyoutOk = document.querySelector("#okButton");
                var alertFlyoutCancel = document.querySelector("#cancelButton");
                AppData._inGetMobileVersion = true;
                return AppData.call("PRC_CheckMobileVersion", {
                    pCreatorSiteID: AppData._persistentStates.odata.dbSiteId,
                    pDBVersion: AppData._persistentStates.dbVersion || null,
                    pAppVersion: versionNo,
                    pUser: AppData.appSettings.odata.login,
                    pLanguageID: AppData.getLanguageId()
                }, function (json) {
                    Log.print(Log.l.info, "PRC_CheckMobileVersion call success!");
                    if (json && json.d && json.d.results && json.d.results[0] && json.d.results[0].UpdateMessage) {
                        var messageText = null;
                        var confirmFirst = null;
                        var confirmSecond = null;
                        if (json.d.results[0].NewDBRequired === 0) {
                            messageText = getResourceText("general.newApp");
                        }
                        if (json.d.results[0].NewDBRequired === 1) {
                            messageText = getResourceText("general.newDB");
                        }
                        if (json.d.results[0].NewDBRequired === 2) {
                            confirmFirst = getResourceText("flyout.okChange");
                            confirmSecond = getResourceText("flyout.cancelToLater");
                            messageText = getResourceText("general.userChanging");
                        }
                        //return confirm(messageText, function (changeConfirmed) {
                        if (AppData._ignore) {
                            // ignore
                            AppData._ignore = false;
                        } else {
                            return confirmModal(null,
                                messageText,
                                confirmFirst,
                                confirmSecond,
                                function(changeConfirmed) {
                                    Log.print(Log.l.info, "updateMessage returned=" + changeConfirmed);
                                    if (changeConfirmed) {
                                        // neue App Version
                                        AppData._inGetMobileVersion = false;
                                        if (json.d.results[0].NewDBRequired === 0) {
                                            messageText = null;
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
                                        } else {
                                            WinJS.Promise.timeout(500).then(function() {
                                                if (json.d.results[0].NewDBRequired === 2) {
                                                    AppData._fromStartPage = true;
                                                }
                                                Application.navigateById("dbinit");
                                                return WinJS.Promise.timeout(100);
                                            });
                                        }
                                    } else {
                                        Log.print(Log.l.trace, "User changed: user choice wait - cancel");
                                        AppData._inGetMobileVersion = false;
                                        if (json.d.results[0].NewDBRequired === 2) {
                                            AppData._alternativeTimeout = 300; //150
                                            AppData.getUserRemoteData();
                                        }
                                    }
                                });
                        }
                    } else {
                        AppData._inGetMobileVersion = false;
                    }
                }, function (err) {
                    Log.print(Log.l.error, "PRC_CheckMobileVersion call error - ignore that!");
                    AppData._inGetMobileVersion = false;
                    AppData.checkForNavigateToLogin(err);
                });
            });
            Log.ret(Log.l.trace);
            return ret;
        },
        getCRVeranstOption: function () {
            Log.call(Log.l.trace, "AppData.");
            var ret = WinJS.Promise.as();
            if (AppData._inGetCRVeranstOption) {
                Log.ret(Log.l.info, "semaphore set: extra ignored");
                return ret;
            }
            if (typeof AppData._persistentStates.veranstoption === "undefined") {
                AppData._persistentStates.veranstoption = {};
            }
            ret = new WinJS.Promise.as().then(function () {
                AppData._inGetCRVeranstOption = true;
                Log.print(Log.l.trace, "calling select generalContactView...");
                return AppData.CR_VERANSTOPTION_ODataView.select(function (json) {
                    function resultConverter(item, index) {
                        var property = AppData.getPropertyFromInitoptionTypeID(item);
                        if (property && property !== "individualColors" && (!item.pageProperty) && item.LocalValue) {
                            item.colorValue = "#" + item.LocalValue;
                            AppData.applyColorSetting(property, item.colorValue);
                        }
                    }
                    function resultMandatoryConverter(item) {
                        if (item.INITOptionTypeID === 22) {
                            if (item.LocalValue === "1") {
                                AppData._persistentStates.showConfirmQuestion = true;
                            } else {
                                AppData._persistentStates.showConfirmQuestion = false;
                            }
                        }
                    }
                    var results = json.d.results;
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "CR_VERANSTOPTION: success!");
                    // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                    if (json && json.d && json.d.results) {
                        if (equals(json.d.results, AppData._persistentStates.veranstoption)) {
                            Log.print(Log.l.trace, "CR_VERANSTOPTION: extra ignored!");
                        } else {
                            Log.print(Log.l.trace, "CR_VERANSTOPTION: values changed!");
                            AppData._persistentStates.veranstoption = copyByValue(results);
                            AppData._persistentStates.serverColors = false;
                            if (json.d.results.length > 0) {
                                results.forEach(function (item, index) {
                                    resultConverter(item, index);
                                });
                                AppData._persistentStates.showConfirmQuestion = false;
                                results.forEach(function (item) {
                                    resultMandatoryConverter(item);
                                });
                            }
                            Application.pageframe.savePersistentStates();
                            Colors.updateColors();
                        }
                    }
                    AppData._inGetCRVeranstOption = false;
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    // ignore error in app!
                    // AppData.setErrorMsg(that.binding, errorResponse);
                    AppData._inGetCRVeranstOption = false;
                });
            });
            Log.ret(Log.l.trace);
            return ret;
        },
        _inGetUserRemotedata: false,
        getUserRemoteData: function () {
            var timeout = 5;
            var ret = WinJS.Promise.as();
            Log.call(Log.l.trace, "AppData.");
            if (AppData._userRemoteDataPromise) {
                Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                AppData._userRemoteDataPromise.cancel();
                AppData._userRemoteDataPromise = null;
            }
            if (AppData._inGetUserRemotedata) {
                Log.ret(Log.l.info, "semaphore set: extra ignored");
                return ret;
            }
            if (!AppData.appSettings.odata.login ||
                !AppData.appSettings.odata.password ||
                !AppData.appSettings.odata.dbSiteId) {
                Log.print(Log.l.trace, "getUserRemoteData: no logon information provided!");
                AppData._curGetUserRemoteDataId = 0;
                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s - no login case, try again!");
                AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                    AppData.getUserRemoteData();
                });
            } else if (AppRepl.replicator &&
                AppRepl.replicator.networkstate !== "Offline" &&
                AppRepl.replicator.networkstate !== "Unknown" &&
                DBInit &&
                DBInit.loginRequest) {
                var userId = AppData.getRecordId("Mitarbeiter");
                if (userId && userId !== AppData._curGetUserRemoteDataId) {
                    if (AppData._persistentStates.odata.useOffline && (!AppData._db || !AppData._dbInit)) {
                        Log.print(Log.l.trace, "getUserRemoteData: local db not yet initialized!");
                    } else {
                        var dateLocal = new Date();
                        var millisecondsLocal = dateLocal.getTime();
                        AppData._curGetUserRemoteDataId = userId;
                        ret = new WinJS.Promise.as().then(function () {
                            AppData._inGetUserRemotedata = true;
                            Log.print(Log.l.trace, "calling select PRC_MitarbeiterAppDaten...");
                            return AppData.call("PRC_MitarbeiterAppDaten", {
                                pCreatorSiteID: AppData._persistentStates.odata.dbSiteId,
                                pNavigationLocation: 0
                            }, function (json) {
                                AppData._prcUserRemoteCallSucceeded = true;
                                Log.print(Log.l.info, "call success! json=" + JSON.stringify(json));
                                var doUpdate = false;
                                if (AppData.appSettings.odata.serverFailure) {
                                    AppData.appSettings.odata.serverFailure = false;
                                    NavigationBar.enablePage("listRemote");
                                    NavigationBar.enablePage("search");
                                    doUpdate = true;
                                }
                                if (json && json.d && json.d.results.length === 1) {
                                    var prevUserRemoteData = AppData._userRemoteData;
                                    AppData._userRemoteData = json.d.results[0];
                                    AppData.appSettings.odata.timeZoneRemoteAdjustment = AppData._userRemoteData.TimeZoneAdjustment || 0;
                                    if (AppData._userRemoteData.CurrentTS) {
                                        var msString = AppData._userRemoteData.CurrentTS.replace("\/Date(", "").replace(")\/", "");
                                        var millisecondsRemote = parseInt(msString) - AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                                        AppData.appSettings.odata.timeZoneRemoteDiffMs = Math.max(millisecondsLocal - millisecondsRemote, 0);
                                        if (!AppData.appSettings.odata.replPrevSelectMs) {
                                            var now = new Date();
                                            AppData.appSettings.odata.replPrevSelectMs = now.getTime() - AppData.appSettings.odata.timeZoneRemoteDiffMs;
                                        }
                                    }
                                    Log.print(Log.l.info, "timeZoneRemoteAdjustment=" + AppData.appSettings.odata.timeZoneRemoteAdjustment +
                                        " timeZoneRemoteDiffMs=" + AppData.appSettings.odata.timeZoneRemoteDiffMs +
                                        " replPrevSelectMs=" + AppData.appSettings.odata.replPrevSelectMs);
                                    if (AppBar.scope && AppData._userRemoteData.Message) {
                                        Log.print(Log.l.error, "Message=" + AppData._userRemoteData.Message);
                                        AppData.setErrorMsg(AppBar.scope.binding, AppData._userRemoteData.Message);
                                    }
                                    if (AppBar.scope && typeof AppBar.scope.updateActions === "function" &&
                                        (!prevUserRemoteData ||
                                            prevUserRemoteData.AnzVersendeteKontakte !== AppData._userRemoteData.AnzVersendeteKontakte ||
                                            prevUserRemoteData.Bereich !== AppData._userRemoteData.Bereich ||
                                            prevUserRemoteData.EinAusgang !== AppData._userRemoteData.EinAusgang)) { //
                                        doUpdate = true;
                                    }
                                    if (prevUserRemoteData && ((prevUserRemoteData.NotUploaded || 0) !== (AppData._userRemoteData.NotUploaded || 0))) {
                                        doUpdate = true;
                                    }
                                    if (AppData._userRemoteData.MessageID && (AppData._userRemoteData.MessageID === 22183 || AppData._userRemoteData.MessageID === 21359)) {
                                        if (!AppData._persistentStates.inActiveUser) {
                                            doUpdate = true;
                                        }
                                        AppData._persistentStates.inActiveUser = true;
                                    } else {
                                        if (AppData._persistentStates.inActiveUser) {
                                            doUpdate = true;
                                        }
                                        AppData._persistentStates.inActiveUser = false;
                                    }
                                }
                                if (AppBar.scope && typeof AppBar.scope.updateActions === "function" && doUpdate) {
                                    AppBar.scope.updateActions();
                                }
                                AppData._curGetUserRemoteDataId = 0;
                                AppData._inGetUserRemotedata = false;
                                if (AppData._userRemoteDataPromise) {
                                    Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                    AppData._userRemoteDataPromise.cancel();
                                }
                                timeout = (AppData._alternativeTimeout || AppData._persistentStates.odata.replInterval || 30);
                                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s - regulary case!");
                                AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    if (AppData._alternativeTimeout) {
                                        AppData._alternativeTimeout = null;
                                    }
                                    if (AppData._ignore) {
                                        AppData._ignore = false;
                                    }
                                    AppData.getUserRemoteData();
                                    AppData.getCRVeranstOption();
                                    AppData.getMobileVersion();
                                });
                            }, function (errorResponse) {
                                Log.print(Log.l.error, "call error=" + JSON.stringify(errorResponse));
                                AppData.checkForNavigateToLogin(errorResponse);
                                //if (errorResponse.response["\n\'error'"].code)
                                if (AppData._prcUserRemoteCallSucceeded) {
                                    var err = "";
                                    if (!AppData.appSettings.odata.serverFailure) {
                                        AppData.appSettings.odata.serverFailure = true;
                                        NavigationBar.disablePage("listRemote");
                                        NavigationBar.disablePage("search");
                                        if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                            AppBar.scope.checkListButtonStates();
                                        }
                                        if (AppRepl.replicator &&
                                            AppRepl.replicator.networkState !== "Offline" &&
                                            AppRepl.replicator.networkState !== "Unknown" &&
                                            DBInit &&
                                            DBInit.loginRequest) {
                                            var prevRegisterPath = AppData._persistentStates.odata.registerPath;
                                            AppData._persistentStates.odata.registerPath =
                                                AppData._persistentStatesDefaults.odata.registerPath;
                                            DBInit.loginRequest.insert(function (json) {
                                                // this callback will be called asynchronously
                                                // when the response is available
                                                Log.print(Log.l.trace, "loginRequest: success!");
                                                AppData._persistentStates.odata.registerPath = prevRegisterPath;
                                                // loginData returns object already parsed from json file in response
                                                if (json && json.d && json.d.ODataLocation) {
                                                    if (json.d.InactiveFlag) {
                                                        if (AppBar.scope) {
                                                            err = {
                                                                status: 503,
                                                                statusText: getResourceText("login.inactive") +
                                                                    "\n\n" +
                                                                    AppData._persistentStates.odata.login
                                                            };
                                                            AppData.setErrorMsg(AppBar.scope.binding, err);
                                                            alert(err.statusText);
                                                        }
                                                    } else if (json.d.ODataLocation +
                                                        AppData._persistentStatesDefaults.odata.onlinePath !==
                                                        AppData._persistentStates.odata.onlinePath) {
                                                        if (AppBar.scope) {
                                                            err = {
                                                                status: 404,
                                                                statusText: getResourceText("login.modified") +
                                                                    "\n\n" +
                                                                    AppData._persistentStates.odata.login
                                                            };
                                                            AppData.setErrorMsg(AppBar.scope.binding, err);
                                                            alert(err.statusText);
                                                        }
                                                    }
                                                } else {
                                                    if (AppBar.scope) {
                                                        err = {
                                                            status: 404,
                                                            statusText: getResourceText("login.unknown") +
                                                                "\n\n" +
                                                                AppData._persistentStates.odata.login
                                                        };
                                                        AppData.setErrorMsg(AppBar.scope.binding, err);
                                                        alert(err.statusText);
                                                    }
                                                }
                                            }, function (errorResponse) {
                                                // called asynchronously if an error occurs
                                                // or server returns response with an error status.
                                                Log.print(Log.l.error,
                                                    "loginRequest error: " +
                                                    AppData.getErrorMsgFromResponse(errorResponse));
                                                AppData._persistentStates.odata.registerPath = prevRegisterPath;
                                                // ignore this error here for compatibility!
                                            }, {
                                                    LoginName: AppData._persistentStates.odata.login
                                                });
                                        }
                                    }
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    Log.print(Log.l.error, "error in select generalUserRemoteView statusText=" + errorResponse.statusText);
                                    // ignore this error here!
                                    //if (AppBar.scope && errorResponse.statusText === "") {
                                    //    AppData.setErrorMsg(AppBar.scope.binding,
                                    //        { status: 404, statusText: getResourceText("general.internet") });
                                    //} else {
                                    //    AppData.setErrorMsg(AppBar.scope.binding,
                                    //        { status: 404, statusText: errorResponse.statusText });
                                    //}
                                } else if (AppRepl.replicator &&
                                    AppRepl.replicator.networkState !== "Offline" &&
                                    AppRepl.replicator.networkState !== "Unknown") {
                                    // metadata try connect with vpn 
                                    var user = AppData.getOnlineLogin(true);
                                    var password = AppData.getOnlinePassword(true);
                                    var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.getOnlinePath(true) + "/$metadata";
                                    var options = {
                                        type: "GET",
                                        url: url,
                                        user: user,
                                        password: password,
                                        customRequestInitializer: function (req) {
                                            if (typeof req.withCredentials !== "undefined") {
                                                req.withCredentials = true;
                                            }
                                        },
                                        headers: {
                                            "Authorization": "Basic " + btoa(user + ":" + password)
                                        }
                                    };
                                    Log.print(Log.l.trace, "calling metadata..." + options.url);
                                    var ret = WinJS.xhr(options).then(function xhrSuccess(response) {
                                        Log.print(Log.l.info, "AppData.call xhr metadata.", "method=GET" + options.url);
                                        try {
                                            var result = response.responseText;
                                            Log.call(Log.l.info, "AppData.call dummy Test xhr metadata.", "method=GET " + result);
                                            return WinJS.Promise.as();
                                        } catch (exception) {
                                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                                        }
                                        Log.ret(Log.l.info);
                                        return WinJS.Promise.as();
                                    }, function (errorResponse) {
                                        Log.print(Log.l.error, "error=" + AppData.getErrorMsgFromResponse(errorResponse));
                                        //AppData.setErrorMsg(AppBar.scope.binding, errorResponse);
                                        AppData.appSettings.odata.serverFailure = true;
                                        NavigationBar.disablePage("listRemote");
                                        NavigationBar.disablePage("search");
                                        if (AppBar.scope && typeof AppBar.scope.checkListButtonStates === "function") {
                                            AppBar.scope.checkListButtonStates();
                                        }
                                        return WinJS.Promise.as();
                                    });
                                } else {
                                    if (!AppData.appSettings.odata.serverFailure) {
                                        AppData.appSettings.odata.serverFailure = true;
                                    }
                                }
                                AppData._curGetUserRemoteDataId = 0;
                                AppData._inGetUserRemotedata = false;
                                if (AppData._userRemoteDataPromise) {
                                    Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                                    AppData._userRemoteDataPromise.cancel();
                                }
                                timeout = (AppData._persistentStates.odata.replInterval || 30);
                                Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s - in error case!");
                                AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                                    Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                                    AppData.getUserRemoteData();
                                });
                            });
                        });
                    }
                } else {
                    ret = WinJS.Promise.as();
                }
            } else {
                if (!AppRepl.replicator ||
                    !(DBInit && DBInit.loginRequest)) {
                    AppData.appSettings.odata.serverFailure = true;
                    NavigationBar.disablePage("listRemote");
                    NavigationBar.disablePage("search");
                    AppData._curGetUserRemoteDataId = 0;
                    Log.print(Log.l.info, "getUserRemoteData: Now, wait for timeout=" + timeout + "s - no connection case, try again!");
                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(timeout * 1000).then(function () {
                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + timeout + "s is over!");
                        AppData.getUserRemoteData();
                    });
                }
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
                                        !equals(prevContactData, AppData._contactData))) {
                                    AppBar.scope.updateActions(true);
                                }
                            }
                            if (typeof AppHeader === "object" &&
                                AppHeader.controller && AppHeader.controller.binding &&
                                (!prevContactData ||
                                    !equals(prevContactData, AppData._contactData))) {
                                if (parseInt(AppHeader.controller.binding.curFastReqs)) {
                                    AppHeader.controller.binding.hasContactData = 1;
                                    Log.print(Log.l.info, "generalContactView: contactdata changed!");
                                    if (AppRepl.replicator && AppRepl.replicator.inFastRepl) {
                                        // reset numFastReqs to 0!
                                        AppRepl.replicator.run(1);
                                    }
                                } else {
                                    AppHeader.controller.binding.hasContactData = null;
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
        getNotUploaded: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.NotUploaded) {
                ret = AppData._userData.NotUploaded;
            } else {
                ret = 0;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getUploaded: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userData &&
                AppData._userData.Uploaded) {
                ret = AppData._userData.Uploaded;
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
        getCountEmptyContacts: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userRemoteData &&
                AppData._userRemoteData.AnzLeereKontakte) {
                ret = AppData._userRemoteData.AnzLeereKontakte;
            } else {
                ret = 0;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getVisitorFlowLimit: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userRemoteData &&
                AppData._userRemoteData.Limit) {
                ret = AppData._userRemoteData.Limit;
            } else {
                ret = null;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getVisitorFlowAreaRemote: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userRemoteData &&
                AppData._userRemoteData.Bereich) {
                ret = AppData._userRemoteData.Bereich;
            } else {
                ret = null;
            }
            Log.ret(Log.l.u1, ret);
            return ret;
        },
        getVisitorFlowInOutRemote: function () {
            Log.call(Log.l.u1, "AppData.");
            var ret;
            if (AppData._userRemoteData &&
                AppData._userRemoteData.EinAusgang) {
                ret = AppData._userRemoteData.EinAusgang;
            } else {
                ret = null;
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
                        AppData._persistentStates.appColors = false;
                        NavigationBar.disablePage("settings");
                    } else {
                        AppData._persistentStates.serverColors = false;
                        if (!AppData._persistentStates.appColors) {
                            AppData._persistentStates.individualColors = false;
                            WinJS.Promise.timeout(0).then(function () {
                                AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                                var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                var promise = colors._loadCssPromise || WinJS.Promise.timeout(0);
                                promise.then(function () {
                                    AppBar.loadIcons();
                                    NavigationBar.groups = Application.navigationBarGroups;
                                });
                            });
                        }
                        NavigationBar.enablePage("settings");
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
                    if (AppData._persistentStates.manualTheme) {
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
                        AppData._persistentStates.hideCameraQuestionnaire = false;
                    } else {
                        AppData._persistentStates.hideCameraQuestionnaire = true;
                    }
                    break;
                case 20:
                    item.pageProperty = "questionnaire";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideQuestionnaire = true;
                    } else {
                        AppData._persistentStates.hideQuestionnaire = false;
                        /*if (AppData.generalData.area && AppData.generalData.inOut) {
                            AppData.getPropertyFromInitoptionTypeID({
                                INITOptionTypeID: 20,
                                LocalValue: "1"
                            });
                        }*/
                    }

                    plusRemote = true;
                    break;
                case 21:
                    item.pageProperty = "sketch";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideSketch = true;
                    } else {
                        AppData._persistentStates.hideSketch = false;
                        /*if (AppData.generalData.area && AppData.generalData.inOut) {
                            AppData.getPropertyFromInitoptionTypeID({
                                INITOptionTypeID: 21,
                                LocalValue: "1"
                            });
                        }*/
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
                case 38:
                    if (item.LocalValue === "1") {
                        if (!AppData._persistentStates.showQRCode) {
                            AppData._persistentStates.showQRCode = true;
                            if (AppBar.scope && typeof AppBar.scope.updateActions === "function") {
                                AppBar.scope.updateActions();
                            }
                        }
                    } else {
                        if (!!AppData._persistentStates.showQRCode) {
                            AppData._persistentStates.showQRCode = false;
                            if (AppBar.scope && typeof AppBar.scope.updateActions === "function") {
                                AppBar.scope.updateActions();
                            }
                        }
                    }
                    break;
                case 39:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.showNameInHeader = true;
                    } else {
                        AppData._persistentStates.showNameInHeader = false;
                    }
                    if (typeof AppHeader === "object" &&
                        AppHeader.controller && AppHeader.controller.binding) {
                        AppHeader.controller.binding.showNameInHeader = !!AppData._persistentStates.showNameInHeader;
                    }
                    break;
                case 41:
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.useBinaryQrCode = true;
                    } else {
                        AppData._persistentStates.useBinaryQrCode = false;
                    }
                    break;
                case 44:
                    /*if (item.LocalValue) {
                        AppData._persistentStates.showvisitorFlow = true;
                    } else {
                        AppData._persistentStates.showvisitorFlow = false;
                    }*/
                    AppData._persistentStates.showvisitorFlow = parseInt(item.LocalValue);
                    break;
                case 45:
                    /*if (item.LocalValue) {
                        AppData._persistentStates.showvisitorFlow = true;
                    } else {
                        AppData._persistentStates.showvisitorFlow = false;
                    }*/
                    AppData._persistentStates.showvisitorFlowContact = parseInt(item.LocalValue);
                    break;
                case 50:
                    /*if (item.LocalValue) {
                        AppData._persistentStates.showvisitorFlow = true;
                    } else {
                        AppData._persistentStates.showvisitorFlow = false;
                    }*/
                    AppData._persistentStates.visitorFlowInterval = parseInt(item.LocalValue);
                    break;
                case 52:
                    //item.pageProperty = "camera";
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.hideManually = true;
                    } else {
                        AppData._persistentStates.hideManually = false;
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
                data.setRecordId = AppData.setRecordId;
                data.getRecordId = AppData.getRecordId;
                data.setRestriction = AppData.setRestriction;
                data.getRestriction = AppData.getRestriction;
                data.contactDateTime = (function () {
                    return (AppData.getContactDateString() + " " + AppData.getContactTimeString());
                })();
                data.eventName = AppData._userData.VeranstaltungName;
                data.privacyText = AppData._userData.DatenschutzText;
                data.userName = AppData._userData.Login;
                data.userPresent = AppData._userData.Present;
                data.publishFlag = AppData._userData.PublishFlag;
                data.contactDate = (AppData._contactData && AppData._contactData.Erfassungsdatum);
                data.contactId = (AppData._contactData && AppData._contactData.KontaktVIEWID);
                data.globalContactID = ((AppData._contactData && AppData._contactData.CreatorRecID)
                    ? (AppData._contactData.CreatorSiteID + "/" + AppData._contactData.CreatorRecID)
                    : "");
                data.contactCountLocal = AppData.getCountLocal();
                data.contactNotUploaded = AppData.getNotUploaded();
                data.contactUploaded = AppData.getUploaded();
                data.contactCountRemote = AppData.getCountRemote();
                data.remoteContactID = ((AppData._remoteContactData && AppData._remoteContactData.CreatorRecID)
                    ? (AppData._remoteContactData.CreatorSiteID + "/" + AppData._remoteContactData.CreatorRecID)
                    : "");
                data.remoteContactDate = (AppData._remoteContactData && AppData._remoteContactData.Erfassungsdatum);
                data.on = getResourceText("settings.on");
                data.off = getResourceText("settings.off");
                data.dark = getResourceText("settings.dark");
                data.light = getResourceText("settings.light");
                data.system = getResourceText("settings.system");
                data.present = getResourceText("userinfo.present");
                data.absend = getResourceText("userinfo.absend");
                data.limit = AppData._userData.Limit || AppData.getVisitorFlowLimit();
                data.area = AppData._userData.Bereich || AppData.getVisitorFlowAreaRemote();
                data.inOut = AppData._userData.EinAusgang || AppData.getVisitorFlowInOutRemote();
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
        createVCardFromContact: function (dataContact, country) {
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
                message += " \r\n" + formattedName;
                window.plugins.socialsharing.share(message, subject, data, null);
            }
        },
        checkIPhoneBug: function () {
            if (navigator.appVersion) {
                var testDevice = ["iPhone OS", "iPod OS", "Mac OS"];
                for (var i = 0; i < testDevice.length; i++) {
                    var iPhonePod = navigator.appVersion.indexOf(testDevice[i]);
                    if (iPhonePod >= 0) {
                        return true;
                    }
                }
            }
            return false;
        }
    });

    // forward declarations used in binding converters
    WinJS.Namespace.define("Login", {
        nextLogin: null,
        nextPassword: null
    });
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
            var tagLogin = "#LI:";
            if (result && result.text && result.text.substr(0, tagLogin.length) === tagLogin) {
                Log.print(Log.l.trace, "Login with #LI: prefix");
                var pos = result.text.indexOf("/");
                Login.nextLogin = result.text.substr(tagLogin.length, pos - tagLogin.length);
                Login.nextPassword = result.text.substr(pos + 1);
                if (Application.getPageId(nav.location) === "login") {
                    if (AppBar.scope &&
                        typeof AppBar.scope.autoLogin === "function") {
                        WinJS.Promise.timeout(0).then(function () {
                            AppBar.scope.autoLogin();
                        });
                    } else {
                        Barcode.waitingScans++;
                        WinJS.Promise.timeout(250).then(function () {
                            Barcode.waitingScans--;
                            Barcode.onBarcodeSuccess(result, repeatCount + 1);
                        });
                    }
                } else {
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    if (AppData.generalData.logOffOptionActive) {
                        confirm(confirmTitle,
                            function (result) {
                                return result;
                            }).then(function (result) {
                                Log.print(Log.l.trace, "clickLogoff: user choice OK");
                                if (result) {
                                    Application.navigateById("login");
                                } else {
                                    Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                                }
                            });
                    }
                }
            } else {
                if (Application.getPageId(nav.location) === "barcode") {
                    if (Barcode.dontScan &&
                        AppBar.scope &&
                        typeof AppBar.scope.onBarcodeSuccess === "function") {
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
            get: function () {
                if (typeof Barcode === "object") {
                    return Barcode.connectionStatus + (Barcode.ioStatus ? (" / " + Barcode.ioStatus) : "");
                } else {
                    return "";
                }
            }
        },
        startListenDelayed: function (delay) {
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
        startRead: function () {
            var generalData = AppData.generalData;
            Log.call(Log.l.trace, "Barcode.");
            if (navigator &&
                navigator.serialDevice) {
                navigator.serialDevice.readFromDevice(function (readResult) {
                    var data = readResult && readResult.data;
                    Log.print(Log.l.trace, "readFromDevice: success! data=" + data);
                    if (data) {
                        Barcode.onBarcodeSuccess({
                            text: data
                        });
                    } else {
                        WinJS.Promise.timeout(0).then(function () {
                            Barcode.startRead();
                        });
                    }
                }, function (readError) {
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
        startListenDelayed: function (delay) {
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
                                    fileReader.onerror = function (e) {
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
                                }, function (errorResponse) {
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
