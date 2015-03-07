'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var dal = require('./server/dal');

//Initialization
require('./server/dbinit').initialize();

//Socket.io setup
io.on('connection', function (socket) {
    socket.on('initializeQuiltDesigner', function (message, callback) {       
        dal.getQuiltSizes(function (data) {
            callback({
                isNew: true,
                quiltSizeOptions: data
            });
        });
    });
});

//Express settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));

//Express routes
app.get('/', function (req, res) {
    res.redirect('home');
});
app.get('/home', function (req, res) {
    res.render('home');
});
app.get('/design', function (req, res) {
    res.render('quilt-designer');
});
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/lib/angular.js', express.static(path.join(__dirname, 'node_modules', 'angular', 'angular.js')));
app.use('/lib/angular-route.js', express.static(path.join(__dirname, 'node_modules', 'angular-route', 'angular-route.js')));
app.use('/lib/socket.io.js', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'node_modules', 'socket.io-client', 'socket.io.js')));
app.use('/lib/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/lib/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));

//Express startup
server.listen(4000, function () {
    console.log('Started on port 4000...');
});
