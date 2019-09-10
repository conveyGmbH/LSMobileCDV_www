// service for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Privacy", {
        _contactNoteView: {
            get: function () {
                return AppData.getFormatView("KontaktNotiz", 0);
            }
        },
        contactNoteView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Privacy._contactNoteView.select(complete, error, restriction);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
