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
                slotFree: true, /*AppData._userData.Limit -> AppData.generalData.limit*/
                slotFull: false,
                slotWarning: false,
                states: {
                    errorMessage: "",
                    barcode: null
                },
                showVisitorIn: false,
                showVisitorOut: false,
                showVisitorInOut: false,
                showVisitorAttention: false,
                hidebarcodeInformation: false,
                showWelcomeByeBye: false,
                visitoFlowCountArea: 0,
                visitorFlowCountTotal: 0,
                visitorFlowLimit: 0,
                visitorFlowCountRest: 0,
                contact: { KontaktVIEWID: 0 }
            }, commandList]);



            var that = this;
            var refreshResultsPromise = null;
            var refreshWaitTimeMs = (AppData._persistentStates.odata.replInterval || 30) * 1000;

            var updateActions = function () {
                if (parseInt(AppData._persistentStates.showvisitorFlow) > 0) {
                    if (AppData.generalData.area && AppData.generalData.inOut === "IN") {
                        that.binding.showVisitorIn = true;
                        that.binding.showVisitorOut = false;
                        that.binding.showVisitorInOut = false;
                        that.binding.showVisitorAttention = false;
                    } else if (AppData.generalData.area && AppData.generalData.inOut === "OUT") {
                        that.binding.showVisitorIn = false;
                        that.binding.showVisitorOut = true;
                        that.binding.showVisitorInOut = false;
                        that.binding.showVisitorAttention = false;
                    } else if (AppData.generalData.area && AppData.generalData.inOut === "INOUT") {
                        that.binding.showVisitorIn = false;
                        that.binding.showVisitorOut = false;
                        that.binding.showVisitorInOut = true;
                        that.binding.showVisitorAttention = false;
                    } else {
                        if (parseInt(AppData._persistentStates.showvisitorFlow) === 1) {
                        that.binding.showVisitorIn = false;
                        that.binding.showVisitorOut = false;
                        that.binding.showVisitorInOut = false;
                        that.binding.showVisitorAttention = true;
                        } else if (parseInt(AppData._persistentStates.showvisitorFlow) === 2) {
                            that.binding.showVisitorIn = false;
                            that.binding.showVisitorOut = false;
                            that.binding.showVisitorInOut = false;
                            that.binding.showVisitorAttention = false;
                        }
                    }
                    if (AppData.generalData.limit) {
                        that.binding.visitorFlowLimit = AppData.generalData.limit;
                    }
                    if (that.binding.showVisitorIn ||
                        that.binding.showVisitorOut ||
                        that.binding.showVisitorInOut ||
                        that.binding.showVisitorAttention) {
                        that.binding.hidebarcodeInformation = true;
                    } else {
                        that.binding.hidebarcodeInformation = false;
                    }
                }

            };
            this.updateActions = updateActions;

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
                },
                clickScanNewBarcode: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    that.scanBarcode();
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
                //if visitorflow deaktiviert
                if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                    that.updateStates({ errorMessage: "Request", barcode: barcode });
                }
                //that.showExit();
                var ret = new WinJS.Promise.as().then(function() {
                    var newContact = {
                        HostName: (window.device && window.device.uuid),
                        MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter"),
                        VeranstaltungID: AppData.generalData.getRecordId("Veranstaltung"),
                        Nachbearbeitet: 1,
                        Freitext4: AppData.generalData.area,
                        Freitext5: AppData.generalData.inOut
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
                                //if visitorflow deaktiviert
                                if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                                    that.updateStates({ errorMessage: "" }); //OK
                                }
                                //that.showExit();
                                AppData.generalData.setRecordId("IMPORT_CARDSCAN", json.d.IMPORT_CARDSCANVIEWID);
                                AppData._barcodeType = "vcard";
                                AppData._barcodeRequest = barcode;
                                return WinJS.Promise.timeout(0).then(function() {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    if (Barcode.waitingScans > 0) {
                                        Barcode.dontScan = true;
                                    } else {
                                        Application.navigateById("questionnaire", null, true);
                                        // accelarate replication
                                        if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                            var numFastReqs = 10;
                                            AppRepl.replicator.run(numFastReqs);
                                        }
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
                                //if visitorflow deaktiviert
                                if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                                    that.updateStates({ errorMessage: "" }); //OK
                                }
                                //that.showExit();
                                AppData.generalData.setRecordId("ImportBarcodeScan", json.d.ImportBarcodeScanVIEWID);
                                AppData._barcodeType = "barcode";
                                AppData._barcodeRequest = barcode;
                                WinJS.Promise.timeout(0).then(function () {
                                    // do the following in case of success:
                                    // go on to questionnaire
                                    if (Barcode.waitingScans > 0) {
                                        Barcode.dontScan = true;
                                    } else {
                                        Application.navigateById("questionnaire", null, true);
                                        // accelarate replication
                                        if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                            var numFastReqs = 10;
                                            AppRepl.replicator.run(numFastReqs);
                                        }
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
                }).then(function () {
                    WinJS.Promise.timeout(10).then(function () {
                        if ((AppData._persistentStates.showvisitorFlow === 1 ||
                                AppData._persistentStates.showvisitorFlow === 2) &&
                            AppData.generalData.area &&
                            AppData.generalData.inOut) {
                            that.loadData();
                        }
                    });
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.insertBarcodedata = insertBarcodedata;

            var onBarcodeSuccess = function (result) {
                Log.call(Log.l.trace, "Barcode.Controller.");
                Barcode.dontScan = false;
                if (result.cancelled) {
                    // go back to start
                    WinJS.Promise.timeout(0).then(function () {
                        // go back to start
                        if (WinJS.Navigation.location === Application.getPagePath("barcode") &&
                            WinJS.Navigation.canGoBack === true) {
                            WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                        } else {
                            Application.navigateById("Account", null, null);
                        }
                    });
                    Log.ret(Log.l.trace, "User cancelled");
                    return;
                }
                if (!result.text) {
                    if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                    that.updateStates({ errorMessage: "Barcode scanner returned no data!" });
                    }
                    Log.ret(Log.l.trace, "no data returned");
                    return;
                }
                WinJS.Promise.timeout(0).then(function () {
                    var tagLogin = "#LI:";
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
                    } else if (result.text.substr(0, tagLogin.length) === tagLogin) {
                        Log.print(Log.l.trace, "Login with #LI: prefix");
                        var pos = result.text.indexOf("/");
                        Login.nextLogin = result.text.substr(tagLogin.length, pos - tagLogin.length);
                        Login.nextPassword = result.text.substr(pos + 1);
                        //Application.navigateById("login");
                        //Log.ret(Log.l.trace, "navigated to login page!");
                        var confirmTitle = getResourceText("account.confirmLogOff");
                        confirm(confirmTitle,
                                function (result) {
                                    return result;
                                }).then(function (result) {
                                    Log.print(Log.l.trace, "clickLogoff: user choice OK");
                                    if (result && AppData.generalData.logOffOptionActive) {
                                        Application.navigateById("login");
                                    } else {
                                        Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                                        if (WinJS.Navigation.location === Application.getPagePath("barcode") &&
                                            WinJS.Navigation.canGoBack === true) {
                                            WinJS.Navigation.back(1).done(/* Your success and error handlers */);
                                        }
                                    }
                                });
                        return;
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
                    //visitorflow für mehrfach scan
                    if (parseInt(AppData._persistentStates.showvisitorFlow) === 1 || (parseInt(AppData._persistentStates.showvisitorFlow) === 2 && AppData.generalData.area && AppData.generalData.inOut)) {
                        Barcode.dontScan = true;
                        that.refreshResults(Math.min(refreshWaitTimeMs, 5000));
                    }
                    Log.ret(Log.l.trace);
                });
                Log.ret(Log.l.trace);
            }
            this.onBarcodeSuccess = onBarcodeSuccess;

            var onBarcodeError = function (error) {
                Log.call(Log.l.error, "Barcode.Controller.");
                Barcode.dontScan = false;
                if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                that.updateStates({ errorMessage: JSON.stringify(error) });
                }
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
                    Barcode.dontScan = true;
                    Log.print(Log.l.trace, "Android: calling  navigator.broadcast_intent_plugin.start...");
                    navigator.broadcast_intent_plugin.scan(Barcode.onBarcodeSuccess, Barcode.onBarcodeError);
                } else if (cordova && cordova.plugins && cordova.plugins.barcodeScanner &&
                    typeof cordova.plugins.barcodeScanner.scan === "function") {

                    if (typeof device === "object" && device.platform === "Android") {
                        Log.print(Log.l.trace, "Android: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError, {
                            preferFrontCamera: false,
                            prompt: getResourceText("barcode.placement"),
                            formats: "QR_CODE,DATA_MATRIX,CODE_128,ITF,CODE_39,EAN_8,EAN_13,UPC_E,UPC_A,AZTEC,PDF_417",
                            resultDisplayDuration: 0,
                            disableAnimations: true
                        });
                    } else if (typeof device === "object" &&
                        device.platform === "iOS" &&
                        AppData.generalData.useBinaryQrCode) {
                        Log.print(Log.l.trace, "iOS && useBinaryQrCode: calling barcodeScanner.scan...");
                        cordova.plugins.barcodeScanner.scan(onBarcodeSuccess, onBarcodeError, {
                            useBinaryQrCode: AppData.generalData.useBinaryQrCode
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

            var translateAnimantion = function (element, bIn) {
                Log.call(Log.l.trace, "Contact.Controller.");
                if (element && that.binding) {
                    var fnAnimation = bIn ? WinJS.UI.Animation.enterContent : WinJS.UI.Animation.exitContent;
                    var animationOptions = { top: bIn ? "-50px" : "50px", left: "0px" };
                    fnAnimation(element, animationOptions, {
                        mechanism: "transition"
                    }).done(function () {
                        if (!that.binding || that.binding.showProgress) {
                            Log.print(Log.l.trace, "finished");
                        } else {
                            Log.print(Log.l.trace, "go on with animation");
                            that.animationPromise = WinJS.Promise.timeout(1000).then(function () {
                                that.translateAnimantion(element, !bIn);
                            });
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.translateAnimantion = translateAnimantion;

            var resultConverterCounter = function (item, index) {
                that.binding.visitorFlowCountTotal = that.binding.visitorFlowCountTotal +
                    (item.ZutritteAlleHeute - item.AustritteAlleHeute);
            }
            this.resultConverterCounter = resultConverterCounter;

            var loadData = function () {
                Log.call(Log.l.trace, "ListRemote.Controller.");
                that.loading = true;
                var ret = new WinJS.Promise.as().then(function () {
                    /*if (AppData._userRemoteDataPromise) {
                        Log.print(Log.l.info, "Cancelling previous userRemoteDataPromise");
                        AppData._userRemoteDataPromise.cancel();
                    }
                    AppData._userRemoteDataPromise = WinJS.Promise.timeout(100).then(function () {
                        Log.print(Log.l.info, "getUserRemoteData: Now, timeout=" + 100 + "s is over!");
                        AppData._curGetUserRemoteDataId = 0;
                        AppData.getUserRemoteData();
                        Log.print(Log.l.info, "getCRVeranstOption: Now, timeout=" + 100 + "s is over!");
                        AppData.getCRVeranstOption();
                    });
                    if (that.refreshPromise) {
                        that.refreshPromise.cancel();
                        that.removeDisposablePromise(that.refreshPromise);
                    }*/
                    var cr_V_BereichSelectPromise = Barcode.cr_V_BereichView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "cr_V_BereichView: success!");
                        // startContact returns object already parsed from json file in response
                        if (json && json.d && json.d.results.length > 0) {
                            var result = json.d.results[0];
                            var inside = result.Inside;
                            that.binding.visitorFlowCountTotal =
                                (result.ZutritteBereichHeute - result.AustritteBereichHeute);
                            that.binding.visitorFlowCountRest =
                                that.binding.visitorFlowLimit - inside;

                            if (AppData.generalData.limit > inside) {
                                if (result.WarnLimit > 0) {
                                    if (result.WarnLimit > inside) {
                                    that.binding.slotFree = true;
                                    that.binding.slotFull = false;
                                    that.binding.slotWarning = false;
                                } else {
                                    that.binding.slotFree = false;
                                    that.binding.slotFull = false;
                                    that.binding.slotWarning = true;
                                }
                            } else {
                                    that.binding.slotFree = true;
                                    that.binding.slotFull = false;
                                    that.binding.slotWarning = false;
                                }
                            } else {
                                that.binding.slotFree = false;
                                that.binding.slotFull = true;
                                that.binding.slotWarning = false;
                            }
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        that.loading = false;
                    },
                        {TITLE: AppData.generalData.area });
                    return that.addDisposablePromise(cr_V_BereichSelectPromise);
                }).then(function () {
                    if (that.binding.states.barcode) {
                        that.binding.states.barcode = null;
                        that.updateActions();
                        if (parseInt(AppData._persistentStates.showvisitorFlow) === 0) {
                        that.updateStates({ errorMessage: " ", barcode: that.binding.states.barcode });
                            }
                    }

                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            var refreshResults = function (refreshMs) {
                var ret = null;
                Log.call(Log.l.trace, "Time.Controller.", "refreshMs=" + (refreshMs || refreshWaitTimeMs));
                if (refreshResultsPromise) {
                    Log.print(Log.l.info, "Cancelling previous refreshResultsPromise");
                    refreshResultsPromise.cancel();
                }
                if (!refreshMs) {
                    ret = that.loadData();
                }
                if (refreshResultsPromise) {
                    that.removeDisposablePromise(refreshResultsPromise);
                }
                refreshResultsPromise = WinJS.Promise.timeout(refreshMs || refreshWaitTimeMs).then(function () {
                    that.refreshResults();
                });
                that.addDisposablePromise(refreshResultsPromise);
                Log.ret(Log.l.trace);
                return ret || refreshResultsPromise;
            }
            this.refreshResults = refreshResults;

            that.processAll().then(function () {
                if (parseInt(AppData._persistentStates.showvisitorFlow) === 1 ||
                (parseInt(AppData._persistentStates.showvisitorFlow) === 2 &&
                    AppData.generalData.area &&
                    AppData.generalData.inOut)) {
                Colors.loadSVGImageElements(pageElement, "navigate-image", 65, Colors.textColor);
                Colors.loadSVGImageElements(pageElement, "barcode-image");
                    Colors.loadSVGImageElements(pageElement,
                        "scanning-image",
                        65,
                        Colors.textColor,
                        "id",
                        function(svgInfo) {
                    if (svgInfo && svgInfo.element) {
                        that.translateAnimantion(svgInfo.element.firstElementChild ||
                                    svgInfo.element.firstChild,
                                    true);
                    }
                });
                return Colors.loadSVGImageElements(pageElement, "hover-command-icon", 72, Colors.navigationColor);
                } else {
                    return WinJS.Promise.as();
                }
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                that.updateActions();
                AppBar.notifyModified = true;
                if (parseInt(AppData._persistentStates.showvisitorFlow) === 1 || (parseInt(AppData._persistentStates.showvisitorFlow) === 2 && AppData.generalData.area && AppData.generalData.inOut) ) {
                    Barcode.dontScan = true;
                    //First time always call immediately
                    that.refreshResults();
                } else {
                    Barcode.dontScan = false;
                    that.scanBarcode();
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();






