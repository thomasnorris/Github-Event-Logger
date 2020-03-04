var _path = require('path');
var _bodyParser = require('body-parser');
var _express = require('express');
var _app = _express();

const CFG_FILE = _path.resolve(__dirname, 'config', 'config.json');
var _cfg = readJson(CFG_FILE);

_app.use(_bodyParser.json());

_app.post(_cfg.express.endpoint, (req, res) => {
    var payload = req.body;
    if (!payload) {
        // log this
    }

    var event = req.get('X-GitHub-Event');
    var repo = payload.repository.name;
    var branch = payload.ref.replace('refs/heads/', '');
    logEvent(event, repo, branch)
        .then(() => {
            res.status(200).send();
        })
        .catch(() => {
            res.status(500).send();
        });
    res.status(200).send();
});

_app.set('json spaces', 4);
_app.listen(_cfg.express.port);

console.log('listening on ' + _cfg.express.port);

function logEvent(event, repo, branch) {
    return new Promise((resolve, reject) => {

    });
}

function readJson(filePath) {
    var fs = require('fs');
    var path = require('path');
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
}