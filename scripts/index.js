﻿// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
/// <reference path="~/www/lib/WinJS/scripts/base.min.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/navigator.js" />
/// <reference path="~/www/lib/convey/scripts/pageFrame.js" />
/// <reference path="~/www/scripts/generalData.js" />

(function() {
    "use strict";

    // default settings
    AppData.persistentStatesDefaults = {
        colorSettings: {
            // navigation-color with 100% saturation and brightness
            accentColor: "#ff3c00"
        },
        showAppBkg: false,
        cameraQuality: 50,
        cameraUseGrayscale: true,
        cameraMaxSize: 2560,
        useClippingCamera: false,
        autoShutterTime: 0,
        useBarcodeActivity: false,
        logEnabled: false,
        logLevel: 3,
        logGroup: false,
        logNoStack: true,
        prevNavigateNewId: "newContact",
        inputBorder: 1,
        odata: {
            https: true,
            hostName: "leadsuccess.convey.de",
            //https: false,
            //hostName: "deimos.convey.de",
            onlinePort: 8090,
            urlSuffix: null,
            onlinePath: "odata_online", // serviceRoot online requests
            login: "",
            password: "",
            privacyPolicyFlag: false,
            privacyPolicydisabled: true,
            registerPath: "odata_register", // serviceRoot register requests
            registerLogin: "AppRegister",
            registerPassword: "6530bv6OIUed3",
            useOffline: true,
            replActive: true,
            replInterval: 30,
            replPrevPostMs: 0,
            replPrevSelectMs: 0,
            replPrevFlowSpecId: 0,
            dbSiteId: 0,
            serverSiteId: 1,
            timeZoneAdjustment: 0,
            timeZoneRemoteAdjustment: null,
            timeZoneRemoteDiffMs: 0,
            serverFailure: true
        }
    };

    // static array of menu groups for the split view pane
    Application.navigationBarGroups = [
        { id: "start", group: 1, svg: "home", disabled: false },
        { id: "search", group: 2, svg: "magnifying_glass", disabled: false },
        { id: "info", group: 3, svg: "gearwheel", disabled: false }
    ];

    // static array of pages for the navigation bar 
    Application.navigationBarPages = [
        { id: "start", group: -6, disabled: false },
        { id: "contact", group: 1, disabled: false },
        { id: "questionnaire", group: 1, disabled: false },
        { id: "sketch", group: 1, disabled: false },
        { id: "listLocal", group: 2, disabled: false },
        { id: "listRemote", group: 2, disabled: false },
        { id: "search", group: 2, disabled: false },
        { id: "info", group: 3, disabled: false },
        { id: "settings", group: 3, disabled: false },
        { id: "account", group: 3, disabled: false },
        { id: "login", group: 4, disabled: false },
        { id: "register", group: 4, disabled: false },
        { id: "recover", group: 4, disabled: false },
        { id: "contactRemote", group: 5, disabled: false },
        { id: "questionnaireRemote", group: 5, disabled: false },
        { id: "sketchRemote", group: 5, disabled: false }
    ];

    // init page for app startup
    Application.initPage = Application.getPagePath("dbinit");
    // home page of app
    Application.startPage = Application.getPagePath("start");

    // new contact function select feature:
    Application.prevNavigateNewId = "newContact";
    // some more default page navigation handling
    Application.navigateByIdOverride = function (id, event) {
        Log.call(Log.l.trace, "Application.", "id=" + id);
        if (id === "newContact") {
            Application.prevNavigateNewId = id;
            Log.print(Log.l.trace, "reset contact Id");
            AppData.setRecordId("Kontakt", 0);
            id = "contact";
            Log.print(Log.l.trace, "new page id=" + id);
            if (Application.navigator._lastPage === Application.getPagePath(id)) {
                Log.print(Log.l.trace, "force navigation to " + id + " page!");
                Application.navigator._lastPage = "";
            }
        } else if (id === "camera" || id === "barcode") {
            Application.prevNavigateNewId = id;
        } else if (id === "newAccount") {
            id = "account";
        } else if (id === "questionnaire") {
            for (var i = 0; i < Application.navigationBarPages.length; i++) {
                if (Application.navigationBarPages[i].id === id) {
                    if (Application.navigationBarPages[i].disabled === true) {
                        id = "sketch";
                        return Application.navigateByIdOverride(id);
                    }
                }
            }  
        } else if (id === "sketch") {
            for (var y = 0; y < Application.navigationBarPages.length; y++) {
                if (Application.navigationBarPages[y].id === id) {
                    if (Application.navigationBarPages[y].disabled === true) {
                        id = "start";
                        break;
                    }
                }
            }
        }
        if (id === "start") {
            if (typeof device === "object" && device.platform === "Android" &&
                AppData.generalData.useBarcodeActivity &&
                !Barcode.listening) {
                WinJS.Promise.timeout(0).then(function() {
                    Barcode.startListen();
                });
            }
        }
        Log.ret(Log.l.trace);
        return id;
    };

    NavigationBar._vertWidth = 188;

    // initiate the page frame class
    var pageframe = new Application.PageFrame();
})();

