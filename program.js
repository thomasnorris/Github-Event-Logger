var _path = require('path');
var _logger = require(_path.resolve(__dirname, 'Node-Logger', 'app.js'));

var _bodyParser = require('body-parser');
var _express = require('express');
var _app = _express();

const CFG_FILE = _path.resolve(__dirname, 'config', 'config.json');
var _cfg = readJson(CFG_FILE);

var _mysql = require('mysql');
var _pool = _mysql.createPool(_cfg.sql.connection);

_app.use(_bodyParser.json());

_app.post(_cfg.express.endpoint, (req, res) => {
    var event = req.get('X-GitHub-Event');

    if (!req.body) {
        _logger.Error.Async('No payload', 'Event: ' + event);
        res.send(409).send('No payload');
    }
    else {
        logEvent(req, event)
            .then((results) => {
                _logger.Info.Async('Event logged');
                res.status(200).send(results);
            })
            .catch((err) => {
                _logger.Error.Async('Event not logged', err);
                res.status(500).send(err);
            });
    }

});

_app.set('json spaces', 4);
_app.listen(_cfg.express.port);

_logger.Init.Async('Server listening', 'localhost:' + _cfg.express.port);

function logEvent(req, event) {
    var payload = req.body;
    var action = payload.action || '';
    var name = payload.repository.name;
    var branch = payload.ref ? payload.ref.replace('refs/heads/', '') : '';
    var sender = payload.sender.login || '';

    return new Promise((resolve, reject) => {
        (async () => {
            _pool.getConnection((err, connection) => {
                if (err)
                    resolve(err)
                var query = 'call ' + _cfg.sql.connection.database + '.' + _cfg.sql.sp.log_event + '(';
                query += connection.escape(event) + ', ' + connection.escape(name) + ', ' + connection.escape(action) + ', ';
                query += connection.escape(branch) + ', ' + connection.escape(sender) + ')';

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