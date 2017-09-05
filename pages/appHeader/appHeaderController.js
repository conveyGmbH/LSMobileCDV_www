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

            AppHeader.controller = this;

            var that = this;

            // First, we call WinJS.Binding.as to get the bindable proxy object
            this.binding = WinJS.Binding.as(this.pageData);

            // Then, do anything special on this page

            // show business card photo
            var userPhotoContainer = pageElement.querySelector("#user");
            var showPhoto = function () {
                if (that.binding.photoData) {
                    if (userPhotoContainer) {
                        var userImg = new Image();
                        userImg.id = "userImg";
                        userPhotoContainer.appendChild(userImg);
                        WinJS.Utilities.addClass(userImg, "user-photo");
                        userImg.src = "data:image/jpeg;base64," + that.binding.photoData;
                        if (userPhotoContainer.childElementCount > 2) {
                            var oldElement = userPhotoContainer.firstElementChild.nextElementSibling;
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                    }
                    AppBar.triggerDisableHandlers();
                } else {
                    var userimg = pageElement.querySelector("#userImg");
                    if (userimg) {
                        userimg.parentNode.removeChild(userimg);
                    }
                }
            }

            var loadData = function () {
                Log.call(Log.l.trace, "AppHeader.Controller.");
                var usernamefield = pageElement.querySelector(".user-name-field");
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
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            // Finally, wire up binding
            WinJS.Resources.processAll(that.element).then(function () {
                return WinJS.Binding.processAll(that.element, that.binding);
            }).then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
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


