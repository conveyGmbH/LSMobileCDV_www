﻿// controller for page: start
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/start/startService.js" />
/// <reference path="~/plugins/com.syonet.mobile.featuredetection/www/featureDetection.js" />

/*
 Structure of states to be set from external modules:
 {
    networkState: newNetworkstate:
 }
*/

(function () {
    "use strict";

    WinJS.Namespace.define("Start", {
        prevWidth: 0,
        prevHeight: 0,
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Start.Controller.");

            Application.Controller.apply(this, [pageElement, {
                dataContact: {},
                dataBereich: {}
            }, commandList]);

            var that = this;

            var imgSrcDataType = "data:image/jpeg;base64,";

            var listView = pageElement.querySelector("#startActions.listview");
            if (listView && listView.winControl) {
                listView.winControl.itemDataSource = null;
                if (listView.style) {
                    listView.style.visibility = "hidden";
                }
            }
            var layout = null;
            var actions = Start.actions;
            var refreshConfirmModalPromise = null;

            this.dispose = function () {
                if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
            }

            var recentTemplate = pageElement.querySelector(".startActions-recent-template").winControl;
            var listTemplate = pageElement.querySelector(".startActions-list-template").winControl;
            var newTemplate = pageElement.querySelector(".startActions-new-template").winControl;
            // Conditional renderer that chooses between templates
            var listStartRenderer = function (itemPromise) {
                return itemPromise.then(function (item) {
                    if (item.data.id === "recent") {
                        return recentTemplate.renderItem(itemPromise);
                    } else if (item.data.id === "list") {
                        return listTemplate.renderItem(itemPromise);
                    } else if (item.data.id === "new") {
                        return newTemplate.renderItem(itemPromise);
                    } else {
                        return null;
                    }
                });
            };
            this.listStartRenderer = listStartRenderer;

            // define data handling standard methods
            var getRecordId = function () {
                return AppData.getRecordId("Kontakt");
            };
            this.getRecordId = getRecordId;

            var showButtonElement = function (buttonElement) {
                Log.call(Log.l.trace, "Start.Controller.");
                var ret = null;
                if (buttonElement) {
                    if (buttonElement.parentElement && buttonElement.parentElement.style &&
                        buttonElement.parentElement.style.visibility !== "visible") {
                        ret = WinJS.Promise.timeout(Math.floor(Math.random() * 150) + 50).then(function () {
                            buttonElement.parentElement.style.visibility = "visible";
                            var tile = buttonElement.parentElement;
                            while (tile && !WinJS.Utilities.hasClass(tile, "tile")) {
                                tile = tile.parentElement;
                            }
                            if (tile) {
                                var headerElement = tile.querySelector(".tile-content-inner");
                                if (headerElement && headerElement.style &&
                                    headerElement.style.visibility !== "visible") {
                                    headerElement.style.visibility = "visible";
                                }
                            }
                            return WinJS.UI.Animation.enterPage(buttonElement);
                        });
                    }
                }
                if (!ret) {
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            }

            var imageRotate = function (element) {
                Log.call(Log.l.trace, "ContactList.Controller.");
                if (element && typeof element.querySelector === "function") {
                    var img = element.querySelector(".list-compressed-doc");
                    if (img && img.src && img.src.substr(0, imgSrcDataType.length) === imgSrcDataType) {
                        var imgWidth = img.naturalWidth;
                        var imgHeight = img.naturalHeight;
                        Log.print(Log.l.trace, "img width=" + imgWidth + " height=" + imgHeight);
                        if (imgWidth && imgHeight) {
                            if (imgWidth < imgHeight && img.style) {
                                var containerElement = img.parentNode;
                                if (containerElement) {
                                    var marginLeft = (imgWidth - imgHeight) * containerElement.clientWidth / imgHeight / 2;
                                    var marginTop = (imgHeight - imgWidth) * containerElement.clientWidth / imgHeight / 2;
                                    img.style.marginLeft = -marginLeft + "px";
                                    img.style.marginTop = -marginTop + "px";
                                    img.style.height = containerElement.clientWidth + "px";
                                }
                                if (AppData._persistentStates.turnThumbsLeft) {
                                    img.style.transform = "rotate(270deg)";
                                } else {
                                    img.style.transform = "rotate(90deg)";
                                }
                                img.style.width = "auto";
                            }
                        } else {
                            WinJS.Promise.timeout(0).then(function () {
                                that.imageRotate(element);
                            });
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.imageRotate = imageRotate;

            // show business card photo
            var showPhoto = function () {
                Log.call(Log.l.trace, "Start.Controller.");
                var businessCardContainer = listView.querySelector("#businessCardContact");
                if (!businessCardContainer) {
                    WinJS.Promise.timeout(150).then(function () {
                        that.showPhoto();
                    });
                } else {
                    if (!businessCardContainer.firstChild) {
                        if (AppData._photoData) {
                            that.img = new Image();
                            that.img.id = "startImage";
                            businessCardContainer.appendChild(that.img);
                            WinJS.Utilities.addClass(that.img, "list-compressed-doc");
                            that.img.src = imgSrcDataType + AppData._photoData;
                            that.imageRotate(businessCardContainer);
                        }
                    }
                    showButtonElement(businessCardContainer.parentElement);
                }
                Log.ret(Log.l.trace);
            };
            this.showPhoto = showPhoto;

            var disableButton = function (button, bDisabled) {
                bDisabled = !!bDisabled;
                Log.call(Log.l.trace, "Start.Controller.", "bDisabled=" + bDisabled);
                if (button && (button.disabled !== bDisabled || (bDisabled && !button.svgLoaded))) {
                    button.disabled = bDisabled;
                    var elements = button.querySelectorAll("span");
                    for (var l = 0; l < elements.length; l++) {
                        if (bDisabled) {
                            elements[l].style.color = "#808080";
                        } else {
                            elements[l].style.color = "#f0f0f0";
                        }
                    }
                    // now only light gray symbols used!
                    var svgObjects = button.querySelectorAll(".action-image-list, .action-image-new");
                    for (var i = 0; i < svgObjects.length; i++) {
                        var svgObject = svgObjects[i];
                        if (svgObjects.length > 1) {
                            var svgParent = svgObject.parentElement;
                            if (WinJS.Utilities.hasClass(svgParent, "action-image-container-disconnect")) {
                                svgParent.style.display = bDisabled ? "inline-block" : "none";
                            } else {
                                svgParent.style.display = bDisabled ? "none" : "inline-block";
                            }
                        }
                        if (svgObject) {
                            var svgRoot = svgObject.firstChild;
                            Colors.changeSVGColor(svgRoot, bDisabled ? "#808080" : "#f0f0f0", true, false);
                            button.svgLoaded = true;
                        }
                    }
                }
                Log.ret(Log.l.trace);
            };

            var checkListButtonStates = function (buttonElement) {
                Log.call(Log.l.trace, "Start.Controller.");
                var buttons = listView.querySelectorAll(".tile-button");
                if (buttons && buttons.length > 0) {
                    for (var j = 0; j < buttons.length; j++) {
                        var button = buttons[j];
                        if (buttonElement && buttonElement !== button) {
                            continue;
                        }
                        switch (button.name) {
                            case "listRemote":
                            case "search": {
                                disableButton(button, AppData.appSettings.odata.serverFailure);
                            }
                                break;
                            case "barcode": {
                                disableButton(button, AppData._persistentStates.disableCaptureContactsButton ||
                                    AppData._persistentStates.inActiveUser ||
                                    AppData._persistentStates.hideBarcodeScan ||
                                    (!AppData._persistentStates.cameraFeatureSupported &&
                                        !AppData._persistentStates.useBarcodeActivity));
                            }
                                break;
                            case "camera": {
                                disableButton(button, AppData._persistentStates.disableCaptureContactsButton ||
                                    AppData._persistentStates.inActiveUser ||
                                    AppData._persistentStates.hideCameraScan ||
                                    !AppData._persistentStates.cameraFeatureSupported);
                            }
                                break;
                            case "newContact": {
                                disableButton(button, AppData._persistentStates.disableCaptureContactsButton ||
                                    AppData._persistentStates.inActiveUser ||
                                    AppData._persistentStates.hideManually);
                            }
                        }
                        if (buttonElement) {
                            break;
                        }
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.checkListButtonStates = checkListButtonStates;

            var resetSvgLoaded = function () {
                Log.call(Log.l.trace, "Start.Controller.");
                var buttons = listView.querySelectorAll("button");
                if (buttons && buttons.length > 0) {
                    for (var j = 0; j < buttons.length; j++) {
                        buttons[j].svgLoaded = false;
                    }
                }
                Log.ret(Log.l.trace);
            };

            var updateActions = function (bReload) {
                Log.call(Log.l.trace, "Start.Controller.");
                if (bReload) {
                    that.loadData();
                } else if (listView && listView.winControl) {
                    var updateAction = function (i, actionLine) {
                        WinJS.Promise.timeout(20).then(function () {
                            if (actions && typeof actions.setAt === "function") {
                                actions.setAt(i, actionLine);
                                that.checkListButtonStates();
                                if (i === 0) {
                                    that.showPhoto();
                                };
                            }
                        });
                    }
                    for (var i = 0; i < actions.length; i++) {
                        var content;
                        var changed = false;
                        var actionLine = actions.getAt(i);
                        if (actionLine.id === "recent" && actionLine.button0) {
                            Log.print(Log.l.trace, "found showContact in row=" + i.toString());
                            var dataContact = that.binding.dataContact;
                            if (typeof dataContact.KontaktVIEWID !== "undefined") {
                                if (actionLine.button0.Name !== dataContact.Name ||
                                    actionLine.button0.Firmenname !== dataContact.Firmenname ||
                                    actionLine.button0.EMail !== dataContact.EMail ||
                                    actionLine.button0.KontaktVIEWID !== dataContact.KontaktVIEWID ||
                                    actionLine.button0.ModifiedTS !== dataContact.ModifiedTS) {
                                    actionLine.button0.KontaktVIEWID = dataContact.KontaktVIEWID;
                                    actionLine.button0.Name = dataContact.Name;
                                    actionLine.button0.Firmenname = dataContact.Firmenname;
                                    actionLine.button0.EMail = dataContact.EMail;
                                    actionLine.button0.content = dataContact.CreatorSiteID + "/" + dataContact.CreatorRecID;
                                    if (dataContact.Erfassungsdatum && dataContact.ModifiedTS) {
                                        if (dataContact.Erfassungsdatum === actionLine.button0.ModifiedTS) {
                                            actionLine.button0.modifiedOn = getResourceText("contact.editedOn");
                                            actionLine.button0.editedOn = "";
                                            actionLine.button0.ModifiedTS = "";
                                            actionLine.button0.showModified = false;
                                        } else {
                                            actionLine.button0.modifiedOn = getResourceText("contact.modifiedOn");
                                            actionLine.button0.editedOn = getResourceText("contact.editedOn");
                                            actionLine.button0.ModifiedTS = dataContact.ModifiedTS;
                                            actionLine.button0.showModified = true;
                                        }
                                        actionLine.button0.Erfassungsdatum = dataContact.Erfassungsdatum;
                                    } else if (dataContact.Erfassungsdatum) {
                                        actionLine.button0.modifiedOn = "";
                                        actionLine.button0.editedOn = getResourceText("contact.editedOn");
                                        actionLine.button0.Erfassungsdatum = dataContact.Erfassungsdatum;
                                        actionLine.button0.ModifiedTS = "";
                                        actionLine.button0.showModified = false;
                                    } else if (dataContact.ModifiedTS) {
                                        actionLine.button0.modifiedOn = getResourceText("contact.modifiedOn");
                                        actionLine.button0.editedOn = "";
                                        actionLine.button0.Erfassungsdatum = dataContact.ModifiedTS;
                                        actionLine.button0.ModifiedTS = "";
                                        actionLine.button0.showModified = false;
                                    } else {
                                        actionLine.button0.modifiedOn = "";
                                        actionLine.button0.editedOn = "";
                                        actionLine.button0.Erfassungsdatum = "";
                                        actionLine.button0.ModifiedTS = "";
                                        actionLine.button0.showModified = false;
                                    }
                                    changed = true;
                                }
                                if (AppData._photoData) {
                                    if (!actionLine.button0.showBusinessCard ||
                                        actionLine.button0.svg) {
                                        actionLine.button0.showBusinessCard = true;
                                        actionLine.button0.svg = "";
                                        changed = true;
                                    }
                                } else if (AppData._barcodeRequest) {
                                    var newSvg = (AppData._barcodeType === "barcode") ? "barcode" : "barcode-qr";
                                    if (actionLine.button0.showBusinessCard ||
                                        actionLine.button0.svg !== newSvg) {
                                        actionLine.button0.showBusinessCard = false;
                                        actionLine.button0.svg = newSvg;
                                        changed = true;
                                    }
                                } else {
                                    if (actionLine.button0.showBusinessCard ||
                                        actionLine.button0.svg) {
                                        actionLine.button0.showBusinessCard = false;
                                        actionLine.button0.svg = "manuel_Portal";
                                        changed = true;
                                    }

                                }
                            } else if (actionLine.button0.KontaktVIEWID !== null ||
                                actionLine.button0.Name !== "" ||
                                actionLine.button0.Firmenname !== "" ||
                                actionLine.button0.EMail !== "") {
                                actionLine.button0.KontaktVIEWID = null;
                                actionLine.button0.content = "";
                                actionLine.button0.Name = "";
                                actionLine.button0.Firmenname = "";
                                actionLine.button0.EMail = "";
                                actionLine.button0.ModifiedTS = "";
                                actionLine.button0.showContact = false;
                                actionLine.button0.showBusinessCard = false;
                                actionLine.button0.Erfassungsdatum = "";
                                actionLine.button0.showModified = false;
                                actionLine.button0.modifiedOn = "";
                                actionLine.button0.editedOn = "";
                                changed = true;
                            }
                        } else if (actionLine.id === "list") {
                            content = getResourceText("start.buttonListLocal") + ": " + AppData.generalData.contactCountLocal;
                            if (actionLine.button0 && content !== actionLine.button0.content) {
                                actionLine.button0.content = content;
                                changed = true;
                            }
                            content = getResourceText("start.buttonListRemote") + ": " + AppData.generalData.contactCountRemote;
                            if (actionLine.button1 && content !== actionLine.button1.content) {
                                actionLine.button1.content = content;
                                changed = true;
                            }
                        } else if (actionLine.id === "new") {
                            content = AppData._persistentStates.showQRCode ? getResourceText("start.buttonQRCode") : getResourceText("start.buttonBarcode");
                            if (actionLine.button1 && content !== actionLine.button1.content) {
                                actionLine.button1.content = content;
                                actionLine.button1.svg = AppData._persistentStates.showQRCode ? "barcode-qr" : "barcode";
                                changed = true;
                            }
                        }
                        if (changed) {
                            updateAction(i, actionLine);
                        }
                    }
                    that.checkListButtonStates();
                }
                Log.ret(Log.l.trace);
            };
            this.updateActions = updateActions;

            var setRecordId = function (recordId) {
                Log.call(Log.l.trace, "UserInfo.Controller.", recordId);
                AppData.setRecordId("CR_V_Bereich", recordId);
                Log.ret(Log.l.trace);
            };
            this.setRecordId = setRecordId;

            var loadData = function () {
                Log.call(Log.l.trace, "Start.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    var recordId = getRecordId();
                    if (!recordId) {
                        that.binding.dataContact = {};
                        return WinJS.Promise.as();
                    } else {
                        Log.print(Log.l.trace, "calling select startContact...");
                        return Start.contactView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "startContact: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                that.binding.dataContact = json.d;
                            }
                            return WinJS.Promise.as();
                        }, function (errorResponse) {
                            that.binding.dataContact = {};
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            return WinJS.Promise.as();
                        }, recordId).then();
                    }
                }).then(function () {
                    if (!AppData._photoData) {
                        var importCardscanId = AppData.getRecordId("DOC1IMPORT_CARDSCAN");
                        if (importCardscanId) {
                            // todo: load image data and set src of img-element
                            Log.print(Log.l.trace, "calling select contactView...");
                            return Start.cardScanView.select(function (json) {
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
                                        AppData._photoData = docContent.substr(sub + 4);
                                    }
                                }
                            }, function (errorResponse) {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }, importCardscanId);
                        } else {
                            return WinJS.Promise.as();
                        }
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (listView && listView.winControl &&
                        listView.winControl.itemDataSource) {
                        updateActions();
                    }
                    return WinJS.Promise.as();
                }).then(function () {
                    if (AppData._persistentStates.showvisitorFlow === 1 || AppData._persistentStates.showvisitorFlow === 2) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select benutzerView...");
                        return Start.benutzerView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "benutzerView: success!");
                            if (json && json.d) {
                                // that.setDataBenutzer(json.d);
                                var record = json.d.results[0];
                                setRecordId(record.CR_V_BereichID);
                            }
                        }, function (errorResponse) {
                            if (errorResponse.status === 404) {
                                // ignore NOT_FOUND error here!
                                //that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        }, null);
                    } else {
                        //that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var recordID = AppData.getRecordId("CR_V_Bereich");

                    if (AppData._persistentStates.showvisitorFlow === 1 || AppData._persistentStates.showvisitorFlow === 2 && recordID) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select benutzerView...");
                        return Start.cr_v_bereichView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "benutzerView: success!");
                            if (json && json.d) {
                                var record = json.d;
                                that.binding.dataBereich = json.d;
                                //AppData.generalData.area && AppData.generalData.inOut
                                if (record.Eingang && record.Ausgang) {
                                    AppData.generalData.inOut = "inOut";
                                    that.binding.dataBereich.inOut = "inOut";
                                } else if (record.Eingang) {
                                    AppData.generalData.inOut = "in";
                                    that.binding.dataBereich.inOut = "in";
                                } else if (record.Ausgang) {
                                    AppData.generalData.inOut = "out";
                                    that.binding.dataBereich.inOut = "out";
                                }
                                AppData.generalData.area = record.TITLE;
                                // that.setDataBenutzer(json.d);


                                //setRecordId(record.CR_V_BereichID);
                            }
                        }, function (errorResponse) {
                            if (errorResponse.status === 404) {
                                // ignore NOT_FOUND error here!
                                //that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        }, recordID);
                    } else {
                        //that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    /*if (!AppData._persistentStates.hideQuestionnaire) {
                    AppData.getPropertyFromInitoptionTypeID({
                        INITOptionTypeID: 20,
                            LocalValue: (AppData._persistentStates.showvisitorFlow === 1 || (AppData._persistentStates.showvisitorFlow === 2 && AppData.generalData.area && AppData.generalData.inOut)) ? "1" : (AppData._persistentStates.hideQuestionnaire ? "1" : "0")
                    });
                    }
                    if (!AppData._persistentStates.hideSketch) {
                    AppData.getPropertyFromInitoptionTypeID({
                        INITOptionTypeID: 21,
                            LocalValue: (AppData._persistentStates.showvisitorFlow === 1 || (AppData._persistentStates.showvisitorFlow === 2 && AppData.generalData.area && AppData.generalData.inOut)) ? "1" : (AppData._persistentStates.hideSketch ? "1" : "0")
                    });
                    }*/
                    if ((AppData._persistentStates.showvisitorFlow === 1 || (AppData._persistentStates.showvisitorFlow === 2 && AppData.generalData.area && AppData.generalData.inOut))) {
                        //NavigationBar.disablePage("privacy");
                        //NavigationBar.disablePage("search");
                        Application.navigateById("barcode");
                    }
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var resizeTiles = function () {
                if (Start.prevHeight > 0 && Start.prevWidth > 0 && actions && actions.length > 0) {
                    var tileHeaderHeight = 60;
                    var tileRecentHeight = 200;
                    var tileRowHeight = 96;
                    if (Start.prevWidth <= 499) {
                        tileHeaderHeight = 40;
                        tileRecentHeight = 160;
                    }
                    if (Start.prevHeight > (3 * tileHeaderHeight + tileRecentHeight + 2 * tileRowHeight)) {
                        tileRowHeight = Start.prevHeight / 3 - tileHeaderHeight;
                        if (tileRowHeight < tileRecentHeight) {
                            tileRowHeight = (Start.prevHeight - tileHeaderHeight - tileRecentHeight) / 2 -
                                tileHeaderHeight;
                        } else {
                            tileRowHeight = tileRecentHeight;
                            tileRecentHeight = Start.prevHeight - 2 * tileRowHeight - 3 * tileHeaderHeight;
                        }
                        tileRecentHeight += 2;
                        tileRowHeight += 2;
                    }
                    var tileRows = listView.querySelectorAll(".tile-row");
                    if (tileRows) for (var i = 0; i < tileRows.length; i++) {
                        var tileRow = tileRows[i];
                        if (tileRow.style) {
                            if (i === 0) {
                                tileRow.style.height = tileRecentHeight.toString() + "px";
                            } else {
                                tileRow.style.height = tileRowHeight.toString() + "px";
                                var top = ((tileRowHeight - 120) / 2);
                                if (top > 50) top = 50;
                                if (top < 0) top = 0;
                                if (tileRow.firstElementChild && tileRow.firstElementChild.style) {
                                    tileRow.firstElementChild.style.marginTop = top.toString() + "px";
                                }
                            }
                        }
                    }
                }
            }
            this.resizeTiles = resizeTiles;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickButton: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    var command = event.currentTarget;
                    if (command) {
                        Log.print(Log.l.trace, "clickButton event command.name=" + command.name);
                        if (command.name === "listRemote") {
                            // delete restriction on listRemote here!
                            // #7901 default show all contacts -> app user and import user
                            var restriction = {
                                KontaktVIEWID: "",
                                Firmenname: "",
                                Vorname: "",
                                Name: "",
                                Email: "",
                                Strasse: "",
                                PLZ: "",
                                Stadt: "",
                                useErfassungsdatum: false,
                                usemodifiedTS: false,
                                importFilter: true
                            };
                            AppData.setRestriction('Kontakt', restriction);
                        }
                        Application.navigateById(command.name, event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickSettings: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("settings", event);
                    Log.ret(Log.l.trace);
                },
                clickAccount: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("account", event);
                    Log.ret(Log.l.trace);
                },
                clickInfo: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("info", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    if (listView && listView.winControl) {
                        var i;
                        Log.print(Log.l.trace, "onLoadingStateChanged called loadingState=" + listView.winControl.loadingState);
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = Application.StartLayout.ActionsLayout;
                                listView.winControl.layout = { type: layout };
                            }
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            that.resizeTiles();
                        } else if (listView.winControl.loadingState === "complete") {
                            var showTileButton = function (svgInfo) {
                                var ret = null;
                                if (svgInfo.element &&
                                    svgInfo.element.parentNode) {
                                    var buttonElement = svgInfo.element.parentNode.parentNode;
                                    if (buttonElement) {
                                        ret = WinJS.Promise.timeout(20).then(function () {
                                            return showButtonElement(buttonElement);
                                        });
                                    }
                                }
                                if (!ret) {
                                    ret = WinJS.Promise.as();
                                }
                                return ret;
                            };
                            resetSvgLoaded();
                            var js = {};
                            js.recent = Colors.loadSVGImageElements(listView, "action-image-right", 80, Colors.textColor, "name", showTileButton);
                            js.list = Colors.loadSVGImageElements(listView, "action-image-list", 40, "#f0f0f0", "name", showTileButton);
                            js.new = Colors.loadSVGImageElements(listView, "action-image-new", 40, "#f0f0f0", "name", showTileButton, {
                                "barcode-qr": { useStrokeColor: false }
                            });
                            WinJS.Promise.join(js).then(function () {
                                if (listView.style) {
                                    listView.style.visibility = "visible";
                                }
                                if (!Application.pageframe.splashScreenDone) {
                                    WinJS.Promise.timeout(20).then(function () {
                                        return Application.pageframe.hideSplashScreen();
                                    });
                                }
                                return WinJS.Promise.timeout(20);
                            }).then(function () {
                                checkListButtonStates();
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
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
            };

            if (listView) {
                // add ListView event handler
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
            }

            if (device && device.platform === "Android" &&
                cordova && cordova.plugins &&
                cordova.plugins.featureDetection &&
                typeof cordova.plugins.featureDetection.camera === "function") {
                cordova.plugins.featureDetection.camera(function (result) {
                    Log.print(Log.l.trace, "featureDetection.camera returned: " + result);
                    AppData._persistentStates.cameraFeatureSupported = result;
                    updateActions();
                }, function (err) {
                    Log.print(Log.l.error, "featureDetection.camera failed: " + err);
                });
            }

            var refreshConfirmModal = function () {
                Log.call(Log.l.trace, "Start.Controller.");
                if (refreshConfirmModalPromise) {
                    Log.print(Log.l.info, "Cancelling previous refreshConfirmModalPromise");
                    refreshConfirmModalPromise.cancel();
                }
                if (!AppData._persistentStates.odata.replErrorTimestamp ||
                    AppData._persistentStates.odata.replErrorTimestamp + 15 * 60000 < Date.now()) {
                    return WinJS.Promise.as();
                }
                if (AppRepl.replicator.state === "error") {
                    var errorMsg = (AppRepl.replicator._err && AppData.getErrorMsgFromResponse(AppRepl.replicator._err)
                        ? AppData.getErrorMsgFromResponse(AppRepl.replicator._err)
                        : "");
                    Log.print(Log.l.error, errorMsg);
                    confirmModal(null,
                        getResourceText("start.replErrorMessage") + errorMsg,
                        getResourceText("start.confirmOk"),
                        null,
                        function (updateConfirmed) {
                            if (updateConfirmed) {
                                AppData._persistentStates.odata.replErrorTimestamp = Date.now();
                                Application.pageframe.savePersistentStates();
                                that.addDisposablePromise(refreshConfirmModalPromise);
                            }
                        });
                }
                var refreshMs = (AppData._persistentStates.odata.replInterval || 30) * 1000;
                if (refreshConfirmModalPromise) {
                    that.removeDisposablePromise(refreshConfirmModalPromise);
                }
                refreshConfirmModalPromise = WinJS.Promise.timeout(refreshMs).then(function () {
                    that.refreshConfirmModal();
                });
                that.addDisposablePromise(refreshConfirmModalPromise);
                Log.ret(Log.l.trace);
            }
            this.refreshConfirmModal = refreshConfirmModal;

            // finally, load the data
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete, now load data");
                if (listView && listView.winControl) {
                    // no list selection
                    if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.none) {
                        listView.winControl.selectionMode = WinJS.UI.SelectionMode.none;
                    }
                    // add ListView itemTemplate
                    listView.winControl.itemTemplate = that.listStartRenderer.bind(that);
                    // add ListView dataSource
                    listView.winControl.itemDataSource = actions.dataSource;
                }
                return WinJS.Promise.as();
            }).then(function () {
                Log.print(Log.l.trace, "List binding complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
                AppBar.notifyModified = true;
                if (device &&
                    (device.platform === "Android" || device.platform === "windows") &&
                    AppData.generalData.useBarcodeActivity &&
                    Barcode &&
                    !Barcode.listening) {
                    Barcode.startListenDelayed(250);
                }
                if (AppData.generalData.useExternalCamera &&
                    cordova.file.picturesDirectory &&
                    CameraGlobals &&
                    !CameraGlobals.listening) {
                    CameraGlobals.startListenDelayed(1000);
                }
                return WinJS.Promise.timeout(150);
            }).then(function () {
                that.showPhoto();
                if (!AppData._userRemoteDataPromise) {
                    AppData._curGetUserRemoteDataId = 0;
                    AppData.getUserRemoteData();
                    AppData.getCRVeranstOption();
                    AppData.getMobileVersion();
                }
            }).then(function () {
                var ret = new WinJS.Promise.as();
                if (AppData._movedSuccess === 0) {
                    ret = new WinJS.Promise.as().then(function () {
                        return AppData.getUserData();
                    }).then(function () {
                        return confirmModal(null, getResourceText("general.userChangedSuccess") + AppData._userData.VeranstaltungName, getResourceText("flyout.ok"), null, function (updateConfirmed) {
                            Log.print(Log.l.info, "updateMessage returned=" + updateConfirmed);
                            if (updateConfirmed) {
                                AppData._movedSuccess = null;
                            }
                            return WinJS.Promise.as();
                        });
                    });
                }
                return ret;
            }).then(function () {
                var refreshConfirmModalPromise = WinJS.Promise.timeout(5000).then(function () {
                    refreshConfirmModalPromise.cancel();
                    that.removeDisposablePromise(refreshConfirmModalPromise);
                    that.refreshConfirmModal();
                });
                that.addDisposablePromise(refreshConfirmModalPromise);
            });
            Log.ret(Log.l.trace);
        })
    });
})();
