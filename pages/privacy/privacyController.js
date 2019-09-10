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
                    if (that.binding.contactId) {
                        return AppBar.busy;
                    } else {
                        return true;
                    }
                },
                clickForward: function () {
                    return AppBar.busy;
                }
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

