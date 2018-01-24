// service for page: register
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Register", {
        __initLandView: null,
        _initLandView: {
            get: function() {
                if (!Register.__initLandView) {
                    Register.__initLandView = new AppData.lgntInitData("LGNTINITLand", false, true);
                }
                return Register.__initLandView;
            }
        },
        initLandView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "initLandView.");
                var ret = Register._initLandView.select(complete, error, recordId, { ordered: true });
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, "initLandView.");
                var ret = Register._initLandView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, "initLandView.");
                var ret = Register._initLandView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _registerView: {
            get: function () {
                return AppData.getFormatView("Mitarbeiter_Anschrift", 0, false, true);
            }
        },
        registerView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "loginView.");
                var ret = Register._registerView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Email: "",
                Password: "",
                Password2: "",
                Firmenname: "",
                Vorname: "",
                Nachname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                Messe: "",
                Telefon: "",
                Newsletterflag: 0,
                ErfassungsStatus: 0,
                Freischaltung: 0,
                LanguageID: 0,
                INITLandID: 0
            }
        }
    });
})();
