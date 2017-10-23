// controller for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/sketchRemote/sketchRemoteService.js" />
/// <reference path="~/www/pages/sketchRemote/svgeditor.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SketchRemote", {
        getClassNameOffline: function (useOffline) {
            return (useOffline ? "field_line field_line_even" : "hide-element");
        },
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "SketchRemote.Controller.");
            // instanciate SVGEditor class
            var svgEditor = new SVGEditor.SVGEditorClass();
            svgEditor.fnCreateDrawDiv();
            svgEditor.fnStartSketch();

            Application.Controller.apply(this, [pageElement, {
                dataSketch: {},
                color: svgEditor.drawcolor && svgEditor.drawcolor[0],
                width: 0
            }, commandList]);
            this.svgEditor = svgEditor;

            var that = this;

            this.dispose = function () {
                if (this.svgEditor) {
                    this.svgEditor.dispose();
                    this.svgEditor = null;
                }
            }

            // define data handling standard methods
            //@Nedra:16.10.2015 recordID is the primary key of relation Kontaktnotiz, in the update and select case
            var getRecordId = function () {
                Log.call(Log.l.trace, "SketchRemote.Controller.");
                var recordId = AppData.getRecordId("KontaktNotiz_Remote");
                Log.ret(Log.l.trace, recordId);
                return recordId;
            }
            this.getRecordId = getRecordId;

            //@Nedra:16.10.2015 in the insert case the recordId will be set
            var setRecordId = function (aRecordId) {
                Log.call(Log.l.trace, "SketchRemote.Controller.", "aRecordId=" + aRecordId);
                AppData.setRecordId("KontaktNotiz_Remote", aRecordId);
                Log.ret(Log.l.trace);
            }
            this.setRecordId = setRecordId;

            var loadData = function () {
                Log.call(Log.l.trace, "SketchRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                var contactId = AppData.getRecordId("Kontakt_Remote");
                var ret = new WinJS.Promise.as().then(function () {
                    var restriction;
                    var recordId = that.getRecordId();
                    if (!recordId) {
                        restriction = { KontaktID: contactId };
                    } else {
                        restriction = null;
                    }
                    if (recordId || restriction) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        return SketchRemote.sketchView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "sketchView: success!");
                            if (json && json.d) {
                                if (restriction) {
                                    if (json.d.results && json.d.results.length > 0) {
                                        that.binding.dataSketch = json.d.results[0];
                                    } else {
                                        that.binding.dataSketch = {};
                                    }
                                } else {
                                    that.binding.dataSketch = json.d;
                                }
                                that.setRecordId(that.binding.dataSketch.KontaktNotizVIEWID);
                                if (that.binding.dataSketch.KontaktNotizVIEWID ||
                                    AppData._contactData.CreatorSiteID === AppData.appSettings.odata.dbSiteId) {
                                    if (typeof that.binding.dataSketch.Quelltext !== "undefined" &&
                                        that.binding.dataSketch.Quelltext) {
                                        Log.print(Log.l.trace,
                                            "SVG Element: " + that.binding.dataSketch.Quelltext.substr(0, 100) + "...");
                                    }
                                    WinJS.Promise.timeout(0).then(function() {
                                        that.svgEditor.fnLoadSVG(that.binding.dataSketch.Quelltext);
                                    });
                                } else {
                                    WinJS.Promise.timeout(0).then(function() {
                                        Application.navigateById("start");
                                    });
                                }
                            }
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, recordId, restriction);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById("start", event);
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
                    if (that.binding.generalData.contactId) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickForward: function () {
                    // never disable!
                    return false;
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

