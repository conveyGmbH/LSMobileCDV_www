// service for page: listLocal
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListLocal", {
        _orderAttribute: "Erfassungsdatum",
        _orderDesc: true,
        _contactId: 0,
        _contactView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20429);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        contactView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: ListLocal._orderAttribute,
                    desc: ListLocal._orderDesc
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            get relationName() {
                return ListLocal._contactView.relationName;
            },
            get pkName() {
                return ListLocal._contactView.oDataPkName;
            },
            getRecordId: function (record) {
                var ret = null;
                if (record) {
                    if (ListLocal._contactView.oDataPkName) {
                        ret = record[ListLocal._contactView.oDataPkName];
                    }
                    if (!ret && ListLocal._contactView.pkName) {
                        ret = record[ListLocal._contactView.pkName];
                    }
                }
                return ret;
            }
        },
        _contactDocView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20500);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        contactDocView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: ListLocal._orderAttribute,
                    desc: ListLocal._orderDesc
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactNumberView: {
            get: function () {
                var ret = AppData.getFormatView("Mitarbeiter", 20604);
                return ret;
            }
        },
        contactNumberView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactNumberView.select(complete, error, restriction);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
        }
        },
    });
})();

