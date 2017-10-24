// implements the SVGEditor namespace
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/fragments/svgSketch/svg.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SVGEditor", {
        iOS: (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false),
        SVGEditorClass: WinJS.Class.define(
            // Define the constructor function for the SVGEditorClass.
            function SVGEditorClass() {
                this._eventHandlerRemover = [];

                var that = this;
                this.addRemovableEventListener = function (e, eventName, handler, capture) {
                    e.addEventListener(eventName, handler, capture);
                    that._eventHandlerRemover.push(function () {
                        e.removeEventListener(eventName, handler);
                    });
                };
                this.svg = new SVG.SVGClass();
            }, {
                // variables for drawing functions
                width: 0,
                height: 0,

                drawshape: ['polyline', 'line', 'rect', 'circle', 'ellipse'],
                drawcolor: ['black', 'blue', 'red', 'yellow', 'green', 'gray'],
                selshapeIdx: 0,
                selcolorIdx: 0,
                // variables for touch/move
                prevclientX: null,
                prevclientY: null,
                inTouchEvent: false,
                modified: false,
                _disposed: false,
                dispose: function () {
                    if (this._disposed) {
                        return;
                    }
                    this._disposed = true;
                    this.unregisterTouchEvents();
                    for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                        this._eventHandlerRemover[i]();
                    }
                    this._eventHandlerRemover = null;
                    if (this.svg) {
                        this.svg.dispose();
                        this.svg = null;
                    }
                },
                // methods for drawing functions
                fnSetColor: function(colorIdx) {
                    var myStroke = document.getElementById("stroke");
                    if (myStroke) {
                        myStroke.value = this.drawcolor[colorIdx];
                    }
                    this.selcolorIdx = colorIdx;
                    this.fnRepaintTools();
                    //console.log("fnSetColor!");
                },
                fnSetShape: function(shapeIdx) {
                    var myShape = document.getElementById("shape");
                    if (myShape) {
                        myShape.value = this.drawshape[shapeIdx];
                    }
                    this.selshapeIdx = shapeIdx;
                    this.fnRepaintTools();
                    //console.log("fnSetShape!");
                },
                //@nedra: 15.09.2015
                fnRepaintTools: function() {
                    var i;
                    for (i = 0; i < this.drawshape.length; i++) {
                        var myId = "tool" + i;
                        var myImg = document.getElementById(myId);
                        if (myImg) {
                            if (i === this.selshapeIdx) {
                                myImg.style.backgroundColor = this.drawcolor[this.selcolorIdx];
                            } else {
                                myImg.style.backgroundColor = "transparent"; //@nedra: 29.09.2015
                            }
                        }
                    }
                },
                //@nedra: 15.09.2015
                fnPaintColors: function() {
                    var i;
                    for (i = 0; i < this.drawcolor.length; i++) {
                        var myId = "tool_empty" + i;
                        var myImg = document.getElementById(myId);
                        if (myImg) {
                            myImg.style.backgroundColor = this.drawcolor[i];
                        }
                    }
                },
                fnCanRedo: function() {
                    return this.svg && this.svg.CanRedo();
                },
                fnRedoSVG: function(e) {
                    // from svg.js:
                    if (this.svg) {
                        this.svg.Redo();
                    }
                    this.modified = true;
                    //console.log("fnRedoSVG!");
                    var event = e || window.event;
                    if (event) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        } else {
                            event.returnValue = false;
                        }
                    }
                    AppBar.triggerDisableHandlers();
                    return false;
                },
                fnCanUndo: function () {
                    return this.svg && this.svg.CanUndo();
                },
                fnUndoSVG: function (e) {
                    // from svg.js:
                    if (this.svg) {
                        this.svg.Undo();
                    }
                    this.modified = true;
                    //console.log("fnUndoSVG!");
                    var event = e || window.event;
                    if (event) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        } else {
                            event.returnValue = false;
                        }
                    }
                    AppBar.triggerDisableHandlers();
                    return false;
                },
                fnCanNew: function () {
                    return this.svg && this.svg.CanClear();
                },
                fnNewSVG: function(e) {
                    // from svg.js:
                    if (this.svg) {
                        this.svg.Clear();
                    }
                    this.modified = true;
                    //console.log("fnNewSVG!");
                    var event = e || window.event;
                    if (event) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        } else {
                            event.returnValue = false;
                        }
                    }
                    AppBar.triggerDisableHandlers();
                    return false;
                },
                fnSaveSVG: function (complete) {
                    if (this.svg && typeof complete === "function") {
                        complete(this.svg.getSVGText());
                    }
                },

                /*FullWidthElement: function (el) {

                    }
                },*/

                //@nedra:16.09.2015
                fnCreateDrawDiv: function() {
                    /*var myShape = document.getElementById("shape");
                    var mySWidth = document.getElementById("swidth");
                    var myStroke = document.getElementById("stroke");
                    var myFill = document.getElementById("fill");
                    var mySketch = document.getElementById("sketch"); 
                    var myBody = document.body;
                    if (myShape) {
                        myShape.id = "shape";
                    }
                    if (mySWidth) {
                        mySWidth.id = "swidth";
                    }
                    if (myStroke) {
                        myStroke.id = "stroke";
                    }
                    if (myFill) {
                        myFill.id = "fill";
                    }
                    if (mySketch) {
                        //FullWidthElement(mySketch);
                        mySketch.innerHTML = 
                         '<div id="svgsketch" class="svgdiv" style="width: 100%; height: 300px; margin: 0; padding: 0;">';
                    }
                    if (myBody) {
                        var prevHTML = myBody.innerHTML;
                        myBody.innerHTML = '<div id="sketch" class="feature" style="margin: 0; padding: 0; border: none;">'+prevHTML+"</div>";
                    }*/
                    this.fnPaintColors();
                    this.fnSetColor(0);
                    this.fnSetShape(0);
                },
                fnStartSketch: function () {
                    if (this.svg) {
                        this.svg.startSketch();
                    }
                },
                fnLoadSVG: function(trustedSvg) {
                    //console.log("fnLoadSVG called:" + trustedSVG);
                    if (this.svg) {
                        this.svg.Load(trustedSvg);
                    }
                    this.modified = false;
                    AppBar.notifyModified = true;
                    AppBar.triggerDisableHandlers();
                    //console.log("fnLoadSVG returned");
                },
                // event-handler for touch/move
                doTouchStartMS: function(e) {
                    //console.log("doTouchStartMS called");
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        var tempEvent = { clientX: e.clientX, clientY: e.clientY, event: e, preventDefault: function() { this.event.preventDefault(); } };
                        if (e.touches && e.touches.length > 0) {
                            var touch = e.touches[0];
                            //console.log("doTouchStart touches pageX=" + touch.pageX + " pageY=" + touch.pageY);
                            tempEvent.clientX = touch.pageX;
                            tempEvent.clientY = touch.pageY;
                        }
                        //console.log("doTouchStart clientX=" + tempEvent.clientX + " clientY=" + tempEvent.clientY);
                        this.prevclientX = tempEvent.clientX;
                        this.prevclientY = tempEvent.clientY;
                        this.inTouchEvent = true;
                        // from svg.js:
                        // from svg.js: returns true if ignored
                        if (this.svg && !this.svg.startDrag(tempEvent)) {
                            this.modified = true;
                        }
                    }
                    //console.log("doTouchStartMS returned inTouchEvent=" + this.inTouchEvent);
                },
                doTouchStart: function(e) {
                    var appBarOpened = false;
                    if (AppBar.barControl) {
                        appBarOpened = AppBar.barControl.opened;
                    }
                    //console.log("doTouchStart called AppBar=" + appBarOpened);
                    if (appBarOpened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        var tempEvent = { clientX: e.clientX, clientY: e.clientY, event: e, preventDefault: function() { this.event.preventDefault(); } };
                        if (e.touches && e.touches.length > 0) {
                            var touch = e.touches[0];
                            if (SVGEditor.iOS) {
                                //console.log("doTouchStart touches iOS screenX=" + touch.screenX + " screenY=" + touch.screenY);
                                tempEvent.clientX = touch.screenX;
                                tempEvent.clientY = touch.screenY;
                            } else {
                                //console.log("doTouchStart touches pageX=" + touch.pageX + " pageY=" + touch.pageY);
                                tempEvent.clientX = touch.pageX;
                                tempEvent.clientY = touch.pageY;
                            }
                        }
                        //console.log("doTouchStart clientX=" + tempEvent.clientX + " clientY=" + tempEvent.clientY);
                        this.prevclientX = tempEvent.clientX;
                        this.prevclientY = tempEvent.clientY;
                        this.inTouchEvent = true;
                        // from svg.js: returns true if ignored
                        if (this.svg && !this.svg.startDrag(tempEvent)) {
                            this.modified = true;
                        }
                    }
                    //console.log("doTouchStart returned inTouchEvent=" + this.inTouchEvent);
                },
                doTouchMoveMS: function(e) {
                    //console.log("doTouchMoveMS called");
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        var tempEvent = { clientX: e.clientX, clientY: e.clientY, event: e, preventDefault: function() { this.event.preventDefault(); } };
                        if (e.touches && e.touches.length > 0) {
                            var touch = e.touches[0];
                            //console.log("doTouchMoveMS touches pageX=" + touch.pageX + " pageY=" + touch.pageY);
                            tempEvent.clientX = touch.pageX;
                            tempEvent.clientY = touch.pageY;
                        }
                        //console.log("doTouchMoveMS clientX=" + tempEvent.clientX + " clientY=" + tempEvent.clientY);
                        this.prevclientX = tempEvent.clientX;
                        this.prevclientY = tempEvent.clientY;
                        // from svg.js:
                        if (this.svg) {
                            this.svg.dragging(tempEvent);
                        }
                    }
                    //console.log("doTouchMoveMS returned");
                },
                doTouchMove: function(e) {
                    //console.log("doTouchMove called");
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        var tempEvent = { clientX: e.clientX, clientY: e.clientY, event: e, preventDefault: function() { this.event.preventDefault(); } };
                        if (e.touches && e.touches.length > 0) {
                            var touch = e.touches[0];
                            if (SVGEditor.iOS) {
                                //console.log("doTouchMove touches iOS screenX=" + touch.screenX + " screenY=" + touch.screenY);
                                tempEvent.clientX = touch.screenX;
                                tempEvent.clientY = touch.screenY;
                            } else {
                                //console.log("doTouchMove touches pageX=" + touch.pageX + " pageY=" + touch.pageY);
                                tempEvent.clientX = touch.pageX;
                                tempEvent.clientY = touch.pageY;
                            }
                        }
                        //console.log("doTouchMove clientX=" + tempEvent.clientX + " clientY=" + tempEvent.clientY);
                        this.prevclientX = tempEvent.clientX;
                        this.prevclientY = tempEvent.clientY;
                        // from svg.js:
                        if (this.svg) {
                            this.svg.dragging(tempEvent);
                        }
                    }
                    //console.log("doTouchMove returned");
                },
                doTouchEnd: function(e) {
                    //console.log("doTouchEnd called: prevclientX=" + this.prevclientX + " prevclientY=" + this.prevclientY);
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        var tempEvent = { clientX: e.clientX, clientY: e.clientY, event: e, preventDefault: function() { this.event.preventDefault(); } };
                        tempEvent.clientX = this.prevclientX;
                        tempEvent.clientY = this.prevclientY;
                        this.inTouchEvent = false;
                        // from svg.js:
                        if (this.svg) {
                            this.svg.endDrag(tempEvent);
                        }
                        AppBar.triggerDisableHandlers();
                    }
                    //console.log("doTouchEnd returned");
                },
                preventDefault: function(e) {
                    //console.log("preventDefault called");
                    event.preventDefault();
                    //console.log("preventDefault returned");
                    return false;
                },

                // @nedra: 06.10.2015:mouse event for touch/move for mySketch
                mouseDown: function(e) {
                    //console.log("mouseDown called: clientX=" + e.clientX + " clientY=" + e.clientY + " inTouchEvent=" + this.inTouchEvent);
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else if (!this.inTouchEvent) {
                        // from svg.js: returns true if ignored
                        if (this.svg && !this.svg.startDrag(e)) {
                            this.modified = true;
                        }
                    } else {
                        this.preventDefault();
                        //console.log("mouseDown returned: preventDefault");
                        return false;
                    }
                    //console.log("mouseDown returned");
                },
                mouseMove: function(e) {
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        //console.log("mouseMove called: clientX=" + e.clientX + " clientY=" + e.clientY + " inTouchEvent=" + this.inTouchEvent);
                        if (!this.inTouchEvent) {
                            if (this.svg) {
                                this.svg.dragging(e);
                            }
                        } else {
                            this.preventDefault();
                            //console.log("mouseMove returned: preventDefault");
                            return false;
                        }
                    }
                    //console.log("mouseMove returned");
                },

                mouseUp: function(e) {
                    //console.log("mouseUp called: clientX=" + e.clientX + " clientY=" + e.clientY + " inTouchEvent=" + this.inTouchEvent);
                    if (AppBar.barControl && AppBar.barControl.opened) {
                        //console.log("AppBar menu is opened!");
                    } else {
                        if (!this.inTouchEvent) {
                            if (this.svg) {
                                this.svg.endDrag(e);
                            }
                            AppBar.triggerDisableHandlers();
                        } else {
                            this.preventDefault();
                            //console.log("mouseUp returned: preventDefault");
                            return false;
                        }
                    }
                    //console.log("mouseUp returned");
                },

                resize: function (width, height) {
                    //console.log("ResizeSketchpad called width=" + width + " height=" + height);
                    if (this.svg) {
                        this.svg.ResizeSketchpad(width, height);
                    }
                    //console.log("Load returned");
                },

                registerTouchEvents: function() {
                    // initialize svg graphics editor
                    if (window.navigator.msPointerEnabled) {
                        // Fires for touch, pen, and mouse
                        this.addRemovableEventListener(document, "MSPointerDown", this.doTouchStartMS.bind(this), false);
                        this.addRemovableEventListener(document, "MSPointerMove", this.doTouchMoveMS.bind(this), false);
                        this.addRemovableEventListener(document, "MSPointerUp", this.doTouchEnd.bind(this), false);
                    } else {
                        this.addRemovableEventListener(document, "touchstart", this.doTouchStart.bind(this), false);
                        this.addRemovableEventListener(document, "touchmove", this.doTouchMove.bind(this), false);
                        this.addRemovableEventListener(document, "touchend", this.doTouchEnd.bind(this), false);
                        this.addRemovableEventListener(document, "touchcancel", this.doTouchEnd.bind(this), false);
                    }
                    this.addRemovableEventListener(document, "gesturestart", this.preventDefault.bind(this), false);
                    this.addRemovableEventListener(document, "gesturechange", this.preventDefault.bind(this), false);
                    this.addRemovableEventListener(document, "gestureend", this.preventDefault.bind(this), false);

                    var mySketch = document.getElementById("svgsketch");
                    if (mySketch) {
                        this.addRemovableEventListener(mySketch, "mousedown", this.mouseDown.bind(this), false);
                        this.addRemovableEventListener(mySketch, "mousemove", this.mouseMove.bind(this), false);
                        this.addRemovableEventListener(mySketch, "mouseup", this.mouseUp.bind(this), false);
                    }
                },
                unregisterTouchEvents: function() {
                    for (var i = 0; i < this._eventHandlerRemover.length; i++) {
                        this._eventHandlerRemover[i]();
                    }
                    this._eventHandlerRemover.length = 0;
                },
                hideToolbox: function(id) {
                    var curToolbox = document.querySelector('#' + id);
                    if (curToolbox) {
                        //var height = -curToolbox.clientHeight;
                        //var offset = { top: height.toString() + "px", left: "0px" };
                        WinJS.UI.Animation.slideDown(curToolbox).done(function() {
                            curToolbox.style.display = "none";
                        });
                    }
                },
                toggleToolbox: function (id) {
                    var that = this;
                    window.setTimeout(function() {
                        var toolboxIds = ['shapesToolbar', 'widthsToolbar', 'colorsToolbar'];
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
                                that.unregisterTouchEvents();
                                curToolbox.style.display = "block";
                            } else {
                                that.hideToolbox(id);
                                that.registerTouchEvents();
                            }
                        }
                    }, 0, id);
                }
            }
        )
    });
})();
