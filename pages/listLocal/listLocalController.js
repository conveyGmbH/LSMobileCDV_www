// controller for page: listLocal
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/listLocal/listLocalService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListLocal", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "ListLocal.Controller.");
            Application.Controller.apply(this, [pageElement, {
                count: 0
            }]);
            this.nextUrl = null;
            this.loading = false;
            this.contacts = null;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#listLocalContacts.listview");

            this.dispose = function () {
                if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
                if (that.contacts) {
                    that.contacts = null;
                }
            }

            var progress = null;
            var counter = null;
            var layout = null;

            var maxLeadingPages = 0;
            var maxTrailingPages = 0;


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
            }
            this.svgFromContact = svgFromContact;

            var background = function(index) {
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
                item.svg = svgFromContact(item.INITAnredeID);
                item.company = ((item.Firmenname ? (item.Firmenname + " ") : ""));
                item.fullName =
                    ((item.Title ? (item.Title + " ") : "") +
                    (item.Vorname ? (item.Vorname + " ") : "") +
                    (item.Name ? item.Name : ""));
                item.address =
                    ((item.Strasse ? (item.Strasse + "\r\n") : "") +
                    ((item.PLZ || item.Stadt) ? ((item.PLZ ? (item.PLZ + " ") : "") + (item.Stadt ? item.Stadt : "") + "\r\n") : "") +
                    (item.Land ? (item.Land + "\r\n") : "") +
                    ((item.TelefonMobil) ?
                    (item.TelefonMobil + "\r\n") :
                    (item.TelefonFestnetz ? (item.TelefonFestnetz + "\r\n") : "") +
                    (item.EMail ? item.EMail : ""))) +
                    (item.Freitext1 ? "\r\n" + item.Freitext1 : "");
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
            }
            this.resultConverter = resultConverter;

            // define handlers
            this.eventHandlers = {
                clickBack: function(event) {
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
                onSelectionChanged: function(eventInfo) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    if (listView && listView.winControl) {
                        var listControl = listView.winControl;
                        if (listControl.selection) {
                            var selectionCount = listControl.selection.count();
                            if (selectionCount === 1) {
                                // Only one item is selected, show the page
                                listControl.selection.getItems().done(function(items) {
                                    var item = items[0];
                                    if (item.data && item.data.KontaktVIEWID) {
                                        AppData.generalData.setRecordId("Kontakt", item.data.KontaktVIEWID);
                                        WinJS.Promise.timeout(0).then(function() {
                                            Application.navigateById("contact", eventInfo);
                                        });
                                    }
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function(eventInfo) {
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
                        } else if (listView.winControl.loadingState === "complete") {
                            // load SVG images
                            Colors.loadSVGImageElements(listView, "action-image", 40, Colors.textColor, "name");
                            Colors.loadSVGImageElements(listView, "status-image", 16, Colors.textColor);
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
                            ListLocal.contactView.selectNext(function(json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "ListLocal.contactView: success!");
                                // startContact returns object already parsed from json file in response
                                if (json && json.d) {
                                    that.nextUrl = ListLocal.contactView.getNextUrl(json);
                                    var results = json.d.results;
                                    results.forEach(function(item, index) {
                                        that.resultConverter(item, index);
                                        that.binding.count = that.contacts.push(item);
                                    });
                                } else {
                                    that.nextUrl = null;
                                }
                            }, function(errorResponse) {
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
                            }, null, that.nextUrl);
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
                }

            };

            this.disableHandlers = null;

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
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        return AppData.initLandView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    return ListLocal.contactView.select(function (json) {
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
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            that.processAll().then(function() {
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







