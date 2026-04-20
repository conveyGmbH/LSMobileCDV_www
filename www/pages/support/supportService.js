// service for page: support
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Support", {
        _templateView: {
            get: function () {
                return AppData.getFormatView("VIEW hier eintragen", 0);
            }
        },
        templateView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "questionView.");
                var ret = Support._templateView.select(complete, error, restriction);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
               
            }
        }
    });
})();