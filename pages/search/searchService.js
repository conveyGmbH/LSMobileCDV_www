// service for page: search
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Search", {
        defaultValue: {
            KontaktVIEWID: "",
            Firmenname: "",
            Vorname: "",
            Name: "",
            Email: "",
            Strasse: "",
            PLZ: "",
            Stadt: "",
            INITLandID: 0,
            useErfassungsdatum: false,
            usemodifiedTS: false
        }
        //empty
    });
})();
