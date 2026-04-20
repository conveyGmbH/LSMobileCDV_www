// services for page: photo
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("PhotoRemote", {
        _cardScanView:{
            get: function () {
                return AppData.getFormatView("DOC1IMPORT_CARDSCAN", 0, false);
            }
        },
        cardScanView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "cardScanView.");
                var ret = PhotoRemote._cardScanView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
