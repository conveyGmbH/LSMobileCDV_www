// controller for page: questionnaire
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/questionnaire/questionnaireService.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/CameraConstants.js" />
/// <reference path="~/plugins/cordova-plugin-camera/www/Camera.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Questionnaire", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Questionnaire.Controller.");
            Application.Controller.apply(this, [pageElement, {
                count: 0
            }, commandList]);
            this.nextUrl = null;
            this.loading = false;
            this.questions = null;
            this.actualquestion = null;
            this.images = null;
            this.docIds = null;

            var that = this;

            // ListView control
            var listView = pageElement.querySelector("#listQuestionnaire.listview");
            var flipview = null;

            this.dispose = function () {
                if (listView && listView.winControl) {
                    listView.winControl.itemDataSource = null;
                }
                if (flipview && flipview.winControl) {
                    flipview.winControl.itemDataSource = null;
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

            var scrollToRecordId = function (recordId) {
                Log.call(Log.l.trace, "QuestionList.Controller.", "recordId=" + recordId);
                if (that.loading) {
                    WinJS.Promise.timeout(50).then(function () {
                        that.scrollToRecordId(recordId);
                    });
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
                Log.call(Log.l.trace, "QuestionList.Controller.", "recordId=" + recordId);
                if (recordId && listView && listView.winControl && listView.winControl.selection) {
                    for (var i = 0; i < that.questions.length; i++) {
                        var question = that.questions.getAt(i);
                        if (question && typeof question === "object" &&
                            question.ZeilenantwortVIEWID === recordId) {
                            listView.winControl.selection.set(i).done(function () {
                                WinJS.Promise.timeout(50).then(function () {
                                    that.scrollToRecordId(recordId);
                                });
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
                        for (var i = 1; i <= 28; i++) {
                            var keyValue, keyTitle;
                            var iStr = i.toString();
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
                            ssItems.push({
                                title: "",
                                value: null
                            });
                            item.SSITEMS = ssItems;
                        }
                    }
                } else if (item.MS09) {
                    item.type = "multi";
                } else {
                    item.type = "multi8";
                }
                item.textarea = getResourceText("questionnaire.textarea");
                if (item.Freitext === null) {
                    item.Freitext = "";
                }
                if (item.DOC1ZeilenantwortID !== "undefined") {
                    that.docIds.push({
                        ZeilenantwortVIEWID: item.ZeilenantwortVIEWID,
                        DOC1ZeilenantwortID: item.DOC1ZeilenantwortID
                    });
                    if (item.DOC1ZeilenantwortID) {
                        that.docCount++;
                        WinJS.Promise.timeout(50).then(function () {
                            that.loadPicture(item.DOC1ZeilenantwortID);
                        });
                    }
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
                }
                // Abfrage welcher Typ um Typ von Antwort, dann alle null werte ignorieren 
                if (item.type === "single-rating") {
                    for (var y = 1; y <= 6; y++) {
                        var keyValue, keyTitle;
                        var iStr = y.toString();
                        if (y < 10) {
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
                    for (var y = 1; y <= 6; y++) {
                        var keyValue, keyTitle;
                        var iStr = y.toString();
                        if (y < 10) {
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
                Log.call(Log.l.u1, "questionnaireController.");
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
                Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                            ret = Questionnaire.questionnaireView.update(function (response) {
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
                                            Log.call(Log.l.u1,"Questionnaire.Controller. Answer not empty" + newRecord.prop);
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
                Log.call(Log.l.u1, "Questionnaire.Controller.");
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
                Log.call(Log.l.u1, "Questionnaire.Controller.");
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

            var insertCameradata = function (imageData, width, height) {
                Log.call(Log.l.trace, "Questionnaire.Controller.");
                var ret = new WinJS.Promise.as().then(function () {
                    // UTC-Zeit in Klartext
                    var now = new Date();
                    var dateStringUtc = now.toUTCString();

                    // decodierte Dateigröße
                    var contentLength = Math.floor(imageData.length * 3 / 4);

                    var newPicture = {
                        DOC1ZeilenantwortVIEWID: that.getNextDocId(),
                        wFormat: 3,
                        ColorType: 11,
                        ulWidth: width,
                        ulHeight: height,
                        ulDpm: 0,
                        szOriFileNameDOC1: "Question.jpg",
                        DocContentDOCCNT1:
                        "Content-Type: image/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " + dateStringUtc + "\x0D\x0AContent-Length: " + contentLength + "\x0D\x0A\x0D\x0A" + imageData,
                        PrevContentDOCCNT2: null,
                        OvwContentDOCCNT3: null,
                        szOvwPathDOC3: null,
                        szPrevPathDOC4: null,
                        ContentEncoding: 4096
                    };
                    //load of format relation record data
                    Log.print(Log.l.trace, "insert new cameraData for DOC1ZeilenantwortVIEWID=" + newPicture.DOC1ZeilenantwortVIEWID);
                    return Questionnaire.questionnaireDocView.insert(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "questionnaireDocView: success!");
                        // contactData returns object already parsed from json file in response
                        if (json && json.d) {
                            that.setNextDocId(json.d.DOC1ZeilenantwortVIEWID);
                            Log.print(Log.l.info, "DOC1ZeilenantwortVIEWID=" + json.d.DOC1ZeilenantwortVIEWID);
                            that.docCount++;
                            WinJS.Promise.timeout(50).then(function () {
                                that.loadPicture(json.d.DOC1ZeilenantwortVIEWID);
                            });
                        } else {
                            AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        }
                        AppBar.busy = false;
                        return WinJS.Promise.as();
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        AppBar.busy = false;
                    }, newPicture);
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertCameradata = insertCameradata;

            var onPhotoDataSuccess = function (imageData) {
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
            };

            var onPhotoDataFail = function (message) {
                Log.call(Log.l.error, "Questionnaire.Controller.");
                //message: The message is provided by the device's native code
                //AppData.setErrorMsg(that.binding, message);
                AppBar.busy = false;
                Log.ret(Log.l.error);
            };

            var textFromDateCombobox = function (id, element) {
                Log.call(Log.l.error, "Questionnaire.Controller.");
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
                                that.resultConverter(curScope);
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
                                Questionnaire.questionnaireView.update(function (response) {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "update of recordId:" + recordId + " success!");
                                }, function (errorResponse) {
                                    AppData.setErrorMsg(that.binding, errorResponse);
                                }, recordId, curScope);
                                that.resultConverter(curScope);
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

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var takePhoto = function () {
                Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                    AppData.setErrorMsg(that.binding, { errorMessage: "Camera plugin not supported" });
                }
                Log.ret(Log.l.trace);
            }
            this.takePhoto = takePhoto;

            var showFlipView = function () {
                Log.call(Log.l.trace, "Questionnaire.Controller.");
                flipview = pageElement.querySelector("#imgListQuestionnaire.flipview");
                if (flipview && flipview.winControl) {
                    if (that.images && that.images.length > 0) {
                        Log.print(Log.l.trace, "showFlipView: SHOW images.length=" + that.images.length);
                        if (flipview.parentElement && flipview.parentElement.style) {
                            flipview.parentElement.style.display = "inline";
                        }
                        flipview.winControl.itemDataSource = that.images.dataSource;
                        // show flipview in list footer via animation on iOS due to iOS10 bug!
                        if (typeof device === "object" && device.platform === "iOS") {
                            WinJS.Promise.timeout(0).then(function () {
                                var footerContainer = listView.querySelector(".win-footercontainer");
                                if (footerContainer && footerContainer.style) {
                                    WinJS.UI.Animation.enterContent(footerContainer);
                                }
                            });
                        }
                    } else {
                        Log.print(Log.l.trace, "showFlipView: HIDE");
                        flipview.winControl.itemDataSource = null;
                        if (flipview.parentElement && flipview.parentElement.style) {
                            flipview.parentElement.style.display = "none";
                        }
                    }
                } else {
                    Log.print(Log.l.error, "NO flipview!");
                }
                Log.ret(Log.l.trace);
            }
            this.showFlipView = showFlipView;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                    Log.ret(Log.l.trace);
                },
                clickNew: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    Application.navigateById(Application.navigateNewId, event);
                    Log.ret(Log.l.trace);
                },
                clickPhoto: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    that.takePhoto();
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    var showconfirmbox = that.showConfirmBoxMandatory();
                    if (showconfirmbox) {
                        var confirmTitle = getResourceText("questionnaire.labelConfirmMandatoryField") + ":\n" +
                            that.actualquestion.FRAGESTELLUNG;
                        confirm(confirmTitle, function (result) {
                           if (result) {
                               Application.navigateById('sketch', event);
                           } else {
                               that.selectRecordId(that.actualquestion.ZeilenantwortVIEWID);
                           }
                        });   
                    } else {
                        Application.navigateById('sketch', event);
                    }
                    //Vielleicht hier showconfirmbox?
                    Log.ret(Log.l.trace);
                },
                clickRating: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    WinJS.Promise.timeout(0).then(function () {
                        var recordId = that.curRecId;
                        if (recordId) {
                            // handle setDirty
                        }
                    });
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickButton: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
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

                    /* if (event && event.target) {
                         var comboInputFocus = event.target.querySelector(".win-dropdown:focus");
                         if (comboInputFocus) {
                             event.preventDefault();
                         } else {
                             // set focus into textarea if current mouse cursor is inside of element position
                             var freitextInput = event.target.querySelector(".field-text-comment");
                             if (freitextInput) {
                                 console.log(freitextInput.value);
                             }

                         }


                    var freitextInput = event.target.querySelector(".field-text-comment");
                    if (freitextInput) {
                        console.log(freitextInput.value);
                    }
                    if (event.keyCode === WinJS.Utilities.Key.enter) {
                        var textareas = pageElement.getElementsByTagName("textarea");
                        if (textareas) {

                            if (document.activeElement) {
                                console.log(event.keyCode);

                                document.activeElement.value += "\n";
                                event.preventDefault();


                            } else {
                                Log.call(Log.l.trace, "Questionnaire.Controller.");
                                for (var j = 0; j < AppBar.commandList.length; j++) {
                                    if (AppBar.commandList[j].id === "clickForward")
                                        AppBar.commandList[j].key = WinJS.Utilities.Key.enter;
                                }

                            }


                        }

                        //}

                    }*/
                    var textareas = pageElement.getElementsByTagName("textarea");
                    if (textareas) {
                        for (var i = 0; i < textareas.length; i++) {
                            if (textareas[i] === document.activeElement) {
                                if (event.keyCode === WinJS.Utilities.Key.enter) {
                                    textareas[i].value += "\n";
                                }

                            }
                        }

                    }

                },
                activateEnterKey: function (event) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward")
                            AppBar.commandList[i].key = WinJS.Utilities.Key.enter;
                    }
                },
                deactivateEnterKey: function (event) {
                    for (var i = 0; i < AppBar.commandList.length; i++) {
                        if (AppBar.commandList[i].id === "clickForward")
                            AppBar.commandList[i].key = null;
                    }
                },
                onPointerDown: function (e) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    that.cursorPos = { x: e.pageX, y: e.pageY };
                    Log.ret(Log.l.trace);
                },
                onMouseDown: function (e) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    that.cursorPos = { x: e.pageX, y: e.pageY };
                    Log.ret(Log.l.trace);
                },
                onSelectionChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                                layout = Application.QuestionnaireLayout.QuestionsLayout;
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
                                    }
                                }
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onHeaderVisibilityChanged: function (eventInfo) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
                    if (eventInfo && eventInfo.detail) {
                        progress = listView.querySelector(".list-footer .progress");
                        counter = listView.querySelector(".list-footer .counter");
                        var visible = eventInfo.detail.visible;
                        if (visible) {
                            if (that.contacts && that.nextUrl) {
                                that.loading = true;
                                if (progress && progress.style) {
                                    progress.style.display = "inline";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "none";
                                }
                                AppData.setErrorMsg(that.binding);
                                Log.print(Log.l.trace, "calling select Questionnaire.questionnaireView...");
                                var nextUrl = that.nextUrl;
                                that.nextUrl = null;
                                Questionnaire.questionnaireView.selectNext(function (json) {
                                    // this callback will be called asynchronously
                                    // when the response is available
                                    Log.print(Log.l.trace, "Questionnaire.questionnaireView: success!");
                                    // startContact returns object already parsed from json file in response
                                    if (json && json.d) {
                                        that.nextUrl = Questionnaire.questionnaireView.getNextUrl(json);
                                        var results = json.d.results;
                                        results.forEach(function (item) {
                                            that.resultConverter(item);
                                            that.binding.count = that.questions.push(item);
                                        });
                                    } else {
                                        if (progress && progress.style) {
                                            progress.style.display = "none";
                                        }
                                        if (counter && counter.style) {
                                            counter.style.display = "inline";
                                        }
                                        that.loading = false;
                                        showFlipView();
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
                                    that.showFlipView();
                                }, null, nextUrl);
                            } else {
                                if (progress && progress.style) {
                                    progress.style.display = "none";
                                }
                                if (counter && counter.style) {
                                    counter.style.display = "inline";
                                }
                                that.loading = false;
                                that.showFlipView();
                            }
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                onItemInvoked: function (eventInfo) {
                    Log.call(Log.l.trace, "Questionnaire.Controller.");
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
                                        /* Log.call(Log.l.trace, "Questionnaire.Controller.");
                                         for (var i = 0; i < AppBar.commandList.length; i++) {
                                             if (AppBar.commandList[i].id === "clickForward")
                                                 AppBar.commandList[i].key = null;
                                         }*/
                                    } else {
                                        /* Log.call(Log.l.trace, "Questionnaire.Controller.");
                                         for (var j = 0; j < AppBar.commandList.length; j++) {
                                             if (AppBar.commandList[j].id === "clickForward")
                                                 AppBar.commandList[j].key = WinJS.Utilities.Key.enter;
                                         }*/
                                    }

                                }
                                if (freitextInput.value) {
                                    WinJS.Utilities.addClass(freitextInput, "field-text-comment-big");
                                } else {
                                    WinJS.Utilities.removeClass(freitextInput, "field-text-comment-big");
                                }
                            }
                        }
                    }
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
                    var contactId = AppData.getRecordId("Kontakt");
                    if (contactId) {
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
                                e.stopImmediatePropagation();
                                break;
                        }
                    }
                }.bind(this), true);
            }

            var loadPicture = function (pictureId) {
                Log.call(Log.l.trace, "Questionnaire.Controller.", "pictureId=" + pictureId);
                var ret = null;
                if (!pictureId) {
                    Log.ret(Log.l.error, "NULL param!");
                    return WinJS.Promise.as();
                }
                if (that.images && that.images.length > 0) {
                    for (var i = 0; i < that.images.length; i++) {
                        var imageItem = that.images[i];
                        if (imageItem && imageItem.DOC1ZeilenantwortID === pictureId) {
                            if (flipview && flipview.winControl) {
                                if (that.images && that.images.length > 0) {
                                    flipview.winControl.itemDataSource = that.images.dataSource;
                                }
                            }
                            that.showFlipView();
                            ret = WinJS.Promise.as();
                            break;
                        }
                    }
                }
                if (!ret) {
                    ret = Questionnaire.questionnaireDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "questionnaireDocView: success!");
                        if (json.d) {
                            if (!that.images) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                that.images = new WinJS.Binding.List([]);
                            }
                            var docContent;
                            if (json.d.wFormat === 1) {
                                docContent = json.d.PrevContentDOCCNT2;
                            } else {
                                docContent = json.d.DocContentDOCCNT1;
                            }
                            if (docContent) {
                                var sub = docContent.search("\r\n\r\n");
                                var title = (that.images.length + 1).toString() + " / " + that.docCount;
                                var picture = "data:image/jpeg;base64," + docContent.substr(sub + 4);
                                that.images.push({
                                    type: "item",
                                    DOC1ZeilenantwortID: json.d.DOC1ZeilenantwortVIEWID,
                                    title: title,
                                    picture: picture
                                });
                            }
                        }
                        that.showFlipView();
                    }, function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    }, pictureId);
                }
                Log.ret(Log.l.trace);
                return ret;
            }
            that.loadPicture = loadPicture;

            var loadData = function () {
                Log.call(Log.l.trace, "Questionnaire.Controller.");
                AppData.setErrorMsg(that.binding);
                if (that.questions) {
                    that.questions.length = 0;
                }
                that.docIds = [];
                if (that.images) {
                    that.images.length = 0;
                }
                that.docCount = 0;
                var contactId = AppData.getRecordId("Kontakt");
                var ret = new WinJS.Promise.as().then(function () {
                    if (!contactId) {
                        var newContact = {
                            HostName: (window.device && window.device.uuid),
                            MitarbeiterID: AppData.getRecordId("Mitarbeiter"),
                            VeranstaltungID: AppData.getRecordId("Veranstaltung"),
                            Nachbearbeitet: 1
                        };
                        Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                        AppData.setErrorMsg(that.binding);
                        return Questionnaire.contactView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "contactView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                contactId = json.d.KontaktVIEWID;
                                AppData.setRecordId("Kontakt", contactId);
                                AppData.getUserData();
                            } else {
                                AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, newContact);
                    } else {
                        Log.print(Log.l.trace, "use existing contactID=" + contactId);
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (!contactId) {
                        AppData.setErrorMsg(that.binding, { status: 404, statusText: "no data found" });
                        return WinJS.Promise.as();
                    } else {
                        return Questionnaire.questionnaireView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "Questionnaire.questionnaireView: success!");
                            // startContact returns object already parsed from json file in response
                            if (json && json.d) {
                                that.nextUrl = Questionnaire.questionnaireView.getNextUrl(json);
                                var results = json.d.results;
                                if (!that.questions) {
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                    });
                                    // Now, we call WinJS.Binding.List to get the bindable list
                                    that.questions = new WinJS.Binding.List(results);
                                    that.binding.count = that.questions.length;
                                } else {
                                    results.forEach(function (item, index) {
                                        that.resultConverter(item, index);
                                        that.binding.count = that.questions.push(item);
                                    });
                                }
                                if (listView && listView.winControl) {
                                    var getTextareaForFocus = function (element) {
                                        var focusElement = null;
                                        if (element) {
                                            var freitextInputs = element.querySelectorAll(".win-textarea, .win-textbox");
                                            if (freitextInputs) for (var i = 0; i < freitextInputs.length; i++) {
                                                var freitextInput = freitextInputs[i];
                                                if (freitextInput) {
                                                    var position = WinJS.Utilities.getPosition(freitextInput);
                                                    if (position) {
                                                        var left = position.left;
                                                        var top = position.top;
                                                        var width = position.width;
                                                        var height = position.height;
                                                        if (that.cursorPos.x >= left && that.cursorPos.x <= left + width &&
                                                            that.cursorPos.y >= top && that.cursorPos.y <= top + height + 2) {
                                                            focusElement = freitextInput;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        Log.ret(Log.l.trace);
                                        return focusElement;
                                    }
                                    var trySetActive = function (element, scroller) {
                                        var success = true;
                                        // don't call setActive() if a dropdown control has focus!
                                        var comboInputFocus = element.querySelector(".win-dropdown:focus");
                                        if (!comboInputFocus) {
                                            try {
                                                var focusElement;
                                                if (typeof element.setActive === "function") {
                                                    focusElement = getTextareaForFocus(element);
                                                    element.setActive();
                                                    if (focusElement && focusElement !== element) {
                                                        focusElement.focus();
                                                    }
                                                } else {
                                                    // check for existence of WinRT
                                                    var resources = Resources.get();
                                                    if (resources) {
                                                        focusElement = getTextareaForFocus(element);
                                                        if (focusElement && focusElement !== element) {
                                                            WinJS.Promise.timeout(0).then(function () {
                                                                focusElement.focus();
                                                            });
                                                        }
                                                    }
                                                }
                                            } catch (e) {
                                                // setActive() raises an exception when trying to focus an invisible item. Checking visibility is non-trivial, so it's best
                                                // just to catch the exception and ignore it. focus() on the other hand, does not raise exceptions.
                                                success = false;
                                            }
                                        }
                                        return success;
                                    };
                                    // overwrite _setFocusOnItem for this ListView to supress automatic
                                    // scroll-into-view when calling item.focus() in base.js implementation
                                    // by prevent the call of _ElementUtilities._setActive(item);
                                    listView.winControl._setFocusOnItem = function ListView_setFocusOnItem(entity) {
                                        this._writeProfilerMark("_setFocusOnItem,info");
                                        if (this._focusRequest) {
                                            this._focusRequest.cancel();
                                        }
                                        if (this._isZombie()) {
                                            return;
                                        }
                                        var winControl = this;
                                        var setFocusOnItemImpl = function (item) {
                                            if (winControl._isZombie()) {
                                                return;
                                            }

                                            if (winControl._tabManager.childFocus !== item) {
                                                winControl._tabManager.childFocus = item;
                                            }
                                            winControl._focusRequest = null;
                                            if (winControl._hasKeyboardFocus && !winControl._itemFocused) {
                                                if (winControl._selection._keyboardFocused()) {
                                                    winControl._drawFocusRectangle(item);
                                                }
                                                // The requestItem promise just completed so _cachedCount will
                                                // be initialized.
                                                if (entity.type === WinJS.UI.ObjectType.groupHeader ||
                                                    entity.type === WinJS.UI.ObjectType.item) {
                                                    winControl._view
                                                        .updateAriaForAnnouncement(item,
                                                        (
                                                            entity.type === WinJS.UI.ObjectType.groupHeader
                                                                ? winControl._groups.length()
                                                                : winControl._cachedCount));
                                                }

                                                // Some consumers of ListView listen for item invoked events and hide the listview when an item is clicked.
                                                // Since keyboard interactions rely on async operations, sometimes an invoke event can be received before we get
                                                // to WinJS.Utilities._setActive(item), and the listview will be made invisible. If that happens and we call item.setActive(), an exception
                                                // is raised for trying to focus on an invisible item. Checking visibility is non-trivial, so it's best
                                                // just to catch the exception and ignore it.
                                                winControl._itemFocused = true;
                                                trySetActive(item);
                                            }
                                        };

                                        if (entity.type === WinJS.UI.ObjectType.item) {
                                            this._focusRequest = this._view.items.requestItem(entity.index);
                                        } else if (entity.type === WinJS.UI.ObjectType.groupHeader) {
                                            this._focusRequest = this._groups.requestHeader(entity.index);
                                        } else {
                                            this._focusRequest = WinJS.Promise.wrap(entity.type === WinJS.UI.ObjectType.header ? this._header : this._footer);
                                        }
                                        this._focusRequest.then(setFocusOnItemImpl);
                                    };


                                    listView.winControl._supressScrollIntoView = true;
                                    // add ListView itemTemplate
                                    listView.winControl.itemTemplate = that.listQuestionnaireRenderer.bind(that);
                                    // add ListView dataSource
                                    listView.winControl.itemDataSource = that.questions.dataSource;
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        }, {
                            KontaktID: contactId
                        });
                    }
                }).then(function () {
                    ret = Questionnaire.CR_VERANSTOPTION_ODataView.select(function (json) {
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
                    });
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
                            }
                        }
                    }
                }
            }
        })
    });
})();

