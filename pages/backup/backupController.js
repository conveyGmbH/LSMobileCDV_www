// controller for page: backup
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/backup/backupService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";
    var b64 = window.base64js;

    WinJS.Namespace.define("Backup", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Backup.Controller.");

            var lastError = (AppBar.scope &&
                AppBar.scope.binding &&
                AppBar.scope.binding.error &&
                AppBar.scope.binding.error.errorMsg) ? AppBar.scope.binding.error.errorMsg : "";

            Application.Controller.apply(this, [pageElement, {
                isDarkTheme: Colors.isDarkTheme,
                version: Application.version,
                environment: "Platform: " + navigator.appVersion,
                lastError: lastError
            }, commandList]);

            var that = this;

            //var lastError = that.binding.error.errorMsg;

            this.dispose = function () {
            }

            this.eventHandlers = {
                clickHomepageLink: function(event) {
                    Log.call(Log.l.trace, "backup.Controller.");
                    var url = "https://" + getResourceText("info.homepage");
                    if (isAppleDevice && cordova.InAppBrowser) {
                        cordova.InAppBrowser.open(url, '_system');
                    } else {
                        window.open(url, '_system');
                    }
                    Log.ret(Log.l.trace);
                },
                clickBack: function (event) {
                    Log.call(Log.l.trace, "backup.Controller.");
                    if (!Application.showMaster() && WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickShareDB: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    var dbName = Application.pageframe.name;
                    var dataDirectory = cordova.file.dataDirectory;
                    var persistenStatesName = Application.pageframe.filenamePersistentStates;
                    if (dbName && typeof dbName === "string") {
                        dbName = dbName.toLowerCase();
                    } else {
                        dbName = 'leadsuccess';
                    }
                    dbName += '.db';
                    // cordova.file
                    Log.print(Log.l.trace, "cordova.file: success!" + cordova.file);
                    if (typeof device === "object" && device.platform === "Android") {
                        dataDirectory = cordova.file.databaseDirectory;
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
                        var fileName2 = cordova.file.dataDirectory + persistenStatesName;
                        var subject = dbName + " " + persistenStatesName;
                        var message = dbName + " " + persistenStatesName + " " + getResourceText("info.shareBackup");
                        var options = { subject: subject, message: message, files: [fileName, fileName2] }
                        /*window.plugins.socialsharing.shareWithOptions(options, function(result) {
                            Log.print(Log.l.info, "Share completed? " + result.completed); // On Android apps mostly return false even while it's true
                            Log.print(Log.l.info, "Shared to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
                        }, function (msg) {
                            Log.print(Log.l.error, "Sharing failed with message: " + msg);
                        });*/
                        if (typeof device === "object" && (device.platform === "Android" || device.platform === "iOS")) {
                            window.plugins.socialsharing.share(message, subject, [fileName, fileName2]);
                        } else {
                            window.resolveLocalFileSystemURL(dataDirectory, function(dirEntry) {
                                if (dirEntry && dirEntry.filesystem && dirEntry.filesystem.winpath) {
                                    fileName = dirEntry.filesystem.winpath.replace(/\//g, "\\") + dbName;
                                    fileName2 = dirEntry.filesystem.winpath.replace(/\//g, "\\") + persistenStatesName;
                                    window.plugins.socialsharing.share(message, subject, [fileName, fileName2]);
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
                }
            }

            this.disableHandlers = {
                clickBack: function() {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickOk: function () {
                    // always enabled!
                    return false;
                },
                clickShareDB: function () {
                    // always enabled!
                    return false;
                }
            }
            AppData.setErrorMsg(this.binding);

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                AppBar.notifyModified = true;
                //return Colors.loadSVGImageElements(pageElement, "app-logo", 240);
            });
            Log.ret(Log.l.trace);
        })
    });
})();



