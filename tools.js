var fs = require("fs");
var path = require("path");
var tools = {};
// read file
tools.readFile = function (file, callback) {
    fs.readFile(file, 'utf-8', function (err, data) {
        callback(err, data);
    })
}
tools.readFileSync = function (file) {
    if (!fs.existsSync(file))
        return "";
    var s = fs.readFileSync(file, 'utf-8');
    return s;
}
// write file
tools.writeFile = function (file, data, callback) {
    if (typeof (data) != "string")
        data = JSON.stringify(data);
    fs.writeFile(file, data, function (err) {
        if (callback instanceof Function)
            callback();
    });
}
tools.writeFileSync = function (file, data) {
    if (typeof (data) != "string")
        data = JSON.stringify(data);
    return fs.writeFileSync(file, data);
}
// download file
tools.download = function (url, zipPath, callback) {
    var hp = null;
    if (url.indexOf("https") != -1) {
        hp = require("https");
    }
    else {
        hp = require("http");
    }
    var request = hp.get(url, function (res) {
        try {
            if (res.statusCode != 200) {
                console.log(res.statusCode);
                var s = "";
                res.on("data", function (d) {
                    s += d;
                });
                res.on("end", function (str) {
                    if (callback instanceof Function)
                        callback(-1, { code: res.statusCode, e: str });
                })
                return;
            }
            var fd = fs.createWriteStream(zipPath);
            res.on("data", function (d) {
                fd.write(d);
            }).on("end", function (str) {
                fd.end();
                if (callback instanceof Function)
                    callback(0, str);
            }).on("error", function (e) {
                if (callback instanceof Function)
                    callback(-1, e);
            });
        }
        catch (e) {
            console.log(e)
        }
    }).on("error", function (e) {
        if (callback instanceof Function)
            callback(-1, e);
    });
}
tools.multiDownload = function (urls, index, callback) {
    if (index >= urls.length) {
        if (callback instanceof Function) {
            callback(index);
        }
        return;
    }
    tools.download(urls[index].url, urls[index].path, function () {
        if (callback instanceof Function) {
            callback(index);
        }
        tools.multiDownload(urls, index + 1, callback);
    })
}
// foreack dir
tools.foreachDir = function (dir, callback) {
    if (!fs.existsSync(dir))
        return;
    try {
        var dirList = fs.readdirSync(dir);
        for (var i = 0; i < dirList.length; ++i) {
            var item = dirList[i];
            var p = path.normalize(dir + '/' + item);
            if (fs.statSync(p).isDirectory()) {
                tools.foreachDir(p + "\\", callback);
            } else {
                callback(p)
            }
        };
        callback(dir)
    }
    catch (e) {
        console.log(e)
    }
}
// remove dir
tools.removeDir = function (dir, callback) {
    tools.foreachDir(dir, tools.remove);
    tools.remove(dir);
    if (callback instanceof Function)
        callback();
}

// remove file or dir
tools.remove = function (file) {
    try {
        var fileOrDir = fs.statSync(file);
        if (fileOrDir.isFile()) {
            fs.unlinkSync(file);
        } else if (fileOrDir.isDirectory()) {
            fs.rmdirSync(file);
        }
    }
    catch (e) {
        // console.log(e);
    }
}
tools.mkDir = function (dir) {
    fs.mkdirSync(dir);
}
tools.replaceStr = function (str, v, isAutoAdd) {
    if (!str)
        return "";
    for (var a in v) {
        var r = a;
        if (isAutoAdd)
            r = "%{" + a + "}";
        var index = str.indexOf(r);
        for (; index != -1;) {
            str = str.replace(r, v[a]);
            index = str.indexOf(r, index + v[a].length);
        }
    }
    return str;
}
tools.multiGet = function (urls, index, fun, callback) {
    if (index >= urls.length) {
        if (callback instanceof Function) {
            callback(index);
        }
        return;
    }
    if (!fun)
        fun = tools.get;

    fun(urls[index], function () {
        if (callback instanceof Function) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(index);
            // var args = [];
            arguments.length = args.length;
            for (var i = 0; i < args.length; ++i)
                arguments[i] = args[i];
            callback.apply(callback, arguments);
        }
        tools.multiGet(urls, index + 1, fun, callback);
    })
}
// unzip file
tools.unZip = function (zip, unzipPath, callback) {
    const unzip = require('unzip');
    var stream = fs.createReadStream(zip);
    var u = unzip.Extract({ path: unzipPath });
    u.on("close", function () {
        if (callback instanceof Function) {
            callback(0);
        }
    })
    stream.pipe(u);
}
// download and unzip
tools.downAndUnzip = function (url, zip, unzipPath, callback) {
    tools.download(url, zip, function (code, e) {
        if (code < 0) {
            if (callback instanceof Function)
                callback(code, e);
            return;
        }
        tools.unZip(zip, unzipPath, callback);
    })
}
// get from web
tools.get = function (url, callback) {
    var hp = null;
    if (url.indexOf("https") != -1) {
        hp = require("https");
    }
    else {
        hp = require("http");
    }
    hp.get(url, function (res) {
        var strr = ""
        res.on("data", function (d) {
            strr += d;
        }).on("end", function () {
            if (callback instanceof Function) {
                callback(0, strr);
            }
        }).on("error", function (e) {
            if (callback instanceof Function) {
                callback(-1, e);
            }
        });
    });
}

