// service for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SketchRemote", {
        _sketchView: {
            get: function () {
                return AppData.getFormatView("KontaktNotiz", 0, false);
            }
        },
        sketchView: {
            select: function (complete, error, recordId, restriction) {
                Log.call(Log.l.trace, "sketchView.");
                var ret;
                if (restriction) {
                    ret = SketchRemote._sketchView.select(complete, error, restriction);
                } else {
                    ret = SketchRemote._sketchView.selectById(complete, error, recordId);
                }
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
