// controller for page: start
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/start/startService.js" />

/*
 Structure of states to be set from external modules:
 {
    networkState: newNetworkstate:
 }
*/

(function () {
    "use strict";

    WinJS.Namespace.define("Start", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Start.Controller.");
            Application.Controller.apply(this, [pageElement, {
                InitLandItem: {},
                dataContact: {}
            }, commandList]);

            AppData._curGetUserRemoteDataId = 0;

            var that = this;

            var listView = pageElement.querySelector("#startActions.listview");
            var layout = null;
            var inReload = false;

            var recentTemplate = pageElement.querySelector(".startActions-recent-template").winControl;
            var listTemplate = pageElement.querySelector(".startActions-list-template").winControl;
            var newTemplate = pageElement.querySelector(".startActions-new-template").winControl;
            // Conditional renderer that chooses between templates
            var listStartRenderer = function(itemPromise) {
                return itemPromise.then(function(item) {
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
            var getRecordId = function() {
                return AppData.getRecordId("Kontakt");
            };
            this.getRecordId = getRecordId;


            // show business card photo
            var showPhoto = function() {
                var businessCardContainer;
                if (AppData._photoData) {
                    businessCardContainer = listView.querySelector("#businessCardContact");
                    if (businessCardContainer && !businessCardContainer.firstChild) {
                        that.img = new Image();
                        that.img.id = "startImage";
                        //if (businessCardContainer.style) {
                        //    businessCardContainer.style.display = "inline";
                        //}
                        businessCardContainer.appendChild(that.img);
                        WinJS.Utilities.addClass(that.img, "start-business-card");
                        that.img.src = "data:image/jpeg;base64," + AppData._photoData;
                    }
                } else if (AppData._barcodeRequest) {
                    businessCardContainer = listView.querySelector("#businessCardContact");
                    if (businessCardContainer && !businessCardContainer.firstChild) {
                        that.img = new Image();
                        that.img.id = "startImage";
                        //if (businessCardContainer.style) {
                        //    businessCardContainer.style.display = "inline";
                        //}
                        businessCardContainer.appendChild(that.img);
                        switch (AppData._barcodeType) {
                            case "barcode":
                                {
                                    WinJS.Utilities.addClass(that.img, "start-barcode");
                                    that.img.src = "images/barcode.jpg";
                                    var text = document.createElement("span");
                                    WinJS.Utilities.addClass(text, "start-barcode");
                                    var shortText = AppData._barcodeRequest.substr(0, 32);
                                    if (shortText.length < AppData._barcodeRequest.length) {
                                        shortText += "...";
                                    }
                                    text.textContent = shortText;
                                    businessCardContainer.appendChild(text);
                                }
                                break;
                            case "vcard":
                                {
                                    WinJS.Utilities.addClass(that.img, "start-vcard");
                                    that.img.src = "images/qrcode.jpg";
                                }
                                break;
                        }
                    }
                }
            };

            var disableButton = function (button, bDisabled) {
                bDisabled = !!bDisabled;
                Log.call(Log.l.trace, "Start.Controller.", "bDisabled=" + bDisabled);
                if (button && (button.disabled !== bDisabled || (bDisabled && !button.svgLoaded))) {
                    button.disabled = bDisabled;
                    var elements = button.querySelectorAll("span");
                    for (var l = 0; l < elements.length; l++) {
                        elements[l].style.color = bDisabled ? "#808080" : "#f0f0f0";
                    }
                    var svgObject = button.querySelector(".action-image-list, .action-image-new");
                    if (svgObject) {
                        var svgRoot = svgObject.firstChild;
                        Colors.changeSVGColor(svgRoot, bDisabled ? "#808080" : "#f0f0f0", true, false);
                        button.svgLoaded = true;
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
                                disableButton(button, AppData._persistentStates.hideBarcodeScan);
                            }
                            break;
                            case "camera": {
                                disableButton(button, AppData._persistentStates.hideCameraScan);
                            }
                            break;
                        }
                        break;
                    }
                }
                Log.ret(Log.l.trace);
            };
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

            var updateActions = function(bReload) {
                Log.call(Log.l.trace, "Start.Controller.");
                if (bReload) {
                    that.loadData();
                } else if (listView && listView.winControl) {
                    var svgFromContact = function(id) {
                        if (id === 3) {
                            return "office_building";
                        } else if (id === 2) {
                            return "businesswoman";
                        } else if (id === 1) {
                            return "businessperson";
                        } else {
                            return "user";
                        }
                    };
                    for (var i = 0; i < Start.actions.length; i++) {
                        var changed = false;
                        var actionLine = Start.actions.getAt(i);
                        if (actionLine.button0.id === "contact") {
                            Log.print(Log.l.trace, "found showContact in row=" + i.toString());
                            var dataContact = that.binding.dataContact;
                            var initLandItem = that.binding.InitLandItem;
                            if (typeof dataContact.KontaktVIEWID !== "undefined") {
                                if (actionLine.button0.Name !== dataContact.Name ||
                                    actionLine.button0.Firmenname !== dataContact.Firmenname ||
                                    actionLine.button0.PostAdresse !== dataContact.PostAdresse ||
                                    actionLine.button0.KontaktVIEWID !== dataContact.KontaktVIEWID ||
                                    actionLine.button0.ModifiedTS !== dataContact.ModifiedTS) {
                                    actionLine.button0.KontaktVIEWID = dataContact.KontaktVIEWID;
                                    actionLine.button0.Name = dataContact.Name;
                                    actionLine.button0.Firmenname = dataContact.Firmenname;
                                    actionLine.button0.PostAdresse = dataContact.PostAdresse;
                                    actionLine.button0.Freitext1 = dataContact.Freitext1;
                                    actionLine.button0.LandTITLE = "";
                                    actionLine.button0.ModifiedTS = dataContact.ModifiedTS;
                                    actionLine.button0.content = dataContact.CreatorSiteID + "/" + dataContact.CreatorRecID;
                                    if (!dataContact.Erfassungsdatum) {
                                        actionLine.button0.modifiedOn = getResourceText("contact.modifiedOn");
                                        actionLine.button0.editedOn = "";
                                        actionLine.button0.Erfassungsdatum = "";
                                        actionLine.button0.showErfassungsdatum = false;
                                    } else if (dataContact.Erfassungsdatum === actionLine.button0.ModifiedTS) {
                                        actionLine.button0.modifiedOn = getResourceText("contact.editedOn");
                                        actionLine.button0.editedOn = "";
                                        actionLine.button0.Erfassungsdatum = "";
                                        actionLine.button0.showErfassungsdatum = false;
                                    } else {
                                        actionLine.button0.modifiedOn = getResourceText("contact.modifiedOn");
                                        actionLine.button0.editedOn = getResourceText("contact.editedOn");
                                        actionLine.button0.Erfassungsdatum = dataContact.Erfassungsdatum;
                                        actionLine.button0.showErfassungsdatum = true;
                                    }
                                    changed = true;
                                }
                                if (typeof initLandItem.TITLE !== "undefined" &&
                                    actionLine.button0.LandTITLE !== initLandItem.TITLE) {
                                    actionLine.button0.LandTITLE = initLandItem.TITLE;
                                    changed = true;
                                }
                                if ((AppData._photoData || AppData._barcodeRequest) &&
                                    !actionLine.button0.Name &&
                                    !actionLine.button0.Firmenname &&
                                    !actionLine.button0.PostAdresse) {
                                    if (!actionLine.button0.showBusinessCard || actionLine.button0.showContact) {
                                        actionLine.button0.showContact = false;
                                        actionLine.button0.showBusinessCard = true;
                                        changed = true;
                                    }
                                    WinJS.Promise.timeout(50).then(function() {
                                        showPhoto();
                                    });
                                } else {
                                    if (actionLine.button0.showBusinessCard || !actionLine.button0.showContact) {
                                        actionLine.button0.showBusinessCard = false;
                                        actionLine.button0.showContact = true;
                                        changed = true;
                                    }
                                    if (actionLine.button0.INITAnredeID !== dataContact.INITAnredeID) {
                                        actionLine.button0.INITAnredeID = dataContact.INITAnredeID;
                                        actionLine.button0.svg = svgFromContact(dataContact.INITAnredeID);
                                        changed = true;
                                        WinJS.Promise.timeout(0).then(function() {
                                            listView.winControl.forceLayout();
                                        });
                                    }
                                }
                                if (changed) {
                                    Start.actions.setAt(i, actionLine);
                                }
                            } else if (actionLine.button0.KontaktVIEWID !== null ||
                                actionLine.button0.Name !== "" ||
                                actionLine.button0.Firmenname !== "" ||
                                actionLine.button0.PostAdresse !== "" ||
                                actionLine.button0.LandTITLE !== "" ||
                                actionLine.button0.INITAnredeID !== null) {
                                actionLine.button0.KontaktVIEWID = null;
                                actionLine.button0.content = "";
                                actionLine.button0.Name = "";
                                actionLine.button0.Firmenname = "";
                                actionLine.button0.PostAdresse = "";
                                actionLine.button0.LandTITLE = "";
                                actionLine.button0.ModifiedTS = "";
                                actionLine.button0.INITAnredeID = null;
                                actionLine.button0.showContact = false;
                                actionLine.button0.showBusinessCard = false;
                                actionLine.button0.Erfassungsdatum = "";
                                actionLine.button0.showErfassungsdatum = false;
                                actionLine.button0.modifiedOn = "";
                                actionLine.button0.editedOn = "";
                                Start.actions.setAt(i, actionLine);
                            }
                        } else if (actionLine.button0.id === "listLocal") {
                            var newButton0Content = getResourceText("start.buttonListLocal") + ": " + AppData.generalData.contactCountLocal;
                            if (newButton0Content !== actionLine.button0.content) {
                                actionLine.button0.content = newButton0Content;
                                changed = true;
                            }
                            var newButton1Content = getResourceText("start.buttonListRemote") + ": " + AppData.generalData.contactCountRemote;
                            if (newButton1Content !== actionLine.button1.content) {
                                actionLine.button1.content = newButton1Content;
                                changed = true;
                            }
                            if (changed) {
                                Start.actions.setAt(i, actionLine);
                            }
                        }
                    }
                    checkListButtonStates();
                }
                Log.ret(Log.l.trace);
            };
            this.updateActions = updateActions;

            var loadData = function() {
                Log.call(Log.l.trace, "Start.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (AppData._userRemoteDataPromise) {
                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                        AppData._userRemoteDataPromise.cancel();
                    }
                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(100).then(function () {
                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + 100 + "s is over!");
                        AppData._curGetUserRemoteDataId = 0;
                        AppData.getUserRemoteData();
                    });
                    var recordId = getRecordId();
                    if (!recordId) {
                        that.binding.dataContact = {};
                        that.binding.InitLandItem = {};
                        return WinJS.Promise.as();
                    } else {
                        Log.print(Log.l.trace, "calling select startContact...");
                        return Start.contactView.select(function(json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "startContact: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                that.binding.dataContact = json.d;
                            }
                            return WinJS.Promise.as();
                        }, function(errorResponse) {
                            that.binding.dataContact = {};
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            return WinJS.Promise.as();
                        }, recordId).then();
                    }
                }).then(function() {
                    if (typeof that.binding.dataContact.INITLandID !== "undefined" &&
                        !AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        return AppData.initLandView.select(function(json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                        }, function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function() {
                    if (typeof that.binding.dataContact.INITLandID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initLandData: Id=" + that.binding.dataContact.INITLandID + "...");
                        var map = AppData.initLandView.getMap();
                        var results = AppData.initLandView.getResults();
                        if (map && results) {
                            var curIndex = map[that.binding.dataContact.INITLandID];
                            if (typeof curIndex !== "undefined") {
                                that.binding.InitLandItem = results[curIndex];
                            }
                        }
                    }
                    return WinJS.Promise.as();
                }).then(function() {
                    if (!AppData._photoData) {
                        var importCardscanId = AppData.getRecordId("DOC1IMPORT_CARDSCAN");
                        if (importCardscanId) {
                            // todo: load image data and set src of img-element
                            Log.print(Log.l.trace, "calling select contactView...");
                            return Start.cardScanView.select(function(json) {
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
                            }, function(errorResponse) {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }, importCardscanId);
                        } else {
                            return WinJS.Promise.as();
                        }
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    updateActions();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

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
                                usemodifiedTS: false
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
                        var i, buttonElements, buttonElement;
                        Log.print(Log.l.trace, "onLoadingStateChanged called loadingState=" + listView.winControl.loadingState);
                        // no list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.none) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.none;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = Application.StartLayout.ActionsLayout;
                                listView.winControl.layout = { type: layout };
                            }
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            if (inReload) {
                                buttonElements = listView.querySelectorAll(".tile-button-wide, .tile-button");
                                for (i = 0; i < buttonElements.length; i++) {
                                    buttonElement = buttonElements[i];
                                    if (buttonElement.style) {
                                        buttonElement.style.visibility = "hidden";
                                    }
                                }
                            }
                        } else if (listView.winControl.loadingState === "viewportLoaded") {
                            if (inReload) {
                                buttonElements = listView.querySelectorAll(".tile-button-wide, .tile-button");
                                for (i = 0; i < buttonElements.length; i++) {
                                    buttonElement = buttonElements[i];
                                    if (buttonElement.style) {
                                        buttonElement.style.visibility = "hidden";
                                    }
                                }
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            buttonElements = listView.querySelectorAll(".tile-button-wide, .tile-button");
                            if (inReload) {
                                inReload = false;
                                for (i = 0; i < buttonElements.length; i++) {
                                    buttonElement = buttonElements[i];
                                    if (buttonElement.style) {
                                        buttonElement.style.visibility = "hidden";
                                    }
                                }
                            } 
                            var pageControl = pageElement.winControl;
                            if (pageControl && pageControl.prevWidth && pageControl.prevTileWidth && pageControl.prevTileHeight) {
                                for (i = 0; i < buttonElements.length; i++) {
                                    buttonElement = buttonElements[i];
                                    if (buttonElement.style) {
                                        if (WinJS.Utilities.hasClass(buttonElement, "tile-button-wide")) {
                                            buttonElement.style.width = pageControl.prevWidth + "px";
                                        } else {
                                            buttonElement.style.width = pageControl.prevTileWidth + "px";
                                        }
                                    }
                                }
                                var tileRows = listView.querySelectorAll(".tile-row, .start-photo-container");
                                for (i = 0; i < tileRows.length; i++) {
                                    var tileRow = tileRows[i];
                                    if (tileRow.style) {
                                        tileRow.style.height = pageControl.prevTileHeight + "px";
                                    }
                                }
                            }
                            var recentTile = pageElement.querySelector(".tile-recent");
                            if (recentTile) {
                                var elements = recentTile.querySelectorAll("span");
                                for (i = 0; i < elements.length; i++) {
                                    elements[i].style.color = Colors.textColor;
                                }
                                if (recentTile.style) {
                                    var tiles = listView.querySelectorAll(".tile");
                                    if (!tiles || !tiles.length) {
                                        listView.style.visibility = "hidden";
                                    }
                                }
                            }
                            var showTileButton = function (svgInfo) {
                                var ret = null;
                                if (svgInfo.element &&
                                    svgInfo.element.parentNode) {
                                    var buttonElement = svgInfo.element.parentNode.parentNode;
                                    if (buttonElement) {
                                        checkListButtonStates(buttonElement);
                                        if (buttonElement.style &&
                                            buttonElement.style.visibility !== "visible") {
                                            buttonElement.style.visibility = "visible";
                                            ret = WinJS.UI.Animation.enterPage(buttonElement);
                                        }
                                    }
                                }
                                if (!ret) {
                                    ret = WinJS.Promise.as();
                                }
                                return ret;
                            };

                            resetSvgLoaded();
                            var js = {};
                            js.recent = Colors.loadSVGImageElements(listView, "action-image-recent", 40, Colors.textColor, "name", showTileButton);
                            js.list = Colors.loadSVGImageElements(listView, "action-image-list", 40, "#f0f0f0", "name", showTileButton);
                            js.new = Colors.loadSVGImageElements(listView, "action-image-new", 40, "#f0f0f0", "name", showTileButton);

                            var promise = new WinJS.Promise.as().then(function () {
                                var pageControl = pageElement.winControl;
                                if (pageControl && pageControl.updateLayout) {
                                    pageControl.prevTileHeight = 0;
                                    pageControl.prevWidth = 0;
                                    pageControl.prevHeight = 0;
                                    return pageControl.updateLayout.call(pageControl, pageElement);
                                } else {
                                    return WinJS.Promise.as();
                                }
                            }).then(function () {
                                return WinJS.Promise.join(js);
                            }).then(function () {
                                if (!Application.pageframe.splashScreenDone) {
                                    return WinJS.Promise.timeout(100).then(function () {
                                        return Application.pageframe.hideSplashScreen();
                                    });
                                } else {
                                    return WinJS.Promise.as();
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function() {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            if (listView) {
                // add ListView event handler
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
            }

            // finally, load the data
            that.processAll().then(function() {
                Log.print(Log.l.trace, "Binding wireup page complete, now load data");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
                if (listView && listView.winControl) {
                    inReload = true;
                    // add ListView itemTemplate
                    listView.winControl.itemTemplate = that.listStartRenderer.bind(that);
                    // add ListView dataSource
                    listView.winControl.itemDataSource = Start.actions.dataSource;
                }
                Log.print(Log.l.trace, "List binding complete");
                AppBar.notifyModified = true;
            });
            Log.ret(Log.l.trace);
        })
    });
})();







