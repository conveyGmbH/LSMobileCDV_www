// service for page: search
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    var namespaceName = "Search";

    WinJS.Namespace.define("Search", {
        defaultValue: {
            MitarbeiterID: "",
            KontaktVIEWID: "",
            CreatorSiteID: "",
            CreatorRecID: "",
            Firmenname: "",
            Position: "",
            Branche: "",
            Vorname: "",
            Name: "",
            AbteilungText: "",
            EMail: "",
            Strasse: "",
            PLZ: "",
            Stadt: "",
            INITLandID: "",
            useErfassungsdatum: false,
            usemodifiedTS: false,
            Erfassungsart: 0,
            Bearbeitet: 0,
            ImportFilter: 1, // #7901 default show all contacts -> app user and import user
            IsIncomplete: null,
            QuestionnaireIncomplete: null
        },
        _Erfassungsart: 0,
        Erfassungsart: {
            get: function () {
                return Search._Erfassungsart;
            },
            set: function (value) {
                Search._Erfassungsart = value;
            }
        },
        Erfassungsart0: {
            get: function () {
                return this.Erfassungsart === 0;
            },
            set: function (checked) {
                if (checked) {
                    this.Erfassungsart = 0;
                }
            }
        },
        Erfassungsart1: {
            get: function () {
                return this.Erfassungsart === 1;
            },
            set: function (checked) {
                if (checked) {
                    this.Erfassungsart = 1;
                }
            }
        },
        Erfassungsart2: {
            get: function () {
                return this.Erfassungsart === 2;
            },
            set: function (checked) {
                if (checked) {
                    this.Erfassungsart = 2;
                }
            }
        },
        _ImportFilter: 1, // #7901 default show all contacts -> app user and import user
        ImportFilter: {
            get: function () {
                return Search._ImportFilter;
            },
            set: function (value) {
                Search._ImportFilter = value;
            }
        },
        ImportFilter0: {
            get: function () {
                return this.ImportFilter === 0;
            },
            set: function (checked) {
                if (checked) {
                    this.ImportFilter = 0;
                }
            }
        },
        ImportFilter1: {
            get: function () {
                return this.ImportFilter === 1;
            },
            set: function (checked) {
                if (checked) {
                    this.ImportFilter = 1;
                }
            }
        },
        _mandatoryView: {
            get: function () {
                return AppData.getFormatView("PflichtFelder", 0);
            }
        },
        mandatoryView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, namespaceName + ".mandatoryView.");
                var ret = Search._mandatoryView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "PflichtFelderVIEWID"
                });
                Log.ret(Log.l.trace);
                return ret;

            }
        },
        _fragebogenzeileView: {
            get: function () {
                return AppData.getFormatView("Fragebogenzeile", 0);
            }
        },
        fragebogenzeileView: {
            select: function (complete, error, restricion) {
                Log.call(Log.l.trace, namespaceName + ".fragebogenzeileView.");
                var ret = Search._fragebogenzeileView.select(complete, error, restricion,
                    {
                        ordered: true,
                        orderAttribute: "SORTIERUNG",
                        desc: true
                    });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getResults: function () {
                Log.call(Log.l.trace, namespaceName + ".fragebogenzeileView.");
                var ret = Search._fragebogenzeileView.results;
                Log.ret(Log.l.trace);
                return ret;
            },
            getMap: function () {
                Log.call(Log.l.trace, namespaceName + ".fragebogenzeileView.");
                var ret = Search._fragebogenzeileView.map;
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
