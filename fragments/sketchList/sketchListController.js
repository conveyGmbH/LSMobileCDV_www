// controller for page: sketchList
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/sketchList/sketchListService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SketchList", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options) {
            Log.call(Log.l.trace, "SketchList.Controller.");
            Fragments.Controller.apply(this, [fragmentElement, {
                contactId: options.contactId,
                isLocal: options.isLocal,
                curId: 0
            }]);
            var that = this;
            var layout = null;

            this.nextUrl = null;
            this.sketches = null;

            // now do anything...
            var listView = fragmentElement.querySelector("#sketchList.listview");

            var scaleItemsAfterResize = function() {
                Log.call(Log.l.trace, "SketchList.Controller.");
                if (fragmentElement &&
                    fragmentElement.winControl &&
                    fragmentElement.winControl.prevWidth &&
                    fragmentElement.winControl.prevHeight) {
                    var i;
                    // scale SVG images
                    var svglist = listView.querySelectorAll(".list-svg");
                    if (svglist) {
                        for (i = 0; i < svglist.length; i++) {
                            var svg = svglist[i].firstElementChild;
                            if(svg) {
                                WinJS.Utilities.addClass(svg, "list-svg-item");
                                svg.viewBox.baseVal.height = svg.height && svg.height.baseVal && svg.height.baseVal.value;
                                svg.viewBox.baseVal.width = svg.width && svg.width.baseVal && svg.width.baseVal.value;
                                var surface = svg.querySelector("#surface");
                                if (surface) {
                                    surface.setAttribute("fill", "#ffffff");
                                }
                            }
                        }
                    }
                    // scale photo images
                    var imglist = listView.querySelectorAll(".list-img");
                    if (imglist) {
                        for (i = 0; i < imglist.length; i++) {
                            var img = imglist[i].querySelector(".list-img-item");
                            if (img && img.src && img.naturalWidth && img.naturalHeight && img.style) {
                                var offset = (imglist[i].clientHeight -
                                    (imglist[i].clientWidth * img.naturalHeight) / img.naturalWidth) / 2;
                                img.style.marginTop = offset.toString() + "px";
                            }
                        }
                    }
                } else {
                    WinJS.Promise.timeout(50).then(function () {
                        scaleItemsAfterResize();
                    });
                }
                Log.ret(Log.l.trace);
            }


            var resultConverter = function (item, index) {
                Log.call(Log.l.trace, "SketchList.Controller.");
                if (item) {
                    var doc = item;
                    var isSvg = AppData.isSvg(doc.DocGroup, doc.DocFormat);
                    var isImg = AppData.isImg(doc.DocGroup, doc.DocFormat);
                    if (isImg) {
                        var docContent = doc.OvwContentDOCCNT3;
                        if (docContent) {
                            var sub = docContent.search("\r\n\r\n");
                            item.srcImg = "data:image/jpeg;base64," + docContent.substr(sub + 4);
                        } else {
                            item.srcImg = "";
                        }
                        item.srcSvg = "";
                        item.showImg = true;
                        item.showSvg = false;
                    }
                    if (isSvg) {
                        item.srcImg = "";
                        item.srcSvg = doc.OvwContentDOCCNT3;
                        item.showSvg = true;
                        item.showImg = false;
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var eventHandlers = {
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "SketchList.Controller.");
                    //if current sketch is saved successfully, change selection
                    if (AppBar.scope &&
                        AppBar.scope.pageElement &&
                        AppBar.scope.pageElement.winControl &&
                        typeof AppBar.scope.pageElement.winControl.canUnload === "function") {
                        AppBar.scope.pageElement.winControl.canUnload(function (response) {
                            // called asynchronously if ok
                            if (listView && listView.winControl) {
                                var listControl = listView.winControl;
                                if (listControl.selection) {
                                    var selectionCount = listControl.selection.count();
                                    if (selectionCount === 1) {
                                        // Only one item is selected, show the page
                                        listControl.selection.getItems().done(function (items) {
                                            var item = items[0];
                                            if (item.data) {
                                                //load sketch with new recordId
                                                that.binding.curId = item.data.KontaktNotizVIEWID;
                                                AppBar.scope.loadData(that.binding.curId, item.data.DocGroup, item.data.DocFormat);
                                            }
                                        });
                                    }
                                }
                            }
                        }, function (errorResponse) {
                            // error handled in saveData!
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "SketchList.Controller.");
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
                            if (!layout) {
                                layout = new WinJS.UI.GridLayout();
                                layout.orientation = "horizontal";
                                listView.winControl.layout = { type: layout };
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            scaleItemsAfterResize();
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            }
            this.eventHandlers = eventHandlers;

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView,
                    "selectionchanged",
                    this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView,
                    "loadingstatechanged",
                    this.eventHandlers.onLoadingStateChanged.bind(this));
            }

            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "SketchList.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    if (typeof complete === "function") {
                        complete({});
                    }
                });
                Log.ret(Log.l.trace, ret);
                return ret;
            };
            this.saveData = saveData;


            var loadData = function (conId, curId) {
                if (conId) {
                    that.binding.contactId = conId;
                }
                
                Log.call(Log.l.trace, "SketchList.");
                AppData.setErrorMsg(that.binding);

                var ret = new WinJS.Promise.as().then(function () {
                    return SketchList.sketchlistView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "SketchList.sketchlistView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.count = json.d.results.length;
                            that.nextUrl = SketchList.sketchlistView.getNextUrl(json, that.binding.isLocal);
                            var results = json.d.results;
                            results.forEach(function (item, index) {
                                that.resultConverter(item, index);
                            });
                            // Now, we call WinJS.Binding.List to get the bindable list
                            that.sketches = new WinJS.Binding.List(results);
                            //as default, show first sketchnote in sketch page
                            if (listView.winControl) {
                                // add ListView dataSource
                                listView.winControl.itemDataSource = that.sketches.dataSource;
                                if (listView.winControl.selection && results[0]) {
                                    listView.winControl.selection.set(0).then(function() {
                                        //load sketch with new recordId
                                        that.binding.curId = curId ? curId : results[0].KontaktNotizVIEWID;
                                        AppBar.scope.loadDoc(that.binding.curId, results[0].DocGroup, results[0].DocFormat);
                                    });
                                }
                            }
                        }
                        if (AppBar.scope && AppBar.scope.binding) {
                            if (that.binding.count > 1) {
                                AppBar.scope.binding.moreNotes = true;
                            } else {
                                AppBar.scope.binding.moreNotes = false;
                            }
                            if (!AppBar.scope.binding.userHidesList) {
                                AppBar.scope.binding.showList = AppBar.scope.binding.moreNotes;
                            }
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, {
                        KontaktID: that.binding.contactId
                    }, that.binding.isLocal);
                }).then(function () {
                    AppBar.notifyModified = true;
                    AppBar.triggerDisableHandlers();
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData(that.binding.contactId);
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



