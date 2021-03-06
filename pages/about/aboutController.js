﻿// controller for page: about
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
                        var message = Application.pageframe.name + " " + getResourceText("info.share");
                        try {
                            window.resolveLocalFileSystemURL(dataDirectory, function(dirEntry) {
                                if (dirEntry) {
                                    try {
                                        dirEntry.getFile(fileName, {
                                            create: false,
                                            exclusive: false
                                        }, function(fileEntry) {
                                            if (fileEntry) {
                                                fileEntry.file(function(file) {
                                                    try {
                                                        var reader = new FileReader();
                                                        reader.onerror = function(errorResponse) {
                                                            AppData.setErrorMsg(that.binding, "Failed read file " + fileName + " error: " + JSON.stringify(errorResponse));
                                                        }; 
                                                        reader.onloadend = function() {
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
                                                }, function(errorResponse) {
                                                    AppData.setErrorMsg(that.binding, "Error read" + fileName + " error: " + JSON.stringify(errorResponse));
                                                });
                                            } else {
                                                AppData.setErrorMsg(that.binding, "file read error NO fileEntry!");
                                            }
                                        }, function(errorResponse) {
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
                clickShare:function () {
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
                }
            }
            AppData.setErrorMsg(this.binding);

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                AppBar.notifyModified = true;
                return Colors.loadSVGImageElements(pageElement, "app-logo", 240);
            });
            Log.ret(Log.l.trace);
        })
    });
})();



