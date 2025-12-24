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
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Search.Controller.");
            Application.Controller.apply(this, [pageElement, {
                restriction: getEmptyDefaultValue(Search.defaultValue),
                disableFilterKontaktFelder: false,
                disableFilterFragebogenzeile: false,
                Erfassungsart0: Search.Erfassungsart0,
                Erfassungsart1: Search.Erfassungsart1,
                Erfassungsart2: Search.Erfassungsart2,
                Bearbeitet0: Search.Bearbeitet0,
                Bearbeitet1: Search.Bearbeitet1,
                Bearbeitet2: Search.Bearbeitet2,
                ImportFilter0: Search.ImportFilter0,
                ImportFilter1: Search.ImportFilter1
            }, commandList]);
            this.employees = null;

            var that = this;

            var erfasserID = pageElement.querySelector("#ErfasserIDSearch");
            //var erfasserIDname = document.getElementById("ErfasserIDSearch");
            var Erfassungsdatum = pageElement.querySelector("#Erfassungsdatum.win-datepicker");
            var modifiedTS = pageElement.querySelector("#modifiedTS.win-datepicker");

            var initLand = pageElement.querySelector("#InitLandSearch");
            var radios = pageElement.querySelectorAll('input[type="radio"]');

            this.dispose = function () {
                if (initLand && initLand.winControl) {
                    initLand.winControl.data = null;
                }
                if (erfasserID && erfasserID.winControl) {
                    erfasserID.winControl.data = null;
                }
                if (that.employees) {
                    that.employees = {};
                }
            }

            // set to null here to initiate bindinghandler later on change
            that.binding.restriction.INITLandID = null; //

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

            var showInCompleteRestrictions = function () {
                return WinJS.Promise.as().then(function () {
                    if (typeof that.binding.restriction.IsIncomplete == "undefined") {
                        that.binding.restriction.IsIncomplete = false;
                    }
                    if (typeof that.binding.restriction.QuestionnaireIncomplete == "undefined") {
                        that.binding.restriction.QuestionnaireIncomplete = false;
                    }
                });
            }
            this.showInCompleteRestrictions = showInCompleteRestrictions;

            var resultConverter = function (item, index) {
                item.index = index;
                item.fullName = (item.Vorname ? (item.Vorname + " ") : "") + (item.Nachname ? item.Nachname : "");
                if (that.employees) {
                    that.employees.push(item);
                }
            }
            this.resultConverter = resultConverter;

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
                clickGotoPublish: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    Application.navigateById("publish", event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    Application.navigateById("listRemote", event); //byhung contactlist
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
                },
                clickResetRestriction: function () {
                    Log.call(Log.l.trace, "InfodeskEmpList.Controller.");
                    that.binding.restriction = getEmptyDefaultValue(Search.defaultValue);
                    if (Erfassungsdatum && Erfassungsdatum.winControl) {
                        Erfassungsdatum.winControl.disabled = true;
                    }
                    if (modifiedTS && modifiedTS.winControl) {
                        modifiedTS.winControl.disabled = true;
                    }
                    AppData.setRestriction("Kontakt", that.binding.restriction);
                    that.loadData();
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Search.Controller.");
                    if (AppData.generalData.logOffOptionActive) {
                        var anchor = document.getElementById("menuButton");
                        var menu = document.getElementById("menu1").winControl;
                        var placement = "bottom";
                        menu.show(anchor, placement);
                    } else {
                        Application.navigateById("userinfo", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            Application.navigateById("login", event);
                        } else {
                            Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                        }
                    });
                    /*AppData._persistentStates.privacyPolicyFlag = false;
                    if (AppHeader && AppHeader.controller && AppHeader.controller.binding.userData) {
                        AppHeader.controller.binding.userData = {};
                        if (!AppHeader.controller.binding.userData.VeranstaltungName) {
                            AppHeader.controller.binding.userData.VeranstaltungName = "";
                        }
                    }*/
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickLogoff: function () {
                    var logoffbutton = document.getElementById("logoffbutton");
                    if (logoffbutton) {
                        logoffbutton.disabled = that.binding.generalData.notAuthorizedUser ? false : that.binding.generalData.logOffOptionActive ? false : true;
                    }
                    if (that.binding.generalData.notAuthorizedUser) {
                        return false;
                    }
                    return !that.binding.generalData.logOffOptionActive;
                },
                clickNew: function () {
                    return AppData._persistentStates.disableCaptureContactsButton || AppData._persistentStates.inActiveUser;
                }
            }

            var saveRestriction = function (complete, error) {
                var ret = WinJS.Promise.as().then(function () {
                    for (var i = 0; i < radios.length; i++) {
                        if (radios[i].name === "Erfassungsart" && radios[i].checked) {
                            Search.Erfassungsart = radios[i].value;
                            break;
                        }
                    }
                    if (Search.Erfassungsart === "1") {
                        that.binding.restriction.SHOW_Barcode = 1;
                        that.binding.restriction.SHOW_Visitenkarte = null;
                    } else if (Search.Erfassungsart === "2") {
                        that.binding.restriction.SHOW_Barcode = null;
                        that.binding.restriction.SHOW_Visitenkarte = 1;
                    } else {
                        that.binding.restriction.SHOW_Barcode = null;
                        that.binding.restriction.SHOW_Visitenkarte = null;
                    }

                    for (var j = 0; j < radios.length; j++) {
                        if (radios[j].name === "Bearbeitet" && radios[j].checked) {
                            Search.Bearbeitet = radios[j].value;
                            break;
                        }
                    }

                    for (var k = 0; k < radios.length; k++) {
                        if (radios[k].name === "ImportFilter" && radios[k].checked) {
                            Search.ImportFilter = parseInt(radios[k].value);
                            break;
                        }
                    }
                    if (Search.ImportFilter === 1) {
                        that.binding.restriction.importFilter = true;
                    } else {
                        that.binding.restriction.importFilter = false;
                    }

                    if (Search.Bearbeitet === "1") {
                        that.binding.restriction.Nachbearbeitet = "NULL";
                    } else if (Search.Bearbeitet === "2") {
                        that.binding.restriction.Nachbearbeitet = 1;
                    } else {
                        that.binding.restriction.Nachbearbeitet = null;
                    }

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

                    if (that.binding.restriction.INITLandID === "0") {
                        that.binding.restriction.INITLandID = "";
                    }
                    if (that.binding.restriction.MitarbeiterID === 0) {
                        that.binding.restriction.MitarbeiterID = "";
                    }

                    that.binding.restriction.IsIncomplete = that.binding.restriction.IsIncomplete ? 1 : null;
                    that.binding.restriction.QuestionnaireIncomplete = that.binding.restriction.QuestionnaireIncomplete ? 1 : null;

                    that.binding.restriction.bExact = false;
                    AppData.setRestriction('Kontakt', that.binding.restriction);
                    AppData.setRecordId("Kontakt", null);
                    complete({});
                    return WinJS.Promise.as();
                });
                return ret;
            }
            this.saveRestriction = saveRestriction;

            var loadData = function (complete, error) {
                that.binding.messageText = null;
                AppData.setErrorMsg(that.binding);
                var ret = WinJS.Promise.as().then(function () {
                    return Search.mandatoryView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "Search.mandatoryView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.disableFilterKontaktFelder = json.d.results.length === 0;
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, {
                            FieldFlag: 1
                        });
                }).then(function () {
                    return Search.fragebogenzeileView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "Search.fragebogenzeileView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.disableFilterFragebogenzeile = json.d.results.length === 0;
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, {
                            PflichtFlag: 1
                        });
                }).then(function () {
                    if (!AppData.initLandView.getResults().length) {
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
                        if (initLand && initLand.winControl &&
                            (!initLand.winControl.data || !initLand.winControl.data.length)) {
                            initLand.winControl.data = new WinJS.Binding.List(AppData.initLandView.getResults());
                        }
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var savedRestriction = AppData.getRestriction("Kontakt");
                    if (!savedRestriction) {
                        savedRestriction = {};
                    } else {
                        // radio button businesscard, barcodes and default
                        if (savedRestriction.SHOW_Barcode && !that.binding.restriction.SHOW_Visitenkarte) {
                            radios[0].checked = true;
                        } else if (savedRestriction.SHOW_Visitenkarte && !savedRestriction.SHOW_Barcode) {
                            radios[1].checked = true;
                        } else {
                            radios[2].checked = true;
                        }
                        // radio button default and all Contacts
                        if (!savedRestriction.MitarbeiterID) {
                            radios[4].checked = true;
                        } else {
                            radios[3].checked = true;
                        }
                        that.binding.restriction.MitarbeiterID = savedRestriction.MitarbeiterID;
                    }
                    var defaultRestriction = Search.defaultValue;
                    var prop;
                    for (prop in defaultRestriction) {
                        if (defaultRestriction.hasOwnProperty(prop)) {
                            if (typeof savedRestriction[prop] === "undefined") {
                                savedRestriction[prop] = defaultRestriction[prop];
                            }
                        }
                    }
                    that.binding.restriction = savedRestriction;

                    // always define date types
                    if (typeof that.binding.restriction.Erfassungsdatum === "undefined") {
                        that.binding.restriction.Erfassungsdatum = new Date();
                    }
                    if (typeof that.binding.restriction.ModifiedTS === "undefined") {
                        that.binding.restriction.ModifiedTS = new Date();
                    }
                    // erfasserIDname.selectedIndex = 0;
                });
                return ret;
            }
            this.loadData = loadData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                var savedRestriction = AppData.getRestriction("Kontakt");
                if (typeof savedRestriction === "object") {
                    that.binding.restriction = savedRestriction;
                    copyMissingMembersByValue(that.binding.restriction, Search.defaultValue);
                }
                Log.print(Log.l.trace, "Data loaded");
                return that.showDateRestrictions();
            }).then(function () {
                return that.showInCompleteRestrictions();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Date restrictions shown");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



