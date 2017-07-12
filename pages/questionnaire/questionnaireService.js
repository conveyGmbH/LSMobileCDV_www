// service for page: questionnaire
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Questionnaire", {
        _contactView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "Questionnaire.contactView.");
                var ret = Questionnaire._contactView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _questionnaireView20433: {
            get: function () {
                return AppData.getFormatView("Zeilenantwort", 20433);
            }
        },
        _questionnaireView: {
            get: function () {
                return AppData.getFormatView("Zeilenantwort", 0);
            }
        },
        questionnaireView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireView.");
                var ret = Questionnaire._questionnaireView20433.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Sortierung"
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireView.");
                var ret = Questionnaire._questionnaireView20433.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireView.");
                var ret = Questionnaire._questionnaireView20433.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireView.");
                var ret = Questionnaire._questionnaireView.update(complete, error, recordId, viewResponse);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;

            }
        },
        _questionnaireDocView: {
            get: function () {
                return AppData.getFormatView("DOC1Zeilenantwort", 0);
            }
        },
        questionnaireDocView: {
            select: function (complete, error, recordId) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireDocView.");
                var ret = Questionnaire._questionnaireDocView.selectById(complete, error, recordId);
                Log.ret(Log.l.trace);
                return ret;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "Questionnaire.questionnaireDocView.");
                var ret = Questionnaire._questionnaireDocView.insertWithId(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();
