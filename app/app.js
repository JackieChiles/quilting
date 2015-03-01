'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');

//Express settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
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

//Express startup
server.listen(3000, function () {
    console.log('Started on port 3000...');
});