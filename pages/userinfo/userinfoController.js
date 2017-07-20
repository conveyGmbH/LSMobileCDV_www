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
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement) {
            Log.call(Log.l.trace, "UserInfo.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataBenutzer: UserInfo.benutzerView && UserInfo.benutzerView.defaultValue,
                dataPhoto: {},
                photoData: null
            }]);
            this.img = null;

            var that = this;

            // show business card photo
            var photoContainer = pageElement.querySelector(".photo-container");

            var removePhoto = function () {
                if (photoContainer) {
                    var oldElement = photoContainer.firstElementChild || photoContainer.firstChild;
                    if (oldElement) {
                        oldElement.parentNode.removeChild(oldElement);
                        oldElement.innerHTML = "";
                    }
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
                        that.img.src = "data:image/jpeg;base64," + that.binding.photoData;
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

            var setDataBenutzer = function(newDataBenutzer) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
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
                                        if (!that.binding.photoData ||
                                            that.binding.photoData !== newContent) {
                                            that.binding.photoData = newContent;
                                            showPhoto();
                                        }
                                    }
                                }
                            }
                        }, function (errorResponse) {
                            // ignore that
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
                            console.log("dataBenutzer: success!");
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
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 2560);
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
                                        if (!that.binding.photoData ||
                                            that.binding.photoData !== newContent) {
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

                // todo: create preview from imageData
                that.insertCameradata(imageData, width, height);
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
                if (navigator.camera &&
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
                        allowEdit: true,
                        quality: 50,
                        targetWidth: 256,
                        targetHeight: 256,
                        encodingType: Camera.EncodingType.JPEG,
                        saveToPhotoAlbum: false,
                        cameraDirection: Camera.Direction.FRONT
                    });
                } else {
                    Log.print(Log.l.error, "camera.getPicture not supported...");
                    that.updateStates({ errorMessage: "Camera plugin not supported" });
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
                }
            };

            this.disableHandlers = {
                clickOk: function() {
                    // always enabled!
                    return false;
                },
                clickPhoto: function () {
                    if (AppBar.busy) {
                        return true;
                    } else {
                        return false;
                    }
                }
            };

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
                // toggle state (undefined becomes 1)
                if (that.binding.dataBenutzer.Present === 1) {
                    that.binding.dataBenutzer.Present = 0;
                } else {
                    that.binding.dataBenutzer.Present = 1;
                }
                if (!AppBar.modified) {
                    AppBar.modified = true;
                }
                return WinJS.Promise.as();
            });
            Log.ret(Log.l.trace);
        })
    });
})();

