'use strict';

var dbName = require('./config').dbName;
var mongoose = require('mongoose');
    
mongoose.connect(dbName, function (err) {
    if (err) {
        console.log('Error connecting to database: ' + err);
    }
});
    
module.exports = {
    Quilt: mongoose.model('Quilt', new mongoose.Schema({
        name: String,
        creationDate: { type: Date, default: Date.now },
        width: Number,
        height: Number,
        svg: String
    })),
    Block: mongoose.model('Block', new mongoose.Schema({
        name: String,
        creationDate: { type: Date, default: Date.now },
        width: Number,
        height: Number,
        svg: String,
        systemDefault: Boolean
    }))
};