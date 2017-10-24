// service for page: svgSketch
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SvgSketch", {
        _sketchDocView: {
            get: function () {
                return AppData.getFormatView("KontaktNotiz", 20505);
            }
        },
        sketchDocView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch._sketchDocView.selectById(complete, error, recordId);
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
                var ret = SvgSketch._sketchView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = SvgSketch._sketchView.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();


