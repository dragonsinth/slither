window.addEventListener("load", myMain, false);
function myMain(evt) {
    chrome.storage.local.get(null, function (output) {
        if (output["enabled"] == "true" || output["enabled"] == null || output["enabled"] == undefined) {

            var slitherScript = document.createElement("SCRIPT");
            var script = document.createElement("SCRIPT");
            script.src = chrome.extension.getURL("jquery.js");
            document.getElementsByTagName('head')[0].appendChild(script);

            script.addEventListener("load", function () {
                slitherScript.src = chrome.extension.getURL("main.js");
                document.getElementsByTagName('head')[0].appendChild(slitherScript);
            });
            var css = document.createElement("LINK");
            css.href = chrome.extension.getURL("bootstrap.css");
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.media = 'screen';
            document.getElementsByTagName('head')[0].appendChild(css);
        }
    });
}
