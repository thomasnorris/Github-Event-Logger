var _path = require('path');
var _express = require('express');
var _app = _express();

const CFG_FILE = _path.resolve(__dirname, 'config', 'config.json');
var _cfg = readJson(CFG_FILE);

_app.post(_cfg.express.endpoint, (req, res) => {
    var payload = req.body
});

_app.set('json spaces', 4);
_app.use(_express.json());
_app.listen(_cfg.express.port);

function readJson(filePath) {
    var fs = require('fs');
    var path = require('path');
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
}