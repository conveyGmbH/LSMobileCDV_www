// service for page: listRemote
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListRemote", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20432, false);
            }
        },
        contactView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = ListRemote._contactView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Erfassungsdatum",
                    desc: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = ListRemote._contactView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = ListRemote._contactView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactView20498: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20498, false);
            }
        },
        contactView20498: {
            select: function (complete, error) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = ListRemote._contactView20498.select(complete, error);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactDocView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 20500, false);
            }
        },
        contactDocView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListRemote._contactDocView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Erfassungsdatum",
                    desc: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListRemote._contactDocView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListRemote._contactDocView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();

