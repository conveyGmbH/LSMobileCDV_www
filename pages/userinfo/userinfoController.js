// controller for page: userInfo
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/userinfo/userinfoService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/CameraConstants.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("UserInfo", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "UserInfo.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataBenutzer: UserInfo.benutzerView && getEmptyDefaultValue(UserInfo.benutzerView.defaultValue),
                InitAnredeItem: { InitAnredeID: 0, TITLE: "" },
                InitLandItem: { InitLandID: 0, TITLE: "" },
                dataPhoto: {},
                photoData: null,
                newInfo2Flag: 0,
                visitorFlowFeature: AppData._persistentStates.showvisitorFlow === 1 ||
                    AppData._persistentStates.showvisitorFlow === 2
                    ? true
                    : false
            }, commandList]);
            this.img = null;

            var that = this;

            // show business card photo
            var photoContainer = pageElement.querySelector(".photo-container");

            // select element
            var initAnrede = pageElement.querySelector("#InitAnrede");
            var initLand = pageElement.querySelector("#InitLand");

            var isAppleDevice = AppData.checkIPhoneBug();

            var setInitAnredeItem = function (newInitAnredeItem) {
                Log.call(Log.l.trace, "UserInfo.Controller.");
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitAnredeItem = newInitAnredeItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                Log.ret(Log.l.trace);
            }
            this.setInitAnredeItem = setInitAnredeItem;

            var removePhoto = function () {
                if (photoContainer) {
                    var oldElement = photoContainer.firstElementChild || photoContainer.firstChild;
                    if (oldElement) {
                        oldElement.parentNode.removeChild(oldElement);
                        oldElement.innerHTML = "";
                    }
                }
                var userImg = pageElement.querySelector("#userImg");
                if (userImg) {
                    userImg.parentNode.removeChild(userImg);
                }
            }

            this.dispose = function () {
                if (that.img) {
                    removePhoto();
                    that.img.src = "";
                    that.img = null;
                }
            }

            var showPhoto = function () {
                if (photoContainer) {
                    if (that.binding.photoData) {
                        that.img = new Image();
                        that.img.id = "pagePhoto";
                        photoContainer.appendChild(that.img);
                        WinJS.Utilities.addClass(that.img, "page-photo");
                        //that.img.src = "data:image/jpeg;base64," + that.binding.photoData;
                        var dataURLMimeType = "data:image/jpeg;base64,";
                        if (that.binding.photoData.substr(0, dataURLMimeType.length) === dataURLMimeType) {
                            that.img.src = that.binding.photoData;
                        } else {
                            that.img.src = "data:image/jpeg;base64," + that.binding.photoData;
                        }
                        if (photoContainer.childElementCount > 1) {
                            var oldElement = photoContainer.firstElementChild || photoContainer.firstChild;
                            if (oldElement) {
                                oldElement.parentNode.removeChild(oldElement);
                                oldElement.innerHTML = "";
                            }
                        }
                    } else {
                        removePhoto();
                    }
                }
                AppBar.triggerDisableHandlers();
            }

            // toggle
            var presentSwitch = pageElement.querySelector("#presentSwitch");
            // select element
            var initBenAnw = pageElement.querySelector("#InitBenAnw");

            var cr_V_bereich = pageElement.querySelector("#cr_V_bereich");

            var setDataBenutzer = function(newDataBenutzer) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                if (newDataBenutzer.Info1 === null) {
                    newDataBenutzer.Info1 = "";
                }
                if (newDataBenutzer.Info2 && !newDataBenutzer.Info2TSRead) {
                    that.binding.newInfo2Flag = 1;
                } else {
                    that.binding.newInfo2Flag = 0;
                }
                that.binding.dataBenutzer = newDataBenutzer;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
                AppBar.triggerDisableHandlers();
            };
            this.setDataBenutzer = setDataBenutzer;

            var getRecordId = function() {
                Log.call(Log.l.trace, "UserInfo.Controller.");
                var recordId = AppData.getRecordId("Benutzer");
                Log.ret(Log.l.trace, recordId);
                return recordId;
            };
            this.getRecordId = getRecordId;

            var setRecordId = function(recordId) {
                Log.call(Log.l.trace, "UserInfo.Controller.", recordId);
                AppData.setRecordId("Benutzer", recordId);
                Log.ret(Log.l.trace);
            };
            this.setRecordId = setRecordId;

            var resultCrVBereichConverter = function (item, index) {
                //item.TITLE = item.TITLE + (!!item.Eingang ? " " + getResourceText("userinfo.entry") : "") + (!!item.Ausgang ? " " + getResourceText("userinfo.exit") : "");
            };
            this.resultCrVBereichConverter = resultCrVBereichConverter;

            var loadData = function() {
                var recordId = AppData.getRecordId("Mitarbeiter");
                Log.call(Log.l.trace, "UserInfo.Controller.", "recordId=" + recordId);
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!UserInfo.initBenAnwView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initBenAnw...");
                        //@nedra:04.03.2016: load the list of INITBenAnw for Combobox
                        return UserInfo.initBenAnwView.select(function(json) {
                            Log.print(Log.l.trace, "initBenAnwView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initBenAnw && initBenAnw.winControl) {
                                    initBenAnw.winControl.data = new WinJS.Binding.List(json.d.results);
                                }
                            }
                        }, function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        if (initBenAnw && initBenAnw.winControl) {
                            initBenAnw.winControl.data = new WinJS.Binding.List(UserInfo.initBenAnwView.getResults());
                        }
                        return WinJS.Promise.as();
                    }
                }).then(function() {
                    Log.print(Log.l.trace, "calling select CR_V_Bereich_ODataVIEW...");
                    return UserInfo.CR_V_Bereich_ODataVIEW.select(function (json) {
                        Log.print(Log.l.trace, "CR_V_Bereich_ODataVIEW: success!");
                        if (json && json.d && json.d.results) {
                            var results = [
                                { CR_V_BereichVIEWID: 0, TITLE: "" }
                            ];
                            json.d.results.forEach(function (item, index) {
                                that.resultCrVBereichConverter(item, index);
                                results.push(item);
                            });
                            /*var results = json.d.results;
                            results.forEach(function(item, index) {
                                that.resultCrVBereichConverter(item, index);
                            });*/
                            if (cr_V_bereich && cr_V_bereich.winControl) {
                                cr_V_bereich.winControl.data = new WinJS.Binding.List(results);
                            }
                        }
                    }, function (errorResponse) {
                        // ignore that
                    });
                    }).then(function () {
                        if (!AppData.initAnredeView.getResults().length) {
                            Log.print(Log.l.trace, "calling select initAnredeView...");
                            //@nedra:25.09.2015: load the list of INITAnrede for Combobox
                            return AppData.initAnredeView.select(function (json) {
                                Log.print(Log.l.trace, "initAnredeView: success!");
                                if (json && json.d && json.d.results) {
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    if (initAnrede && initAnrede.winControl) {
                                        initAnrede.winControl.data = new WinJS.Binding.List(json.d.results);
                                    }
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "initAnredeView: error!");
                                AppData.setErrorMsg(that.binding, errorResponse);
                            });
                        } else {
                            if (initAnrede && initAnrede.winControl &&
                                (!initAnrede.winControl.data || !initAnrede.winControl.data.length)) {
                                initAnrede.winControl.data = new WinJS.Binding.List(AppData.initAnredeView.getResults());
                            }
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                        if (!AppData.initLandView.getResults().length) {
                            Log.print(Log.l.trace, "calling select initLandView...");
                            //@nedra:25.09.2015: load the list of INITLand for Combobox
                            return AppData.initLandView.select(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.trace, "initLandView: success!");
                                if (json && json.d && json.d.results) {
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    if (initLand && initLand.winControl) {
                                        initLand.winControl.data = new WinJS.Binding.List(json.d.results);
                                    }
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "initLandView: error!");
                                AppData.setErrorMsg(that.binding, errorResponse);
                            });
                        } else {
                            if (initLand && initLand.winControl &&
                                (!initLand.winControl.data || !initLand.winControl.data.length)) {
                                initLand.winControl.data = new WinJS.Binding.List(AppData.initLandView.getResults());
                            }
                            return WinJS.Promise.as();
                        }
                    }).then(function () {
                    if (recordId) {
                        //load of format relation record data
                        Log.print(Log.l.trace, "calling select benutzerView...");
                        return UserInfo.benutzerView.select(function(json) {
                            AppData.setErrorMsg(that.binding);
                            Log.print(Log.l.trace, "benutzerView: success!");
                            if (json && json.d) {
                                that.setDataBenutzer(json.d);
                                setRecordId(that.binding.dataBenutzer.BenutzerVIEWID);
                            }
                        }, function(errorResponse) {
                            if (errorResponse.status === 404) {
                                // ignore NOT_FOUND error here!
                                that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                            } else {
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }
                        }, recordId);
                    } else {
                        that.setDataBenutzer(getEmptyDefaultValue(UserInfo.benutzerView.defaultValue));
                        return WinJS.Promise.as();
                    }
                }).then(function() {
                    if (recordId) {
                        // todo: load image data and set src of img-element
                        Log.print(Log.l.trace, "calling select contactView...");
                        return UserInfo.userPhotoView.select(function (json) {
                            Log.print(Log.l.trace, "userPhotoView: success!");
                            if (json && json.d) {
                                that.binding.dataPhoto = json.d;
                                Log.print(Log.l.info, "DOC1MitarbeiterVIEWID=" + json.d.DOC1MitarbeiterVIEWID);
                                var docContent = json.d.DocContentDOCCNT1;
                                if (docContent) {
                                    var sub = docContent.search("\r\n\r\n");
                                    if (sub >= 0) {
                                        var newContent = docContent.substr(sub + 4);
                                        if (newContent && newContent !== "null" &&
                                            (!that.binding.photoData || that.binding.photoData !== newContent)) {
                                            that.binding.photoData = newContent;
                                            showPhoto();
                                        }
                                    }
                                }
                            }
                        }, function (errorResponse) {
                            // ignore that
                            that.binding.photoData = "";
                            removePhoto();
                        }, recordId);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function(complete, error) {
                Log.call(Log.l.trace, "UserInfo.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret;
                if (typeof that.binding.dataBenutzer.CR_V_BereichID === "string") {
                    that.binding.dataBenutzer.CR_V_BereichID = parseInt(that.binding.dataBenutzer.CR_V_BereichID);
                    if (that.binding.dataBenutzer.CR_V_BereichID === 0) {
                        that.binding.dataBenutzer.CR_V_BereichID = null;
                    }
                }
                if (typeof that.binding.dataBenutzer.Eingang === "boolean") {
                    that.binding.dataBenutzer.Eingang = that.binding.dataBenutzer.Eingang ? 1 : null;
                }
                if (typeof that.binding.dataBenutzer.Ausgang === "boolean") {
                    that.binding.dataBenutzer.Ausgang = that.binding.dataBenutzer.Ausgang ? 1 : null;
                }
                if (that.binding.dataBenutzer.CR_V_BereichID && !that.binding.dataBenutzer.Eingang && !that.binding.dataBenutzer.Ausgang) {
                    that.binding.dataBenutzer.Eingang = 1;
                }
                var dataBenutzer = that.binding.dataBenutzer;
                if (dataBenutzer && AppBar.modified) {
                    var recordId = getRecordId();
                    if (recordId) {
                        ret = UserInfo.benutzerView.update(function(response) {
                            // called asynchronously if ok
                            // force reload of userData for Present flag
                            AppBar.modified = false;
                            AppData.getUserData();
                            complete(response);
                        }, function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                        }, recordId, dataBenutzer);
                    } else {
                        dataBenutzer.BenutzerVIEWID = AppData.getRecordId("Mitarbeiter");
                        ret = UserInfo.benutzerView.insert(function(json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "dataBenutzer: success!");
                            // dataBenutzer returns object already parsed from json file in response
                            if (json && json.d) {
                                that.setDataBenutzer(json.d);
                                setRecordId(that.binding.dataBenutzer.BenutzerVIEWID);
                                // force reload of userData for Present flag
                                AppData.getUserData();
                            }
                            complete(json);
                        }, function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                        }, dataBenutzer);
                    }
                } else {
                    ret = new WinJS.Promise.as().then(function() {
                        complete(dataBenutzer);
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            var insertCameradata = function (imageData, width, height) {
                AppBar.busy = true;
                Log.call(Log.l.trace, "UserInfo.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 1024);
                }).then(function (resizeData) {
                    if (resizeData) {
                        Log.print(Log.l.trace, "resized");
                        imageData = resizeData;
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 256);
                }).then(function (ovwData) {
                    // UTC-Zeit in Klartext
                    var now = new Date();
                    var dateStringUtc = now.toUTCString();

                    // decodierte Dateigröße
                    var contentLength = Math.floor(imageData.length * 3 / 4);

                    var newPicture = {
                        DOC1MitarbeiterVIEWID: AppData.generalData.getRecordId("Mitarbeiter"),
                        wFormat: 3,
                        ColorType: 11,
                        ulWidth: width,
                        ulHeight: height,
                        ulDpm: 0,
                        szOriFileNameDOC1: "User.jpg",
                        DocContentDOCCNT1:
                        "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " + dateStringUtc + "\x0D\x0AContent-Length: " + contentLength + "\x0D\x0A\x0D\x0A" + imageData,
                        PrevContentDOCCNT2: null,
                        OvwContentDOCCNT3: null,
                        szOvwPathDOC3: null,
                        szPrevPathDOC4: null,
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
                    if (that.binding.dataPhoto &&
                        that.binding.dataPhoto.DOC1MitarbeiterVIEWID === newPicture.DOC1MitarbeiterVIEWID) {
                        Log.print(Log.l.trace, "update cameraData for DOC1MitarbeiterVIEWID=" + newPicture.DOC1MitarbeiterVIEWID);
                        return UserInfo.userPhotoView.update(function(json) {
                            // called asynchronously if ok
                            Log.print(Log.l.info, "userPhotoView update: success!");
                            that.loadData();
                            if (typeof AppHeader === "object" &&
                                AppHeader.controller &&
                                AppHeader.controller.loadData === "function") {
                                AppHeader.controller.loadData();
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newPicture.DOC1MitarbeiterVIEWID, newPicture);
                    } else {
                        //load of format relation record data
                        Log.print(Log.l.trace, "insert new cameraData for DOC1MitarbeiterVIEWID=" + newPicture.DOC1MitarbeiterVIEWID);
                        return UserInfo.userPhotoView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "userPhotoView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.binding.dataPhoto = json.d;
                                Log.print(Log.l.info, "DOC1MitarbeiterVIEWID=" + json.d.DOC1MitarbeiterVIEWID);
                                var docContent = that.binding.dataPhoto.DocContentDOCCNT1;
                                if (docContent) {
                                    var sub = docContent.search("\r\n\r\n");
                                    if (sub >= 0) {
                                        var newContent = docContent.substr(sub + 4);
                                        if (newContent && newContent !== "null" &&
                                            (!that.binding.photoData || that.binding.photoData !== newContent)) {
                                            that.binding.photoData = newContent;
                                            showPhoto();
                                        }
                                    }
                                }
                                if (typeof AppHeader === "object" &&
                                    AppHeader.controller &&
                                    AppHeader.controller.loadData === "function") {
                                    AppHeader.controller.loadData();
                                }
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                            return WinJS.Promise.as();
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        }, newPicture);
                    }
                }).then(function () {
                    AppBar.busy = false;
                    AppData.getUserData();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertCameradata = insertCameradata;

            var onPhotoDataSuccess = function (imageData) {
                Log.call(Log.l.trace, "UserInfo.Controller.");
                if (imageData && imageData.length > 0) {
                    var promise;
                    if (isAppleDevice) {
                        promise = WinJS.Promise.as();
                    } else {
                        promise = ImgTools.crop(imageData, true);
                    }
                    promise.then(function (cropImageData) {
                        if (cropImageData) {
                            imageData = cropImageData;
                        }
                        // Get image handle
                        //
                        var cameraImage = new Image();
                        // Show the captured photo
                        // The inline CSS rules are used to resize the image
                        //
                        //cameraImage.src = "data:image/jpeg;base64," + imageData;
                        // compare data:image
                        cameraImage.onload = function() {
                            var width = cameraImage.width;
                            var height = cameraImage.height;
                            Log.print(Log.l.trace, "width=" + width + " height=" + height);

                            // todo: create preview from imageData
                            that.insertCameradata(imageData, width, height);
                        }
                        var dataURLMimeType = "data:image/jpeg;base64,";
                        if (cropImageData.substr(0, dataURLMimeType.length) === dataURLMimeType) {
                            cameraImage.src = imageData;
                        } else {
                            cameraImage.src = "data:image/jpeg;base64," + imageData;
                        }
                    }, function (err) {
                        AppData.setErrorMsg(that.binding, err);
                        AppBar.busy = false;
                    });
                }
                Log.ret(Log.l.trace);
            }

            var onPhotoDataFail = function (message) {
                Log.call(Log.l.error, "UserInfo.Controller.");
                //message: The message is provided by the device's native code
                //AppData.setErrorMsg(that.binding, message);
                AppBar.busy = false;
                Log.ret(Log.l.error);
            }

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function () {
                Log.call(Log.l.trace, "UserInfo.Controller.");
                var isWindows10 = false;
                if (typeof device === "object" && typeof device.platform === "string" && typeof device.version === "string") {
                    if (device.platform.substr(0, 7) === "windows" && device.version.substr(0, 4) === "10.0") {
                        isWindows10 = true;
                    }
                }
                if (isWindows10 &&
                    !WinJS.Utilities.isPhone &&
                    scan &&
                    typeof scan.scanDoc === "function") {
                    AppBar.busy = true;
                    scan.scanDoc(onPhotoDataSuccess, onPhotoDataFail, {
                        sourceType: 2, // front camera
                        returnBase64: true,
                        fileName: "photo",
                        quality: 50,
                        convertToGrayscale: false,
                        maxResolution: 2100000,
                        autoShutter: 0,
                        dontClip: true
                    });
                } else if (navigator.camera &&
                    typeof navigator.camera.getPicture === "function") {
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
                        allowEdit: isAppleDevice,
                        quality: 50,
                        targetWidth: 1024,
                        targetHeight: 1024,
                        encodingType: Camera.EncodingType.JPEG,
                        saveToPhotoAlbum: false,
                        cameraDirection: Camera.Direction.FRONT
                    });
                } else {
                    Log.print(Log.l.error, "camera.getPicture not supported...");
                    AppData.setErrorMsg(that.binding, { errorMessage: "Camera plugin not supported" });
                }
                Log.ret(Log.l.trace);
            }
            this.takePhoto = takePhoto;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "UserInfo.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    } else {
                        Application.navigateById("start", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickVcard: function(event) {
                    Log.call(Log.l.trace, "UserInfo.Controller.");
                    Application.navigateById("uservcard", event);
                    Log.ret(Log.l.trace);
                },
                clickPhoto: function(event) {
                    Log.call(Log.l.trace, "UserInfo.Controller.");
                    that.takePhoto();
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Account.Controller.");
                    if (presentSwitch && presentSwitch.winControl) {
                        presentSwitch.winControl.checked = !presentSwitch.winControl.checked;
                    }
                    Log.ret(Log.l.trace);
                },
                pressEnterKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    if (event && event.keyCode === WinJS.Utilities.Key.enter &&
                        event.currentTarget && event.currentTarget.tagName &&
                        event.currentTarget.tagName.toLowerCase() === "textarea") {
                        if (event.stopPropagation) {
                            event.stopPropagation();
                        } else {
                            event.cancelBubble = true;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                activateEnterKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickOk") {
                            AppBar.commandList[i].key = WinJS.Utilities.Key.enter;
                            break;
                        }
                    }
                    if (event && event.currentTarget && !event.currentTarget.value) {
                        WinJS.Utilities.removeClass(event.currentTarget, "field-text-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                deactivateEnterKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickOk") {
                            AppBar.commandList[i].key = null;
                            break;
                        }
                    }
                    if (event && event.currentTarget) {
                        WinJS.Utilities.addClass(event.currentTarget, "field-text-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                clickChangeState: function (event) {
                    Log.call(Log.l.trace, "UserInfo.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            var newPresent;
                            if (toggle.checked === true) {
                                newPresent = 1;
                            } else {
                                newPresent = 0;
                            }
                            if (typeof that.binding.dataBenutzer.Present === "undefined" ||
                                that.binding.dataBenutzer.Present !== newPresent) {
                                that.binding.dataBenutzer.Present = newPresent;
                                if (!AppBar.modified) {
                                    AppBar.modified = true;
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "UserInfo.Controller.");
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
                },
                clickDeletePhoto: function (event) {
                    Log.call(Log.l.trace, "GenDataUserInfo.Controller.");
                    var confirmTitle = getResourceText("userinfo.questionDelete");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickDelete: user choice OK");
                            that.deletePhotoData(function (response) {

                                that.loadData();
                                if (AppHeader.controller && typeof AppHeader.controller.loadData() === "function") {
                                    AppHeader.controller.loadData();
                                }
                            }, function (errorResponse) {
                                // delete ERROR
                                var message = null;
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (errorResponse.data && errorResponse.data.error) {
                                    Log.print(Log.l.error, "error code=" + errorResponse.data.error.code);
                                    if (errorResponse.data.error.message) {
                                        Log.print(Log.l.error, "error message=" + errorResponse.data.error.message.value);
                                        message = errorResponse.data.error.message.value;
                                    }
                                }
                                if (!message) {
                                    message = getResourceText("error.delete");
                                }
                                alert(message);
                            });
                        } else {
                            Log.print(Log.l.trace, "clickDelete: user choice CANCEL");
                        }
                    });
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function() {
                    // always enabled!
                    return false;
                },
                clickVcard: function () {
                    // always enabled!
                    return false;
                },
                clickPhoto: function () {
                    if (AppBar.busy) {
                        return true;
                    } else {
                        return false;
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
                },
                clickDeletePhoto: function() {
                    if (AppBar.busy || !that.binding.photoData) {
                        return true;
                    } else {
                        return false;
                    }
                }
            };

            var deletePhotoData = function (complete, error) {
                var recordId = getRecordId();
                Log.call(Log.l.trace, "GenDataUserInfo.Controller.");
                var ret = UserInfo.userPhotoView.deleteRecord(function (json) {
                    Log.print(Log.l.trace, "GenDataUserInfo: delete success!");
                    if (typeof complete === "function") {
                        complete(json);
                    }
                }, function (errorResponse) {
                    Log.print(Log.l.error, "GenDataUserInfo: delete error!");
                    AppData.setErrorMsg(that.binding, errorResponse);
                    if (typeof error === "function") {
                        error(errorResponse);
                    }
                }, recordId);
                Log.ret(Log.l.trace);
                return ret;
            }
            that.deletePhotoData = deletePhotoData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
                if (that.binding.dataBenutzer.Info2 && that.binding.dataBenutzer.Info2TSRead === null) {
                    // always set modified for timestamp!
                    AppBar.modified = true;
                }
                if (that.binding.dataBenutzer.Present === 1) {
                    // leave present state 1 
                } else {
                    // undefined present state becomes 0
                    that.binding.dataBenutzer.Present = 0;
                }
                return WinJS.Promise.as();
            });
            Log.ret(Log.l.trace);
        })
    });
})();

