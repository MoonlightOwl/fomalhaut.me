var listing = ". . . . . .";
var printed = "";
var position = 0;
var lines = 0;
var MAX_LINES = 5;

var scroller = document.getElementById("scroller");
var language = "lua";

function rewind() {
    if (lines < MAX_LINES) lines++;
    else printed = printed.substring(printed.indexOf("\n") + 1);
}

function type() {
    printed += listing[position];
    if (listing[position] === '\n') rewind();
    scroller.innerHTML = hljs.highlight(language, printed, true).value;

    if (position < listing.length - 1) {
        position ++;
        var timeout = Math.random() * ((position < listing.length && listing[position] !== ' ' && listing[position + 1] === ' ') ? 500 : 60);
        setTimeout(type, timeout);
    }
    else {
        rewind();
        printed += "\n";
        position = 0;
        fetch();
    }
}


function extensionToLanguage(extension) {
    if (hljs.getLanguage(extension) !== undefined) return extension;
    else
        switch (extension) {
            case "kt": return "kotlin";
            case "rb": return "ruby";
            case "sbt": return "scala";
            case "rs": return "rust";
            case "png": case "jpg": case "jpeg": case "bmp": case "ico":
            case "jar": return undefined;
            default: return "ini";
        }
}


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
