// controller for page: wavSketch
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

    var b64 = window.base64js;

    WinJS.Namespace.define("WavSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options, commandList) {
            Log.call(Log.l.trace, "WavSketch.Controller.", "noteId=" + (options && options.noteId));

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: null,
                isLocal: options.isLocal,
                dataSketch: {
                    audioData: ""
                }
            }, commandList]);

            var that = this;

            var getDocData = function () {
                if (that.binding && that.binding.dataSketch && that.binding.dataSketch.audioData) {
                    return that.binding.dataSketch.audioData;
                }
                return "";
            }
            var getDocType = function () {
                if (that.binding && that.binding.dataSketch && that.binding.dataSketch.type) {
                    return that.binding.dataSketch.type;
                }
                return "";
            }
            var hasDoc = function () {
                return (getDocData() && typeof getDocData() === "string");
            }
            this.hasDoc = hasDoc;

            this.dispose = function () {
                that.removeDoc();
            }

            var resultConverter = function (item, index) {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (item) {
                    if (item.DocContentDOCCNT1 && item.DocGroup === AppData.DocGroup.Audio) {
                        Log.print(Log.l.trace, "DocFormat=" + item.DocFormat);
                        item.type = AppData.getDocType(item.DocFormat);
                        if (!item.type) {
                            Log.print(Log.l.trace, "search in DOCContent...");
                            var typeTag = "Content-Type: ";
                            var typeStr = item.DocContentDOCCNT1.search(typeTag).substr(typeTag.length);
                            var endPos = typeStr.indexOf("Accept-Ranges:");
                            if (endPos > 0) {
                                typeStr = typeStr.substr(0, endPos);
                            }
                            item.type = typeStr.replace("\r\n", "");
                        }
                        Log.print(Log.l.trace, "content type==" + item.type);
                        if (item.type) {
                            var sub = item.DocContentDOCCNT1.search("\r\n\r\n");
                            item.audioData = "data:" + item.type + ";base64," + item.DocContentDOCCNT1.substr(sub + 4);
                        } else {
                            item.audioData = "";
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
                if (that.binding) {
                    that.binding.dataSketch = {
                        audioData: ""
                    };
                }
                if (fragmentElement) {
                    var docContainer = fragmentElement.querySelector(".doc-container");
                    if (docContainer) {
                        var audio = docContainer.querySelector("#noteAudio");
                        if (audio) {
                            audio.src = "";
                        }
                        if (docContainer.style) {
                            docContainer.style.display = "none";
                        }
                    }
                }
            }
            this.removeAudio = removeAudio;

            var insertAudiodata = function (audioData, fileExt) {
                var ovwEdge = 256;
                var err = null;
                Log.call(Log.l.trace, "WavSketch.Controller.", "fileExt=" + fileExt);
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
                        // audio note
                        dataSketch.ExecAppTypeID = 16;
                        dataSketch.DocGroup = AppData.DocGroup.Audio;
                        dataSketch.DocFormat = AppData.getDocFormatFromExt(fileExt);
                        dataSketch.DocExt = fileExt;

                        // UTC-Zeit in Klartext
                        var now = new Date();
                        var dateStringUtc = now.toUTCString();

                        // decodierte Dateigröße
                        var contentLength = Math.floor(audioData.length * 3 / 4);

                        var type;
                        if (fileExt === "mp3") {
                            type = "mpeg";
                        } else {
                            type = fileExt;
                        }

                        dataSketch.Quelltext = "Content-Type: audio/" + type + "Accept-Ranges: bytes\x0D\x0ALast-Modified: " +
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
                                    that.bindAudio();
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


            var loadDataFile = function (dataDirectory, fileName, bUseRootDir) {
                var fileExt;
                var filePath;
                Log.call(Log.l.trace, "WavSketch.Controller.", "dataDirectory=" + dataDirectory + " fileName=" + fileName + " bUseRootDir=" + bUseRootDir);
                var readFileFromDirEntry = function (dirEntry) {
                    if (dirEntry) {
                        Log.print(Log.l.info, "resolveLocalFileSystemURL: dirEntry open!");
                        dirEntry.getFile(filePath, {
                            create: false,
                            exclusive: false
                        },
                        function(fileEntry) {
                            if (fileEntry) {
                                Log.print(Log.l.info, "resolveLocalFileSystemURL: fileEntry open!");
                                var deleteFile = function() {
                                    fileEntry.remove(function() {
                                        Log.print(Log.l.info, "file deleted!");
                                    },
                                    function(errorResponse) {
                                        Log.print(Log.l.error, "file delete: Failed remove file " + filePath + " error: " + JSON.stringify(errorResponse));
                                    },
                                    function() {
                                        Log.print(Log.l.trace, "file delete: extra ignored!");
                                    });
                                }
                                fileEntry.file(function(file) {
                                        var reader = new FileReader();
                                        reader.onerror = function(errorResponse) {
                                            Log.print(Log.l.error,
                                                "Failed read file " +
                                                filePath +
                                                " error: " +
                                                JSON.stringify(errorResponse));
                                            AppData.setErrorMsg(that.binding, errorResponse);
                                            deleteFile();
                                            AppBar.busy = false;
                                        };
                                        reader.onloadend = function() {
                                            var data = new Uint8Array(this.result);
                                            Log.print(Log.l.info,
                                                "Successful file read! fileExt=" +
                                                fileExt +
                                                " data-length=" +
                                                data.length);
                                            switch (fileExt) {
                                            case "amr":
                                                try {
                                                    var buffer = AMR.toWAV(data);
                                                    Log.print(Log.l.info, "AMR.toWAV: data-length=" + buffer.length);
                                                    data = buffer;
                                                    fileExt = "wav";
                                                } catch (exception) {
                                                    Log.print(Log.l.error,
                                                        "ARM exception " + (exception && exception.message));
                                                }
                                                break;
                                            }
                                            var encoded = b64.fromByteArray(data);
                                            if (encoded && encoded.length > 0) {
                                                that.insertAudiodata(encoded, fileExt);
                                            } else {
                                                var err = "file read error NO data!";
                                                Log.print(Log.l.error, err);
                                                AppData.setErrorMsg(that.binding, err);
                                            }
                                            deleteFile();
                                            AppBar.busy = false;
                                        };
                                        reader.readAsArrayBuffer(file);
                                    },
                                    function(errorResponse) {
                                        Log.print(Log.l.error, "file read error: " + JSON.stringify(errorResponse));
                                        AppData.setErrorMsg(that.binding, errorResponse);
                                        deleteFile();
                                        AppBar.busy = false;
                                    });
                            } else {
                                var err = "file read error NO fileEntry!";
                                Log.print(Log.l.error, err);
                                AppData.setErrorMsg(that.binding, err);
                                AppBar.busy = false;
                            }
                        },
                        function(errorResponse) {
                            Log.print(Log.l.error,
                                "getFile(" + filePath + ") error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        var err = "file read error NO dirEntry!";
                        Log.print(Log.l.error, err);
                        AppData.setErrorMsg(that.binding, err);
                        AppBar.busy = false;
                    }
                }
                
                var fileExtPos = fileName.lastIndexOf(".");
                if (fileExtPos >= 0) {
                    fileExt = fileName.substr(fileExtPos + 1);
                }
                if (bUseRootDir) {
                    filePath = decodeURI(dataDirectory + "/" + fileName);
                    if (typeof window.requestFileSystem === "function") {
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
                            readFileFromDirEntry(fs.root);
                        }, function(errorResponse) {
                            Log.print(Log.l.error, "requestFileSystem error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        Log.print(Log.l.error, "requestFileSystem is undefined");
                        AppBar.busy = false;
                    }
                } else {
                    filePath = fileName;
                    if (typeof window.resolveLocalFileSystemURL === "function") {
                        window.resolveLocalFileSystemURL(dataDirectory, readFileFromDirEntry, function(errorResponse) {
                            Log.print(Log.l.error, "resolveLocalFileSystemURL error: " + JSON.stringify(errorResponse));
                            AppData.setErrorMsg(that.binding, errorResponse);
                            AppBar.busy = false;
                        });
                    } else {
                        Log.print(Log.l.error, "resolveLocalFileSystemURL is undefined");
                        AppBar.busy = false;
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.loadDataFile = loadDataFile;

            var bindAudio = function () {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (fragmentElement) {
                    var docContainer = fragmentElement.querySelector(".doc-container");
                    if (docContainer) {
                        var audio = docContainer.querySelector("#noteAudio");
                        if (audio && hasDoc()) {
                            try {
                                if (docContainer.style) {
                                    docContainer.style.display = "";
                                }
                                audio.src = getDocData();
                                if (typeof audio.load === "function") {
                                    audio.load();
                                }
                                if (typeof audio.play === "function") {
                                    audio.play();
                                }
                            } catch (e) {
                                Log.print(Log.L.error, "audio returned error:" + e);
                            }
                        } else {
                            that.removeAudio();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.bindAudio = bindAudio;

            var onCaptureSuccess = function (mediaFiles) {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                var audioRecorderContainer = fragmentElement.querySelector(".audio-recorder-container");
                if (audioRecorderContainer && audioRecorderContainer.style) {
                    audioRecorderContainer.style.display = "";
                }
                if (mediaFiles) {
                    var i, len;
                    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                        var bUseRootDir = false;
                        var rootDirectory = cordova.file.externalRootDirectory;;
                        var dataDirectory = "";
                        var fullPath = mediaFiles[i].fullPath;
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
                        // do something interesting with the file
                        that.loadDataFile(dataDirectory, fileName, bUseRootDir);
                    }
                } else {
                    AppBar.busy = false;
                }
                Log.ret(Log.l.trace);
            };

            var onCaptureFail = function (errorMessage) {
                Log.call(Log.l.error, "WavSketch.Controller.");
                var audioRecorderContainer = fragmentElement.querySelector(".audio-recorder-container");
                if (audioRecorderContainer && audioRecorderContainer.style) {
                    audioRecorderContainer.style.display = "";
                }
                var err = JSON.stringify(errorMessage);
                //message: The message is provided by the device's native code
                Log.print(Log.l.error, "errorMessage=" + err);
                AppData.setErrorMsg(that.binding, err);
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
            var captureAudio = function () {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                if (navigator.device &&
                    navigator.device.capture &&
                    typeof navigator.device.capture.captureAudio === "function") {
                    var audioRecorderContainer = fragmentElement.querySelector(".audio-recorder-container");
                    if (audioRecorderContainer && audioRecorderContainer.style) {
                        audioRecorderContainer.style.display = "inline-block";
                    }
                    Log.print(Log.l.trace, "calling capture.captureAudio...");
                    AppBar.busy = true;
                    var audioOptions = {
                        limit: 1, duration: 30, element: audioRecorderContainer
                    }
                    navigator.device.capture.captureAudio(function (mediaFiles) {
                        WinJS.Promise.timeout(0).then(function () {
                            onCaptureSuccess(mediaFiles);
                        });
                    }, function (errorMessage) {
                        WinJS.Promise.timeout(0).then(function () {
                            onCaptureFail(errorMessage);
                        });
                    }, audioOptions);
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
                        }
                        that.bindAudio();
                    },
                    function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                        that.removeAudio();
                    },
                    noteId,
                    that.binding.isLocal);
                } else {
                    if (that.binding.isLocal) {
                        that.removeAudio();
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

            var deleteData = function () {
                Log.call(Log.l.trace, "WavSketch.Controller.");
                var ret = WinJS.Promise.as().then(function () {
                    if (options && options.isLocal) {
                        return WavSketch.sketchView.deleteRecord(function (response) {
                            // called asynchronously if ok
                            Log.print(Log.l.trace, "WavSketchData delete: success!");
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



