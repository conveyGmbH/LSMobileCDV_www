// controller for page: listLocal
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/listLocal/listLocalService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListLocal", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "ListLocal.Controller.");
            Application.Controller.apply(this, [pageElement, {
                showNumberContacts: "",
                showNumberUploaded: "",
                showNumberNotUploaded: "",
                showNumberInWork: "",
                uploaded: AppData.generalData.contactUploaded,
                notUploaded: AppData.generalData.contactNotUploaded,
                count: 0
            }, commandList]);
            this.nextUrl = null;
            this.nextDocUrl = null;
            this.loading = false;
            this.contacts = null;
            this.importCardScanIds = null;
            this.docs = null;

            this.firstDocsIndex = 0;
            this.firstContactsIndex = 0;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#listLocalContacts.listview");
            var listHeader = pageElement.querySelector("#listLocalContacts .list-header");

            this.dispose = function () {
                /*if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
                if (that.contacts) {
                    that.contacts = null;
                }*/
            }

            var progress = null;
            var counter = null;
            var layout = null;

            var maxLeadingPages = 0;
            var maxTrailingPages = 0;

            var imgSrcDataType = "data:image/jpeg;base64,";

            var background = function (index) {
                if (index % 2 === 0) {
                    return 1;
                } else {
                    return null;
                }
            }
            this.background = background;

            var resultConverter = function (item, index) {
                var map = AppData.initLandView.getMap();
                var results = AppData.initLandView.getResults();

                if (map && results) {
                    var curIndex = map[item.INITLandID];
                    if (typeof curIndex !== "undefined") {
                        var curInitLand = results[curIndex];
                        if (curInitLand) {
                            item["Land"] = curInitLand.TITLE;
                        }
                    }
                }
                item.index = index;
                item.company = ((item.Firmenname ? (item.Firmenname + " ") : ""));
                item.fullName =
                    ((item.Title ? (item.Title + " ") : "") +
                    (item.Vorname ? (item.Vorname + " ") : "") +
                    (item.Name ? item.Name : ""));
                item.address = item.EMail ? item.EMail : "";
                    //((item.Strasse ? (item.Strasse + "\r\n") : "") +
                    //((item.PLZ || item.Stadt) ? ((item.PLZ ? (item.PLZ + " ") : "") + (item.Stadt ? item.Stadt : "") + "\r\n") : "") +
                    //(item.Land ? (item.Land + "\r\n") : "") +
                    //((item.TelefonMobil) ?
                    //(item.TelefonMobil + "\r\n") :
                    //(item.TelefonFestnetz ? (item.TelefonFestnetz + "\r\n") : "") +
                    //(item.EMail ? item.EMail : ""))) +
                    //(item.Freitext1 ? "\r\n" + item.Freitext1 : "");
                item.globalContactId = item.CreatorSiteID + "/" + item.CreatorRecID;

                if (typeof item.InTransmission === "undefined") {
                    item.InTransmission = null;
                    item.Sent = null;
                } else {
                    if (!item.InTransmission && !item.ReturnedModified) {
                        item.Sent = 1;
                    } else {
                        item.Sent = null;
                    }
                }
                if (typeof item.ReturnedModified === "undefined") {
                    item.ReturnedModified = null;
                } else {
                    if (item.ReturnedModified) {
                        item.InTransmission = null;
                        item.Sent = null;
                    }
                }
                item.OvwContentDOCCNT3 = "";
                if (that.docs && index >= that.firstContactsIndex) {
                    for (var i = that.firstDocsIndex; i < that.docs.length; i++) {
                        var doc = that.docs[i];
                        if (doc.KontaktVIEWID === item.KontaktVIEWID) {
                            var docContent = doc.OvwContentDOCCNT3;
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                if (sub >= 0) {
                                    var data = docContent.substr(sub + 4);
                                    if (data && data !== "null") {
                                        item.OvwContentDOCCNT3 = imgSrcDataType + data;
                                    } else {
                                        item.OvwContentDOCCNT3 = "";
                                    }
                                } else {
                                    item.OvwContentDOCCNT3 = "";
                                }
                            } else {
                                item.OvwContentDOCCNT3 = "";
                            }
                            that.firstDocsIndex = i + 1;
                            that.firstContactsIndex = index + 1;
                            break;
                        }
                    }
                }
                item.showDoc = true;
                if (item.SHOW_Barcode || item.IMPORT_CARDSCANID && !item.SHOW_Visitenkarte) {
                    item.svgSource = item.IMPORT_CARDSCANID ? "barcode-qr" : "barcode";
                } else if (!item.SHOW_Barcode && item.IMPORT_CARDSCANID && item.SHOW_Visitenkarte) {
                    item.svgSource = "";
                } else {
                    item.svgSource = "manuel_Portal";
                }
            }
            this.resultConverter = resultConverter;

            var resultDocConverter = function (item, index) {
                if (that.contacts && index >= that.firstDocsIndex) {
                    for (var i = that.firstDocsIndex; i < that.contacts.length; i++) {
                        var contact = that.contacts.getAt(i);
                        if ((contact.CreatorSiteID === item.CreatorSiteID) && (contact.CreatorRecID === item.CreatorRecID)) {
                            var docContent = item.OvwContentDOCCNT3;
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                if (sub >= 0) {
                                    var data = docContent.substr(sub + 4);
                                    if (data) {
                                        contact.OvwContentDOCCNT3 = imgSrcDataType + data;
                                    } else {
                                        contact.OvwContentDOCCNT3 = "";
                                    }
                                } else {
                                    contact.OvwContentDOCCNT3 = "";
                                }
                            } else {
                                contact.OvwContentDOCCNT3 = "";
                            }
                            contact.showDoc = (contact.IMPORT_CARDSCANID || contact.SHOW_Barcode) ? true : false;
                            if (contact.SHOW_Barcode || contact.IMPORT_CARDSCANID && !contact.SHOW_Visitenkarte) {
                                contact.svgSource = contact.IMPORT_CARDSCANID ? "barcode-qr" : "barcode";
                            } else if (!contact.SHOW_Barcode && contact.IMPORT_CARDSCANID && contact.SHOW_Visitenkarte) {
                                contact.svgSource = "";
                            } else {
                                contact.svgSource = "manuel_Portal";
                            }
                            // preserve scroll position on change of row data!
                            var indexOfFirstVisible = -1;
                            if (listView && listView.winControl) {
                                indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                            }
                            that.contacts.setAt(i, contact);
                            if (indexOfFirstVisible >= 0 && listView && listView.winControl) {
                                listView.winControl.indexOfFirstVisible = indexOfFirstVisible;
                            }
                            that.firstContactsIndex = i + 1;
                            that.firstDocsIndex = index + 1;
                            break;
                        }
                    }
                }
            }
            this.resultDocConverter = resultDocConverter;

            var imageRotate = function(element) {
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
                            WinJS.Promise.timeout(0).then(function() {
                                that.imageRotate(element);
                            });
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.imageRotate = imageRotate;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (listView && listView.winControl) {
                        var listControl = listView.winControl;
                        if (listControl.selection) {
                            var selectionCount = listControl.selection.count();
                            if (selectionCount === 1) {
                                // Only one item is selected, show the page
                                listControl.selection.getItems().done(function (items) {
                                    var item = items[0];
                                    if (item.data && item.data.KontaktVIEWID) {
                                        AppData.generalData.setRecordId("Kontakt", item.data.KontaktVIEWID);
                                        WinJS.Promise.timeout(0).then(function () {
                                            Application.navigateById("contact", eventInfo);
                                        });
                                    }
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // single list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.single) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.single;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.directSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.directSelect;
                        }
                        // Double the size of the buffers on both sides
                        if (!maxLeadingPages) {
                            maxLeadingPages = listView.winControl.maxLeadingPages * 4;
                            listView.winControl.maxLeadingPages = maxLeadingPages;
                        }
                        if (!maxTrailingPages) {
                            maxTrailingPages = listView.winControl.maxTrailingPages * 4;
                            listView.winControl.maxTrailingPages = maxTrailingPages;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = Application.ListLocalLayout.ContactsLayout;
                                listView.winControl.layout = { type: layout };
                            }
                        } else if (listView.winControl.loadingState === "itemsLoaded") {
                            var indexOfFirstVisible = listView.winControl.indexOfFirstVisible;
                            var indexOfLastVisible = listView.winControl.indexOfLastVisible;
                            for (var i = indexOfFirstVisible; i <= indexOfLastVisible; i++) {
                                var element = listView.winControl.elementFromIndex(i);
                                if (element) {
                                    var img = element.querySelector(".list-compressed-doc");
                                    if (img && img.src) {
                                        that.imageRotate(element);
                                    }
                                }
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            // load SVG images
                            Colors.loadSVGImageElements(listView, "action-image-right", 40, Colors.textColor, "name", null, {
                                "barcode-qr": { useStrokeColor: false }
                            });
                            Colors.loadSVGImageElements(listView, "status-image", 12, Colors.textColor);
                            Colors.loadSVGImageElements(listHeader, "status-image", 12, Colors.textColor);
                            if (that.loading) {
                                progress = listView.querySelector(".list-footer .progress");
                                counter = listView.querySelector(".list-footer .counter");
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ListRemote.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        var visible = eventInfo.detail.visible;
                        if (visible) {
                            var contentHeader = listView.querySelector(".content-header");
                            if (contentHeader) {
                                var halfCircle = contentHeader.querySelector(".half-circle");
                                if (halfCircle && halfCircle.style) {
                                    if (halfCircle.style.visibility === "hidden") {
                                        halfCircle.style.visibility = "";
                                        WinJS.UI.Animation.enterPage(halfCircle);
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onFooterVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible && that.contacts && that.nextUrl) {
                            that.loading = true;
                            if (progress && progress.style) {
                                progress.style.display = "inline";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "none";
                            }
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "calling select ListLocal.contactView...");
                            var nextUrl = that.nextUrl;
                            that.nextUrl = null;
                            var nextContactSelectPromise = ListLocal.contactView.selectNext(function (json) {
                                that.removeDisposablePromise(nextContactSelectPromise);
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "ListLocal.contactView: success!");
                                // startContact returns object already parsed from json file in response
                                if (json && json.d) {
                                    that.nextUrl = ListLocal.contactView.getNextUrl(json);
                                    var results = json.d.results;
                                    results.forEach(function(item, index) {
                                        that.resultConverter(item, that.binding.count);
                                        that.binding.count = that.contacts.push(item);
                                    });
                                }
                                var nextContactDocSelectPromise = WinJS.Promise.timeout(250).then(function () {
                                    that.removeDisposablePromise(nextContactDocSelectPromise);
                                    if (that.nextDocUrl) {
                                        var nextDocUrl = that.nextDocUrl;
                                        that.nextDocUrl = null;
                                        Log.print(Log.l.trace, "calling select ContactList.contactDocView...");
                                        nextContactDocSelectPromise = ListLocal.contactDocView.selectNext(function (json) { //json is undefined
                                            that.removeDisposablePromise(nextContactDocSelectPromise);
                                            // this callback will be called asynchronously
                                            // when the response is available
                                            Log.print(Log.l.trace, "ContactList.contactDocView: success!");
                                            // startContact returns object already parsed from json file in response
                                            if (json && json.d) {
                                                that.nextDocUrl = ListLocal.contactDocView.getNextUrl(json);
                                                var results = json.d.results;
                                                results.forEach(function (item, index) {
                                                    that.resultDocConverter(item, that.binding.doccount);
                                                    that.binding.doccount = that.docs.push(item);
                                                });
                                            }
                                        }, function (errorResponse) {
                                            that.removeDisposablePromise(nextContactDocSelectPromise);
                                            // called asynchronously if an error occurs
                                            // or server returns response with an error status.
                                            Log.print(Log.l.error, "ContactList.contactDocView: error!");
                                            AppData.setErrorMsg(that.binding, errorResponse);
                                        }, null, nextDocUrl);
                                        that.addDisposablePromise(nextContactDocSelectPromise);
                                    }
                                });
                                that.addDisposablePromise(nextContactDocSelectPromise);
                            }, function (errorResponse) {
                                that.removeDisposablePromise(nextContactSelectPromise);
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                AppData.setErrorMsg(that.binding, errorResponse);
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }, null, nextUrl);
                            that.addDisposablePromise(nextContactSelectPromise);
                        } else {
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                            that.loading = false;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Contact.Controller.");
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

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));
            }
            var loadData = function() {
                Log.call(Log.l.trace, "ListLocal.Controller.");
                that.loading = true;
                progress = listView.querySelector(".list-footer .progress");
                counter = listView.querySelector(".list-footer .counter");
                if (progress && progress.style) {
                    progress.style.display = "inline";
                }
                if (counter && counter.style) {
                    counter.style.display = "none";
                }
                AppData.setErrorMsg(that.binding);
                if (that.contacts) {
                    that.contacts.length = 0;
                }
                if (AppData.generalData.contactCountLocal > 0) {
                    that.binding.showNumberContacts = getResourceText("listLocal.contactTotal") +
                        ": " + AppData.generalData.contactCountLocal;
                } else {
                    that.binding.showNumberContacts = "";
                }
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        var initLandSelectPromise = AppData.initLandView.select(function (json) {
                            that.removeDisposablePromise(initLandSelectPromise);
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                        }, function (errorResponse) {
                            that.removeDisposablePromise(initLandSelectPromise);
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                        return that.addDisposablePromise(initLandSelectPromise);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var contactSelectPromise = ListLocal.contactView.select(function (json) {
                        that.removeDisposablePromise(contactSelectPromise);
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "ListLocal.contactView: success!");
                        // startContact returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.count = json.d.results.length;
                            that.nextUrl = ListLocal.contactView.getNextUrl(json);
                            var results = json.d.results;
                            if (!that.contacts) {
                                results.forEach(function (item, index) {
                                    that.resultConverter(item, index);
                                });
                                // Now, we call WinJS.Binding.List to get the bindable list
                                that.contacts = new WinJS.Binding.List(results);
                                that.binding.count = that.contacts.length;
                            } else {
                                results.forEach(function (item, index) {
                                    that.resultConverter(item, index);
                                    that.binding.count = that.contacts.push(item);
                                });
                            }
                            if (listView.winControl) {
                                // add ListView dataSource
                                listView.winControl.itemDataSource = that.contacts.dataSource;
                            }
                        } else {
                            that.binding.count = 0;
                            that.nextUrl = null;
                            if (listView.winControl) {
                                // add ListView dataSource
                                listView.winControl.itemDataSource = null;
                            }
                            progress = listView.querySelector(".list-footer .progress");
                            counter = listView.querySelector(".list-footer .counter");
                            if (progress && progress.style) {
                                progress.style.display = "none";
                            }
                            if (counter && counter.style) {
                                counter.style.display = "inline";
                            }
                            that.loading = false;
                        }
                    }, function (errorResponse) {
                        that.removeDisposablePromise(contactSelectPromise);
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        if (progress && progress.style) {
                            progress.style.display = "none";
                        }
                        if (counter && counter.style) {
                            counter.style.display = "inline";
                        }
                        that.loading = false;
                    }, {
                        MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter")
                    });
                    return that.addDisposablePromise(contactSelectPromise);
                }).then(function () {
                    var contactDocSelectPromise = WinJS.Promise.timeout(250).then(function () {
                        that.removeDisposablePromise(contactDocSelectPromise);
                        contactDocSelectPromise = ListLocal.contactDocView.select(function (json) {
                            that.removeDisposablePromise(contactDocSelectPromise);
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "contactDocView: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d && json.d.results && json.d.results.length) {
                                that.binding.doccount = json.d.results.length;
                                that.nextDocUrl = ListLocal.contactDocView.getNextUrl(json);
                                var results = json.d.results;
                                results.forEach(function (item, index) {
                                    that.resultDocConverter(item, index);
                                });
                                that.docs = results;
                            } else {
                                Log.print(Log.l.trace, "contactDocView: no data found!");
                            }
                        }, function (errorResponse) {
                            that.removeDisposablePromise(contactDocSelectPromise);
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "ContactList.contactDocView: error!");
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, {
                            MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter")
                        });
                        that.addDisposablePromise(contactDocSelectPromise);
                    });
                    that.addDisposablePromise(contactDocSelectPromise);
                }).then(function () {
                    var contactNumberSelectPromise = WinJS.Promise.timeout(250).then(function () {
                        that.removeDisposablePromise(contactNumberSelectPromise);
                        contactNumberSelectPromise = ListLocal.contactNumberView.select(function (json) {
                            Log.print(Log.l.trace, "ListLocal.contactNumberView: success!");
                            if (json && json.d && json.d.results && json.d.results.length === 1) {
                                var result = json.d.results[0];
                                if (result.Uploaded > 0) {
                                    that.binding.showNumberUploaded = ", " + getResourceText("listLocal.online") +
                                        ": " + result.Uploaded;
                                } else {
                                    that.binding.showNumberUploaded = "";
                                }
                                if (result.NotUploaded > 0) {
                                    that.binding.showNumberNotUploaded = getResourceText("listLocal.notOnline") +
                                        ": " + result.NotUploaded;
                                } else {
                                    that.binding.showNumberNotUploaded = "";
                                }
                                if (result.InWork > 0) {
                                    that.binding.showNumberInWork = (result.NotUploaded > 0) ? ", " : "" + 
                                        getResourceText("listLocal.inWork") + ": " + result.InWork;
                                } else {
                                    that.binding.showNumberInWork = "";
                                }
                            }
                        }, function (errorResponse) {
                            that.removeDisposablePromise(contactNumberSelectPromise);
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "ContactList.contactDocView: error!");
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                        that.addDisposablePromise(contactNumberSelectPromise);
                    });
                    that.addDisposablePromise(contactNumberSelectPromise);
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

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







