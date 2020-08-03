// var copyfiles = require('copyfiles');
var randomWords = require('random-words');

module.exports = function(context) {

    var path              = require('path'),
        fs                = require('fs'),
        crypto            = require('crypto'),
        Q                 = require('q'),
        cordova_util      = context.requireCordovaModule('cordova-lib/src/cordova/util'),
        platforms         = context.requireCordovaModule('cordova-lib/src/platforms/platforms'),
        ConfigParser      = context.requireCordovaModule('cordova-common').ConfigParser;

    var deferral = new Q.defer();
    var projectRoot = cordova_util.cdProjectRoot();

    context.opts.platforms.filter(function(platform) {
        var pluginInfo = context.opts.plugin.pluginInfo;
        return pluginInfo.getPlatformsArray().indexOf(platform) > -1;
        
    }).forEach(function(platform) {
        var platformPath = path.join(projectRoot, 'platforms', platform);
        var platformApi = platforms.getPlatformApi(platform, platformPath);
        var platformInfo = platformApi.getPlatformInfo();
        var wwwDir = platformInfo.locations.www;
        var formats = ["js","css","html", "png", 'jpg']

        for(var i = 0; i < randomInteger(5,20); i++) {
            var fileFormat = formats[Math.floor(Math.random() * Math.floor(4))];
            console.log(fileFormat)
            var customWWW = wwwDir;
            if(fileFormat == "js") {
                customWWW = wwwDir + "/js"
            }
            if (fileFormat == "css") {
                customWWW = wwwDir + "/css"
            }
            if (fileFormat == "html") {
                customWWW = wwwDir
            }
            if (fileFormat == "png") {
                customWWW = wwwDir + "/img"
            }
            if (fileFormat == "jpg") {
                customWWW = wwwDir + "/img"
            }
        
            var fileName = customWWW + '/' + randomWords() + "." + fileFormat
            var fileBody = randomWords(randomInteger(200,1000))
            createFile(fileName, fileBody)
        }

        function createFile(fileName, fileBody) {
            console.log("Create File")
            fs.writeFile(fileName, fileBody,  (err) => {
                if (err) throw err;
                console.log('File is created successfully. ' + fileName, wwwDir );
            }); 
        }
        function randomInteger(min, max) {
            // получить случайное число от (min-0.5) до (max+0.5)
            let rand = min - 0.5 + Math.random() * (max - min + 1);
            return Math.round(rand);
        }
        // copyfiles([
        //     'node_modules/ionic-angular/fonts/**/*',
        //     'www/assets/fonts'
        // ],
        //     true,
        //     () => { console.log('HOOK - after_prepare >: Finish Copy Fonts to Ionic assets') }
        // )
    });

    deferral.resolve();
    return deferral.promise;


}
