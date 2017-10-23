// service for page: questionnaire
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("QuestionnaireRemote", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0, false);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "QuestionnaireRemote.contactView.");
                var ret = QuestionnaireRemote._contactView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _questionnaireView20433: {
            get: function () {
                var ret = AppData.getFormatView("Zeilenantwort", 20433, false);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        _questionnaireView: {
            get: function () {
                return AppData.getFormatView("Zeilenantwort", 0, false);
            }
        },
        questionnaireView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireView.");
                var ret = QuestionnaireRemote._questionnaireView20433.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Sortierung"
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireView.");
                var ret = QuestionnaireRemote._questionnaireView20433.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireView.");
                var ret = QuestionnaireRemote._questionnaireView20433.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireView.");
                var ret = QuestionnaireRemote._questionnaireView.update(complete, error, recordId, viewResponse);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;

            }
        },
        _questionnaireDocView: {
            get: function () {
                return AppData.getFormatView("DOC1Zeilenantwort", 0, false);
            }
        },
        questionnaireDocView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireDocView.");
                var ret = QuestionnaireRemote._questionnaireDocView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "QuestionnaireRemote.questionnaireDocView.");
                var ret = QuestionnaireRemote._questionnaireDocView.insertWithId(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _CR_VERANSTOPTION_View: {
            get: function () {
                return AppData.getFormatView("CR_VERANSTOPTION", 0);
            }
        },
        CR_VERANSTOPTION_ODataView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "CR_VERANSTOPTION_ODataView.");
                var ret = QuestionnaireRemote._CR_VERANSTOPTION_View.select(complete,
                    error,
                    restriction,
                    {
                        ordered: true,
                        orderAttribute: "INITOptionTypeID"
                    });
                Log.ret(Log.l.trace);
                return ret;

            }
        }
    });
})();
