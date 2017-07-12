// service for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Sketch", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Sketch._contactView.insert(complete, error, viewResponse);
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
            select: function (complete, error, recordId, restriction) {
                Log.call(Log.l.trace, "sketchView.");
                var ret;
                if (restriction) {
                    ret = Sketch._sketchView.select(complete, error, restriction);
                } else {
                    ret = Sketch._sketchView.selectById(complete, error, recordId);
                }
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = Sketch._sketchView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "sketchView.");
                var ret = Sketch._sketchView.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
