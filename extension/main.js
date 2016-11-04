var ipHUD = null;
var fpsHUD = null;
var friend_list = null;
var friend_scores = null;
var styleHUD = "color: #FFF; font-family: Arial, \"Helvetica Neue\" Helvetica, sans-serif; font-size: 12px; position: fixed; opacity: 0.35; z-index: 7;";
var serverID = null;
var playparty = false;
var retry = 0;
var f = false;
var shortmenu = false;
var uID = "";

function zoom(e) {
    if (!window.gsc) {
        return;
    }
    e.preventDefault();
    window.lvz *= Math.pow(0.93, e.wheelDelta / -120 || e.detail / 2 || 0);
    window.lvz > 2 ? window.lvz = 2 : window.lvz < 0.1 ? window.lvz = 0.1 : null;
    window.gsc = window.lvz;
}

function zoomByKey(key) {
    var fzoom = key ? -2 : 2;
    window.lvz *= Math.pow(0.9, fzoom);
    window.lvz > 2 ? window.lvz = 2 : window.lvz < 0.1 ? window.lvz = 0.1 : null;
}

function removeFrames() {
    var frames = document.getElementsByTagName("iframe");
    for (var i = frames.length - 1; i >= 0; i--) {
        var frame = frames[i];
        if (frame.src.startsWith("http://imasdk.googleapis.com")) {
            // If this is removed, restarting after death sometimes freezes.
            continue;
        }
        frame.parentNode.removeChild(frame);
    }
}

var hudShouldVis = true;
function updateHudVis() {
    display = (hudShouldVis && window.playing) ? null : "none";
    ipHUD.style.display = display;
    fpsHUD.style.display = display;
    friend_list.style.display = display;
    friend_scores.style.display = display;
}

function init() {
    removeFrames();
    appendDiv("friend-list", "nsi", styleHUD + "opacity: 0.7; left: 8px; bottom: 70px; width: 150px; line-height: 150%");
    appendDiv("friend-scores", "nsi", styleHUD + "opacity: 0.7; left: 158px; bottom: 70px; width: 50px; line-height: 150%");
    appendDiv("fps-hud", "nsi", styleHUD + "left: 8px; bottom: 52px;");
    appendDiv("ip-hud", "nsi", styleHUD + "left: 8px; bottom: 38px;");
    friend_list = document.getElementById("friend-list");
    friend_scores = document.getElementById("friend-scores");
    ipHUD = document.getElementById("ip-hud");
    fpsHUD = document.getElementById("fps-hud");

    if (/firefox/i.test(navigator.userAgent)) {
        document.addEventListener("DOMMouseScroll", zoom, false);
    } else {
        document.body.onmousewheel = zoom;
    }
    window.lvz = window.sgsc;
    window.onkeydown = function (e) {
        if (window.playing && $("#ownmessage").is(":focus") === false) {
            switch (e.keyCode) {
                case 9://TAB
                    e.preventDefault();
                    hudShouldVis = !hudShouldVis;
                    updateHudVis();
                    break;
                case 81://Q
                    gameOver();
                    break;
                case 88://X
                    gsc = 0.9;
                    window.lvz = 0.9;
                    break;
                case 16://Shift
                    setAcceleration(true);
                    break;
                case 77://M
                    zoomByKey(false);
                    zoom(e);
                    break;
                case 78://N
                    zoomByKey(true);
                    zoom(e);
                    break;
                case 72://H
                    hideShortcode();
                    break;
            }
        }
    };
    window.onkeyup = function (e) {
        if (window.playing && $("#ownmessage").is(":focus") === false) {
            switch (e.keyCode) {
                case 16:
                    setAcceleration(false);
                    break;
            }
        }
    };
    setLogoMenu();
    updateLoop();
    loadFPS();
    localStorage.edttsg = "1";
}

function appendDiv(id, className, style) {
    var div = document.createElement("div");
    if (id) {
        div.id = id;
    }
    if (className) {
        div.className = className;
    }
    if (style) {
        div.style = style;
    }
    document.body.appendChild(div);
}

function appendDiv2(id, className, style) {
    var div = document.createElement('div');
    if (id) div.id = id;
    if (className) div.className = className;
    if (style) div.style = style;
    window.bots_menu_options.appendChild(div);
}

