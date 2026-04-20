// service for page: listRemote
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListRemote", {
        _orderAttribute: "Erfassungsdatum",
        _orderDesc: true,
        _contactView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20432, false);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        contactView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = ListRemote._contactView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: ListRemote._orderAttribute,
                    desc: ListRemote._orderDesc
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
            },
            get relationName() {
                return ListRemote._contactView.relationName;
            },
            get pkName() {
                return ListRemote._contactView.oDataPkName;
            },
            getRecordId: function (record) {
                var ret = null;
                if (record) {
                    if (ListRemote._contactView.oDataPkName) {
                        ret = record[ListRemote._contactView.oDataPkName];
                    }
                    if (!ret && ListRemote._contactView.pkName) {
                        ret = record[ListRemote._contactView.pkName];
                    }
                }
                return ret;
            }
        },
        _contactDocView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20499, false);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        contactDocView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListRemote._contactDocView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: ListRemote._orderAttribute,
                    desc: ListRemote._orderDesc
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

