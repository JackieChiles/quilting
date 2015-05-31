'use strict';

var app = angular.module('QuiltingApp', ['mp.colorPicker']);

//If true, draws the quilt grid on the SVG element
app.directive('drawGrid', function () {
    return {
        link: function (scope, element, attrs) {
            var drawGrid = function (drawGrid) {
                if (drawGrid && scope.quilt) {
                    var svg = element[0];
                    var snap = Snap(svg);
                    var quiltWidth = scope.quilt.width;
                    var quiltHeight = scope.quilt.height;
                    
                    //Grid snap granularity of 1 will result in no grid snap lines drawn
                    var gridSnapGranularity = scope.gridSnapGranularity && scope.gridSnapGranularity.value ? scope.gridSnapGranularity.value : 1;

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

                    //Scale the grid boxes proportionally
                    var pixelBoxSize = pixelWidth / quiltWidth;
                    var pixelSnapGridBoxSize = pixelBoxSize * gridSnapGranularity;
                    
                    //Remove the old grid, if any
                    var oldRect = snap.select('.grid-rect');                    
                    oldRect && oldRect.remove();

                    //Build the rectangle and patterns
                    var rect = snap.rect(0, 0, pixelWidth, pixelHeight);
                    
                    rect.attr({
                        class: 'grid-rect'
                    });
                    
                    var getGridPathString = function (boxSize) {
                        return ['M', boxSize, '0', 'L', '0', '0', '0', boxSize, boxSize, boxSize, boxSize, '0'].join(' ');
                    };
                    
                    //Grid snap granularity pattern 
                    var gridSnapPath = snap.path(getGridPathString(pixelSnapGridBoxSize))
                        .attr({
                            fill: 'none',
                            stroke: '#555555',
                            strokeWidth: 1
                        });
                    
                    //Standard inch-per-box pattern
                    var standardPath = snap.path(getGridPathString(pixelBoxSize))
                        .attr({
                            fill: 'none',
                            stroke: '#CCCCCC',
                            strokeWidth: 1
                        });
                    
                    rect.attr({
                        stroke: '#000000',
                        strokeWidth: 3
                    });
                    
                    var gridSnapPattern = null;
                    var standardPattern = null;
                    var makeStandardPattern = function () {
                        standardPattern = standardPath.pattern(0, 0, pixelBoxSize, pixelBoxSize);
                    };
                    
                    var makeSnapPattern = function () {
                        gridSnapPattern = gridSnapPath.pattern(0, 0, pixelSnapGridBoxSize, pixelSnapGridBoxSize);
                    };
                    
                    //Set pattern fills depending on which pattern is of larger scale
                    if (gridSnapGranularity > 1) {
                        makeStandardPattern();
                        
                        //Grid snap is larger than the standard 1-inch grid
                        gridSnapPath.attr({
                            fill: standardPattern
                        });
                    }
                    else if (gridSnapGranularity < 1) {
                        makeSnapPattern();
                        
                        //Grid snap is smaller than the standard 1-inch grid
                        standardPath.attr({
                            fill: gridSnapPattern
                        });
                    }
                    
                    //Make patterns from the path definitions if they haven't already been created
                    gridSnapPattern || makeSnapPattern();
                    standardPattern || makeStandardPattern();
                    
                    //Finally, fill the grid rectangle with the larger-scale pattern
                    rect.attr({
                        fill: gridSnapGranularity <= 1 ? standardPattern : gridSnapPattern
                    });
                }
            };
                      
            scope.$watch(attrs.drawGrid, drawGrid);
            scope.$watch('gridSnapGranularity', drawGrid);
        }
    };
});

//Draws a single svg element
app.directive('drawSvg', function () {
    return {
        link: function (scope, element, attrs) {
            var drawSvg = function () {
                if (!scope.drawSvg) {
                    return;
                }

                var elementString = scope.drawSvg;
                var svg = element[0];
                var snap = Snap(svg);
                var fillColor = scope.svgColor;
                var fragment = Snap.parse(elementString);
                
                //Remove the old SVG contents
                snap.clear();

                //Add the fill color to the new elements
                if (fillColor) {
                    fragment.select('*').attr({ fill: fillColor });
                }

                //Add the elements to the SVG
                snap.add(fragment);

                //Update the drawSvg binding with the added color
                if (fillColor) {
                    scope.drawSvg = fragment.paper.select(':not(defs)').toString();
                }
            };

            scope.$watch('drawSvg', drawSvg);
            scope.$watch('svgColor', drawSvg);
        },
        scope: {
            drawSvg: '=',
            svgColor: '='
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

//Prevents a bootstrap dropdown from closing if it clicked
app.directive('dropdownNoCloseOnClick', function () {
    return {
        link: function (scope, element, attrs) {
            $(element).click(function (e) {
                e.stopPropagation();
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
    $scope.blocksAvailable = [];
    $scope.selectedBlock = null;
    $scope.selectedBlockColor = '#364bdb'; //TODO: don't hardcode
    
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

    $scope.selectBlock = function (block) {
        $scope.selectedBlock = block;
    };
    
    $scope.placeBlock = function (block) {
        var snap = Snap(document.getElementById("grid"));
        var pixelsPerInch = snap.getBBox().width / $scope.quilt.width;
        var blockElement = Snap.parse(block.svg).select('*');
        
        //TODO don't hardcode 100
        var scale = pixelsPerInch / (100 / block.width);
        
        //Scale the block to the quilt SVG
        blockElement.transform('scale(' + scale + ')');
        
        //Add the block to the quilt at (0, 0)
        blockElement.addClass('quilt-block');
        
        //Add block dragging and grid snapping
        if ($scope.gridSnapGranularity.value) {
            //This method of grid snapping adapted from the default drag method in the snap.svg source
            var origTransform = {};
            var snapTo = pixelsPerInch * $scope.gridSnapGranularity.value;

            blockElement.drag(
                function(dx, dy) {
                    var xSnap = Snap.snapTo(snapTo, dx, 999999999);
                    var ySnap = Snap.snapTo(snapTo, dy, 999999999);

                    this.attr({
                        transform: origTransform + (origTransform ? "T" : "t") + [xSnap, ySnap]
                    });
                }, 
                function () {
                    origTransform = this.transform().local;
                }
            );
        }
        else {
            blockElement.drag();
        }
        
        snap.add(blockElement);
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
    
    socket.emit('getPredefinedBlocks', {}, function (message) {
        $scope.blocksAvailable = message;
        $scope.selectBlock($scope.blocksAvailable[0]);
    });
});