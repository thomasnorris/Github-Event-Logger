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
    if (!req.body) {
        // log this
        res.send(409).send('No payload');
    }
    else {
        logEvent(req)
            .then((response) => {
                res.status(200).send(response);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
    }

});

_app.set('json spaces', 4);
_app.listen(_cfg.express.port);

console.log('listening on ' + _cfg.express.port);

function logEvent(req) {
    var payload = req.body;
    var event = req.get('X-GitHub-Event');
    var action = payload.action || '';
    var repoName = payload.repository.name;
    var repoOwner = payload.repository.owner.login;
    var branch = payload.ref ? payload.ref.replace('refs/heads/', '') : '';
    var sender = payload.sender.login || '';

    return new Promise((resolve, reject) => {
        (async () => {
            _pool.getConnection((err, connection) => {
                if (err)
                    resolve(err)
                var query = 'call ' + _cfg.sql.connection.database + '.' + _cfg.sql.sp.log_event + '(';
                query += connection.escape(event) + ', ' + connection.escape(repoName) + ', ' + connection.escape(repoOwner) + ', ';
                query += connection.escape(action) + ', ' + connection.escape(branch) + ', ' + connection.escape(sender) + ')';

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