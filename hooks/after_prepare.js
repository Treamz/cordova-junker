var randomWords = require('random-words');

module.exports = function(context) {

    var path              = require('path'),
        fs                = require('fs'),
        fsExtra           = require("fs-extra"),
        crypto            = require('crypto'),
        Q                 = require('q'),
        cordova_util      = context.requireCordovaModule('cordova-lib/src/cordova/util'),
        platforms         = context.requireCordovaModule('cordova-lib/src/platforms/platforms'),
        ConfigParser      = context.requireCordovaModule('cordova-common').ConfigParser;

    var deferral = new Q.defer();
    var projectRoot = cordova_util.cdProjectRoot();

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

        var formats = ["js","css","html", "png", 'jpg']
        var pluginsDir = wwwDir + "/plugins"

        function movePlugins(callback) {

                var pluginsDir = wwwDir + "/plugins"

                var fileList = walkSync(pluginsDir);
                console.log(fileList)
                updateCordovaPluginsJs(fileList, function callMe() {
                    console.log('READY');
                    callback();
                });
        }

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
                console.log(fullPath)
                var filePath = dir.split("/assets/www/")[1];
                filePath = filePath + "/" + file;
                var fileExtension = file.split('.')[1]
                var newFileName = randomWords() + "_"  + randomWords() + "." + fileExtension
                console.log(filePath)
                pluginsArray.push({oldName: filePath, newName: newFileName});
                fsExtra.move(fullPath, wwwDir + "/" + newFileName, function (err) {
                    if (err) return console.error(err)
                    console.log("success moved plugin!")
                    
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
        movePlugins(function callback() {
            for(var i = 0; i < randomInteger(20,40); i++) {
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
            
                var fileName = customWWW + '/' + randomWords() + "_" + randomWords() + "." + fileFormat
                var body = randomWords(randomInteger(200,1000))
                body = body.toString()
                var fileBody = Buffer.from(body).toString('base64')
                createFile(fileName, fileBody)
            }
            findCryptFiles(wwwDir).filter(function(file) {
                return fs.statSync(file).isFile() && isCryptFile(file.replace(wwwDir, ''));
            }).forEach(function(file) {
                var content = fs.readFileSync(file, 'utf-8');
                fs.writeFileSync(file, encryptData(content, key, iv), 'utf-8');
                console.log('encrypt: ' + file);
            });
    
        });

        


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

        content = content.replace(/CRYPT_KEY = ".*";/, 'CRYPT_KEY = "' + key + '";')
                         .replace(/CRYPT_IV = ".*";/, 'CRYPT_IV = "' + iv + '";')
                         .replace(/INCLUDE_FILES = new String\[\] {.*};/, 'INCLUDE_FILES = new String[] { ' + includeArrStr + ' };')
                         .replace(/EXCLUDE_FILES = new String\[\] {.*};/, 'EXCLUDE_FILES = new String[] { ' + excludeArrStr + ' };');

        fs.writeFileSync(sourceFile, content, 'utf-8');
    }
}
