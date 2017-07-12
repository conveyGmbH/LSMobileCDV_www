// service for page: start
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Start", {
        _contactView: {
            get: function() {
                return AppData.getFormatView("Kontakt", 20428);
            }
        },
        contactView: {
            select: function(complete, error, recordId) {
                Log.call(Log.l.trace, "contactView.", "recordId=" + recordId);
                var ret = Start._contactView.selectById(complete, error, recordId);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _cardScanView: {
            get: function () {
                return AppData.getFormatView("DOC1IMPORT_CARDSCAN", 0);
            }
        },
        cardScanView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "cardScanView.");
                var ret = Start._cardScanView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _actions: null,
        actions: {
            get: function () {
                if (!Start._actions) {
                    Start._actions = new WinJS.Binding.List([
                        {
                            id: "recent",
                            title: getResourceText("start.recent"),
                            button0: {
                                id: "contact",
                                content: "",
                                svg: "",
                                showBusinessCard: false,
                                INITAnredeID: null,
                                KontaktVIEWID: null,
                                Name: "",
                                Firmenname: "",
                                PostAdresse: "",
                                Freitext1: "",
                                LandTITLE: "",
                                ModifiedTS: "",
                                Erfassungsdatum: "",
                                modifiedOn: "",
                                editedOn: "",
                                showErfassungsdatum: false
                            }
                        }, {
                            id: "list",
                            title: getResourceText("start.list"),
                            button0: {
                                id: "listLocal",
                                content: getResourceText("start.buttonListLocal") + ": " + AppData.generalData.contactCountLocal,
                                svg: "user_smartphone"
                            },
                            button1: {
                                id: "listRemote",
                                content: getResourceText("start.buttonListRemote") + ": " + AppData.generalData.contactCountRemote,
                                svg: "user_monitor"
                            },
                            button2: {
                                id: "search",
                                content: getResourceText("start.buttonSearch"),
                                svg: "magnifying_glass"
                            }
                        }, {
                            id: "new",
                            title: getResourceText("start.new"),
                            button0: {
                                id: "camera",
                                content: getResourceText("start.buttonCamera"),
                                svg: "hand_card"
                            },
                            button1: {
                                id: "barcode",
                                content: getResourceText("start.buttonBarcode"),
                                svg: "portable_barcode_scanner"
                            },
                            button2: {
                                id: "newContact",
                                content: getResourceText("start.buttonManually"),
                                svg: "hand_touch"
                            }
                        }
                    ]);
                }
                return Start._actions;
            }
        }
    });
})();