function setLogoMenu() {
    var login = document.getElementById("login");
    if (login) {
        loadOptions();
        jQuery('body').append('<div id="bots_menu_options" style="position:fixed;top:2px;z-index:7;left:5px;"></div>');
        window.generalstyle = 'color: #FFF; font-family: Consolas, Verdana; font-size: 13px;';
        appendDiv2('txt_hide_menu', 'nsi', window.generalstyle);
        appendDiv2('txt_zoomkey', 'nsi', window.generalstyle);
        appendDiv2('txt_reset', 'nsi', window.generalstyle);
        appendDiv2('txt_die', 'nsi', window.generalstyle);
        appendDiv2('txt_boost', 'nsi', window.generalstyle);
        appendDiv2('txt_hud', 'nsi', window.generalstyle);
        jQuery('#tips').remove();
        jQuery('#lastscore').css('margin-top', '0px');
    } else {
        setTimeout(setLogoMenu, 100);
    }
}
function hideShortcode() {
    shortmenu ? shortmenu = false : shortmenu = true;
    displayShortcodes()
}

function displayShortcodes() {
    if (window.ws == null || shortmenu == false) {
        jQuery('#bots_menu_options').css('display', 'none');
    } else {
        jQuery('#bots_menu_options').css('display', 'inherit');
    }
}

function loadOptions() {
    var nick = window.localStorage.getItem("nick");
    var nickElem = document.getElementById("previewNick");
    if (!nickElem) {
        nickElem = document.getElementById("nick")
    }
    if (nick != null) {
        document.getElementById("nick").value = nick;
        nickElem.value = nick;
    }
    nickElem.addEventListener("input", function () {
        var nick = nickElem.value;
        window.localStorage.setItem("nick", nick);
    }, false);
}

function getNickname() {
    var nickElem = document.getElementById("previewNick");
    if (!nickElem) {
        nickElem = document.getElementById("nick")
    }
    return nickElem.value;
}

function connectionStatus() {
    if (!window.connecting || retry == 10) {
        window.forcing = false;
        retry = 0;
        return;
    }
    retry++;
    setTimeout(connectionStatus, 1000);
}

function loadFPS() {
    if (window.playing && window.fps && window.lrd_mtm) {
        if (Date.now() - window.lrd_mtm > 970) {
            fpsHUD.textContent = "FPS: " + window.fps;
        }
    }
    setTimeout(loadFPS, 200);
}

function updateLoop() {
    serverID = null;
    if (document.title.startsWith("Friends Id: ")) {
        newID = document.title.substring(12);
        if (newID != "n/a") {
            serverID = newID;
        }
    }

    updateOptions();
    updateHudVis();

    if (serverID) {
        ipHUD.textContent = "Friends Id: " + getServerStr();
    } else {
        ipHUD.textContent = "";
    }

    updateServer();
    setTimeout(updateLoop, 1000);
}

function getServerStr() {
    return serverID || "n/a";
}

function gameOver() {
    if (window.playing) {
        playparty = false;
        window.want_close_socket = -1;
        window.dead_mtm = Date.now() - 5E3;
        window.ws.close();
        window.ws = null;
        window.playing = !1;
        window.connected = !1;
        window.resetGame();
        window.play_btn.setEnabled(!0);
    }
}

init();

function updateOptions() {
    var generalStyle = '<span style = "opacity: 0.8;">';
    window.txt_hide_menu.innerHTML = generalStyle + '<b style="opacity:1;">(H)</b> <span style = "opacity: 0.7;">Hide/Show Key List</span>';
    window.txt_zoomkey.innerHTML = generalStyle + '<b style="opacity:1;">(N/M)</b> <span style = "opacity: 0.7;">Zoom In/Out</span>';
    window.txt_reset.innerHTML = generalStyle + '<b style="opacity:1;">(X)</b> <span style = "opacity: 0.7;">Reset Zoom</span>';
    window.txt_die.innerHTML = generalStyle + '<b style="opacity:1;">(Q)</b> <span style = "opacity: 0.7;">Die</span>';
    window.txt_boost.innerHTML = generalStyle + '<b style="opacity:1;">(SHIFT)</b> <span style = "opacity: 0.7;">Boost</span>';
    window.txt_hud.innerHTML = generalStyle + '<b style="opacity:1;">(TAB)</b> <span style = "opacity: 0.7;">Toggle HUD</span>';
    displayShortcodes()
}

