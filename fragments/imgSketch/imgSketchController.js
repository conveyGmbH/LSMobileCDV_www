// controller for page: imgSketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/imgSketch/imgSketchService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("ImgSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options) {
            Log.call(Log.l.trace, "ImgSketch.Controller.");

            var that = this;

            var getPhotoData = function () {
                return that.binding.dataSketch && that.binding.dataSketch.DocContentDOCCNT1;
            }

            var hasDoc = function () {
                return (typeof getPhotoData() === "string" && getPhotoData() !== null);
            }
            this.hasDoc = hasDoc;

            // show note photo
            var imageOffsetX = 0;
            var imageOffsetY = 0;

            var imgWidth = 0;
            var imgHeight = 0;
            var imgLeft = 0;
            var imgTop = 0;
            var imgScale = 1;
            var imgRotation = 0;
            var imgNaturalLeft = 0;
            var imgNaturalTop = 0;

            var marginLeft = 0;
            var marginTop = 0;

            var scaleIn = 1.25;
            var scaleOut = 0.8;

            var photoview = fragmentElement.querySelector("#notePhoto.photoview");

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: options.noteId,
                isLocal: options.isLocal,
                dataSketch: {}
            }]);
            this.img = null;

            this.dispose = function () {
                if (that.img) {
                    that.removePhoto();
                    that.img.src = "";
                    that.img = null;
                }
            }

            var resultConverter = function (item, index) {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                if (item) {
                    var docContent = item.DocContentDOCCNT1;
                    if (docContent) {
                        var sub = docContent.search("\r\n\r\n");
                        item.DocContentDOCCNT1 = "data:image/jpeg;base64," + docContent.substr(sub + 4);
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var removePhoto = function () {
                if (photoview) {
                    var photoItemBox = photoview.querySelector("#notePhoto .win-itembox");
                    if (photoItemBox) {
                        var oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                        if (oldElement) {
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                    }
                }
            }
            this.removePhoto = removePhoto;

            var calcImagePosition = function (opt) {
                var newScale, newRotate;
                if (opt) {
                    newScale = opt.scale;
                    newRotate = opt.rotate;
                }
                if (typeof newRotate !== "undefined") {
                    imgRotation = newRotate;
                }
                if (photoview && that.img) {
                    var containerWidth = photoview.clientWidth;
                    var containerHeight = photoview.clientHeight;

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
                    var photoItemBox = photoview.querySelector("#notePhoto .win-itembox");
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
                    imgLeft = (imgWidth - containerWidth) / 2;
                    imgTop = (imgHeight - containerHeight) / 2;
                    imgNaturalLeft = imgLeft / imgScale;
                    imgNaturalTop = imgTop / imgScale;

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
                if (photoview) {
                    var photoItemBox = photoview.querySelector("#notePhoto .win-itembox");
                    if (photoItemBox) {
                        var pageElement = Application.navigator && Application.navigator.pageElement;
                        var pageControl = pageElement && pageElement.winControl;
                        if (photoItemBox.style) {
                            photoItemBox.style.visibility = "hidden";
                        }
                        if (getPhotoData()) {
                            that.img = new Image();
                            photoItemBox.appendChild(that.img);
                            WinJS.Utilities.addClass(that.img, "active");
                            that.img.src = getPhotoData();
                            if (photoItemBox.childElementCount > 1) {
                                var oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                                if (oldElement) {
                                    oldElement.parentNode.removeChild(oldElement);
                                    oldElement.innerHTML = "";
                                }
                            }
                            imgRotation = 0;
                            var containerWidth = photoview.clientWidth;
                            if (containerWidth < that.img.naturalWidth) {
                                imgScale = containerWidth / that.img.naturalWidth;
                                imgWidth = containerWidth;
                            } else {
                                imgScale = 1;
                                imgWidth = that.img.naturalWidth;
                            }
                            imgHeight = that.img.naturalHeight * imgScale;
                            imgLeft = imgNaturalLeft * imgScale;
                            imgTop = imgNaturalTop * imgScale;
                            if (that.img.style) {
                                that.img.style.transform = "";
                                that.img.style.marginLeft = 0;
                                that.img.style.marginTop = 0;
                                that.img.style.width = imgWidth + "px";
                                that.img.style.height = imgHeight + "px";
                            }
                            var ham = new Hammer($(".pinch")[0], {
                                domEvents: true
                            });
                            ham.get('pinch').set({ enable: true, therhold: 10 });
                            var prevScale = imgScale;
                            $(".pinch").on("pinchstart", function (e) {
                                prevScale = imgScale;
                            });
                            $(".pinch").on("pinch", function (e) {
                                var scale = prevScale * e.originalEvent.gesture.scale;
                                if (scale <= 1 &&
                                    ((imgRotation === 0 || imgRotation === 180) && imgWidth * scale > 100 ||
                                    (imgRotation === 90 || imgRotation === 270) && imgHeight * scale > 100)) {
                                    that.calcImagePosition({
                                        scale: scale
                                    });
                                }
                            });
                            $(".pinch").on("pinchend", function (e) {
                                var scale = prevScale * e.originalEvent.gesture.scale;
                                if (scale <= 1 &&
                                    ((imgRotation === 0 || imgRotation === 180) && imgWidth * scale > 100 ||
                                    (imgRotation === 90 || imgRotation === 270) && imgHeight * scale > 100)) {
                                    that.calcImagePosition({
                                        scale: scale
                                    });
                                }
                            });
                            var prevScrollLeft = 0;
                            var prevScrollTop = 0;

                            var photoViewport = photoview.querySelector("#notePhoto .win-viewport");
                            var contentarea = fragmentElement.querySelector(".contentarea");

                            $(".pinch").on("panstart", function (e) {
                                if (photoViewport) {
                                    prevScrollLeft = photoViewport.scrollLeft;
                                }
                                if (contentarea) {
                                    prevScrollTop = contentarea.scrollTop;
                                }
                            });
                            $(".pinch").on("panmove", function (e) {
                                var deltaLeft = prevScrollLeft - e.originalEvent.gesture.deltaX;
                                var deltaTop = prevScrollTop - e.originalEvent.gesture.deltaY;
                                Log.print(Log.l.trace, "pan deltaX=" + e.originalEvent.gesture.deltaX + " deltaY=" + e.originalEvent.gesture.deltaY);
                                if (photoViewport) {
                                    photoViewport.scrollLeft = deltaLeft;
                                }
                                if (contentarea) {
                                    contentarea.scrollTop = deltaTop;
                                }
                            });
                            $(".pinch").on("panend", function (e) {
                                var deltaLeft = prevScrollLeft - e.originalEvent.gesture.deltaX;
                                var deltaTop = prevScrollTop - e.originalEvent.gesture.deltaY;
                                Log.print(Log.l.trace, "pan deltaX=" + e.originalEvent.gesture.deltaX + " deltaY=" + e.originalEvent.gesture.deltaY);
                                if (photoViewport) {
                                    photoViewport.scrollLeft = deltaLeft;
                                }
                                if (contentarea) {
                                    contentarea.scrollTop = deltaTop;
                                }
                            });
                            WinJS.Promise.timeout(0).then(function () {
                                imageOffsetX = photoview.offsetLeft + fragmentElement.offsetLeft;
                                imageOffsetY = photoview.offsetTop + fragmentElement.offsetTop;
                                Log.print(Log.l.trace, "imageOffsetX=" + imageOffsetX + " imageOffsetY=" + imageOffsetY);
                                // recalc page layout if needed
                                if (pageControl && pageControl.updateLayout) {
                                    pageControl.prevWidth = 0;
                                    pageControl.prevHeight = 0;
                                    var promise = pageControl.updateLayout.call(pageControl, pageElement) || WinJS.Promise.as();
                                    promise.then(function () {
                                        if (photoItemBox.style) {
                                            photoItemBox.style.visibility = "";
                                        }
                                        var animationDistanceX = imgWidth / 10;
                                        var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                        return WinJS.UI.Animation.enterContent(photoItemBox, animationOptions);
                                    });
                                }
                            });
                        } else {
                            that.removePhoto();
                            // recalc page layout if needed
                            if (pageControl && pageControl.updateLayout) {
                                pageControl.prevWidth = 0;
                                pageControl.prevHeight = 0;
                                pageControl.updateLayout.call(pageControl, pageElement);
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }

            var showPhotoAfterResize = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                var fragmentControl = fragmentElement.winControl;
                if (fragmentControl && fragmentControl.updateLayout) {
                    fragmentControl.prevWidth = 0;
                    fragmentControl.prevHeight = 0;
                    var promise = fragmentControl.updateLayout.call(fragmentControl, fragmentElement) || WinJS.Promise.as();
                    promise.then(function () {
                        showPhoto();
                    });
                }
                Log.ret(Log.l.trace);
            }

            var loadData = function (noteId) {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                if (noteId) {
                    that.binding.noteId = noteId;
                }
                var ret = null;
                if (that.binding.noteId !== null) {
                    AppData.setErrorMsg(that.binding);
                    ret = ImgSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "ImgSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            showPhotoAfterResize();
                        }
                    },
                    function(errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    that.binding.noteId,
                    that.binding.isLocal);
                } else {
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function (complete, error) {
                //img can't be changed
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    if (typeof complete === "function") {
                        complete({});
                    }
                });
                Log.ret(Log.l.trace, ret);
                return ret;
            };
            this.saveData = saveData;

            var eventHandlers = {
                //TODO zoom, ...
            }
            this.eventHandlers = eventHandlers;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



