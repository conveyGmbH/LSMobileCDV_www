// service for page: barcode
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Barcode", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = Barcode._contactView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _barcodeView: {
            get: function () {
                return AppData.getFormatView("ImportBarcodeScan", 0);
            }
        },
        barcodeView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "barcodeView.");
                var ret = Barcode._barcodeView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _barcodeVCardView: {
            get: function () {
                return AppData.getFormatView("IMPORT_CARDSCAN", 0);
            }
        },
        barcodeVCardView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "barcodeVCardView.");
                var ret = Barcode._barcodeVCardView.insert(complete, error, viewResponse, {
                    "Content-Type": "application/json; charset=UTF-8"
                });
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _cr_V_BereichView: {
            get: function () {
                return AppData.getFormatView("CR_V_Bereich", 20613, false);
            }
        },
        cr_V_BereichView: {
            select: function (complete, error, restriction, recordID) {
                Log.call(Log.l.trace, "cr_V_BereichView.");
                var ret;
                if (recordID) {
                    ret = Barcode.cr_V_BereichView.selectById(complete, error, recordID);
                } else {
                    ret = Barcode._cr_V_BereichView.select(complete, error, restriction, {
                        ordered: true,
                        orderAttribute: "TITLE"
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = Barcode._cr_V_BereichView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ListRemote.");
                var ret = Barcode._cr_V_BereichView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
