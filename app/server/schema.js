'use strict';

var dbName = require('./config').dbName;
var mongoose = require('mongoose');
    
mongoose.connect(dbName, function (err) {
    if (err) {
        console.log('Error connecting to database: ' + err);
    }
});

var Quilt = new mongoose.Schema({
    name: String,
    creationDate: { type: Date, default: Date.now },
    width: Number,
    height: Number,
    blocks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlacedBlock' }]
});

var Block = new mongoose.Schema({
    name: String,
    creationDate: { type: Date, default: Date.now },
    width: Number,
    height: Number,
    element: {
        name: String, //TODO add validation (restrict to circle, rect, polygon, etc.)
        properties: {}
    },
    systemDefault: Boolean
});

var PlacedBlock = new mongoose.Schema({
    x: Number,
    y: Number,
    z: Number,
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' }
});
    
module.exports = {
    Quilt: mongoose.model('Quilt', Quilt),
    Block: mongoose.model('Block', Block),
    PlacedBlock: mongoose.model('PlacedBlock', PlacedBlock)
};