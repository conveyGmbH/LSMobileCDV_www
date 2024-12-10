// controller for page: contact
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/appHeader/appHeaderService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("AppHeader", {
        controller: null
    });
    WinJS.Namespace.define("AppHeader", {
        Controller: WinJS.Class.define(function Controller(pageElement) {
            Log.call(Log.l.trace, "AppHeader.Controller.");
            this.element = pageElement.querySelector("#appHeaderController.data-container");
            if (this.element) {
                this.element.winControl = this;
            }
            this.pageData.userData = AppData._userData;
            this.pageData.photoData = null;
            this.pageData.showNameInHeader = !!AppData._persistentStates.showNameInHeader;
            this.pageData.curFastReqs = 0;
            this.pageData.hasContactData = null;

            AppHeader.controller = this;

            var that = this;

            // First, we call WinJS.Binding.as to get the bindable proxy object
            this.binding = WinJS.Binding.as(this.pageData);

            // show business card photo
            var userImageContainer = pageElement.querySelector(".user-image-container");
            var showPhoto = function () {
                Log.call(Log.l.trace, "AppHeader.Controller.");
                var userImg;
                if (that.binding.photoData) {
                    if (userImageContainer) {
                        userImg = new Image();
                        userImg.id = "userImg";
                        WinJS.Utilities.addClass(userImg, "user-photo");
                        var dataURLMimeType = "data:image/jpeg;base64,";
                        if (that.binding.photoData.substr(0, dataURLMimeType.length) === dataURLMimeType) {
                            userImg.src = that.binding.photoData;
                        } else {
                            userImg.src = "data:image/jpeg;base64," + that.binding.photoData;
                        }
                        userImageContainer.appendChild(userImg);
                        if (userImageContainer.childElementCount > 2) {
                            var oldElement = userImageContainer.firstElementChild.nextElementSibling;
                            if (oldElement) {
                                oldElement.parentNode.removeChild(oldElement);
                                oldElement.innerHTML = "";
                            }
                        }
                        WinJS.Promise.timeout(50).then(function () {
                            if (userImg && userImg.style && userImg.naturalWidth && userImg.naturalHeight) {
                                var width = userImg.naturalWidth;
                                var height = userImg.naturalHeight;
                                if (width > height) {
                                    var left = 20 * (1 - (userImg.naturalWidth / userImg.naturalHeight));
                                    userImg.style.width = "auto";
                                    userImg.style.height = "40px";
                                    userImg.style.left = left + "px";
                                    userImg.style.top = "-32px";
                                } else {
                                    var top = -32 + 20 * (1 - (userImg.naturalHeight / userImg.naturalWidth));
                                    userImg.style.width = "40px";
                                    userImg.style.height = "auto";
                                    userImg.style.left = "0";
                                    userImg.style.top = top + "px";
                                }
                            }
                        });
                    }
                    AppBar.triggerDisableHandlers();
                } else {
                    userImg = pageElement.querySelector("#userImg");
                    if (userImg) {
                        userImg.parentNode.removeChild(userImg);
                    }
                }
                Log.ret(Log.l.trace);
            }

            var loadData = function () {
                Log.call(Log.l.trace, "AppHeader.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    var employeeId = AppData.getRecordId("Mitarbeiter");
                    if (employeeId) {
                        // todo: load image data and set src of img-element
                        Log.print(Log.l.trace, "calling select contactView...");
                        return AppHeader.userPhotoView.select(function (json) {
                            Log.print(Log.l.trace, "userPhotoView: success!");
                            if (json && json.d) {
                                var docContent = json.d.OvwContentDOCCNT3
                                    ? json.d.OvwContentDOCCNT3
                                    : json.d.DocContentDOCCNT1;
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
                                } else {
                                    that.binding.photoData = "";
                                    showPhoto();
                                }
                            } else {
                                that.binding.photoData = "";
                                showPhoto();
                            }

                        }, function (errorResponse) {
                            that.binding.photoData = "";
                            showPhoto();
                            // ignore that
                        }, employeeId);
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    /*function checkOverflow(container) {
                        Log.print(Log.l.info, "calling checkOverflow...");
                        var child = container.children[0];
                        var actualFontSize = parseInt(window.getComputedStyle(child).fontSize, 10);
                        if (child.offsetWidth === 0 || (Math.abs(child.offsetWidth - container.offsetWidth) > 0 &&
                            Math.abs(child.offsetWidth - container.offsetWidth) <= 5 && (actualFontSize <= 15 || actualFontSize >= 10))) {

                        } else if (child.offsetWidth > container.offsetWidth) {
                            // Does only work with px size, for other units, you'll have to modify this
                            child.style.fontSize = parseInt(window.getComputedStyle(child).fontSize) - 1 + 'px';
                            checkOverflow(container);
                        } else if (child.offsetWidth < container.offsetWidth) {
                            // Does only work with px size, for other units, you'll have to modify this
                            child.style.fontSize = parseInt(window.getComputedStyle(child).fontSize) + 1 + 'px';
                            checkOverflow(container);
                        }


                    }
                    var eventField = document.querySelector(".event-field");
                    checkOverflow(eventField);*/

                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // Finally, wire up. don't call loadData() initial, db not open yet!
            WinJS.Resources.processAll(that.element).then(function () {
                return WinJS.Binding.processAll(that.element, that.binding);
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
            });
            Log.ret(Log.l.trace);
        }, {
                pageData: {
                    generalData: AppData.generalData,
                    appSettings: AppData.appSettings
                }
            })
    });
})();


