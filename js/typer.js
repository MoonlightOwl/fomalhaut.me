/**
 * An ever programming version of myself :3
 */

var TYPING = 0, MISTYPING = 1, BACKSPACING = 2;

var MAX_LINES = 5;               // how long will be the visible part of a listing
var lines = 0;                   // how long it is right now
var listing = ". . . . . .";     // the full listing itself
var printed = "";                // the visible part of it
var position = 0;                // cursor position
var ERRORS_RATE = 0.1;           // the probability of typing wrong word
var error_position = -1;         // some random word from the listing, printed 'by error'
var state = TYPING;              // do 'I' write the code or undo some errors
var language = "lua";            // current language (for syntax highlighting)

// emulation container
var scroller = document.getElementById("scroller");


// hacked up way to emulate `Enter`
function rewind() {
    if (lines < MAX_LINES) lines++;
    else printed = printed.substring(printed.indexOf("\n") + 1);
}

function isLetter(char) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

// search for random word in the listing (for 'errors' emulation)
function findErrorPosition() {
    var position = Math.round(Math.random() * listing.length);
    // adjust to the beginning of the next word
    while (position < listing.length && isLetter(listing[position])) position++;
    while (position < listing.length && !isLetter(listing[position])) position++;
    //
    if (position < listing.length)
        return position;
    else
        return -1;
}

function ongoingChar() {
    return listing[ state === MISTYPING ? error_position : position ]
}
function atBeginningOfWord() {
    return isLetter(ongoingChar()) && !isLetter(printed.slice(-1));
}
function atEndOfWord() {
    return !isLetter(ongoingChar()) && isLetter(printed.slice(-1));
}

// do yet another letter
function type() {
    // what am I thinking of?
    if (state === TYPING && atBeginningOfWord() && Math.random() < ERRORS_RATE) {
        error_position = findErrorPosition();
        if (error_position !== -1) state = MISTYPING;
    } else if (state === MISTYPING && atEndOfWord()) {
        state = BACKSPACING;
    } else if (state === BACKSPACING && atBeginningOfWord()) {
        state = TYPING;
    }
    // type
    if (state === BACKSPACING)
        printed = printed.slice(0, -1);
    else {
        printed += ongoingChar();
        if (ongoingChar() === '\n') rewind();
    }
    // update HTML
    scroller.innerHTML = hljs.highlight(language, printed, true).value;
    // move pointer
    if (state === TYPING) position++;
    if (state === MISTYPING) error_position++;
    if (position >= listing.length) {
        rewind();
        printed += "\n";
        position = 0;
        fetch();
    } else if (error_position >= listing.length) {
        state = BACKSPACING;
    } else {
        var timeout = Math.random() * (state === BACKSPACING ? 180 : (atEndOfWord() ? 450 : 60));
        setTimeout(type, timeout);
    }
}


// try and guess the language of given source code file by the file extension
function extensionToLanguage(extension) {
    if (hljs.getLanguage(extension) !== undefined) return extension;
    else
        switch (extension) {
            case "kt": return "kotlin";
            case "rb": return "ruby";
            case "sbt": return "scala";
            case "rs": return "rust";
            case "png": case "jpg": case "jpeg": case "bmp": case "ico":
            case "jar": case "ttf": return undefined;
            default: return "ini";
        }
}


// list of my GitHub repositories
var repos = [];

function httpGetAsync(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// get random file listing
function fetch() {
    var repo = repos[Math.floor(Math.random() * repos.length)];
    console.log("From repo: " + repo.name);
    httpGetAsync("https://api.github.com/repos/MoonlightOwl/" + repo.name + "/git/trees/master?recursive=1", function(data) {
        var tree = JSON.parse(data).tree;
        var files = tree.filter(function(item) { return item.type === "blob"; });
        var file = files[Math.floor(Math.random() * files.length)];
        console.log(file.path);
        httpGetAsync("https://raw.githubusercontent.com/MoonlightOwl/" + repo.name + "/master/" + file.path, function (data) {
            listing = data;
            language = extensionToLanguage(file.path.split('.').pop());
            console.log("(language: " + language + ")");
            // run typing again, if got correct language
            if (language === undefined) fetch();
            else setTimeout(type, Math.random() * 500);
        })
    });
}


// get overall info about my GitHub account and my repos
httpGetAsync("https://api.github.com/users/MoonlightOwl/repos", function(data) {
    repos = JSON.parse(data);
    // get some code to type
    fetch();
});

