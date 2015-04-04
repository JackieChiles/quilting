'use strict';

var app = angular.module('QuiltingApp', []);

app.controller('QuiltDesignerController', function ($scope, socket) {
    //Private functions
    var getQuiltId = function () {
        //Expecting /design/{id} or just /design
        return window.location.pathname.split('/')[2];
    };
    
    var loadQuilt = function (quilt) {
        if (quilt) {
            $scope.quilt = quilt;
            $scope.isNew = false;

            //Use setTimeout as a workaround for grid size not fully changed before drawGrid call
            //TODO: do this properly with directives: http://stackoverflow.com/a/19758463/830125
            window.setTimeout(function() {
                //Draw the grid
                drawGrid();
            }, 10);
        }
    };
    
    var drawGrid = function () {
        $(function() {
            var s = Snap('#grid');
            var quiltWidth = $scope.quilt.width;
            var quiltHeight = $scope.quilt.height;

            //In pixels, the quilt width should fill the entire SVG
            var pixelWidth = $('#grid').width();

            //Calculate a height that preserves the aspect ratio
            var pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;
            
            $('#grid').height(pixelHeight);
            
            //If setting the height changed the width (added a scrollbar), re-calculate
            if ($('#grid').width() != pixelWidth) {
                pixelWidth = $('#grid').width();
                pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;
            }

            //Thickness of the border of each box
            var pixelBoxStrokeWidth = 1;

            //Scale the square-inch boxes proportionally
            var pixelBoxSize = pixelWidth / quiltWidth;

            //Build the rectangle and pattern
            var rect = s.rect(0, 0, pixelWidth, pixelHeight);
            var path = s.path(['M', pixelBoxSize, '0', 'L', '0', '0', '0', pixelBoxSize]
                .join(' '))
                .attr({
                    fill: 'none',
                    stroke: '#333333',
                    strokeWidth: pixelBoxStrokeWidth
                });

            path = path.pattern(0, 0, pixelBoxSize, pixelBoxSize);
            rect.attr({
                stroke: '#000000',
                strokeWidth: 3,
                fill: path
            });
        });
    };
    
    //Data
    $scope.isNew = !getQuiltId();
    $scope.quiltSizeOptions = [];
    $scope.selectedSize = null;
    $scope.newQuiltName = '';
    $scope.quilt = null;
    
    //Functions
    $scope.newQuilt = function () {
        socket.emit('newQuilt', { size: $scope.selectedSize, name: $scope.newQuiltName }, function (message) {
            console.log('Created new quilt: ', message);
            loadQuilt(message);
        });
    };
    
    $scope.getQuilt = function (id) {
        socket.emit('getQuilt', { id: id }, function (message) {
            console.log('Retrieved existing quilt: ', message);
            loadQuilt(message);
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