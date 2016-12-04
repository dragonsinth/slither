var mapServer = "http://slither.dragonsinth.com";
var ipHUD = null;
var fpsHUD = null;
var friend_list = null;
var friend_scores = null;
var styleHUD = "position: fixed; color: #FFF; font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif; font-size: 12px; overflow: hidden; opacity: 0.7; z-index: 7; display: inline; cursor: default; line-height: 150%;";
var serverID = null;
var mouseCursorCoverDiv = null;
var playparty = false;
var f = false;
var shortmenu = false;
var uID = "";

var nickColors = [
    0xc080ff,
    0x80ff80,
    0xeeee70,
    0xe030e0,
    0xff4040,
    0xffa060,
    0x80d0d0,
    0xff9090,
    0x9099ff
];
var nickColor = 0;

function zoom(e) {
    if (!window.gsc) {
        return;
    }
    e.preventDefault();
    gsc *= Math.pow(0.93, e.wheelDelta / -120 || e.detail / 2 || 0);
    gsc > 2 ? gsc = 2 : gsc < 0.2 ? gsc = 0.2 : null;
}

function zoomByKey(key) {
    var fzoom = key ? -2 : 2;
    gsc *= Math.pow(0.9, fzoom);
    gsc > 2 ? gsc = 2 : gsc < 0.2 ? gsc = 0.2 : null;
}

function removeFrames() {
    var frames = document.getElementsByTagName("iframe");
    for (var i = frames.length - 1; i >= 0; i--) {
        var frame = frames[i];
        frame.parentNode.removeChild(frame);
    }

    // Removing all frames will hang between games unless we replace the ads controller.
    window.adsController = {
        initialize: function () {
        },
        requestAds: function () {
            window.shoa = false;
            window.play_count = 0;
        }
    };
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
    appendDiv("friend-list", "nsi", styleHUD + "left: 8px; bottom: 76px; width: 150px;");
    appendDiv("friend-scores", "nsi", styleHUD + "left: 172px; bottom: 76px; width: 50px;");
    appendDiv("fps-hud", "nsi", styleHUD + "opacity: 0.35; left: 8px; bottom: 58px;");
    appendDiv("ip-hud", "nsi", styleHUD + "font-size: 14px; opacity: 1; left: 8px; bottom: 40px;");
    friend_list = document.getElementById("friend-list");
    friend_scores = document.getElementById("friend-scores");
    ipHUD = document.getElementById("ip-hud");
    fpsHUD = document.getElementById("fps-hud");

    mouseCursorCoverDiv = document.createElement("div");
    mouseCursorCoverDiv.style = "position: fixed; left: 0px; top: 0px; bottom: 0px; right: 0px; z-index: 9999; opacity: 0; cursor: crosshair;";

    scoresList = $('div.nsi').filter(function () {
        var self = $(this);
        return self.width() === 30 &&
            self.height() === 800 &&
            self.css('top') === '32px' &&
            self.css('right') === '230px';
    })[0];

    if (/firefox/i.test(navigator.userAgent)) {
        document.addEventListener("DOMMouseScroll", zoom, false);
    } else {
        document.body.onmousewheel = zoom;
    }
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
                    if (window.snake) {
                        gsc = .5 + .4 / Math.max(1, (window.snake.sct + 16) / 36); // Copied from game.
                    } else {
                        gsc = 0.9
                    }
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
        jQuery('body').append('<div id="bots_menu_options" style="position:fixed;top:2px;z-index:7;left:5px;opacity:0.5;cursor:default;"></div>');
        window.generalstyle = 'color: #FFF; font-family: Consolas, Verdana; font-size: 13px;';
        appendDiv2('txt_hide_menu', 'nsi', window.generalstyle);
        appendDiv2('txt_zoomkey', 'nsi', window.generalstyle);
        appendDiv2('txt_reset', 'nsi', window.generalstyle);
        appendDiv2('txt_die', 'nsi', window.generalstyle);
        appendDiv2('txt_boost', 'nsi', window.generalstyle);
        appendDiv2('txt_hud', 'nsi', window.generalstyle);
        jQuery('#plq').remove(); // blocks team select and color picker
        jQuery('#tips').remove();
        jQuery('#lastscore').css('margin-top', '0px');

        // Color picker.
        var ifh = document.getElementById("playh");
        if (ifh) {
            var cp = document.createElement("div");
            cp.style = "width: 180px; height: 20px; background: #FF0000; margin: auto; margin-top: 12px";
            for (var i in nickColors) {
                var span = document.createElement("span");
                span.value = nickColors[i];
                span.style = "width: 20px; height: 20px; float: left; border: 2px solid #404040;";
                span.style.backgroundColor = toCssColor(nickColors[i]);
                if (nickColor == span.value) {
                    span.style.borderColor = "#FFFFFF"
                }
                cp.appendChild(span);
            }
            ifh.parentNode.insertBefore(cp, ifh);

            cp.onclick = function (e) {
                if (!e.target || e.target.nodeName != "SPAN") {
                    return;
                }
                for (var i = 0; i < cp.children.length; i++) {
                    cp.children[i].style.borderColor = "#404040";
                }
                e.target.style.borderColor = "#FFFFFF";
                nickColor = e.target.value;
                window.localStorage.setItem("nickcolor", nickColor);
            };
        }

        // Ultra low quality render.
        function setRender(qual) {
            localStorage.setItem("qual", qual);
            switch (qual) {
                case "0":
                    grqi.src = "/s/highquality.png";
                    want_quality = 1;
                    render_mode = 2;
                    break;
                case "1":
                    grqi.src = "/s/lowquality.png";
                    want_quality = 0;
                    render_mode = 2;
                    break;
                default:
                    localStorage.setItem("qual", "2");
                    var baseUrl = $("meta[name='dragonslither']").attr("content");
                    grqi.src = baseUrl + "ultralowquality.png";
                    want_quality = 0;
                    render_mode = 1;
                    break;
            }
        }

        grq.onclick = function () {
            switch (localStorage.getItem("qual")) {
                case "0":
                    setRender("1");
                    break;
                case "1":
                    setRender("2");
                    break;
                default:
                    setRender("0");
                    break;
            }
        }
        setRender(localStorage.getItem("qual"));
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

    var nickColorStr = window.localStorage.getItem("nickcolor");
    if (nickColorStr) {
        nickColor = parseInt(nickColorStr)
    }
    if (!nickColor) {
        nickColor = nickColors[Math.floor(Math.random() * nickColors.length)];
        window.localStorage.setItem("nickcolor", nickColor)
    }
}

