// service for page: sketchList
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("SketchList", {
        _sketchlistView: {
            get: function () {
                return AppData.getFormatView("KontaktNotiz", 20504, false);
            }
        },
        sketchlistView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "SketchList.");
                var ret = SketchList._sketchlistView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "KontaktNotizVIEWID",
                    desc: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "SketchList.");
                var ret = SketchList._sketchlistView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "SketchList.");
                var ret = SketchList._sketchlistView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();


