// controller for page: barcode
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/barcode/barcodeService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js" />
/// <reference path="~/plugins/phonegap-datawedge-intent/www/broadcast_intent_plugin.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Barcode", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Barcode.Controller.");
            Application.Controller.apply(this, [pageElement, {
                states: {
                    errorMessage: "",
                    barcode: null
                },
                contact: { KontaktVIEWID: 0 }
            }, commandList]);

            var that = this;

            var updateStates = function (states) {
                Log.call(Log.l.trace, "Barcode.Controller.", "errorMessage=" + states.errorMessage + "");
                // nothing to do for now
                that.binding.states.errorMessage = states.errorMessage;
                if (states.errorMessage && states.errorMessage !== "") {
                    var headerComment = pageElement.querySelector(".header-comment");
                    if (headerComment && headerComment.style) {
                        headerComment.style.visibility = "visible";
                    }
                }
                if (typeof states.barcode !== "undefined") {
                    that.binding.states.barcode = states.barcode;
                }
                Log.ret(Log.l.trace);
            }
            this.updateStates = updateStates;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    Application.navigateById("userinfo", event);
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
                }
            }

            var insertBarcodedata = function (barcode, isVcard) {
                Log.call(Log.l.trace, "Barcode.Controller.");
                that.updateStates({ errorMessage: "Request", barcode: barcode });
                var ret = new WinJS.Promise.as().then(function() {
                    var newContact = {
                        HostName: (window.device && window.device.uuid),
                        MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter"),
                        VeranstaltungID: AppData.generalData.getRecordId("Veranstaltung"),
                        Nachbearbeitet: 1
                    };
                    Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                    AppData.setErrorMsg(that.binding);
                    return Barcode.contactView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "contactView: success!");
                        // contactData returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.contact = json.d;
                            AppData.generalData.setRecordId("Kontakt", that.binding.contact.KontaktVIEWID);
                            AppData.getUserData();
                        } else {
                            AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, newContact);
                }).then(function () {
                    if (!that.binding.contact.KontaktVIEWID) {
                        Log.print(Log.l.error, "no KontaktVIEWID");
                        return WinJS.Promise.as();
                    }
                    if (isVcard) {
                        var newBarcodeVCard = {
                            KontaktID: that.binding.contact.KontaktVIEWID,
                            Button: 'VCARD_TODO',
                            Barcode2: barcode
                        };
                        Log.print(Log.l.trace, "insert new barcodeDataVCard for KontaktID=" + newBarcodeVCard.KontaktID);
                        return Barcode.barcodeVCardView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "barcodeVCardView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.updateStates({ errorMessage: "OK" });
                                AppData.generalData.setRecordId("IMPORT_CARDSCAN", json.d.IMPORT_CARDSCANVIEWID);
                                AppData._barcodeType = "vcard";
                                AppData._barcodeRequest = barcode;
                                return WinJS.Promise.timeout(0).then(function() {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    Application.navigateById("questionnaire", null, true);
                                    // accelarate replication
                                    if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                        var numFastReqs = 10;
                                        AppRepl.replicator.run(numFastReqs);
                                    }
                                });
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                                return WinJS.Promise.as();
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newBarcodeVCard);
                    } else {
                        var newBarcode = {
                            Request_Barcode: barcode,
                            KontaktID: that.binding.contact.KontaktVIEWID
                        };
                        //load of format relation record data
                        Log.print(Log.l.trace, "insert new barcodeView for KontaktID=" + newBarcode.KontaktID);
                        return Barcode.barcodeView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "barcodeView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.updateStates({ errorMessage: "OK" });
                                AppData.generalData.setRecordId("ImportBarcodeScan", json.d.ImportBarcodeScanVIEWID);
                                AppData._barcodeType = "barcode";
                                AppData._barcodeRequest = barcode;
                                WinJS.Promise.timeout(0).then(function () {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    Application.navigateById("questionnaire", null, true);
                                    // accelarate replication
                                    if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                        var numFastReqs = 10;
                                        AppRepl.replicator.run(numFastReqs);
                                    }
                                });
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newBarcode);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertBarcodedata = insertBarcodedata;

            var onBarcodeSuccess = function (result) {
                Log.call(Log.l.trace, "Barcode.Controller.");
                if (result.cancelled) {
                    // go back to start
                    WinJS.Promise.timeout(0).then(function () {
                        // go back to start
                        if (WinJS.Navigation.location === Application.getPagePath("barcode") &&
                            WinJS.Navigation.canGoBack === true) {
                            WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                        }
                    });
                    Log.ret(Log.l.trace, "User cancelled");
                    return;
                }
                if (!result.text) {
                    that.updateStates({ errorMessage: "Barcode scanner returned no data!" });
                    Log.ret(Log.l.trace, "no data returned");
                    return;
                }
                WinJS.Promise.timeout(0).then(function () {
                    var tagVcard = "BEGIN:VCARD";
                    var tagLsad = "#LSAD";
                    var tagLs64 = "#LS64";
                    var tagLstx = "#LSTX";
                    Log.call(Log.l.trace, "working on barcode data...");
                    var isVcard;
                    var finalBarcode;
                    if (result.text.substr(0, tagVcard.length) === tagVcard) {
                        Log.print(Log.l.trace, "plain VCARD, save already utf-8 string data as VCARD");
                        isVcard = true;
                        finalBarcode = result.text;
                    } else if (result.text.substr(0, tagLsad.length) === tagLsad) {
                        Log.print(Log.l.trace, "endcoded VCARD, save already encoded base 64 string");
                        isVcard = true;
                        finalBarcode = result.text;
                    } else if (result.text.substr(0, tagLs64.length) === tagLs64) {
                        Log.print(Log.l.trace, "endcoded VCARD with #LS64 prefix, save already encoded base 64 string with #LSAD prefix");
                        isVcard = true;
                        finalBarcode = tagLsad + result.text.substr(tagLs64.length);
                    } else if (result.text.indexOf("\n") >= 0) {
                        Log.print(Log.l.trace, "save string data as plain text address");
                        isVcard = true;
                        finalBarcode = tagLstx + result.text;
                    } else {
                        isVcard = false;
                        var i = result.text.indexOf("|");
                        if (i >= 0) {
                            var countPipe = 1;
                            for (; i < result.text.length; i++) {
                                if (result.text[i] === "|") {
                                    countPipe++;
                                    if (countPipe === 4) {
                                        isVcard = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!isVcard) {
                            Log.print(Log.l.trace, "save string data as Id-Barcode");
                        }
                        finalBarcode = result.text;
                    }
                    that.insertBarcodedata(finalBarcode, isVcard);
                    Log.ret(Log.l.trace);
                });
                Log.ret(Log.l.trace);
            }
            this.onBarcodeSuccess = onBarcodeSuccess;

            var onBarcodeError = function (error) {
                Log.call(Log.l.error, "Barcode.Controller.");
                that.updateStates({ errorMessage: JSON.stringify(error) });

                WinJS.Promise.timeout(2000).then(function () {
                    // go back to start
                    if (WinJS.Navigation.location === Application.getPagePath("barcode") &&
                        WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                });
                Log.ret(Log.l.error);
            }
            this.onBarcodeError = onBarcodeError;

            var scanBarcode = function() {
                Log.call(Log.l.trace, "Barcode.Controller.");
                if (typeof device === "object" && device.platform === "Android" &&
                    AppData.generalData.useBarcodeActivity &&
                    navigator &&
                    navigator.broadcast_intent_plugin &&
                    typeof navigator.broadcast_intent_plugin.scan === "function") {
                    Log.print(Log.l.trace, "Android: calling  navigator.broadcast_intent_plugin.start...");
                    navigator.broadcast_intent_plugin.scan(Barcode.onBarcodeSuccess, Barcode.onBarcodeError);
                } else if (cordova && cordova.plugins && cordova.plugins.barcodeScanner &&
                    typeof cordova.plugins.barcodeScanner.scan === "function") {

                    if (typeof device === "object" && device.platform === "Android") {
                        Log.print(Log.l.trace, "Android: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError, {
                            preferFrontCamera: false,
                            prompt: getResourceText("barcode.placement"),
                            formats: "QR_CODE,DATA_MATRIX,CODE_128,ITF,CODE_39,EAN_8,EAN_13,UPC_E,UPC_A,AZTEC",
                            resultDisplayDuration: 0,
                            disableAnimations: true
                        });
                    } else {
                        Log.print(Log.l.trace, "NOT Android: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError
                        /*
                        , {
                            preferFrontCamera: false,
                            prompt: getResourceText("barcode.placement"),
                            formats: "QR_CODE,DATA_MATRIX,CODE_128,ITF,CODE_39,EAN_8,EAN_13,UPC_E,UPC_A,AZTEC",
                            resultDisplayDuration: 0,
                            disableAnimations: true
                        }
                        */
                        );
                    }
                } else {
                    Log.print(Log.l.error, "barcodeScanner.scan not supported...");
                    if (Barcode.controller) {
                        Barcode.controller.updateStates({ errorMessage: "Barcode scanner plugin not supported" });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.scanBarcode = scanBarcode;

            AppData.setErrorMsg(that.binding);

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                if (!Barcode.dontScan) {
                    that.scanBarcode();
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();






