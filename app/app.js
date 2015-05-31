'use strict';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var dal = require('./server/dal');

//Database initialization
dal.initialize();

//Socket.io setup
io.on('connection', function (socket) {
    //message: {}
    socket.on('getQuiltSizeOptions', function (message, callback) {       
        dal.getQuiltSizeOptions(function (options) {
            callback(options);
        });
    });
    
    //message: { size: { name, width, height, unit }, name }
    socket.on('newQuilt', function (message, callback) {
        if (message) {
            dal.newQuilt(message.size, message.name, function (quilt) {
                callback(quilt);
            });
        }
    });
    
    //message: { id }
    socket.on('getQuilt', function (message, callback) {
        if (message) {
            dal.getQuilt(message.id, function (quilt) {
                callback(quilt);
            });
        }
    });
    
    //message: {}
    socket.on('getGridSnapGranularityOptions', function (message, callback) {       
        dal.getGridSnapGranularityOptions(function (options) {
            callback(options);
        });
    });
    
    //message: {}
    socket.on('getPredefinedBlocks', function (message, callback) {       
        dal.getPredefinedBlocks(function (blocks) {
            callback(blocks);
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
app.get('/design/:id', function (req, res) {
    res.render('quilt-designer');
});
app.get('/design/', function (req, res) {
    res.redirect('new');
});
app.get('/new', function (req, res) {
    res.render('quilt-new');
});
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/lib/angular.js', express.static(path.join(__dirname, 'node_modules', 'angular', 'angular.js')));
app.use('/lib/angular-route.js', express.static(path.join(__dirname, 'node_modules', 'angular-route', 'angular-route.js')));
app.use('/lib/socket.io.js', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'node_modules', 'socket.io-client', 'socket.io.js')));
app.use('/lib/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/lib/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/lib/snap.svg.js', express.static(path.join(__dirname, 'node_modules', 'snapsvg', 'dist', 'snap.svg.js')));
app.use('/lib/angular-color-picker', express.static(path.join(__dirname, 'node_modules', 'angular-color-picker')));

//Express startup
server.listen(4000, function () {
    console.log('Started on port 4000...');
});
