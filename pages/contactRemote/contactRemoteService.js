// services for page: contactRemote
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("ContactRemote", {
        _rinfContactRemoteView: {
            get: function() {
                return AppData.getFormatView("RINFKontakt", 0, false);
            }
        },
        _rinfContactView: {
            get: function () {
                return AppData.getFormatView("RINFKontakt", 0, true);
            }
        },
        rinfContactView: {
            selectById: function (complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.");
                var ret = ContactRemote._rinfContactRemoteView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "contactView.");
                var ret = ContactRemote._rinfContactView.select(complete, error, restriction);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactView20451: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20451, false);
            }
        },
        contactView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.");
                var ret = ContactRemote._contactView20451.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Titel: "",
                Vorname: "",
                Name: "",
                Firmenname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                TelefonFestnetz: "",
                TelefonMobil: "",
                Fax: "",
                EMail: "",
                Bemerkungen: "",
                Freitext1: "",
                INITAnredeID: 0,
                INITLandID: 0,
                Flag_NoEdit: 1,
                CreatorSiteID: "",
                CreatorRecID: ""
            }
        },
        _contactView20452: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20452, false);
            }
        },
        contactDownloadView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "ListRemote.", "recordId=" + recordId);
                var ret = ContactRemote._contactView20452.select(complete, error, { KontaktID: recordId }, { ordered: true, orderAttribute: "Sortierung" });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
