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

    var b64 = window.base64js;

    WinJS.Namespace.define("Camera", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Camera.Controller.");
            Application.Controller.apply(this, [pageElement, {
                states: {
                    errorMessage: ""
                },
                contact: { KontaktVIEWID: 0 },
                cardscan: { IMPORT_CARDSCANVIEWID: 0 },
                ocrResult: null
            }, commandList]);

            var that = this;

            // Get the drawing context
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = 0;
            canvas.height = 0;
            var imagesObjects = [];
            var isLicenceKeyValid = true;
            var isAppleDevice = AppData.checkIPhoneBug();

            var updateStates = function (states) {
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
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return AppBar.busy;
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

            var loadDataFile = function (dataDirectory, fileName, bUseRootDir, retryCount) {
                var fileExt;
                var filePath;
                var ret = null;
                Log.call(Log.l.trace, "WavSketch.Controller.", "dataDirectory=" + dataDirectory + " fileName=" + fileName + " bUseRootDir=" + bUseRootDir);
                var readFileFromDirEntry = function (dirEntry) {
                    if (dirEntry) {
                        Log.print(Log.l.info, "resolveLocalFileSystemURL: dirEntry open!");
                        dirEntry.getFile(filePath, {
                            create: false,
                            exclusive: false
                        },
                        function (fileEntry) {
                            if (fileEntry) {
                                Log.print(Log.l.info, "resolveLocalFileSystemURL: fileEntry open!");
                                var deleteFile = function () {
                                    fileEntry.remove(function () {
                                        Log.print(Log.l.info, "file deleted!");
                                    },
                                    function (errorResponse) {
                                        Log.print(Log.l.error, "file delete: Failed remove file " + filePath + " error: " + JSON.stringify(errorResponse));
                                    },
                                    function () {
                                        Log.print(Log.l.trace, "file delete: extra ignored!");
                                    });
                                }
                                fileEntry.file(function (file) {
                                    ret = FileP.read(file).then(function (result) {
                                        var data = new Uint8Array(result);
                                        var encoded = b64.fromByteArray(data);
                                        if (encoded && encoded.length > 0) {
                                            var cameraImage = new Image();
                                            var width = cameraImage.width;
                                            var height = cameraImage.height;
                                            // Show the captured photo
                                            // The inline CSS rules are used to resize the image
                                            cameraImage.onload = function () {
                                                var width = this.width;
                                                var height = this.height;
                                                Log.print(Log.l.trace, "width=" + width + " height=" + height);
                                                //ctx.drawImage(cameraImage, 0, 0);
                                                imagesObjects.push(this);
                                                return WinJS.Promise.as();
                                            }
                                            cameraImage.onerror = function () {
                                                Log.print(Log.l.error, "Invalid data error");
                                                return onPhotoDataFail("Invalid data received!");
                                            }
                                            cameraImage.src = "data:image/jpeg;base64," + encoded;
                                        } else {
                                            var err = "file read error NO data!";
                                            Log.print(Log.l.error, err);
                                            AppData.setErrorMsg(that.binding, err);
                                        }
                                        deleteFile();
                                        AppBar.busy = false;
                                        //return WinJS.Promise.as();
                                    }, function (errorResponse) {
                                        Log.print(Log.l.error,
                                            "Failed read file " +
                                            filePath +
                                            " error: " +
                                            JSON.stringify(errorResponse));
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        deleteFile();
                                        AppBar.busy = false;
                                    });
                                }, function (errorResponse) {
                                    Log.print(Log.l.error, "file read error: " + JSON.stringify(errorResponse));
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    deleteFile();
                                    AppBar.busy = false;
                                });
                            } else {
                                var err = "file read error NO fileEntry!";
                                Log.print(Log.l.error, err);
                                AppData.setErrorMsg(that.binding, err);
                                AppBar.busy = false;
                            }
                        },
                        function (errorResponse) {
                            Log.print(Log.l.error,
                                "getFile(" + filePath + ") error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        var err = "file read error NO dirEntry!";
                        Log.print(Log.l.error, err);
                        AppData.setErrorMsg(that.binding, err);
                        AppBar.busy = false;
                    }
                }

                var fileExtPos = fileName.lastIndexOf(".");
                if (fileExtPos >= 0) {
                    fileExt = fileName.substr(fileExtPos + 1);
                }
                if (bUseRootDir) {
                    filePath = decodeURI(dataDirectory + "/" + fileName);
                    if (typeof window.requestFileSystem === "function") {
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                            readFileFromDirEntry(fs.root);
                        }, function (errorResponse) {
                            Log.print(Log.l.error, "requestFileSystem error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        Log.print(Log.l.error, "requestFileSystem is undefined");
                        AppBar.busy = false;
                    }
                } else {
                    filePath = fileName;
                    if (typeof window.resolveLocalFileSystemURL === "function") {
                        window.resolveLocalFileSystemURL(dataDirectory, readFileFromDirEntry, function (errorResponse) {
                            Log.print(Log.l.error, "resolveLocalFileSystemURL error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        Log.print(Log.l.error, "resolveLocalFileSystemURL is undefined");
                        AppBar.busy = false;
                    }
                }
                Log.ret(Log.l.trace);
                return ret || WinJS.Promise.as();
            };
            this.loadDataFile = loadDataFile;

            var insertCameradata = function (imageData, width, height) {
                var err = null;
                Log.call(Log.l.trace, "Camera.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    var newContact = {
                        HostName: window.device && window.device.uuid,
                        MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter"),
                        VeranstaltungID: AppData.generalData.getRecordId("Veranstaltung"),
                        Nachbearbeitet: 1,
                        Freitext4: that.binding.ocrResult
                        /*Freitext1: that.binding.ocrResult
                        Freitext4: AppData.generalData.area,
                        Freitext5: AppData.generalData.inOut*/
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
                    /*if (imageData.length < 500000) {
                        // keep original
                        return WinJS.Promise.as();
                    }*/
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

                    // decodierte Dateigr��e
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
                            return WinJS.Promise.timeout(0).then(function () {
                                // do the following in case of success:
                                // go on to questionnaire
                                Application.navigateById("questionnaire", null, true);
                                // accelarate replication
                                if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                    var numFastReqs = 10;
                                    AppRepl.replicator.run(AppData._persistentStates.odata.numFastReqs || numFastReqs);
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
                }).then(function () {
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

            var onPhotoDataSuccess = function (imageData) {
                Log.call(Log.l.trace, "Camera.Controller.");
                if (imageData && imageData.length > 0) {
                    var promise;
                    if (isAppleDevice || that.binding.generalData.useClippingCamera || CameraGlobals.dontCapture) {
                        promise = WinJS.Promise.as();
                    } else {
                        promise = ImgTools.crop(imageData);
                    }
                    promise.then(function(cropImageData) {
                        if (cropImageData) {
                            imageData = cropImageData;
                        }
                        // Get image handle
                        //
                        var cameraImage = new Image();
                        // Show the captured photo
                        // The inline CSS rules are used to resize the image
                        // compare data:image
                        cameraImage.onload = function () {
                            var width = cameraImage.width;
                            var height = cameraImage.height;
                            Log.print(Log.l.trace, "width=" + width + " height=" + height);

                            // todo: create preview from imageData
                            that.insertCameradata(imageData, width, height);
                        }
                        var dataURLMimeType = "data:image/jpeg;base64,";
                        if (imageData.substr(0, dataURLMimeType.length) === dataURLMimeType) {
                            cameraImage.src = imageData;
                        } else {
                            cameraImage.src = "data:image/jpeg;base64," + imageData;
                        }
                    });
                } else if (imageData && imageData.scans && imageData.scans.length > 0) {
                    //WinJS.Promise.timeout(100).then(function () {
                    var mediaFiles = imageData.scans;
                    var filePromises = [];
                    var fileData = [];
                    if (mediaFiles) {
                        var i, len;
                        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                            var bUseRootDir = false;
                            var rootDirectory = cordova.file.externalRootDirectory;;
                            var dataDirectory = "";
                            var fullPath = mediaFiles[i].enhancedUrl;
                            //var ocrResult = null;
                            if (mediaFiles[i].ocrResult && mediaFiles[i].ocrResult.text) {
                                that.binding.ocrResult = mediaFiles[i].ocrResult.text;
                            } else {
                                that.binding.ocrResult = mediaFiles[i].ocrResult;
                            }
                            var pos = fullPath.lastIndexOf("/");
                            if (pos < 0) {
                                pos = fullPath.lastIndexOf("\\");
                            }
                            var fileName;
                            if (pos >= 0) {
                                fileName = fullPath.substr(pos + 1);
                            } else {
                                fileName = fullPath;
                            }
                            if (typeof device === "object") {
                                Log.print(Log.l.trace, "platform=" + device.platform);
                                switch (device.platform) {
                                    case "Android":
                                        if (pos >= 0) {
                                            dataDirectory = fullPath.substr(0, pos);
                                            if (dataDirectory.indexOf(rootDirectory) >= 0) {
                                                dataDirectory = dataDirectory.replace(rootDirectory, "");
                                                bUseRootDir = true;
                                            }
                                        }
                                        break;
                                    case "iOS":
                                        dataDirectory = cordova.file.tempDirectory;
                                        break;
                                    default:
                                        dataDirectory = cordova.file.dataDirectory;
                                }
                            } else {
                                dataDirectory = cordova.file.dataDirectory;
                            }
                            //loadFile
                            filePromises.push(FileP.load(dataDirectory, fileName, bUseRootDir).then(function (result) {
                                //FileP.deleteFile(dataDirectory, fileName, bUseRootDir);
                                var data = new Uint8Array(result);
                                var encoded = b64.fromByteArray(data);
                                if (encoded && encoded.length > 0) {
                                    fileData.push(encoded);
                                } else {
                                    var err = "file read error NO data!";
                                    Log.print(Log.l.error, err);
                                    AppData.setErrorMsg(that.binding, err);
                                }
                            }));
                        }
                        var cameraImages = [];

                        WinJS.Promise.join(filePromises).then(function () {
                            var imagePromises = [];
                            var loadImage = function (encoded) {
                                var cameraImage = new Image();
                                imagePromises.push(new WinJS.Promise(function makeImage(complete, error, progress) {
                                    cameraImage.onload = function () {
                                        cameraImages.push(cameraImage);
                                        complete(cameraImage);
                                    }
                                    cameraImage.onerror = function () {
                                        Log.print(Log.l.error, "Invalid data error");
                                        return error("Error loading image");
                                    }
                                    cameraImage.src = "data:image/jpeg;base64," + encoded;
                                }));
                            }
                            for (var i = 0; i < fileData.length; i++) {
                                loadImage(fileData[i]);
                            }
                            return WinJS.Promise.join(imagePromises);
                            // Show the captured photo
                            // The inline CSS rules are used to resize the image

                        }).then(function () {
                            canvas.width = canvas.width + cameraImages[0].width;
                            for (var i = 0; i < cameraImages.length; i++) {
                                canvas.height = canvas.height + cameraImages[i].height;
                            }
                            var x = 0;
                            var y = 0;
                            for (var i = 0; i < cameraImages.length; i++) {
                                ctx.drawImage(cameraImages[i], x, y);
                                y = y + cameraImages[i].height;
                            }
                            var base64Canvas = canvas.toDataURL("image/jpeg").split(';base64,')[1];
                            that.insertCameradata(base64Canvas, canvas.width, canvas.height);
                        });
                    }
                } else {
                    return onPhotoDataFail("No data received!");
                }
                Log.ret(Log.l.trace);
            }
            this.onPhotoDataSuccess = onPhotoDataSuccess;

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function () {
                Log.call(Log.l.trace, "Camera.Controller.");
                var autoShutterTime = 0;
                var cameraQuality = 0;
                var cameraMegapixel = 0;
                if (typeof AppData.generalData.cameraQuality === "string") {
                    cameraQuality = parseInt(AppData.generalData.cameraQuality);
                } else if (typeof that.binding.generalData.cameraQuality === "number") {
                    cameraQuality = AppData.generalData.cameraQuality;
                }
                if (typeof AppData.generalData.cameraMegapixel === "string") {
                    cameraMegapixel = parseInt(AppData.generalData.cameraMegapixel);
                } else if (typeof AppData.generalData.cameraMegapixel === "number") {
                    cameraMegapixel = AppData.generalData.cameraMegapixel;
                }
                if (that.binding.generalData.useClippingCamera &&
                    typeof scan === "object" &&
                    typeof scan.scanDoc === "function") {
                    AppBar.busy = true;
                    scan.scanDoc(onPhotoDataSuccess, onPhotoDataFail, {
                        sourceType: 1,
                        returnBase64: true,
                        fileName: "photo",
                        quality: (1.0 - cameraQuality / 100.0) * 4.0 + 1.0,
                        convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                        maxResolution: cameraMegapixel * 1000000,
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
                        typeof scan === "object" &&
                        typeof scan.scanDoc === "function") {
                        AppBar.busy = true;
                        scan.scanDoc(onPhotoDataSuccess, onPhotoDataFail, {
                            sourceType: 1,
                            returnBase64: true,
                            fileName: "photo",
                            quality: (1.0 - cameraQuality / 100.0) * 4.0 + 1.0,
                            convertToGrayscale: AppData.generalData.cameraUseGrayscale,
                            maxResolution: cameraMegapixel * 1000000,
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
                            correctOrientation: true,
                            allowEdit: isAppleDevice, //!isWindows10
                            quality: typeof AppData.generalData.cameraQuality === "string" ? parseInt(AppData.generalData.cameraQuality) : AppData.generalData.cameraQuality,
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

            var takePhotoWithGeniusScan = function () {
                Log.call(Log.l.trace, "Camera.Controller.");
                function onError(error) {
                    Log.print(Log.l.error, "camera.cordova.plugins.GeniusScan.scanWithConfiguration not supported..." + JSON.stringify(error));
                }

                function copy(filepath, toDirectory, filename, callback) {
                    Log.call(Log.l.trace, "Camera.Controller.");
                    window.resolveLocalFileSystemURL(filepath, function (fileEntry) {
                        window.resolveLocalFileSystemURL(toDirectory, function (dirEntry) {
                            dirEntry.getFile(filename, { create: true, exclusive: false }, function (targetFileEntry) {
                                fileEntry.file(function (file) {
                                    targetFileEntry.createWriter(function (fileWriter) {
                                        fileWriter.onwriteend = function() {
                                            callback();
                                        };
                                        fileWriter.write(file);
                                    });
                                });
                            }, onError);
                        }, onError);
                    }, onError);
                    Log.ret(Log.l.trace);
                }

                if (that.binding.generalData.useClippingCamera &&
                    cordova.plugins.GeniusScan &&
                    typeof cordova.plugins.GeniusScan.scanWithConfiguration === "function") {
                    //Log.print(Log.l.trace, "Copy Directory - cordova.file.externalDataDirectory: " + cordova.file.externalDataDirectory + " or cordova.file.dataDirectory: " + cordova.file.dataDirectory + " for platform" + device.platform);
                    var appFolder = device.platform === "Android" ? cordova.file.externalDataDirectory : cordova.file.applicationDirectory + "www/ocrlanguage";
                    //copy(cordova.file.applicationDirectory + "www/ocrlanguage/eng.traineddata", appFolder, "eng.traineddata", function () {
                    //    copy(cordova.file.applicationDirectory + "www/ocrlanguage/deu.traineddata", appFolder, "deu.traineddata", function () {
                    var configuration = {
                        source: "camera"/*,
                        ocrConfiguration: {
                            languages: ["eng", "deu"],
                            languagesDirectoryUrl: appFolder
                        }*/
                    };
                    cordova.plugins.GeniusScan.scanWithConfiguration(configuration, onPhotoDataSuccess, onPhotoDataFail);
                    //});
                    //});
                } else {
                    Log.print(Log.l.error, "camera.cordova.plugins.GeniusScan.scanWithConfiguration not supported...");
                    that.updateStates({ errorMessage: "cordova.plugins.GeniusScan.scanWithConfiguration not supported" });
                }
                Log.ret(Log.l.trace);
            }
            this.takePhotoWithGeniusScan = takePhotoWithGeniusScan;

            that.processAll().then(function () {
                // useClippingCamera useClippingCameraNewMode
                if (that.binding.generalData.useClippingCamera &&
                    cordova.plugins.GeniusScan &&
                    typeof cordova.plugins.GeniusScan.setLicenseKey === "function") {
                    cordova.plugins.GeniusScan.setLicenseKey(
                        "533c500753530303015c0f513955504d070c5c12514f1c75317b5b045e54557326623b530f0203045600020a5b", false,
                        function (success) {
                            Log.print(Log.l.trace, "LicenceKey valid" + success);
                            return WinJS.Promise.as();
                        },
                        function (error) {
                            Log.print(Log.l.error, "LicenceKey not valid" + error);
                            isLicenceKeyValid = false;
                            return WinJS.Promise.as();
                        });
                } else {
                    Log.print(Log.l.trace, "Not Using Genius Scan");
                    return WinJS.Promise.as();
                }
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                return WinJS.Promise.timeout(0);
            }).then(function () {
                if (!CameraGlobals.dontCapture) {
                    if (isLicenceKeyValid && that.binding.generalData.useClippingCamera &&
                        cordova.plugins.GeniusScan) {
                        that.takePhotoWithGeniusScan();
                    } else {
                        that.takePhoto();
                    }
                }
            });
            Log.ret(Log.l.trace);
        })
    });
})();
