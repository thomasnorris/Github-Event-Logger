var _path = require('path');
var _bodyParser = require('body-parser');
var _express = require('express');
var _app = _express();

const CFG_FILE = _path.resolve(__dirname, 'config', 'config.json');
var _cfg = readJson(CFG_FILE);

var _mysql = require('mysql');
var _pool = _mysql.createPool(_cfg.sql.connection);

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
        .then((response) => {
            res.status(200).send(response);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
});

_app.set('json spaces', 4);
_app.listen(_cfg.express.port);

console.log('listening on ' + _cfg.express.port);

function logEvent(event, repo, branch) {
    return new Promise((resolve, reject) => {
        (async () => {
            _pool.getConnection((err, connection) => {
                if (err)
                    resolve(err)
                var query = 'call ' + _cfg.sql.connection.database + '.' + _cfg.sql.sp.log_event + '(';
                query += connection.escape(event) + ', ' + connection.escape(repo) + ', ' + connection.escape(branch) + ')';

                connection.query(query, (err, res, fields) => {
                    connection.release();
                    if (err)
                        reject(err);
                    else
                        resolve(res);
                });
            });
        })();
    });
}

function readJson(filePath) {
    var fs = require('fs');
    var path = require('path');
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
}