﻿// service for page: svgSketch
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SvgSketch", {
        getSketchDocView: function (isLocal) {
                return AppData.getFormatView("KontaktNotiz", 20505, isLocal);
        },
        sketchDocView: {
            select: function (complete, error, recordId, isLocal) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch.getSketchDocView(isLocal).selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },

        _sketchView: {
            get: function () {
                return AppData.getFormatView("KontaktNotiz", 0);
            }
        },
        sketchView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch._sketchView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch.getSketchView(true).insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch.getSketchView(true).update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();


