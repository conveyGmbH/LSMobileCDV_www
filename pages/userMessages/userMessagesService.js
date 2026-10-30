// service for page: event
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    var namespaceName = "UserMessages";

    WinJS.Namespace.define("UserMessages", {
        _userMessageTable: {
            get: function () {
                return AppData.getFormatView("BenutzerNachricht", 0, false);
            }
        },
        userMessageView: {
            select: function(complete, error, restriction, options) {
                if (!restriction) {
                    restriction = {
                        InfoText: "NOT NULL"
                    };
                }
                if (!options) {
                    options = {
                        ordered: true,
                        orderAttribute: "SendTS",
                        desc: true
                    };
                }
                Log.call(Log.l.trace, namespaceName + ".userMessageView.", "restriction=" + JSON.stringify(restriction));
                var ret = UserMessages._userMessageTable.select(complete, error, restriction, options);
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, namespaceName + ".userMessageTable.");
                var ret = UserMessages._userMessageTable.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function(response) {
                Log.call(Log.l.trace, namespaceName + ".userMessageView.");
                var ret = UserMessages._userMessageTable.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function(complete, error, response, nextUrl) {
                Log.call(Log.l.trace, namespaceName + ".userMessageView.");
                var ret = UserMessages._userMessageTable.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            get relationName() {
                return UserMessages._userMessageTable.relationName;
            },
            get pkName() {
                return UserMessages._userMessageTable.oDataPkName;
            },
            getRecordId: function (record) {
                var ret = null;
                if (record) {
                    if (UserMessages._userMessageTable.oDataPkName) {
                        ret = record[UserMessages._userMessageTable.oDataPkName];
                    }
                    if (!ret && UserMessages._userMessageTable.pkName) {
                        ret = record[UserMessages._userMessageTable.pkName];
                    }
                }
                return ret;
            }
        }
    });
})();


