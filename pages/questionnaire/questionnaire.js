// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/pages/questionnaire/questionnaireController.js" />
(function () {
    "use strict";

    WinJS.Namespace.define("Application.QuestionnaireLayout", {
        QuestionsLayout: WinJS.Class.define(function (options) {
            this._site = null;
            this._surface = null;
        },
            {
                // This sets up any state and CSS layout on the surface of the custom layout
                initialize: function (site) {
                    this._site = site;
                    this._surface = this._site.surface;

                    // Add a CSS class to control the surface level layout
                    WinJS.Utilities.addClass(this._surface, "questionnaireLayout");

                    return WinJS.UI.Orientation.vertical;
                },

                // Reset the layout to its initial state
                uninitialize: function () {
                    WinJS.Utilities.removeClass(this._surface, "questionnaireLayout");
                    this._site = null;
                    this._surface = null;
                }
            })
    });

    var pageName = Application.getPagePath("questionnaire");

    WinJS.UI.Pages.define(pageName, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            Log.call(Log.l.u1, pageName + ".");
            this.inResize = 0;
            this.prevWidth = 0;
            this.prevHeight = 0;

            // add page specific commands to AppBar
            var commandList;
            if (AppData._persistentStates.cameraFeatureSupported) {
                commandList = [
                    { id: 'clickBack', label: getResourceText('command.backward'), tooltip: getResourceText('tooltip.backward'), section: 'primary', svg: 'navigate_left' },
                    { id: 'clickNew', label: getResourceText('command.new'), tooltip: getResourceText('tooltip.new'), section: 'primary', svg: 'user_plus' },
                    { id: 'clickForward', label: getResourceText('command.ok'), tooltip: getResourceText('tooltip.ok'), section: 'primary', svg: 'navigate_check', key: WinJS.Utilities.Key.enter },
                    { id: 'clickPhoto', label: getResourceText('command.photo'), tooltip: getResourceText('tooltip.photo'), section: 'primary', svg: 'camera' }
                ];
            } else {
                commandList = [
                    { id: 'clickBack', label: getResourceText('command.backward'), tooltip: getResourceText('tooltip.backward'), section: 'primary', svg: 'navigate_left' },
                    { id: 'clickNew', label: getResourceText('command.new'), tooltip: getResourceText('tooltip.new'), section: 'primary', svg: 'user_plus' },
                    { id: 'clickForward', label: getResourceText('command.ok'), tooltip: getResourceText('tooltip.ok'), section: 'primary', svg: 'navigate_check', key: WinJS.Utilities.Key.enter }
                ];
            }

            this.controller = new Questionnaire.Controller(element, commandList);
            if (this.controller.eventHandlers) {
                // general event listener for hardware back button, too!
                this.controller.addRemovableEventListener(document, "backbutton", this.controller.eventHandlers.clickBack.bind(this.controller));
                this.controller.addRemovableEventListener(document, "mousedown", this.controller.eventHandlers.onMouseDown.bind(this.controller));
                this.controller.addRemovableEventListener(document, "pointerdown", this.controller.eventHandlers.onPointerDown.bind(this.controller));
            }
            Log.ret(Log.l.trace);
        },
        canUnload: function (complete, error) {
            var ret = null;
            var that = this;
            Log.call(Log.l.trace, pageName + ".");
            if (this.controller) {
                var isMandatoryQuestion = this.controller.isMandatoryQuestion();
                var isPflichtfeldAntwort = this.controller.isPflichtfeldAntwort();
                var confirmTitle = "";
                if ((isMandatoryQuestion && this.controller.actualquestion) ||
                    (isPflichtfeldAntwort && this.controller.actualPfquestion)) {
                    if (isMandatoryQuestion) {
                        confirmTitle = getResourceText("questionnaire.labelConfirmMandatoryField") +
                            ":\n" +
                            this.controller.actualquestion.FRAGESTELLUNG;
                        if (isPflichtfeldAntwort) {
                            confirmTitle = confirmTitle + "\n";
                        }
                    }
                    if (isPflichtfeldAntwort) {
                        confirmTitle = confirmTitle + getResourceText("questionnaire.labelConfirmPflichtfeldAntwort") +
                            ": " +
                            this.controller.pflichtfeldName +
                            "\n" +
                            this.controller.actualPfquestion.FRAGESTELLUNG;
                        if (AppData._contactData && AppData._contactData.Flag_NoEdit) {
                            confirmTitle = confirmTitle + "\n" + getResourceText("questionnaire.labelNoEditPflichtfeldAntwort");
                        }
                    }
                    // Soll PflichtfeldAntwort auch hart geprüft werden? Wenn ja, dann ist das Problem das ich nicht von der Seite wegkomme..
                    if (isMandatoryQuestion && AppData._persistentStates.showAlertConfirmQuestion) {
                        ret = alert(confirmTitle,
                            function (result) {
                                that.controller.selectRecordId(that.controller.actualquestion.ZeilenantwortVIEWID);
                            }).then(function (result) {
                                error(result);
                            });
                    } else {
                        var styleClass = isPflichtfeldAntwort ? "alertPflichtfeld" : null;
                        ret = confirm(confirmTitle,
                            function (result) {
                                if (!result) {
                                    var recordId = null;
                                    if (that.controller.actualPfquestion && that.controller.actualPfquestion.ZeilenantwortVIEWID) {
                                        recordId = that.controller.actualPfquestion.ZeilenantwortVIEWID;
                                    }
                                    if (that.controller.actualquestion && that.controller.actualquestion.ZeilenantwortVIEWID) {
                                        recordId = that.controller.actualquestion.ZeilenantwortVIEWID;
                                    }
                                    that.controller.selectRecordId(recordId);
                                    error(result);
                                }
                            },
                            null,
                            styleClass).then(function () {
                                return that.controller.saveData(function (response) {
                                    // called asynchronously if ok
                                    complete(response);
                                }, function (errorResponse) {
                                    error(errorResponse);
                                });
                            });
                    }
                } else {
                    ret = that.controller.saveData(function (response) {
                        // called asynchronously if ok
                        complete(response);
                    }, function (errorResponse) {
                        error(errorResponse);
                    });
                }
            }
            Log.ret(Log.l.trace);
            return ret;
        },
        unload: function () {
            Log.call(Log.l.u1, pageName + ".");
            // TODO: Respond to navigations away from this page.
            Log.ret(Log.l.trace);
        },
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            Log.call(Log.l.u1, pageName + ".");
            // TODO: Respond to changes in viewState.
            var ret = null;
            var that = this;
            var refreshFlipViewDelayed = function (flipView) {
                return WinJS.Promise.timeout(50).then(function () {
                    return that.updateLayout(element, viewState, lastViewState);
                }).then(function () {
                    return WinJS.Promise.timeout(50).then(function () {
                        if (flipView.winControl) {
                            flipView.winControl.forceLayout();
                        }
                    });
                });
            }
            if (element && !that.inResize) {
                that.inResize = 1;
                ret = WinJS.Promise.timeout(0).then(function () {
                    var headerInner = element.querySelector(".header-inner");
                    var flipView = element.querySelector("#imgListQuestionnaire.flipview");
                    var docContainer = element.querySelector(".doc-container");
                    var fieldsContainer = element.querySelector(".fields-container");
                    if (that.controller &&
                        fieldsContainer && fieldsContainer.style &&
                        docContainer && docContainer.style) {
                        var contentarea = element.querySelector(".contentarea");
                        if (contentarea) {
                            var width = contentarea.clientWidth;
                            var height = contentarea.clientHeight - 8;
                            var fieldWidth;
                            var docWidth;
                            var contentheader = element.querySelector(".header-container .content-header");
                            if (contentheader) {
                                height -= contentheader.clientHeight;
                            }
                            if (that.controller.hasDoc()) {
                                if (docContainer.style.display === "none" && width > Application.maxViewSize.mediumSmall + 20 ||
                                    docContainer.style.display !== "none" && width > Application.maxViewSize.mediumSmall) {
                                    fieldWidth = Math.floor(width / 2);
                                    var maxDocContainerWidth = Math.floor(height / Math.sqrt(2)) - 16;
                                    if (fieldWidth > maxDocContainerWidth) {
                                        docWidth = maxDocContainerWidth;
                                        fieldWidth = width - docWidth - 16;
                                    } else {
                                        docWidth = fieldWidth - 16;
                                    }
                                } else {
                                    fieldWidth = width;
                                    docWidth = 0;
                                }
                            } else {
                                fieldWidth = width;
                                docWidth = 0;
                            }
                            if (width !== that.prevWidth) {
                                that.prevWidth = width;
                                fieldsContainer.style.width = fieldWidth.toString() + "px";
                                docContainer.style.width = docWidth.toString() + "px";
                            }
                            if (height !== that.prevHeight) {
                                that.prevHeight = height;
                                docContainer.style.height = height.toString() + "px";
                                fieldsContainer.style.height = height.toString() + "px";
                                if (that.controller.hasDoc() && flipView && flipView.style) {
                                    flipView.style.height = height.toString() + "px";
                                }
                            }
                            if (navigator.appVersion &&
                                (navigator.appVersion.indexOf("iPhone OS") >= 0 ||
                                    navigator.appVersion.indexOf("iPod OS") >= 0)) {
                                if (headerInner) {
                                    WinJS.Utilities.addClass(headerInner, "no-transform");
                                }
                                if (flipView) {
                                    WinJS.Utilities.addClass(flipView, "no-transform");
                                }
                            }
                            if (docWidth > 0) {
                                docContainer.style.display = "";
                                var headerContainer = element.querySelector(".header-container");
                                if (headerContainer && headerInner && (!headerInner.parentElement || !WinJS.Utilities.hasClass(headerInner.parentElement, "header-container"))) {
                                    if (headerInner.parentElement) {
                                        headerInner.parentElement.removeChild(headerInner);
                                    }
                                    headerContainer.appendChild(headerInner);
                                }
                            } else {
                                docContainer.style.display = "none";
                                var listHeader = element.querySelector("#listQuestionnaire .list-header");
                                if (listHeader && headerInner && (!headerInner.parentElement || !WinJS.Utilities.hasClass(headerInner.parentElement, "list-header"))) {
                                    if (headerInner.parentElement) {
                                        headerInner.parentElement.removeChild(headerInner);
                                    }
                                    listHeader.appendChild(headerInner);
                                }
                            }
                            var imgFooterContainer = element.querySelector("#listQuestionnaire .img-footer-container");
                            if (docWidth > 0 || !imgFooterContainer) {
                                WinJS.Utilities.addClass(element, "view-size-split");
                                if (flipView &&
                                    (!flipView.parentElement || !WinJS.Utilities.hasClass(flipView.parentElement, "doc-container"))) {
                                    if (flipView.parentElement) {
                                        flipView.parentElement.removeChild(flipView);
                                    }
                                    docContainer.appendChild(flipView);
                                    refreshFlipViewDelayed(flipView);
                                }
                            } else {
                                WinJS.Utilities.removeClass(element, "view-size-split");
                                if (flipView && imgFooterContainer &&
                                    (!flipView.parentElement || !WinJS.Utilities.hasClass(flipView.parentElement, "img-footer-container"))) {
                                    if (flipView.parentElement) {
                                        flipView.parentElement.removeChild(flipView);
                                    }
                                    imgFooterContainer.appendChild(flipView);
                                    refreshFlipViewDelayed(flipView);
                                }
                            }
                            WinJS.Utilities.removeClass(element, "view-size-small");
                            WinJS.Utilities.removeClass(element, "view-size-medium-small");
                            WinJS.Utilities.removeClass(element, "view-size-medium");
                            WinJS.Utilities.removeClass(element, "view-size-bigger");
                            if (fieldWidth > 499) {
                                // remove class: view-size-small  
                                WinJS.Utilities.removeClass(fieldsContainer, "view-size-small");
                            } else {
                                // add class: view-size-small    
                                WinJS.Utilities.addClass(fieldsContainer, "view-size-small");
                            }
                            if (fieldWidth > 699) {
                                // remove class: view-size-medium-small  
                                WinJS.Utilities.removeClass(fieldsContainer, "view-size-medium-small");
                            } else {
                                // add class: view-size-medium-small    
                                WinJS.Utilities.addClass(fieldsContainer, "view-size-medium-small");
                            }
                            if (fieldWidth > 899) {
                                // remove class: view-size-medium    
                                WinJS.Utilities.removeClass(fieldsContainer, "view-size-medium");
                            } else {
                                // add class: view-size-medium
                                WinJS.Utilities.addClass(fieldsContainer, "view-size-medium");
                            }
                            if (fieldWidth > 1099) {
                                // remove class: view-size-bigger
                                WinJS.Utilities.removeClass(fieldsContainer, "view-size-bigger");
                            } else {
                                // add class: view-size-bigger
                                WinJS.Utilities.addClass(fieldsContainer, "view-size-bigger");
                            }
                        }
                    }
                    that.inResize = 0;
                });
            }
            Log.ret(Log.l.u1);
            return ret || WinJS.Promise.as();
        }
    });
})();
