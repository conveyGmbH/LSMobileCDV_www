// controller for page: imgSketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/lib/hammer/scripts/hammer.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/wavSketch/wavSketchService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("WavSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options, commandList) {
            Log.call(Log.l.trace, "WavSketch.Controller.", "noteId=" + (options && options.noteId));

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: 0,
                isLocal: options.isLocal,
                dataSketch: {}
            }, commandList]);
            this.img = null;

            var that = this;

            var getDocData = function () {
                return that.binding.dataSketch && that.binding.dataSketch.audioData;
            }
            var hasDoc = function () {
                return (getDocData() && typeof getDocData() === "string");
            }
            this.hasDoc = hasDoc;

            this.dispose = function () {
                if (that.img) {
                    that.removeAudio();
                    that.img.src = "";
                    that.img = null;
                }
            }

            var resultConverter = function (item, index) {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (item) {
                    if (item.DocContentDOCCNT1 && item.DocGroup === AppData.DocGroup.Audio) {
                        item.type = AppData.getDocType(item.DocFormat);
                        if (item.type) {
                            var sub = item.DocContentDOCCNT1.search("\r\n\r\n");
                            item.audioData = "data:" + item.type + ";base64," + item.DocContentDOCCNT1.substr(sub + 4);
                        }
                    } else {
                        item.audioData = "";
                    }
                    item.DocContentDOCCNT1 = "";
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var removeAudio = function () {
                if (fragmentElement) {
                    var photoItemBox = fragmentElement.querySelector("#noteAudio .win-itembox");
                    if (photoItemBox) {
                        var oldElement = photoItemBox.firstElementChild || photoItemBox.firstChild;
                        if (oldElement) {
                            oldElement.parentNode.removeChild(oldElement);
                            oldElement.innerHTML = "";
                        }
                    }
                }
            }
            this.removeAudio = removeAudio;

            var insertAudiodata = function (audioData) {
                var ovwEdge = 256;
                var err = null;
                Log.call(Log.l.trace, "WavSketch.Controller.");
                AppData.setErrorMsg(that.binding);
                var dataSketch = that.binding.dataSketch;

                var ret = new WinJS.Promise.as().then(function () {
                    dataSketch.KontaktID = AppData.getRecordId("Kontakt");
                    if (!dataSketch.KontaktID) {
                        err = {
                            status: -1,
                            statusText: "missing recordId for table Kontakt"
                        }
                        AppData.setErrorMsg(that.binding, err);
                        return WinJS.Promise.as();
                    } else {
                        // JPEG note
                        dataSketch.ExecAppTypeID = 16;
                        dataSketch.DocGroup = 5;
                        dataSketch.DocFormat = 67;
                        dataSketch.DocExt = "mp3";

                        // UTC-Zeit in Klartext
                        var now = new Date();
                        var dateStringUtc = now.toUTCString();

                        // decodierte Dateigröße
                        var contentLength = Math.floor(imageData.length * 3 / 4);

                        dataSketch.Quelltext = "Content-Type: audio/jpegAccept-Ranges: bytes\x0D\x0ALast-Modified: " +
                            dateStringUtc +
                            "\x0D\x0AContent-Length: " +
                            contentLength +
                            "\x0D\x0A\x0D\x0A" +
                            audioData;

                        return WavSketch.sketchView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "sketchData insert: success!");
                            // select returns object already parsed from json file in response
                            if (json && json.d) {
                                that.resultConverter(json.d);
                                that.binding.dataSketch = json.d;
                                that.binding.noteId = json.d.KontaktNotizVIEWID;
                                WinJS.Promise.timeout(0).then(function () {
                                    playAudio();
                                }).then(function () {
                                    // reload list
                                    if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                        AppBar.scope.loadList(that.binding.noteId);
                                    }
                                });
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        },
                        dataSketch,
                        that.binding.isLocal);
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            };
            this.insertAudiodata = insertAudiodata;

            var onCaptureSuccess = function (result) {
                var audioData = null;
                Log.call(Log.l.trace, "WavSketch.Controller.");

                // todo: create audioData
                that.insertAudiodata(audioData);
                Log.ret(Log.l.trace);
            };

            var onCaptureFail = function (errorMessage) {
                Log.call(Log.l.error, "WavSketch.Controller.");
                //message: The message is provided by the device's native code
                AppData.setErrorMsg(that.binding, JSON.stringify(errorMessage));
                AppBar.busy = false;
                Log.ret(Log.l.error);
            };

            //start native Camera async
            AppData.setErrorMsg(that.binding);
            var captureAudio = function () {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (navigator.device &&
                    navigator.device.capture && 
                    typeof navigator.device.capture.captureAudio === "function") {
                    Log.print(Log.l.trace, "calling capture.captureAudio...");
                    AppBar.busy = true;
                    navigator.device.capture.captureAudio(onCaptureSuccess, onCaptureFail, {
                        limit: 1, duration: 10
                    });
                } else {
                    Log.print(Log.l.error, "capture.captureAudio not supported...");
                    AppData.setErrorMsg(that.binding, { errorMessage: "Audio capture plugin not supported" });
                }
                Log.ret(Log.l.trace);
            }
            this.captureAudio = captureAudio;

            var loadData = function (noteId) {
                var ret;
                Log.call(Log.l.trace, "WavSketch.Controller.", "noteId=" + noteId);
                if (noteId) {
                    AppData.setErrorMsg(that.binding);
                    ret = WavSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "WavSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.noteId = json.d.KontaktNotizVIEWID;
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            if (hasDoc()) {
                                Log.print(Log.l.trace,
                                    "WAV Element: " +
                                    getDocData().substr(0, 100) +
                                    "...");
                            }
                            playAudio();
                        }
                    },
                    function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    noteId,
                    that.binding.isLocal);
                } else {
                    if (that.binding.isLocal) {
                    // capture audio first - but only if isLocal!
                        that.captureAudio();
                    }
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var removeDoc = function () {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                that.binding.dataSketch = {};
                that.removeAudio();
                Log.ret(Log.l.trace);
            }
            this.removeDoc = removeDoc;

            var saveData = function (complete, error) {
                //wav can't be changed
                Log.call(Log.l.trace, "WavSketch.Controller.");
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
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (options && options.isLocal) {
                    var confirmTitle = getResourceText("sketch.questionDelete");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            WinJS.Promise.as().then(function () {
                                return WavSketch.sketchView.deleteRecord(function (response) {
                                    // called asynchronously if ok
                                    Log.print(Log.l.trace, "WavSketchData delete: success!");
                                    //reload sketchlist
                                    if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                        AppBar.scope.loadList(null);
                                    }
                                },  function (errorResponse) {
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
                            });
                        } else {
                            Log.print(Log.l.trace, "deleteData: user choice CANCEL");
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.deleteData = deleteData;

            // define handlers
            this.eventHandlers = {
            };

            this.disableHandlers = {
            }

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData(options && options.noteId);
            }).then(function () {
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



