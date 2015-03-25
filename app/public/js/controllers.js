'use strict';

var app = angular.module('QuiltingApp', []);

app.controller('QuiltDesignerController', function ($scope, socket) {
    //Private functions
    var getQuiltId = function () {
        //Expecting /design/{id} or just /design
        return window.location.pathname.split('/')[2];
    };
    
    //Data
    $scope.isNew = !getQuiltId();
    $scope.quiltSizeOptions = [];
    $scope.selectedSize = null;
    $scope.newQuiltName = "";
    
    //Functions
    $scope.newQuilt = function () {
        socket.emit('newQuilt', { size: $scope.selectedSize, name: $scope.newQuiltName }, function (message) {
            console.log('Created new quilt: ', message);
        });
    };
    
    $scope.getQuilt = function (id) {
        socket.emit('getQuilt', { id: id }, function (message) {
            console.log('Retrieved existing quilt: ', message);
        });
    };
    
    //Initialization
    if ($scope.isNew) {
        //Retrieve the list of possible quilt size options if this is a new quilt
        socket.emit('getQuiltSizeOptions', {}, function (message) {
            $scope.quiltSizeOptions = message;
        });
    }
    else {
        //Retrieve the quilt data if this is an existing quilt
        $scope.getQuilt(getQuiltId());
    }
});