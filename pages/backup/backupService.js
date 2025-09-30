// service for page: about
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Backup", {
        backupList: {
            select: function (complete, error) {
                var err = null;
                var dataDirectory = AppData.getDataDirectory();
                var dbFileName = AppData.getDbFileName();
                return new WinJS.Promise(function(c, e) {
                    window.resolveLocalFileSystemURL(dataDirectory, function (directoryEntry) {
                        if (directoryEntry && directoryEntry.isDirectory) {
                            const directoryReader = directoryEntry.createReader();
                            if (directoryReader) {
                                directoryReader.readEntries(function (entries) {
                                    if (entries) {
                                        var results = [];
                                        entries.forEach(function (entry) {
                                            if (entry.isFile) {
                                                Log.print(Log.l.info, "File: " + entry.name);
                                                var fileNameDb = null;
                                                var fileNamePs = null;
                                                if (entry.name.indexOf(dbFileName) >= 0) {
                                                    fileNameDb = entry.name;
                                                } else if (entry.name.indexOf(Application.pageframe.filenamePSEncoded) >= 0 ||
                                                    entry.name.indexOf(Application.pageframe.filenamePersistentStates) >= 0) {
                                                    fileNamePs = entry.name;
                                                }
                                                if (fileNamePs || fileNameDb) {
                                                    var title;
                                                    var isArchived;
                                                    if (entry.name.substr(0, 7) === "Backup_") {
                                                        var timeMs = parseInt(entry.name.substr(7));
                                                        var date = new Date(timeMs);
                                                        var m = moment(date);
                                                        m.locale(Application.language);
                                                        title = "Archived " + m.format("YYYY-MM-DD HH:mm");
                                                        isArchived = true;
                                                    } else {
                                                        title = "Current Database";
                                                        isArchived = false;
                                                    }
                                                    var i = results.findIndex(function (item) {
                                                        return (item.title === title);
                                                    });
                                                    if (i < 0) {
                                                        i = results.push({
                                                            "title": title,
                                                            "isArchived": isArchived
                                                        }) - 1;
                                                    }
                                                    results[i].index = i;
                                                    if (fileNameDb) {
                                                        results[i].fileNameDb = fileNameDb;
                                                    } else if (fileNamePs) {
                                                        results[i].fileNamePs = fileNamePs;
                                                    }
                                                }
                                            } else if (entry.isDirectory) {
                                                Log.print(Log.l.info, "Directory: " + entry.name);
                                            }
                                        });
                                        var json = {
                                            d: {
                                                results: results
                                            }
                                        }
                                        if (typeof complete === "function") {
                                            complete(json);
                                        }
                                        c();
                                    } else {
                                        err = { status: 0, statusText: "readEntries failed" };
                                        Log.print(Log.l.error, err.statusText);
                                        if (typeof error === "function") {
                                            error(err);
                                        }
                                        e(err);
                                    }
                                }, function (err) {
                                    Log.print(Log.l.error, "Error reading directory entries: ", err);
                                    if (typeof error === "function") {
                                        error(err);
                                    }
                                    e(err);
                                });
                            } else {
                                err = { status: 0, statusText: "create directoryReader failed" };
                                Log.print(Log.l.error, err.statusText);
                                if (typeof error === "function") {
                                    error(err);
                                }
                                e(err);
                            }
                        } else {
                            err = { status: 0, statusText: "Provided URL is not a directory" };
                            Log.print(Log.l.error, err.statusText);
                            if (typeof error === "function") {
                                error(err);
                            }
                            e(err);
                        }
                    }, function (err) {
                        Log.print(Log.l.error, "Error resolving file system URL: ", err);
                        if (typeof error === "function") {
                            error(err);
                        }
                        e(err);
                    });
                });
            }
        }
    });
})();


