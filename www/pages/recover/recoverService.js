// service for page: recover
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Recover", {
        _recoverView: {
            get: function () {
                return AppData.getFormatView("Mitarbeiter_Vergessen", 0, false, true);
            }
        },
        recoverView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "loginView.");
                var ret = Recover._recoverView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Email: "",
                ErfassungsStatus: 0,
                Freischaltung: 0,
                LanguageID: 0
            }
        }
    });
})();
