#!/usr/bin/env node

var fs = require("fs"),
    http = require("http"),
    url = require("url"),
    path = require("path")

var tools = require("./tools.js");
var root = process.cwd(),
    host = "localhost",
    port = "8888";
tools.getIp(function (ip) {
    host = ip || host;
})
//setRoot();
var express = require("express");
var app = express();
app.get("*", function (req, res) {
    //将url地址的中的%20替换为空格
    var pathname = url.parse(req.url).pathname.replace(/%20/g, ' '),
        re = /(%[0-9A-Fa-f]{2}){3}/g;
    //能够正确显示中文，将三字节的字符转换为utf-8编码
    pathname = pathname.replace(re, function (word) {
        var buffer = new Buffer(3),
            array = word.split('%');
        array.splice(0, 1);
        array.forEach(function (val, index) {
            buffer[index] = parseInt('0x' + val, 16);
        });
        return buffer.toString('utf8');
    });
    if (pathname == '/') {
        listDirectory(root, req, res);
    } else {
        var filename = path.join(root, pathname);
        fs.stat(filename, function (err, stat) {
            if (err || !stat) {
                console.log("找不到文件：", filename);
                write404(req, res);
                return;
            }
            if (stat.isFile()) {
                console.log("send file:", filename);
                showFile(filename, req, res);
            } else if (stat.isDirectory()) {
                listDirectory(filename, req, res);
            }
        });
    }
});

function setRoot() {
    if (!fs.existsSync(root)) {
        console.log(root + "文件夹不存在，请重新制定根文件夹！");
        process.exit();
    }
    var list = fs.readdirSync(root);
    if (list.indexOf("user") > -1) {
        root = path.normalize(root + "/user");
    } else if (list.indexOf("code") > -1) {
        list = fs.readdirSync(path.normalize(root + "/code"));
        if (list.indexOf("user") > -1) root = path.normalize(root + "/code/user");
    }
}

//显示文件夹下面的文件
function listDirectory(parentDirectory, req, res) {
    fs.readdir(parentDirectory, function (error, files) {
        var body = formatBody(parentDirectory, files);
        res.writeHead(200, {
            "Content-Type": "text/html;charset=utf-8",
            "Content-Length": Buffer.byteLength(body, 'utf8'),
            "Server": "NodeJs(" + process.version + ")"
        });
        res.write(body, 'utf8');
        res.end();
    });

}

//显示文件内容
function showFile(file, req, res) {
    res.sendFile(file);
}

//在Web页面上显示文件列表，格式为<ul><li></li><li></li></ul>
function formatBody(parent, files) {
    var res = [],
        length = files.length;
    res.push("<html>");
    res.push("<head><title>phoneQ文件服务器</title></head>");
    res.push("<body bgcolor=''white'>");
    res.push("<pre>")
    if (parent != root) {
        res.push("<a href='../'>...</a><br>");
    }
    files.forEach(function (val, index) {
        var stat = fs.statSync(path.join(parent, val));
        if (stat.isDirectory(val)) {
            val = path.basename(val) + "/";
        } else {
            val = path.basename(val);
        }
        res.push("<a href='" + val + "'>" + val + "</a><br>");
    });
    res.push("</pre>")
    res.push("</body>");
    return res.join("");
}

//如果文件找不到，显示404错误
function write404(req, res) {
    var body = "";
    res.writeHead(404, {
        "Content-Type": "text/html;charset=utf-8",
        "Content-Length": Buffer.byteLength(body, 'utf8'),
        "Server": "NodeJs(" + process.version + ")"
    });
    res.write(body);
    res.end();
}

app.listen(port);
console.log("start http://" + host + ":" + port)
