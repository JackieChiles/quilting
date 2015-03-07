'use strict';

var app = angular.module('quiltingApp', []);

app.controller('QuiltDesignerController', function ($scope, socket) {
    //Initialization
    socket.emit('initializeQuiltDesigner', {}, function(message) {
        $scope.isNew = message.isNew;
        $scope.quiltSizeOptions = message.quiltSizeOptions;
    });
});