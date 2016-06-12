var express = require('express');
var router = express.Router();
var app = express(); 

/* GET home page. */
app.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname + 'index.html'));
});

module.exports = router;
