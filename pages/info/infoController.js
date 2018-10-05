// controller for page: info
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/info/infoService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Info", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Info.Controller.");

            var isWindows = false;
            var isAndroid = false;
            var hasPicturesDirectory = (cordova.file.picturesDirectory ? true : false);
            if (typeof device === "object" && typeof device.platform === "string") {
                if (device.platform === "Android") {
                    if (typeof AppData.generalData.useAudioNote === "undefined") {
                        AppData._persistentStates.useAudioNote = false;
                    }
                    isAndroid = true;
                } else if (device.platform.substr(0, 7) === "windows") {
                    isWindows = true;
                }
            }
            Application.Controller.apply(this, [pageElement, {
                uploadTS: (AppData.appSettings.odata.replPrevPostMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevPostMs + ")\/" : null),
                downloadTS: (AppData.appSettings.odata.replPrevSelectMs ?
                "\/Date(" + AppData.appSettings.odata.replPrevSelectMs + ")\/" : null),
                version: Application.version,
                environment: "Platform: " + navigator.appVersion,
                showClipping: false,
                isAndroid: isAndroid,
                isWindows: isWindows,
                hasPicturesDirectory: hasPicturesDirectory
            }, commandList]);

            this.picturesDirectorySubFolder = AppData.generalData.picturesDirectorySubFolder;
            this.binding.generalData.picturesDirectorySubFolder = "";

            var picturesFolderSelect = pageElement.querySelector("#picturesFolderSelect");
            var picturesDirectoryFolders = [{ name: "" }];
            // save for later preselection

            var that = this;

            this.dispose = function () {
                if (picturesFolderSelect && picturesFolderSelect.winControl) {
                    picturesFolderSelect.winControl.data = null;
                }
            }

            var homepageLink = pageElement.querySelector("#homepageLink");
            if (homepageLink) {
                homepageLink.innerHTML = "<a href=\"http://" + getResourceText("info.homepage") + "\">" + getResourceText("info.homepage") + "</a>";
            }

            var setupLog = function () {
                var settings = null;
                Log.call(Log.l.trace, "Info.Controller.");
                if (that.binding.generalData.logEnabled) {
                    settings = {
                        target: that.binding.generalData.logTarget,
                        level: that.binding.generalData.logLevel,
                        group: that.binding.generalData.logGroup,
                        noStack: that.binding.generalData.logNoStack
                    };
                }
                Log.ret(Log.l.trace);
                Log.init(settings);
            };
            this.setupLog = setupLog;

            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Info.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickLogEnabled: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logEnabled = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickReplActive: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.appSettings.odata.replActive = toggle.checked;
                            if (AppRepl.replicator) {
                                if (toggle.checked) {
                                    if (AppRepl.replicator.state === "stopped") {
                                        AppRepl.replicator.run();
                                    }
                                } else {
                                    if (AppRepl.replicator.state !== "stopped") {
                                        AppRepl.replicator.stop();
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseClippingCamera: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useClippingCamera = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedAutoShutterTime: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.autoShutterTime = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseAudioNote: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useAudioNote = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseExternalCamera: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useExternalCamera = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickUseBarcodeActivity: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.useBarcodeActivity = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickCameraUseGrayscale: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.cameraUseGrayscale = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedCameraQuality: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.cameraQuality = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedReplInterval: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.appSettings.odata.replInterval = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedLogLevel: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.logLevel = range.value;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogGroup: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logGroup = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogNoStack: function (event) {
                    Log.call(Log.l.trace, "info.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.logNoStack = toggle.checked;
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            }

            this.disableHandlers = {
                clickOk: function () {
                    // always enabled!
                    return false;
                }
            }

            AppData.setErrorMsg(this.binding);
            
            if (AppData.appSettings.odata.login && AppData.appSettings.odata.login.search("convey.de") > 0 || 
                isWindows) {
                that.binding.showClipping = true;
            }

            var loadData = function() {
                Log.call(Log.l.trace, "info.Controller.");
                var ret = new WinJS.Promise.as().then(function() {
                    if (picturesFolderSelect &&
                        picturesFolderSelect.winControl &&
                        hasPicturesDirectory &&
                        typeof window.resolveLocalFileSystemURL === "function") {
                        window.resolveLocalFileSystemURL(cordova.file.picturesDirectory, function(dirEntry) {
                            Log.print(Log.l.info, "resolveLocalFileSystemURL: file system open name=" + dirEntry.name);
                            var dirReader = dirEntry.createReader();
                            dirReader.readEntries(function (entries) {
                                var bFound = false;
                                for (var i = 0; i < entries.length; i++) {
                                    if (entries[i].isDirectory) {
                                        picturesDirectoryFolders.push({
                                            name: entries[i].name
                                        });
                                        if (entries[i].name === that.picturesDirectorySubFolder) {
                                            bFound = true;
                                        }
                                    }
                                }
                                if (!bFound) {
                                    that.picturesDirectorySubFolder = "";
                                }
                                if (picturesDirectoryFolders.length > 1) {
                                    picturesFolderSelect.winControl.data = new WinJS.Binding.List(picturesDirectoryFolders);
                                }
                                that.binding.generalData.picturesDirectorySubFolder = that.picturesDirectorySubFolder;
                            },
                            function(errorResponse) {
                                Log.print(Log.l.error, "readEntries: error " + errorResponse.toString());
                            });
                        }, function(errorResponse) {
                            Log.print(Log.l.error, "resolveLocalFileSystemURL error " + errorResponse.toString());
                        });
                    };
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loadad");
                AppBar.notifyModified = true;
            });
            Log.ret(Log.l.trace);
        }),
        getLogLevelName: function (level) {
            Log.call(Log.l.trace, "Info.", "level=" + level);
            var key = "log" + level;
            Log.print(Log.l.trace, "key=" + key);
            var resources = getResourceTextSection("info");
            var name = resources[key];
            Log.ret(Log.l.trace, "name=" + name);
            return name;
        }
    });
})();