// analyze dom
tools.analyze = function (html, callback) {
    var cheerio = require('cheerio');
    var $ = cheerio.load(html);
    if (callback instanceof Function)
        callback($);
}

// compare version, - small, + big, 0 equ
tools.cpversion = function (v1, v2) {
    var a1 = v1.split('.');
    var a2 = v2.split('.');
    var len = (a1.length > a2.length) ? a1.length : a2.length;
    for (var i = 0; i < len; ++i) {
        var n1 = parseInt(a1[i] || "0");
        var n2 = parseInt(a2[i] || "0");
        var n = n1 - n2;
        if (n != 0)
            return n;
    }
    return 0;
}
tools.getList = function (url, callback) {
    tools.get(url, function (code, html) {
        tools.analyze(html, function ($) {
            var x = $("pre a");
            var arr = [];
            for (var i = 0; i < x.length; ++i) {
                var it = $(x[i]);
                var s = it.attr("href");
                if (s != "../") {
                    s = s.replace('/', '');
                    arr.push(s);
                }
            }
            if (callback instanceof Function)
                callback(arr);
        });
    })
}
tools.getLastVersion = function (url, callback) {
    //console.log(url)
    tools.get(url, function (code, html) {
        tools.analyze(html, function ($) {
            var x = $("pre a");
            var arr = [];
            for (var i = 0; i < x.length; ++i) {
                var it = $(x[i]);
                var s = it.attr("href");
                if (s != "../") {
                    s = s.replace('/', '');
                    s = s.replace('v', '');
                    arr.push(s);
                }
            }
            if (arr.length < 1) {
                if (callback instanceof Function)
                    callback("");
                return;
            }
            var v = arr[0];
            for (var a = 1; a < arr.length; ++a) {
                if (tools.cpversion(v, arr[a]) < 0) {
                    v = arr[a];
                }
            }
            if (callback instanceof Function)
                callback(v);
        })
    })
}

tools.downlast = function (bUrl, name, callback) {
    tools.getLastVersion(bUrl + name, function (v) {
        if (!v) {
            callback("");
            return;
        }
        url += "v" + v + "/package.zip";
        var path = require("path");
        var zip = path.normalize(__dirname + "/")
    })
}
tools.getCodeFilePath = function (name) {
    var curPath = path.normalize(process.cwd() + (name || ""));
    if (fs.existsSync(curPath))
        return curPath;
    curPath = path.normalize(process.cwd() + "/code/" + (name || ""));
    if (fs.existsSync(curPath))
        return curPath;
    return "";
}
tools.getCodeDirPath = function (name) {
    var curPath = path.normalize(process.cwd() + (name || ""));
    //console.log(curPath)
    try {
        fs.statSync(curPath);
        return curPath;
    }
    catch (e) {

    }
    curPath = path.normalize(process.cwd() + "/code/" + (name || ""));
    //console.log(curPath)
    try {
        fs.statSync(curPath);
        return curPath;
    }
    catch (e) {

    }
    return "";
}
tools.getIp = function (callback) {

    var os = require('os');
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                //console.log(ifname + ':' + alias, iface.address);
                if (callback instanceof Function)
                    callback(iface.address);
                return;
            } else {
                // this interface has only one ipv4 adress
                if (callback instanceof Function)
                    callback(iface.address);
                //console.log(ifname, iface.address);
            }
            ++alias;
        });
    });
}
tools.baseUrl = "http://static.365power.cn/phoneQ/"
tools.pluginUrl = tools.baseUrl + "components/";
tools.templatesUrl = "http://localhost:8080/test/templates/";
tools.moduleUrl = "http://localhost:8080/test/modules/";
module.exports = tools;