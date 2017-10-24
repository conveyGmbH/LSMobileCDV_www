// controller for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/sketch/sketchService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Sketch", {
        getClassNameOffline: function (useOffline) {
            return (useOffline ? "field_line field_line_even" : "hide-element");
        },
        
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Sketch.Controller.");
            var docViewer = null;
            var that = this;
            
            Application.Controller.apply(this, [pageElement, {
                showSvg: false,
                showPhoto: false,
                showList: false,
                moreNotes: false,
                userHidesList: false
            }, commandList]);

            this.contactId = AppData.getRecordId("Kontakt");
            this.pageElement = pageElement;

            var getSvgFragmentController = function () {
                var ret;
                Log.call(Log.l.trace, "Sketch.Controller.");
                ret = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("svgSketch"));
                if (ret) {
                    ret = ret.controller;
                }
                Log.ret(Log.l.trace);
                return ret;
            }

            var getDocViewer = function (docGroup, docFormat) {
                Log.call(Log.l.trace, "Sketch.Controller.", "docGroup=" + docGroup + " docFormat=" + docFormat);
                docViewer = null;
                if (AppData.isSvg(docGroup, docFormat)) {
                    that.binding.showSvg = true;
                    that.binding.showPhoto = false;
                    docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("svgSketch"));
                } else if (AppData.isImg(docGroup, docFormat)) {
                    that.binding.showSvg = false;
                    that.binding.showPhoto = true;
                    docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("imgSketch"));
                }
                Log.ret(Log.l.trace);
                return docViewer;
            }
            that.docViewer = {
                get: function() {
                    return docViewer;
                }
            }

            var loadDoc = function (noteId, docGroup, docFormat) {
                var ret;
                var parentElement;
                Log.call(Log.l.trace, "Sketch.Controller.", "noteId=" + noteId + " docGroup=" + docGroup + " docFormat=" + docFormat);
                getDocViewer(docGroup, docFormat);
                if (docViewer && docViewer.controller) {
                    ret = docViewer.controller.loadData(noteId);
                } else if (AppData.isSvg(docGroup, docFormat)) {
                    that.binding.showSvg = true;
                    that.binding.showPhoto = false;
                    parentElement = pageElement.querySelector("#svghost");
                    if (parentElement) {
                        ret = Application.loadFragmentById(parentElement, "svgSketch", { noteId: noteId });
                    } else {
                        ret = WinJS.Promise.as();
                    }
                } else if (AppData.isImg(docGroup, docFormat)) {
                    that.binding.showSvg = false;
                    that.binding.showPhoto = true;
                    parentElement = pageElement.querySelector("#imghost");
                    if (parentElement) {
                        ret = Application.loadFragmentById(parentElement, "imgSketch", { noteId: noteId });
                    } else {
                        ret = WinJS.Promise.as();
                    }
                } else {
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            }

            // check modify state
            // modified==true when startDrag() in svg.js is called!
            var isModified = function () {
                Log.call(Log.l.trace, "svgSketchController.");
                var ret;
                var svgFragmentController = getSvgFragmentController();
                if (svgFragmentController) {
                    ret = svgFragmentController.isModified();
                } else ret = false;
                Log.ret(Log.l.trace);
                return ret;
            }
            this.isModified = isModified;


            var loadData = function (noteId, docGroup, docFormat) {
                Log.call(Log.l.trace, "Sketch.Controller.", "noteId=" + noteId + " docGroup=" + docGroup + " docFormat=" + docFormat);
                AppData.setErrorMsg(that.binding);
                that.contactId = AppData.getRecordId("Kontakt");
                var ret = new WinJS.Promise.as().then(function () {
                    /*if (!that.contactId) {
                        var newContact = {
                            HostName: (window.device && window.device.uuid),
                            MitarbeiterID: AppData.getRecordId("Mitarbeiter"),
                            VeranstaltungID: AppData.getRecordId("Veranstaltung"),
                            Nachbearbeitet: 1
                        };
                        Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                        AppData.setErrorMsg(that.binding);
                        return Sketch.contactView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "contactView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", that.contactId);
                                AppData.getUserData();
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newContact);
                    } else {
                        Log.print(Log.l.trace, "use existing that.contactID=" + that.contactId);
                        return WinJS.Promise.as();
                    }
                }).then(function () {*/
                    //load list first -> noteId, showSvg, showPhoto, moreNotes set
                    if (!noteId) {
                        var sketchListFragmentControl = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("sketchList"));
                        if (sketchListFragmentControl && sketchListFragmentControl.controller) {
                            return sketchListFragmentControl.controller.loadData(that.contactId);
                        } else {
                            var parentElement = pageElement.querySelector("#listhost");
                            if (parentElement) {
                                return Application.loadFragmentById(parentElement,"sketchList",{ contactId: that.contactId });
                            } else {
                                return WinJS.Promise.as();
                            }
                        }
                    } else {
                        return loadDoc(noteId, docGroup, docFormat);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;
            
            // save data
            //var saveData = function (complete, error) {
            //if (that.noteId !== 0) {
                    /*else {
                                //insert if a primary key is not available (getRecordId() == null)
                                dataSketch.KontaktID = AppData.getRecordId("Kontakt");
                                dataSketch.ExecAppTypeID = 15; // SVG note
                                if (!dataSketch.KontaktID) {
                                    return new WinJS.Promise.as().then(function () {
                                        var errorResponse = {
                                            status: -1,
                                            statusText: "missing recordId for table Kontakt"
                                        }
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        error(errorResponse);
                                    });
                                } else {
                                    return Sketch.sketchView.insert(function (json) {
                                        // this callback will be called asynchronously
                                        // when the response is available
                                        Log.print(Log.l.trace, "sketchData insert: success!");
                                        // contactData returns object already parsed from json file in response
                                        if (json && json.d) {
                                            that.binding.dataSketch = json.d;
                                            setRecordId(that.binding.dataSketch.KontaktNotizVIEWID);
                                            if (typeof that.binding.dataSketch.Quelltext !== "undefined" &&
                                                that.binding.dataSketch.Quelltext) {
                                                Log.print(Log.l.trace, "SVG Element: " + that.binding.dataSketch.Quelltext.substr(0, 100) + "...");
                                            }
                                            WinJS.Promise.timeout(0).then(function () {
                                                that.svgEditor.fnLoadSVG(that.binding.dataSketch.Quelltext);
                                            });
                                        }
                                        complete(json);
                                    }, function (errorResponse) {
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        error(errorResponse);
                                    }, dataSketch);
                                }
                            }*/

            // define handlers
            this.eventHandlers = {
                clickBack: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done(/* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickGotoPublish: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById("publish", event);
                    Log.ret(Log.l.trace);
                },
                clickNew: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickShowList: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.binding.showList = !that.binding.showList;
                    that.binding.userHidesList = !that.binding.showList;
                    Application.navigator._resized();
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
                },
                clickShowList: function () {
                    if (that.binding.moreNotes) {
                        return false;
                    } else {
                        return true;
                    }
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

