// controller for page: search
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/search/searchService.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Search", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "Search.Controller.");
            Application.Controller.apply(this, [pageElement, {
                restriction: {
                    KontaktVIEWID: "",
                    Firmenname: "",
                    Vorname: "",
                    Name: "",
                    Email: "",
                    Strasse: "",
                    PLZ: "",
                    Stadt: "",
                    useErfassungsdatum: false,
                    usemodifiedTS: false
                }
            }]);

            var Erfassungsdatum = pageElement.querySelector("#Erfassungsdatum.win-datepicker");
            var modifiedTS = pageElement.querySelector("#modifiedTS.win-datepicker");
            var initLand = pageElement.querySelector("#InitLandSearch");

            this.dispose = function () {
                if (initLand && initLand.winControl) {
                    initLand.winControl.data = null;
                }
            }

            var that = this;

            var savedRestriction = AppData.getRestriction("Kontakt");
            if (typeof savedRestriction === "object") {
                this.binding.restriction = savedRestriction;
            }
            // always define date types
            if (typeof that.binding.restriction.Erfassungsdatum === "undefined") {
                that.binding.restriction.Erfassungsdatum = new Date();
            }
            if (typeof that.binding.restriction.ModifiedTS === "undefined") {
                that.binding.restriction.ModifiedTS = new Date();
            }

            var showDateRestrictions = function () {
                return WinJS.Promise.as().then(function () {
                    if (typeof that.binding.restriction.useErfassungsdatum == "undefined") {
                        that.binding.restriction.useErfassungsdatum = false;
                    }
                    if (typeof that.binding.restriction.usemodifiedTS == "undefined") {
                        that.binding.restriction.usemodifiedTS = false;
                    }
                    if (Erfassungsdatum && Erfassungsdatum.winControl) {
                        Erfassungsdatum.winControl.disabled = !that.binding.restriction.useErfassungsdatum;
                    }
                    if (modifiedTS && modifiedTS.winControl) {
                        modifiedTS.winControl.disabled = !that.binding.restriction.usemodifiedTS;
                    }
                });
            }
            this.showDateRestrictions = showDateRestrictions;
           
            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    Application.navigateById('listRemote', event);
                    Log.ret(Log.l.trace);
                },
                clickErfassungsdatum: function (event) {
                    if (event.currentTarget) {
                        that.binding.restriction.useErfassungsdatum = event.currentTarget.checked;
                    }
                    that.showDateRestrictions();
                },
                clickmodifiedTS: function (event) {
                    if (event.currentTarget) {
                        that.binding.restriction.usemodifiedTS = event.currentTarget.checked;
                    }
                    that.showDateRestrictions();
                },
                changeErfassungsdatum: function (event) {
                    if (event.currentTarget) {
                        that.binding.restriction.Erfassungsdatum = event.currentTarget.current;
                    }
                },
                changeModifiedTS: function (event) {
                    if (event.currentTarget) {
                        that.binding.restriction.ModifiedTS = event.currentTarget.current;
                    }
                }

            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }

            var saveRestriction = function (complete, error) {
                var ret = WinJS.Promise.as().then(function() {
                    if (!that.binding.restriction.useErfassungsdatum &&
                        typeof that.binding.restriction.Erfassungsdatum !== "undefined") {
                        delete that.binding.restriction.Erfassungsdatum;
                    }
                    //@nedra:10.11.2015: Erfassungsdatum is undefined if it is not updated -> Erfassungsdatum = current date
                    if (that.binding.restriction.useErfassungsdatum &&
                        typeof that.binding.restriction.Erfassungsdatum === "undefined") {
                        that.binding.restriction.Erfassungsdatum = new Date();
                    }
                    if (!that.binding.restriction.usemodifiedTS &&
                        typeof that.binding.restriction.ModifiedTS !== "undefined") {
                        delete that.binding.restriction.ModifiedTS;
                    }
                    //@nedra:10.11.2015: modifiedTS is undefined if it is not updated -> modifiedTS = current date
                    if (that.binding.restriction.usemodifiedTS &&
                        typeof that.binding.restriction.ModifiedTS === "undefined") {
                        that.binding.restriction.ModifiedTS = new Date();
                    }
                    AppData.setRestriction('Kontakt', that.binding.restriction);
                    complete({});
                    return WinJS.Promise.as();
                });
                return ret;
            }
            this.saveRestriction = saveRestriction;


            var loadData = function (complete, error) {
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                var results = AppData.initLandView.getResults();
                if (!results.length) {
                    Log.print(Log.l.trace, "calling select initLandData...");
                    //@nedra:25.09.2015: load the list of INITLand for Combobox
                    return AppData.initLandView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "initLandDataView: success!");
                        if (json && json.d && json.d.results) {
                            // Now, we call WinJS.Binding.List to get the bindable list
                            if (initLand && initLand.winControl) {
                                initLand.winControl.data = new WinJS.Binding.List(json.d.results);
                            }
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    });
                } else {
                    if (initLand && initLand.winControl) {
                        initLand.winControl.data = new WinJS.Binding.List(results);
                    }
                    return WinJS.Promise.as();
                }
            }
            this.loadData = loadData;
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function() {
                Log.print(Log.l.trace, "Data loaded");
                return that.showDateRestrictions();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Restrictions shown");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



