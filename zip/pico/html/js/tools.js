// get app list
var myTool = function () {
    var me = this;
    me.getAppList = function (url, callback, rm) {
        $.ajax({
            url:url,
            type:'GET',
            contentType:'text/html; charset=utf-8;', //统一前后端编码为utf-8防止ie下返回undefined
            success:function (data) {
                console.log(data)
                var items = [];
                $(data).find("a").each(function (i) {
                    var it = $(this);
                    var s = it.attr("href");
                    if (s != "../") {
                        if (rm) {
                            for (var a in rm) {
                                s = s.replace(rm[a], "");
                            }
                        }
                        items.push(s);
                    }
                });
                if (callback instanceof Function)
                    callback(items);

            }
        });
    }
    // compare 2 version 1.0.0 vs 1.0.3，- small, + big, 0 equ
    me.compareVersion = function (v1, v2) {
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
    // base url
    me.baseURL = function () {
        return "http://" + window.location.host;
    }
    // get app last version
    me.getAppLastVersion = function (url, callback) {
        getAppList(url, function (items) {
            var last = "";
            console.log(items)
            if ((items instanceof Array) && items.length > 0) {
                last = items[0];
                for (var i = 1; i < items.length; ++i) {
                    var n = compareVersion(last, items[i]);
                    console.log(n)
                    if (n < 0) {
                        last = items[i];
                    }
                }
            }
            if (callback instanceof Function)
                callback(last);
        }, "/v")
    }
    // get current path
    me.getCurrentPath = function () {
        return tools.baseURL() + window.location.pathname;
    }
    // replace string
    me.replaceStr = function (str, v) {
        if (!str)
            return;
        for (var a in v) {
            var r = "%" + a + "%";
            var index = str.indexOf(r);
            for (; index != -1; index = str.indexOf(r))
                str = str.replace(r, v[a]);
        }
        return str;
    }
    // replace template
    me.templateHtml = function (tmpId, divId, info) {
        var cur = $(tmpId).html();
        var html = me.replaceStr(cur, info);
        $(divId).html(html);
    }
    me.templateAppend = function (tmpId, divId, info) {
        var cur = $(tmpId).html();
        var html = me.replaceStr(cur, info);
        $(divId).append(html);
    }
}
var tools = new myTool();