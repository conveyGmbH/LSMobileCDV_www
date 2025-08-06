// controller for page: about
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/about/aboutService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";
    var b64 = window.base64js;

    WinJS.Namespace.define("About", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "About.Controller.");

            var environment = navigator.appVersion;
            if (typeof device === "object") {
                environment += " " + device.platform + " " + device.version;
            }
            Application.Controller.apply(this, [pageElement, {
                isDarkTheme: Colors.isDarkTheme,
                version: Application.version,
                environment: "Platform: " + environment,
                eventName: getResourceText("info.eventName") + AppData._userData.VeranstaltungName,
                replError: AppRepl.replicator.state === "error" ? AppData.getErrorMsgFromResponse(AppRepl.replicator._err) : "",
                siteId: AppData._persistentStates.odata.dbSiteId ? getResourceText("about.deviceID") + " " + AppData._persistentStates.odata.dbSiteId : ""
            }, commandList]);

            var that = this;

            var isAppleDevice = AppData.checkIPhoneBug();
            //var lastError = that.binding.error.errorMsg;

            this.dispose = function () {
            }

            this.eventHandlers = {
                clickHomepageLink: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    var url = "https://" + getResourceText("info.homepage");
                    if (isAppleDevice && cordova.InAppBrowser) {
                        cordova.InAppBrowser.open(url, '_system');
                    } else {
                        window.open(url, '_system');
                    }
                    Log.ret(Log.l.trace);
                },
                clickBack: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    if (!Application.showMaster() && WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickShare: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    if (window.plugins &&
                        window.plugins.socialsharing &&
                        typeof window.plugins.socialsharing.share === "function" &&
                        typeof window.resolveLocalFileSystemURL === "function" &&
                        typeof cordova !== "undefined" &&
                        cordova.file &&
                        (cordova.file.tempDirectory || cordova.file.dataDirectory) &&
                        Application.pageframe &&
                        Application.pageframe.name) {
                        var dataDirectory = cordova.file.tempDirectory || cordova.file.dataDirectory;
                        var fileName = Application.pageframe.name + ".log";
                        var subject = Application.pageframe.name;
                        var message = Application.pageframe.name + " " + getResourceText("info.share") + lastError;
                        try {
                            window.resolveLocalFileSystemURL(dataDirectory, function (dirEntry) {
                                if (dirEntry) {
                                    try {
                                        dirEntry.getFile(fileName, {
                                            create: false,
                                            exclusive: false
                                        }, function (fileEntry) {
                                            if (fileEntry) {
                                                fileEntry.file(function (file) {
                                                    try {
                                                        var reader = new FileReader();
                                                        reader.onerror = function (errorResponse) {
                                                            AppData.setErrorMsg(that.binding, "Failed read file " + fileName + " error: " + JSON.stringify(errorResponse));
                                                        };
                                                        reader.onloadend = function () {
                                                            var blob = utf8_decode(this.result);
                                                            var encoded = b64.fromByteArray(blob);
                                                            var data = "data:text/log;base64," + encoded;
                                                            Log.print(Log.l.info, "Successful file read! fileName=" + fileName + " data-length=" + data);
                                                            window.plugins.socialsharing.share(message, subject, data);
                                                        };
                                                        reader.readAsText(file);
                                                    } catch (ex) {
                                                        console.log("Failed new FileReader error: " + JSON.stringify(ex));
                                                    }
                                                }, function (errorResponse) {
                                                    AppData.setErrorMsg(that.binding, "Error read" + fileName + " error: " + JSON.stringify(errorResponse));
                                                });
                                            } else {
                                                AppData.setErrorMsg(that.binding, "file read error NO fileEntry!");
                                            }
                                        }, function (errorResponse) {
                                            AppData.setErrorMsg(that.binding, "getFile(" + fileName + ") error: " + JSON.stringify(errorResponse));
                                        });
                                    } catch (ex) {
                                        AppData.setErrorMsg(that.binding, "Failed dirEntry.getFile error: " + JSON.stringify(ex));
                                    }
                                }
                            });
                        } catch (ex) {
                            AppData.setErrorMsg(that.binding, "Exception in share file: " + JSON.stringify(ex));
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickShareDB: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    var dbName = Application.pageframe.name;
                    var dataDirectory = cordova.file.dataDirectory;
                    //var persistenStatesName = Application.pageframe.filenamePSEncoded || Application.pageframe.filenamePersistentStates;
                    if (dbName && typeof dbName === "string") {
                        dbName = dbName.toLowerCase();
                    } else {
                        dbName = 'leadsuccess';
                    }
                    dbName += '.db';
                    // cordova.file
                    Log.print(Log.l.trace, "cordova.file: success!" + cordova.file);
                    if (typeof device === "object" && device.platform === "Android") {
                        dataDirectory = cordova.file.applicationStorageDirectory + "databases/";
                        //applicationStorageDirectory
                    } else if (typeof device === "object" && device.platform === "iOS") {
                        dataDirectory = cordova.file.applicationStorageDirectory + "Library/LocalDatabase/";
                    } else {
                        dataDirectory = cordova.file.dataDirectory;
                    }
                    if (window.plugins &&
                        window.plugins.socialsharing &&
                        typeof window.plugins.socialsharing.share === "function" &&
                        typeof window.resolveLocalFileSystemURL === "function" &&
                        typeof cordova !== "undefined" &&
                        cordova.file &&
                        cordova.file.dataDirectory &&
                        Application.pageframe &&
                        Application.pageframe.name) {
                        var fileName = dataDirectory + dbName;
                        var fileName2 = cordova.file.dataDirectory + Application.pageframe.filenamePersistentStates;
                        var fileName3 = cordova.file.dataDirectory + Application.pageframe.filenamePSEncoded;
                        var subject = dbName + " + Settings";
                        var message = dbName + " + Settings " + getResourceText("info.shareBackup");
                        if (typeof device === "object" && (device.platform === "Android" || device.platform === "iOS")) {
                            window.plugins.socialsharing.share(message, subject, [fileName, AppData._persistentStates.encodeSettings ? fileName3 : fileName2]);
                        } else {
                            window.resolveLocalFileSystemURL(dataDirectory, function (dirEntry) {
                                if (dirEntry && dirEntry.filesystem && dirEntry.filesystem.winpath) {
                                    fileName = dirEntry.filesystem.winpath.replace(/\//g, "\\") + dbName;
                                    fileName2 = dirEntry.filesystem.winpath.replace(/\//g, "\\") + Application.pageframe.filenamePersistentStates;
                                    fileName3 = dirEntry.filesystem.winpath.replace(/\//g, "\\") + Application.pageframe.filenamePSEncoded;
                                    window.plugins.socialsharing.share(message, subject, [fileName, AppData._persistentStates.encodeSettings ? fileName3 : fileName2]);
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    Application.navigateById("account", event);
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
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            AppData._persistentStates.veranstoption = {};
                            AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            Application.pageframe.savePersistentStates();
                            that.binding.doEdit = false;
                            that.binding.generalData.notAuthorizedUser = false;
                            that.binding.enableChangePassword = false;
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
            }

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickShare: function () {
                    return (AppData.generalData.logEnabled &&
                        AppData.generalData.logTarget === 2 &&
                        window.plugins &&
                        window.plugins.socialsharing &&
                        typeof window.plugins.socialsharing.share === "function" &&
                        typeof window.resolveLocalFileSystemURL === "function" &&
                        typeof cordova !== "undefined" &&
                        cordova.file &&
                        (cordova.file.tempDirectory || cordova.file.dataDirectory) &&
                        Application.pageframe &&
                        Application.pageframe.name) ? false : true;
                },
                clickOk: function () {
                    // always enabled!
                    return false;
                },
                clickShareDB: function () {
                    // always enabled!
                    return false;
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
            AppData.setErrorMsg(this.binding);

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                AppBar.notifyModified = true;
                return Colors.loadSVGImageElements(pageElement, "app-logo", 240);
            });
            Log.ret(Log.l.trace);
        })
    });
})();



