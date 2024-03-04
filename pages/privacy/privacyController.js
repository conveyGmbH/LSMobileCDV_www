// controller for page: privacy
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/privacy/privacyService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Privacy", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Privacy.Controller.");
            var that = this;

            var addPageData = {
                contactId: AppData.getRecordId("Kontakt"),
                noteId: null,
                noteTitle: null
            };
            Application.Controller.apply(this, [pageElement, addPageData, commandList]);

            this.pageElement = pageElement;
            this.docViewer = null;

            var getDocViewer = function () {
                Log.call(Log.l.trace, "Privacy.Controller.");
                var docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("svgSketch"));
                Log.ret(Log.l.trace);
                return docViewer;
            }

            var prevNoteId;
            var inLoadDoc = false;
            var loadDoc = function () {
                var ret;
                var parentElement;
                Log.call(Log.l.trace, "Privacy.Controller.", "noteId=" + that.binding.noteId);
                // prevent recursive calls here!
                if (inLoadDoc) {
                    if (that.binding.noteId === prevNoteId) {
                        Log.print(Log.l.trace, "extra ignored");
                        ret = WinJS.Promise.as();
                    } else {
                        Log.print(Log.l.trace, "busy - try later again");
                        var loadDocPromise = WinJS.Promise.timeout(50).then(function () {
                            that.removeDisposablePromise(loadDocPromise);
                            return loadDoc();
                        });
                        ret = that.addDisposablePromise(loadDocPromise);
                    }
                } else {
                    // set semaphore
                    inLoadDoc = true;
                    prevNoteId = that.binding.noteId;
                    // check for need of command update in AppBar
                    var prevDocViewer = that.docViewer;
                    var newDocViewer = getDocViewer();
                    if (newDocViewer && newDocViewer.controller) {
                        Log.print(Log.l.trace, "found docViewer!");
                        that.docViewer = newDocViewer;
                        ret = that.docViewer.controller.loadData(that.binding.noteId);
                    } else {
                        Log.print(Log.l.trace, "load new svgSketch!");
                        parentElement = pageElement.querySelector("#svghost");
                        if (parentElement) {
                            ret = Application.loadFragmentById(parentElement, "svgSketch", {
                                noteId: that.binding.noteId,
                                isLocal: true,
                                noCommandList: true,
                                alignBottom: true
                            });
                        } else {
                            ret = WinJS.Promise.as();
                        }
                    }
                    ret = ret.then(function () {
                        if (!prevDocViewer) {
                            that.docViewer = getDocViewer();
                        }
                        // reset semaphore
                        inLoadDoc = false;
                        AppBar.triggerDisableHandlers();
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadDoc = loadDoc;

            // check modify state
            // modified==true when modified in docViewer!
            var isModified = function () {
                Log.call(Log.l.trace, "Privacy.Controller.");
                var ret;
                if (that.docViewer && that.docViewer.controller &&
                    typeof that.docViewer.controller.isModified === "function") {
                    Log.print(Log.l.trace, "calling docViewer.controller.isModified...");
                    ret = that.docViewer.controller.isModified();
                } else {
                    ret = false;
                }
                Log.ret(Log.l.trace, "modified=" + ret);
                return ret;
            }
            this.isModified = isModified;

            var loadData = function () {
                that.binding.noteId = null;
                Log.call(Log.l.trace, "Privacy.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!that.binding.contactId) {
                        Log.print(Log.l.trace, "ignored if no contact id");
                        return WinJS.Promise.timeout(0).then(function() {
                            Application.navigateById("start");
                        });
                    } else {
                        Log.print(Log.l.trace, "use existing contactID=" + that.binding.contactId);
                        var contactNoteSelectPromise =  Privacy.contactNoteView.select(function(json) {
                            that.removeDisposablePromise(contactNoteSelectPromise);
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactNoteView: success!");
                            if (json && json.d && json.d.results && json.d.results.length > 0) {
                                var result = json.d.results = json.d.results[json.d.results.length - 1];
                                if (result) {
                                    that.binding.noteId = result.KontaktNotizVIEWID;
                                    that.binding.noteTitle = result.Titel;
                                }
                            }
                        }, function(errorResponse) {
                            that.removeDisposablePromise(contactNoteSelectPromise);
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, {
                            KontaktID: that.binding.contactId,
                            Titel: "Datenschutz / Data protection",
                            bExact: true
                        });
                        return that.addDisposablePromise(contactNoteSelectPromise);
                    }
                }).then(function() {
                    if (!that.binding.noteId) {
                        Log.print(Log.l.trace, "ignored if no note id");
                        return WinJS.Promise.timeout(0).then(function() {
                            Application.navigateById("sketch");
                        });
                    } else {
                        //load doc then if noteId is set
                        return loadDoc();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            var clearData = function() {
                Log.call(Log.l.trace, "Privacy.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!that.binding.noteId) {
                        return WinJS.Promise.as();
                    } else {
                        Log.print(Log.l.trace, "use existing noteID=" + that.binding.noteId);
                        var contactNoteUpdatePromise =  Privacy.contactNoteView.update(function() {
                            that.removeDisposablePromise(contactNoteUpdatePromise);
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactNoteView: success!");
                        }, function(errorResponse) {
                            that.removeDisposablePromise(contactNoteUpdatePromise);
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, that.binding.noteId, {
                            Quelltext: null
                        });
                        return that.addDisposablePromise(contactNoteUpdatePromise);
                    }
                }).then(function() {
                    if (!that.binding.noteId) {
                        Log.print(Log.l.trace, "ignored if no note id");
                        return WinJS.Promise.timeout(0).then(function() {
                            Application.navigateById("sketch");
                        });
                    } else {
                        //load doc then if noteId is set
                        return loadDoc();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            that.clearData = clearData;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done(/* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    Application.navigateById("sketch", event);
                    Log.ret(Log.l.trace);
                },
                clickDelete: function(event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    that.clearData();
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
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
                scrollToSignature: function(event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    var signaturefragmenthost = pageElement.querySelector(".signaturefragmenthost");
                    if (signaturefragmenthost) {
                        signaturefragmenthost.scrollIntoView();
                    }
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                scrollContentarea: function () {
                    Log.call(Log.l.trace, "Privacy.Controller.");
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Privacy.Controller.");
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
            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickNew: function () {
                    if (AppData._persistentStates.disableCaptureContactsButton) {
                        return true;
                    } else {
                        if (that.binding.contactId) {
                            return AppBar.busy;
                        } else {
                            return true;
                        }
                    }
                },
                clickForward: function () {
                    return AppBar.busy;
                },
                clickDelete: function () {
                    return !that.binding.noteId;
                },
                scrollToSignature: function () {
                    var signatureRect = pageElement.querySelector(".signaturefragmenthost").getBoundingClientRect();      
                    return signatureRect.top >= 0 &&
                        signatureRect.left >= 0 &&
                        signatureRect.bottom <= window.innerHeight &&
                        signatureRect.right <= window.innerWidth
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

            var contentarea = pageElement.querySelector(".contentarea");
            that._getHammerExcludeRect = function () {
                var parentElement = pageElement.querySelector("#svghost");
                if (parentElement) {
                    var extraOffsetTop = 0;
                    var extraOffsetLeft = 0;
                    var headerhost = document.querySelector("#headerhost");
                    if (headerhost) {
                        extraOffsetTop += headerhost.clientHeight;
                    }
                    if (NavigationBar.orientation === "horizontal") {
                        extraOffsetTop += NavigationBar.navHorzHeight;
                    } else {
                        extraOffsetLeft += NavigationBar.navVertWidth;
                    }
                    if (AppBar.barElement && AppBar.barControl &&
                        AppBar._commandList && AppBar._commandList.length > 0 &&
                        !AppBar.barControl.disabled &&
                        AppBar.barControl.placement === "top") {
                        extraOffsetTop += AppBar.barElement.clientHeight;
                    }
                    var splitViewPaneInline = false;
                    // SplitView element
                    var splitViewRoot = Application.navigator.splitViewRoot;
                    if (splitViewRoot && splitViewRoot.winControl) {
                        var splitViewControl = splitViewRoot.winControl;
                        if (splitViewControl.paneOpened &&
                            splitViewControl.openedDisplayMode === WinJS.UI.SplitView.OpenedDisplayMode.inline) {
                            splitViewPaneInline = true;
                        } else if (!splitViewControl.paneOpened &&
                            splitViewControl.closedDisplayMode === WinJS.UI.SplitView.ClosedDisplayMode.inline) {
                            splitViewPaneInline = true;
                        }
                    }
                    if (splitViewPaneInline) {
                        var splitViewPane = Application.navigator.splitViewPane;
                        if (splitViewPane) {
                            extraOffsetLeft += splitViewPane.clientWidth;
                        }
                    }
                    that._hammerExcludeRect = { left: 0, top: 0, right: 0, bottom: 0 };
                    var scrollTopContent = contentarea.scrollTop;
                    that._hammerExcludeRect = {
                        left: -20000,
                        top: parentElement.offsetTop + extraOffsetTop - scrollTopContent - 20 - 10,
                        right: 20000,
                        bottom: parentElement.offsetTop + extraOffsetTop + parentElement.clientHeight + scrollTopContent + 20 + 100
                    };
                }
                return that._hammerExcludeRect;
            }

            var contentarea = pageElement.querySelector(".contentarea");
            if (contentarea) {
                this.addRemovableEventListener(contentarea, "scroll", this.eventHandlers.scrollContentarea.bind(this));
            }
            // finally, load the data
            that.processAll().then(function() {
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

