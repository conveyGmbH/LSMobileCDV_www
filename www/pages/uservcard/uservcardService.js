// service for page: userInfo
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("UserVcard", {
        _benutzerView: {
            get: function () {
                return AppData.getFormatView("Benutzer", 0);
            }
        },
        benutzerView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "benutzerView.");
                var ret = UserVcard._benutzerView.selectById(complete, error, recordId);
                 Log.ret(Log.l.trace);
                 return ret;
             },
             defaultValue: {
                 Vorname: "",
                 Name: "",
                 Titel: "",
                 Position: "",
                 TelefonFestnetz: "",
                 TelefonMobil: "",
                 EMail: "",
                 Bemerkungen: ""
             }
        },
        _veranstaltungView: {
            get: function () {
                return AppData.getFormatView("Veranstaltung", 0);
            }
        },
        veranstaltungView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "veranstaltungView.");
                var ret = UserVcard._veranstaltungView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Firmenname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                INITLandID: 0,
                WebAdresse: ""
            }
        }
    });
})();

