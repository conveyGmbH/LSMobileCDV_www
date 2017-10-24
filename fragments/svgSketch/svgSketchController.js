// controller for page: svgSketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/svgSketch/svgSketchService.js" />
/// <reference path="~/www/fragments/svgSketch/svgeditor.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SvgSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options, commandList) {
            Log.call(Log.l.trace, "SvgSketch.Controller.");

            // instanciate SVGEditor class
            var svgEditor = new SVGEditor.SVGEditorClass();
            svgEditor.registerTouchEvents();
            svgEditor.fnCreateDrawDiv();
            svgEditor.fnStartSketch();

            this.svgEditor = svgEditor;

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: options.noteId,
                
                dataSketch: {},
                color: svgEditor.drawcolor && svgEditor.drawcolor[0],
                width: 0
            }, commandList]);

            var that = this;

            this.dispose = function () {
                if (this.svgEditor) {
                    this.svgEditor.dispose();
                    this.svgEditor = null;
                }
            }

            // check modify state
            // modified==true when startDrag() in svg.js is called!
            var isModified = function () {
                Log.call(Log.l.trace, "svgSketchController.");
                Log.ret(Log.l.trace, that.svgEditor.modified);
                return that.svgEditor.modified;
            }
            this.isModified = isModified;

            var resultConverter = function (item) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                if (item) {
                    item.ExecAppTypeID = 15;
                    item.Quelltext = item.DocContentDOCCNT1;
                    item.DocContentDOCCNT1 = null;
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var showSvgAfterResize = function () {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var fragmentControl = fragmentElement.winControl;
                if (fragmentControl && fragmentControl.updateLayout) {
                    fragmentControl.prevWidth = 0;
                    fragmentControl.prevHeight = 0;
                    var promise = fragmentControl.updateLayout.call(fragmentControl, fragmentElement) || WinJS.Promise.as();
                    promise.then(function () {
                        that.svgEditor.fnLoadSVG(that.binding.dataSketch.Quelltext);
                    });
                }
                Log.ret(Log.l.trace);
            }



            var loadSketch = function () {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret = null;
                /*UNADAPTED
                var restriction;
                if (!recordId) {
                    restriction = { KontaktID: contactId };
                } else {
                    restriction = null;
                }
                if (recordId || restriction) {
                    //load of format relation record data
                    Log.print(Log.l.trace, "calling select contactView...");
                    return Sketch.sketchView.select(function (json) {
                        AppData.setErrorMsg(that.binding);
                        Log.print(Log.l.trace, "contactView: success!");
                        if (json && json.d) {
                            if (restriction) {
                                if (json.d.results && json.d.results.length > 0) {
                                    that.binding.dataSketch = json.d.results[0];
                                    that.setRecordId(that.binding.dataSketch.KontaktNotizVIEWID);
                                } else {
                                    that.binding.dataSketch = {};
                                }
                            } else {
                                that.binding.dataSketch = json.d;
                            }
                            if (typeof that.binding.dataSketch.Quelltext !== "undefined" &&
                                that.binding.dataSketch.Quelltext) {
                                Log.print(Log.l.trace, "SVG Element: " + that.binding.dataSketch.Quelltext.substr(0,100) + "...");
                            }
                            WinJS.Promise.timeout(0).then(function () {
                                that.svgEditor.fnLoadSVG(that.binding.dataSketch.Quelltext);
                            });
                        }
                    }, function (errorResponse) {
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, recordId, restriction);
                } else {
                    return WinJS.Promise.as();
                }*/
                if (that.binding.noteId !== null) {
                    ret = SvgSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "SvgSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            if (typeof that.binding.dataSketch.Quelltext !== "undefined" &&
                                that.binding.dataSketch.Quelltext) {
                                Log.print(Log.l.trace,
                                    "SVG Element: " +
                                    that.binding.dataSketch.Quelltext.substr(0, 100) +
                                    "...");
                            }
                            showSvgAfterResize();
                        }
                    },
                    function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    that.binding.noteId);
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadSketch = loadSketch;

            var loadData = function (noteId) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                AppData.setErrorMsg(that.binding);
                if (noteId) {
                    that.binding.noteId = noteId;
                }
                var ret = new WinJS.Promise.as().then(function () {
                    /*UNADAPTED
                    if (!contactId) {
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
                                contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", contactId);
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
                        Log.print(Log.l.trace, "use existing contactID=" + contactId);
                        return WinJS.Promise.as();
                    }*/
                }).then(loadSketch());
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret;
                AppData.setErrorMsg(that.binding);
                var dataSketch = that.binding.dataSketch;
                if (dataSketch.Quelltext && AppBar.modified) {
                    ret = new WinJS.Promise.as().then(function() {
                        that.svgEditor.fnSaveSVG(function(quelltext) {
                            dataSketch.Quelltext = quelltext;
                            var doret = null;
                            if (that.binding.noteId) {
                                doret = SvgSketch.sketchView.update(function(response) {
                                        // called asynchronously if ok
                                        Log.print(Log.l.trace, "sketchData update: success!");
                                        that.svgEditor.modified = false;
                                        complete(response);
                                    },
                                    function(errorResponse) {
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        error(errorResponse);
                                    },
                                    that.binding.noteId,
                                    dataSketch);
                            }
                            return doret;
                            /*UNADAPTED
                            else {
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
                        });
                    });
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        complete(dataSketch);
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            var eventHandlers = {
                clickUndo: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.fnUndoSVG(event);
                    Log.ret(Log.l.trace);
                },
                clickRedo: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.fnRedoSVG(event);
                    Log.ret(Log.l.trace);
                },
                clickDelete: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.fnNewSVG(event);
                    Log.ret(Log.l.trace);
                },
                clickShapes: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.toggleToolbox("shapesToolbar");
                    AppBar.scope.binding.showList = false;
                    Log.ret(Log.l.trace);
                },
                clickColors: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.toggleToolbox("colorsToolbar");
                    AppBar.scope.binding.showList = false;
                    Log.ret(Log.l.trace);
                },
                clickWidths: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    that.svgEditor.toggleToolbox("widthsToolbar");
                    AppBar.scope.binding.showList = false;
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for tools
                clickTool: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    var tool = event.currentTarget;
                    if (tool && tool.id) {
                        if (tool.id.length > 4) {
                            var toolNo = tool.id.substr(4);
                            Log.print(Log.l.trace, "selected tool:" + tool.id + " with no=" + toolNo);
                            that.svgEditor.fnSetShape(parseInt(toolNo));
                        } //else {
                        that.svgEditor.hideToolbox("shapesToolbar");
                        that.svgEditor.registerTouchEvents();
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for colors
                clickColor: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    var color = event.currentTarget;
                    if (color && color.id) {
                        if (color.id.length > 10) {
                            var colorNo = color.id.substr(10); // color tags
                            var nColorNo = parseInt(colorNo);
                            that.binding.color = that.svgEditor.drawcolor[nColorNo];
                            Log.print(Log.l.trace, "selected color:" + color.id + " with no=" + colorNo + " color=" + that.binding.color);
                            that.svgEditor.fnSetColor(nColorNo);
                        } //else {
                        that.svgEditor.hideToolbox("colorsToolbar");
                        that.svgEditor.registerTouchEvents();
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                clickWidth: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.", "selected width=" + that.binding.width);
                    that.svgEditor.hideToolbox("widthsToolbar");
                    that.svgEditor.registerTouchEvents();
                    Log.ret(Log.l.trace);
                }
            }
            this.eventHandlers = eventHandlers;

            var disableHandlers = {
                clickUndo: function () {
                    if (that.svgEditor && that.svgEditor.fnCanUndo()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRedo: function () {
                    if (that.svgEditor && that.svgEditor.fnCanRedo()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickDelete: function () {
                    if (that.svgEditor && that.svgEditor.fnCanNew()) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
            this.disableHandlers = disableHandlers;


            // finally, load the data
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



