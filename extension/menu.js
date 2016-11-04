$(document).ready(function () {
    var storage = chrome.storage.local;
    storage.get(null, function (output) {
        if (output["enabled"] == undefined || output["enabled"] == null || output["enabled"] == "true") {
            storage.set({"enabled": "true"});
            $("#toggle").addClass("on");
            $("#toggle span").text('Enabled (click to disable)');
        } else {
            $("#toggle").addClass("off");
            $("#toggle span").text('Disabled (click to enable)');
        }
    });
    $("#toggle").click(function () {
        storage.get(null, function (output) {
            if (output["enabled"] == "true") {
                storage.set({"enabled": "false"});
                $("#toggle span").text('Disabled (click to enable)');
            } else {
                storage.set({"enabled": "true"});
                $("#toggle span").text('Enabled (click to disable)');
            }
            $("#toggle").toggleClass("on");
            $("#toggle").toggleClass("off");
        });
    });
});