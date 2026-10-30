// controller for page: info
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/userMessages/userMessagesService.js" />

(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var namespaceName = "UserMessages";

    WinJS.Namespace.define(namespaceName, {
        Controller: WinJS.Class.derive(Application.RecordsetController, function Controller(pageElement, commandList, isMaster) {
            Log.call(Log.l.trace, namespaceName + ".Controller.");
            var listView = pageElement.querySelector("#userMessageList.listview");
            Application.RecordsetController.apply(this, [pageElement, {
                message: ""
            }, commandList, isMaster, null, UserMessages.userMessageView, listView]);

            var getRecordId = function () {
                return AppData.generalData.getRecordId("Mitarbeiter");
            }
            this.getRecordId = getRecordId;

            this.messages = null;

            var checkIPhoneBug = function () {
                if (navigator.appVersion) {
                    var testDevice = ["iPhone OS", "iPod OS", "Mac OS"];
                    for (var i = 0; i < testDevice.length; i++) {
                        var iPhonePod = navigator.appVersion.indexOf(testDevice[i]);
                        if (iPhonePod >= 0) {
                            var strVersion = navigator.appVersion.substr(iPhonePod + testDevice[i].length);
                            var testVersion = ["11_3", "11_4"];
                            for (var j = 0; j < testVersion.length; j++) {
                                if (strVersion.indexOf(testVersion[j]) === 1) {
                                    return true;
                                }
                            }
                            break;
                        }
                    }
                }
                return false;
            };
            var hasIPhoneBug = checkIPhoneBug();
            var isAppleDevice = AppData.checkIPhoneBug();
            var that = this;

            this.refreshPromise = null;
            this.refreshWaitTimeMs = 30000;

            this.dispose = function () {
                that.cancelPromises();
            };

            var cancelPromises = function () {
                Log.call(Log.l.trace, namespaceName + ".Controller.");
                if (that.refreshPromise) {
                    Log.print(Log.l.trace, "cancel previous refresh Promise");
                    that.refreshPromise.cancel();
                    that.refreshPromise = null;
                }
                Log.ret(Log.l.trace);
            }
            this.cancelPromises = cancelPromises;

            var layout = null;

            // now do anything...

            var eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
                    that.insertData().then(function() {
                        that.loadData();
                    });
                    Log.ret(Log.l.trace);
                },
                activateEnterKey: function (event) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward") {
                            AppBar.commandList[i].key = WinJS.Utilities.Key.enter;
                            break;
                        }
                    }
                    if (event && event.currentTarget && !hasIPhoneBug) {
                        WinJS.Utilities.removeClass(event.currentTarget, "field-text-comment-big");
                        WinJS.Utilities.removeClass(pageElement, "page-has-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
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
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
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
                deactivateEnterKey: function (event) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward") {
                            AppBar.commandList[i].key = null;
                            break;
                        }
                    }
                    if (event && event.currentTarget && !hasIPhoneBug) {
                        WinJS.Utilities.addClass(event.currentTarget, "field-text-comment-big");
                        WinJS.Utilities.addClass(pageElement, "page-has-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = UserMessages.ListLayout.MessagesLayout;
                                listView.winControl.layout = { type: layout };
                            }
                            // single list selection
                            if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.none) {
                                listView.winControl.selectionMode = WinJS.UI.SelectionMode.none;
                            }
                            // direct selection on each tap
                            if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.none) {
                                listView.winControl.tapBehavior = WinJS.UI.TapBehavior.none;
                            }
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                            var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                            for (var i = indexOfFirstVisible; i <= indexOfLastVisible; i++) {
                                var element = listView.winControl.elementFromIndex(i);
                                if (element && element.parentElement) {
                                    if (!WinJS.Utilities.hasClass(element.parentElement, "win-nonselectable")) {
                                        WinJS.Utilities.addClass(element.parentElement, "win-nonselectable");
                                    }
                                }
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            if (that.binding.loading) {
                                that.binding.loading = false;
                            }
                        }
                    }
                    that.loadingStateChanged(eventInfo);
                    Log.ret(Log.l.trace);
                },
                onFooterVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, namespaceName + ".Controller.");
                    if (eventInfo && eventInfo.detail) {
                        var visible = eventInfo.detail.visible;
                        if (visible && that.nextUrl) {
                            that.loadNext();
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            }
            this.eventHandlers = eventHandlers;

            var disableHandlers = {
                clickOk: function() {
                    return AppBar.busy || !AppBar.modified || !that.binding.message;
                }
            }
            this.disableHandlers = disableHandlers;

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));
            }

            var resultConverter = function (item, index) {
                item.index = index;
                if (item.Info1 && !item.Info1TSRead) {
                    item.newInfo1Flag = 1;
                } else {
                    item.newInfo1Flag = 0;
                }
            }
            this.resultConverter = resultConverter;

            var loadData = this.loadData;
            var newLoadData = function () {
                Log.call(Log.l.trace, namespaceName + ".Controller.");
                AppData.setErrorMsg(that.binding);
                var restriction = {
                    BenutzerID: getRecordId()
                }
                var ret = new WinJS.Promise.as().then(function () {
                    if (typeof loadData === "function") {
                        Log.print(Log.l.trace, "calling select userMessageView...");
                        return loadData(restriction);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    Log.print(Log.l.trace, "Data loaded");
                    that.cancelPromises();
                    that.refreshPromise = WinJS.Promise.timeout(that.refreshWaitTimeMs).then(function () {
                        that.loadData();
                    });
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = newLoadData;

            var insertData = function (complete, error) {
                Log.call(Log.l.trace, namespaceName + ".Controller.");
                AppData.setErrorMsg(that.binding);
                var ret;
                if (that.binding.message && AppBar.modified && !AppBar.busy) {
                    /**
                     * INSERT in BenutzerNachricht_ODataVIEW
                     * BenutzerID, AbsenderID, EmpfaengerID, evtl. InfoID, InfoText, evtl. SendMAID, SendTS, evtl. ReadMAID, ReadTS
                     * Beispiel normale Nachricht
                     * recordID, null, recordID, null, "blabla", null, timestamp von der db, null, null
                     */
                    var newMessage = {
                        BenutzerID: getRecordId(),
                        AbsenderID: getRecordId(),
                        InfoText: that.binding.message
                    }
                    ret = UserMessages.userMessageView.insert(function (json) {
                        // called asynchronously if ok
                        // force reload of userData for Present flag
                        /**
                         * inserttrigger in db für timestamp setzen 
                         */
                        Log.print(Log.l.trace, "userMessageView: insert success!");
                        that.binding.message = "";
                        AppBar.modified = false;
                        if (typeof complete === "function") {
                            complete(json);
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        if (typeof error === "function") {
                            error(errorResponse);
                        }
                    }, newMessage)/*Lade dann nochmal loaddata die neue nachricht?!*/;
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete();
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertData = insertData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
                AppBar.notifyModified = true;
            });
            Log.ret(Log.l.trace);
        }, {
        })
    });
})();



