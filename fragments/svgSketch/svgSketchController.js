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
            Log.call(Log.l.trace, "SvgSketch.Controller.", "noteId=" + (options && options.noteId));

            // instanciate SVGEditor class
            var svgEditor = new SVGEditor.SVGEditorClass();
            svgEditor.fnCreateDrawDiv();
            svgEditor.fnStartSketch();

            this.svgEditor = svgEditor;
            if (options && options.isLocal) {
                this.svgEditor.registerTouchEvents();
            }

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: null,
                isLocal: options.isLocal,
                dataSketch: {},
                color: svgEditor.drawcolor && svgEditor.drawcolor[0],
                width: 0
            }, commandList]);

            var that = this;

            var getDocData = function () {
                return that.binding.dataSketch && that.binding.dataSketch.Quelltext;
            }
            var hasDoc = function () {
                return (getDocData() && typeof getDocData() === "string");
            }
            this.hasDoc = hasDoc;

            this.dispose = function () {
                that.removeDoc();
                if (that.svgEditor) {
                    that.svgEditor.dispose();
                    that.svgEditor = null;
                }
            }

            // check modify state
            // modified==true when startDrag() in svg.js is called!
            var isModified = function () {
                Log.call(Log.l.trace, "SvgSketchController.");
                Log.ret(Log.l.trace, that.svgEditor.modified);
                return that.svgEditor.modified;
            }
            this.isModified = isModified;

            var resultConverter = function (item) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                if (item) {
                    if (item.DocGroup === AppData.DocGroup.Text && item.DocFormat === 75) {
                        item.ExecAppTypeID = 15;
                        item.Quelltext = item.DocContentDOCCNT1;
                    } else {
                        item.Quelltext = "";
                    }
                    item.DocContentDOCCNT1 = "";
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
                        that.svgEditor.fnLoadSVG(getDocData());
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                        var docContainer = fragmentElement.querySelector(".doc-container");
                        if (docContainer) {
                            var sketchElement = docContainer.lastElementChild || docContainer.lastChild;
                            if (sketchElement) {
                                //var oldElement;
                                var animationDistanceX = fragmentElement.clientWidth / 4;
                                var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                if (sketchElement.style) {
                                    sketchElement.style.visibility = "";
                                }
                                WinJS.UI.Animation.enterContent(sketchElement, animationOptions).then(function () {
                                    if (sketchElement.style) {
                                        sketchElement.style.display = "";
                                        sketchElement.style.position = "";
                                    }
                                });
                            }
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            
            var loadData = function (noteId) {
                var ret;
                Log.call(Log.l.trace, "SvgSketch.Controller.", "noteId=" + noteId);
                AppData.setErrorMsg(that.binding);
                var docContainer = fragmentElement.querySelector(".doc-container");
                if (docContainer) {
                    var sketchElement = docContainer.lastElementChild || docContainer.lastChild;
                    if (sketchElement) {
                        if (sketchElement.style) {
                            sketchElement.style.visibility = "hidden";
                            sketchElement.style.display = "block";
                            sketchElement.style.position = "absolute";
                        }
                    }
                }
                if (noteId) {
                    ret = SvgSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "SvgSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.noteId = json.d.KontaktNotizVIEWID;
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            if (hasDoc()) {
                                Log.print(Log.l.trace,
                                    "SVG Element: " +
                                    getDocData().substr(0, 100) +
                                    "...");
                                WinJS.Promise.timeout(0).then(function () {
                                    // reload trigger-generated SVG
                                    showSvgAfterResize();
                                });
                            }
                        }
                    },  function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    noteId,
                    that.binding.isLocal);
                } else if (that.binding.isLocal) {
                    AppBar.busy = true;
                    that.binding.noteId = 0;
                    // insert new SVG note first - but only if isLocal!
                    that.svgEditor.fnNewSVG();
                    if (options && options.isLocal) {
                        that.svgEditor.registerTouchEvents();
                    }
                    ret = that.saveData(function (response) {
                        // called asynchronously if ok
                        AppBar.busy = false;
                    },
                    function(errorResponse) {
                        AppData.setErrorMsg(that.binding, errorResponse);
                        AppBar.busy = false;
                    });
                } else {
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret;
                AppData.setErrorMsg(that.binding);
                var dataSketch = that.binding.dataSketch;
                if (dataSketch && (AppBar.modified || !that.binding.noteId) && that.binding.isLocal) {
                    ret = new WinJS.Promise.as().then(function () {
                        that.svgEditor.fnSaveSVG(function(quelltext) {
                            dataSketch.Quelltext = quelltext;
                            var doret;
                            if (that.binding.noteId) {
                                doret = SvgSketch.sketchView.update(function(response) {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "sketchData update: success!");
                                    that.svgEditor.modified = false;
                                    if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                        AppBar.scope.loadList(that.binding.noteId);
                                    }
                                    if (typeof complete === "function") {
                                        complete(response);
                                    }
                                },
                                function(errorResponse) {
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    if (typeof error === "function") {
                                        error(errorResponse);
                                    }
                                },
                                that.binding.noteId,
                                dataSketch,
                                that.binding.isLocal);
                            } else {
                                //insert if a primary key is not available (noteId === null)
                                dataSketch.KontaktID = AppData.getRecordId("Kontakt");
                                // SVG note
                                dataSketch.ExecAppTypeID = 15; 
                                dataSketch.DocGroup = 3;
                                dataSketch.DocFormat = 75;
                                dataSketch.OvwEdge = 100;
                                dataSketch.DocExt = "svg";
                                var svgdiv = fragmentElement.querySelector(".svgdiv");
                                if (svgdiv) {
                                    var svg = svgdiv.firstElementChild;
                                    if (svg) {
                                        dataSketch.Width = svg.height && svg.height.baseVal && svg.height.baseVal.value;
                                        dataSketch.Height = svg.width && svg.width.baseVal && svg.width.baseVal.value;
                                    }
                                }

                                if (!dataSketch.KontaktID) {
                                    doret = new WinJS.Promise.as().then(function () {
                                        var errorResponse = {
                                            status: -1,
                                            statusText: "missing recordId for table Kontakt"
                                        }
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        if (typeof error === "function") {
                                            error(errorResponse);
                                        }
                                    });
                                } else {
                                    doret = SvgSketch.sketchView.insert(function (json) {
                                        var doret2;
                                        // this callback will be called asynchronously
                                        // when the response is available
                                        Log.print(Log.l.trace, "sketchData insert: success!");
                                        // contactData returns object already parsed from json file in response
                                        if (json && json.d) {
                                            that.binding.dataSketch = json.d;
                                            that.binding.noteId = json.d.KontaktNotizVIEWID;
                                            doret2 = WinJS.Promise.timeout(0).then(function () {
                                                // reload list
                                                if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                                    AppBar.scope.loadList(that.binding.noteId);
                                                }
                                            });
                                        } else {
                                            doret2 = WinJS.Promise.as();
                                        }
                                        if (typeof complete === "function") {
                                            complete(json);
                                        }
                                        return doret2;
                                    }, function (errorResponse) {
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        if (typeof error === "function") {
                                            error(errorResponse);
                                        }
                                    },
                                    dataSketch,
                                    that.binding.isLocal);
                                }
                            }
                            return doret;
                        });
                    });
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete(that.binding.dataSketch);
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            var deleteData = function() {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret = WinJS.Promise.as().then(function () {
                    if (options && options.isLocal) {
                        that.svgEditor.modified = false;
                        Log.print(Log.l.trace, "clickDelete: user choice OK");
                        return SvgSketch.sketchView.deleteRecord(function(response) {
                            // called asynchronously if ok
                            Log.print(Log.l.trace, "svgSketchData delete: success!");
                            //reload sketchlist
                            if (AppBar.scope && typeof AppBar.scope.loadData === "function") {
                                AppBar.scope.loadData();
                            }
                        },
                        function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        },
                        that.binding.noteId,
                        that.binding.isLocal);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.deleteData = deleteData;

            var eventHandlers = {
                clickUndo: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    that.svgEditor.fnUndoSVG(event);
                    Log.ret(Log.l.trace);
                },
                clickRedo: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    that.svgEditor.fnRedoSVG(event);
                    Log.ret(Log.l.trace);
                },
                clickShapes: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    that.svgEditor.toggleToolbox("shapesToolbar");
                    Log.ret(Log.l.trace);
                },
                clickColors: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    that.svgEditor.toggleToolbox("colorsToolbar");
                    Log.ret(Log.l.trace);
                },
                clickWidths: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    that.svgEditor.toggleToolbox("widthsToolbar");
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for tools
                clickTool: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    var tool = event.currentTarget;
                    if (tool && tool.id) {
                        if (tool.id.length > 4) {
                            var toolNo = tool.id.substr(4);
                            Log.print(Log.l.trace, "selected tool:" + tool.id + " with no=" + toolNo);
                            that.svgEditor.fnSetShape(parseInt(toolNo));
                        } //else {
                        that.svgEditor.hideToolbox("shapesToolbar");
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for colors
                clickColor: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
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
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                clickWidth: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.", "selected width=" + that.binding.width);
                    that.svgEditor.hideToolbox("widthsToolbar");
                    if (options && options.isLocal) {
                        that.svgEditor.registerTouchEvents();
                    }
                    Log.ret(Log.l.trace);
                }
            }
            this.eventHandlers = eventHandlers;

            var disableHandlers = {
                clickUndo: function () {
                    if (options && options.isLocal && that.svgEditor && that.svgEditor.fnCanUndo()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRedo: function () {
                    if (options && options.isLocal && that.svgEditor && that.svgEditor.fnCanRedo()) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
            this.disableHandlers = disableHandlers;


            var removeDoc = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                that.binding.noteId = null;
                that.binding.dataSketch = {};
                that.svgEditor.fnNewSVG();
                that.svgEditor.modified = false;
                if (options && options.isLocal) {
                    that.svgEditor.unregisterTouchEvents();
                }
                Log.ret(Log.l.trace);
            }
            this.removeDoc = removeDoc;

            // finally, load the data
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData(options && options.noteId);
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



