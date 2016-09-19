function loadJson(file, callback) {
    var $tip = $(".tip");
    $.getJSON(file, function (info) {
        $.getJSON("../version.json", function (dat) {
            var v = {
                logo: info.logo || "",
                name: info.name || "",
                description: info.description || "",
                version: dat.version || "",
                androidUrl: info.androidUrl || "",
                iosUrl: info.iosUrl || "",
                awUrl: info.awUrl || "",
                iwUrl: info.iwUrl || ""
            };
            tools.templateAppend("#idDetailInfo", "#detail", v);
            var path = tools.baseURL() + window.location.pathname;
            $("#load_phone").click(function () {
                window.location = "../" + dat.version + ".exe";
            });
            if (callback instanceof Function)
                callback(info)
        });
    });
}








































































