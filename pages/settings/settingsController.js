﻿// controller for page: settings
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/colors.js" />
/// <reference path="~/www/lib/convey/scripts/colorPicker.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/settings/settingsService.js" />
/// <reference path="~/plugins/cordova-plugin-device/www/device.js" />
/// <reference path="~/plugins/cordova-plugin-fullscreen/www/AndroidFullScreen.js" />

(function () {
    "use strict";
    WinJS.Namespace.define("Settings", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Settings.Controller.");

            var isAndroid = false;
            if (typeof device === "object" && typeof device.platform === "string") {
                if (device.platform === "Android") {
                    isAndroid = true;
                }
            }
            Application.Controller.apply(this, [pageElement, {
                isAndroid: isAndroid,
                showSettingsFlag: null,
                themeId: 2
            }, commandList]);

            var themeSelect = pageElement.querySelector("#themeSelect");

            var that = this;

            this.dispose = function () {
                var colorContainers = pageElement.querySelectorAll(".color_container");
                if (colorContainers) {
                    for (var i = 0; i < colorContainers.length; i++) {
                        var colorContainer = colorContainers[i];
                        if (colorContainer && colorContainer.colorPicker &&
                            typeof colorContainer.colorPicker._dispose === "function") {
                            colorContainer.colorPicker._dispose();
                            colorContainer.colorPicker = null;
                        }
                    }
                }
            }

            var createColorPicker = function (colorProperty) {
                Log.call(Log.l.trace, "Settings.Controller.");
                var id = "#" + colorProperty + "_picker";
                var element = pageElement.querySelector(id);
                if (element) {
                    element.innerHTML = "";
                    var colorPicker = new ColorPicker.ColorPickerClass(
                        element, 10, 28,
                        Colors[colorProperty],
                        function (color) { // callback function for change of color property!
                            if (this.triggerElement) {
                                if (this.triggerElement && this.triggerElement.style) {
                                    if (colorProperty === "textColor") {
                                        this.triggerElement.style.borderColor = color;
                                    } else {
                                        this.triggerElement.style.borderColor = Colors.textColor;
                                    }
                                }
                            }
                            that.changeColorSetting(colorProperty, color);
                        }
                    );
                    var triggerElement = colorPicker.triggerElement;
                    if (triggerElement && triggerElement.style) {
                        triggerElement.style.borderColor = Colors.textColor;
                    }
                }
                Log.ret(Log.l.trace);
            };
            this.createColorPicker = createColorPicker;

            var changeColorSetting = function (colorProperty, color) {
                Log.call(Log.l.trace, "Settings.Controller.", "colorProperty=" + colorProperty + " color=" + color);
                if (color) {
                    AppData.applyColorSetting(colorProperty, color);
                    WinJS.Promise.timeout(0).then(function () {
                        switch (colorProperty) {
                        case "accentColor":
                            that.createColorPicker("backgroundColor");
                            that.createColorPicker("textColor");
                            that.createColorPicker("labelColor");
                            that.createColorPicker("tileTextColor");
                            that.createColorPicker("tileBackgroundColor");
                            that.createColorPicker("navigationColor");
                        // fall through...
                        case "navigationColor":
                            AppBar.loadIcons();
                            NavigationBar.groups = Application.navigationBarGroups;
                            break;
                        }
                    });
                }
                Log.ret(Log.l.trace);
            }
            this.changeColorSetting = changeColorSetting;

            // create all color pickers!
            this.createColorPicker("accentColor");
            this.createColorPicker("backgroundColor");
            this.createColorPicker("textColor");
            this.createColorPicker("labelColor");
            this.createColorPicker("tileTextColor");
            this.createColorPicker("tileBackgroundColor");
            this.createColorPicker("navigationColor");

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    Application.navigateById("start", event);
                    Log.ret(Log.l.trace);
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickFullScreen: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.fullScreen = toggle.checked;
                            Application.ensureScreenLayout();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickIsDarkTheme: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.isDarkTheme = toggle.checked;
                            WinJS.Promise.timeout(0).then(function () {
                                Colors.isDarkTheme = that.binding.generalData.isDarkTheme;
                                Log.print(Log.l.trace, "isDarkTheme=" + that.binding.generalData.isDarkTheme);
                                that.createColorPicker("backgroundColor");
                                that.createColorPicker("textColor");
                                that.createColorPicker("labelColor");
                                that.createColorPicker("tileTextColor");
                                that.createColorPicker("tileBackgroundColor");
                                that.createColorPicker("navigationColor");
                                AppBar.loadIcons();
                                NavigationBar.groups = Application.navigationBarGroups;
                            });
                            Application.pageframe.savePersistentStates();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedTheme: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var themeId = event.currentTarget.value;
                        if (typeof themeId === "string") {
                            themeId = parseInt(themeId);
                        }
                        if (themeId === 2 && typeof window.matchMedia === "function") {
                            that.binding.generalData.manualTheme = false;
                            var prefersColorSchemeDark = window.matchMedia("(prefers-color-scheme: dark)");
                            that.binding.generalData.isDarkTheme = prefersColorSchemeDark && prefersColorSchemeDark.matches;
                        } else {
                            that.binding.generalData.manualTheme = true;
                            that.binding.generalData.isDarkTheme = (themeId === 1);
                        }
                        Log.print(Log.l.trace, "isDarkTheme=" + that.binding.generalData.isDarkTheme +
                            " manualTheme=" + that.binding.generalData.manualTheme);
                        WinJS.Promise.timeout(0).then(function () {
                            Colors.isDarkTheme = that.binding.generalData.isDarkTheme;
                            that.createColorPicker("backgroundColor");
                            that.createColorPicker("textColor");
                            that.createColorPicker("labelColor");
                            that.createColorPicker("tileTextColor");
                            that.createColorPicker("tileBackgroundColor");
                            that.createColorPicker("navigationColor");
                            that.createColorPicker("dashboardColor");
                            AppBar.loadIcons();
                            NavigationBar.groups = Application.navigationBarGroups;
                        });
                        Application.pageframe.savePersistentStates();
                    }
                    Log.ret(Log.l.trace);
                },
                clickIndividualColors: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            if (!toggle.checked && AppData._persistentStates.individualColors) {
                                WinJS.Promise.timeout(0).then(function () {
                                    AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                                    var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                                    that.createColorPicker("accentColor");
                                    that.createColorPicker("backgroundColor");
                                    that.createColorPicker("textColor");
                                    that.createColorPicker("labelColor");
                                    that.createColorPicker("tileTextColor");
                                    that.createColorPicker("tileBackgroundColor");
                                    that.createColorPicker("navigationColor");
                                    AppBar.loadIcons();
                                    NavigationBar.groups = Application.navigationBarGroups;
                                });
                            }
                            that.binding.generalData.individualColors = toggle.checked;
                            AppData._persistentStates.appColors = that.binding.generalData.individualColors;   
                            Application.pageframe.savePersistentStates();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickShowAppBkg: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.showAppBkg = toggle.checked;
                            Log.print(Log.l.trace, "showAppBkg=" + toggle.checked);
                            WinJS.Promise.timeout(0).then(function () {
                                var appBkg = document.querySelector(".app-bkg");
                                if (appBkg && appBkg.style) {
                                    appBkg.style.visibility = that.binding.generalData.showAppBkg ? "visible" : "hidden";
                                }
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickInputBorderBottom: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var toggle = event.currentTarget.winControl;
                        if (toggle) {
                            that.binding.generalData.inputBorderBottom = toggle.checked;
                            Log.print(Log.l.trace, "inputBorderBottom=" + toggle.checked);
                            Colors.updateColors();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                ChangeIconStrokeWidth: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        that.binding.generalData.iconStrokeWidth = event.currentTarget.value;
                        Log.print(Log.l.trace, "iconStrokeWidth=" + event.currentTarget.value);
                        WinJS.Promise.timeout(0).then(function () {
                            AppBar.loadIcons();
                            NavigationBar.groups = Application.navigationBarGroups;
                            Application.pageframe.savePersistentStates();
                        });
                    }
                    Log.ret(Log.l.trace);
                },
                changedInputBorder: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.inputBorder = range.value;
                            Log.print(Log.l.trace, "inputBorder=" + range.value);
                            WinJS.Promise.timeout(0).then(function () {
                                Colors.inputBorder = that.binding.generalData.inputBorder;
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedInputBorderRadius: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (event.currentTarget && AppBar.notifyModified &&
                        that.binding && that.binding.generalData) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.generalData.inputBorderRadius = range.value;
                            Log.print(Log.l.trace, "inputBorderRadius=" + range.value);
                            WinJS.Promise.timeout(0).then(function () {
                                Colors.inputBorderRadius = that.binding.generalData.inputBorderRadius;
                            });
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickTopButton: function (event) {
                    Log.call(Log.l.trace, "Settings.Controller.");
                    if (AppData.generalData.logOffOptionActive) {
                        var anchor = document.getElementById("menuButton");
                        var menu = document.getElementById("menu1").winControl;
                        var placement = "bottom";
                        menu.show(anchor, placement);
                    } else {
                        Application.navigateById("userinfo", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickLogoff: function (event) {
                    Log.call(Log.l.trace, "Start.Controller.");
                    var confirmTitle = getResourceText("account.confirmLogOff");
                    confirm(confirmTitle, function (result) {
                        if (result) {
                            Log.print(Log.l.trace, "clickLogoff: user choice OK");
                            AppData._persistentStates.veranstoption = {};
                            AppData._persistentStates.colorSettings = copyByValue(AppData.persistentStatesDefaults.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            var colors = new Colors.ColorsClass(AppData._persistentStates.colorSettings);
                            AppData._persistentStates.individualColors = false;
                            AppData._persistentStates.isDarkTheme = false;
                            Application.pageframe.savePersistentStates();
                            that.binding.doEdit = false;
                            that.binding.generalData.notAuthorizedUser = false;
                            that.binding.enableChangePassword = false;
                            Application.navigateById("login", event);
                        } else {
                            Log.print(Log.l.trace, "clickLogoff: user choice CANCEL");
                        }
                    });
                    /*AppData._persistentStates.privacyPolicyFlag = false;
                    if (AppHeader && AppHeader.controller && AppHeader.controller.binding.userData) {
                        AppHeader.controller.binding.userData = {};
                        if (!AppHeader.controller.binding.userData.VeranstaltungName) {
                            AppHeader.controller.binding.userData.VeranstaltungName = "";
                        }
                    }*/
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function () {
                    // always enabled!
                    return false;
                },
                clickLogoff: function () {
                    var logoffbutton = document.getElementById("logoffbutton");
                    if (logoffbutton) {
                        logoffbutton.disabled = that.binding.generalData.notAuthorizedUser ? false : that.binding.generalData.logOffOptionActive ? false : true;
                    }
                    if (that.binding.generalData.notAuthorizedUser) {
                        return false;
                    }
                    return !that.binding.generalData.logOffOptionActive;
                }
            }

            var resultConverter = function (item, index) {
                var property = AppData.getPropertyFromInitoptionTypeID(item);

                if (property && property !== "individualColors" && (!item.pageProperty) && item.LocalValue) {
                    item.colorValue = "#" + item.LocalValue;
                    var pickerParent = pageElement.querySelector("#" + property + "_picker");
                    if (pickerParent) {
                        var colorcontainer = pickerParent.querySelector(".color_container");
                        if (colorcontainer) {
                            var colorPicker = colorcontainer.colorPicker;
                            if (colorPicker) {
                                colorPicker.color = item.colorValue;
                            }
                        }
                    }
                    AppData.applyColorSetting(property, item.colorValue);
                } else if (property === "individualColors") {
                    if (that.binding && that.binding.generalData) {
                        if (item.LocalValue === "1") {
                            that.binding.generalData.individualColors = true;
                            that.binding.showSettingsFlag = false;
                        } else {
                            that.binding.showSettingsFlag = true;
                        }
                    }
                }
            }
            this.resultConverter = resultConverter;

            var loadData = function (complete, error) {
                AppData._persistentStates.hideQuestionnaire = false;
                AppData._persistentStates.hideSketch = false;
                if (that.binding) {
                    if (that.binding.showSettingsFlag === null) {
                        that.binding.showSettingsFlag = true;
                    }
                }
                var ret = new WinJS.Promise.as().then(function() {
                    if (themeSelect && themeSelect.winControl) {
                        var themeSelectList = new WinJS.Binding.List([
                            { themeId: 0, label: that.binding.generalData.light },
                            { themeId: 1, label: that.binding.generalData.dark },
                            { themeId: 2, label: that.binding.generalData.system }
                        ]);
                        themeSelect.winControl.data = themeSelectList;
                        that.binding.themeId = that.binding.generalData.manualTheme
                            ? (that.binding.generalData.isDarkTheme ? 1 : 0)
                            : 2;
                    }
                    return WinJS.Promise.as();
                }).then(function () {
                    /*for (var i = 0; i < Application.navigationBarGroups.length; i++) {
                        if (Application.navigationBarGroups[i].id === "events") {
                            if (!Application.navigationBarGroups[i].disabled) {
                                if (that.binding) {
                                    that.binding.showSettingsFlag = true;
                                }
                            }
                            break;
                        }
                    }*/
                    var colors = Colors.updateColors();
                    return (colors && colors._loadCssPromise) || WinJS.Promise.as();
                });
              /*  return Settings.CR_VERANSTOPTION_ODataView.select(function (json) {
                    // this callback will be called asynchronously
                    // when the response is available
                    Log.print(Log.l.trace, "CR_VERANSTOPTION: success!");
                    // CR_VERANSTOPTION_ODataView returns object already parsed from json file in response

                    if (json && json.d && json.d.results && json.d.results.length > 0) {
                        var results = json.d.results;
                        AppData._persistentStates.serverColors = false;
                        results.forEach(function (item, index) {
                            that.resultConverter(item, index);
                        });
                        Application.pageframe.savePersistentStates();
                    }
                    if (that.binding) {
                        if (that.binding.showSettingsFlag === null) {
                            that.binding.showSettingsFlag = true;
                        }
                    }
                }, function (errorResponse) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                //}).then(function () {
                    Colors.updateColors();
                    return WinJS.Promise.as();
                //});*/
                    /*Colors.updateColors();
                    return WinJS.Promise.as();*/
            };
            this.loadData = loadData;
            AppData.setErrorMsg(this.binding);

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
            }).then(function () {
                return that.loadData();
            });
            Log.ret(Log.l.trace);
        }),
        getInputBorderName: function (level) {
            Log.call(Log.l.trace, "Settings.", "level=" + level);
            var key = "border" + level;
            Log.print(Log.l.trace, "key=" + key);
            var resources = getResourceTextSection("settings");
            var name = resources[key];
            Log.ret(Log.l.trace, "name=" + name);
            return name;
        }
    });
})();

