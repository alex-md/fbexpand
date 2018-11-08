javascript: (function () {
    var todo = 14;
    var EXPAND_POST = 1;
    var EXPAND_COMMENTS = 2;
    var EXPAND_REPLIES = 4;
    var EXPAND_XLAT = 0;
    var WAIT_TIME = 10;
    var MAX_WAIT = 20;
    var END_DELAY = 2.5;
    var CSS_COMMENT_AREA = "UFIList";
    var ATTR_SHOW_COMMENT_AREA = "data-comment-prelude-ref";
    var CSS_SHOW_COMMENT_AREA = "UFIBlingBox";
    var CSS_SHOW_COMMENT_AREA_2 = "uiBlingBox";
    var _NONE = "no-value";
    var _COMMENTS = "-comments";
    var _REPLIES = "-replies";
    var EXPOSE_CONTENT = "text_exposed_link";
    var CSS_PAGER = "UFIPagerLink";
    var CSS_LINK_TEXT = "UFIReplySocialSentenceLinkText";
    var CSS_SEE_MORE = "fss";
    var CSS_GROUPS_SIDE_MARGIN = "groupsSideMargin";
    var CSS_COMMENT = "UFIComment";
    var CSS_REPLY_LIST = "UFIReplyList";
    var CSS_XLAT_POST = "_43f9";
    var CSS_XLAT_COMMENT = "UFITranslateLink";
    var CSS_XLATED = "UFITranslatedText";
    var CSS_LOGIN_OVERLAY = "_5hn6";
    var CSS_LOGIN_DIALOG = "generic_dialog_modal";
    var CSS_PERMALINK = "permalinkPost";
    var CSS_VIDEO_TABS = "_3m1v";
    function initGlobals() {
        delete window.abortNow;
        delete window.logger;
        delete window.rootNode;
        delete window.timeouts;
        delete window.isVideo;
    }
    function keyboardOn() {
        window.abortNow = false;
        document.addEventListener("keyup", docKeyUp);
    }
    function keyboardOff() {
        window.abortNow = true;
        document.removeEventListener("keyup", docKeyUp);
    }
    function docKeyUp(e) {
        if (e.keyCode == 27) {
            myLog("Aborting...");
            window.abortNow = true;
        }
    }
    function showStatusWindow() {
        var WANT_W = 300;
        var WANT_H = 200;
        var sizer = document.getElementsByTagName("html")[0];
        var w = sizer.clientWidth;
        var h = sizer.clientHeight;
        var x = 0;
        if (w > WANT_W) {
            x = (w - WANT_W) / 2;
        }
        var y = 0;
        if (h > WANT_H) {
            y = (h - WANT_H) / 3;
        }
        var div = document.createElement("div");
        div.id = "status-window";
        div.style.direction = "ltr";
        div.style.position = "fixed";
        div.style.zIndex = "999999";
        div.style.left = x + "px";
        div.style.width = WANT_W + "px";
        div.style.top = y + "px";
        div.style.height = WANT_H + "px";
        var container = document.body;
        container.insertBefore(div, container.firstChild);
        var edit = document.createElement("textarea");
        edit.style.width = "100%";
        edit.style.height = "100%";
        edit.style.color = "#fff";
        edit.style.backgroundColor = "#425f9c";
        div.appendChild(edit);
        window.logger = edit;
    }
    function hideStatusWindow() {
        var div = document.getElementById("status-window");
        document.body.removeChild(div);
        initGlobals();
    }
    function myLog(s) {
        console.log(s);
        window.logger.value = s + "\n" + window.logger.value;
    }
    function getResponseCount() {
        return window.rootNode.getElementsByClassName(CSS_COMMENT).length;
    }
    function logCounts() {
        if (!window.rootNode) {
            return;
        }
        if (window.timeouts > 0) {
            myLog(window.timeouts + " timeout(s)");
        }
        var comments = 0;
        var replies = 0;
        var cr = window.rootNode.getElementsByClassName(CSS_COMMENT);
        for (var i = 0; i < cr.length; i++) {
            var role = cr[i].getAttribute("aria-label");
            role = "Comment" ? comments++ : replies++;
        }
        myLog("Comments + replies = " + comments + " + " + replies + " = " + cr.length);
    }
    function endSession() {
        logCounts();
        keyboardOff();
        window.setTimeout(hideStatusWindow, END_DELAY * 1000);
    }

    function getStyle(node) {
        return node.ownerDocument.defaultView.getComputedStyle(node, null);
    }
    function isHidden(node) {
        while (node && node.ownerDocument) {
            if (getStyle(node)["display"] == "none") {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    function hasClassName(node, className) {
        var i = node.className.indexOf(className);
        if (i < 0) {
            return false;
        }
        var x = node.className.length - className.length;
        if (x === 0) {
            return true;
        }
        if (i === 0) {
            return node.className.indexOf(className + " ") === 0;
        }
        if (i === x) {
            return node.className.indexOf(" " + className) === x - 1;
        }
        return node.className.indexOf(" " + className + " ") > 0;
    }
    function getAncestorById(node, id) {
        while (node) {
            node = node.parentNode;
            if (node && node.id == id) {
                return node;
            }
        }
        return null;
    }
    function getAncestorByType(node, type, deflt) {
        while (node) {
            node = node.parentNode;
            if (node && node.nodeName == type) {
                return node;
            }
        }
        return deflt;
    }
    function getAncestorByClass(node, className) {
        while (node) {
            node = node.parentNode;
            if (node && node.className && hasClassName(node, className)) {
                return node;
            }
        }
        return null;
    }
    function determineRoot() {
        window.rootNode = document;
        if (isVideo()) {
            var comments = document.getElementsByClassName("collapsible_comments");
            for (var i = 0; i < comments.length; i++) {
                if (!!getAncestorByClass(comments[i], "hidden_elem")) {
                    continue;
                }
                myLog("Expanding video comments");
                window.rootNode = comments[i];
                return;
            }
        }
        var divs = document.getElementsByClassName(CSS_PERMALINK);
        if (divs.length === 1) {
            myLog("Expanding permalinked post only");
            window.rootNode = divs[0];
            return;
        }
    }
    function getContentSize() {
        return window.rootNode.offsetHeight;
    }
    function deleteOverlay() {
        var divs = document.getElementsByClassName(CSS_LOGIN_OVERLAY);
        if (divs.length === 1) {
            myLog("Removing Sign Up overlay");
            divs[0].parentNode.removeChild(divs[0]);
        }
        divs = document.getElementsByClassName(CSS_LOGIN_DIALOG);
        if (divs.length === 1) {
            myLog("Removing login dialog");
            divs[0].parentNode.removeChild(divs[0]);
        }
    }
    function getVideo() {
        var nodes = document.getElementsByClassName("_ox1");
        var bSkipped = false;
        for (var i = 0; i < nodes.length; i++) {
            if (!!getAncestorById(nodes[i], "contentArea")) {
                bSkipped = true;
                continue;
            }
            return bSkipped ? false : nodes[i];
        }
        return null;
    }
    function isVideo() {
        if (typeof window.isVideo === "undefined") {
            window.isVideo = !!getVideo();
        }
        return window.isVideo;
    }
    function isTheater() {
        if (getVideo() === false) {
            return true;
        }
        var node = document.getElementById("photos_snowlift");
        if (node) {
            return !isHidden(node);
        }
        return false;
    }
    function prepIfVideo(onDone) {
        var acted = false;
        if (isVideo()) {
            var nodes = window.rootNode.getElementsByClassName(CSS_VIDEO_TABS);
            if (nodes.length > 0) {
                if (nodes[0].getAttribute("aria-selected") == "false") {
                    nodes[0].click();
                    acted = true;
                }
            }
            if (nodes.length > 2) {
                if (nodes[2].getAttribute("aria-selected") == "false") {
                    nodes[2].click();
                    acted = true;
                }
            }
        }
        if (acted) {
            myLog("Activated Comments tab of video");
        }
        if (isVideo()) {
            var links = window.rootNode.getElementsByClassName("_2xui");
            if (links.length > 0) {
                if (!isHidden(links[0])) {
                    myLog('Clicking "' + links[0].textContent + '"');
                    links[0].click();
                }
            }
        }
        if (onDone) {
            window.setTimeout(onDone, 0);
        }
    }
    function ensureCommentsShowing(value, onDone) {
        var byClass = value != null;
        var showers = byClass ? window.rootNode.getElementsByClassName(value) : window.rootNode.getElementsByTagName("A");
        var filter = [];
        for (var i = 0; i < showers.length; i++) {
            if (byClass || showers[i].getAttribute(ATTR_SHOW_COMMENT_AREA)) {
                var root = getAncestorByType(showers[i], "FORM", document);
                var area = root.getElementsByClassName(CSS_COMMENT_AREA);
                if (area.length == 0) {
                    filter.push(showers[i]);
                }
            }
        }
        if (filter.length > 0) {
            myLog("Showing comment area for " + filter.length + " post(s)");
            clickAndWait(_NONE, onDone, filter, 0);
        } else {
            if (onDone) onDone();
        }
    }
    function isHideReplies(link) {
        if (hasClassName(link, CSS_LINK_TEXT)) {
            if (link.textContent.indexOf("\xB7") >= 0) {
                return false;
            }
            return isNaN(window.parseInt(link.textContent, 10));
        }
        return false;
    }
    function isNewWindow(link) {
        var anchors = link.getElementsByTagName("A");
        if (anchors.length > 0) {
            return !!anchors[0].getAttribute("target");
        }
        return false;
    }
    function newWindowNow(link) {
        var anchors = link.getElementsByTagName("A");
        if (anchors.length > 0) {
            var target = anchors[0].getAttribute("target");
            if (target) {
                myLog("New window: " + anchors[0].textContent);
                var w = window.open(anchors[0].getAttribute("href"), target);
                if (!w) {
                    myLog("New window was blocked!");
                }
            }
        }
    }
    function clickClass(value, onDone) {
        if (window.abortNow) {
            if (onDone) onDone();
            return;
        }
        var links = window.rootNode.getElementsByClassName(value);
        var filter = [];
        for (var i = 0; i < links.length; i++) {
            if (value === EXPOSE_CONTENT) {
                if (getAncestorByClass(links[i], CSS_GROUPS_SIDE_MARGIN)) {
                    continue;
                }
                if (!isHidden(links[i]) && links[i].children.length > 0) {
                    if (isNewWindow(links[i])) {
                        if ((todo && EXPAND_POST) != 0) {
                            newWindowNow(links[i]);
                        }
                    } else {
                        filter.push(links[i].children[0]);
                    }
                }
                continue;
            }
            if (value === CSS_XLAT_POST) {
                if (links[i].children.length > 0 && links[i].children[0].nodeName === "A") {
                    filter.push(links[i].children[0]);
                }
                continue;
            }
            if (value === CSS_XLAT_COMMENT) {
                if (links[i].children.length > 0) {
                    continue;
                }
                if (!getAncestorByClass(links[i], CSS_XLATED)) {
                    filter.push(links[i]);
                }
                continue;
            }
            if (isHideReplies(links[i])) { } else if (value === CSS_SEE_MORE && links[i].nodeName === "SPAN") {
                continue;
            } else {
                filter.push(links[i]);
            }
        }
        if (filter.length > 0) {
            clickAndWait(value, onDone, filter, 0);
        } else {
            if (onDone) onDone();
        }
    }
    function doNotWait(value) {
        var check = [CSS_SEE_MORE, CSS_XLAT_COMMENT, EXPOSE_CONTENT];
        return check.indexOf(value) >= 0;
    }
    function commentsOrReplies(comments, onDone) {
        if (window.abortNow) {
            if (onDone) onDone();
            return;
        }
        var links = window.rootNode.getElementsByClassName(CSS_PAGER);
        var filter = [];
        for (var i = 0; i < links.length; i++) {
            var isReply = getAncestorByClass(links[i], CSS_REPLY_LIST) != null;
            if (comments && !isReply) {
                filter.push(links[i]);
            } else if (!comments && isReply) {
                filter.push(links[i]);
            }
        }
        if (filter.length > 0) {
            clickAndWait(comments ? _COMMENTS : _REPLIES, onDone, filter, 0);
        } else {
            if (onDone) onDone();
        }
    }
    function clickAndWait(value, onDone, links, i) {
        if (window.abortNow) {
            if (onDone) onDone();
            return;
        }
        var label = links[i].getAttribute("aria-label");
        if (!label) {
            label = links[i].textContent;
        }
        var isBad = false;
        if (value == _REPLIES) {
            isBad = getAncestorByClass(links[i], CSS_REPLY_LIST) == null;
        }
        if (!isBad) {
            myLog("click (" + (links.length - i - 1) + " left): " + label);
            links[i].click();
        }
        var n = getContentSize();
        var wait = MAX_WAIT;
        var time = WAIT_TIME;
        if (isBad || doNotWait(value)) {
            wait = -1;
            time = 0;
        }
        if (value == _NONE) {
            time *= 5;
        }
        window.setTimeout(function () {
            waitHelper(value, onDone, links, i, n, wait);
        }, time);
    }
    function waitHelper(value, onDone, links, i, n, wait) {
        if (wait === -1) {
            if (++i < links.length) {
                clickAndWait(value, onDone, links, i);
            } else {
                if (onDone) onDone();
            }
            return;
        }
        if (getContentSize() - n != 0) {
            if (++i < links.length) {
                clickAndWait(value, onDone, links, i);
            } else {
                if (value == _COMMENTS || value == _REPLIES) {
                    commentsOrReplies(value == _COMMENTS, onDone);
                } else {
                    clickClass(value, onDone);
                }
            }
            return;
        }
        if (wait > 0) {
            window.setTimeout(function () {
                waitHelper(value, onDone, links, i, n, --wait);
            }, WAIT_TIME);
            return;
        }
        window.timeouts++;
        if (++i < links.length) {
            clickAndWait(value, onDone, links, i);
        } else {
            if (onDone) onDone();
        }
    }
    function pumpOnce(onDone) {
        window.responseCount = getResponseCount();
        if ((todo && EXPAND_COMMENTS) != 0) {
            commentsOrReplies(true, function () {
                pumpOnce2(onDone);
            });
        } else {
            pumpOnce2(onDone);
        }
    }
    function pumpOnce2(onDone) {
        if ((todo && EXPAND_REPLIES) != 0) {
            clickClass(CSS_LINK_TEXT, function () {
                pumpOnce3(onDone);
            });
        } else {
            pumpOnce3(onDone);
        }
    }
    function pumpOnce3(onDone) {
        if ((todo && EXPAND_REPLIES) != 0) {
            commentsOrReplies(false, function () {
                pumpOnce4(onDone);
            });
        } else {
            pumpOnce4(onDone);
        }
    }
    function pumpOnce4(onDone) {
        if (getResponseCount() > window.responseCount) {
            window.setTimeout(function () {
                pumpOnce(onDone);
            }, 500);
        } else {
            if (onDone) onDone();
        }
    }
    function setUpActions() {
        window.timeouts = 0;
        var actions = window.actions = [];
        actions.push(function (onDone) {
            prepIfVideo(onDone);
        });
        actions.push(function (onDone) {
            ensureCommentsShowing(null, onDone);
        });
        actions.push(function (onDone) {
            ensureCommentsShowing(CSS_SHOW_COMMENT_AREA, onDone);
        });
        actions.push(function (onDone) {
            ensureCommentsShowing(CSS_SHOW_COMMENT_AREA_2, onDone);
        });
        actions.push(function (onDone) {
            clickClass(EXPOSE_CONTENT, onDone);
        });
        actions.push(function (onDone) {
            pumpOnce(onDone);
        });
        if ((todo && EXPAND_XLAT) != 0) {
            actions.push(function (onDone) {
                clickClass(CSS_XLAT_POST, onDone);
            });
            actions.push(function (onDone) {
                clickClass(CSS_XLAT_COMMENT, onDone);
            });
        }
        actions.push(function (onDone) {
            clickClass(CSS_SEE_MORE, onDone);
        });
        actions.push(endSession);
        actions.push(null);
    }
    function doActions(i) {
        if (window.actions[i] != null) {
            window.actions[i](function () {
                doActions(i + 1);
            });
        }
    }
    function main() {
        initGlobals();
        showStatusWindow();
        keyboardOn();
        deleteOverlay();
        if (isTheater()) {
            myLog("Theater mode is not supported.");
            endSession();
            return;
        }
        setUpActions();
        doActions(0);
        determineRoot();
    }
    if (window.logger) {
        if (!window.abortNow) {
            myLog("Aborting...");
        }
        window.abortNow = true;
    } else {
        main();
    }
})();
