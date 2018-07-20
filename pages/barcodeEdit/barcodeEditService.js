// service for page: barcode
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("BarcodeEdit", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = BarcodeEdit._contactView.insert(complete, error, viewResponse);
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
                var ret = BarcodeEdit._barcodeView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
