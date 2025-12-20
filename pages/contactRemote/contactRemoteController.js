// controller for page: contact
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/contactRemote/contactRemoteService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ContactRemote", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "ContactRemote.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataContact: getEmptyDefaultValue(ContactRemote.contactView.defaultValue),
                dataContactNote: getEmptyDefaultValue(ContactRemote.contactNoteView.defaultValue),
                InitAnredeItem: { InitAnredeID: 0, TITLE: "" },
                InitLandItem: { InitLandID: 0, TITLE: "" },
                showPhoto: false,
                showModified: false,
                importUser: false
            }, commandList]);
            this.img = null;
            this.initAnredeList = null;
            this.initLandList = null;
            this.prevDataContact = getEmptyDefaultValue(ContactRemote.contactView.defaultValue);
            this.prevDataContactNote = getEmptyDefaultValue(ContactRemote.contactNoteView.defaultValue);
            this.updateIncompleteStatesPromise = null;

            var that = this;

            var delayedSaveDataPromise = null;

            // select combo
            var initAnrede = pageElement.querySelector("#InitAnrede");
            var initLand = pageElement.querySelector("#InitLand");

            // show business card photo
            var photoContainer = pageElement.querySelector(".photo-container");

            var getPhotoData = function () {
                return AppData._remotePhotoData;
            }

            var hasDoc = function () {
                return (typeof getPhotoData() === "string" && getPhotoData() !== null);
            }
            this.hasDoc = hasDoc;

            var removePhoto = function () {
                if (photoContainer) {
                    var oldElement = photoContainer.firstElementChild || photoContainer.firstChild;
                    if (oldElement) {
                        oldElement.parentNode.removeChild(oldElement);
                        oldElement.innerHTML = "";
                    }
                }
            }

            this.dispose = function () {
                if (initAnrede && initAnrede.winControl) {
                    initAnrede.winControl.data = null;
                }
                if (initLand && initLand.winControl) {
                    initLand.winControl.data = null;
                }
                if (that.img) {
                    removePhoto();
                    that.img.src = "";
                    that.img = null;
                }
                that.initAnredeList = null;
                that.initLandList = null;
            }

            var updateIncompleteStates = function (data) {
                Log.call(Log.l.trace, ".Controller.", "IsIncomplete=" + (data && data.IsIncomplete) + " QuestionnaireIncomplete=" + (data && data.QuestionnaireIncomplete));
                if (that.updateIncompleteStatesPromise) {
                    that.updateIncompleteStatesPromise.cancel();
                }
                that.updateIncompleteStatesPromise = WinJS.Promise.timeout(150).then(function () {
                    if (data) {
                        if (!that.prevDataContact || that.prevDataContact.IsIncomplete !== data.IsIncomplete) {
                            // add warning-background-color
                            NavigationBar.changeNavigationBarSignalBkgColor("contactRemote", data.IsIncomplete ? Colors.orange : "");
                            // add warning-symbol
                            var contactLabel = getResourceText("label.contact");
                            NavigationBar.changeNavigationBarLabel("contactRemote", data.IsIncomplete ? contactLabel + " &#x26A0;" : contactLabel);
                        }
                        if (!that.prevDataContact || that.prevDataContact.QuestionnaireIncomplete !== data.QuestionnaireIncomplete) {
                            // add warning-background-color
                            NavigationBar.changeNavigationBarSignalBkgColor("questionnaireRemote", data.QuestionnaireIncomplete ? Colors.orange : "");
                            // add warning-symbol
                            var questionnaireLabel = getResourceText("label.questionnaire");
                            NavigationBar.changeNavigationBarLabel("questionnaireRemote", data.QuestionnaireIncomplete ? questionnaireLabel + " &#x26A0;" : questionnaireLabel);
                        }
                    }
                    that.removeDisposablePromise(that.updateIncompleteStatesPromise);
                    that.updateIncompleteStatesPromise = null;
                });
                that.addDisposablePromise(that.updateIncompleteStatesPromise);
                Log.ret(Log.l.trace);
            };

            var initAnredeFilter = function (item) {
                return (item.INITAnredeID !== 3);
            }

            var initLandSorter = function (firstItem, secondItem) {
                if (firstItem.TITLE === secondItem.TITLE) {
                    return 0;
                }
                if (firstItem.INITLandID === 53) {
                    return -1;
                }
                if (secondItem.INITLandID === 53) {
                    return 1;
                }
                if (firstItem.TITLE > secondItem.TITLE) {
                    return 1;
                } else {
                    return -1;
                }
            }

            var showPhoto = function () {
                if (photoContainer) {
                    if (getPhotoData()) {
                        that.binding.showPhoto = true;
                        that.img = new Image();
                        that.img.id = "pagePhoto";
                        photoContainer.appendChild(that.img);
                        WinJS.Utilities.addClass(that.img, "page-photo");
                        that.img.src = "data:image/jpeg;base64," + getPhotoData();
                        if (photoContainer.childElementCount > 1) {
                            var oldElement = photoContainer.firstElementChild || photoContainer.firstChild;
                            if (oldElement) {
                                oldElement.parentNode.removeChild(oldElement);
                                oldElement.innerHTML = "";
                            }
                        }
                    } else {
                        that.binding.showPhoto = false;
                        removePhoto();
                    }
                }
                AppBar.triggerDisableHandlers();
            }

            var setDataContact = function (newDataContact) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.prevDataContact = copyByValue(that.binding.dataContact);
                // Bug: textarea control shows 'null' string on null value in Internet Explorer!
                if (newDataContact.Bemerkungen === null) {
                    newDataContact.Bemerkungen = "";
                }
                that.binding.dataContact = newDataContact;
                AppData._remoteContactData = newDataContact;
                if (!that.binding.dataContact.KontaktVIEWID) {
                    that.binding.dataContact.Nachbearbeitet = 1;
                }
                if (that.binding.dataContact.Erfassungsdatum === that.binding.dataContact.ModifiedTS) {
                    that.binding.showModified = false;
                } else {
                    that.binding.showModified = true;
                }
                if (that.binding.dataContact.Nachbearbeitet) {
                    that.binding.dataContact.complete = null;
                } else {
                    that.binding.dataContact.complete = 1;
                }
                if (AppData.getRecordId("Mitarbeiter") !== newDataContact.MitarbeiterID) {
                    that.binding.importUser = true;
                }
                that.binding.dataContact.Mitarbeiter_Fullname = (that.binding.dataContact.Mitarbeiter_Vorname ? (that.binding.dataContact.Mitarbeiter_Vorname + " ") : "") + (that.binding.dataContact.Mitarbeiter_Nachname ? that.binding.dataContact.Mitarbeiter_Nachname : "");
                updateIncompleteStates(that.binding.dataContact);
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setDataContact = setDataContact;

            var setDataContactNote = function (newDataContactNote) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.prevDataContactNote = copyByValue(that.binding.dataContactNote);
                that.binding.dataContactNote = newDataContactNote;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setDataContactNote = setDataContactNote;

            var setInitLandItem = function (newInitLandItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitLandItem = newInitLandItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setInitLandItem = setInitLandItem;

            var setInitAnredeItem = function (newInitAnredeItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitAnredeItem = newInitAnredeItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setInitAnredeItem = setInitAnredeItem;

            var getRecordId = function () {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                var recordId = AppData.generalData.getRecordId("Kontakt_Remote");
                Log.ret(Log.l.trace, recordId);
                return recordId;
            }
            this.getRecordId = getRecordId;

            var resultMandatoryConverter = function (item, index) {
                if (item && item.FieldFlag) {
                    var inputField = null;
                    if (item.AttributeName === "AnredeID") {
                        inputField = initAnrede;
                    } else if (item.AttributeName === "LandID") {
                        inputField = initLand;
                    } else {
                        inputField = pageElement.querySelector("input[name=" + item.AttributeName + "]");
                    }
                    if (inputField) {
                        if (!WinJS.Utilities.hasClass(inputField, "bkgcolor-mandatory")) {
                            WinJS.Utilities.addClass(inputField, "bkgcolor-mandatory");
                        }
                    }
                }
            };
            this.resultMandatoryConverter = resultMandatoryConverter;

            var removeMandatory = function () {
                var mandatoryFields = pageElement.querySelectorAll(".bkgcolor-mandatory");
                if (mandatoryFields) for (var i = 0; i < mandatoryFields.length; i++) {
                    var mandatoryField = mandatoryFields[i];
                    if (mandatoryField) {
                        if (WinJS.Utilities.hasClass(mandatoryField, "empty-mandatory")) {
                            WinJS.Utilities.removeClass(mandatoryField, "empty-mandatory");
                        }
                        if (WinJS.Utilities.hasClass(mandatoryField, "bkgcolor-mandatory")) {
                            WinJS.Utilities.removeClass(mandatoryField, "bkgcolor-mandatory");
                        }
                    }
                }
            };
            this.removeMandatory = removeMandatory;

            var handleValueChanged = function () {
                var mandatoryFields = pageElement.querySelectorAll(".bkgcolor-mandatory");
                if (mandatoryFields) for (var i = 0; i < mandatoryFields.length; i++) {
                    var mandatoryField = mandatoryFields[i];
                    if (mandatoryField) {
                        var valueHasChanged = false;
                        if (mandatoryField.value) {
                            if (WinJS.Utilities.hasClass(mandatoryField, "empty-mandatory")) {
                                WinJS.Utilities.removeClass(mandatoryField, "empty-mandatory");
                                valueHasChanged = true;
                            }
                        } else {
                            if (!WinJS.Utilities.hasClass(mandatoryField, "empty-mandatory")) {
                                WinJS.Utilities.addClass(mandatoryField, "empty-mandatory");
                                valueHasChanged = true;
                            }
                        }
                        if (valueHasChanged && AppBar.notifyModified) {
                            that.delayedSaveData();
                        } else if (delayedSaveDataPromise) {
                            that.delayedSaveData();
                        }
                    }
                }
            };
            this.handleValueChanged = handleValueChanged;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    Application.navigateById("questionnaireRemote", event);
                    Log.ret(Log.l.trace);
                },
                clickOpen: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    Application.navigateById("photoRemote", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickShare: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    that.saveData();
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
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
                blockEnterKey: function (event) {
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward")
                            AppBar.commandList[i].key = null;
                    }
                },
                releaseEnterKey: function (event) {
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward")
                            AppBar.commandList[i].key = WinJS.Utilities.Key.enter;
                    }
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "ContactRemote.Controller.");
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            AppData._persistentStates.veranstoption = {};
                            AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            Application.pageframe.savePersistentStates();
                            that.binding.doEdit = false;
                            that.binding.generalData.notAuthorizedUser = false;
                            that.binding.enableChangePassword = false;
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
                clickNew: function () {
                    if (AppData._persistentStates.disableCaptureContactsButton || AppData._persistentStates.inActiveUser) {
                        return true;
                    } else {
                        if (that.binding.dataContact && that.binding.dataContact.KontaktVIEWID) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                clickDelete: function () {
                    if (that.binding.dataContact && that.binding.dataContact.KontaktVIEWID && !AppBar.busy) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickOpen: function () {
                    if (getPhotoData()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickForward: function () {
                    that.handleValueChanged(); //handle mandatory value changed!
                    return AppBar.busy;
                },
                clickShare: function () {
                    if (that.binding.dataContact && that.binding.dataContact.KontaktVIEWID) {
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
                }
            }

            var loadInitSelection = function () {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                if (typeof that.binding.dataContact.KontaktVIEWID !== "undefined") {
                    var map, results, curIndex;
                    if (typeof that.binding.dataContact.INITAnredeID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initAnredeData: Id=" + that.binding.dataContact.INITAnredeID + "...");
                        map = AppData.initAnredeView.getMap();
                        results = AppData.initAnredeView.getResults();
                        if (map && results) {
                            curIndex = map[that.binding.dataContact.INITAnredeID];
                            if (typeof curIndex !== "undefined") {
                                that.setInitAnredeItem(results[curIndex]);
                            }
                        }
                    }
                    if (typeof that.binding.dataContact.INITLandID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initLandData: Id=" + that.binding.dataContact.INITLandID + "...");
                        map = AppData.initLandView.getMap();
                        results = AppData.initLandView.getResults();
                        if (map && results) {
                            curIndex = map[that.binding.dataContact.INITLandID];
                            if (typeof curIndex !== "undefined") {
                                that.setInitLandItem(results[curIndex]);
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return WinJS.Promise.as();
            }
            this.loadInitSelection = loadInitSelection;

            var loadData = function () {
                var promises = [];
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initAnredeView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initAnredeData...");
                        //@nedra:25.09.2015: load the list of INITAnrede for Combobox
                        var initAnredeSelectPromise = AppData.initAnredeView.select(function (json) {
                            Log.print(Log.l.trace, "initAnredeView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initAnrede && initAnrede.winControl) {
                                    that.initAnredeList = new WinJS.Binding.List(json.d.results);
                                    initAnrede.winControl.data = that.initAnredeList.createFiltered(initAnredeFilter);
                                }
                            }
                            that.removeDisposablePromise(initAnredeSelectPromise);
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            that.removeDisposablePromise(initAnredeSelectPromise);
                        });
                        promises.push(that.addDisposablePromise(initAnredeSelectPromise));
                    } else {
                        if (initAnrede && initAnrede.winControl) {
                            that.initAnredeList = new WinJS.Binding.List(AppData.initAnredeView.getResults());
                            initAnrede.winControl.data = that.initAnredeList.createFiltered(initAnredeFilter);
                        }
                    }
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        var initLandSelectPromise = AppData.initLandView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initLand && initLand.winControl) {
                                    that.initLandList = new WinJS.Binding.List(json.d.results);
                                    that.initLandList.sort(function (a, b) {
                                        if (a.TITLE === null && b.TITLE === null) return 0;
                                        if (a.TITLE === null) return -1;  // a zuerst
                                        if (b.TITLE === null) return 1;   // b zuerst
                                        return a.TITLE.localeCompare(b.TITLE, 'de', 'en', 'fr', 'it', { sensitivity: 'base' });
                                    });
                                    if (that.binding.generalData.countryOption &&
                                        that.binding.generalData.countryOptionID) {
                                        for (var i = 0; i < that.initLandList.length; i++) {
                                            var item = that.initLandList.getAt(i);
                                            if (item && item.INITLandID === parseInt(that.binding.generalData.countryOptionID)) {
                                                //that.initLandList.unshift(item);
                                                that.initLandList.splice(1, 0, item);
                                                break;
                                            }
                                        }
                                    }
                                    initLand.winControl.data = that.initLandList;
                                }
                            }
                            that.removeDisposablePromise(initLandSelectPromise);
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            that.removeDisposablePromise(initLandSelectPromise);
                        });
                        promises.push(that.addDisposablePromise(initLandSelectPromise));
                    } else {
                        if (initLand && initLand.winControl) {
                            that.initLandList = new WinJS.Binding.List(AppData.initLandView.getResults());
                            that.initLandList.sort(function (a, b) {
                                if (a.TITLE === null && b.TITLE === null) return 0;
                                if (a.TITLE === null) return -1;  // a zuerst
                                if (b.TITLE === null) return 1;   // b zuerst
                                return a.TITLE.localeCompare(b.TITLE, 'de', 'en', 'fr', 'it', { sensitivity: 'base' });
                            });
                            if (that.binding.generalData.countryOption &&
                                that.binding.generalData.countryOptionID) {
                                for (var i = 0; i < that.initLandList.length; i++) {
                                    var item = that.initLandList.getAt(i);
                                    if (item && item.INITLandID === parseInt(that.binding.generalData.countryOptionID)) {
                                        //that.initLandList.unshift(item);
                                        that.initLandList.splice(1, 0, item);
                                        break;
                                    }
                                }
                            }
                            initLand.winControl.data = that.initLandList;
                        }
                    }
                    var contactMandatorySelectPromise = ContactRemote.mandatoryView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "MandatoryList.mandatoryView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            //that.nextUrl = MandatoryList.mandatoryView.getNextUrl(json);
                            that.removeMandatory();
                            var results = json.d.results;
                            results.forEach(function (item, index) {
                                that.resultMandatoryConverter(item, index);
                            });
                        }
                        that.removeDisposablePromise(contactMandatorySelectPromise);
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        that.removeDisposablePromise(contactMandatorySelectPromise);
                    }, {
                            LanguageSpecID: AppData.getLanguageId()
                        });
                    promises.push(that.addDisposablePromise(contactMandatorySelectPromise));
                    return WinJS.Promise.join(promises);
                }).then(function () {
                    var recordId = getRecordId();
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactView...");
                        var contactSelectPromise = ContactRemote.contactView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "contactView: success!");
                            if (json && json.d) {
                                // now always edit!
                                json.d.Flag_NoEdit = AppRepl.replicator && AppRepl.replicator.inFastRepl;
                                that.setDataContact(json.d);
                                AppData.generalData.setRecordId("DOC1IMPORT_CARDSCAN_Remote", json.d.DOC1Import_CardscanID);
                            }
                            that.removeDisposablePromise(contactSelectPromise);
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                            that.removeDisposablePromise(contactSelectPromise);
                        }, recordId);
                        return that.addDisposablePromise(contactSelectPromise);
                    } else {
                        that.setDataContact(getEmptyDefaultValue(ContactRemote.contactView.defaultValue));
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    promises = [];
                    // Kommentar (neues Feld aus KontaktNotiz)
                    var recordId = getRecordId();
                    if (recordId) {
                        promises.push(loadInitSelection());
                        if (getPhotoData()) {
                            showPhoto();
                        } else {
                            var importCardscanId = AppData.generalData.getRecordId("DOC1IMPORT_CARDSCAN_Remote");
                            if (importCardscanId) {
                                // todo: load image data and set src of img-element
                                Log.print(Log.l.trace, "calling select cardScanView...");
                                var cardscanSelectPromise = ContactRemote.cardScanView.select(function (json) {
                                    AppData.setErrorMsg(that.binding);
                                    Log.print(Log.l.trace, "cardScanData: success!");
                                    if (json && json.d) {
                                        var docContent;
                                        if (json.d.wFormat === 1) {
                                            docContent = json.d.PrevContentDOCCNT2;
                                        } else {
                                            docContent = json.d.DocContentDOCCNT1;
                                        }
                                        if (docContent) {
                                            var sub = docContent.search("\r\n\r\n");
                                            if (sub >= 0) {
                                                var data = docContent.substr(sub + 4);
                                                if (data && data !== "null") {
                                                    AppData._remotePhotoData = data;
                                                } else {
                                                    AppData._remotePhotoData = null;
                                                }
                                            } else {
                                                AppData._remotePhotoData = null;
                                            }
                                        } else {
                                            AppData._remotePhotoData = null;
                                        }
                                    } else {
                                        AppData._remotePhotoData = null;
                                    }
                                    showPhoto();
                                    that.removeDisposablePromise(cardscanSelectPromise);
                                }, function (errorResponse) {
                                    Log.print(Log.l.error, "select cardScanView: error!");
                                    AppData._remotePhotoData = null;
                                    showPhoto();
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    that.removeDisposablePromise(cardscanSelectPromise);
                                }, importCardscanId);
                                promises.push(that.addDisposablePromise(cardscanSelectPromise));
                            } else {
                                Log.print(Log.l.trace, "no cardScanView importCardscanId selected");
                                AppData._remotePhotoData = null;
                                showPhoto();
                            }
                        }
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select contactNoteView...");
                        var contactNoteSelectPromise = ContactRemote.contactNoteView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            if (json && json.d && json.d.results && json.d.results.length > 0) {
                                Log.print(Log.l.trace, "contactNoteView: success!");
                                that.setDataContactNote(json.d.results[0]);
                            } else {
                                Log.print(Log.l.trace, "contactNoteView: not data found!");
                                that.setDataContactNote(getEmptyDefaultValue(ContactRemote.contactNoteView.defaultValue));
                            }
                            that.removeDisposablePromise(contactNoteSelectPromise);
                        }, function (errorResponse) {
                            AppData.setErrorMsg(that.binding, errorResponse);
                            that.removeDisposablePromise(contactNoteSelectPromise);
                        }, {
                            KontaktID: recordId,
                            DocGroup: 3,
                            DocFormat: 4025
                        });
                        promises.push(that.addDisposablePromise(contactNoteSelectPromise));
                        var sketchSelectPromise = ContactRemote.sketchView.select(function (jsonSketch) {
                            Log.print(Log.l.trace, "sketchView: success!");
                            if (jsonSketch.d && jsonSketch.d.results && jsonSketch.d.results.length > 0) {
                                NavigationBar.enablePage("sketchRemote");
                            } else {
                                NavigationBar.disablePage("sketchRemote");
                            }
                            that.removeDisposablePromise(sketchSelectPromise);
                        }, function () {
                            Log.print(Log.l.error, "sketchView: error!");
                            NavigationBar.disablePage("sketchRemote");
                            that.removeDisposablePromise(sketchSelectPromise);
                        }, {
                            KontaktID: recordId
                        });
                        promises.push(that.addDisposablePromise(sketchSelectPromise));
                        return WinJS.Promise.join(promises);
                    } else {
                        that.setDataContactNote(getEmptyDefaultValue(ContactRemote.contactNoteView.defaultValue));
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // save data
            var mergeRecord = function (prevRecord, newRecord) {
                Log.call(Log.l.u1, "ContactRemote.Controller.");
                var ret = false;
                for (var prop in newRecord) {
                    if (newRecord.hasOwnProperty(prop)) {
                        if (newRecord[prop] !== prevRecord[prop]) {
                            prevRecord[prop] = newRecord[prop];
                            ret = true;
                        }
                    }
                }
                Log.ret(Log.l.u1, ret);
                return ret;
            }
            this.mergeRecord = mergeRecord;

            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "ContactRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret;
                var err = null;
                var doReload = false;
                var dataContact = that.binding.dataContact;
                var dataContactNote = that.binding.dataContactNote;
                // set Nachbearbeitet empty!
                if (dataContact.complete) {
                    dataContact.Nachbearbeitet = null;
                } else {
                    dataContact.Nachbearbeitet = 1;
                }
                if (dataContact && AppBar.modified && !AppBar.busy) {
                    var recordId = getRecordId();
                    if (recordId) {
                        AppBar.busy = true;
                        ret = new WinJS.Promise.as().then(function () {
                            var dataSketch = {
                                KontaktID: getRecordId(),
                                Titel: "Kommentar/Comment",
                                DocGroup: 3,
                                DocFormat: 4025,
                                ExecAppTypeID: 2,
                                Quelltext: dataContactNote.Quelltext || ""
                            };
                            if (dataContactNote.KontaktNotizVIEWID) {
                                dataSketch.KontaktNotizVIEWID = dataContactNote.KontaktNotizVIEWID;
                                if (that.mergeRecord(that.prevDataContactNote, dataSketch)) {
                                    return ContactRemote.contactNoteView.update(function (response) {
                                        // called asynchronously if ok
                                        Log.print(Log.l.info, "contactData update: success!");
                                        doReload = true;
                                    }, function (errorResponse) {
                                        AppBar.busy = false;
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        if (typeof error === "function") {
                                            error(errorResponse);
                                        }
                                    }, dataContactNote.KontaktNotizVIEWID, dataSketch);
                                } else {
                                    return WinJS.Promise.as();
                                }
                            } else if (dataContactNote.Quelltext) {
                                return ContactRemote.contactNoteView.insert(function (json) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    Log.print(Log.l.trace, "contactData insert: success!");
                                    doReload = true;
                                },  function (errorResponse) {
                                    AppBar.busy = false;
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    if (typeof error === "function") {
                                        error(errorResponse);
                                    }
                                }, dataSketch);
                            } else {
                                return WinJS.Promise.as();
                            }
                        }).then(function () {
                            if (that.mergeRecord(that.prevDataContact, dataContact)) {
                                return ContactRemote.contactView.update(function (response) {
                                    AppBar.busy = false;
                                    // called asynchronously if ok
                                    Log.print(Log.l.info, "contactData update: success!");
                                    doReload = true;
                                    AppBar.modified = false;
                                }, function (errorResponse) {
                                    AppBar.busy = false;
                                    err = errorResponse;
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    if (typeof error === "function") {
                                        error(errorResponse);
                                    }
                                }, recordId, dataContact);
                            } else {
                                return WinJS.Promise.as();
                            }
                        }).then(function () {
                            if (!err) {
                                if (typeof complete === "function") {
                                    complete(that.binding.dataContact);
                                } else if (doReload) {
                                    that.loadData();
                                }
                            }
                        });
                    } else {
                        if (typeof error === "function") {
                            var errorResponse = { status: 0, statusText: "no record selected" };
                            error(errorResponse);
                        }
                        ret = WinJS.Promise.as();
                    }
                } else if (AppBar.busy) {
                    ret = WinJS.Promise.timeout(100).then(function () {
                        return that.saveData(complete, error);
                    });
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete(dataContact);
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;

            var delayedSaveData = function () {
                if (delayedSaveDataPromise) {
                    delayedSaveDataPromise.cancel();
                }
                delayedSaveDataPromise = WinJS.Promise.timeout(150).then(function () {
                    that.saveData();
                    that.removeDisposablePromise(delayedSaveDataPromise);
                    delayedSaveDataPromise = null;
                });
                that.addDisposablePromise(delayedSaveDataPromise);
            }
            this.delayedSaveData = delayedSaveData;

            // set  Nachbearbeitet
            this.binding.dataContact.Nachbearbeitet = 1;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();


