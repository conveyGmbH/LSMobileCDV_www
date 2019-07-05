// controller for page: questionnaire
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/questionnaireRemote/questionnaireRemoteService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/CameraConstants.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("QuestionnaireRemote", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
            Application.Controller.apply(this, [pageElement, {
                count: 0
            }, commandList]);
            this.nextUrl = null;
            this.loading = false;
            this.questions = null;
            this.actualquestion = null;
            this.images = null;
            this.docIds = null;
            this.selectQuestionIdxs = null;

            var checkIPhoneBug = function () {
                if (navigator.appVersion) {
                    var testDevice = ["iPhone OS", "iPod OS"];
                    for (var i = 0; i < testDevice.length; i++) {
                        var iPhonePod = navigator.appVersion.indexOf(testDevice[i]);
                        if (iPhonePod >= 0) {
                            var strVersion = navigator.appVersion.substr(iPhonePod + testDevice[i].length);
                            var testVersion = ["11_3", "11_4"];
                            for (var j = 0; j < testVersion.length; j++) {
                                if (strVersion.indexOf(testVersion[j]) === 1) {
                                    return true;
                                }
                            }
                            break;
                        }
                    }
                }
                return false;
            };
            var hasIPhoneBug = checkIPhoneBug();

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#listQuestionnaireRemote.listview");
            var flipView = pageElement.querySelector("#imgListQuestionnaireRemote.flipview");

            if (hasIPhoneBug && listView) {
                WinJS.Utilities.addClass(listView, "no-transform");
                hasIPhoneBug = false;
            }

            this.dispose = function () {
                if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
                if (flipView && flipView.winControl) {
                    flipView.winControl.itemDataSource = null;
                }
                if (that.questions) {
                    that.questions = null;
                }
                if (that.actualquestion) {
                    that.actualquestion = null;
                }
                if (that.images) {
                    that.images = null;
                }
                if (that.docIds) {
                    that.docIds = null;
                }
            };

            var hasDoc = function () {
                return (that.images && that.images.length > 0);
            }
            this.hasDoc = hasDoc;

            var forceFlipViewLayout = function() {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                if (that.images && listView && listView.winControl) {
                    var pageControl = pageElement.winControl;
                    if (pageControl && !pageControl.inResize) {
                        WinJS.Promise.timeout(50).then(function() {
                            if (pageControl && pageControl.updateLayout) {
                                pageControl.prevWidth = 0;
                                pageControl.prevHeight = 0;
                                return pageControl.updateLayout.call(pageControl, pageElement);
                            } else {
                                return WinJS.Promise.as();
                            }
                        }).then(function() {
                            if (flipView && flipView.parentElement && flipView.winControl) {
                                flipView.winControl.currentPage = 0;
                                flipView.winControl.forceLayout();
                            }
                        });
                    } else {
                        WinJS.Promise.timeout(50).then(function() {
                            if (typeof that.forceFlipViewLayout === "function") {
                                that.forceFlipViewLayout();
                            }
                        });
                    }
                }
                Log.ret(Log.l.trace);
            }
            that.forceFlipViewLayout = forceFlipViewLayout;

            var addImage = function (json) {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                if (json && json.d) {
                    if (!that.images) {
                        // Now, we call WinJS.Binding.List to get the bindable list
                        that.images = new WinJS.Binding.List([]);
                        if (flipView && flipView.winControl) {
                            flipView.winControl.itemDataSource = that.images.dataSource;
                        }
                    }
                    var docContent;
                    if (json.d.PrevContentDOCCNT2) {
                        docContent = json.d.PrevContentDOCCNT2;
                    } else {
                        docContent = json.d.DocContentDOCCNT1;
                    }
                    if (docContent) {
                        var sub = docContent.search("\r\n\r\n");
                        if (sub >= 0) {
                            var data = docContent.substr(sub + 4);
                            if (data && data !== "null") {
                                var title = (that.images.length + 1).toString() + " / " + that.docCount;
                                var picture = "data:image/jpeg;base64," + data;
                                that.images.push({
                                    type: "item",
                                    DOC1ZeilenantwortID: json.d.DOC1ZeilenantwortVIEWID,
                                    title: title,
                                    picture: picture
                                });
                                if (that.images.length === 1) {
                                    that.forceFlipViewLayout();
                                } else if (flipView && flipView.winControl) {
                                    flipView.winControl.currentPage = that.images.length - 1;
                                }
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.addImage = addImage;

            var scrollToRecordId = function (recordId) {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.", "recordId=" + recordId);
                if (that.loading) {
                    var scrollToPromise = WinJS.Promise.timeout(50).then(function () {
                        that.removeDisposablePromise(scrollToPromise);
                        that.scrollToRecordId(recordId);
                    });
                    that.addDisposablePromise(scrollToPromise);
                } else {
                    if (recordId && listView && listView.winControl) {
                        for (var i = 0; i < that.questions.length; i++) {
                            var question = that.questions.getAt(i);
                            if (question && typeof question === "object" &&
                                question.ZeilenantwortVIEWID === recordId) {
                                listView.winControl.indexOfFirstVisible = i;
                                break;
                            }
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.scrollToRecordId = scrollToRecordId;

            var selectRecordId = function (recordId) {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.", "recordId=" + recordId);
                if (recordId && listView && listView.winControl && listView.winControl.selection) {
                    for (var i = 0; i < that.questions.length; i++) {
                        var question = that.questions.getAt(i);
                        if (question && typeof question === "object" &&
                            question.ZeilenantwortVIEWID === recordId) {
                            listView.winControl.selection.set(i).done(function () {
                                var scrollToPromise = WinJS.Promise.timeout(50).then(function () {
                                    that.removeDisposablePromise(scrollToPromise);
                                    that.scrollToRecordId(recordId);
                                });
                                that.addDisposablePromise(scrollToPromise);
                            });
                            break;
                        }
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.selectRecordId = selectRecordId;

            var singleRatingTemplate = null, multiRatingTemplate = null, comboTemplate = null, singleTemplate8 = null, multiTemplate8 = null, singleTemplate28 = null, multiTemplate28 = null;
            // Conditional renderer that chooses between templates
            var listQuestionnaireRenderer = function (itemPromise) {
                return itemPromise.then(function (item) {
                    if (item.data.type === "combo") {
                        if (!comboTemplate) {
                            comboTemplate = pageElement.querySelector(".listQuestionnaire-combo-template").winControl;
                        }
                        return comboTemplate.renderItem(itemPromise);
                    } else if (item.data.type === "single8") {
                        if (!singleTemplate8) {
                            singleTemplate8 = pageElement.querySelector(".listQuestionnaire-single-template8")
                                .winControl;
                        }
                        return singleTemplate8.renderItem(itemPromise);
                    } else if (item.data.type === "multi8") {
                        if (!multiTemplate8) {
                            multiTemplate8 = pageElement.querySelector(".listQuestionnaire-multi-template8").winControl;
                        }
                        return multiTemplate8.renderItem(itemPromise);
                    } else if (item.data.type === "single-rating") {
                        if (!singleRatingTemplate) {
                            singleRatingTemplate = pageElement
                                .querySelector(".listQuestionnaire-single-rating-template").winControl;
                        }
                        return singleRatingTemplate.renderItem(itemPromise);
                    } else if (item.data.type === "multi-rating") {
                        if (!multiRatingTemplate) {
                            multiRatingTemplate = pageElement.querySelector(".listQuestionnaire-multi-rating-template")
                                .winControl;
                        }
                        return multiRatingTemplate.renderItem(itemPromise);
                    } else if (item.data.type === "single") {
                        if (!singleTemplate28) {
                            singleTemplate28 = pageElement.querySelector(".listQuestionnaire-single-template28")
                                .winControl;
                        }
                        return singleTemplate28.renderItem(itemPromise);
                    } else {
                        if (!multiTemplate28) {
                            multiTemplate28 = pageElement.querySelector(".listQuestionnaire-multi-template28")
                                .winControl;
                        }
                        return multiTemplate28.renderItem(itemPromise);
                    }
                });
            };
            this.listQuestionnaireRenderer = listQuestionnaireRenderer;

            var progress = null;
            var counter = null;
            var layout = null;

            var maxLeadingPages = 0;
            var maxTrailingPages = 0;

            var resultConverter = function (item, index) {
                var keyValue, keyTitle, iStr, i;
                if (item.SRMax) {
                    item.type = "single-rating";
                } else if (item.MRShow01) {
                    item.type = "multi-rating";
                } else if (item.SS01) {
                    var ssItems = [];
                    if (item.Combobox) {
                        item.type = "combo";
                    } else if (item.SS09) {
                        item.type = "single";
                    } else {
                        item.type = "single8";
                    }
                    if (typeof item.SSANTWORT !== "undefined") {
                        if (item.Combobox) {
                            ssItems.push({
                                title: "",
                                value: null
                            });
                        }
                        for (i = 1; i <= 28; i++) {
                            iStr = i.toString();
                            if (i < 10) {
                                keyValue = "SSANTWORT0" + iStr;
                                keyTitle = "SS0" + iStr;
                            } else {
                                keyValue = "SSANTWORT" + iStr;
                                keyTitle = "SS" + iStr;
                            }
                            if (item.Combobox) {
                                if (item[keyTitle] && item[keyValue] && item[keyTitle] !== "null" && item[keyValue] !== "null") {
                                    ssItems.push({
                                        title: item[keyTitle],
                                        value: item[keyValue]
                                    });
                                }
                            } else {
                                var checked = keyValue + "CHECKED";
                                if (item[keyValue] !== null) {
                                    if (item[keyValue] === item.SSANTWORT) {
                                        item[checked] = true;
                                    } else {
                                        item[checked] = false;
                                    }
                                }

                            }
                        }
                        var name = "SSANTWORT" + item.ZeilenantwortVIEWID.toString();
                        item.SSNAME = name;
                        if (item.Combobox) {
                            item.SSITEMS = ssItems;
                        }
                    }
                } else if (item.MS09) {
                    item.type = "multi";
                } else {
                    item.type = "multi8";
                }
                item.textarea = getResourceText("questionnaireRemote.textarea");
                if (item.Freitext === null) {
                    item.Freitext = "";
                }
                if (item.FreitextAktiv === null && hasIPhoneBug) { //  && device.version === "11.3"
                    item.FreitextAktiv = 3;
                }
                if (item.DateCombobox) {
                    item["DateComboboxButtonShow"] = true;
                    item["DateComboboxButtonOk"] = false;
                } else {
                    item["DateComboboxButtonShow"] = false;
                    item["DateComboboxButtonOk"] = false;
                }
                if (item.PflichtFeld) {
                    if (Colors.isDarkTheme) {
                        item["mandatoryColor"] = "#8b4513";
                    } else {
                        item["mandatoryColor"] = "lightyellow";
                    }
                } else {
                    item["mandatoryColor"] = AppData._persistentStates.showAppBkg ? "transparent" : Colors.backgroundColor;
                }
                // Abfrage welcher Typ um Typ von Antwort, dann alle null werte ignorieren 
                if (item.type === "single-rating") {
                    for (i = 1; i <= 6; i++) {
                        iStr = i.toString();
                        if (i < 10) {
                            // keyValue = "SRANTWORT0" + iStr;
                            keyTitle = "SR0" + iStr;
                        } else {
                            //keyValue = "SSANTWORT" + iStr;
                            keyTitle = "SR" + iStr;
                        }
                        if (item[keyTitle] === null) {
                            item[keyTitle] = "";
                        }
                        if (item[keyValue] === null) {
                            item[keyValue] = "";
                        }
                    }
                }
                if (item.type === "multi-rating") {
                    for (i = 1; i <= 6; i++) {
                        iStr = i.toString();
                        if (i < 10) {
                            keyValue = "MRShow0" + iStr;
                            keyTitle = "MR0" + iStr;
                        } else {
                            keyValue = "MRShow" + iStr;
                            keyTitle = "MR" + iStr;
                        }
                        if (item[keyValue] === null) {
                            item[keyValue] = "";
                        }
                        if (item[keyTitle] === null) {
                            item[keyTitle] = "";
                        }
                    }
                }
                if (index >= 0 && that.docIds) {
                    that.docIds[index] = {
                        ZeilenantwortVIEWID: item.ZeilenantwortVIEWID,
                        DOC1ZeilenantwortID: item.DOC1ZeilenantwortID
                    };
                    if (item.DOC1ZeilenantwortID) {
                        that.docCount++;
                        var loadPicturePromise = WinJS.Promise.timeout(50).then(function () {
                            that.removeDisposablePromise(loadPicturePromise);
                            that.loadPicture(item.DOC1ZeilenantwortID);
                        });
                        that.addDisposablePromise(loadPicturePromise);
                    }
                }
            }
            this.resultConverter = resultConverter;

            var resultMandatoryConverter = function (item) {
                if (item.INITOptionTypeID === 22) {
                    if (item.LocalValue === "1") {
                        AppData._persistentStates.showConfirmQuestion = true;
                    } else {
                        AppData._persistentStates.showConfirmQuestion = false;
                    }
                }
            }
            this.resultMandatoryConverter = resultMandatoryConverter;

            var getHideQuestion = function (item, sortIdx) {
                var hideQuestion = false;
                if (item && typeof sortIdx === "number") {
                    var value, key;
                    if (sortIdx > 0 && sortIdx < 9) {
                        value = "0" + sortIdx.toString();
                    } else {
                        value = sortIdx.toString();
                    }
                    switch (item.type) {
                        case "single-rating":
                            if (sortIdx >= 1 && sortIdx <= 6) {
                                if (item.RRANTWORT === value) {
                                    hideQuestion = false;
                                } else {
                                    hideQuestion = true;
                                }
                            }
                            break;
                        case "multi-rating":
                            if (sortIdx >= 1 && sortIdx <= 6) {
                                key = "MrAntwort" + value;
                                if (item[key] === "X") {
                                    hideQuestion = false;
                                } else {
                                    hideQuestion = true;
                                }
                            }
                            break;
                        case "multi":
                            key = "MSANTWORT" + value;
                            if (item[key] === "X") {
                                hideQuestion = false;
                            } else {
                                hideQuestion = true;
                            }
                            break;
                        case "multi8":
                            if (sortIdx >= 1 && sortIdx <= 8) {
                                key = "MSANTWORT" + value;
                                if (item[key] === "X") {
                                    hideQuestion = false;
                                } else {
                                    hideQuestion = true;
                                }
                            }
                            break;
                        case "combo":
                            if (item.SSANTWORT === value) {
                                hideQuestion = false;
                            } else {
                                hideQuestion = true;
                            }
                            break;
                        case "single":
                            if (item.SSANTWORT === value) {
                                hideQuestion = false;
                            } else {
                                hideQuestion = true;
                            }
                            break;
                        case "single8":
                            if (sortIdx >= 1 && sortIdx <= 8) {
                                if (item.SSANTWORT === value) {
                                    hideQuestion = false;
                                } else {
                                    hideQuestion = true;
                                }
                            }
                            break;
                    }
                }
                return hideQuestion;
            }
            this.getHideQuestion = getHideQuestion;

            var checkForHideQuestion = function (items) {
                var i, item, selItem, selQuestionIdx;
                if (items) {
                    for (i = 0; i < items.length; i++) {
                        item = items[i];
                        if (!item.PflichtFeld &&
                            item.SelektierteFrageIdx > 0 &&
                            item.SelektierteFrageIdx <= items.length &&
                            item.SelektierteFrageIdx !== i + 1) {
                            selQuestionIdx = item.SelektierteFrageIdx - 1;
                            selItem = items[selQuestionIdx];
                            item.hideQuestion = getHideQuestion(selItem, item.SelektierteAntwortIdx);
                            if (!that.selectQuestionIdxs) {
                                that.selectQuestionIdxs = [];
                            }
                            if (!that.selectQuestionIdxs[selQuestionIdx]) {
                                that.selectQuestionIdxs[selQuestionIdx] = [i];
                            } else {
                                that.selectQuestionIdxs[selQuestionIdx].push(i);
                            }
                        } else {
                            item.hideQuestion = false;
                        }
                    }
                } else if (that.questions) {
                    for (i = 0; i < that.questions.length; i++) {
                        item = that.questions.getAt(i);
                        if (!item.PflichtFeld &&
                            item.SelektierteFrageIdx > 0 &&
                            item.SelektierteFrageIdx <= that.questions.length &&
                            item.SelektierteFrageIdx !== i + 1) {
                            selQuestionIdx = item.SelektierteFrageIdx - 1;
                            selItem = that.questions.getAt(selQuestionIdx);
                            var hideQuestion = getHideQuestion(selItem, item.SelektierteAntwortIdx);
                            if (hideQuestion !== item.hideQuestion) {
                                item.hideQuestion = hideQuestion;
                                that.questions.setAt(i, item);
                            }
                            if (!that.selectQuestionIdxs) {
                                that.selectQuestionIdxs = [];
                            }
                            if (!that.selectQuestionIdxs[selQuestionIdx]) {
                                that.selectQuestionIdxs[selQuestionIdx] = [i];
                            } else {
                                that.selectQuestionIdxs[selQuestionIdx].push(i);
                            }
                        } else {
                            item.hideQuestion = false;
                        }
                    }
                }
            }
            this.checkForHideQuestion = checkForHideQuestion;

            var checkForSelectionQuestion = function (selIdx) {
                if (that.selectQuestionIdxs && that.questions) {
                    var curScope = null;
                    var question = that.questions.getAt(selIdx);
                    if (question && typeof question === "object" &&
                        typeof that.selectQuestionIdxs[selIdx] === "object") {
                        curScope = copyByValue(question);
                    }
                    if (curScope) {
                        var newRecord = that.getFieldEntries(selIdx, curScope.type);
                        if (that.mergeRecord(curScope, newRecord)) {
                            Log.print(Log.l.trace, "handle changes of item[" + selIdx + "]");
                            var optionQuestionIdxs = that.selectQuestionIdxs[selIdx];
                            for (var i = 0; i < optionQuestionIdxs.length; i++) {
                                var idx = optionQuestionIdxs[i];
                                var item = that.questions.getAt(idx);
                                var selQuestionIdx = item.SelektierteFrageIdx > 0 ? item.SelektierteFrageIdx - 1 : -1;
                                if (!item.PflichtFeld &&
                                    selQuestionIdx === selIdx &&
                                    selQuestionIdx !== idx) {
                                    var hideQuestion = getHideQuestion(curScope, item.SelektierteAntwortIdx);
                                    if (hideQuestion !== item.hideQuestion) {
                                        item.hideQuestion = hideQuestion;
                                        that.questions.setAt(idx, item);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            this.checkForSelectionQuestion = checkForSelectionQuestion;

            // get field entries
            var getFieldEntries = function (index, type) {
                var ret = {};
                if (listView && listView.winControl) {
                    var element = listView.winControl.elementFromIndex(index);
                    if (element) {
                        var fields, i, key, field;
                        if (type === "multi8" || type === "multi") {
                            fields = element.querySelectorAll('input[type="checkbox"]');
                            for (i = 1; i <= fields.length; i++) {
                                if (i < 10) {
                                    key = "MSANTWORT0" + i.toString();
                                } else if (i < 13) {
                                    key = "MSANTWORT" + i.toString();
                                } else {
                                    key = "MsAntwort" + i.toString();
                                }
                                if (fields[i - 1].checked) {
                                    ret[key] = "X";
                                } else {
                                    ret[key] = null;
                                }
                            }
                        } else if (type === "single8" || type === "single") {
                            fields = element.querySelectorAll('input[type="radio"]');
                            for (i = 1; i <= fields.length; i++) {
                                if (fields[i - 1].checked) {
                                    var value;
                                    if (i < 10) {
                                        value = "0" + i.toString();
                                    } else {
                                        value = i.toString();
                                    }
                                    ret["SSANTWORT"] = value;
                                    break;
                                }
                            }
                        } else if (type === "multi-rating") {
                            fields = element.querySelectorAll('input[type="checkbox"]');
                            for (i = 1; i <= fields.length; i++) {
                                if (i < 10) {
                                    key = "MrAntwort0" + i.toString();
                                } else {
                                    key = "MrAntwort" + i.toString();
                                }
                                if (fields[i - 1].checked) {
                                    ret[key] = "X";
                                } else {
                                    ret[key] = null;
                                }
                            }
                        } else if (type === "single-rating") {
                            field = element.querySelector(".win-rating");
                            if (field && field.winControl) {
                                if (field.winControl.userRating < 10) {
                                    ret["RRANTWORT"] = "0" + field.winControl.userRating;
                                } else {
                                    ret["RRANTWORT"] = field.winControl.userRating;
                                }
                            }
                        } else if (type === "combo") {
                            field = element.querySelector(".win-dropdown");
                            if (field && field.value !== "null") {
                                ret["SSANTWORT"] = field.value;
                            }
                        }
                        field = element.querySelector("textarea");
                        if (field && field.value !== "null") {
                            ret["Freitext"] = field.value;
                        }
                    }
                }
                return ret;
            };
            this.getFieldEntries = getFieldEntries;

            var mergeRecord = function (prevRecord, newRecord) {
                Log.call(Log.l.u1, "QuestionnaireRemote.Controller.");
                var ret = false;
                for (var prop in newRecord) {
                    if (newRecord.hasOwnProperty(prop)) {
                        if (newRecord[prop] !== prevRecord[prop]) {
                            prevRecord[prop] = newRecord[prop];
                            ret = true;
                        }
                    }
                }
                Log.ret(Log.l.u1, ret);
                return ret;
            }
            this.mergeRecord = mergeRecord;

            var saveData = function (complete, error) {
                var ret = null;
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                // standard call via modify
                var recordId = that.prevRecId;
                if (!recordId) {
                    // called via canUnload
                    recordId = that.curRecId;
                }
                that.prevRecId = 0;
                if (recordId) {
                    var i;
                    var curScope = null;
                    for (i = 0; i < that.questions.length; i++) {
                        var question = that.questions.getAt(i);
                        if (question && typeof question === "object" &&
                            question.ZeilenantwortVIEWID === recordId) {
                            curScope = question;
                            break;
                        }
                    }
                    if (curScope) {
                        var newRecord = that.getFieldEntries(i, curScope.type);
                        if (that.mergeRecord(curScope, newRecord)) {
                            Log.print(Log.l.trace, "save changes of recordId:" + recordId);
                            ret = QuestionnaireRemote.questionnaireView.update(function (response) {
                                // called asynchronously if ok
                                complete(response);
                            }, function (errorResponse) {
                                AppData.setErrorMsg(that.binding, errorResponse);
                                error(errorResponse);
                            }, recordId, curScope);
                        } else {
                            Log.print(Log.l.trace, "no changes in recordId:" + recordId);
                        }
                    }
                }
                if (!ret) {
                    ret = new WinJS.Promise.as().then(function () {
                        complete({});
                    });
                }
                Log.ret(Log.l.u1, ret);
                return ret;
            };
            this.saveData = saveData;

            var showConfirmBoxMandatory = function () {
                var ret = false;
                var i;
                
                for (i = 0; i < that.questions.length; i++) {
                    var question = that.questions.getAt(i);
                    if (question &&
                        typeof question === "object" &&
                        question.PflichtFeld &&
                        AppData._persistentStates.showConfirmQuestion) {

                        var curScope = question;
                        that.actualquestion = question;
                        var newRecord = that.getFieldEntries(i, curScope.type);
                        var prop;
                        
                        ret = true;
                        if (curScope.type === "multi-rating") {
                            for (prop in newRecord) {
                                if (newRecord.hasOwnProperty(prop)) {
                                    if (prop !== "Freitext") {
                                        if (newRecord[prop] === "X") {
                                            ret = false;
                                            break;
                                        }
                                    }    
                                }
                            }
                            if (ret) {
                                break;
                            }
                        } else {
                            for (prop in newRecord) {
                                if (newRecord.hasOwnProperty(prop)) {
                                    if (prop !== "Freitext") {
                                        if (newRecord[prop] && newRecord[prop].length > 0 && newRecord[prop] !== "0" && newRecord[prop] !== "00") {
                                            Log.call(Log.l.u1, "QuestionnaireRemote.Controller. Answer not empty" + newRecord.prop);
                                            ret = false;
                                            break;
                                        }
                                    } 
                                }
                            }
                            if (ret) {
                                break;
                            }
                        }
                    }
                }
                Log.ret(Log.l.u1);
                return ret;
            };
            this.showConfirmBoxMandatory = showConfirmBoxMandatory;

            var getNextDocId = function () {
                var ret = null;
                Log.call(Log.l.u1, "QuestionnaireRemote.Controller.");
                if (that.docIds && that.docIds.length > 0) {
                    for (var i = 0; i < that.docIds.length; i++) {
                        var curId = that.docIds[i];
                        if (curId.ZeilenantwortVIEWID && !curId.DOC1ZeilenantwortID) {
                            ret = curId.ZeilenantwortVIEWID;
                            break;
                        }
                    }
                }
                Log.ret(Log.l.u1, ret);
                return ret;
            }
            this.getNextDocId = getNextDocId;

            var setNextDocId = function (docId) {
                Log.call(Log.l.u1, "QuestionnaireRemote.Controller.");
                if (that.docIds && that.docIds.length > 0) {
                    for (var i = 0; i < that.docIds.length; i++) {
                        var curId = that.docIds[i];
                        if (curId.ZeilenantwortVIEWID === docId) {
                            curId.DOC1ZeilenantwortID = docId;
                            break;
                        }
                    }
                }
                AppBar.triggerDisableHandlers();
                Log.ret(Log.l.u1);
            };
            that.setNextDocId = setNextDocId;

            var textFromDateCombobox = function (id, element) {
                Log.call(Log.l.error, "QuestionnaireRemote.Controller.");
                if (element && element.parentElement) {
                    var recordId = that.curRecId;
                    var curScope = null;
                    var i;
                    for (i = 0; i < that.questions.length; i++) {
                        var question = that.questions.getAt(i);
                        if (question &&
                            typeof question === "object" &&
                            question.ZeilenantwortVIEWID === recordId) {
                            curScope = question;
                            break;
                        }
                    }
                    if (curScope) {
                        var newRecord = that.getFieldEntries(i, curScope.type);
                        that.mergeRecord(curScope, newRecord);
                        switch (id) {
                            case "showDateCombobox":
                                that.resultConverter(curScope, -1);
                                curScope.DateComboboxButtonShow = false;
                                curScope.DateComboboxButtonOk = true;
                                break;
                            case "useDateCombobox":
                                var dateCombobox = element.parentElement.querySelector(".field-date-combobox");
                                if (dateCombobox && dateCombobox.winControl) {
                                    var current = dateCombobox.winControl.current;
                                    if (curScope.Freitext && curScope.Freitext.length > 0) {
                                        curScope.Freitext += " ";
                                    }
                                    curScope.Freitext += current.getDate().toString() +
                                        "." +
                                        (current.getMonth() + 1).toString() +
                                        "." +
                                        current.getFullYear().toString();
                                }
                                Log.print(Log.l.trace, "save changes of recordId:" + recordId);
                                QuestionnaireRemote.questionnaireView.update(function (response) {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "update of recordId:" + recordId + " success!");
                                }, function (errorResponse) {
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                }, recordId, curScope);
                                that.resultConverter(curScope, -1);
                                curScope.DateComboboxButtonShow = true;
                                curScope.DateComboboxButtonOk = false;
                                break;
                        }
                        that.questions.setAt(i, curScope);
                    }
                }
                Log.ret(Log.l.error);
            };
            this.textFromDateCombobox = textFromDateCombobox;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    var showconfirmbox = that.showConfirmBoxMandatory();
                    if (showconfirmbox) {
                        var confirmTitle = getResourceText("questionnaireRemote.labelConfirmMandatoryField") + ":\n" +
                            that.actualquestion.FRAGESTELLUNG;
                        confirm(confirmTitle, function (result) {
                           if (result) {
                               Application.navigateById('sketchRemote', event);
                           } else {
                               that.selectRecordId(that.actualquestion.ZeilenantwortVIEWID);
                           }
                        });   
                    } else {
                        Application.navigateById('sketchRemote', event);
                    }
                    //Vielleicht hier showconfirmbox?
                    Log.ret(Log.l.trace);
                },
                clickRating: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    WinJS.Promise.timeout(0).then(function () {
                        var recordId = that.curRecId;
                        if (recordId) {
                            // handle setDirty
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickButton: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (event.currentTarget) {
                        var id = event.currentTarget.id;
                        var element = event.currentTarget;
                        WinJS.Promise.timeout(50).then(function () {
                            that.textFromDateCombobox(id, element);
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                pressEnterKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    if (event && event.keyCode === WinJS.Utilities.Key.enter &&
                        event.target && event.target.tagName &&
                        event.target.tagName.toLowerCase() === "textarea") {
                        if (event.stopPropagation) {
                            event.stopPropagation();
                        } else {
                            event.cancelBubble = true;
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                activateEnterKey: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward") {
                            AppBar.commandList[i].key = WinJS.Utilities.Key.enter;
                            break;
                        }
                    }
                    if (event && event.target && !event.target.value && !hasIPhoneBug) {
                        WinJS.Utilities.removeClass(event.target, "field-text-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                deactivateEnterKey: function (event) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward") {
                            AppBar.commandList[i].key = null;
                            break;
                        }
                    }
                    if (event && event.target && !hasIPhoneBug) {
                        WinJS.Utilities.addClass(event.target, "field-text-comment-big");
                    }
                    Log.ret(Log.l.trace);
                },
                activateOnlyNumberKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    var recordId = that.curRecId;
                    var curScope = null;
                    var i;
                    for (i = 0; i < that.questions.length; i++) {
                        var question = that.questions.getAt(i);
                        if (question &&
                            typeof question === "object" &&
                            question.ZeilenantwortVIEWID === recordId) {
                            curScope = question;
                            break;
                        }
                    }
                    if (curScope && curScope.FreitextAktiv === "2") {
                        var charCode = event.keyCode;
                        if ((charCode >= 8 && charCode <= 46) || !event.shiftKey && (charCode >= 48 && charCode <= 57) || (charCode >= 91 && charCode <= 105)) {
                            //return true;
                        }
                        else {
                            // a.push(charCode);
                            event.preventDefault();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onPointerDown: function (e) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    that.cursorPos = { x: e.pageX, y: e.pageY };
                    Log.ret(Log.l.trace);
                },
                onMouseDown: function (e) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    that.cursorPos = { x: e.pageX, y: e.pageY };
                    Log.ret(Log.l.trace);
                },
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (listView && listView.winControl) {
                        var listControl = listView.winControl;
                        if (listControl.selection) {
                            var selectionCount = listControl.selection.count();
                            if (selectionCount === 1) {
                                // Only one item is selected, show the page
                                listControl.selection.getItems().done(function (items) {
                                    var item = items[0];
                                    if (item.data && item.data.ZeilenantwortVIEWID) {
                                        var newRecId = item.data.ZeilenantwortVIEWID;
                                        Log.print(Log.l.trace, "newRecId:" + newRecId + " curRecId:" + that.curRecId);
                                        if (newRecId !== 0 && newRecId !== that.curRecId) {
                                            AppData.setRecordId('Zeilenantwort', newRecId);
                                            if (that.curRecId) {
                                                that.prevRecId = that.curRecId;
                                            }
                                            that.curRecId = newRecId;
                                            if (that.prevRecId !== 0) {
                                                saveData(function (response) {
                                                    Log.print(Log.l.trace, "question saved");
                                                }, function (errorResponse) {
                                                    Log.print(Log.l.error, "error saving question");
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onLoadingStateChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (listView && listView.winControl) {
                        Log.print(Log.l.trace, "loadingState=" + listView.winControl.loadingState);
                        // single list selection
                        if (listView.winControl.selectionMode !== WinJS.UI.SelectionMode.single) {
                            listView.winControl.selectionMode = WinJS.UI.SelectionMode.single;
                        }
                        // direct selection on each tap
                        if (listView.winControl.tapBehavior !== WinJS.UI.TapBehavior.directSelect) {
                            listView.winControl.tapBehavior = WinJS.UI.TapBehavior.directSelect;
                        }
                        // Double the size of the buffers on both sides
                        if (!maxLeadingPages) {
                            maxLeadingPages = listView.winControl.maxLeadingPages * 4;
                            listView.winControl.maxLeadingPages = maxLeadingPages;
                        }
                        if (!maxTrailingPages) {
                            maxTrailingPages = listView.winControl.maxTrailingPages * 4;
                            listView.winControl.maxTrailingPages = maxTrailingPages;
                        }
                        if (listView.winControl.loadingState === "itemsLoading") {
                            if (!layout) {
                                layout = Application.QuestionnaireRemoteLayout.QuestionsLayout;
                                listView.winControl.layout = { type: layout };
                            }
                        } else if (listView.winControl.loadingState === "complete") {
                            if (that.loading) {
                                progress = listView.querySelector(".list-footer .progress");
                                counter = listView.querySelector(".list-footer .counter");
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                            }
                            Colors.loadSVGImageElements(listView, "question-image", 28, Colors.textColor);

                            if (that.questions) {
                                for (var i = 0; i < that.questions.length; i++) {
                                    var item = that.questions.getAt(i);
                                    if (item) {
                                        var element;
                                        if (item.SSITEMS && item.SSITEMS.length > 0) {
                                            element = listView.winControl.elementFromIndex(i);
                                            if (element) {
                                                var combo = element.querySelector(".win-dropdown");
                                                if (combo && combo.winControl) {
                                                    if (!combo.winControl.data ||
                                                        combo.winControl.data && combo.winControl.data.length !== item.SSITEMS.length) {
                                                        combo.winControl.data = new WinJS.Binding.List(item.SSITEMS);
                                                        combo.value = item.SSANTWORT;
                                                    }
                                                }
                                            }
                                        }
                                        if (item.DateComboboxButtonOk) {
                                            element = listView.winControl.elementFromIndex(i);
                                            if (element) {
                                                var dateComboboxElement = element.querySelector(".field-date-combobox");
                                                if (!dateComboboxElement) {
                                                    var useDateCombobox = element.querySelector("#useDateCombobox");
                                                    if (useDateCombobox && useDateCombobox.parentElement) {
                                                        dateComboboxElement = document.createElement("div");
                                                        if (dateComboboxElement) {
                                                            var dateComboboxControl = new WinJS.UI.DatePicker(dateComboboxElement);
                                                            WinJS.Utilities.addClass(dateComboboxElement, "field-date-combobox");
                                                            useDateCombobox.parentElement.insertBefore(dateComboboxElement, useDateCombobox);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (hasIPhoneBug) {
                                            element = listView.winControl.elementFromIndex(i);
                                            if (element) {
                                                var textarea = element.querySelector(".win-textarea.field-text-comment");
                                                if (item.FreitextAktiv === 3) {
                                                    textarea.readOnly = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            that.addScrollIntoViewCheckForInputElements(listView);
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        var visible = eventInfo.detail.visible;
                        if (visible) {
                            var contentHeader = listView.querySelector(".content-header");
                            if (contentHeader) {
                                var halfCircle = contentHeader.querySelector(".half-circle");
                                if (halfCircle && halfCircle.style) {
                                    if (halfCircle.style.visibility === "hidden") {
                                        halfCircle.style.visibility = "";
                                        WinJS.UI.Animation.enterPage(halfCircle);
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onFooterVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible) {
                            if (that.questions && that.nextUrl) {
                                that.loading = true;
                                if (progress && progress.style) {
                                    progress.style.display = "inline";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "none";
                                }
                                AppData.setErrorMsg(that.binding);
                                Log.print(Log.l.trace, "calling select QuestionnaireRemote.questionnaireView...");
                                var nextUrl = that.nextUrl;
                                that.nextUrl = null;
                                QuestionnaireRemote.questionnaireView.selectNext(function (json) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    Log.print(Log.l.trace, "QuestionnaireRemote.questionnaireView: success!");
                                    // startContact returns object already parsed from json file in response
                                    if (json && json.d) {
                                        that.nextUrl = QuestionnaireRemote.questionnaireView.getNextUrl(json);
                                        var results = json.d.results;
                                        results.forEach(function (item) {
                                            that.resultConverter(item, that.binding.count);
                                            that.binding.count = that.questions.push(item);
                                        });
                                        that.checkForHideQuestion();
                                    }
                                }, function (errorResponse) {
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                    if (progress && progress.style) {
                                        progress.style.display = "none";
                                    }
                                    if (counter && counter.style) {
                                        counter.style.display = "inline";
                                    }
                                    that.loading = false;
                                }, null, nextUrl);
                            } else {
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                                if (flipView &&  flipView.parentElement && flipView.winControl &&
                                    WinJS.Utilities.hasClass(flipView.parentElement, "img-footer-container")) {
                                    flipView.winControl.forceLayout();
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onItemInvoked: function (eventInfo) {
                    Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                    if (eventInfo && eventInfo.target) {
                        var comboInputFocus = eventInfo.target.querySelector(".win-dropdown:focus");
                        if (comboInputFocus) {
                            eventInfo.preventDefault();
                        } else {
                            // set focus into textarea if current mouse cursor is inside of element position
                            var freitextInput = eventInfo.target.querySelector(".field-text-comment");
                            if (freitextInput) {
                                var position = WinJS.Utilities.getPosition(freitextInput);
                                if (position) {
                                    var left = position.left;
                                    var top = position.top;
                                    var width = position.width;
                                    var height = position.height;
                                    if (that.cursorPos.x >= left &&
                                        that.cursorPos.x <= left + width &&
                                        that.cursorPos.y >= top &&
                                        that.cursorPos.y <= top + height) {
                                        WinJS.Promise.timeout(0).then(function () {
                                            // set focus async!
                                            freitextInput.focus();
                                        });
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onModified: function (event) {
                    if (that.selectQuestionIdxs && event && event.currentTarget &&
                        listView && listView.winControl) {
                        var element = event.currentTarget.parentElement;
                        while (element && element !== listView) {
                            if (element.className === "questionnaire-row") {
                                var i = listView.winControl.indexOfElement(element.parentElement);
                                that.checkForSelectionQuestion(i);
                                break;
                            }
                            element = element.parentElement;
                        }
                    }
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
                clickForward: function () {
                    // never disabled!
                    return false;
                },
                clickPhoto: function () {
                    if (AppBar.busy || !that.getNextDocId()) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }

            // register ListView event handler
            if (listView) {
                this.addRemovableEventListener(listView, "selectionchanged", this.eventHandlers.onSelectionChanged.bind(this));
                this.addRemovableEventListener(listView, "loadingstatechanged", this.eventHandlers.onLoadingStateChanged.bind(this));
                this.addRemovableEventListener(listView, "headervisibilitychanged", this.eventHandlers.onHeaderVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "footervisibilitychanged", this.eventHandlers.onFooterVisibilityChanged.bind(this));
                this.addRemovableEventListener(listView, "iteminvoked", this.eventHandlers.onItemInvoked.bind(this));
                // prevent some keyboard actions from listview to navigate within controls!
                this.addRemovableEventListener(listView, "keydown", function (e) {
                    if (!e.ctrlKey && !e.altKey) {
                        switch (e.keyCode) {
                            case WinJS.Utilities.Key.leftArrow:
                            case WinJS.Utilities.Key.rightArrow:
                            case WinJS.Utilities.Key.space:
                                if (e.stopPropagation) {
                                    e.stopPropagation();
                                } else {
                                    e.cancelBubble = true;
                                }
                                break;
                        }
                    }
                }.bind(this), true);
            }

            var loadPicture = function (pictureId) {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.", "pictureId=" + pictureId);
                var ret = null;
                if (!pictureId) {
                    Log.ret(Log.l.error, "NULL param!");
                    return WinJS.Promise.as();
                }
                if (that.images && that.images.length > 0) {
                    for (var i = 0; i < that.images.length; i++) {
                        var imageItem = that.images.getAt(i);
                        if (imageItem && imageItem.DOC1ZeilenantwortID === pictureId) {
                            Log.print(Log.l.trace, "questionnaireDocView: success!");
                            ret = WinJS.Promise.as();
                            break;
                        }
                    }
                }
                if (!ret) {
                    var loadPicturePromise = QuestionnaireRemote.questionnaireDocView.select(function (json) {
                        that.removeDisposablePromise(loadPicturePromise);
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "questionnaireDocView: success!");
                        that.addImage(json);
                    }, function (errorResponse) {
                        that.removeDisposablePromise(loadPicturePromise);
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, pictureId);
                    ret = that.addDisposablePromise(loadPicturePromise);
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            that.loadPicture = loadPicture;

            var loadData = function () {
                Log.call(Log.l.trace, "QuestionnaireRemote.Controller.");
                AppData.setErrorMsg(that.binding);
                if (that.questions) {
                    that.questions.length = 0;
                }
                that.docIds = [];
                if (that.images) {
                    that.images.length = 0;
                }
                that.docCount = 0;
                var contactId = AppData.getRecordId("Kontakt_Remote");
                var ret = new WinJS.Promise.as().then(function () {
                    if (!contactId) {
                        AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        return WinJS.Promise.as();
                    } else {
                        var questionnaireSelectPromise = QuestionnaireRemote.questionnaireView.select(function (json) {
                            that.removeDisposablePromise(questionnaireSelectPromise);
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "QuestionnaireRemote.questionnaireView: success!");
                            that.selectQuestionIdxs = null;
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                that.nextUrl = QuestionnaireRemote.questionnaireView.getNextUrl(json);
                                var results = json.d.results;
                                if (!that.questions) {
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                    that.checkForHideQuestion(results);
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    that.questions = new WinJS.Binding.List(results);
                                    that.binding.count = that.questions.length;
                                } else {
                                    results.forEach(function (item) {
                                        that.resultConverter(item, that.binding.count);
                                        that.binding.count = that.questions.push(item);
                                    });
                                    that.checkForHideQuestion();
                                }
                                if (listView && listView.winControl) {
                                    // fix focus handling
                                    that.setFocusOnItemInListView(listView);

                                    listView.winControl._supressScrollIntoView = true;
                                    // add ListView itemTemplate
                                    listView.winControl.itemTemplate = that.listQuestionnaireRenderer.bind(that);
                                    // add ListView dataSource
                                    listView.winControl.itemDataSource = that.questions.dataSource;
                                }
                            }
                        }, function (errorResponse) {
                            that.removeDisposablePromise(questionnaireSelectPromise);
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, {
                            KontaktID: contactId
                        });
                        return that.addDisposablePromise(questionnaireSelectPromise);
                    }
                }).then(function () {
                    var veranstoptionSelectPromise = QuestionnaireRemote.CR_VERANSTOPTION_ODataView.select(function (json) {
                        that.removeDisposablePromise(veranstoptionSelectPromise);
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "Login: success!");
                        // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response
                        if (json && json.d && json.d.results && json.d.results.length > 1) {
                            var results = json.d.results;
                            results.forEach(function (item) {
                                that.resultMandatoryConverter(item);
                            });
                        } else {
                            AppData._persistentStates.showConfirmQuestion = false;
                        }
                    }, function(error) {
                        that.removeDisposablePromise(veranstoptionSelectPromise);
                    });
                    return that.addDisposablePromise(veranstoptionSelectPromise);
                }).then(function () {
                    AppBar.triggerDisableHandlers();
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        }, {
            _docCount: 0,
            prevRecId: 0,
            curRecId: 0,
            cursorPos: { x: 0, y: 0 },
            docCount: {
                get: function () {
                    return this._docCount;
                },
                set: function (value) {
                    if (this._docCount !== value) {
                        this._docCount = value;
                        if (this.images) {
                            for (var i = 0; i < this.images.length; i++) {
                                var item = this.images.getAt(i);
                                item.title = (i + 1).toString() + " / " + this._docCount;
                                this.images.setAt(i, item);
                            }
                        }
                    }
                }
            }
        })
    });
})();

