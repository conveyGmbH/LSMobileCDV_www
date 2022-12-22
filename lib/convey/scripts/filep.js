// file reader capsulated in Promise
/// <reference path="../../../lib/WinJS/scripts/base.js" />
/// <reference path="../../../lib/convey/scripts/logging.js" />

/**
 * Use the functions in this namespace to read file encapsulated in a WinJS Promise Object.
 * @namespace FileP
 */

(function () {
    "use strict";


    WinJS.Utilities._require([
        'WinJS/Core/_Global',
        'WinJS/Core/_Base',
        'WinJS/Promise',
        'WinJS/Scheduler'
    ], function fileInit(_Global, _Base, Promise, Scheduler) {
        "use strict";

        function schedule(f, arg, priority) {
            Scheduler.schedule(function file_callback() {
                f(arg);
            }, priority, null, "FileP.file");
        }

        /**
         * @function readFile
         * @param {Object} file - file opened by fileEntry.file(). 
         * @returns {Object} A {@link https://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx WinJS.Promise} object that returns the response object when it completes.
         * @description Use this function to decompress a buffer.
         */
        function read(file) {
            var run;
            return new Promise(
                function (c, e, p) {
                    var priority = Scheduler.currentPriority;
                    run = function (that) {
                        var reader = new FileReader();
                        reader.onerror = function(err) {
                            Log.print(Log.l.error, "Failed read file " + JSON.stringify(err));
                            schedule(e, err, priority);
                        };
                        reader.onloadend = function() {
                            Log.print(Log.l.info, "Successful file read!");
                            schedule(c, reader.result, priority);
                        };
                        reader.readAsArrayBuffer(file);
                    }
                    schedule(run, this, priority);
                }
            );
        }

        WinJS.Namespace.define("FileP", {
            read: read
        });
    });

})();