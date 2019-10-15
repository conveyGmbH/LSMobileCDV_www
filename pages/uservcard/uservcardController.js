// controller for page: userVcard
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/uservcard/uservcardService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/CameraConstants.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />
/// <reference path="~/www/lib/jQueryQRCode/scripts/jquery.qrcode.min.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("UserVcard", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "UserVcard.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataBenutzer: UserVcard.benutzerView && getEmptyDefaultValue(UserVcard.benutzerView.defaultValue),
                dataVeranstaltung: UserVcard.veranstaltungView && getEmptyDefaultValue(UserVcard.veranstaltungView.defaultValue),
                InitLandItem: { InitLandID: 0, TITLE: "" }
            }, commandList]);
            this.qrcodeWidth = 0;
            this.qrcodeContent = "";

            var that = this;

            // show business card photo
            var qrcodeContainer = pageElement.querySelector(".userinfo-qrcode-container");


            this.dispose = function () {
            }

            var getDataContact = function() {
                Log.call(Log.l.trace, "UserVcard.Controller.");
                var prop;
                var dataContact = null;
                if (UserVcard.benutzerView && that.binding.dataBenutzer && that.binding.dataBenutzer.BenutzerVIEWID) {
                    for (prop in UserVcard.benutzerView.defaultValue) {
                        if (UserVcard.benutzerView.defaultValue.hasOwnProperty(prop)) {
                            if (!dataContact) {
                                dataContact = {};
                            }
                            if (that.binding.dataBenutzer[prop]) {
                                dataContact[prop] = that.binding.dataBenutzer[prop];
                            } else {
                                dataContact[prop] = UserVcard.benutzerView.defaultValue[prop];
                            }
                        }
                    }
                }
                if (UserVcard.veranstaltungView && that.binding.dataVeranstaltung && that.binding.dataVeranstaltung.VeranstaltungVIEWID) {
                    for (prop in UserVcard.veranstaltungView.defaultValue) {
                        if (UserVcard.veranstaltungView.defaultValue.hasOwnProperty(prop)) {
                            if (!dataContact) {
                                dataContact = {};
                            }
                            if (that.binding.dataVeranstaltung[prop]) {
                                dataContact[prop] = that.binding.dataVeranstaltung[prop];
                            } else {
                                dataContact[prop] = UserVcard.veranstaltungView.defaultValue[prop];
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return dataContact;
            };

            var setDataBenutzer = function (newDataBenutzer) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataBenutzer = newDataBenutzer;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            };

            var setDataVeranstaltung = function (newDataVeranstaltung) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataVeranstaltung = newDataVeranstaltung;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            };

            var setInitLandItem = function (newInitLandItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitLandItem = newInitLandItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }

            var loadInitSelection = function () {
                Log.call(Log.l.trace, "UserVcard.Controller.");
                if (typeof that.binding.dataVeranstaltung.VeranstaltungVIEWID !== "undefined") {
                    var map, results, curIndex;
                    if (typeof that.binding.dataVeranstaltung.INITLandID !== "undefined") {
                        Log.print(Log.l.trace, "calling select initLandData: Id=" + that.binding.dataVeranstaltung.INITLandID + "...");
                        map = AppData.initLandView.getMap();
                        results = AppData.initLandView.getResults();
                        if (map && results) {
                            curIndex = map[that.binding.dataVeranstaltung.INITLandID];
                            if (typeof curIndex !== "undefined") {
                                setInitLandItem(results[curIndex]);
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return WinJS.Promise.as();
            }

            var loadData = function () {
                Log.call(Log.l.trace, "UserVcard.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //load the list of INITLand for ISO-Code
                        return AppData.initLandView.select(function (json) {
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
                    var recordId = AppData.getRecordId("Benutzer");
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select benutzerView...");
                        return UserVcard.benutzerView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "benutzerView: success!");
                            if (json && json.d) {
                                setDataBenutzer(json.d);
                            }
                        }, function (errorResponse) {
                            if (errorResponse.status === 404) {
                                // ignore NOT_FOUND error here!
                                setDataBenutzer(getEmptyDefaultValue(UserVcard.benutzerView.defaultValue));
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        }, recordId);
                    } else {
                        setDataBenutzer(getEmptyDefaultValue(UserVcard.benutzerView.defaultValue));
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    var eventId = AppData.getRecordId("Veranstaltung");
                    if (eventId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select veranstaltungView...");
                        return UserVcard.veranstaltungView.select(function (json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "veranstaltungView: success!");
                            if (json && json.d) {
                                setDataVeranstaltung(json.d);
                                loadInitSelection();
                            }
                        }, function(errorResponse) {
                            if (errorResponse.status === 404) {
                                // ignore NOT_FOUND error here!
                                setDataVeranstaltung(getEmptyDefaultValue(UserVcard.veranstaltungView.defaultValue));
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        }, eventId);
                    } else {
                        setDataVeranstaltung(getEmptyDefaultValue(UserVcard.veranstaltungView.defaultValue));
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var drawQrcode = function() {
                Log.call(Log.l.trace, "UserVcard.Controller.");
                var ret = new WinJS.Promise.as().then(function() {
                    var dataContact = getDataContact();
                    var vCard = AppData.createVCardFromContact(dataContact, that.binding.InitLandItem.Alpha3_ISOCode);
                    if (vCard && qrcodeContainer) {
                        var width = qrcodeContainer.clientWidth - 76;
                        if (width > pageElement.clientHeight - 100) {
                            width = pageElement.clientHeight - 100;
                        }
                        var content = vCard.getFormattedString();
                        Log.print(Log.l.trace, "width=" + width + " content=" + content);
                        if (that.qrcodeContent !== content ||
                            that.qrcodeWidth !== width) {
                            var qrcodeViewer = document.createElement("div");
                            WinJS.Utilities.addClass(qrcodeViewer, "userinfo-qrcode");
                            $(qrcodeViewer).qrcode({
                                text: utf8_decode(content),
                                width: width,
                                height: width,
                                correctLevel: 0 //QRErrorCorrectLevel.M
                            });
                            that.qrcodeContent = content;
                            that.qrcodeWidth = width;
                            qrcodeContainer.appendChild(qrcodeViewer);
                            if (qrcodeContainer.childElementCount > 1) {
                                var oldElement = qrcodeContainer.firstElementChild;
                                if (oldElement) {
                                    qrcodeContainer.removeChild(oldElement);
                                    oldElement.innerHTML = "";
                                }
                            }
                        }
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            that.drawQrcode = drawQrcode;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "UserVcard.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickShare: function (event) {
                    Log.call(Log.l.trace, "UserVcard.Controller.");
                    var dataContact = getDataContact();
                    AppData.shareContact(dataContact, that.binding.InitLandItem.Alpha3_ISOCode);
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
                clickShare: function () {
                    if (that.binding.dataBenutzer && that.binding.dataBenutzer.BenutzerVIEWID) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                var pageControl = pageElement.winControl;
                if (pageControl && pageControl.updateLayout) {
                    pageControl.prevWidth = 0;
                    pageControl.prevHeight = 0;
                    pageControl.updateLayout.call(pageControl, pageElement);
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();