/*
 + See location of all players on the same server with this extension.
 */
function registerServer() {
    var req = {
        "sid": serverID,
        "name": getNickname(),
        "color": getNickcolor(),
        x: window.view_xx,
        y: window.view_yy,
        score: getScore(),
    };
    $.ajax({
        type: "POST",
        url: "http://slither.dragonsinth.com/getId",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(req),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            uID = data.id;
            updateServer();
        },
        failure: function (errMsg) {
            console.log("err: " + errMsg);
        }
    });
}

function updateServer() {
    if (!uID && !window.playing) {
        // Nothing to do.
        return;
    }

    if (!serverID) {
        // Can't do anything with no server.
        return;
    }

    if (!uID) {
        // Try to register.
        registerServer();
        return;
    }

    var req = {
        id: uID,
        x: window.view_xx,
        y: window.view_yy,
        score: getScore(),
    };

    if (!window.playing) {
        // Send a final 'death' update.
        req.x = 0;
        req.y = 0;
        req.score = 0;
        uID = null;
    }

    $.ajax({
        type: "POST",
        url: "http://slither.dragonsinth.com/update",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(req),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: updateFriends,
        failure: function (errMsg) {
            console.log("err: " + errMsg);
        }
    });
}

function updateFriends(data) {
    clearMap();
    for (var i in data.players) {
        var p = data.players[i];
        if (!p.is_me && p.score) {
            createFriend(p.x, p.y, p.color);
        }
    }

    while (friend_list.firstChild) {
        friend_list.removeChild(friend_list.firstChild);
    }
    while (friend_scores.firstChild) {
        friend_scores.removeChild(friend_scores.firstChild);
    }
    for (var i in data.players) {
        var p = data.players[i];
        var fn = document.createElement("span");
        fn.textContent = p.name;
        fn.style.color = toCssColor(p.color);
        friend_list.appendChild(fn);
        friend_list.appendChild(document.createElement("br"));
        var fs = document.createElement("span");
        fs.textContent = p.score;
        fs.style.color = toCssColor(p.color);
        friend_scores.appendChild(fs);
        friend_scores.appendChild(document.createElement("br"));
    }
}

function toCssColor(color) {
    color = color.toString(16);
    var pad = "#000000";
    color = pad.substring(0, pad.length - color.length) + color;
    return color;
}

function createFriend(posX, posY, color) {
    var mapDiv = $("[style='position: fixed; right: 16px; bottom: 16px; height: 104px; width: 104px; z-index: 10; display: inline; opacity: 1;']");
    var friendDot = document.createElement("div");
    friendDot.className = "nsi";
    friendDot.style.opacity = 1;
    friendDot.classList.add("aFriend");
    friendDot.style.position = "absolute";
    friendDot.style.zIndex = 12;
    friendDot.style.left = Math.round(57 + 40 * (posX - grd) / grd - 7) + "px";
    friendDot.style.top = Math.round(57 + 40 * (posY - grd) / grd - 7) + "px";
    friendDot.style.width = "4px";
    friendDot.style.height = "4px";
    friendDot.style.backgroundColor = toCssColor(color);
    trf(friendDot, agpu);
    mapDiv.append(friendDot);
}

function clearMap() {
    $(".aFriend").remove();
}

function getScore() {
    var snake = window.snake;
    if (!snake) {
        return 0;
    }
    var s = Math.round(Math.round(150 * (fpsls[snake.sct] + snake.fam / fmlts[snake.sct] - 1) - 50) / 10);
    if (typeof s != 'undefined') {
        return s;
    } else {
        return 0;
    }
}

var nickColor = 0;
function getNickcolor() {
    var colors = [
        0xff0000, 0x00ff00, 0x0000ff,
        0xff7f7f, 0x7fff7f, 0x7f7fff,
        0x00ffff, 0xff00ff, 0xffff00,
        0x007fff, 0x7f00ff, 0x7fff00,
        0x00ff7f, 0xff007f, 0xff7f00
    ];
    if (!nickColor) {
        nickColor = colors[Math.floor(Math.random() * colors.length)];
    }
    return nickColor;
}
