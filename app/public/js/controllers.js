'use strict';

var app = angular.module('QuiltingApp', []);

//If true, draws the quilt grid on the SVG element
app.directive('drawGrid', function () {
    return {
        link: function (scope, element, attrs) {
            scope.$watch(attrs.drawGrid, function (value) {
                if (value) {
                    var svg = element[0];
                    var snap = Snap(svg);
                    var quiltWidth = scope.quilt.width;
                    var quiltHeight = scope.quilt.height;

                    //In pixels, the quilt width should fill the entire SVG
                    var pixelWidth = svg.offsetWidth;

                    //Calculate a height that preserves the aspect ratio
                    var pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;

                    element.css('height', pixelHeight);

                    //If setting the height changed the width (added a scrollbar), re-calculate
                    if ($(element).width() != pixelWidth) {
                        pixelWidth = svg.offsetWidth;
                        pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;
                    }

                    //Thickness of the border of each box
                    var pixelBoxStrokeWidth = 1;

                    //Scale the square-inch boxes proportionally
                    var pixelBoxSize = pixelWidth / quiltWidth;

                    //Build the rectangle and pattern
                    var rect = snap.rect(0, 0, pixelWidth, pixelHeight);
                    var path = snap.path(['M', pixelBoxSize, '0', 'L', '0', '0', '0', pixelBoxSize]
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
                }
            });
        }
    };
});

//If true, sets visibility to hidden; otherwise sets to visible
app.directive('visibilityHidden', function () {
    return {
        link: function (scope, element, attrs) {
            scope.$watch(attrs.visibilityHidden, function (value) {
                if (value) {
                    element.css('visibility', 'hidden');
                }
                else {
                    element.css('visibility', 'visible');
                }
            });
        }
    };
});

app.controller('QuiltDesignerController', function ($scope, socket) {
    //Private functions
    var getQuiltId = function () {
        //Expecting /design/{id} or just /design
        return window.location.pathname.split('/')[2];
    };
    
    var loadQuilt = function (quilt) {
        if (quilt) {
            $scope.quilt = quilt;
        }
    };
    
    //Data
    $scope.isQuiltIdParameter = !!getQuiltId();
    $scope.quiltSizeOptions = [];
    $scope.selectedSize = null;
    $scope.newQuiltName = '';
    $scope.quilt = null;
    $scope.gridSnapGranularityOptions = [];
    $scope.gridSnapGranularity = null;
    
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
    
    $scope.isQuiltLoaded = function () {
        return !!$scope.quilt;
    };
    
    //Initialization
    if (!$scope.isQuiltIdParameter) {
        //Retrieve the list of possible quilt size options if this is a new quilt
        socket.emit('getQuiltSizeOptions', {}, function (message) {
            $scope.quiltSizeOptions = message;
        });
    }
    else {
        //Retrieve the quilt data if this is an existing quilt
        $scope.getQuilt(getQuiltId());
    }
    
    socket.emit('getGridSnapGranularityOptions', {}, function (message) {
        $scope.gridSnapGranularityOptions = message;
        $scope.gridSnapGranularity = $scope.gridSnapGranularityOptions[0];
    });
});