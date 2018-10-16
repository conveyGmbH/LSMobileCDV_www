// controller for page: camera
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/camera/cameraService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

/*
 Structure of states to be set from external modules:
 {
    errorMessage: newErrorMessage:
 }
*/

(function () {
    "use strict";

    WinJS.Namespace.define("Camera", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Camera.Controller.");
            Application.Controller.apply(this, [pageElement, {
                states: {
                    errorMessage: ""
                },
                contact: { KontaktVIEWID: 0 },
                cardscan: { IMPORT_CARDSCANVIEWID: 0 }
            }, commandList]);

            var that = this;

            var updateStates = function(states) {
                Log.call(Log.l.trace, "Camera.Controller.", "errorMessage=" + states.errorMessage + "");
                // nothing to do for now
                that.binding.states.errorMessage = states.errorMessage;
                if (states.errorMessage && states.errorMessage !== "") {
                    var headerComment = pageElement.querySelector(".header-comment");
                    if (headerComment && headerComment.style) {
                        headerComment.style.visibility = "visible";
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.updateStates = updateStates;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    if (!AppBar.busy && WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Camera.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function() {
                    if (WinJS.Navigation.canGoBack === true) {
                        return AppBar.busy;
                    } else {
                        return true;
                    }
                }
            };

            var insertCameradata = function (imageData, width, height) {
                var err = null;
                Log.call(Log.l.trace, "Camera.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    var newContact = {
                        HostName: window.device && window.device.uuid,
                        MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter"),
                        VeranstaltungID: AppData.generalData.getRecordId("Veranstaltung"),
                        Nachbearbeitet: 1
                    };
                    Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                    AppData.setErrorMsg(that.binding);
                    that.binding.contact.KontaktVIEWID = 0;
                    return Camera.contactView.insert(function (json) {
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
                    var newCardscan = {
                        KontaktID: that.binding.contact.KontaktVIEWID,
                        Button: "OCR_TODO"
                    };
                    Log.print(Log.l.trace, "insert newCardscan for KontaktVIEWID=" + newCardscan.KontaktID);
                    AppData.setErrorMsg(that.binding);
                    that.binding.cardscan.IMPORT_CARDSCANVIEWID = 0;
                    return Camera.cardscanView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "contactView: success!");
                        // contactData returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.cardscan = json.d;
                            AppData.generalData.setRecordId("IMPORT_CARDSCAN", that.binding.cardscan.IMPORT_CARDSCANVIEWID);
                        } else {
                            err = { status: 404, statusText: "no data found" };
                            AppData.setErrorMsg(that.binding, err);
                        }
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        err = errorResponse;
                        AppData.setErrorMsg(that.binding, err);
                    }, newCardscan);
                }).then(function () {
                    if (err) {
                        return WinJS.Promise.as();
                    }
                    if (imageData.length < 500000) {
                        // keep original 
                        return WinJS.Promise.as();
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 2560, AppData.generalData.cameraQuality, 0.25);
                }).then(function (resizeData) {
                    if (err) {
                        return WinJS.Promise.as();
                    }
                    if (resizeData) {
                        Log.print(Log.l.trace, "resized");
                        imageData = resizeData;
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 256, AppData.generalData.cameraQuality);
                }).then(function (ovwData) {
                    if (err) {
                        return WinJS.Promise.as();
                    }

                    // UTC-Zeit in Klartext
                    var now = new Date();
                    var dateStringUtc = now.toUTCString();

                    // decodierte Dateigröße
                    var contentLength = Math.floor(imageData.length * 3 / 4);

                    var newPicture = {
                        DOC1IMPORT_CARDSCANVIEWID: AppData.generalData.getRecordId("IMPORT_CARDSCAN"),
                        wFormat: 3,
                        ColorType: 11,
                        ulWidth: width,
                        ulHeight: height,
                        ulDpm: 0,
                        szOriFileNameDOC1: "Visitenkarte.jpg",
                        DocContentDOCCNT1: "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLength +
                            "\x0D\x0A\x0D\x0A" +
                            imageData,
                        ContentEncoding: 4096
                    };
                    if (ovwData) {
                        var contentLengthOvw = Math.floor(ovwData.length * 3 / 4);
                        newPicture.OvwContentDOCCNT3 =
                            "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLengthOvw +
                            "\x0D\x0A\x0D\x0A" +
                            ovwData;
                    }
                    //load of format relation record data
                    Log.print(Log.l.trace, "insert new cameraData for DOC1IMPORT_CARDSCANVIEWID=" + newPicture.DOC1IMPORT_CARDSCANVIEWID);
                    return Camera.doc1cardscanView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "doc1cardscanView: success!");
                        // contactData returns object already parsed from json file in response
                        if (json && json.d) {
                            that.updateStates({ errorMessage: "OK" });
                            AppData.generalData.setRecordId("DOC1IMPORT_CARDSCAN", json.d.DOC1IMPORT_CARDSCANVIEWID);
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
                    }, newPicture);
                }).then(function() {
                    AppBar.busy = false;
                }, function () {
                    AppBar.busy = false;
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertCameradata = insertCameradata;

            var onPhotoDataFail = function (message) {
                Log.call(Log.l.error, "Camera.Controller.");
                //message: The message is provided by the device's native code
                that.updateStates({ errorMessage: message });
                AppBar.busy = false;
                WinJS.Promise.timeout(2000).then(function () {
                    // go back to start
                    if (WinJS.Navigation.location === Application.getPagePath("camera") &&
                        WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                });
                Log.ret(Log.l.error);
                return WinJS.Promise.as();
            }
            this.onPhotoDataFail = onPhotoDataFail;

            var onPhotoDataSuccess = function (imageData, retryCount) {
                retryCount = retryCount || 0;
                var ret = null;
                Log.call(Log.l.trace, "Camera.Controller.", "retryCount=" + retryCount);

                if (imageData && imageData.length > 0) {
                    // Get image handle
                    //
                    var cameraImage = new Image();
                    // Show the captured photo
                    // The inline CSS rules are used to resize the image
                    //
                    cameraImage.src = "data:image/jpeg;base64," + imageData;
                    var width = cameraImage.width;
                    var height = cameraImage.height;
                    Log.print(Log.l.trace, "width=" + width + " height=" + height);
                    if (width > 0 && height > 0) {
                        Log.print(Log.l.trace, "width=" + width + " height=" + height);
                        ret = that.insertCameradata(imageData, width, height);
                    } else if (retryCount < 0) {
                        Log.print(Log.l.trace, "Invalid data ignored");
                    } else if (retryCount < 5) {
                        Log.print(Log.l.info, "Invalid data retry");
                        WinJS.Promise.timeout(100).then(function () {
                            onPhotoDataSuccess(imageData, retryCount + 1);
                        });
                    } else {
                        Log.print(Log.l.error, "Invalid data error");
                        return onPhotoDataFail("Invalid data received!");
                    }
                } else {
                    return onPhotoDataFail("No data received!");
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            this.onPhotoDataSuccess = onPhotoDataSuccess;

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function() {
                Log.call(Log.l.trace, "Camera.Controller.");
                if (that.binding.generalData.useClippingCamera &&
                    navigator.clippingCamera &&
                    typeof navigator.clippingCamera.getPicture === "function") {
                    var autoShutterTime = 0;
                    if (typeof that.binding.generalData.autoShutterTime === "string") {
                        autoShutterTime = parseInt(that.binding.generalData.autoShutterTime);
                    } else if (typeof that.binding.generalData.autoShutterTime === "number") {
                        autoShutterTime = that.binding.generalData.autoShutterTime;
                    }
                    AppBar.busy = true;
                    navigator.clippingCamera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                        quality: AppData.generalData.cameraQuality,
                        convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                        maxResolution: 3000000,
                        autoShutter: autoShutterTime
                    });
                } else {
                    var isWindows10 = false;
                    if (typeof device === "object" && typeof device.platform === "string" && typeof device.version === "string") {
                        if (device.platform.substr(0, 7) === "windows" && device.version.substr(0, 4) === "10.0") {
                            isWindows10 = true;
                        }
                    }
                    if (isWindows10 &&
                        !WinJS.Utilities.isPhone &&
                        navigator.clippingCamera &&
                        typeof navigator.clippingCamera.getPicture === "function") {
                        AppBar.busy = true;
                        navigator.clippingCamera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                            quality: AppData.generalData.cameraQuality,
                            convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                            maxResolution: 2000000,
                            autoShutter: 0,
                            dontClip: true
                        });
                    } else if (navigator.camera && typeof navigator.camera.getPicture === "function") {
                        // shortcuts for camera definitions
                        //pictureSource: navigator.camera.PictureSourceType,   // picture source
                        //destinationType: navigator.camera.DestinationType, // sets the format of returned value
                        Log.print(Log.l.trace, "calling camera.getPicture...");
                        // Take picture using device camera and retrieve image as base64-encoded string
                        AppBar.busy = true;
                        navigator.camera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                            destinationType: Camera.DestinationType.DATA_URL,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            allowEdit: !isWindows10,
                            quality: AppData.generalData.cameraQuality,
                            targetWidth: -1,
                            targetHeight: -1,
                            encodingType: Camera.EncodingType.JPEG,
                            saveToPhotoAlbum: false,
                            cameraDirection: Camera.Direction.BACK,
                            convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                            variableEditRect: true
                        });
                    } else {
                        Log.print(Log.l.error, "camera.getPicture not supported...");
                        that.updateStates({ errorMessage: "Camera plugin not supported" });
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.takePhoto = takePhoto;

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                return WinJS.Promise.timeout(0);
            }).then(function() {
                if (!CameraGlobals.dontCapture) {
                    that.takePhoto();
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();
