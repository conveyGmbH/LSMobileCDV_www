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
            var that = this;

            var addPageData = {
                showSvg: false,
                showPhoto: false,
                showAudio: false,
                showList: false,
                moreNotes: false,
                userHidesList: false,
                contactId: AppData.getRecordId("Kontakt")
            };
            // load amr lib....
            /*if (typeof device === "object" &&
                device.platform === "Android") {
                var amrnbjs = "../../lib/amrnb/scripts/amrnb.js";
                addPageData.scripts = [amrnbjs];
            }*/
            Application.Controller.apply(this, [pageElement, addPageData, commandList]);

            this.pageElement = pageElement;
            this.docViewer = null;

            var setNotesCount = function (count) {
                Log.call(Log.l.trace, "Sketch.Controller.", "count=" + count);
                if (count > 1) {
                    that.binding.moreNotes = true;
                } else if (count > 0) {
                    that.binding.moreNotes = false;
                } else {
                    that.binding.moreNotes = false;
                    that.binding.showSvg = false;
                    that.binding.showPhoto = false;
                    that.binding.showAudio = false;
                }
                if (!that.binding.userHidesList) {
                    if (that.binding.showList !== that.binding.moreNotes) {
                        that.binding.showList = that.binding.moreNotes;
                        WinJS.Promise.timeout(50).then(function() {
                            var pageControl = pageElement.winControl;
                            if (pageControl && pageControl.updateLayout) {
                                pageControl.prevWidth = 0;
                                pageControl.prevHeight = 0;
                                pageControl.updateLayout.call(pageControl, pageElement);
                            }
                        });
                    }
                }
                AppBar.replaceCommands([
                    { id: 'clickShowList', label: getResourceText('sketch.showList'), tooltip: getResourceText('sketch.showList'), section: 'primary', svg: that.binding.showList ? 'document_height' : 'elements3' }
                ]);

                Log.ret(Log.l.trace);
            }
            that.setNotesCount = setNotesCount;

            var getDocViewer = function (docGroup, docFormat) {
                var docViewer;
                Log.call(Log.l.trace, "Sketch.Controller.", "docGroup=" + docGroup + " docFormat=" + docFormat);
                if (AppData.isSvg(docGroup, docFormat)) {
                    that.binding.showSvg = true;
                    that.binding.showPhoto = false;
                    that.binding.showAudio = false;
                    docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("svgSketch"));
                } else if (AppData.isImg(docGroup, docFormat)) {
                    that.binding.showPhoto = true;
                    that.binding.showSvg = false;
                    that.binding.showAudio = false;
                    docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("imgSketch"));
                } else if (AppData.isAudio(docGroup, docFormat)) {
                    that.binding.showAudio = true;
                    that.binding.showSvg = false;
                    that.binding.showPhoto = false;
                    docViewer = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("wavSketch"));
                } else {
                    docViewer = null;
                }
                Log.ret(Log.l.trace);
                return docViewer;
            }

            var prevNoteId;
            var inLoadDoc = false;
            var loadDoc = function (noteId, docGroup, docFormat) {
                var ret;
                var parentElement;
                Log.call(Log.l.trace, "Sketch.Controller.", "noteId=" + noteId + " docGroup=" + docGroup + " docFormat=" + docFormat);
                // prevent recursive calls here!
                if (inLoadDoc) {
                    if (noteId === prevNoteId) {
                        Log.print(Log.l.trace, "extra ignored");
                        ret = WinJS.Promise.as();
                    } else {
                        Log.print(Log.l.trace, "busy - try later again");
                        ret = WinJS.Promise.timeout(50).then(function () {
                            return loadDoc(noteId, docGroup, docFormat);
                        });
                    }
                } else {
                    // set semaphore
                    inLoadDoc = true;
                    prevNoteId = noteId;
                    // check for need of command update in AppBar
                    var bGetNewDocViewer = false;
                    var bUpdateCommands = false;
                    var prevDocViewer = that.docViewer;
                    var newDocViewer = getDocViewer(docGroup, docFormat);
                    if (newDocViewer && newDocViewer.controller) {
                        Log.print(Log.l.trace, "found docViewer!");
                        that.docViewer = newDocViewer;
                        bUpdateCommands = true;
                        ret = that.docViewer.controller.loadData(noteId);
                    } else if (AppData.isSvg(docGroup, docFormat)) {
                        that.binding.showSvg = true;
                        that.binding.showPhoto = false;
                        that.binding.showAudio = false;
                        Log.print(Log.l.trace, "load new svgSketch!");
                        parentElement = pageElement.querySelector("#svghost");
                        if (parentElement) {
                            bGetNewDocViewer = true;
                            bUpdateCommands = true;
                            ret = Application.loadFragmentById(parentElement, "svgSketch", { noteId: noteId, isLocal: true });
                        } else {
                            ret = WinJS.Promise.as();
                        }
                    } else if (AppData.isImg(docGroup, docFormat)) {
                        that.binding.showPhoto = true;
                        that.binding.showSvg = false;
                        that.binding.showAudio = false;
                        Log.print(Log.l.trace, "load new imgSketch!");
                        parentElement = pageElement.querySelector("#imghost");
                        if (parentElement) {
                            bGetNewDocViewer = true;
                            bUpdateCommands = true;
                            ret = Application.loadFragmentById(parentElement, "imgSketch", { noteId: noteId, isLocal: true });
                        } else {
                            ret = WinJS.Promise.as();
                        }
                    } else if (AppData.isAudio(docGroup, docFormat)) {
                        that.binding.showAudio = true;
                        that.binding.showSvg = false;
                        that.binding.showPhoto = false;
                        Log.print(Log.l.trace, "load new wavSketch!");
                        parentElement = pageElement.querySelector("#wavhost");
                        if (parentElement) {
                            bGetNewDocViewer = true;
                            bUpdateCommands = true;
                            ret = Application.loadFragmentById(parentElement, "wavSketch", { noteId: noteId, isLocal: true });
                        } else {
                            ret = WinJS.Promise.as();
                        }
                    } else {
                        ret = WinJS.Promise.as();
                    }
                    // do command update if needed
                    ret = ret.then(function () {
                        if (bUpdateCommands) {
                            if (bGetNewDocViewer) {
                                that.docViewer = getDocViewer(docGroup, docFormat);
                            }
                            if (prevDocViewer !== that.docViewer && that.docViewer && that.docViewer.controller) {
                                that.docViewer.controller.updateCommands(prevDocViewer && prevDocViewer.controller);
                            }
                        }
                        if (prevDocViewer !== that.docViewer && prevDocViewer && prevDocViewer.controller) {
                            prevDocViewer.controller.removeDoc();
                        }
                        // reset semaphore
                        inLoadDoc = false;
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadDoc = loadDoc;

            // check modify state
            // modified==true when startDrag() in svg.js is called!
            var isModified = function () {
                Log.call(Log.l.trace, "svgSketchController.");
                var ret;
                var svgFragment = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("svgSketch"));
                if (svgFragment && svgFragment.controller) {
                    ret = svgFragment.controller.isModified();
                } else ret = false;
                Log.ret(Log.l.trace);
                return ret;
            }
            this.isModified = isModified;

            var loadData = function (noteId, docGroup, docFormat) {
                Log.call(Log.l.trace, "Sketch.Controller.", "noteId=" + noteId + " docGroup=" + docGroup + " docFormat=" + docFormat);
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!that.binding.contactId) {
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
                                that.binding.contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", that.binding.contactId);
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
                        Log.print(Log.l.trace, "use existing contactID=" + that.binding.contactId);
                        return WinJS.Promise.as();
                    }
                }).then(function() {
                    if (!noteId) {
                        //load list first -> noteId, showSvg, showPhoto, moreNotes set
                        return that.loadList(noteId);
                    } else {
                        //load doc then if noteId is set
                        return loadDoc(noteId, docGroup, docFormat);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            var loadList = function (noteId) {
                Log.call(Log.l.trace, "Sketch.", "noteId=" + noteId);
                var ret;
                var sketchListFragmentControl = Application.navigator.getFragmentControlFromLocation(Application.getFragmentPath("sketchList"));
                if (sketchListFragmentControl && sketchListFragmentControl.controller) {
                    ret = sketchListFragmentControl.controller.loadData(that.binding.contactId, noteId);
                } else {
                    var parentElement = pageElement.querySelector("#listhost");
                    if (parentElement) {
                        ret = Application.loadFragmentById(parentElement, "sketchList", { contactId: that.binding.contactId, isLocal: true });
                    } else {
                        ret = WinJS.Promise.as();
                    }
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadList = loadList;

            var hideToolbox = function(id) {
                var curToolbox = document.querySelector('#' + id);
                if (curToolbox) {
                    //var height = -curToolbox.clientHeight;
                    //var offset = { top: height.toString() + "px", left: "0px" };
                    WinJS.UI.Animation.slideDown(curToolbox).done(function() {
                        curToolbox.style.display = "none";
                    });
                }
            }
            this.hideToolbox = hideToolbox;

            var toggleToolbox = function (id) {
                WinJS.Promise.timeout(0).then(function() {
                    Log.call(Log.l.trace, "Sketch.Controller.toggleToolbox");
                    var toolboxIds = ['addNotesToolbar'];
                    var curToolbox = document.querySelector('#' + id);
                    if (curToolbox && curToolbox.style) {
                        if (!curToolbox.style.display ||
                            curToolbox.style.display === "none") {
                            for (var i = 0; i < toolboxIds.length; i++) {
                                if (toolboxIds[i] !== id) {
                                    var otherToolbox = document.querySelector('#' + toolboxIds[i]);
                                    if (otherToolbox && otherToolbox.style &&
                                        otherToolbox.style.display === "block") {
                                        otherToolbox.style.display = "none";
                                    }
                                }
                            }
                            if (that.docViewer && that.docViewer.controller && that.docViewer.controller.svgEditor) {
                                that.docViewer.controller.svgEditor.unregisterTouchEvents();
                            }
                            curToolbox.style.display = "block";
                            WinJS.UI.Animation.slideUp(curToolbox).done(function () {
                                // now visible
                            });
                        } else {
                            that.hideToolbox(id);
                            if (that.docViewer && that.docViewer.controller && that.docViewer.controller.svgEditor) {
                                that.docViewer.controller.svgEditor.registerTouchEvents();
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                });
            }
            this.toggleToolbox = toggleToolbox;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done(/* Your success and error handlers */);
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
                },
                clickDelete: function(event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    if (that.docViewer &&
                        that.docViewer.controller &&
                        that.docViewer.controller.binding &&
                        that.docViewer.controller.binding.noteId && 
                        typeof that.docViewer.controller.deleteData === "function") {
                        if (that.docViewer.controller.svgEditor) {
                            that.docViewer.controller.svgEditor.unregisterTouchEvents();
                        }
                        var confirmTitle = getResourceText("sketch.questionDelete");
                        confirm(confirmTitle, function (result) {
                            if (result) {
                                Log.print(Log.l.trace, "deleteData: user choice OK");
                                if (that.docViewer &&
                                    that.docViewer.controller &&
                                    that.docViewer.controller.binding &&
                                    that.docViewer.controller.binding.noteId &&
                                    typeof that.docViewer.controller.deleteData === "function") {
                                    that.docViewer.controller.deleteData();
                                }
                            } else {
                                Log.print(Log.l.trace, "deleteData: user choice CANCEL");
                                if (that.docViewer &&
                                    that.docViewer.controller &&
                                    that.docViewer.controller.svgEditor) {
                                    that.docViewer.controller.svgEditor.registerTouchEvents();
                                }
                            }
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                clickShowList: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    var mySketchList = pageElement.querySelector(".listfragmenthost");
                    var pageControl = pageElement.winControl;
                    var newShowList = !that.binding.showList;
                    var replaceCommands = function () {
                        if (!newShowList && mySketchList && mySketchList.style) {
                            mySketchList.style.display = "none";
                        }
                        if (pageControl) {
                            pageControl.prevHeight = 0;
                            pageControl.prevWidth = 0;
                        }
                        AppBar.replaceCommands([
                            { id: 'clickShowList', label: getResourceText('sketch.showList'), tooltip: getResourceText('sketch.showList'), section: 'primary', svg: that.binding.showList ? 'document_height' : 'elements3' }
                        ]);
                        WinJS.Promise.timeout(50).then(function () {
                            mySketchList = pageElement.querySelector(".listfragmenthost");
                            if (mySketchList && mySketchList.style) {
                                mySketchList.style.position = "";
                                mySketchList.style.top = "";
                                if (newShowList) {
                                    mySketchList.style.display = "";
                                }
                            }
                        });
                    };
                    that.binding.userHidesList = !newShowList;
                    if (mySketchList && mySketchList.style) {
                        mySketchList.style.display = "block";
                        mySketchList.style.position = "absolute";
                        var contentarea = pageElement.querySelector(".contentarea");
                        if (contentarea) {
                            var contentHeader = pageElement.querySelector(".content-header");
                            var height = contentarea.clientHeight;
                            mySketchList.style.top = (height - 178).toString() + "px";
                            if (contentHeader) {
                                height -= contentHeader.clientHeight;
                            }
                            if (newShowList) {
                                that.binding.showList = true;
                                WinJS.UI.Animation.slideUp(mySketchList).done(function () {
                                    replaceCommands(newShowList);
                                });
                            } else {
                                var mySketchViewers = pageElement.querySelectorAll(".sketchfragmenthost");
                                if (mySketchViewers) {
                                    var mySketch, i;
                                    for (i = 0; i < mySketchViewers.length; i++) {
                                        mySketch = mySketchViewers[i];
                                        if (mySketch && mySketch.style) {
                                            mySketch.style.height = height.toString() + "px";
                                        }
                                    }
                                }
                                if (Application.navigator) {
                                    Application.navigator._updateFragmentsLayout();
                                }
                                WinJS.Promise.timeout(0).then(function() {
                                    WinJS.UI.Animation.slideDown(mySketchList).done(function() {
                                        that.binding.showList = false;
                                        replaceCommands(newShowList);
                                    });
                                });
                            }
                        }
                    } else {
                        replaceCommands(newShowList);
                    }
                    Log.ret(Log.l.trace);
                },
                clickAddNote: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    // TODO: show buttons
                    that.toggleToolbox("addNotesToolbar");
                    Log.ret(Log.l.trace);
                },
                clickAddSvg: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    // TODO: open blank svg
                    that.hideToolbox("addNotesToolbar");
                    if (that.docViewer && that.docViewer.canUnload) {
                        // save previous
                        that.docViewer.canUnload(function () {
                            loadDoc(null, AppData.DocGroup.Text, 75);
                        }, function() {
                            // error occured!
                        });
                    } else {
                        loadDoc(null, AppData.DocGroup.Text, 75);
                    }
                    Log.ret(Log.l.trace);
                },
                clickAddImg: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    // TODO: open camera
                    that.hideToolbox("addNotesToolbar");
                    if (that.docViewer && that.docViewer.canUnload) {
                        // save previous
                        that.docViewer.canUnload(function () {
                            loadDoc(null, AppData.DocGroup.Image, 3);
                        }, function () {
                            // error occured!
                        });
                    } else {
                        loadDoc(null, AppData.DocGroup.Image, 3);
                    }
                    Log.ret(Log.l.trace);
                },
                clickAddWav: function (event) {
                    Log.call(Log.l.trace, "Sketch.Controller.");
                    // TODO: open camera
                    that.hideToolbox("addNotesToolbar");
                    if (that.docViewer && that.docViewer.canUnload) {
                        // save previous
                        that.docViewer.canUnload(function () {
                            loadDoc(null, AppData.DocGroup.Audio, 67);
                        }, function () {
                            // error occured!
                        });
                    } else {
                        loadDoc(null, AppData.DocGroup.Audio, 67);
                    }
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
                },
                clickShowList: function () {
                    if (that.binding.moreNotes) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickDelete: function () {
                    if (that.docViewer && that.docViewer.controller &&
                        that.docViewer.controller.binding &&
                        that.docViewer.controller.binding.noteId) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickAddNote: function() {
                    if (that.binding.contactId) {
                        return AppBar.busy;
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

