﻿// Replication Service
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />
/// <reference path="../../../lib/convey/scripts/strings.js" />
/// <reference path="../../../lib/convey/scripts/sqlite.js" />
/// <reference path="../../../lib/convey/scripts/appSettings.js" />
/// <reference path="../../../lib/convey/scripts/dataService.js" />

(function() {
    "use strict";

    var replInterval = 30; 
    var replIntervalFastReqs = 0.25;
    var replIntervalFastMaxFactor = 10;
    function getFastReqInterval(numFastReqs) {
        var max = AppData._persistentStates.odata.numFastReqs * (3.25 - Math.random() / 2) / 4;
        var n = max - numFastReqs;
        var ret = (n * n) / (max * max) * replIntervalFastMaxFactor * (AppData._persistentStates.odata.replIntervalFastReqs || replIntervalFastReqs);
        return ret;
    }

    WinJS.Namespace.define("AppRepl", {
        // replUploadData:
        //      general service for replication data upload
        //
        // Methods:
        //
        // select
        //      purpose: 
        //          selects one or more records from format view
        //
        //      params:
        //          complete: function(response) - success handler
        //          error: function(response) - error handler
        //          relationName: string - relation/view name
        //          formatId: integer - Appbuilder config format id
        //          
        //      optional params
        //          recordId: integer - currently selected record (primary key) 
        //
        // update
        //      purpose: 
        //          updates all columns in given record
        //
        //      params:
        //          complete: function(response) - success handler
        //          error: function(response) - error handler
        //          relationName: string - relation/view name
        //          formatId: integer - Appbuilder config format id
        //          recordId: integer - record to update (primary key) 
        //          viewRecord: object - current record, contains all columns of format view
        //
        //      remark:
        //          uses $resource to set HTTP verb GET|PUT
        //          this will return JSON data in response
        //
        //          for each table of <relationName>VIEW_<formatId> format view 
        //          a 1:1 synonym view named <relationName>_ODataVIEW is needed
        //          to ensure access to foreign key values as integer columns
        //
        replUploadData: WinJS.Class.define(function replUploadData(relationName) {
            Log.call(Log.l.trace, "AppRepl.replUploadData.", "relationName=" + relationName);
            this._relationName = relationName;
            Log.ret(Log.l.trace);
        }, {
            _relationName: null,
            _attribSpecs: null,
            _errorResponse: null,
            errorResponse: {
                get: function() {
                    return this._errorResponse;
                }
            },
            relationName: {
                get: function () {
                    return this._relationName;
                }
            },
            attribSpecs: {
                get: function () {
                    return this._attribSpecs;
                }
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "AppData.replUploadData.");
                var url = null;
                if (response && response.d && response.d.__next) {
                    var pos = response.d.__next.indexOf("://");
                    if (pos > 0) {
                        var pos2 = response.d.__next.substr(pos + 3).indexOf("/");
                        if (pos2 > 0) {
                            var pos3 = response.d.__next.substr(pos + 3 + pos2 + 1).indexOf("/");
                            if (pos3 > 0) {
                                url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath +
                                    response.d.__next.substr(pos + 3 + pos2 + 1 + pos3);
                            }
                        }
                    }
                    Log.ret(Log.l.trace, "next=" + url);
                } else {
                    Log.ret(Log.l.trace, "finished");
                }
                return url;
            },
            fetchNextAttribSpecs: function (that, results, next, followFunction, complete, error, param1, param2) {
                Log.call(Log.l.trace, "AppRepl.replUploadData.", "next=" + next);
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: next,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + next);
                var ret = WinJS.xhr(options).then(function (response) {
                    Log.print(Log.l.info, "AttribSpecExtView next: success!");
                    try {
                        var obj = jsonParse(response.responseText);
                        if (obj && obj.d) {
                            results = results.concat(obj.d.results);
                            var next = that.getNextUrl(obj);
                            if (next) {
                                return that.fetchNextAttribSpecs(that, results, next, followFunction, complete, error, param1, param2);
                            } else {
                                that._attribSpecs = results;
                                followFunction(that, complete, error, param1, param2);
                            }
                        } else {
                            var err = { status: 404, statusText: "no data found" };
                            error(err);
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        error({ status: 500, statusText: "data parse error " + (exception && exception.message) });
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                    error(errorResponse);
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            fetchAllAttribSpecs: function (that, obj, followFunction, complete, error, param1, param2) {
                Log.call(Log.l.trace, "AppRepl.replUploadData.", "");
                var retNext;
                var next = that.getNextUrl(obj);
                if (next) {
                    retNext = that.fetchNextAttribSpecs(that, obj.d.results, next, followFunction, complete, error, param1, param2);
                } else {
                    if (obj && obj.d) {
                        that._attribSpecs = obj.d.results;
                    }
                    followFunction(that, complete, error, param1, param2);
                    retNext = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return retNext;
            },
            getAttribSpecs: function (that, followFunction, complete, error, param1, param2) {
                Log.call(Log.l.trace, "AppRepl.replUploadData.", "relationName=" + that.relationName);
                var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                url += "/AttribSpecExtView?$filter=(RelationName%20eq%20'OIMP" + that.relationName + "VIEW')&$format=json&$orderby=AttributeIDX";
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: url,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                that._errorResponse = null;
                Log.print(Log.l.info, "calling xhr method=GET url=" + url);
                var ret = WinJS.xhr(options).then(function (responseAttribSpec) {
                    Log.print(Log.l.info, "AttribSpecExtView: success!");
                    try {
                        var json = jsonParse(responseAttribSpec.responseText);
                        return that.fetchAllAttribSpecs(that, json, followFunction, complete, error, param1, param2);
                        //if (json && json.d) {
                        //    that._attribSpecs = json.d.results;
                        //}
                        //return followFunction(that, complete, error, param);
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        that._errorResponse = { status: 500, statusText: "AttribSpecExtView parse error " + (exception && exception.message) };
                        error(that._errorResponse);
                        return WinJS.Promise.as();
                    }
                }, function (errorResponse) {
                    Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                    that._errorResponse = errorResponse;
                    error(that._errorResponse);
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            viewRecordFromTableRecord: function (that, tableRecord) {
                var viewRecord = {};
                if (tableRecord && that.attribSpecs && that.attribSpecs.length > 0) {
                    for (var i = 0; i < that.attribSpecs.length; i++) {
                        var baseAttributeName = that.attribSpecs[i].BaseAttributeName;
                        if (baseAttributeName && typeof tableRecord[baseAttributeName] !== "undefined") {
                            var viewAttributeName = that.attribSpecs[i].ODataAttributeName;
                            Log.print(Log.l.trace, viewAttributeName + ": " + tableRecord[baseAttributeName]);
                            viewRecord[viewAttributeName] = tableRecord[baseAttributeName];
                        }
                    }
                }
                return viewRecord;
            },
            extractTableRecord: function (that, complete, error, rinfRecord, viewRecord) {
                var ret;
                Log.call(Log.l.trace, "AppRepl.replUploadData.", "relationName=" + that.relationName);
                if (!that.attribSpecs || !that.attribSpecs.length) {
                    ret = that.getAttribSpecs(that, that.extractTableRecord, complete, error, rinfRecord, viewRecord);
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        var tableRecord = {};
                        if (viewRecord && rinfRecord && that.attribSpecs && that.attribSpecs.length > 0) {
                            for (var i = 0; i < that.attribSpecs.length; i++) {
                                if (that.attribSpecs[i].BaseAttributeName) {
                                    var viewAttributeName = that.attribSpecs[i].ODataAttributeName;
                                    if (typeof rinfRecord[viewAttributeName] !== "undefined") {
                                        Log.print(Log.l.trace, viewAttributeName + ": " + rinfRecord[viewAttributeName]);
                                        tableRecord[viewAttributeName] = rinfRecord[viewAttributeName];
                                    } else if (typeof viewRecord[viewAttributeName] !== "undefined") {
                                        Log.print(Log.l.trace, viewAttributeName + ": " + viewRecord[viewAttributeName]);
                                        tableRecord[viewAttributeName] = viewRecord[viewAttributeName];
                                    }
                                }
                            }
                            complete(tableRecord);
                        } else {
                            Log.print(Log.l.error, "no data in AttribSpecs");
                            var err = { status: 500, statusText: "no data in AttribSpecs" };
                            error(err);
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, rinfRecord, viewRecord, headers) {
                Log.call(Log.l.trace, "AppRepl.replUploadData.", "relationName=" + this.relationName);
                var that = this;
                var tableRecord;
                var insertTableRecord = function () {
                    var primKeyId = "OIMP" + that.relationName + "VIEWID";
                    if (typeof tableRecord[primKeyId] !== "undefined") {
                        delete tableRecord[primKeyId];
                    }
                    var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                    url += "/OIMP" + that.relationName + "VIEW";
                    var options = {
                        type: "POST",
                        url: url,
                        data: JSON.stringify(tableRecord)
                    };
                    if (typeof headers === "object") {
                        options.headers = headers;
                    } else {
                        options.headers = {};
                    }
                    options.customRequestInitializer = function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    };
                    options.headers["Accept"] = "application/json";
                    options.headers["Content-Type"] = "application/json";
                    options.user = AppData.getOnlineLogin();
                    options.password = AppData.getOnlinePassword();
                    options.headers["Authorization"] = "Basic " + btoa(options.user + ":" + options.password);
                    Log.print(Log.l.info, "calling xhr method=POST url=" + url);
                    return WinJS.xhr(options).then(function (response) {
                        var err;
                        Log.print(Log.l.trace, "success!");
                        try {
                            var obj = jsonParse(response.responseText);
                            if (obj && obj.d) {
                                complete(obj);
                            } else {
                                err = { status: 404, statusText: "no data found" };
                                error(err);
                            }
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                            err = { status: 500, statusText: "data parse error " + (exception && exception.message) };
                            error(err);
                        }
                        return WinJS.Promise.as();
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                        error(errorResponse);
                    });
                };
                var ret = that.extractTableRecord(that, function (tr) {
                    Log.print(Log.l.trace, "extractTableRecord: SUCCESS!");
                    tableRecord = tr;
                }, error, rinfRecord, viewRecord).then(function () {
                    if (tableRecord) {
                        return insertTableRecord();
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
        }),
        _replUploads: [],
        getReplUpload: function (relationName) {
            var ret = null;
            Log.call(Log.l.trace, "AppRepl.", "relationName=" + relationName);
            for (var i = 0; i < AppRepl._replUploads.length; i++) {
                var replUpload = AppRepl._replUploads[i];
                if (replUpload.relationName === relationName) {
                    ret = replUpload;
                    break;
                }
            }
            if (!ret) {
                Log.print(Log.l.info, "create new ReplUpload(" + relationName + ")");
                ret = new AppRepl.replUploadData(relationName);
                AppRepl._replUploads.push(ret);
            }
            Log.ret(Log.l.trace);
            return ret;
        },

        DbReplicator: WinJS.Class.define(function dbReplicator() {
            Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
            this._prcCallSuccess = false;
            this._prcCallFailed = false;
            this._state = "waiting";
            this._postRequestsToDo = 0;
            this._postRequestsDone = 0;
            this._postRequests = [];
            this._fetchNext = null;
            this._fetchRequests = [];
            this._fetchRequestsDone = 0;
            this._fetchRequestsCurrent = 0;
            AppRepl._replicator = this;
            var that = this;
            var dbName = Application.pageframe.name;
            if (dbName && typeof dbName === "string") {
                dbName = dbName.toLowerCase();
            } else {
                dbName = 'leadsuccess';
            }
            dbName += '.db';
            this._promise = SQLite.open({
                name: dbName,
                location: 'default',
                androidDatabaseProvider: 'system'
            }).then(function (db) {
                that._db = db;
                Log.print(Log.l.info, "SQLite.open returned!");
                return that.initLocalDB();
            }, function (err) {
                that._db = null;
                that._err = err;
                that._state = "error";
                Log.print(Log.l.info, "SQLite.open error! " + AppData.getErrorMsgFromResponse(err));
                if (!AppData.appSettings.odata.replErrorTimestamp) {
                    AppData.appSettings.odata.replErrorTimestamp = Date.now();
                    Application.pageframe.savePersistentStates();
                }
            });
            Log.ret(Log.l.trace);
        }, {
            _db: null,
            _connectionType: 1,
            _err: null,
            _postRequestsToDo: 0,
            _postRequestsDone: 0,
            _postRequestsCancel: false,
            _postRequests: [],
            _fetchNext: null,
            _fetchRequests: [],
            _fetchRequestsDone: 0,
            _fetchRequestsCurrent: 0,
            _now: null,
            _replPrevPostMs: 0,
            //_replPrevSelectMs: 0,
            //_replPrevFlowSpecId: 0,
            _prevTime: null,
            _promise: null,
            promise: {
                get: function () {
                    return this._promise;
                }
            },
            _state: "stopped",
            state: {
                get: function () {
                    return this._state;
                }
            },
            _stop: false,
            stop: function () {
                this._stop = true;
                if (this._promise) {
                    if (typeof this._promise.cancel === "function") {
                        this._promise.cancel();
                    }
                }
                this.run();
            },
            _timeout: replInterval,
            _numFastReqs: 0,
            inFastRepl: {
                get: function() {
                    if (this._numFastReqs > 0 && this.state === "running") {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            _prevOnOffline: 0,
            _networkstate: "",
            // _networkstate property
            networkstate: {
                get: function () {
                    this.checkForConnection();
                    return this._networkstate;
                }
            },
            // Handle the network online event 
            onOnline: function () {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                this._prevOnOffline = 1;
                Log.ret(Log.l.trace);
            },
            // Handle the network offline event 
            onOffline: function () {
                Log.call(Log.l.trace, ".", "");
                this._prevOnOffline = -1;
                Log.ret(Log.l.trace);
            },
            // check network connection state
            checkForConnection: function () {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                if (typeof Connection === "object") {
                    var connectionType = Connection.UNKNOWN;
                    if (navigator.connection) {
                        connectionType = navigator.connection.type;
                    }
                    if (this._prevOnOffline === 0) {
                        if (connectionType === Connection.NONE) {
                            this.onOffline();
                        } else {
                            this.onOnline();
                        }
                    } else if (this._prevOnOffline === 1 && connectionType === Connection.NONE) {
                        this.onOffline();
                    } else if (this._prevOnOffline === -1 && connectionType !== Connection.NONE) {
                        this.onOnline();
                    }
                    if (this._prevOnOffline === -1) {
                        this._networkstate = "Offline";
                    } else {
                        // Handle the network online event 
                        if (navigator.connection) {
                            var states = {};
                            states[Connection.UNKNOWN] = "Unknown connection";
                            states[Connection.ETHERNET] = "Ethernet connection";
                            states[Connection.WIFI] = "WiFi connection";
                            states[Connection.CELL_2G] = "Cell 2G connection";
                            states[Connection.CELL_3G] = "Cell 3G connection";
                            states[Connection.CELL_4G] = "Cell 4G connection";
                            states[Connection.CELL] = "Cell generic connection";
                            states[Connection.NONE] = "Offline";

                            connectionType = navigator.connection.type;
                            if (connectionType === Connection.UNKNOWN) {
                                if (navigator.onLine === true) {
                                    connectionType = Connection.CELL;
                                } else {
                                    connectionType = Connection.NONE;
                                }
                            }
                            this._networkstate = states[connectionType];
                        } else {
                            this._networkstate = "Online";
                        }
                    }
                    Log.print(Log.l.trace, "networkstate=" + this._networkstate);
                } else {
                    this._networkstate = "Unknown";
                }
                Log.ret(Log.l.trace);
            },
            initLocalDB: function() {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var options = {
                    user: AppData.appSettings.odata.login,
                    connectionType: this._connectionType,
                    connectionBusy: 0,
                    languageId: AppData.getLanguageId(),
                    uuid: window.device && window.device.uuid
                };
                var that = this;
                var ret = AppData.setConnectionProperties(that._db, options, function () {
                    return that.run();
                }, function (err) {
                    that._db = null;
                    that._err = err;
                    that._state = "error";
                    Log.print(Log.l.info, "setConnectionProperties returned error! " + AppData.getErrorMsgFromResponse(err));
                    if (!AppData.appSettings.odata.replErrorTimestamp) {
                        AppData.appSettings.odata.replErrorTimestamp = Date.now();
                        Application.pageframe.savePersistentStates();
                    }
                }, true);
                Log.ret(Log.l.trace);
                return ret;
            },
            checkForWaiting: function() {
                if (this.state === "running") {
                    var bRunImmediately = false;
                    if (this._postRequestsDone >= this._postRequestsToDo &&
                        this._fetchRequestsDone >= this._fetchRequests.length) {
                        Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: finished! postRequestsDone=" + this._postRequestsDone +
                            " fetchRequestsDone=" + this._fetchRequestsDone + " postRequestsCancel=" + this._postRequestsCancel);
                        if (this._postRequestsDone === 100 || this._postRequestsCancel) {
                            bRunImmediately = true;
                        }
                        var bDoSaveStates = false;
                        if (this._replPrevPostMs > AppData.appSettings.odata.replPrevPostMs) {
                            Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: replPrevPostMs=" + this._replPrevPostMs);
                            AppData.appSettings.odata.replPrevPostMs = this._replPrevPostMs;
                            bDoSaveStates = true;
                        }
                        var curSelectMs = AppData.appSettings.odata.replPrevSelectMs;
                        var curFlowSpecId = AppData.appSettings.odata.replPrevFlowSpecId;
                        for (var index = 0; index < this._fetchRequests.length; index++) {
                            var replicationDone = this._fetchRequests[index].replicationDone;
                            var modifiedTsMss = this._fetchRequests[index].modifiedTsMss;
                            var replicationFlowSpecViewIds = this._fetchRequests[index].replicationFlowSpecViewIds;
                            var bUnFinished = false;
                            for (var i = 0; i < replicationFlowSpecViewIds.length; i++) {
                                if (!replicationDone[i]) {
                                    Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: relationName[" + index + "]=" + 
                                        this._fetchRequests[index].relationName + " recordId[" + i + "]=" + this._fetchRequests[index].recordIds[i] +
                                        " replicationFlowSpecViewId=" + replicationFlowSpecViewIds[i] + " modifiedTsMss=" + modifiedTsMss[i]);
                                    if (replicationFlowSpecViewIds[i] <= curFlowSpecId) {
                                        curFlowSpecId = replicationFlowSpecViewIds[i] - 1;
                                    }
                                    if (modifiedTsMss[i] <= curSelectMs) {
                                        curSelectMs = modifiedTsMss[i] - 1;
                                    }
                                    bUnFinished = true;
                                } else if (!bUnFinished) {
                                    if (replicationFlowSpecViewIds[i] > curFlowSpecId) {
                                        curFlowSpecId = replicationFlowSpecViewIds[i];
                                    }
                                    if (modifiedTsMss[i] > curSelectMs) {
                                        curSelectMs = modifiedTsMss[i];
                                    }
                                }
                            }
                        }
                        if (curSelectMs > AppData.appSettings.odata.replPrevSelectMs) {
                            Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: replPrevSelectMs=" + curSelectMs);
                            AppData.appSettings.odata.replPrevSelectMs = curSelectMs;
                            bDoSaveStates = true;
                        }
                        if (curFlowSpecId > AppData.appSettings.odata.replPrevFlowSpecId) {
                            Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: replPrevFlowSpecId=" + curFlowSpecId);
                            AppData.appSettings.odata.replPrevFlowSpecId = curFlowSpecId;
                            bDoSaveStates = true;
                        }
                        if (bDoSaveStates) {
                            Application.pageframe.savePersistentStates();
                        }
                        this._postRequestsDone = 0;
                        this._fetchRequestsDone = 0;
                        if (this._postRequests.length > 0) {
                            this._postRequests = [];
                        }
                        if (this._fetchRequests.length > 0) {
                            this._fetchNext = null;
                            var fetchRequests = this._fetchRequests;
                            this._fetchRequests = [];
                            WinJS.Promise.timeout(10).then(function () {
                                Application.refreshAfterFetch(fetchRequests);
                            });
                        }
                        this._state = "waiting";
                        var that = this;
                        if (that._promise) {
                            if (typeof that._promise.cancel === "function") {
                                Log.print(Log.l.info, "AppRepl.DbReplicator.run: cancel prev. promise!");
                                that._promise.cancel();
                            }
                        }
                        if (bRunImmediately) {
                            Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: more to do, run immediately...");
                            that._promise = WinJS.Promise.timeout(100).then(function() {
                                that.run();
                            });
                        } else {
                            Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: no more to do, run later...");
                            var timeout = that._numFastReqs > 0 ?
                                getFastReqInterval(that._numFastReqs) :
                                (AppData._persistentStates.odata.replInterval || replInterval);
                            that._promise = WinJS.Promise.timeout(Math.floor(timeout * 1000)).then(function() {
                                that.run(that._numFastReqs);
                            });
                        }
                        if (typeof AppData.getNumberOfReplicationFlowSpecExt === "function") {
                            AppData.getNumberOfReplicationFlowSpecExt();
                        }
                    } else {
                        Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: postRequestsDone=" + this._postRequestsDone +
                            " postRequestsToDo=" + this._postRequestsToDo + 
                            " fetchRequestsDone=" + this._fetchRequestsDone +
                            " fetchRequests=" + this._fetchRequests.length);
                    }
                }
                Log.print(Log.l.info, "AppRepl.dbReplicator.checkForWaiting: state=" + this._state);
            },
            postReplicationEntry: function (index) {
                var ret = null;
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "index=" + index);

                var that = this;
                if (index >= that._postRequests.length || !that._postRequests[index]) {
                    Log.print(Log.l.info, "postRequests[" + index + "] extra ignored!");
                    ret = WinJS.Promise.as();
                } else {
                    var curRequest = that._postRequests[index];
                    var row = curRequest.row;
                    Log.print(Log.l.info, "working on postRequests[" + index + "] of RelationName=" + row.RelationName + " RecordID=" + row.RecordID);
                    var replUpload = null;
                    var rinfRelation = null;
                    var localRelation = AppData.getFormatView(row.RelationName, 0, true);
                    if (localRelation) {
                        rinfRelation = AppData.getFormatView("RINF" + row.RelationName, 0, true);
                        replUpload = AppRepl.getReplUpload(row.RelationName);
                    }
                    if (index > 0) {
                        for (var i = index - 1; i >= 0; i--) {
                            var prevRequest = that._postRequests[i];
                            if (prevRequest && prevRequest.state !== "finished" && prevRequest.row) {
                                var bSuspend = false;
                                //if (prevRequest.row.ReplicationType !== row.ReplicationType) {
                                //    if (AppData.appSettings.odata.replSyncPostOrder) {
                                //        Log.print(Log.l.info, " blocked by request[" + i + "] of RelationName=" + prevRequest.row.RelationName +
                                //            " RecordID=" + prevRequest.row.RecordID + " in state=" + prevRequest.state);
                                //        bSuspend = true;
                                //    }
                                //} else {
                                    if (localRelation && !localRelation.attribSpecs && !localRelation.errorResponse) {
                                        Log.print(Log.l.info, " blocked by request[" + i + "] of RelationName=" + prevRequest.row.RelationName +
                                            " RecordID=" + prevRequest.row.RecordID + " local attribSpecs not yet loaded");
                                        bSuspend = true;
                                    } else if (rinfRelation && !rinfRelation.attribSpecs && !rinfRelation.errorResponse) {
                                        Log.print(Log.l.info, " blocked by request[" + i + "] of RelationName=" + "RINF" + prevRequest.row.RelationName +
                                            " RecordID=" + prevRequest.row.RecordID + " local attribSpecs not yet loaded");
                                        bSuspend = true;
                                    } else if (replUpload && !replUpload.attribSpecs && !replUpload.errorResponse) {
                                        Log.print(Log.l.info, " blocked by request[" + i + "] of RelationName=" + prevRequest.row.RelationName +
                                            " RecordID=" + prevRequest.row.RecordID + " remote attribSpecs not yet loaded");
                                        bSuspend = true;
                                    }
                                //}
                                if (bSuspend) {
                                    if (index < 20 && that._postRequests.length < 50) {
                                        ret = WinJS.Promise.timeout(200).then(function () {
                                            that.postReplicationEntry(index);
                                        });
                                    } else {
                                        Log.print(Log.l.info, " ignore request[" + index + "] in this schedule");
                                        if (index < that._postRequests.length) {
                                            if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                                that._postRequests[index].state = "finished";
                                                that._postRequestsDone++;
                                                that._postRequestsCancel = true;
                                            }
                                        }
                                        that.checkForWaiting();
                                        ret = WinJS.Promise.as();
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (!ret) {
                        var rinfRecord = {};
                        for (var prop in row) {
                            if (row.hasOwnProperty(prop)) {
                                rinfRecord["OIMP" + prop] = row[prop];
                            }
                        }
                        var viewRecord = null;
                        if (localRelation && replUpload) {
                            var selectRinfRecord = function () {
                                if (row.AccessStatus === 3) {
                                    return WinJS.Promise.as();
                                } else {
                                    return rinfRelation.selectById(function (json) {
                                        if (json && json.d) {
                                            for (var prop2 in json.d) {
                                                if (json.d.hasOwnProperty(prop2) &&
                                                    prop2 !== rinfRelation.pkName &&
                                                    prop2 !== rinfRelation.oDataPkName) {
                                                    rinfRecord["OIMP" + prop2] = json.d[prop2];
                                                }
                                            }
                                        }
                                    }, function (err) {
                                        Log.print(Log.l.error, "selectById RecordID=" + row.RecordID + " returned error " + err);
                                        return WinJS.Promise.as();
                                    }, row.RecordID);
                                }
                            };
                            var selectViewRecord = function () {
                                if (row.AccessStatus === 3) {
                                    viewRecord = {};
                                    return WinJS.Promise.as();
                                } else {
                                    return localRelation.selectById(function (json) {
                                        if (json && json.d) {
                                            viewRecord = json.d;
                                            Log.print(Log.l.info, "selectById(" + row.RecordID + ") success!");
                                        }
                                    }, function (err) {
                                        Log.print(Log.l.error, "selectById RecordID=" + row.RecordID + " returned error " + err);
                                        if (index < that._postRequests.length && that._postRequests[index].state !== "finished") {
                                            if (that._postRequests[index]) {
                                                that._postRequests[index].state = "finished";
                                                that._postRequestsDone++;
                                            }
                                        }
                                        that.checkForWaiting();
                                        return WinJS.Promise.as();
                                    }, row.RecordID);
                                }
                            };
                            var createCrossRefIds = function () {
                                var crossRinfRelation = null;
                                var crossRinfRecordId = null;
                                var crossAttributeName = null;
                                if (viewRecord) for (var i = 0; i < localRelation.attribSpecs.length; i++) {
                                    var attribSpec = localRelation.attribSpecs[i];
                                    if (attribSpec && attribSpec.RefRINFRelationName) {
                                        for (var j = 0; j < replUpload.attribSpecs.length; j++) {
                                            var oimpAttribSpec = replUpload.attribSpecs[j];
                                            if (oimpAttribSpec && oimpAttribSpec.BaseAttributeName === attribSpec.Name) {
                                                if (oimpAttribSpec.AttribTypeID === 3) {
                                                    // string type FK attribute
                                                    crossRinfRelation = AppData.getFormatView(attribSpec.RefRINFRelationName, 0, true);
                                                    crossAttributeName = attribSpec.Name;
                                                    crossRinfRecordId = viewRecord[crossAttributeName];
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (crossRinfRelation && crossRinfRecordId && crossAttributeName) {
                                    return crossRinfRelation.selectById(function (json) {
                                        if (json && json.d) {
                                            viewRecord[crossAttributeName] = json.d.CreatorSiteID + "/" + json.d.CreatorRecID;
                                            Log.print(Log.l.info, crossAttributeName + "=" + viewRecord[crossAttributeName]);
                                        }
                                    }, function (err) {
                                        Log.print(Log.l.error, "selectById RecordID=" + crossRinfRecordId + " returned error " + err);
                                        viewRecord = null;
                                    }, crossRinfRecordId);
                                } else {
                                    return WinJS.Promise.as();
                                }
                            }
                            ret = selectRinfRecord().then(function () {
                                return selectViewRecord();
                            }).then(function () {
                                if (!localRelation.attribSpecs || !localRelation.attribSpecs.length) {
                                    return localRelation.getAttribSpecs(localRelation, function () {
                                        Log.print(Log.l.trace, "now go on...");
                                    }, function () {
                                        Log.print(Log.l.trace, localRelation.relationName + ": getAttribSpecs: SELECT success");
                                    }, function (err) {
                                        Log.print(Log.l.error, "getAttribSpecs " + localRelation.relationName + " returned error " + err);
                                        viewRecord = null;
                                        return WinJS.Promise.as();
                                    });
                                } else {
                                    return WinJS.Promise.as();
                                }
                            }).then(function () {
                                if (!replUpload.attribSpecs || !replUpload.attribSpecs.length) {
                                    return replUpload.getAttribSpecs(replUpload, function () {
                                        Log.print(Log.l.trace, "now go on...");
                                    }, function () {
                                        Log.print(Log.l.trace, replUpload.relationName + ": getAttribSpecs: SELECT success");
                                    }, function (err) {
                                        Log.print(Log.l.error, "getAttribSpecs " + replUpload.relationName + " returned error " + err);
                                        viewRecord = null;
                                        return WinJS.Promise.as();
                                    });
                                } else {
                                    return WinJS.Promise.as();
                                }
                            }).then(function () {
                                return createCrossRefIds();
                            }).then(function () {
                                if (viewRecord && that._postRequests && that._postRequests[index]) {
                                    that._postRequests[index].state = "posting";
                                    return replUpload.insert(function (json) {
                                        if (json && json.d && that._postRequests && that._postRequests[index]) {
                                            var stmt, values;
                                            var insertRow = json.d;
                                            if (insertRow.OIMPStatus === 0) {
                                                that._postRequests[index].state = "deleting";
                                                Log.print(Log.l.info, "insert success! RecordId=" + insertRow["OIMP" + row.RelationName + "VIEWID"]);
                                                stmt = "DELETE FROM \"ReplicationFlowSpec\" WHERE \"ReplicationFlowSpecID\"=?";
                                                values = [row.ReplicationFlowSpecID];
                                            } else {
                                                that._postRequests[index].state = "updating";
                                                Log.print(Log.l.info, "insert error! RecordId=" + insertRow["OIMP" + row.RelationName + "VIEWID"] + " Status=" + insertRow.OIMPStatus + " ReplicationStatus=" + insertRow.OIMPReplicationStatus);
                                                stmt = "UPDATE \"ReplicationFlowSpec\" SET \"Status\"=ifnull(\"Status\",0)+1,\"ReplicationStatus\"=? WHERE \"ReplicationFlowSpecID\"=?";
                                                values = [insertRow.OIMPReplicationStatus, row.ReplicationFlowSpecID];
                                            }
                                            Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                                            ret = SQLite.xsql(that._db, stmt, values, that._connectionType).then(function (res) {
                                                Log.print(Log.l.info, "xsql: returned rowsAffected=" + res.rowsAffected);
                                                if (row.ModifiedTS) {
                                                    var msString = row.ModifiedTS.replace("\/Date(", "").replace(")\/", "");
                                                    var milliseconds = parseInt(msString);
                                                    if (milliseconds > that._replPrevPostMs) {
                                                        that._replPrevPostMs = milliseconds;
                                                    }
                                                }
                                                if (index < that._postRequests.length) {
                                                    if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                                        that._postRequests[index].state = "finished";
                                                        that._postRequestsDone++;
                                                    }
                                                }
                                                that.checkForWaiting();
                                            }, function (curerr) {
                                                Log.print(Log.l.error, "xsql: DELETE returned " + curerr);
                                                if (index < that._postRequests.length) {
                                                    if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                                        that._postRequests[index].state = "finished";
                                                        that._postRequestsDone++;
                                                    }
                                                }
                                                that.checkForWaiting();
                                            });
                                        } else {
                                            Log.print(Log.l.error, "replUpload.insert returned no data!");
                                            if (index < that._postRequests.length) {
                                                if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                                    that._postRequests[index].state = "finished";
                                                    that._postRequestsDone++;
                                                }
                                            }
                                            that.checkForWaiting();
                                        }
                                    }, function (err) {
                                        Log.print(Log.l.error, "replUpload.insert returned error " + err);
                                        if (index < that._postRequests.length) {
                                            if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                                that._postRequests[index].state = "finished";
                                                that._postRequestsDone++;
                                            }
                                        }
                                        that.checkForWaiting();
                                    }, rinfRecord, viewRecord);
                                } else {
                                    Log.print(Log.l.error, "no viewRecord for RelationName=" + row.RelationName);
                                    if (index < that._postRequests.length) {
                                        if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                            that._postRequests[index].state = "finished";
                                            that._postRequestsDone++;
                                        }
                                    }
                                    that.checkForWaiting();
                                    return WinJS.Promise.as();
                                }
                            });
                        } else {
                            if (!localRelation) {
                                Log.print(Log.l.error, "no localRelation for RelationName=" + row.RelationName);
                            }
                            if (!replUpload) {
                                Log.print(Log.l.error, "no replUpload relation for RelationName=" + row.RelationName);
                            }
                            if (index < that._postRequests.length) {
                                if (that._postRequests[index] && that._postRequests[index].state !== "finished") {
                                    that._postRequests[index].state = "finished";
                                    that._postRequestsDone++;
                                }
                            }
                            that.checkForWaiting();
                            ret = WinJS.Promise.as();
                        }
                    }
                }
                Log.ret(Log.l.trace);
                return ret;
            },
            selectReplicationFlowSpec: function () {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var i;
                var existsDuplicate = 0;
                var deleteDeletedStmt = "";
                var that = this;
                // preset _postRequestsDone = -1 while in select 
                // to avoid exit condition in checkForWaiting()
                // will be reset after select
                that._postRequestsDone = -1;
                that._postRequestsToDo = 0;
                var ret = new WinJS.Promise.as().then(function() {
                    // check for duplicated replication flowspec
                    var stmt = "SELECT \"ReplicationFlowSpec\".\"ReplicationFlowSpecID\" FROM \"ReplicationFlowSpec\" WHERE EXISTS (SELECT 1 FROM \"ReplicationFlowSpec\" AS \"RF2\" WHERE \"ReplicationFlowSpec\".\"RelationID\"=\"RF2\".\"RelationID\" AND \"ReplicationFlowSpec\".\"RecordID\"=\"RF2\".\"RecordID\" AND \"ReplicationFlowSpec\".\"ReplicationFlowSpecID\"<\"RF2\".\"ReplicationFlowSpecID\") LIMIT 1";
                    var values = [];
                    Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                    return SQLite.xsql(that._db, stmt, values, that._connectionType).then(function (res) {
                        existsDuplicate = (res && res.rows && res.rows.length);
                        Log.print(Log.l.info, "SELECT success! existsDuplicate=" + existsDuplicate);
                    }, function (err) {
                        that._err = err;
                        that._state = "error";
                        Log.print(Log.l.error, "SELECT SQLite.xsql error! " + AppData.getErrorMsgFromResponse(err));
                        if (!AppData.appSettings.odata.replErrorTimestamp) {
                            AppData.appSettings.odata.replErrorTimestamp = Date.now();
                            Application.pageframe.savePersistentStates();
                        }
                    });
                }).then(function () {
                    if (existsDuplicate) {
                        // delete duplicated replication flowspec
                        var stmt = "DELETE FROM \"ReplicationFlowSpec\" WHERE EXISTS (SELECT 1 FROM \"ReplicationFlowSpec\" AS \"RF2\" WHERE \"ReplicationFlowSpec\".\"RelationID\"=\"RF2\".\"RelationID\" AND \"ReplicationFlowSpec\".\"RecordID\"=\"RF2\".\"RecordID\" AND \"ReplicationFlowSpec\".\"ReplicationFlowSpecID\"<\"RF2\".\"ReplicationFlowSpecID\")";
                        var values = [];
                        Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                        return SQLite.xsql(that._db, stmt, values, that._connectionType).then(function (res) {
                            Log.print(Log.l.info, "DELETE existsDuplicate success! rowsAffected=" + (res && res.rowsAffected));
                        }, function (err) {
                            that._err = err;
                            that._state = "error";
                            Log.print(Log.l.error, "DELETE existsDuplicate SQLite.xsql error! " + AppData.getErrorMsgFromResponse(err));
                            if (!AppData.appSettings.odata.replErrorTimestamp) {
                                AppData.appSettings.odata.replErrorTimestamp = Date.now();
                                Application.pageframe.savePersistentStates();
                            }
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    // check for INSERT/UPDATE replication flowspec of deleted records
                    var stmt = "SELECT \"RelationSpec\".\"RelationID\",\"RelationSpec\".\"Name\" FROM \"RelationSpec\" WHERE \"RelationSpec\".\"RelationID\" IN (SELECT \"RelationID\" FROM \"ReplicationFlowSpec\")";
                    var values = [];
                    Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                    return SQLite.xsql(that._db, stmt, values, that._connectionType).then(function (res) {
                        if (res && res.rows && res.rows.length > 0) {
                            Log.print(Log.l.info, "SELECT success!");
                            for (i = 0; i < res.rows.length; i++) {
                                var row = res.rows.item(i);
                                if (row) {
                                    if (!deleteDeletedStmt) {
                                        deleteDeletedStmt = "DELETE FROM \"ReplicationFlowSpec\" WHERE";
                                    } else {
                                        deleteDeletedStmt += " OR";
                                    }
                                    deleteDeletedStmt += " \"AccessStatus\" IN (1,2) AND \"RelationID\"=" + row.RelationID + 
                                        " AND NOT EXISTS (SELECT 1 FROM \"" + row.Name + 
                                        "\" WHERE \"" + row.Name + "ID\"=\"ReplicationFlowSpec\".\"RecordID\")";
                                }
                            }
                        }
                    }, function (err) {
                        that._err = err;
                        that._state = "error";
                        Log.print(Log.l.error, "SELECT SQLite.xsql error! " + AppData.getErrorMsgFromResponse(err));
                        if (!AppData.appSettings.odata.replErrorTimestamp) {
                            AppData.appSettings.odata.replErrorTimestamp = Date.now();
                            Application.pageframe.savePersistentStates();
                        }
                    });
                }).then(function () {
                    if (deleteDeletedStmt) {
                        // delete replication flowspec of already deleted records
                        var values = [];
                        Log.print(Log.l.info, "xsql: " + deleteDeletedStmt);
                        return SQLite.xsql(that._db, deleteDeletedStmt, values, that._connectionType).then(function (res) {
                            Log.print(Log.l.info, "DELETE deleteDeletedStmt success! rowsAffected=" + (res && res.rowsAffected));
                        }, function (err) {
                            that._err = err;
                            that._state = "error";
                            Log.print(Log.l.error, "DELETE deleteDeletedStmt SQLite.xsql error! " + AppData.getErrorMsgFromResponse(err));
                            if (!AppData.appSettings.odata.replErrorTimestamp) {
                                AppData.appSettings.odata.replErrorTimestamp = Date.now();
                                Application.pageframe.savePersistentStates();
                            }
                        });
                    } else {
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    // check for replication flowspec
                    var postReplicationOrder = "\"ReplicationSpec\".\"ReplicationType\"+coalesce(\"ReplicationSpec\".\"TimeArray\",0)";
                    var stmt = "SELECT \"ReplicationFlowSpec\".*,\"ReplicationSpec\".\"RelationName\"," + postReplicationOrder + " AS \"ReplicationType\" FROM \"ReplicationFlowSpec\",\"ReplicationSpec\" WHERE \"ReplicationFlowSpec\".\"RelationID\"=\"ReplicationSpec\".\"RelationID\" ORDER BY \"ReplicationFlowSpec\".\"ReplicationFlowSpecID\" LIMIT 100";
                    var values = [];
                    Log.print(Log.l.info, "xsql: " + stmt + " [" + values + "]");
                    return SQLite.xsql(that._db, stmt, values, that._connectionType).then(function (res) {
                        if (res && res.rows && res.rows.length > 0) {
                            that._postRequestsToDo = res.rows.length;
                            that._postRequestsDone = 0;
                            that._postRequestsCancel = false;
                            that._postRequests = [];
                            Log.print(Log.l.info, "success! length=" + that._postRequestsToDo);
                            if (that._postRequestsToDo > 0) {
                                for (i = 0; i < that._postRequestsToDo; i++) {
                                    that._postRequests.push({
                                        row: res.rows.item(i),
                                        state: "selecting"
                                    });
                                    that.postReplicationEntry(i);
                                }
                            }
                        }
                    }, function (err) {
                        that._err = err;
                        that._state = "error";
                        Log.print(Log.l.error, "SQLite.xsql error! " + AppData.getErrorMsgFromResponse(err));
                        if (!AppData.appSettings.odata.replErrorTimestamp) {
                            AppData.appSettings.odata.replErrorTimestamp = Date.now();
                            Application.pageframe.savePersistentStates();
                        }
                    });
                }).then(function () {
                    Log.print(Log.l.info, "now select remote ReplicationFlowSpec");
                    return that.selectRemoteReplicationFlowSpec();
                }).then(function () {
                    // reset _postRequestsDone = 0 in case of no result
                    if (that._postRequestsDone < 0) {
                        that._postRequestsDone = 0;
                    }
                    Log.print(Log.l.info, "now check for waiting");
                    that.checkForWaiting();
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "AppData.DbReplicator.");
                var url = null;
                if (response && response.d && response.d.__next) {
                    var pos = response.d.__next.indexOf("://");
                    if (pos > 0) {
                        var pos2 = response.d.__next.substr(pos + 3).indexOf("/");
                        if (pos2 > 0) {
                            var pos3 = response.d.__next.substr(pos + 3 + pos2 + 1).indexOf("/");
                            if (pos3 > 0) {
                                url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath +
                                    response.d.__next.substr(pos + 3 + pos2 + 1 + pos3);
                            }
                        }
                    }
                    Log.ret(Log.l.trace, "next=" + url);
                } else {
                    Log.ret(Log.l.trace, "finished");
                }
                return url;
            },
            fetchNextRemoteReplicationFlowSpec: function (that, results, next, followFunction) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "next=" + next);
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: next,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + next);
                var ret = WinJS.xhr(options).then(function (response) {
                    Log.print(Log.l.info, "ReplicationFlowSpecExtView next: success!");
                    try {
                        var obj = jsonParse(response.responseText);
                        if (obj && obj.d && obj.d.results && obj.d.results.length > 0) {
                            var next = that.getNextUrl(obj);
                            followFunction(that, obj.d.results, next);
                        } else {
                            Log.print(Log.l.info, "ReplicationFlowSpecExtView: returned no data");
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            updateLocalRinf: function (relationName, recordId, index, subIndex, bDoInsert) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "relationName=" + relationName + " recordId=" + recordId + " index=" + index + " subIndex=" + subIndex + " bDoInsert=" + bDoInsert);
                var that = this;
                if (!that._fetchRequests[index]) {
                    Log.ret(Log.l.error, "fetchRequests[" + index + "] does not exists");
                    return;
                }
                var creatorSiteIds = that._fetchRequests[index].creatorSiteIds;
                var creatorRecIds = that._fetchRequests[index].creatorRecIds;
                var creationTsMss = that._fetchRequests[index].creationTsMss;
                var modifierSiteIds = that._fetchRequests[index].modifierSiteIds;
                var modifiedTsMss = that._fetchRequests[index].modifiedTsMss;
                //var replicationFlowSpecViewIds = that._fetchRequests[index].replicationFlowSpecViewIds;
                var modifiedDocTsMss = that._fetchRequests[index].modifiedDocTsMss;
                var modifierDescriptions = that._fetchRequests[index].modifierDescriptions;
                var accessStatuss = that._fetchRequests[index].accessStatuss;
                var i = subIndex;//creatorRecIds.indexOf(recordId);
                if (i >= 0) {
                    var modifiedTsMs = modifiedTsMss[i];
                    //var replicationFlowSpecViewId = replicationFlowSpecViewIds[i];
                    var row = {
                        ModifierSiteID: modifierSiteIds[i],
                        ModifiedTS: "\/Date(" + modifiedTsMs+ ")\/",
                        ModifierDescription: modifierDescriptions[i],
                        AccessStatus: accessStatuss[i]
                    };
                    if (modifiedDocTsMss[i]) {
                        row["ModifiedDocTS"] = "\/Date(" + modifiedDocTsMss[i] + ")\/";
                    }
                    var relation = AppData.getFormatView("RINF" + relationName, 0, true, false, true);
                    if (relation) {
                        var fnInsert = function() {
                            row[relation.oDataPkName] = recordId;
                            row["CreatorSiteID"] = creatorSiteIds[i];
                            row["CreatorRecID"] = creatorRecIds[i];
                            if (creationTsMss[i]) {
                                row["CreationTS"] = "\/Date(" + creationTsMss[i] + ")\/";
                            }
                            Log.print(Log.l.info, relation.relationName + ": insert with recordId=" + recordId);
                            relation.insertWithId(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                Log.print(Log.l.info, relation.relationName + " insertWithId: success! recordId=" + recordId);
                                //if (modifiedTsMs > that._replPrevSelectMs) {
                                //    that._replPrevSelectMs = modifiedTsMs;
                                //}
                                //if (!that._fetchNext && replicationFlowSpecViewId > that._replPrevFlowSpecId) {
                                //    that._replPrevFlowSpecId = replicationFlowSpecViewId;
                                //}
                                // contactData returns object already parsed from json file in response
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].replicationDone[i] = true;
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                            }, row);
                        }
                        if (bDoInsert) {
                            fnInsert();
                        } else {
                            relation.selectById(function (json) {
                                if (json && json.d && json.d[relation.oDataPkName] === recordId) {
                                    Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " exists, so do update!");
                                    relation.update(function (response) {
                                        // called asynchronously if ok
                                        Log.print(Log.l.info, relation.relationName + " update: success! recordId=" + recordId);
                                        //if (modifiedTsMs > that._replPrevSelectMs) {
                                        //    that._replPrevSelectMs = modifiedTsMs;
                                        //}
                                        //if (!that._fetchNext && replicationFlowSpecViewId > that._replPrevFlowSpecId) {
                                        //    that._replPrevFlowSpecId = replicationFlowSpecViewId;
                                        //}
                                        if (that._fetchRequests[index]) {
                                            that._fetchRequests[index].replicationDone[i] = true;
                                            that._fetchRequests[index].done++;
                                            if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                that._fetchRequests[index].state = "finished";
                                                that._fetchRequestsDone++;
                                                that.checkForWaiting();
                                            }
                                        }
                                    }, function (errorResponse) {
                                        // called asynchronously if an error occurs
                                        // or server returns response with an error status.
                                        Log.print(Log.l.info, relation.relationName + " update failed!");
                                        fnInsert();
                                    }, recordId, row);
                                } else {
                                    Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " does not exist, so try insert!");
                                    fnInsert();
                                }
                            }, function (errorResponse) {
                                Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " does not exist, so try insert!");
                                fnInsert();
                            }, recordId);
                        }
                    }
                } else {
                    Log.print(Log.l.info, relationName + ": returned invalid creatorRecIds=" + recordId);
                    if (that._fetchRequests[index]) {
                        that._fetchRequests[index].done++;
                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                            that._fetchRequests[index].state = "finished";
                            that._fetchRequestsDone++;
                            that.checkForWaiting();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            updateLocalData: function (relationName, recordId, row, index, subIndex, pollInterval) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var that = this;
                var relation = AppData.getFormatView(relationName, 0, true, false, true);
                if (relation) {
                    for (var prop in row) {
                        if (row.hasOwnProperty(prop)) {
                            var value = row[prop];
                            if (value && typeof value === "string" && value.substr(0, 6) === "\/Date(") {
                                var msString = value.replace("\/Date(", "").replace(")\/", "");
                                var milliseconds = parseInt(msString);
                                if (AppData.appSettings.odata.timeZoneRemoteAdjustment) {
                                    milliseconds -= AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                                }
                                row[prop] = "\/Date(" + milliseconds + ")\/";
                            }
                        }
                    }
                    var fnInsert = function () {
                        var useInsertWithId = false;
                        if (typeof relation.insertWithId === "function") {
                            if (pollInterval === 1) {
                                Log.print(Log.l.info, "Insert with pollInterval="+ pollInterval);
                                useInsertWithId = true;
                            } else if (that._fetchRequests &&
                                that._fetchRequests[index] &&
                                that._fetchRequests[index].creatorSiteIds &&
                                that._fetchRequests[index].creatorRecIds) {
                                var creatorSiteId = that._fetchRequests[index].creatorSiteIds[subIndex];
                                var creatorRecId = that._fetchRequests[index].creatorRecIds[subIndex];
                                if (creatorSiteId === AppData._persistentStates.odata.dbSiteId) {
                                    Log.print(Log.l.info, "Re-Insert of record created at own creatorSiteId=" + creatorSiteId);
                                    row[relation.oDataPkName] = creatorRecId;
                                    useInsertWithId = true;
                                }
                            }
                        }
                        if (useInsertWithId) {
                            Log.print(Log.l.info, relation.relationName + ": insert with recordId=" + recordId);
                            relation.insertWithId(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                if (json && json.d) {
                                    recordId = json.d[relation.oDataPkName];
                                }
                                if (recordId) {
                                    Log.print(Log.l.info, relation.relationName + " insertWithId: success! recordId=" + recordId);
                                    // contactData returns object already parsed from json file in response
                                    that.updateLocalRinf(relationName, recordId, index, subIndex, true);
                                } else {
                                    Log.print(Log.l.error, "insert returned no data!");
                                    if (that._fetchRequests[index]) {
                                        that._fetchRequests[index].done++;
                                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                            that._fetchRequests[index].state = "finished";
                                            that._fetchRequestsDone++;
                                            that.checkForWaiting();
                                        }
                                    }
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                            }, row);
                        } else {
                            relation.insert(function (json) {
                                // this callback will be called asynchronously
                                // when the response is available
                                if (json && json.d) {
                                    recordId = json.d[relation.oDataPkName];
                                }
                                if (recordId) {
                                    Log.print(Log.l.info, relation.relationName + " insertWithId: success! recordId=" + recordId);
                                    // contactData returns object already parsed from json file in response
                                    that.updateLocalRinf(relationName, recordId, index, subIndex, true);
                                } else {
                                    Log.print(Log.l.error, "insert returned no data!");
                                    if (that._fetchRequests[index]) {
                                        that._fetchRequests[index].done++;
                                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                            that._fetchRequests[index].state = "finished";
                                            that._fetchRequestsDone++;
                                            that.checkForWaiting();
                                        }
                                    }
                                }
                            }, function (errorResponse) {
                                // called asynchronously if an error occurs
                                // or server returns response with an error status.
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                            }, row);
                        }
                    }
                    if (!recordId) {
                        fnInsert();
                    } else {
                        relation.selectById(function (json) {
                            if (json && json.d && json.d[relation.oDataPkName] === recordId) {
                                Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " exists, so do update!");
                                relation.update(function (response) {
                                    // called asynchronously if ok
                                    Log.print(Log.l.info, relation.relationName + " update: success! recordId=" + recordId);
                                    that.updateLocalRinf(relationName, recordId, index, subIndex);
                                }, function (errorResponse) {
                                    // called asynchronously if an error occurs
                                    // or server returns response with an error status.
                                    Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                    if (that._fetchRequests[index]) {
                                        that._fetchRequests[index].done++;
                                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                            that._fetchRequests[index].state = "finished";
                                            that._fetchRequestsDone++;
                                            that.checkForWaiting();
                                        }
                                    }
                                }, recordId, row);
                            } else {
                                Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " does not exist, so try insert!");
                                fnInsert();
                            }
                        }, function (errorResponse) {
                            Log.print(Log.l.info, relation.relationName + ": recordId=" + recordId + " does not exist, so try insert!");
                            fnInsert();
                        }, recordId);
                    }
                }
                Log.ret(Log.l.trace);
            },
            deleteLocalData: function (relationName, recordId, index, subIndex) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "recordId=" + recordId);
                var that = this;
                if (!that._fetchRequests[index]) {
                    Log.print(Log.l.info, relationName + " fetchRequests[" + index + "] does not exists");
                } else if (!recordId) {
                    Log.print(Log.l.info, relationName + " deleteRecord: ignored! recordId=" + recordId);
                    that._fetchRequests[index].replicationDone[subIndex] = true;
                    that._fetchRequests[index].done++;
                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                        that._fetchRequests[index].state = "finished";
                        that._fetchRequestsDone++;
                        that.checkForWaiting();
                    }
                } else {
                    var relation = AppData.getFormatView(relationName, 0, true, false, true);
                    if (relation) {
                        var modifiedTsMss = that._fetchRequests[index].modifiedTsMss;
                        var replicationFlowSpecViewIds = that._fetchRequests[index].replicationFlowSpecViewIds;
                        var modifiedTsMs = modifiedTsMss[subIndex];
                        var replicationFlowSpecViewId = replicationFlowSpecViewIds[subIndex];
                        relation.deleteRecord(function(response) {
                            // called asynchronously if ok
                            Log.print(Log.l.info, relation.relationName + " deleteRecord: success! recordId=" + recordId);
                            //if (modifiedTsMs > that._replPrevSelectMs) {
                            //    that._replPrevSelectMs = modifiedTsMs;
                            //}
                            //if (!that._fetchNext && replicationFlowSpecViewId > that._replPrevFlowSpecId) {
                            //    that._replPrevFlowSpecId = replicationFlowSpecViewId;
                            //}
                            if (that._fetchRequests[index]) {
                                that._fetchRequests[index].replicationDone[subIndex] = true;
                                that._fetchRequests[index].done++;
                                if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                    that._fetchRequests[index].state = "finished";
                                    that._fetchRequestsDone++;
                                    that.checkForWaiting();
                                }
                            }
                        },
                        function(errorResponse) {
                            Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                            if (that._fetchRequests[index]) {
                                that._fetchRequests[index].done++;
                                if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                    that._fetchRequests[index].state = "finished";
                                    that._fetchRequestsDone++;
                                    that.checkForWaiting();
                                }
                            }
                        },
                        recordId);
                    } else {
                        that._fetchRequests[index].done++;
                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                            that._fetchRequests[index].state = "finished";
                            that._fetchRequestsDone++;
                            that.checkForWaiting();
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            selectRinf: function (relationName, recordId, attribName, row, isLocal, rinfRelationName, complete, error, creatorSiteId, creatorRecId) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                if (!rinfRelationName || isLocal) {
                    rinfRelationName = "RINF" + relationName;
                }
                var rinfRelation = AppData.getFormatView(rinfRelationName, 0, isLocal);
                if (rinfRelation) {
                    if (creatorSiteId, creatorRecId) {
                        var restriction = {
                            CreatorSiteID: creatorSiteId,
                            CreatorRecID: creatorRecId
                        }
                        rinfRelation.select(function (json) {
                            Log.print(Log.l.info, rinfRelation.relationName + ": success!");
                            complete(relationName, recordId, attribName, rinfRelationName, json, rinfRelation.oDataPkName);
                        }, function (errorResponse) {
                            Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                            error(errorResponse);
                        }, restriction);
                    } else {
                        rinfRelation.selectById(function (json) {
                            Log.print(Log.l.info, rinfRelation.relationName + ": success!");
                            complete(relationName, recordId, attribName, rinfRelationName, json, rinfRelation.oDataPkName);
                        }, function (errorResponse) {
                            Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                            error(errorResponse);
                        }, recordId);
                    }
                }
                Log.ret(Log.l.trace);
            },
            replaceReplicationDataKeys: function (relation, recordId, remoteRecordId, row, index, subIndex, pollInterval) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var i;
                var that = this;
                var keysDone = 0;
                var refKeyNames = [];
                var refKeyIds = [];
                var refTables = [];
                var refRinfTables = [];
                var err = null;
                var attribSpecs = relation.attribSpecs;
                for (i = 0; i < attribSpecs.length; i++) {
                    var attribFunction = attribSpecs[i].Function;
                    if (attribFunction & 4096) {
                        var attribPParam = attribSpecs[i].PParam;
                        if (attribPParam) {
                            var posColumn = attribPParam.lastIndexOf(".");
                            if (posColumn >= 0) {
                                var posTable = attribPParam.substr(0, posColumn - 1).lastIndexOf(".");
                                if (posTable >= 0) {
                                    var refTable = attribPParam.substr(posTable + 1, posColumn - posTable - 1);
                                    if (refTable.substr(0, 4) !== "INIT" && AppData._dbInit) {
                                        var allRelationsIndex = AppData._dbInit.allRelations.indexOf(refTable);
                                        if (allRelationsIndex > AppData._dbInit.userSpecIndex) {
                                            var refRinfTable = attribSpecs[i].RefRINFRelationName;
                                            var refKeyName = attribSpecs[i].ODataAttributeName;
                                            var refKeyId = row[refKeyName];
                                            refTables.push(refTable);
                                            refRinfTables.push(refRinfTable);
                                            refKeyNames.push(refKeyName);
                                            refKeyIds.push(refKeyId);
                                            Log.print(Log.l.info, "found FK: " + attribSpecs[i].PParam + " with remote ID=" + row[attribSpecs[i].ODataAttributeName]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (refKeyIds.length > 0) {
                    for (i = 0; i < refKeyIds.length && !err; i++) {
                        if (refKeyIds[i]) {
                            that.selectRinf(refTables[i], refKeyIds[i], refKeyNames[i], row, false, refRinfTables[i], function (refTable, refKeyId, refKeyName, rinfRelationName, json, oDataPkName) {
                                if (json && json.d) {
                                    if (json.d.CreatorSiteID === AppData._persistentStates.odata.dbSiteId) {
                                        Log.print(Log.l.info, "RINF" + refTable + ": CreatorSiteID=" + json.d.CreatorSiteID + " is local DBSite: " + refKeyName + "=" + json.d.CreatorRecID);
                                        row[refKeyName] = json.d.CreatorRecID;
                                        keysDone++;
                                    } else {
                                        Log.print(Log.l.info, "RINF" + refTable + ": CreatorSiteID=" + json.d.CreatorSiteID + " other DBSite: look for recordId in local RINF");
                                        that.selectRinf(refTable, refKeyId, refKeyName, row, true, rinfRelationName, function (refTableLocal, refKeyIdLocal, refKeyNameLocal, rinfRelationNameLocal, jsonLocal, oDataPkNameLocal) {
                                            if (jsonLocal && jsonLocal.d) {
                                                var rinfRow;
                                                if (jsonLocal.d.results) {
                                                    if (jsonLocal.d.results.length > 0) {
                                                        rinfRow = jsonLocal.d.results[0];
                                                    } else {
                                                        rinfRow = {};
                                                    }
                                                } else {
                                                    rinfRow = jsonLocal.d;
                                                }
                                                if (rinfRow[oDataPkNameLocal]) {
                                                    Log.print(Log.l.info,"RINF" + refTable +": CreatorSiteID=" + rinfRow.CreatorSiteID + ",CreatorRecID=" + rinfRow.CreatorRecID + " found in localRINF: " + refKeyName +"=" + rinfRow[oDataPkNameLocal]);
                                                    row[refKeyName] = rinfRow[oDataPkNameLocal];
                                                } else {
                                                    Log.print(Log.l.info, "RINF" + refTable + ": returned no data");
                                                    err = { status: 404, statusText: "no data found in RINF" + refTable + " for Id " + refKeyId };
                                                }
                                            } else {
                                                Log.print(Log.l.info, "RINF" + refTable + ": returned no data");
                                                err = { status: 404, statusText: "no data found in RINF" + refTable + " for Id " + refKeyId };
                                            }
                                            keysDone++;
                                            if (err) {
                                                if (that._fetchRequests[index]) {
                                                    that._fetchRequests[index].done++;
                                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                        that._fetchRequests[index].state = "finished";
                                                        that._fetchRequestsDone++;
                                                        that.checkForWaiting();
                                                    }
                                                }
                                            } else if (keysDone === refKeyIds.length) {
                                                that.updateLocalData(relation.relationName, recordId, row, index, subIndex, pollInterval);
                                            }
                                        }, function (errorResponse) {
                                            err = errorResponse;
                                            keysDone++;
                                            if (that._fetchRequests[index]) {
                                                that._fetchRequests[index].done++;
                                                if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                    that._fetchRequests[index].state = "finished";
                                                    that._fetchRequestsDone++;
                                                    that.checkForWaiting();
                                                }
                                            }
                                        }, json.d.CreatorSiteID, json.d.CreatorRecID);
                                    }
                                } else {
                                    Log.print(Log.l.info, "RINF" + refTable + ": returned no data");
                                    err = { status: 404, statusText: "no data found in RINF" + refTable + " for Id " + refKeyId };
                                    keysDone++;
                                }
                                if (err) {
                                    if (that._fetchRequests[index]) {
                                        that._fetchRequests[index].done++;
                                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                            that._fetchRequests[index].state = "finished";
                                            that._fetchRequestsDone++;
                                            that.checkForWaiting();
                                        }
                                    }
                                } else if (keysDone === refKeyIds.length) {
                                    that.updateLocalData(relation.relationName, recordId, row, index, subIndex, pollInterval);
                                }
                            }, function (errorResponse) {
                                err = errorResponse;
                                keysDone++;
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                            });
                        } else {
                            WinJS.Promise.timeout(0).then(function() {
                                keysDone++;
                                if (keysDone === refKeyIds.length) {
                                    that.updateLocalData(relation.relationName, recordId, row, index, subIndex, pollInterval);
                                }
                            });
                        }
                    }
                } else {
                    that.updateLocalData(relation.relationName, recordId, row, index, subIndex, pollInterval);
                }
                Log.ret(Log.l.trace);
            },
            selectRemoteReplicationData: function (index) {
                var j, curRecordId, curAccessStatus, remoteRecordId;
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "index=" + index);
                var that = this;
                if (!that._fetchRequests[index]) {
                    Log.ret(Log.l.error, "fetchRequests[" + index + "] does not exists");
                    return;
                }
                var relationName = that._fetchRequests[index].relationName;
                var pollInterval = that._fetchRequests[index].pollInterval;
                var recordIds = that._fetchRequests[index].recordIds;
                var localRecIds = that._fetchRequests[index].localRecIds;
                var accessStatuss = that._fetchRequests[index].accessStatuss;
                var recordIdRestriction = [];
                for (var k = 0; k < recordIds.length; k++) {
                    if (recordIds[k]) {
                        recordIdRestriction.push(recordIds[k]);
                    }
                }
                if (!recordIdRestriction.length) {
                    Log.print(Log.l.info, relationName + ": nothing to select");
                    that._fetchRequests[index].todo = recordIds.length;
                    remoteRecordId = 0;
                    for (j = 0; j < recordIds.length; j++) {
                        curRecordId = localRecIds[j];
                        curAccessStatus = accessStatuss[j] % 10;
                        Log.print(Log.l.info, relationName + ": accessStatus=" + curAccessStatus);
                        switch (curAccessStatus) {
                            case 3:
                                Log.print(Log.l.info, relationName + ": found data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                that.deleteLocalData(relationName, curRecordId, index, j);
                                break;
                            case 1:
                            case 2:
                                Log.print(Log.l.info, relationName + ": IGNORE data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].replicationDone[j] = true;
                                }
                            default:
                                if (curAccessStatus !== 1 && curAccessStatus !== 2) {
                                    Log.print(Log.l.error, relationName + ": returned invalid accessStatus=" + curAccessStatus);
                                }
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].done++;
                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                        that._fetchRequests[index].state = "finished";
                                        that._fetchRequestsDone++;
                                        that.checkForWaiting();
                                    }
                                }
                        }
                    }
                } else {
                    var pkName = relationName + "VIEWID";
                    var restriction = {};
                    restriction[pkName] = recordIdRestriction;
                    var relation = AppData.getFormatView(relationName, 0, false);
                    if (relation && that._fetchRequests && that._fetchRequests[index]) {
                        that._fetchRequests[index].state = "selecting";
                        relation.select(function (json) {
                            var localRecIdsDone = [];
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.info, relationName + ": success!");
                            if (that._fetchRequests[index]) {
                                that._fetchRequests[index].state = "selected";
                                // startContact returns object already parsed from json file in response
                                if (json && json.d && json.d.results && json.d.results.length > 0) {
                                    var results = json.d.results;
                                    that._fetchRequests[index].todo = results.length;
                                    if (results.length < recordIds.length) {
                                        Log.print(Log.l.info, relationName + ": add remotely missing entries=" + recordIds.length - results.length);
                                        that._fetchRequests[index].todo += recordIds.length - results.length;
                                    }
                                    for (var i = 0; i < results.length; i++) {
                                        var row = results[i];
                                        remoteRecordId = row[pkName];
                                        j = recordIds.indexOf(remoteRecordId);
                                        if (j >= 0) {
                                            curRecordId = localRecIds[j];
                                            curAccessStatus = accessStatuss[j] % 10;
                                            if (!curRecordId && pollInterval === 1) {
                                                curRecordId = remoteRecordId;
                                                Log.print(Log.l.info, relationName + ": accessStatus=" + curAccessStatus + " use remoteRecordId!");
                                            } else {
                                                Log.print(Log.l.info, relationName + ": accessStatus=" + curAccessStatus);
                                            }
                                            switch (curAccessStatus) {
                                                case 1:
                                                case 2:
                                                    Log.print(Log.l.info, relationName + ": found data to INSERT/UPDATE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                    that.replaceReplicationDataKeys(relation, curRecordId, remoteRecordId, row, index, j, pollInterval);
                                                    break;
                                                case 3:
                                                    Log.print(Log.l.info, relationName + ": IGNORE data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                    if (that._fetchRequests[index]) {
                                                        that._fetchRequests[index].replicationDone[j] = true;
                                                    }
                                                default:
                                                    if (curAccessStatus !== 3) {
                                                        Log.print(Log.l.error, relationName + ": returned invalid accessStatus=" + curAccessStatus);
                                                    }
                                                    if (that._fetchRequests[index]) {
                                                        that._fetchRequests[index].done++;
                                                        if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                            that._fetchRequests[index].state = "finished";
                                                            that._fetchRequestsDone++;
                                                            that.checkForWaiting();
                                                        }
                                                    }
                                            }
                                            localRecIdsDone[j] = true;
                                        } else {
                                            Log.print(Log.l.info, relationName + ": returned invalid remoteRecordId=" + remoteRecordId);
                                            if (that._fetchRequests[index]) {
                                                that._fetchRequests[index].done++;
                                                if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                    that._fetchRequests[index].state = "finished";
                                                    that._fetchRequestsDone++;
                                                    that.checkForWaiting();
                                                }
                                            }
                                        }
                                    }
                                    if (results.length < recordIds.length) {
                                        remoteRecordId = 0;
                                        for (j = 0; j < recordIds.length; j++) {
                                            if (!localRecIdsDone[j]) {
                                                curRecordId = localRecIds[j];
                                                curAccessStatus = accessStatuss[j] % 10;
                                                Log.print(Log.l.info, relationName + ": accessStatus=" + curAccessStatus);
                                                switch (curAccessStatus) {
                                                    case 3:
                                                        Log.print(Log.l.info, relationName + ": found data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                        that.deleteLocalData(relationName, curRecordId, index, j);
                                                        break;
                                                    case 1:
                                                    case 2:
                                                        Log.print(Log.l.info, relationName + ": IGNORE data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                        if (that._fetchRequests[index]) {
                                                            that._fetchRequests[index].replicationDone[j] = true;
                                                        }
                                                    default:
                                                        if (curAccessStatus !== 1 && curAccessStatus !== 2) {
                                                            Log.print(Log.l.error, relationName + ": returned invalid accessStatus=" + curAccessStatus);
                                                        }
                                                        if (that._fetchRequests[index]) {
                                                            that._fetchRequests[index].done++;
                                                            if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                                that._fetchRequests[index].state = "finished";
                                                                that._fetchRequestsDone++;
                                                                that.checkForWaiting();
                                                            }
                                                        }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    Log.print(Log.l.info, relationName + ": returned no data");
                                    that._fetchRequests[index].todo = recordIds.length;
                                    remoteRecordId = 0;
                                    for (j = 0; j < recordIds.length; j++) {
                                        curRecordId = localRecIds[j];
                                        curAccessStatus = accessStatuss[j] % 10;
                                        Log.print(Log.l.info, relationName + ": accessStatus=" + curAccessStatus);
                                        switch (curAccessStatus) {
                                            case 3:
                                                Log.print(Log.l.info, relationName + ": found data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                that.deleteLocalData(relationName, curRecordId, index, j);
                                                break;
                                            case 1:
                                            case 2:
                                                Log.print(Log.l.info, relationName + ": IGNORE data to DELETE for remote recordId=" + remoteRecordId + ", local recordId=" + curRecordId);
                                                if (that._fetchRequests[index]) {
                                                    that._fetchRequests[index].replicationDone[j] = true;
                                                }
                                            default:
                                                if (curAccessStatus !== 1 && curAccessStatus !== 2) {
                                                    Log.print(Log.l.error, relationName + ": returned invalid accessStatus=" + curAccessStatus);
                                                }
                                                if (that._fetchRequests[index]) {
                                                    that._fetchRequests[index].done++;
                                                    if (that._fetchRequests[index].done === that._fetchRequests[index].todo) {
                                                        that._fetchRequests[index].state = "finished";
                                                        that._fetchRequestsDone++;
                                                        that.checkForWaiting();
                                                    }
                                                }
                                        }
                                    }
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                            if (that._fetchRequests[index]) {
                                that._fetchRequests[index].state = "finished";
                                that._fetchRequestsDone++;
                            }
                            that.checkForWaiting();
                        }, restriction);
                    }
                }
                Log.ret(Log.l.trace);
            },
            selectLocalRinfs: function (index) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "index=" + index);
                var that = this;
                if (!that._fetchRequests[index]) {
                    Log.ret(Log.l.error, "fetchRequests[" + index + "] does not exists");
                    return;
                }
                var relationName = that._fetchRequests[index].relationName;
                var creatorSiteIds = that._fetchRequests[index].creatorSiteIds;
                var creatorRecIds = that._fetchRequests[index].creatorRecIds;
                var localRecIds = [];
                var relation = AppData.getFormatView(relationName, 0, true, false, true);
                if (relation) {
                    var rinfRelation = AppData.getFormatView("RINF" + relationName, 0, true, false, true);
                    if (rinfRelation) {
                        var restriction = {
                            bAndInEachRow: true
                        };
                        var fnSelect = function() {
                            restriction["CreatorSiteID"] = creatorSiteIds;
                            restriction["CreatorRecID"] = creatorRecIds;
                            Log.print(Log.l.info, "select local RINFs: CreatorSiteID=[" + creatorSiteIds + "] CreatorRecID=[" + creatorRecIds + "]");
                            rinfRelation.select(function(json) {
                                Log.print(Log.l.info, rinfRelation.relationName + ": success!");
                                if (that._fetchRequests[index]) {
                                    var ignoredCount = 0;
                                    var i, j, creatorSiteId, creatorRecId, modifierSiteId, modifiedTsMs, replicationFlowSpecViewId;
                                    var modifiedTsMss = that._fetchRequests[index].modifiedTsMss;
                                    var modifierSiteIds = that._fetchRequests[index].modifierSiteIds;
                                    var replicationFlowSpecViewIds = that._fetchRequests[index].replicationFlowSpecViewIds;
                                    if (json && json.d && json.d.results && json.d.results.length > 0) {
                                        Log.print(Log.l.info, "select local RINFs: " + rinfRelation.oDataPkName + "=[" + creatorRecIds + "] found results.length=" + json.d.results.length);
                                        var results = json.d.results;
                                        for (i = 0; i < creatorRecIds.length; i++) {
                                            creatorSiteId = creatorSiteIds[i];
                                            creatorRecId = creatorRecIds[i];
                                            modifierSiteId = modifierSiteIds[i];
                                            modifiedTsMs = modifiedTsMss[i];
                                            replicationFlowSpecViewId = replicationFlowSpecViewIds[i];
                                            if (creatorSiteId === AppData._persistentStates.odata.dbSiteId) {
                                                localRecIds[i] = creatorRecId;
                                            } else {
                                                localRecIds[i] = 0;
                                            }
                                            for (j = 0; j < results.length; j++) {
                                                var row = results[j];
                                                if (row.CreatorSiteID === creatorSiteId && row.CreatorRecID === creatorRecId) {
                                                    var msString = row.ModifiedTS.replace("\/Date(", "").replace(")\/", "");
                                                    var milliseconds = parseInt(msString);
                                                    if (row.ModifierSiteID === AppData._persistentStates.odata.dbSiteId &&
                                                        modifierSiteId !== AppData._persistentStates.odata.dbSiteId) {
                                                        Log.print(Log.l.info, "subtract timeZoneRemoteDiffMs=" + AppData.appSettings.odata.timeZoneRemoteDiffMs + " from local ModifiedTS!");
                                                        milliseconds -= AppData.appSettings.odata.timeZoneRemoteDiffMs;
                                                    }
                                                    if (milliseconds >= modifiedTsMs) {
                                                        Log.print(Log.l.info, "extra ignored: creatorSiteId=" + creatorSiteId + " creatorRecId=" + creatorRecId +
                                                            " local ModifierSiteID=" + row.ModifierSiteID + " remote ModifierSiteID=" + modifierSiteId +
                                                            " local milliseconds=" + milliseconds + " remote milliseconds=" + modifiedTsMs);
                                                        //if (!that._fetchNext && replicationFlowSpecViewId > that._replPrevFlowSpecId) {
                                                        //    that._replPrevFlowSpecId = replicationFlowSpecViewId;
                                                        //}
                                                        localRecIds[i] = 0;
                                                        that._fetchRequests[index].replicationDone[i] = true;
                                                        that._fetchRequests[index].creatorSiteIds[i] = 0;
                                                        that._fetchRequests[index].creatorRecIds[i] = 0;
                                                        that._fetchRequests[index].recordIds[i] = 0;
                                                        ignoredCount++;
                                                   } else {
                                                        if (!localRecIds[i]) {
                                                            var localRecordId = row[rinfRelation.oDataPkName];
                                                            localRecIds[i] = localRecordId;
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        for (i = 0; i < creatorRecIds.length; i++) {
                                            creatorSiteId = creatorSiteIds[i];
                                            creatorRecId = creatorRecIds[i];
                                            if (creatorSiteId === AppData._persistentStates.odata.dbSiteId) {
                                                localRecIds[i] = creatorRecId;
                                            } else {
                                                localRecIds[i] = 0;
                                            }
                                        }
                                    }
                                    if (ignoredCount === creatorRecIds.length) {
                                        Log.print(Log.l.info, "select local RINFs: all results ignored!");
                                        if (that._fetchRequests[index]) {
                                            that._fetchRequests[index].state = "finished";
                                            that._fetchRequestsDone++;
                                        }
                                        that.checkForWaiting();
                                    } else {
                                        Log.print(Log.l.info, "select local RINFs: calling selectRemoteReplicationData");
                                        that._fetchRequests[index].localRecIds = localRecIds;
                                        that.selectRemoteReplicationData(index);
                                    }
                                }
                            },
                            function(errorResponse) {
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].state = "finished";
                                    that._fetchRequestsDone++;
                                }
                                that.checkForWaiting();
                            },
                            restriction,
                            { ordered: true });
                        }
                        if (!rinfRelation.attribSpecs || !rinfRelation.attribSpecs.length) {
                            rinfRelation.getAttribSpecs(rinfRelation, fnSelect, null, function(errorResponse) {
                                Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                                if (that._fetchRequests[index]) {
                                    that._fetchRequests[index].state = "finished";
                                    that._fetchRequestsDone++;
                                }
                                that.checkForWaiting();
                            });
                        } else {
                            fnSelect();
                        }
                    } else {
                        Log.print(Log.l.error, "relationName=RINF" + relationName + " does not exist");
                        if (that._fetchRequests[index]) {
                            that._fetchRequests[index].state = "finished";
                            that._fetchRequestsDone++;
                        }
                        that.checkForWaiting();
                    }
                } else {
                    Log.print(Log.l.error, "relationName=" + relationName + " does not exist");
                    if (that._fetchRequests[index]) {
                        that._fetchRequests[index].state = "finished";
                        that._fetchRequestsDone++;
                    }
                    that.checkForWaiting();
                }
                Log.ret(Log.l.trace);
            },
            createReplicationDataRestriction: function (results) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var prevRelationName = null;
                var prevReplicationType = 0;
                var prevPollInterval = null;
                var numRows = 0;
                var recordIds = [];
                var creatorSiteIds = [];
                var creatorRecIds = [];
                var creationTsMss = [];
                var modifierSiteIds = [];
                var modifiedTsMss = [];
                var replicationFlowSpecViewIds = [];
                var replicationDone = [];
                var modifiedDocTsMss = [];
                var modifierDescriptions = [];
                var accessStatuss = [];
                var that = this;
                var length = results.length;
                for (var i = 0; i < length; i++) {
                    var row = results[i];
                    var msString = row.ModifiedTS.replace("\/Date(", "").replace(")\/", "");
                    var milliseconds = parseInt(msString);
                    if (AppData.appSettings.odata.timeZoneRemoteAdjustment) {
                        milliseconds -= AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                    }
                    var millisecondsDocTs = null;
                    var millisecondsCreationTs = null;
                    if (row.ModifiedDocTS) {
                        msString = row.ModifiedDocTS.replace("\/Date(", "").replace(")\/", "");
                        millisecondsDocTs = parseInt(msString);
                        if (AppData.appSettings.odata.timeZoneRemoteAdjustment) {
                            millisecondsDocTs -= AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                        }
                    }
                    if (row.CreationTS) {
                        msString = row.CreationTS.replace("\/Date(", "").replace(")\/", "");
                        millisecondsCreationTs = parseInt(msString);
                        if (AppData.appSettings.odata.timeZoneRemoteAdjustment) {
                            millisecondsCreationTs -= AppData.appSettings.odata.timeZoneRemoteAdjustment * 60000;
                        }
                    }
                    if (AppData.appSettings.odata.replMaxFetchedModifiedMs &&
                        milliseconds <= AppData.appSettings.odata.replMaxFetchedModifiedMs - AppData.appSettings.odata.timeZoneRemoteDiffMs) {
                        Log.print(Log.l.info, "ReplicationFlowSpecExtView: extra data ignored milliseconds=" + milliseconds);
                    } else {
                        if (i < length - 1 && (results[i + 1].RelationName === row.RelationName && results[i + 1].RecordID === row.RecordID)) {
                            Log.print(Log.l.info, "extra ignored: " + row.RelationName + " RecordID=" + row.RecordID);
                        } else if (prevRelationName && (row.RelationName !== prevRelationName || numRows === 50)) {
                            Log.print(Log.l.info, "new relation: " + row.RelationName + " RecordID=" + row.RecordID);
                            that._fetchRequests.push({
                                state: "created",
                                todo: 0,
                                done: 0,
                                relationName: prevRelationName,
                                replicationType: prevReplicationType,
                                pollInterval: prevPollInterval,
                                recordIds: recordIds,
                                creatorSiteIds: creatorSiteIds,
                                creatorRecIds: creatorRecIds,
                                creationTsMss: creationTsMss,
                                modifierSiteIds: modifierSiteIds,
                                modifiedTsMss: modifiedTsMss,
                                replicationFlowSpecViewIds: replicationFlowSpecViewIds,
                                replicationDone: replicationDone,
                                modifiedDocTsMss: modifiedDocTsMss,
                                modifierDescriptions: modifierDescriptions,
                                accessStatuss: accessStatuss
                            });
                            recordIds = [row.RecordID];
                            creatorSiteIds = [row.CreatorSiteID];
                            creatorRecIds = [row.CreatorRecID];
                            creationTsMss = [millisecondsCreationTs];
                            modifierSiteIds = [row.ModifierSiteID];
                            modifiedTsMss = [milliseconds];
                            replicationFlowSpecViewIds = [row.ReplicationFlowSpecVIEWID];
                            replicationDone = [false];
                            modifiedDocTsMss = [millisecondsDocTs];
                            modifierDescriptions = [row.ModifierDescription];
                            accessStatuss = [row.AccessStatus];
                            prevRelationName = row.RelationName;
                            prevReplicationType = row.ReplicationType;
                            prevPollInterval = row.PollInterval;
                            numRows = 1;
                            if (i === length - 1) {
                                that._fetchRequests.push({
                                    state: "created",
                                    todo: 0,
                                    done: 0,
                                    relationName: prevRelationName,
                                    replicationType: prevReplicationType,
                                    pollInterval: prevPollInterval,
                                    recordIds: recordIds,
                                    creatorSiteIds: creatorSiteIds,
                                    creatorRecIds: creatorRecIds,
                                    creationTsMss: creationTsMss,
                                    modifierSiteIds: modifierSiteIds,
                                    modifiedTsMss: modifiedTsMss,
                                    replicationFlowSpecViewIds: replicationFlowSpecViewIds,
                                    replicationDone: replicationDone,
                                    modifiedDocTsMss: modifiedDocTsMss,
                                    modifierDescriptions: modifierDescriptions,
                                    accessStatuss: accessStatuss
                                });
                            }
                        } else if (i === length - 1) {
                            Log.print(Log.l.info, "final record: " + row.RelationName + " RecordID=" + row.RecordID);
                            recordIds.push(row.RecordID);
                            creatorSiteIds.push(row.CreatorSiteID);
                            creatorRecIds.push(row.CreatorRecID);
                            creationTsMss.push(millisecondsCreationTs);
                            modifierSiteIds.push(row.ModifierSiteID);
                            modifiedTsMss.push(milliseconds);
                            replicationFlowSpecViewIds.push(row.ReplicationFlowSpecVIEWID);
                            replicationDone.push(false);
                            modifiedDocTsMss.push(millisecondsDocTs);
                            modifierDescriptions.push(row.ModifierDescription);
                            accessStatuss.push(row.AccessStatus);
                            prevRelationName = row.RelationName;
                            prevReplicationType = row.ReplicationType;
                            prevPollInterval = row.PollInterval;
                            numRows++;
                            that._fetchRequests.push({
                                state: "created",
                                todo: 0,
                                done: 0,
                                relationName: prevRelationName,
                                replicationType: prevReplicationType,
                                pollInterval: prevPollInterval,
                                recordIds: recordIds,
                                creatorSiteIds: creatorSiteIds,
                                creatorRecIds: creatorRecIds,
                                creationTsMss: creationTsMss,
                                modifierSiteIds: modifierSiteIds,
                                modifiedTsMss: modifiedTsMss,
                                replicationFlowSpecViewIds: replicationFlowSpecViewIds,
                                replicationDone: replicationDone,
                                modifiedDocTsMss: modifiedDocTsMss,
                                modifierDescriptions: modifierDescriptions,
                                accessStatuss: accessStatuss
                            });
                        } else {
                            Log.print(Log.l.info, "collecting: " + row.RelationName + " RecordID=" + row.RecordID);
                            recordIds.push(row.RecordID);
                            creatorSiteIds.push(row.CreatorSiteID);
                            creatorRecIds.push(row.CreatorRecID);
                            creationTsMss.push(millisecondsCreationTs);
                            modifierSiteIds.push(row.ModifierSiteID);
                            modifiedTsMss.push(milliseconds);
                            replicationFlowSpecViewIds.push(row.ReplicationFlowSpecVIEWID);
                            replicationDone.push(false);
                            modifiedDocTsMss.push(millisecondsDocTs);
                            modifierDescriptions.push(row.ModifierDescription);
                            accessStatuss.push(row.AccessStatus);
                            prevRelationName = row.RelationName;
                            prevReplicationType = row.ReplicationType;
                            prevPollInterval = row.PollInterval;
                            numRows++;
                        }
                    }
                }
                // should never happen!
                if (that._fetchRequestsDone < 0) {
                    that._fetchRequestsDone = 0;
                }
                Log.ret(Log.l.trace);
            },
            selectNextRemoteReplicationFlowSpec: function (nextUrl) {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var that = this;
                if (nextUrl) {
                    var user = AppData.getOnlineLogin();
                    var password = AppData.getOnlinePassword();
                    var options = {
                        type: "GET",
                        url: nextUrl,
                        user: user,
                        password: password,
                        customRequestInitializer: function (req) {
                            if (typeof req.withCredentials !== "undefined") {
                                req.withCredentials = true;
                            }
                        },
                        headers: {
                            "Authorization": "Basic " + btoa(user + ":" + password)
                        }
                    };
                    Log.print(Log.l.info, "calling xhr method=GET url=" + nextUrl);
                    WinJS.xhr(options).then(function(response) {
                        Log.print(Log.l.trace, "success!");
                        try {
                            var obj = jsonParse(response.responseText);
                            if (obj && obj.d) {
                                if (obj.d.results && obj.d.results.length > 0) {
                                    that.createReplicationDataRestriction(obj.d.results);
                                }
                                var next = that.getNextUrl(obj);
                                that.selectNextRemoteReplicationFlowSpec(next);
                                if (!next) {
                                    that._fetchNext = null;
                                }
                            } else {
                                Log.print(Log.l.info, "selectNextRemoteReplicationFlowSpec: returned no data");
                                that._fetchNext = null;
                            }
                        } catch (exception) {
                            Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        }
                        return WinJS.Promise.as();
                    }, function(errorResponse) {
                        Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                    });
                } else {
                    var curFetchRequest = that._fetchRequests[that._fetchRequestsCurrent];
                    if (curFetchRequest) {
                        Log.print(Log.l.info, "working on fetchRequests[" + that._fetchRequestsCurrent + "].relationName=" + that._fetchRequests[that._fetchRequestsCurrent].relationName);
                        if (that._fetchRequestsCurrent > 0) {
                            for (var i = that._fetchRequestsCurrent - 1; i >= 0; i--) {
                                if (that._fetchRequests[i] &&
                                    that._fetchRequests[i].replicationType < curFetchRequest.replicationType &&
                                    that._fetchRequests[i].state !== "finished") {
                                    Log.print(Log.l.info, curFetchRequest.relationName + " blocked by request[" + i + "] relationName=" + that._fetchRequests[i].relationName +
                                        " in state=" + that._fetchRequests[i].state + " - so try later again!");
                                    WinJS.Promise.timeout(250).then(function() {
                                        that.selectNextRemoteReplicationFlowSpec();
                                    });
                                    Log.ret(Log.l.trace);
                                    return;
                                }
                            }
                        }
                        that.selectLocalRinfs(that._fetchRequestsCurrent);
                        that._fetchRequestsCurrent++;
                        if (that._fetchRequestsCurrent < that._fetchRequests.length) {
                            WinJS.Promise.timeout(0).then(function () {
                                that.selectNextRemoteReplicationFlowSpec();
                            });
                        }
                    }
                }
                Log.ret(Log.l.trace);
            },
            selectRemoteReplicationFlowSpec: function () {
                Log.call(Log.l.trace, "AppRepl.DbReplicator.", "");
                var that = this;
                if (!AppData.appSettings.odata.replPrevFlowSpecId && !AppData.appSettings.odata.replPrevSelectMs) {
                    Log.ret(Log.l.info, "no restriction set yet - try later!");
                    return WinJS.Promise.as();
                }
                // preset _fetchRequestsDone = -1 while in select 
                // to avoid exit condition in checkForWaiting()
                // will be reset after select
                this._fetchRequestsDone = -1;
                this._fetchNext = null;
                this._fetchRequests = [];
                this._fetchRequestsCurrent = 0;
                this._now = new Date();
                this._replPrevSelectMs = AppData.appSettings.odata.replPrevSelectMs;
                this._replPrevPostMs = AppData.appSettings.odata.replPrevPostMs;
                this._replPrevFlowSpecId = AppData.appSettings.odata.replPrevFlowSpecId;
                var timeZoneRemoteAdjustment, replMaxFetchedModifiedSeconds;
                var url = AppData.getBaseURL(AppData.appSettings.odata.onlinePort) + "/" + AppData.appSettings.odata.onlinePath;
                    url += "/PRC_GetReplicationFlowSpecExt?pCreatorSiteID=" + AppData._persistentStates.odata.dbSiteId;
                    if (AppData.appSettings.odata.callerAddress) {
                        url += "&pCallerAddress='" + AppData.appSettings.odata.callerAddress + "'";
                    }
                    if (AppData.appSettings.odata.replPrevSelectMs) {
                        timeZoneRemoteAdjustment = AppData.appSettings.odata.timeZoneRemoteAdjustment || 0;
                        replMaxFetchedModifiedSeconds = Math.floor((AppData.appSettings.odata.replPrevSelectMs + timeZoneRemoteAdjustment * 60000) / 1000);
                        url += "&pReplicationFlowSpecVIEWID=" + AppData.appSettings.odata.replPrevFlowSpecId +
                            "&pModifiedSeconds=" + replMaxFetchedModifiedSeconds + "&$format=json";
                    } else if (AppData.appSettings.odata.replPrevFlowSpecId) {
                        url += "&pReplicationFlowSpecVIEWID=" + AppData.appSettings.odata.replPrevFlowSpecId + "&$format=json";
                    }
                var user = AppData.getOnlineLogin();
                var password = AppData.getOnlinePassword();
                var options = {
                    type: "GET",
                    url: url,
                    user: user,
                    password: password,
                    customRequestInitializer: function (req) {
                        if (typeof req.withCredentials !== "undefined") {
                            req.withCredentials = true;
                        }
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(user + ":" + password)
                    }
                };
                Log.print(Log.l.info, "calling xhr method=GET url=" + url);
                var ret = WinJS.xhr(options).then(function (responseAttribSpec) {
                    Log.print(Log.l.info, "ReplicationFlowSpecExtView: success!");
                    if (!that._prcCallFailed) {
                        that._prcCallSuccess = true;
                    }
                    try {
                        var obj = jsonParse(responseAttribSpec.responseText);
                        if (obj && obj.d) {
                            if (obj.d.__next) {
                                that._fetchNext = that.getNextUrl(obj);
                            }
                            if (obj.d.results && obj.d.results.length > 0) {
                                Log.print(Log.l.info, "ReplicationFlowSpecExtView: returned length=" + obj.d.results.length);
                                that.createReplicationDataRestriction(obj.d.results);
                                that.selectNextRemoteReplicationFlowSpec(that._fetchNext);
                            } else {
                                that._fetchRequestsDone = 0;
                                Log.print(Log.l.info, "ReplicationFlowSpecExtView: returned results.length=0");
                            }
                        } else {
                            that._fetchRequestsDone = 0;
                            Log.print(Log.l.info, "ReplicationFlowSpecExtView: returned no data");
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "resource parse error " + (exception && exception.message));
                        that._fetchRequestsDone = 0;
                    }
                    that.checkForWaiting();
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    Log.print(Log.l.error, "error status=" + errorResponse.status + " statusText=" + errorResponse.statusText);
                    if (that.networkstate !== "Unknown" && that.networkstate !== "Offline") {
                        if (!that._prcCallFailed && !that._prcCallSuccess) {
                            that._prcCallFailed = true;
                        }
                    }
                    that._fetchRequestsDone = 0;
                    that.checkForWaiting();
                    return WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            },
            _startMsFastReq: 0,
            run: function (numFastReqs) {
                var that = this;
                if (!numFastReqs) {
                    numFastReqs = this._numFastReqs;
                }
                var timeout = AppData._persistentStates.odata.replInterval || replInterval;
                if (numFastReqs > 0) {
                    var timeMs = 0;
                    if (numFastReqs === AppData._persistentStates.odata.numFastReqs) {
                        this._startMsFastReq = Date.now();
                    } else if (this._startMsFastReq) {
                        timeMs = Date.now() - that._startMsFastReq;
                    }
                    numFastReqs--;
                    if (numFastReqs > 0 && timeout > (AppData._persistentStates.odata.replIntervalFastReqs || replIntervalFastReqs)) {
                        timeout = getFastReqInterval(numFastReqs);
                        //(AppData._persistentStates.odata.replIntervalFastReqs || replIntervalFastReqs);
                    }
                    Application.reflectFastReq(numFastReqs ? Math.round(timeMs / 10) / 100 : 0);
                    this._numFastReqs = numFastReqs;
                }
                this._timeout = timeout;
                Log.call(Log.l.info, "AppRepl.DbReplicator.", "state=" + this.state + " numFastReqs=" + numFastReqs + " timeout=" + timeout);
                if (!this._db /*this.state === "error"*/) {
                    Log.print(Log.l.info, "Fatal Error occured - no db connection!!");
                    this._stop = false;
                    this._promise = null;
                    this._prcCallFailed = false;
                } else if (this._stop) {
                    Log.print(Log.l.info, "stop=" + this._stop + " - so stop!");
                    this._state = "stopped";
                    this._stop = false;
                    this._promise = null;
                    this._prcCallFailed = false;
                } else if (!AppData._persistentStates.odata.replActive) {
                    Log.print(Log.l.info, "replActive=" + AppData._persistentStates.odata.replActive + " - so stop!");
                    this._state = "stopped";
                    this._stop = false;
                    this._promise = null;
                    this._prcCallFailed = false;
                } else if (this.state === "running" && !numFastReqs) {
                    Log.print(Log.l.info, "still running - try later!");
                } else {
                    if (this._promise) {
                        if (typeof this._promise.cancel === "function") {
                            Log.print(Log.l.info, "AppRepl.DbReplicator.run: cancel prev. promise!");
                            this._promise.cancel();
                        }
                    }
                    that._promise = new WinJS.Promise.as().then(function () {
                        if (that.state === "running") {
                            Log.print(Log.l.info, "AppRepl.DbReplicator.run: still running - try later!");
                            return WinJS.Promise.as();
                        }
                        if (!AppData._dbInit || !AppData._dbInit.configLoaded) {
                            Log.print(Log.l.info, "AppRepl.DbReplicator.run: local DB not yet initialized - try later!");
                            return WinJS.Promise.as();
                        }
                        if (AppData.appSettings.odata.timeZoneRemoteAdjustment === null) {
                            Log.print(Log.l.info, "AppRepl.DbReplicator.run: no remote time zone information yet - try later!");
                            return WinJS.Promise.as();
                        }
                        if (!AppData.appSettings.odata.login ||
                            !AppData.appSettings.odata.password ||
                            !AppData.appSettings.odata.dbSiteId) {
                            Log.print(Log.l.info, "AppRepl.DbReplicator.run: no logon settings supplied - try later!");
                            return WinJS.Promise.as();
                        }
                        var ret;
                        switch (that.networkstate) {
                            case "Unknown":
                            case "Offline":
                                Log.print(Log.l.info, "no network connextion - try later!");
                                ret = WinJS.Promise.as();
                                that._prcCallFailed = false;
                                break;
                            default:
                                Log.print(Log.l.info, "active network connection - go on!");
                                that._state = "running";
                                ret = that.selectReplicationFlowSpec().then(function() {
                                    if (AppData.appSettings.odata.replErrorTimestamp && that._state !== "error") {
                                        Log.print(Log.l.info, "reset replErrorTimestamp!");
                                        AppData.appSettings.odata.replErrorTimestamp = null;
                                        Application.pageframe.savePersistentStates();
                                    }
                                });
                        }
                        if (!ret) {
                            ret = WinJS.Promise.as();
                        }
                        return ret;
                    }).then(function () {
                        Log.print(Log.l.info, "AppRepl.DbReplicator.run: Now, wait for timeout=" + that._timeout + "s");
                        return WinJS.Promise.timeout(Math.floor(that._timeout * 1000)).then(function () {
                            that.run(numFastReqs);
                        });
                    });
                }
                if (!this._promise && this.state !== "stopped") {
                    Log.print(Log.l.info, "AppRepl.DbReplicator.run: state=" + this.state + " Now, wait for timeout=" + this._timeout + "s");
                    this._promise = WinJS.Promise.timeout(Math.floor(this._timeout * 1000)).then(function () {
                        that.run(numFastReqs);
                    });
                }
                Log.ret(Log.l.info);
                return this._promise;
            }
        }),
        _replicator: null,
        replicator: {
            get: function() {
                return AppRepl._replicator;
            }
        }
    });
})();
