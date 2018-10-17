// controller for page: photo
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/photo/photoService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("Photo", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Photo.Controller.");
            Application.Controller.apply(this, [pageElement, {
            }, commandList]);
            this.angle = 0;
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
                    if (AppData._photoData) {
                        that.img = new Image();
                        that.img.id = "pagePhoto";
                        photoContainer.appendChild(that.img);
                        WinJS.Utilities.addClass(that.img, "page-photo");
                        that.img.src = "data:image/jpeg;base64," + AppData._photoData;
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

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Photo.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done();
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "Photo.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickRotate: function (event) {
                    Log.call(Log.l.trace, "Photo.Controller.");
                    if (photoContainer) {
                        var imgElement = photoContainer.firstElementChild || photoContainer.firstChild;
                        if (imgElement) {
                            that.angle = (that.angle + 90) % 360;
                            imgElement.className = "rotate" + that.angle;
                            var element = Application.navigator.pageElement;
                            if (element.winControl && element.winControl.updateLayout) {
                                element.winControl.updateLayout.call(element.winControl, element);
                            }
                        }
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Photo.Controller.");
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
                },
                clickNew: function () {
                    if (that.binding.generalData.contactId) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRotate: function () {
                    if (AppData._photoData) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }

            var loadData = function () {
                Log.call(Log.l.trace, "Photo.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!AppData._photoData) {
                        var importCardscanId = AppData.getRecordId("DOC1IMPORT_CARDSCAN");
                        if (importCardscanId) {
                            // todo: load image data and set src of img-element
                            Log.print(Log.l.trace, "calling select contactView...");
                            var cardscanSelectPromise = Photo.cardScanView.select(function (json) {
                                that.removeDisposablePromise(cardscanSelectPromise);
                                AppData.setErrorMsg(that.binding);
                                Log.print(Log.l.trace, "cardScanData: success!");
                                if (json && json.d) {
                                    var docContent;
                                    if (json.d.wFormat === 1) {
                                        docContent = json.d.PrevContentDOCCNT2;
                                    } else {
                                        docContent = json.d.DocContentDOCCNT1;
                                    }
                                    if (docContent) {
                                        var sub = docContent.search("\r\n\r\n");
                                        AppData._photoData = docContent.substr(sub + 4);
                                        showPhoto();
                                    }
                                }
                            }, function (errorResponse) {
                                that.removeDisposablePromise(cardscanSelectPromise);
                                AppData.setErrorMsg(that.binding, errorResponse);
                            }, importCardscanId);
                            return that.addDisposablePromise(cardscanSelectPromise);
                        } else {
                            return WinJS.Promise.as();
                        }
                    } else {
                        showPhoto();
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
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