function getNickname() {
    var nickElem = document.getElementById("previewNick");
    if (!nickElem) {
        nickElem = document.getElementById("nick")
    }
    return nickElem.value;
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
    updateColorCapture();

    if (serverID) {
        ipHUD.innerHTML = '<span style="opacity: .4;">Friends Id: </span><span style="opacity: .6; font-weight: bold; color: #ffff00">' + getServerStr() + '</span></span>';
    } else {
        ipHUD.innerHTML = "";
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
        "color": nickColor,
        x: window.view_xx,
        y: window.view_yy,
        score: getScore(),
    };
    $.ajax({
        type: "POST",
        url: mapServer + "/getId",
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
        score: getScore()
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
        url: mapServer + "/update",
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
    if (!window.playing) {
        // Just clear the everything.
        data = {players: []}
    }

    clearMap();
    for (var i in data.players) {
        var p = data.players[i];
        if (!p.is_me && p.score) {
            createFriend(p.x, p.y, p.color);
        }
    }

    for (var i in data.players) {
        var p = data.players[i];

        function makeFriendDiv() {
            var div = document.createElement("div");
            div.style = "white-space: nowrap; overflow: hidden;";
            return div;
        }

        if (friend_list.children.length <= i) {
            friend_list.appendChild(makeFriendDiv());
        }
        if (friend_scores.children.length <= i) {
            friend_scores.appendChild(makeFriendDiv());
        }

        friend_list.children[i].textContent = p.name;
        friend_list.children[i].style.color = toCssColor(p.color);
        friend_scores.children[i].textContent = p.score;
        friend_scores.children[i].style.color = toCssColor(p.color);
    }

    while (friend_list.children.length > data.players.length) {
        friend_list.removeChild(friend_list.lastChild);
    }
    while (friend_scores.children.length > data.players.length) {
        friend_scores.removeChild(friend_scores.lastChild);
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

// Color capture feature.
var scoresList = null;
var colorMatchRegex = /(.*?)rgb\((\d+), (\d+), (\d+)\)/;
var wasPlaying = false;
var allColors = null;
var newColors = {};

function colorToInt(color) {
    var digits = colorMatchRegex.exec(color);

    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);

    return (red << 16) | (green << 8) | blue;
}

function updateColorCapture() {
    if (!allColors) {
        allColors = {};
        for (var i in nickColors) {
            allColors[nickColors[i]] = 1;
        }
    }

    for (var i = 0; i < scoresList.children.length; i += 2) {
        var span = scoresList.children[i];
        var color = colorToInt(span.style.color);
        if (allColors[color]) {
            continue;
        }
        allColors[color] = 1;
        newColors[color] = 1;
        console.log(toCssColor(color));
    }

    var inGame = window.playing && !window.choosing_skin && window.snake && !window.snake.dead;

    if (wasPlaying && !inGame) {
        var nc = JSON.stringify(newColors);
        if (nc != "{}") {
            //window.alert("New colors!: " + nc);
            console.log(nc);
        }
    }

    if (wasPlaying && !inGame && mouseCursorCoverDiv.parentNode) {
        document.body.removeChild(mouseCursorCoverDiv);
    } else if (!wasPlaying && inGame && !mouseCursorCoverDiv.parentNode) {
        document.body.appendChild(mouseCursorCoverDiv);
    }

    wasPlaying = inGame;
}

init();
