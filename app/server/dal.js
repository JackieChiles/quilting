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

module.exports.getGridSnapGranularityOptions = function (callback) {
    callback(staticData.gridSnapGranularityOptions);
};

module.exports.getPredefinedBlocks = function (callback) {
    callback(staticData.preDefinedBlocks);
};

function createBlock(name, width, height, svg, systemDefault) {
    var m = new schema.Block();

    m.name = name;
    m.width = width;
    m.height = height;
    m.svg = svg;
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
    
    createBlock('Square', defaultSize, defaultSize, '<rect width="100" height="100" />', true);
    
    //TODO: add these too
    //createBlock('Triangle', defaultSize, defaultSize, '<rect width="100" height="100" />', true);
    //createBlock('Circle', defaultSize, defaultSize, '<rect width="100" height="100" />', true);
    //createBlock('Hexagon', defaultSize, defaultSize, '<rect width="100" height="100" />', true);
};