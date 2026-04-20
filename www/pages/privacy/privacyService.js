// service for page: sketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Privacy", {
        _contactView20434: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20434);
            }
        },
        contactView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Privacy._contactView20434.selectById(complete, error, recordId);
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
        },
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
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Privacy._contactNoteView.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
