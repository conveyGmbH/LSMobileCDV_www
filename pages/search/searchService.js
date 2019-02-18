// service for page: search
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Search", {
        defaultValue: {
            MitarbeiterID: "",
            KontaktVIEWID: "",
            CreatorSiteID: "",
            CreatorRecID: "",
            Firmenname: "",
            Vorname: "",
            Name: "",
            EMail: "",
            Strasse: "",
            PLZ: "",
            Stadt: "",
            INITLandID: "",
            useErfassungsdatum: false,
            usemodifiedTS: false,
            Erfassungsart: 0,
            Bearbeitet: 0,
            ImportFilter: 0
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
        _ImportFilter: 0,
        ImportFilter: {
            get: function () {
                return Search._ImportFilte;
            },
            set: function (value) {
                Search._ImportFilte = value;
            }
        },
        ImportFilter0: {
            get: function () {
                return this.Erfassungsart === 0;
            },
            set: function (checked) {
                if (checked) {
                    this.Erfassungsart = 0;
                }
            }
        },
        ImportFilter1: {
            get: function () {
                return this.Erfassungsart === 1;
            },
            set: function (checked) {
                if (checked) {
                    this.Erfassungsart = 1;
                }
            }
        }
    });
})();
