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
        _contactView20434: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Sketch._contactView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Sketch._contactView20434.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;

            },
            defaultValue: {
                Titel: "",
                Vorname: "",
                Vorname2: "",
                Name: "",
                Position: "",
                Branche: "",
                Firmenname: "",
                AbteilungText: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                TelefonFestnetz: "",
                TelefonMobil: "",
                Fax: "",
                EMail: "",
                WebAdresse: "",
                Kommentar: "", // new comment field
                Bemerkungen: "", // nicht zugeordnete Felder
                Freitext1: "",
                HostName: (window.device && window.device.uuid),
                INITAnredeID: 0,
                INITLandID: 0,
                CreatorSiteID: "",
                CreatorRecID: ""
            }
        }
    });
})();
