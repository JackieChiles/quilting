'use strict';

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

//Depends Snap.svg
//Also depends on jQuery, but TODO: use a controller instead of a link function to get access to $element
//http://jasonmore.net/angular-js-directives-difference-controller-link/
app.factory('quiltSvg', function () {
    return {
        drawGrid: function (element, quilt, gridSnapGranularity) {
            var svg = element[0];
            var snap = Snap(svg);
            var quiltWidth = quilt.width;
            var quiltHeight = quilt.height;

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
            
            //Fill the grid rectangle with the larger-scale pattern
            rect.attr({
                fill: gridSnapGranularity <= 1 ? standardPattern : gridSnapPattern
            });

            //Move the grid to the top of the SVG so that it's underneath all blocks
            var firstQuiltBlock = snap.select('.quilt-block')

            if (firstQuiltBlock) {
                rect.insertBefore(firstQuiltBlock);
            }
        },
        drawBlock: function(element, block, fillColor) {
            var svg = element[0];
            var snap = Snap(svg);
            var blockElement = snap[block.element.name]();

            blockElement.attr(block.element.properties);
            
            //Remove the old SVG contents
            snap.clear();

            //Add the fill color to the new elements
            if (fillColor) {
                blockElement.attr({ fill: fillColor });
            }

            //Add the elements to the SVG
            snap.add(blockElement);

            //Update the drawBlock binding with the added color
            if (fillColor) {
                scope.drawBlock.element.properties.fill = fillColor;
            }
        }
    };
});