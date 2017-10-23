// implements the SVGEditor namespace
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/jQuerySVG/scripts/jquery.svg.js" />

(function() {
    "use strict";

    WinJS.Namespace.define("SVG", {
        SVGClass: WinJS.Class.define(
            function SVGClass() {
                this.initDefaults();
            }, {
                initDefaults: function() {
                    this.drawNodes = [];
                    this.sketchpad = null;
                    this.start = null;
                    this.outline = null;
                    this.undostack = [];
                    this.prevOutlines = [];
                    this.offset = null;
                    this.points = [];
                },
                inSel: 0,
                _disposed: false,
                dispose: function () {
                    if (this._disposed) {
                        return;
                    }
                    this._disposed = true;
                    this.initDefaults();
                },
                selstart: function (event) {
                    this.inSel = 1;
                    return true;
                },
                selend: function (event) {
                    this.inSel = 0;
                    return true;
                },
                resetSize: function (svg, width, height) {
                    if (svg) {
                        svg.configure({
                            width: width || $(svg._container).width(),
                            height: height || $(svg._container).height()
                        });
                    }
                },
                getSVGText: function () {
                    if (!this.sketchpad) {
                        return null;
                    }
                    var q = String.fromCharCode(39);
                    return this.sketchpad.toSVG().replace(/\"/g, q);
                },
                /* Remember where we started */
                startDrag: function (event) {
                    /* IE 9 supports offset!
                    offset = ($.browser.msie ? {left: 0, top: 0} : $('#svgsketch').offset());
                    if (!$.browser.msie) {
                      offset.left -= document.documentElement.scrollLeft || document.body.scrollLeft;
                      offset.top -= document.documentElement.scrollTop || document.body.scrollTop;
                    }
                    */
                    //console.log("startDrag called: clientX=" + event.clientX + " clientY=" + event.clientY);
                    if (!$('#svgsketch')) {
                        //console.log("startDrag returned: svgsketch element not found");
                        return true;
                    }
                    this.offset = $('#svgsketch').offset();
                    if (!this.offset) {
                        //console.log("startDrag returned: no offset");
                        return true;
                    }
                    this.offset.left -= document.documentElement.scrollLeft || document.body.scrollLeft;
                    this.offset.top -= document.documentElement.scrollTop || document.body.scrollTop;
                    var width = $('#svgsketch').width();
                    var height = $('#svgsketch').height();
                    //console.log("startDrag left=" + offset.left + " top=" + offset.top + " width=" + width + " height=" + height + " inSel=" + inSel);
                    if (this.inSel === 0 &&
                        event.clientX > this.offset.left && event.clientY > this.offset.top &&
                        event.clientX - this.offset.left < width &&
                        event.clientY - this.offset.top < height) {
                        this.start = { X: event.clientX - this.offset.left, Y: event.clientY - this.offset.top };
                        event.preventDefault();
                        //console.log("startDrag returned: X=" + start.X + " Y=" + start.Y);
                        return false;
                    } else {
                        this.start = null;
                        //console.log("startDrag returned: ignored");
                        return true;
                    }
                },
                /* Provide feedback as we drag */
                dragging: function (event) {
                    var settings, point;
                    //console.log("dragging called: clientX=" + event.clientX + " clientY=" + event.clientY);
                    if (!this.start) {
                        //console.log("dragging returned: not started");
                        return true;
                    }
                    if (!this.sketchpad) {
                        //console.log("dragging returned: no sketchpad");
                        return true;
                    }
                    var shape = $('#shape').val();
                    //console.log("dragging: shape=" + shape);
                    if (this.outline === null) {
                        settings = {
                            fill: $('#fill').val(),
                            stroke: $('#stroke').val(),
                            strokeWidth: $('#swidth').val(),
                            strokeLineCap: "round"
                        };
                        //console.log("dragging: strokeWidth=" + settings.strokeWidth);

                        //console.log('dragging swidth value: ' + settings.strokeWidth);
                        if (shape === 'rect') {
                            this.outline = this.sketchpad.rect(this.start.X, this.start.Y, 0, 0, settings);
                        } else if (shape === 'circle') {
                            this.outline = this.sketchpad.circle(this.start.X, this.start.Y, 0, settings);
                        } else if (shape === 'ellipse') {
                            this.outline = this.sketchpad.ellipse(this.start.X, this.start.Y, 0, 0, settings);
                        } else if (shape === 'line') {
                            this.outline = this.sketchpad.line(this.start.X, this.start.Y, this.start.X, this.start.Y, settings);
                        } else if (shape === 'polyline') {
                            point = [this.start.X, this.start.Y];
                            this.points = [];
                            this.points[0] = point;
                            //this.outline = sketchpad.polyline([[start.X,start.Y],[start.X,start.Y]], $.extend(settings, {fill: 'none'}));
                            this.outline = this.sketchpad.line(this.start.X, this.start.Y, this.start.X, this.start.Y, settings);
                        } else {
                            this.outline = this.sketchpad.rect(0, 0, 0, 0,
                            { fill: 'none', stroke: '#c0c0c0', strokeWidth: 1, strokeDashArray: '2,2' });
                        }
                        $(this.outline).mousemove(this.dragging).mouseup(this.endDrag);
                    } else {
                        var left = Math.min(this.start.X, event.clientX - this.offset.left);
                        var top = Math.min(this.start.Y, event.clientY - this.offset.top);
                        var right = Math.max(this.start.X, event.clientX - this.offset.left);
                        var bottom = Math.max(this.start.Y, event.clientY - this.offset.top);
                        //var x2 = event.clientX - this.offset.left;
                        //var y2 = event.clientY - this.offset.top;
                        //console.log("dragging: x2=" + x2 + " y2=" + y2);
                        if (shape === 'rect') {
                            this.sketchpad.change(this.outline, { x: left, y: top, width: right - left, height: bottom - top });
                        } else if (shape === 'circle') {
                            var r = Math.min(right - left, bottom - top) / 2;
                            this.sketchpad.change(this.outline, { cx: (left + right) / 2, cy: (top + bottom) / 2, r: r });
                        } else if (shape === 'ellipse') {
                            var rx = (right - left) / 2;
                            var ry = (bottom - top) / 2;
                            this.sketchpad.change(this.outline, { cx: left + rx, cy: top + ry, rx: rx, ry: ry });
                        } else if (shape === 'line') {
                            this.sketchpad.change(this.outline, {
                                x1: this.start.X,
                                y1: this.start.Y,
                                x2: event.clientX - this.offset.left,
                                y2: event.clientY - this.offset.top
                            });
                        } else if (shape === 'polyline') {
                            settings = {
                                fill: $('#fill').val(),
                                stroke: $('#stroke').val(),
                                strokeWidth: $('#swidth').val(),
                                strokeLineCap: "round"
                            };
                            point = [event.clientX - this.offset.left, event.clientY - this.offset.top];
                            this.points[this.points.length] = point;
                            this.prevOutlines[this.prevOutlines.length] = this.outline;
                            this.outline = this.sketchpad.line(
                                this.points[this.points.length - 2][0],
                                this.points[this.points.length - 2][1],
                                this.points[this.points.length - 1][0],
                                this.points[this.points.length - 1][1], settings);
                            $(this.outline).mousemove(this.dragging).mouseup(this.endDrag);
                        } else {
                            this.sketchpad.change(this.outline, {
                                x: Math.min(event.clientX - this.offset.left, this.start.X),
                                y: Math.min(event.clientY - this.offset.top, this.start.Y),
                                width: Math.abs(event.clientX - this.offset.left - this.start.X),
                                height: Math.abs(event.clientY - this.offset.top - this.start.Y)
                            });
                        }
                    }
                    event.preventDefault();
                    //console.log("dragging: returned");
                    return true;
                },
                /* Clear the outline */
                clearOutline: function () {
                    $(this.outline).remove();
                    this.outline = null;
                    while (this.prevOutlines.length) {
                        if (this.sketchpad) {
                            this.sketchpad.remove(this.prevOutlines[this.prevOutlines.length - 1]);
                        }
                        this.prevOutlines.splice(this.prevOutlines.length - 1, 1);
                    }
                    this.prevOutlines = [];
                },
                /* Draw where we finish */
                endDrag: function (event) {
                    //console.log("endDrag: called");
                    if (!this.start) {
                        //console.log("not startet");
                        return true;
                    }
                    if (!this.outline) {
                        this.dragging(event);
                    }
                    this.clearOutline();
                    this.drawShape(this.start.X, this.start.Y,
                        event.clientX - this.offset.left, event.clientY - this.offset.top);
                    this.start = null;
                    event.preventDefault();
                    return false;
                },
                /* Draw the selected element on the canvas */
                drawShape: function (x1, y1, x2, y2) {
                    //console.log("drawShape: called");
                    if (!this.sketchpad) {
                        //console.log("drawShape: returned no sketchpad");
                        return;
                    }
                    var left = Math.min(x1, x2);
                    var top = Math.min(y1, y2);
                    var right = Math.max(x1, x2);
                    var bottom = Math.max(y1, y2);
                    var myId = 'ID' + this.drawNodes.length;
                    var settings = {
                        id: myId,
                        fill: $('#fill').val(),
                        stroke: $('#stroke').val(),
                        strokeWidth: $('#swidth').val(),
                        strokeLineCap: "round"
                    };
                    //console.log('fill value : ' + settings.fill);
                    //console.log('stroke value : ' + settings.stroke);
                    //console.log('swidth value: ' + settings.strokeWidth);
                    var shape = $('#shape').val();
                    var node = null;
                    if (shape === 'rect') {
                        node = this.sketchpad.rect(left, top, Math.max(right - left, 1), Math.max(bottom - top, 1), settings);
                    } else if (shape === 'circle') {
                        var r = Math.max(Math.min(right - left, bottom - top) / 2, 1);
                        node = this.sketchpad.circle((left + right) / 2, (top + bottom) / 2, r, settings);
                    } else if (shape === 'ellipse') {
                        var rx = Math.max((right - left) / 2, 1);
                        var ry = Math.max((bottom - top) / 2, 1);
                        node = this.sketchpad.ellipse(left + rx, top + ry, rx, ry, settings);
                    } else if (shape === 'line') {
                        if (x1 === x2 && y1 === y2) {
                            y2++;
                        }
                        node = this.sketchpad.line(x1, y1, x2, y2, settings);
                    } else if (shape === 'polyline') {
                        if (this.points.length < 2) {
                            var point = [x2, y2 + 1];
                            this.points[this.points.length] = point;
                        }
                        node = this.sketchpad.polyline(this.points, $.extend(settings, { fill: 'none' }));
                        this.points = [];
                    } else if (shape === 'polygon') {
                        node = this.sketchpad.polygon([
                            [(x1 + x2) / 2, y1], [x2, y1], [x2, y2],
                            [(x1 + x2) / 2, y2], [x1, (y1 + y2) / 2]
                        ], settings);
                    }
                    this.drawNodes[this.drawNodes.length] = node;
                    $(this.sketchpad).mousedown(this.startDrag).mousemove(this.dragging).mouseup(this.endDrag);
                    $('#svgsketch').focus();
                    //console.log("drawShape: returned");
                },
                startSketch: function () {
                    var that = this;
                    //console.log("startSketch called");
                    $('#svgsketch').svg({
                        onLoad: function (svg) {
                            //console.log("onLoad: called");
                            that.sketchpad = svg;
                            var surface = svg.getElementById('surface');
                            if (!surface) {
                                //console.log("onLoad: create new surface");
                                svg.rect(0, 0, '100%', '100%', { id: 'surface', fill: 'none' });
                            }
                            that.resetSize(svg, '100%', '100%');
                        }
                    });
                    //console.log("startSketch returned");
                },
                CanRedo: function () {
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return false;
                    }
                    if (!this.undostack.length) {
                        return false;
                    }
                    return true;
                },
                /* Redo the last drawn element */
                Redo: function () {
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return;
                    }
                    if (!this.undostack.length) {
                        return;
                    }
                    var myId = 'ID' + this.drawNodes.length;
                    var node = this.undostack[this.undostack.length - 1];
                    node.id = myId;
                    this.sketchpad.add(node);
                    this.drawNodes[this.drawNodes.length] = this.sketchpad.getElementById(myId);
                    this.undostack.splice(this.undostack.length - 1, 1);
                },
                CanUndo: function () {
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return false;
                    }
                    if (!this.drawNodes.length) {
                        return false;
                    }
                    return true;
                },
                /* Remove the last drawn element */
                Undo: function () {
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return;
                    }
                    if (!this.drawNodes.length) {
                        return;
                    }
                    var node = null;
                    while (!node && this.drawNodes.length) {
                        node = this.drawNodes[this.drawNodes.length - 1];
                        if (node) {
                            try {
                                this.sketchpad.remove(node);
                            } catch (e) {
                                // ignore...
                                node = null;
                            }
                        }
                        if (node) {
                            this.undostack[this.undostack.length] = node;
                        }
                        this.drawNodes.splice(this.drawNodes.length - 1, 1);
                    }
                },
                CanClear: function () {
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return false;
                    }
                    if (!this.drawNodes.length) {
                        return false;
                    }
                    return true;
                },
                /* Clear the canvas */
                Clear: function () {
                    //console.log("clear()!");
                    if (!this.sketchpad || !this.undostack || !this.drawNodes) {
                        return;
                    }
                    while (this.drawNodes.length) {
                        this.Undo();
                    }
                    this.undostack = [];
                },
                /* Convert to text */
                Export: function () {
                    alert(this.sketchpad.toSVG());
                },
                Load: function (svgText) {
                    //console.log("Load called svgText=" + svgText);
                    if (!this.sketchpad) {
                        //console.log("drawShape: returned no sketchpad");
                        return;
                    }
                    if (svgText) {
                        var width = $('#svgsketch').width();
                        var height = $('#svgsketch').height();
                        this.sketchpad.load(svgText);
                        if (width && height) {
                            this.resetSize(this.sketchpad, width, height);
                        }
                        var rootNode = this.sketchpad.root();
                        if (rootNode.firstChild) {
                            var node = rootNode.firstChild;
                            while (node) {
                                if (node.id !== 'surface') {
                                    this.drawNodes[this.drawNodes.length] = node;
                                }
                                node = node.nextSibling;
                            }
                        }
                    }
                    //console.log("Load returned");
                },
                ResizeSketchpad: function (width, height) {
                    //console.log("ResizeSketchpad called width=" + width + " height=" + height);
                    if (!this.sketchpad) {
                        //console.log("drawShape: returned no sketchpad");
                        return;
                    }
                    if (width && height) {
                        this.resetSize(this.sketchpad, width, height);
                    }
                    //console.log("Load returned");
                }
            }
        )
    });

})();