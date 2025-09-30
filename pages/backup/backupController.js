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
                selectedIsArchived: false,
                lastError: lastError
            }, commandList]);

            this.backups = null;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#listBackups.listview");

            this.dispose = function () {
            }

            this.eventHandlers = {
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (listView && listView.winControl && listView.winControl.selection &&
                        listView.winControl.selection.count() === 1) {
                        // Only one item is selected, show the page
                        listView.winControl.selection.getItems().done(function (items) {
                            var itemData = items[0] && items[0].data;
                            that.binding.selectedIsArchived = itemData && itemData.isArchived;
                            AppBar.triggerDisableHandlers();
                        });
                    } else {
                        that.binding.selectedIsArchived = false;
                        AppBar.triggerDisableHandlers();
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "Backup.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // single list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.single) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.single;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.directSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.directSelect;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                        } else if (listView.winControl.loadingState === "complete") {
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickHomepageLink: function (event) {
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
                        var message = Application.pageframe.name + " " + getResourceText("info.share") + " " + that.binding.replError;
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
                    var dataDirectory = AppData.getDataDirectory();
                    if (window.plugins &&
                        window.plugins.socialsharing &&
                        typeof window.plugins.socialsharing.share === "function" &&
                        typeof window.resolveLocalFileSystemURL === "function" &&
                        typeof cordova !== "undefined" &&
                        cordova.file &&
                        cordova.file.dataDirectory &&
                        dataDirectory &&
                        listView && listView.winControl && listView.winControl.selection) {
                        var selectionCount = listView.winControl.selection.count();
                        if (selectionCount === 1) {
                            // Only one item is selected, share the files
                            listView.winControl.selection.getItems().done(function (items) {
                                var itemData = items[0] && items[0].data;
                                if (itemData) {
                                    var nameDb = itemData.fileNameDb || AppData.getDbFileName();
                                    var fileNameDb = (itemData.isArchived ? cordova.file.dataDirectory : dataDirectory) + nameDb;
                                    var fileNamePs = cordova.file.dataDirectory + itemData.fileNamePs;

                                    var subject = nameDb + " + Settings";
                                    var message = nameDb + " + Settings " + getResourceText("info.shareBackup");
                                    if (typeof device === "object" && (device.platform === "Android" || device.platform === "iOS")) {
                                        window.plugins.socialsharing.share(message, subject, [fileNameDb, fileNamePs]);
                                    } else {
                                        window.resolveLocalFileSystemURL(dataDirectory, function (dirEntry) {
                                            if (dirEntry && dirEntry.filesystem && dirEntry.filesystem.winpath) {
                                                fileNameDb = dirEntry.filesystem.winpath.replace(/\//g, "\\") + nameDb;
                                                fileNamePs = dirEntry.filesystem.winpath.replace(/\//g, "\\") + itemData.fileNamePs;
                                                window.plugins.socialsharing.share(message, subject, [fileNameDb, fileNamePs]);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickDelete: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    var itemData = null;
                    var doDelete = false;
                    var filePromises = [];
                    listView.winControl.selection.getItems().then(function (items) {
                        itemData = items[0] && items[0].data;
                    }).then(function () {
                        if (itemData && itemData.isArchived) {
                            var confirmTitle = getResourceText("backup.questionDelete");
                            return confirm(confirmTitle, function (result) {
                                doDelete = result;
                                if (result) {
                                    Log.print(Log.l.trace, "clickDelete: user choice OK");
                                } else {
                                    Log.print(Log.l.trace, "clickDelete: user choice CANCEL");
                                }
                            });
                        } else {
                            Log.print(Log.l.error, "clickDelete: invalid file selected: " + itemData.title);
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (doDelete &&
                            typeof cordova !== "undefined" &&
                            cordova.file &&
                            cordova.file.dataDirectory &&
                            listView &&
                            listView.winControl &&
                            listView.winControl.selection &&
                            listView.winControl.selection.count() === 1) {
                            return listView.winControl.selection.getItems();
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function (items) {
                        var itemData = items[0] && items[0].data;
                        if (itemData) {
                            var nameDb = itemData.fileNameDb || AppData.getDbFileName();
                            var fileNameDb = cordova.file.dataDirectory + nameDb;
                            var fileNamePs = cordova.file.dataDirectory + itemData.fileNamePs;
                            Log.print(Log.l.info, "Deleting files: " + fileNameDb + ", " + fileNamePs);
                            filePromises.push(new WinJS.Promise(function (complete, error) {
                                window.resolveLocalFileSystemURL(fileNameDb, function (fileEntry) {
                                    fileEntry.remove(function () {
                                        Log.print(Log.l.info, "File deleted successfully: " + fileNameDb);
                                        complete();
                                    }, function (err) {
                                        Log.print(Log.l.error, "Error deleting file: ", err);
                                        error();
                                    });
                                }, function (err) {
                                    Log.print(Log.l.error, "Error resolving file URL: ", err);
                                    error();
                                });
                            }));
                            filePromises.push(new WinJS.Promise(function (complete, error) {
                                window.resolveLocalFileSystemURL(fileNamePs, function (fileEntry) {
                                    fileEntry.remove(function () {
                                        Log.print(Log.l.info, "File deleted successfully: " + fileNamePs);
                                        complete();
                                    }, function (err) {
                                        Log.print(Log.l.error, "Error deleting file: ", err);
                                        error();
                                    });
                                }, function (err) {
                                    Log.print(Log.l.error, "Error resolving file URL: ", err);
                                    error();
                                });
                            }));
                            return WinJS.Promise.join(filePromises);
                        } else {
                            return WinJS.Promise.as();
                        }
                    }).then(function (items) {
                        if (filePromises.length > 0) {
                            return that.loadData();
                        } else {
                            return WinJS.Promise.as();
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                clickOk: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "about.Controller.");
                    Application.navigateById("userinfo", event);
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
                clickDelete: function() {
                    return !that.binding.selectedIsArchived;
                },
                clickOk: function () {
                    // always enabled!
                    return false;
                },
                clickShareDB: function () {
                    // always enabled!
                    return false;
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
                clickChangeUserState: function() {
                    var accountbutton = document.getElementById("accountbutton");
                    if (accountbutton) {
                        accountbutton.disabled = !AppData._persistentStates.odata.login && !AppData._persistentStates.odata.password;
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

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
            }
            var loadData = function() {
                Log.call(Log.l.trace, "Backup.Controller.");
                if (that.backups) {
                    that.backups.length = 0;
                }
                var ret = Backup.backupList.select(function(json) {
                    Log.print(Log.l.trace, "Backup.backupList: success!");
                    if (json && json.d && json.d.results) {
                        if (!that.backups) {
                            that.backups = new WinJS.Binding.List(json.d.results);
                        } else {
                            json.d.results.forEach(function(item, index) {
                                that.backups.push(item);
                            });
                        }
                        if (listView && listView.winControl) {
                            // add ListView dataSource
                            listView.winControl.itemDataSource = that.backups.dataSource;
                        }
                    }
                }, function (errorResponse) {
                    AppData.setErrorMsg(that.binding, errorResponse);
                }).then(function() {
                    if (listView && listView.winControl && listView.winControl.selection) {
                        listView.winControl.selection.set(that.backups.length - 1);
                    }
                });

                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            AppData.setErrorMsg(this.binding);

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



