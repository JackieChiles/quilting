'use strict';

var schema = require('./schema');
var staticData = require('./dbstatic');

module.exports.getQuiltSizeOptions = function (callback) {
    callback(staticData.quiltSizeOptions);
};

module.exports.getQuilt = function (id, callback) {
    var query = schema.Quilt.findOne({ '_id': id });

    query.exec(function (err, result) {
        if (err) {
            console.log('Error retrieving quilt: ' + err);
            return;
        }
        
        callback(result);
    });
};

module.exports.newQuilt = function (size, name, callback) {
    var m = new schema.Quilt();

    m.name = name;
    m.width = size.width;
    m.height = size.height;

    m.save(function (err, result) {
        if (err) {
            console.log('Error saving new quilt: ' + err);
            return;
        }

        module.exports.getQuilt(result._id, callback);
    });
};

module.exports.updateQuilt = function (quilt, callback) {
    schema.Quilt.update({ _id: quilt._id }, quilt, {}, function (err, result) {
        if (err) {
            console.log('Error updating quilt: ' + err);
            return;
        }

        callback(result);
    });
};

module.exports.getGridSnapGranularityOptions = function (callback) {
    callback(staticData.gridSnapGranularityOptions);
};

module.exports.getPredefinedBlocks = function (callback) {
    var query = schema.Block.find({ systemDefault: true });

    query.exec(function (err, result) {
        if (err) {
            console.log('Error retrieving pre-defined blocks: ' + err);
            return;
        }
        
        callback(result);
    });
};

function createBlock(name, width, height, element, systemDefault) {
    var m = new schema.Block();

    m.name = name;
    m.width = width;
    m.height = height;
    m.element = element;
    m.systemDefault = systemDefault;

    m.save(function (err, result) {
        if (err) {
            console.log('Error saving new block: ' + err);
            return;
        }
    });
};

module.exports.initialize = function () {
    //Add default blocks, removing the old
    schema.Block.find({ systemDefault: true }).remove().exec();
    
    //TODO: pick a bettern default size?
    var defaultSize = 4;
    
    //Create default blocks with size of 4 inches and 100 pixels square
    createBlock('Square', defaultSize, defaultSize, { name: 'rect', properties: { width: '100', height: '100' }}, true);
    createBlock('Triangle', defaultSize, defaultSize, { name: 'polygon', properties: { points: '0,100 100,100 0,0' }}, true);
    createBlock('Circle', defaultSize, defaultSize, { name: 'circle', properties: { cx: '50', cy: '50', r: '50' }}, true);
    
    //TODO: pull these numbers from a formula somewhere
    createBlock('Hexagon', defaultSize, defaultSize, { name: 'polygon', properties: { points: '29.289,0 70.711,0 100,29.289 100,70.711 70.711,100 29.289,100 0,70.711 0,29.289' }}, true);
};