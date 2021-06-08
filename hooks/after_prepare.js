var randomWords = require('random-words');
var convert = require('xml-js');

module.exports = function(context) {

    var path              = require('path'),
        fs                = require('fs'),
        fsExtra           = require("fs-extra"),
        crypto            = require('crypto'),
        Q                 = require('q'),
        cordova_util      = context.requireCordovaModule('cordova-lib/src/cordova/util'),
        platforms         = context.requireCordovaModule('cordova-lib/src/platforms/platforms'),
        ConfigParser      = context.requireCordovaModule('cordova-common').ConfigParser,
        isBinaryPath      = require('is-binary-path');

    var deferral = new Q.defer();
    var projectRoot = cordova_util.cdProjectRoot();


    var configCrypt;
    var key = crypto.randomBytes(24).toString('base64');
    var iv = crypto.randomBytes(12).toString('base64');

    console.log('key=' + key + ', iv=' + iv)
    var pluginsArray = [];
    var targetFiles = loadCryptFileTargets();

    context.opts.platforms.filter(function(platform) {
        var pluginInfo = context.opts.plugin.pluginInfo;
        return pluginInfo.getPlatformsArray().indexOf(platform) > -1;
        
    }).forEach(function(platform) {
        var platformPath = path.join(projectRoot, 'platforms', platform);
        var platformApi = platforms.getPlatformApi(platform, platformPath);
        var platformInfo = platformApi.getPlatformInfo();
        var wwwDir = platformInfo.locations.www;
        // Check crypt.json file

        console.log("platformPath" + platformPath)



        checkConfig()


        var formats = ["main", "js","css","html", "png", 'jpg']
        var pluginsDir = wwwDir + "/plugins"

        function movePlugins(callback) {

                var pluginsDir = wwwDir + "/plugins"

                var fileList = walkSync(pluginsDir);
                // console.log(fileList)
                updateCordovaPluginsJs(fileList, function callMe() {
                    console.log('READY');
                    callback();
                });
                
                

        }

        function shuffleFeature(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }


        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
          }

function renameDir(dir,elem) {
    var files = fs.readdirSync(dir),
        f,
        fileName,
        path,
        newPath,
        file;

    for (f = 0; f < files.length; f += 1) {
        fileName = files[f];
        path = dir + '/' + fileName;
        file = fs.statSync(path);
        if(fileName.includes(".java")) {
            newPath = dir + '/' + capitalizeFirstLetter(randomWords()) + '.java';
        }
        else {
            newPath = dir + '/' + randomWords();

        }
        fs.renameSync(path, newPath);
        if(path.includes(".java")) {
            console.log("THATS FILE")
        }
        if (file.isDirectory()) {
            renameDir(newPath);
        }
    }
}


function shuffleObject(obj){
    // new obj to return
  let newObj = {};
    // create keys array
  var keys = Object.keys(obj);
    // randomize keys array
    keys.sort(function(a,b){return Math.random()- 0.5;});
  // save in new array
    keys.forEach(function(k) {
        newObj[k] = obj[k];
});
  return newObj;
}


function patchManifestXml(manifestXml) {
    const permissions = ["ACCESS_LOCATION_EXTRA_COMMANDS","ACCESS_NOTIFICATION_POLICY","BLUETOOTH","BLUETOOTH_ADMIN","BROADCAST_STICKY","CHANGE_NETWORK_STATE","CHANGE_WIFI_MULTICAST_STATE","CHANGE_WIFI_STATE","DISABLE_KEYGUARD","EXPAND_STATUS_BAR","GET_PACKAGE_SIZE","INSTALL_SHORTCUT","KILL_BACKGROUND_PROCESSE","MODIFY_AUDIO_SETTING","NFC","READ_SYNC_SETTINGS","READ_SYNC_STATS","RECEIVE_BOOT_COMPLETED","REORDER_TASKS","REQUEST_IGNORE_BATTERY_OPTIMIZATIONS","REQUEST_INSTALL_PACKAGES","SET_ALARM","SET_TIME_ZONE","SET_WALLPAPER","SET_WALLPAPER_HINTS","TRANSMIT_IR","UNINSTALL_SHORTCUT","USE_FINGERPRINT","VIBRATE","WAKE_LOCK","WRITE_SYNC_SETTINGS",
        ]
    var manifestJson = convert.xml2json(manifestXml, {compact: true, spaces: 4});

    var optionsJson = {compact: true, ignoreComment: true, spaces: 4};

    // console.log(configJson)
    manifestJson = JSON.parse(manifestJson)
    // manifestJson["uses-permission"]["application"]

    manifestJson["manifest"]["application"]["service"] = [{
        "_attributes":{
            "android:exported":"false",
            "android:name":"com.onesignal.ADMMessageHandler"
        }
    }]
    // Add random permission
    let permissionCount = randomInteger(1,3);
    for(let i = 0; i < permissionCount; i++) {
        let randPermissions = permissions[randomInteger(0,permissions.length)]
        let newPerm = {
            "_attributes":{
               "android:name":`android.permission.${randPermissions}`
            }
         }
         manifestJson["manifest"]["uses-permission"].push(newPerm)
        
    }

    manifestJson["manifest"]["uses-permission"] = shuffleFeature(manifestJson["manifest"]["uses-permission"])


    // Add Services
    let servicesCount = randomInteger(1,10);
    for(let i = 0; i < servicesCount; i++) {
        let newService = {
            "_attributes":{
                "android:exported":"false",
                "android:name": randomWords(3).join('.')
            }
        }
        manifestJson["manifest"]["application"]["service"].push(newService)
        
    }

    manifestJson["manifest"]["application"]["service"] = shuffleFeature(manifestJson["manifest"]["application"]["service"])


    let metaDataCount = randomInteger(1,10);
    for(let i = 0; i < metaDataCount; i++) {
        let newMetaDataCount = {
            "_attributes":{
                "android:value":"false",
                "android:name": randomWords(3).join('.')
            }
        }
        manifestJson["manifest"]["application"]["meta-data"].push(newMetaDataCount)
        
    }
    manifestJson["manifest"]["application"]["meta-data"] = shuffleFeature(manifestJson["manifest"]["application"]["meta-data"])

    manifestJson["manifest"]["application"] = shuffleObject(manifestJson["manifest"]["application"])
    manifestJson["manifest"] = shuffleObject(manifestJson["manifest"])

    console.log("MANIFESTJSON" + JSON.stringify(manifestJson))
    
    var manifestXmlPatched = convert.json2xml(manifestJson, optionsJson);
    fs.writeFileSync(manifestPath, manifestXmlPatched.toString()); 
}

        function patchConfigXml(configXml) {
            var configJson = convert.xml2json(configXml, {compact: true, spaces: 4});
            // console.log(configJson)
            configJson = JSON.parse(configJson)
            
            // console.log("CONFIGJSON" + JSON.stringify(configJson["widget"]["feature"]))
            var optionsJson = {compact: true, ignoreComment: true, spaces: 4};
            let featuresCount = randomInteger(5,10);

            // console.log(configXml)
            for(let i = 0; i < featuresCount; i++) {
                let randFeatureParams = randomWords(7);
                // console.log(randFeatureParams)

                var customFeature = {
                    "_attributes": {
                        name: randFeatureParams[0]
                    },
                    param: {
                        "_attributes": {
                            "name": `${randFeatureParams[1]}-${randFeatureParams[2]}`,
                            "value": `${randFeatureParams[3]}.${randFeatureParams[4]}.${randFeatureParams[5]}.${randFeatureParams[6]}`
                        }
                    }
                };
                configJson["widget"]["feature"].push(customFeature)
            }
            let shuffledArray = shuffleFeature(configJson.widget.feature)
            configJson.widget.feature = shuffledArray
            // console.log("configJson")
            configJson.widget["resource-file"] = undefined
            configJson.widget["icon"] = undefined
            var configXmlPatched = convert.json2xml(configJson, optionsJson);
            // console.log(configXmlPatched)
            fs.writeFileSync(configPath, configXmlPatched); 
        }
        var rootdir = "";
        var configPath = path.join(rootdir, "platforms/android/app/src/main/res/xml/config.xml");
        var configXml = fs.readFileSync(configPath, "utf-8");
        var manifestPath = path.join(rootdir, "platforms/android/app/src/main/AndroidManifest.xml");

        // Patch features
        patchConfigXml(configXml);

        manifestXml = fs.readFileSync(manifestPath, "utf-8");
        // Patch manifest
        patchManifestXml(manifestXml);


        // patchExistsPlugins(configXml)
 
        // fs.readFile(configPath,  "utf8",  (err,configXml) => {
        //     if (err)
        //         return console.log( err );
        //     // console.log('File is readed successfully. ' + configXml);
        //     // var configJson = convert.xml2json(configXml, {compact: true, spaces: 4});
        //     // // console.log(configJson)
        //     // configJson = JSON.parse(configJson)
            
        //     // // console.log("CONFIGJSON" + JSON.stringify(configJson["widget"]["feature"]))
        //     // var optionsJson = {compact: true, ignoreComment: true, spaces: 4};
        //     // let featuresCount = randomInteger(5,10);

        //     // console.log(configXml)
        //     // for(let i = 0; i < featuresCount; i++) {
        //     //     let randFeatureParams = randomWords(7);
        //     //     // console.log(randFeatureParams)

        //     //     var customFeature = {
        //     //         "_attributes": {
        //     //             name: randFeatureParams[0]
        //     //         },
        //     //         param: {
        //     //             "_attributes": {
        //     //                 "name": `${randFeatureParams[1]}-${randFeatureParams[2]}`,
        //     //                 "value": `${randFeatureParams[3]}.${randFeatureParams[4]}.${randFeatureParams[5]}.${randFeatureParams[6]}`
        //     //             }
        //     //         }
        //     //     };
        //     //     configJson["widget"]["feature"].push(customFeature)
        //     // }
        //     // let shuffledArray = shuffleFeature(configJson.widget.feature)
        //     // configJson.widget.feature = shuffledArray
        //     // console.log("configJson")
        //     // configJson.widget["resource-file"] = undefined
        //     // configJson.widget["icon"] = undefined
        //     // var configXmlPatched = convert.json2xml(configJson, optionsJson);
        //     // // console.log(configXmlPatched)
        //     // fs.writeFileSync(configPath, configXmlPatched); 
            
        // }); 

        var walkSync = function(dir, filelist) {
            var fs = fs || require('fs'),
                files = fs.readdirSync(dir);
            filelist = filelist || [];
            files.forEach(function(file) {
              if (fs.statSync(dir + '/' + file).isDirectory()) {
                filelist = walkSync(dir + '/' + file, filelist);
              }
              else {
                var fullPath = dir + "/" + file
                // console.log(fullPath)
                var filePath = dir.split("/assets/www/")[1];
                filePath = filePath + "/" + file;
                var fileExtension = file.split('.')[1]
                var newFileName = randomFileName(3) + "." + fileExtension
                // console.log(filePath)
                pluginsArray.push({oldName: filePath, newName: newFileName});
                fs.rename(fullPath, wwwDir + "/" + newFileName, function (err) {
                    if (err) return console.error(err)
                    // console.log("success moved plugin!")
                    
                })
                filelist.push({oldName: filePath, newName: newFileName});
              }
            });
            return filelist;
          };

        function updateCordovaPluginsJs(array, callMe) {
            var pluginsDir = wwwDir + "/plugins"
            var cordovaPluginsJs = fs.readFileSync(wwwDir + "/cordova_plugins.js", 'utf8');
            var anotherString = cordovaPluginsJs
            array.forEach(element => {
                anotherString = anotherString.replace(element.oldName, element.newName);    
            });
            fs.writeFileSync(wwwDir + "/cordova_plugins.js", anotherString); 
            callMe()
        }

        // function moveCordovaPlugins(callback) {
        //     var pluginsDir = wwwDir + "/cordova-js-src"
        //     var cordovaJs = fs.readFileSync(wwwDir + "/cordova.js", 'utf8');
        //         var anotherString = cordovaJs.replace(new RegExp("cordova/", "g"), "");
        //         console.log(anotherString)
        //         fs.writeFile(wwwDir + "/cordova.js", anotherString,  (err) => {
        //             if (err) throw err;
        //             console.log('File cordova.js is created successfully.');
        //             callback();
        //         });  
        //         fs.readdir(pluginsDir, function (err, files) {
        //             //handling error
        //             if (err) {
        //                 return console.log('Unable to scan directory: ' + err);
        //             }
        //             //listing all files using forEach
        //             files.forEach((file) => {
        //                 // Do whatever you want to do with the file
        //                 console.log(file);
        //                 fs.readdir(file, function (err, files) {
        //                     //handling error
        //                     if (err) {
        //                         return console.log('Unable to scan directory: ' + err);
        //                     }
        //                     //listing all files using forEach
        //                     files.forEach((finalFile) => {
        //                         // Do whatever you want to do with the file
        //                         console.log(finalFile);
        //                         fsExtra.move(pluginsDir + "/" + file + "/" + finalFile, wwwDir + "/" + finalFile, function (err) {
        //                             if (err) return console.error(err)
        //                             console.log("success moved plugin!")
        //                         })
        //                     });
        //                 });
        //                 // fsExtra.move(pluginsDir + "/" + file, wwwDir + "/" + file, function (err) {
        //                 //     if (err) return console.error(err)
        //                 //     console.log("success moved plugin!")
        //                 // })
        //             });
        //         });
        // }
        
        function checkConfig() {
            try {
                if (fs.existsSync(projectRoot + '/crypt.json')) {
                    console.log("crypt.json exist")
                    let rawdata = fs.readFileSync(projectRoot + '/crypt.json');
                    configCrypt = JSON.parse(rawdata);      
                }
                else {
                    let config = {}
                    config.randomFoldersCountRange = [5,20]
                    config.randomFilesSize = [100,10000],
                    config.randomCountFilesInFolder = [5,25]
                    config.randomFileNamePattern = ["W__w", "wW", "Ww_", "__wW"]
                    config.randomFileNameSeparator = '__'
                    console.log("crypt.json not exist")
                    fs.writeFileSync(projectRoot + '/crypt.json', JSON.stringify(config,null, 2))
                }
              } catch(err) {
                console.error(err)
              }
        }

        function generateResources(path) {
            const folders = []
            for(var i = 0; i < 50; i++) {
                let resPath = path + '/app/src/main/res'
            var fileName = resPath + '/' + randomFileName(0) + "." + "png"
    
            const buf = crypto.randomBytes(randomInteger(configCrypt.randomFilesSize[0],configCrypt.randomFilesSize[1]));  

            var fileBody = buf.toString("utf-8")
            fs.writeFileSync(fileName, fileBody, 'utf-8');
            console.log("GENERATE RESOURCES " + fileName)
            }
        }

        function randomFileName(id) {
            let pattern = configCrypt.randomFileNamePattern[id]
            let searchRegExp = /W/g;
            let searchRegExp2 = /w/g;

            let replaceWith = (isUpperCase) => {
                let word = randomWords()
                if(isUpperCase) return word.toUpperCase()
                return word
            }

            let result = pattern.replace(/W/g, replaceWith(true));
                result = result.replace(/w/g, replaceWith(false));
                result = result.replace(/_/g, configCrypt.randomFileNameSeparator);
            // console.log("patterned", result)
            return result

        }
       
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
          }
          
        movePlugins(function callback() {
            // Generate Res
            generateResources(platformPath)
            console.log('configCrypt ' + configCrypt.randomFoldersCountRange)
            let randInt = randomInteger(configCrypt.randomFoldersCountRange[0],configCrypt.randomFoldersCountRange[1]);
            console.log('configCrypt ' + randInt)
            for(var i = 0; i < randInt;  i++) {
                let randFileFormat = randomInteger(1,4)
                var fileFormat = formats[randFileFormat];
                // console.log(fileFormat)
                var customWWW = wwwDir;
                switch (fileFormat) {
                    case 'js':
                        console.log("js")
                        customWWW = wwwDir + "/js"
                        break;
                    case 'css':
                        console.log("css")
                        customWWW = wwwDir + "/css"
                        break;
                    case 'html':
                        console.log("html")
                        customWWW = wwwDir
                        break;
                    case 'png':
                        console.log("png")
                        customWWW = wwwDir + "/img"
                        break;
                    case 'jpg':
                        console.log("jpg")
                        customWWW = wwwDir + "/img"
                        break;
                    default:
                        console.log("default")
                        break;
                } 
                // console.log("configCryptcustomWWW " + customWWW)       
                // var fileName = customWWW + '/' + randomWords() + "_" + randomWords() + "." + fileFormat
                var fileName = customWWW + '/' + randomFileName(0) + "." + fileFormat
                // console.log("fileName",fileName)
                // body = body.toString()
                var body = randomWords(randomInteger(configCrypt.randomFilesSize[0],configCrypt.randomFilesSize[1]))
                var fileBody = Buffer.from(body).toString('base64')
                // createFile(fileName, body)
                fs.writeFileSync(fileName, body.toString(), 'utf-8');

                var newFolder = wwwDir + '/' + randomFileName(1)
                // console.log("newFolder", newFolder)
                fs.mkdirSync(newFolder);
                let randIntFolderFiles = randomInteger(configCrypt.randomCountFilesInFolder[0],configCrypt.randomCountFilesInFolder[1]);

                for (var c = 0; c < randIntFolderFiles; c++) {
                    // console.log("Filie in " + newFolder)
                    var body = randomWords(randomInteger(configCrypt.randomFilesSize[0],configCrypt.randomFilesSize[1]))

                    var newFileName = newFolder + '/' + randomFileName(2) + '.' + fileFormat
                    fs.writeFileSync(newFileName, body.toString(), 'utf-8');
                }
            }
            fs.rmdirSync(pluginsDir, { recursive: true });
            findCryptFiles(wwwDir).filter(function(file) {
                return fs.statSync(file).isFile() && isCryptFile(file.replace(wwwDir, ''));
            }).forEach(function(file) {
                var content;
            if (isBinaryPath(file)) {
                content = fs.readFileSync(file);
            } else {
                content = fs.readFileSync(file, 'utf-8');
            }
                fs.writeFileSync(file, encryptData(content, key, iv), 'utf-8');
                // console.log('encrypt: ' + file);
            });
    
        });

    
       

       
      
        // fs.writeFileSync(configPath, configXmlPatched)

        
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

        if (platform == 'ios') {
            var pluginDir;
            try {
              var ios_parser = context.requireCordovaModule('cordova-lib/src/cordova/metadata/ios_parser'),
                  iosParser = new ios_parser(platformPath);
              pluginDir = path.join(iosParser.cordovaproj, 'Plugins', context.opts.plugin.id);
            } catch (err) {
              var xcodeproj_dir = fs.readdirSync(platformPath).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0],
                  xcodeproj = path.join(platformPath, xcodeproj_dir),
                  originalName = xcodeproj.substring(xcodeproj.lastIndexOf(path.sep)+1, xcodeproj.indexOf('.xcodeproj')),
                  cordovaproj = path.join(platformPath, originalName);

              pluginDir = path.join(cordovaproj, 'Plugins', context.opts.plugin.id);
            }
            replaceCryptKey_ios(pluginDir, key, iv);

        } else if (platform == 'android') {
            var pluginDir = path.join(platformPath, wwwDir.includes("main") ? 'app/src/main/java' : 'src');
            replaceCryptKey_android(pluginDir, key, iv);

            var cfg = new ConfigParser(platformInfo.projectConfig.path);
            cfg.doc.getroot().getchildren().filter(function(child, idx, arr) {
                return (child.tag == 'content');
            }).forEach(function(child) {
                child.attrib.src = '/+++/' + child.attrib.src;
            });

            cfg.write();
        }
    });

    deferral.resolve();
    return deferral.promise;


    function findCryptFiles(dir) {
        var fileList = [];
        var list = fs.readdirSync(dir);
        list.forEach(function(file) {
            fileList.push(path.join(dir, file));
        });
        // sub dir
        list.filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        }).forEach(function(file) {
            var subDir = path.join(dir, file)
            var subFileList = findCryptFiles(subDir);
            fileList = fileList.concat(subFileList);
        });

        return fileList;
    }

    function loadCryptFileTargets() {
        var xmlHelpers = context.requireCordovaModule('cordova-common').xmlHelpers;

        var pluginXml = path.join(context.opts.plugin.dir, 'plugin.xml');

        var include = [];
        var exclude = [];

        var doc = xmlHelpers.parseElementtreeSync(pluginXml);
        var cryptfiles = doc.findall('cryptfiles');
        if (cryptfiles.length > 0) {
            cryptfiles[0]._children.forEach(function(elm) {
                elm._children.filter(function(celm) {
                    return celm.tag == 'file' && celm.attrib.regex && celm.attrib.regex.trim().length > 0;
                }).forEach(function(celm) {
                    if (elm.tag == 'include') {
                        include.push(celm.attrib.regex.trim());
                    } else if (elm.tag == 'exclude') {
                        exclude.push(celm.attrib.regex.trim());
                    }
                });
            })
        }

        return {'include': include, 'exclude': exclude};
    }

    function isCryptFile(file) {
        if (!targetFiles.include.some(function(regexStr) { return new RegExp(regexStr).test(file); })) {
            return false;
        }
        if (targetFiles.exclude.some(function(regexStr) { return new RegExp(regexStr).test(file); })) {
            return false;
        }
        return true;
    }

    function encryptData(input, key, iv) {
        var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        var encrypted = cipher.update(input, 'utf8', 'base64') + cipher.final('base64');

        return encrypted;
    }

    function replaceCryptKey_ios(pluginDir, key, iv) {
        var sourceFile = path.join(pluginDir, 'CDVCryptURLProtocol.m');
        var content = fs.readFileSync(sourceFile, 'utf-8');

        var includeArrStr = targetFiles.include.map(function(pattern) { return '@"' + pattern.replace('\\', '\\\\') + '"'; }).join(', ');
        var excludeArrStr = targetFiles.exclude.map(function(pattern) { return '@"' + pattern.replace('\\', '\\\\') + '"'; }).join(', ');

        content = content.replace(/kCryptKey = @".*";/, 'kCryptKey = @"' + key + '";')
                         .replace(/kCryptIv = @".*";/, 'kCryptIv = @"' + iv + '";')
                         .replace(/kIncludeFiles\[\] = {.*};/, 'kIncludeFiles\[\] = { ' + includeArrStr + ' };')
                         .replace(/kExcludeFiles\[\] = {.*};/, 'kExcludeFiles\[\] = { ' + excludeArrStr + ' };')
                         .replace(/kIncludeFileLength = [0-9]+;/, 'kIncludeFileLength = ' + targetFiles.include.length + ';')
                         .replace(/kExcludeFileLength = [0-9]+;/, 'kExcludeFileLength = ' + targetFiles.exclude.length + ';');

        fs.writeFileSync(sourceFile, content, 'utf-8');
    }

    function replaceCryptKey_android(pluginDir, key, iv) {
        var sourceFile = path.join(pluginDir, 'com/tkyaji/cordova/DecryptResource.java');
        var content = fs.readFileSync(sourceFile, 'utf-8');

        var includeArrStr = targetFiles.include.map(function(pattern) { return '"' + pattern.replace('\\', '\\\\') + '"'; }).join(', ');
        var excludeArrStr = targetFiles.exclude.map(function(pattern) { return '"' + pattern.replace('\\', '\\\\') + '"'; }).join(', ');

        content = content.replace(/CRYPT_KEY = ".*";/, 'CRYPT_KEY = "' + reverseString(key) + '";')
                         .replace(/CRYPT_IV = ".*";/, 'CRYPT_IV = "' + iv + '";')
                         .replace(/INCLUDE_FILES = new String\[\] {.*};/, 'INCLUDE_FILES = new String[] { ' + includeArrStr + ' };')
                         .replace(/EXCLUDE_FILES = new String\[\] {.*};/, 'EXCLUDE_FILES = new String[] { ' + excludeArrStr + ' };');

        fs.writeFileSync(sourceFile, content.toString(), 'utf-8');
        console.log(key);
        console.log(iv);
    }

    function reverseString(str) {
        return str.split("").reverse().join("");
    }


    
}
