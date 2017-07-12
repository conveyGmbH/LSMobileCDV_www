// controller for page: contactRemote
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/contactRemote/contactRemoteService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ContactRemote", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "ContactRemote.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataContact: getEmptyDefaultValue(ContactRemote.contactView.defaultValue),
                rinfContact: {},
                InitAnredeItem: { InitAnredeID: 0, TITLE: "" },
                InitLandItem: { InitLandID: 0, TITLE: "" },
                showModified: false
            }]);

            var that = this;
            
            var setDataContact = function(newDataContact) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataContact = newDataContact;
                if (that.binding.dataContact.Erfassungsdatum === that.binding.dataContact.ModifiedTS) {
                    that.binding.showModified = false;
                } else {
                    that.binding.showModified = true;
                }
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            }
            this.setDataContact = setDataContact;

            var setInitLandItem = function(newInitLandItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitLandItem = newInitLandItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setInitLandItem = setInitLandItem;

            var setInitAnredeItem = function (newInitAnredeItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitAnredeItem = newInitAnredeItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setInitAnredeItem = setInitAnredeItem;

            var getRecordId = function () {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                var recordId = AppData.generalData.getRecordId("ContactRemote");
                if (!recordId) {
                    that.setDataContact(getEmptyDefaultValue(ContactRemote.contactView.defaultValue));
                }
                Log.ret(Log.l.trace, recordId);
                return recordId;
            }
            this.getRecordId = getRecordId;

            var setRecordId = function (recordId) {
                Log.call(Log.l.trace, "ContactRemote.Controller.", "recordId=" + recordId);
                AppData.generalData.setRecordId("ContactRemote", recordId);
                if (!recordId) {
                    that.setDataContact(getEmptyDefaultValue(ContactRemote.contactView.defaultValue));
                }
                Log.ret(Log.l.trace);
            }
            this.setRecordId = setRecordId;

            var checkDownloadProgress = function () {
                if (AppBar.busy) {
                    if (AppRepl.replicator &&
                        AppRepl.replicator.state === "running") {
                        WinJS.Promise.timeout(500).then(function() {
                            that.checkDownloadProgress();
                        });
                    } else {
                        var restriction = {
                            CreatorSiteID: that.binding.rinfContact.CreatorSiteID,
                            CreatorRecID: that.binding.rinfContact.CreatorRecID
                        }
                        ContactRemote.rinfContactView.select(function (json) {
                            if (json && json.d && json.d.results && json.d.results.length > 0) {
                                var row = json.d.results[0];
                                Log.print(Log.l.trace, "rinfContactView: success! RINFKontaktID=" + row.RINFKontaktVIEWID);
                                AppData.generalData.setRecordId("Kontakt", row.RINFKontaktVIEWID);
                                Application.navigateById("contact", event);
                            } else {
                                var err = { status: 0, statusText: "no record selected" };
                                AppData.setErrorMsg(that.binding, err);
                            }
                            AppBar.busy = false;
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        }, restriction);
                    }
                }
            }
            this.checkDownloadProgress = checkDownloadProgress;

            var downloadRemoteContact = function () {
                if (!AppRepl.replicator) {
                    Log.print(Log.l.error, "contactDownloadView: no replicator!");
                    return WinJS.Promise.as();
                }
                if (AppRepl.replicator.state === "running") {
                    Log.print(Log.l.info, "contactDownloadView: replicator state=" + AppRepl.replicator.state + " - try later!");
                    return WinJS.Promise.timeout(250).then(function() {
                        return that.downloadRemoteContact();
                    });
                }
                AppRepl.replicator._state = "running";
                AppRepl.replicator._fetchRequests = [];
                AppRepl.replicator._fetchRequestsDone = -1;
                AppRepl.replicator._fetchRequestsCurrent = 0;
                AppBar.busy = true;
                checkDownloadProgress();
                return ContactRemote.contactDownloadView.select(function (obj) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "contactDownloadView: success!");
                    if (obj && obj.d) {
                        if (obj.d.results && obj.d.results.length > 0) {
                            Log.print(Log.l.info, "contactDownloadView: returned results.length=" + obj.d.results.length);
                            AppRepl.replicator.createReplicationDataRestriction(obj.d.results);
                            AppRepl.replicator.selectNextRemoteReplicationFlowSpec();
                        } else {
                            Log.print(Log.l.error, "contactDownloadView: returned results.length=0");
                            AppRepl.replicator._fetchRequestsDone = 0;
                        }
                    } else {
                        Log.print(Log.l.error, "contactDownloadView: returned no data");
                        AppRepl.replicator._fetchRequestsDone = 0;
                    }
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                    AppRepl.replicator._fetchRequestsDone = 0;
                }, that.getRecordId());
            }
            this.downloadRemoteContact = downloadRemoteContact;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickEdit: function(event){
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    if (that.binding.rinfContact.RINFKontaktVIEWID === that.getRecordId() &&
                        that.binding.rinfContact.CreatorSiteID === AppData._persistentStates.odata.dbSiteId) {
                        AppData.generalData.setRecordId("Kontakt", that.binding.rinfContact.CreatorRecID);
                        Application.navigateById("contact", event);
                    } else {
                        var restriction = {
                            CreatorSiteID: that.binding.rinfContact.CreatorSiteID,
                            CreatorRecID: that.binding.rinfContact.CreatorRecID
                        }
                        ContactRemote.rinfContactView.select(function (json) {
                            if (json && json.d && json.d.results && json.d.results.length > 0) {
                                var row = json.d.results[0];
                                Log.print(Log.l.trace, "rinfContactView: success!");
                                AppData.generalData.setRecordId("Kontakt", row.RINFKontaktVIEWID);
                                Application.navigateById("contact", event);
                            } else {
                                that.downloadRemoteContact();
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, restriction);
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function() {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickEdit: function() {
                    //if (that.binding.rinfContact.RINFKontaktVIEWID === getRecordId() &&
                    //    that.binding.rinfContact.CreatorSiteID === AppData._persistentStates.odata.dbSiteId) {
                    //    return false;
                    //} else {
                    //    return true;
                    //}
                    return AppBar.busy;
                }
            }

            var loadInitSelection = function () {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                if (typeof that.binding.dataContact.KontaktVIEWID !== "undefined") {
                    var map, results, curIndex;
                    if (typeof that.binding.dataContact.INITAnredeID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initAnredeData: Id=" + that.binding.dataContact.INITAnredeID + "...");
                        map = AppData.initAnredeView.getMap();
                        results = AppData.initAnredeView.getResults();
                        if (map && results) {
                            curIndex = map[that.binding.dataContact.INITAnredeID];
                            if (typeof curIndex !== "undefined") {
                                that.setInitAnredeItem(results[curIndex]);
                            }
                        }
                    }
                    if (typeof that.binding.dataContact.INITLandID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initLandData: Id=" + that.binding.dataContact.INITLandID + "...");
                        map = AppData.initLandView.getMap();
                        results = AppData.initLandView.getResults();
                        if (map && results) {
                            curIndex = map[that.binding.dataContact.INITLandID];
                            if (typeof curIndex !== "undefined") {
                                that.setInitLandItem(results[curIndex]);
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return WinJS.Promise.as();
            }
            this.loadInitSelection = loadInitSelection;

            var loadData = function () {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initAnredeView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initAnredeData...");
                        //@nedra:25.09.2015: load the list of INITAnrede for Combobox
                        return AppData.initAnredeView.select(function (json) {
                            Log.print(Log.l.trace, "initAnredeView: success!");
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        return AppData.initLandView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var recordId = getRecordId();
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return ContactRemote.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d) {
                                // now always deny edit!
                                json.d.Flag_NoEdit = 1;
                                that.setDataContact(json.d);
                                loadInitSelection();
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var recordId = getRecordId();
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return ContactRemote.rinfContactView.selectById(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "rinfContactView: success!");
                            if (json && json.d) {
                                // now always deny edit!
                                that.binding.rinfContact = json.d;
                                AppBar.triggerDisableHandlers();
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    AppBar.notifyModified = true;
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();


