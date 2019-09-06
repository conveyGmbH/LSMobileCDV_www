// controller for page: start
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
                dataContact: {}
            }, commandList]);

            AppData._curGetUserRemoteDataId = 0;

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

            this.dispose = function() {
                if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
            }

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

            var showButtonElement = function (buttonElement) {
                Log.call(Log.l.trace, "Start.Controller.");
                var ret = null;
                if (buttonElement) {
                    if (buttonElement.parentElement && buttonElement.parentElement.style &&
                        buttonElement.parentElement.style.visibility !== "visible") {
                        ret = WinJS.Promise.timeout(Math.floor(Math.random() * 150) + 50).then(function() {
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
            var showPhoto = function() {
                Log.call(Log.l.trace, "Start.Controller.");
                var businessCardContainer = listView.querySelector("#businessCardContact");
                if (!businessCardContainer) {
                    WinJS.Promise.timeout(150).then(function() {
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
                        } else if (WinJS.Utilities.hasClass("text-lightcolor")) {
                            elements[l].style.color = "#f0f0f0";
                        } else {
                            elements[l].style.color = Colors.tileTextColor;
                        }

                    }
                    var svgObject = button.querySelector(".action-image-list");
                    if (svgObject) {
                        var svgRoot = svgObject.firstChild;
                        Colors.changeSVGColor(svgRoot, bDisabled ? "#808080" : Colors.tileTextColor, true, false);
                        button.svgLoaded = true;
                    }
                    svgObject = button.querySelector(".action-image-new");
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
                                disableButton(button,
                                    AppData._persistentStates.hideBarcodeScan ||
                                    (!AppData._persistentStates.cameraFeatureSupported &&
                                     !AppData._persistentStates.useBarcodeActivity));
                            }
                            break;
                            case "camera": {
                                disableButton(button,
                                    AppData._persistentStates.hideCameraScan ||
                                    !AppData._persistentStates.cameraFeatureSupported);
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

            var updateActions = function(bReload) {
                Log.call(Log.l.trace, "Start.Controller.");
                if (bReload) {
                    that.loadData();
                } else if (listView && listView.winControl) {
                    var updateAction = function(i, actionLine) {
                        WinJS.Promise.timeout(20).then(function() {
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
                        var changed = false;
                        var actionLine = actions.getAt(i);
                        if (actionLine.button0.id === "contact") {
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
                                if (changed) {
                                    updateAction(i, actionLine);
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
                                updateAction(i, actionLine);
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
                                updateAction(i, actionLine);
                            }
                        }
                    }
                    that.checkListButtonStates();
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
                    if (listView && listView.winControl &&
                        listView.winControl.itemDataSource) {
                        updateActions();
                    }
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var resizeTiles = function() {
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
                                        checkListButtonStates(buttonElement);
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
                            js.list = Colors.loadSVGImageElements(listView, "action-image-list", 40, Colors.tileTextColor, "name", showTileButton);
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

            if (device && device.platform === "Android" &&
                cordova && cordova.plugins &&
                cordova.plugins.featureDetection &&
                typeof cordova.plugins.featureDetection.camera === "function") {
                cordova.plugins.featureDetection.camera(function ( result ) {
                    Log.print(Log.l.trace, "featureDetection.camera returned: " + result);
                    AppData._persistentStates.cameraFeatureSupported = result;
                    updateActions();
                }, function ( err ) {
                    Log.print(Log.l.error, "featureDetection.camera failed: " + err );
                });
            }

            // finally, load the data
            that.processAll().then(function() {
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
                WinJS.Promise.timeout(150).then(function () {
                    that.showPhoto();
                });
            });
            Log.ret(Log.l.trace);
        })
    });
})();







