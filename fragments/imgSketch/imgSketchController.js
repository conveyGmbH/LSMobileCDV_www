// controller for page: imgSketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/lib/hammer/scripts/hammer.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/imgSketch/imgSketchService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/CameraConstants.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";

    var b64 = window.base64js;

    WinJS.Namespace.define("ImgSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options, commandList) {
            Log.call(Log.l.trace, "ImgSketch.Controller.", "noteId=" + (options && options.noteId));

            var imgWidth = 0;
            var imgHeight = 0;

            var imgScale = 1;
            var imgRotation = 0;

            var scaleIn = 1.25;
            var scaleOut = 0.8;

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: null,
                isLocal: options.isLocal,
                dataSketch: {}
            }, commandList]);
            this.img = null;

            var that = this;

            // Get the drawing context
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = 0;
            canvas.height = 0;
            //var imagesObjects = [];
            var isAppleDevice = AppData.checkIPhoneBug();

            var getDocData = function () {
                return that.binding.dataSketch && that.binding.dataSketch.photoData;
            }
            var hasDoc = function () {
                return (getDocData() && typeof getDocData() === "string");
            }
            this.hasDoc = hasDoc;

            this.dispose = function () {
                that.removeDoc();
                if (that.img) {
                    that.img.src = "";
                    that.img = null;
                }
            }

            var resultConverter = function (item, index) {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                if (item) {
                    if (item.DocContentDOCCNT1 && item.DocGroup === AppData.DocGroup.Image && item.DocFormat === 3) {
                        var sub = item.DocContentDOCCNT1.search("\r\n\r\n");
                        item.photoData = "data:image/jpeg;base64," + item.DocContentDOCCNT1.substr(sub + 4);
                    } else {
                        item.photoData = "";
                    }
                    item.DocContentDOCCNT1 = "";
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var removePhoto = function () {
                if (fragmentElement) {
                    var photoItemBox = fragmentElement.querySelector("#notePhoto .win-itembox");
                    if (photoItemBox) {
                        var oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                        if (oldElement) {
                            photoItemBox.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                    }
                }
            }
            this.removePhoto = removePhoto;

            var calcImagePosition = function (opt) {
                var newScale, newRotate, marginLeft, marginTop;
                if (opt) {
                    newScale = opt.scale;
                    newRotate = opt.rotate;
                }
                if (typeof newRotate !== "undefined") {
                    imgRotation = newRotate;
                }
                if (fragmentElement && that.img) {
                    var containerWidth = fragmentElement.clientWidth;
                    var containerHeight = fragmentElement.clientHeight;

                    if (newScale) {
                        imgScale = newScale;
                        imgWidth = that.img.naturalWidth * imgScale;
                        imgHeight = that.img.naturalHeight * imgScale;
                    } else {
                        switch (imgRotation) {
                            case 90:
                            case 270:
                                if (containerWidth < that.img.naturalHeight) {
                                    imgHeight = containerWidth;
                                    imgScale = containerWidth / that.img.naturalHeight;
                                } else {
                                    imgScale = 1;
                                    imgHeight = that.img.naturalHeight;
                                }
                                imgWidth = that.img.naturalWidth * imgScale;
                                break;
                            case 180:
                            default:
                                if (containerWidth < that.img.naturalWidth) {
                                    imgScale = containerWidth / that.img.naturalWidth;
                                    imgWidth = containerWidth;
                                } else {
                                    imgScale = 1;
                                    imgWidth = that.img.naturalWidth;
                                }
                                imgHeight = that.img.naturalHeight * imgScale;
                        }
                    }
                    var photoItemBox = fragmentElement.querySelector("#notePhoto .win-itembox");
                    if (photoItemBox && photoItemBox.style) {
                        switch (imgRotation) {
                            case 90:
                            case 270:
                                if (imgHeight <= containerWidth) {
                                    photoItemBox.style.width = containerWidth + "px";
                                } else {
                                    photoItemBox.style.width = imgHeight + "px";
                                }
                                if (imgWidth <= containerHeight) {
                                    photoItemBox.style.height = containerHeight + "px";
                                } else {
                                    photoItemBox.style.height = imgWidth + "px";
                                }
                                break;
                            case 180:
                            default:
                                if (imgWidth <= containerWidth) {
                                    photoItemBox.style.width = containerWidth + "px";
                                } else {
                                    photoItemBox.style.width = imgWidth + "px";
                                }
                                if (imgHeight <= containerHeight) {
                                    photoItemBox.style.height = containerHeight + "px";
                                } else {
                                    photoItemBox.style.height = imgHeight + "px";
                                }
                        }
                    }

                    if (imgRotation === 90 || imgRotation === 270) {
                        marginTop = (imgHeight - imgWidth) / 2;
                        marginLeft = (imgWidth - imgHeight) / 2;
                        if (imgHeight < containerWidth) {
                            marginLeft += (imgHeight - containerWidth) / 2;
                        }
                        if (imgWidth < containerHeight) {
                            marginTop += (imgWidth - containerHeight) / 2;
                        }
                    } else {
                        if (imgWidth < containerWidth) {
                            marginLeft = (imgWidth - containerWidth) / 2;
                        } else {
                            marginLeft = 0;
                        }
                        if (imgHeight < containerHeight) {
                            marginTop = (imgHeight - containerHeight) / 2;
                        } else {
                            marginTop = 0;
                        }
                    }
                    if (that.img.style) {
                        if (typeof newRotate !== "undefined") {
                            that.img.style.transform = "rotate( " + imgRotation + "deg)";
                        }
                        that.img.style.marginLeft = -marginLeft + "px";
                        that.img.style.marginTop = -marginTop + "px";
                        that.img.style.width = imgWidth + "px";
                        that.img.style.height = imgHeight + "px";
                    }
                }
            }
            this.calcImagePosition = calcImagePosition;

            var showPhoto = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                if (fragmentElement) {
                    var photoItemBox = fragmentElement.querySelector("#notePhoto .win-itembox");
                    if (photoItemBox) {
                        if (getDocData()) {
                            that.img = new Image();
                            WinJS.Utilities.addClass(that.img, "active");
                            that.img.src = getDocData();
                            var pinchElement = fragmentElement.querySelector(".pinch");
                            if (pinchElement) {
                                var photoViewport = fragmentElement.querySelector("#notePhoto .win-viewport");
                                var prevScrollLeft = 0;
                                var prevScrollTop = 0;
                                var prevScale = 1;
                                var prevCenter, prevCenterInImage;
                                var prevOffsetLeft = 0;
                                var prevOffsetTop = 0;
                                var ham = new Hammer.Manager(pinchElement);
                                var pan = null;
                                var pinch = new Hammer.Pinch();
                                var vendor = navigator.vendor;
                                // touch-action not supported on Safari, so use Hammer instead!
                                if (vendor && vendor.indexOf("Apple") >= 0) {
                                    pan = new Hammer.Pan();
                                    ham.add([pinch, pan]);
                                } else {
                                    ham.add([pinch]);
                                }
                                ham.on("pinchstart", function (e) {
                                    prevScale = imgScale;
                                    if (e.center && typeof e.center.x === "number" && typeof e.center.x === "number") {
                                        prevOffsetLeft = 0;
                                        prevOffsetTop = 0;
                                        var element = e.target;
                                        while (element) {
                                            prevOffsetLeft += element.offsetLeft;
                                            prevOffsetTop += element.offsetTop;
                                            element = element.offsetParent;
                                        }
                                        Log.print(Log.l.trace, "prevOffsetLeft=" + prevOffsetLeft + " prevOffsetTop=" + prevOffsetTop);
                                        prevCenter = {
                                            x: e.center.x - prevOffsetLeft,
                                            y: e.center.y - prevOffsetTop
                                        }
                                        if (photoViewport) {
                                            prevScrollLeft = photoViewport.scrollLeft;
                                            prevScrollTop = photoViewport.scrollTop;
                                        }
                                        prevCenterInImage = {
                                            x: (prevCenter.x + prevScrollLeft) / prevScale,
                                            y: (prevCenter.y + prevScrollTop) / prevScale
                                        }
                                        Log.print(Log.l.trace, "prevCenter.x=" + prevCenter.x + " prevCenter.y=" + prevCenter.y + " prevCenterInImage.x=" + prevCenterInImage.x + " prevCenterInImage.y=" + prevCenterInImage.y);
                                    }
                                });
                                ham.on("pinch", function (e) {
                                    if (e.scale) {
                                        var scale = prevScale * e.scale;
                                        if (scale <= 1 &&
                                        ((imgRotation === 0 || imgRotation === 180) && imgWidth * scale > 100 ||
                                            (imgRotation === 90 || imgRotation === 270) && imgHeight * scale > 100)) {
                                            that.calcImagePosition({
                                                scale: scale
                                            });
                                        }
                                        if (e.center && typeof e.center.x === "number" && typeof e.center.x === "number") {
                                            var center = {
                                                x: e.center.x - prevOffsetLeft,
                                                y: e.center.y - prevOffsetTop
                                            }
                                            if (photoViewport) {
                                                prevScrollLeft = photoViewport.scrollLeft;
                                                prevScrollTop = photoViewport.scrollTop;
                                            }
                                            var centerInImage = {
                                                x: (center.x + prevScrollLeft) / scale,
                                                y: (center.y + prevScrollTop) / scale
                                            }
                                            Log.print(Log.l.trace, "center.x=" + center.x + " center.y=" + center.y + " centerInImage.x=" + centerInImage.x + " centerInImage.y=" + centerInImage.y);
                                            var deltaLeft = (prevCenterInImage.x - centerInImage.x) * scale;
                                            var deltaTop = (prevCenterInImage.y - centerInImage.y) * scale;
                                            if (photoViewport) {
                                                photoViewport.scrollLeft += deltaLeft;
                                                photoViewport.scrollTop += deltaTop;
                                            }
                                        }
                                    }
                                });
                                ham.on("pinchend", function (e) {
                                    if (e.scale) {
                                        var scale = prevScale * e.scale;
                                        if (scale <= 1 &&
                                        ((imgRotation === 0 || imgRotation === 180) && imgWidth * scale > 100 ||
                                            (imgRotation === 90 || imgRotation === 270) && imgHeight * scale > 100)) {
                                            that.calcImagePosition({
                                                scale: scale
                                            });
                                        }
                                        if (e.center && typeof e.center.x === "number" && typeof e.center.x === "number") {
                                            var center = {
                                                x: e.center.x - prevOffsetLeft,
                                                y: e.center.y - prevOffsetTop
                                            }
                                            var centerInImage = {
                                                x: (center.x + prevScrollLeft) / scale,
                                                y: (center.y + prevScrollTop) / scale
                                            }
                                            Log.print(Log.l.trace, "center.x=" + center.x + " center.y=" + center.y + " centerInImage.x=" + centerInImage.x + " centerInImage.y=" + centerInImage.y);
                                            var deltaLeft = (prevCenterInImage.x - centerInImage.x) * scale;
                                            var deltaTop = (prevCenterInImage.y - centerInImage.y) * scale;
                                            if (photoViewport) {
                                                photoViewport.scrollLeft += deltaLeft;
                                                photoViewport.scrollTop += deltaTop;
                                            }
                                        }
                                    }
                                });
                                if (pan) {
                                    ham.on("panstart", function (e) {
                                        if (photoViewport) {
                                            prevScrollLeft = photoViewport.scrollLeft;
                                            prevScrollTop = photoViewport.scrollTop;
                                        }
                                    });
                                    ham.on("panmove", function (e) {
                                        if (e.deltaX || e.deltaY) {
                                            var deltaLeft = prevScrollLeft - e.deltaX;
                                            var deltaTop = prevScrollTop - e.deltaY;
                                            Log.print(Log.l.trace, "pan deltaX=" + e.deltaX + " deltaY=" + e.deltaY);
                                            if (photoViewport) {
                                                photoViewport.scrollLeft = deltaLeft;
                                                photoViewport.scrollTop = deltaTop;
                                            }
                                        }
                                    });
                                    ham.on("panend", function (e) {
                                        if (e.deltaX || e.deltaY) {
                                            var deltaLeft = prevScrollLeft - e.deltaX;
                                            var deltaTop = prevScrollTop - e.deltaY;
                                            Log.print(Log.l.trace, "pan deltaX=" + e.deltaX + " deltaY=" + e.deltaY);
                                            if (photoViewport) {
                                                photoViewport.scrollLeft = deltaLeft;
                                                photoViewport.scrollTop = deltaTop;
                                            }
                                        }
                                    });
                                } else {
                                    pinchElement.style.touchAction = "pan-x pan-y";
                                }
                            }
                            WinJS.Promise.timeout(10).then(function () {
                                var ret = null;
                                if (AppBar.scope) {
                                    var pageElement = AppBar.scope.pageElement;
                                    if (pageElement) {
                                        var pageControl = pageElement.winControl;
                                        if (pageControl && pageControl.updateLayout) {
                                            pageControl.prevWidth = 0;
                                            pageControl.prevHeight = 0;
                                            ret = pageControl.updateLayout.call(pageControl, pageElement);
                                        }
                                    }
                                }
                                return ret || WinJS.Promise.timeout(10);
                            }).then(function () {
                                imgRotation = 0;
                                imgScale = 1;
                                calcImagePosition();
                                var oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                                if (oldElement && oldElement.style) {
                                    oldElement.style.display = "block";
                                    oldElement.style.position = "absolute";
                                }
                                if (that.img.style) {
                                    that.img.style.transform = "";
                                    that.img.style.visibility = "hidden";
                                    that.img.style.display = "block";
                                    that.img.style.position = "absolute";
                                }
                                photoItemBox.appendChild(that.img);

                                var photoViewport = fragmentElement.querySelector("#notePhoto .win-viewport");
                                if (photoViewport && photoViewport.style) {
                                    photoViewport.style.overflow = "hidden";
                                }
                                var animationDistanceX = imgWidth / 4;
                                var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                if (that.img.style) {
                                    that.img.style.visibility = "";
                                }
                                WinJS.UI.Animation.enterContent(that.img, animationOptions).then(function () {
                                    if (photoViewport && photoViewport.style) {
                                        photoViewport.style.overflow = "";
                                    }
                                    if (that.img.style) {
                                        that.img.style.display = "";
                                        that.img.style.position = "";
                                    }
                                    while (photoItemBox.childElementCount > 1) {
                                        oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                                        if (oldElement) {
                                            photoItemBox.removeChild(oldElement);
                                            oldElement.innerHTML = "";
                                        }
                                    }
                                });
                                if (photoItemBox.childElementCount > 1) {
                                    WinJS.Promise.timeout(50).then(function () {
                                        oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                                        if (oldElement) {
                                            animationOptions.left = (-animationDistanceX).toString() + "px";
                                            WinJS.UI.Animation.exitContent(oldElement, animationOptions);
                                        }
                                    });
                                }
                            });
                        } else {
                            that.removePhoto();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }

            var showPhotoAfterResize = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                var ret = WinJS.Promise.timeout(10).then(function () {
                    var promise = null;
                    var fragmentControl = fragmentElement.winControl;
                    if (fragmentControl && fragmentControl.updateLayout) {
                        fragmentControl.prevWidth = 0;
                        fragmentControl.prevHeight = 0;
                        promise = fragmentControl.updateLayout.call(fragmentControl, fragmentElement) || WinJS.Promise.as();
                        promise.then(function () {
                            showPhoto();
                        });
                    }
                    return promise || WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            }

            var insertCameradata = function (imageData, width, height) {
                var ovwEdge = 256;
                var err = null;
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                AppData.setErrorMsg(that.binding);
                var dataSketch = that.binding.dataSketch;
                var ret = new WinJS.Promise.as().then(function () {
                    if (imageData.length < 500000) {
                        // keep original 
                        return WinJS.Promise.as();
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", 2560, AppData.generalData.cameraQuality, 0.25);
                }).then(function (resizeData) {
                    if (resizeData) {
                        Log.print(Log.l.trace, "resized");
                        imageData = resizeData;
                    }
                    return Colors.resizeImageBase64(imageData, "image/jpeg", ovwEdge, AppData.generalData.cameraQuality);
                }).then(function (ovwData) {
                    dataSketch.KontaktID = AppData.getRecordId("Kontakt");
                    if (!dataSketch.KontaktID) {
                        err = {
                            status: -1,
                            statusText: "missing recordId for table Kontakt"
                        }
                        AppData.setErrorMsg(that.binding, err);
                        AppBar.busy = false;
                        return WinJS.Promise.as();
                    } else {
                        // JPEG note
                        dataSketch.ExecAppTypeID = 3;
                        dataSketch.DocGroup = 1;
                        dataSketch.DocFormat = 3;
                        dataSketch.Width = width;
                        dataSketch.Height = height;
                        dataSketch.OvwEdge = ovwEdge;
                        dataSketch.ColorType = 11;
                        dataSketch.DocExt = "jpg";

                        // UTC-Zeit in Klartext
                        var now = new Date();
                        var dateStringUtc = now.toUTCString();

                        // decodierte Dateigröße
                        var contentLength = Math.floor(imageData.length * 3 / 4);

                        dataSketch.Quelltext = "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLength +
                            "\x0D\x0A\x0D\x0A" +
                            imageData;

                        if (ovwData) {
                            var contentLengthOvw = Math.floor(ovwData.length * 3 / 4);
                            dataSketch.OvwQuelltext =
                                "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                                dateStringUtc +
                                "\x0D\x0AContent-Length: " +
                                contentLengthOvw +
                                "\x0D\x0A\x0D\x0A" +
                                ovwData;
                        }
                        return ImgSketch.sketchView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            AppBar.busy = false;
                            Log.print(Log.l.trace, "sketchData insert: success!");
                            // select returns object already parsed from json file in response
                            if (json && json.d) {
                                that.resultConverter(json.d);
                                that.binding.dataSketch = json.d;
                                that.binding.noteId = json.d.KontaktNotizVIEWID;
                                showPhotoAfterResize().then(function () {
                                    // reload list
                                    if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                        AppBar.scope.loadList(that.binding.noteId);
                                    }
                                });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppBar.busy = false;
                            AppData.setErrorMsg(that.binding, errorResponse);
                        },
                        dataSketch,
                        that.binding.isLocal);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertCameradata = insertCameradata;

            /*var onPhotoDataSuccess = function (imageData) {
                Log.call(Log.l.trace, "Questionnaire.Controller.");
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
            };*/

            var onPhotoDataSuccess = function(imageData) {
                Log.call(Log.l.trace, "Camera.Controller.");
                if (imageData && imageData.length > 0) {
                    var promise;
                    if (isAppleDevice) {
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
                        //
                        //cameraImage.src = "data:image/jpeg;base64," + imageData;
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
                            filePromises.push(FileP.load(dataDirectory, fileName, bUseRootDir).then(function(result) {
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

                        WinJS.Promise.join(filePromises).then(function() {
                            var imagePromises = [];
                            var loadImage = function(encoded) {
                                var cameraImage = new Image();
                                imagePromises.push(new WinJS.Promise(function makeImage(complete, error, progress) {
                                    cameraImage.onload = function() {
                                        cameraImages.push(cameraImage);
                                        complete(cameraImage);
                                    }
                                    cameraImage.onerror = function() {
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

                        }).then(function() {
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
            };
            //this.onPhotoDataSuccess = onPhotoDataSuccess;

            var onPhotoDataFail = function (errorMessage) {
                Log.call(Log.l.error, "Questionnaire.Controller.");
                //message: The message is provided by the device's native code
                var err = JSON.stringify(errorMessage);
                //message: The message is provided by the device's native code
                Log.print(Log.l.error, "errorMessage=" + err);
                AppData.setErrorMsg(that.binding, errorMessage);
                AppBar.busy = false;
                WinJS.Promise.timeout(0).then(function () {
                    if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                        AppBar.scope.loadList();
                    }
                });
                Log.ret(Log.l.error);
            };

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
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
                    scan.scanDoc(onPhotoDataSuccess, onPhotoDataFail, {
                        sourceType : 1,
                        returnBase64 : true,
                        fileName : "photo",
                        quality: (1.0 - AppData.generalData.cameraQuality / 100.0) * 4.0 + 1.0,
                        maxResolution: 8000000,
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
                    navigator.camera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
                        destinationType: Camera.DestinationType.DATA_URL,
                        sourceType: Camera.PictureSourceType.CAMERA,
                        allowEdit: isAppleDevice, //!isWindows10
                        quality: AppData.generalData.cameraQuality,
                        targetWidth: -1,
                        targetHeight: -1,
                        encodingType: Camera.EncodingType.JPEG,
                        saveToPhotoAlbum: false,
                        cameraDirection: Camera.Direction.BACK,
                        variableEditRect: true
                    });
                } else {
                    Log.print(Log.l.error, "camera.getPicture not supported...");
                    that.updateStates({ errorMessage: "Camera plugin not supported" });
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
                                        fileWriter.onwriteend = function () {
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

            var loadData = function (noteId) {
                var ret;
                Log.call(Log.l.trace, "ImgSketch.Controller.", "noteId=" + noteId);
                if (noteId) {
                    AppData.setErrorMsg(that.binding);
                    ret = ImgSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "ImgSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.noteId = json.d.KontaktNotizVIEWID;
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            if (hasDoc()) {
                                Log.print(Log.l.trace,
                                    "IMG Element: " +
                                    getDocData().substr(0, 100) +
                                    "...");
                            }
                            showPhotoAfterResize();
                        }
                    },
                    function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    noteId,
                    that.binding.isLocal);
                } else {
                    if (that.binding.isLocal) {
                        // take photo first - but only if isLocal!
                        if (that.binding.generalData.useClippingCamera &&
                            cordova.plugins.GeniusScan) {
                            that.takePhotoWithGeniusScan();
                        } else {
                            that.takePhoto();
                        }
                    }
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var removeDoc = function() {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                that.binding.dataSketch = {};
                that.removePhoto();
                Log.ret(Log.l.trace);
            }
            this.removeDoc = removeDoc;

            var saveData = function (complete, error) {
                //img can't be changed
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    if (typeof complete === "function") {
                        complete(that.binding.dataSketch);
                    }
                });
                Log.ret(Log.l.trace, ret);
                return ret;
            };
            this.saveData = saveData;

            var deleteData = function() {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                var ret= WinJS.Promise.as().then(function () {
                    if (options && options.isLocal) {
                        return ImgSketch.sketchView.deleteRecord(function (response) {
                            // called asynchronously if ok
                            Log.print(Log.l.trace, "ImgSketchData delete: success!");
                            //reload sketchlist
                            if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                AppBar.scope.loadList(null);
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
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
                        },
                        that.binding.noteId,
                        that.binding.isLocal);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.deleteData = deleteData;

            // define handlers
            this.eventHandlers = {
                clickZoomIn: function (event) {
                    Log.call(Log.l.trace, "ImgSketch.Controller.");
                    if (that.hasDoc() && imgScale * scaleIn < 1) {
                        that.calcImagePosition({
                            scale: imgScale * scaleIn
                        });
                    } else {
                        that.calcImagePosition({
                            scale: 1
                        });
                    }
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickZoomOut: function (event) {
                    Log.call(Log.l.trace, "ImgSketch.Controller.");
                    if (that.hasDoc() &&
                        ((imgRotation === 0 || imgRotation === 180) && imgWidth * imgScale * scaleOut > 100 ||
                         (imgRotation === 90 || imgRotation === 270) && imgHeight * imgScale * scaleOut > 100)) {
                        that.calcImagePosition({
                            scale: imgScale * scaleOut
                        });
                    } else {
                        if (imgRotation === 0 || imgRotation === 180) {
                            that.calcImagePosition({
                                scale: 100 / imgWidth
                            });
                        } else {
                            that.calcImagePosition({
                                scale: 100 / imgHeight
                            });
                        }
                    }
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickRotateLeft: function (event) {
                    Log.call(Log.l.trace, "ImgSketch.Controller.");
                    var rotate = imgRotation - 90;
                    if (rotate < 0) {
                        rotate = 270;
                    }
                    that.calcImagePosition({
                        rotate: rotate
                    });
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickRotateRight: function (event) {
                    Log.call(Log.l.trace, "ImgSketch.Controller.");
                    var rotate = imgRotation + 90;
                    if (rotate >= 360) {
                        rotate = 0;
                    }
                    that.calcImagePosition({
                        rotate: rotate
                    });
                    AppBar.triggerDisableHandlers();
                    Log.ret(Log.l.trace);
                },
                clickShare: function (event) {
                    Log.call(Log.l.trace, "ImgSketch.Controller.");
                    if (getDocData()) {
                        var data = getDocData();
                        var formattedName = "Photo" + that.binding.dataSketch.KontaktID + "_" + that.binding.dataSketch.KontaktNotizVIEWID;
                        var subject = formattedName;
                        var message = getResourceText("contact.title") + 
                            " ID: " + AppData.generalData.globalContactID + " \r\n" +
                            formattedName;
                        window.plugins.socialsharing.share(message, subject, data, null);
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickZoomIn: function () {
                    if (that.hasDoc() && imgScale < 1) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickZoomOut: function () {
                    if (that.hasDoc() &&
                        ((imgRotation === 0 || imgRotation === 180) && imgWidth * imgScale > 100 ||
                         (imgRotation === 90 || imgRotation === 270) && imgHeight * imgScale > 100)) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRotateLeft: function () {
                    if (getDocData()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRotateRight: function () {
                    if (getDocData()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickShare: function () {
                    if (getDocData()) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }

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
                            return WinJS.Promise.as();
                        });
                } else {
                    Log.print(Log.l.trace, "Not Using Genius Scan");
                    return WinJS.Promise.as();
                }
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return WinJS.Promise.timeout(0);
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData(options && options.noteId);
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



