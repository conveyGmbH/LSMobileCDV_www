const fs = require('fs');
const path = require('path');

module.exports = function(context) {

    if (!context.opts.platforms.includes('electron')) return;
    const projRoot = context.opts.projectRoot;
    const fullPath = path.join(projRoot, "platforms/electron/www/plugins/cordova-plugin-appinfo/www/appinfo.js");
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(`console.log("[ERROR] Error initializing Cordova: " + e); 
            channel.onAppInfoReady.fire();`)) {
            console.log('patch-appinfo-electron: already patched, skipping');
            return;
        }
        const patched = content.replace( `console.log("[ERROR] Error initializing Cordova: " + e);`, 
            `console.log("[ERROR] Error initializing Cordova: " + e); 
            channel.onAppInfoReady.fire();`);
        fs.writeFileSync(fullPath, patched, 'utf8');
        console.log('patch-appinfo-electron: patched successfully');
    } catch (error) {
        console.error("patch-appinfo-electron: patch could not be applied: ", error);
    }

};