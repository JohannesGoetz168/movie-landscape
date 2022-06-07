var INTSYS = INTSYS || {};

INTSYS.CanvasHelper = function(){};

INTSYS.CanvasHelper.calculateImageDataByPreferences = function(allItems, preferences) {
	var canvas = document.getElementById(INTSYS.CONS.CANVAS_PREFS_ID);
	if (canvas == undefined) {
		canvas = document.createElement('canvas');
		canvas.id = INTSYS.CONS.CANVAS_PREFS_ID;
		canvas.width = INTSYS.CONS.RESOLUTION;
		canvas.height = INTSYS.CONS.RESOLUTION;
		if (!INTSYS.CONS.DEBUG) {
			canvas.style.display = "none";
		}
		document.body.appendChild(canvas);
	}
	var canvasContext = canvas.getContext('2d');
	canvasContext.fillStyle = "rgb(0,0,0)";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);

	for ( var index in allItems) {
		var item = allItems[index];
		var preference = preferences[item.id];
		if (preference == undefined) {
			preference = 0.2;
		}
		var heightColor = Math.round(INTSYS.CanvasHelper._ratingToHeight(preference) * 255);
		var x = item.x;
		var y = item.y;
		canvasContext.fillStyle = 'rgba(' + heightColor + ',0,0,' + 0.3 + ')';
		canvasContext.fillRect(x - 8, y - 8, 16, 16);
		canvasContext.fillStyle = 'rgba(' + heightColor + ',0,0,' + 0.6 + ')';
		canvasContext.fillRect(x - 4, y - 4, 8, 8);
		canvasContext.fillStyle = 'rgba(' + heightColor + ',0,0,' + 0.9 + ')';
		canvasContext.fillRect(x - 2, y - 2, 4, 4);
	}
	stackBlurCanvasRGB(INTSYS.CONS.CANVAS_PREFS_ID, 0, 0, INTSYS.CONS.RESOLUTION, INTSYS.CONS.RESOLUTION, 8);
	var unflippedData = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
	return INTSYS.CanvasHelper._flipData(unflippedData);
};

INTSYS.CanvasHelper._ratingToHeight = function(rating) {
	return rating / 5;
};

INTSYS.CanvasHelper._flipData = function(data) {
	var flippedData = new Uint8Array(data.length);
	var width = INTSYS.CONS.RESOLUTION * 4;
	var height = INTSYS.CONS.RESOLUTION;
	for (var i = 0; i < data.length; i += 4) {
		var x_source = i % width;
		var y_source = Math.floor(i / width);
		var x_dest = x_source;
		var y_dest = height - 1 - y_source;
		var dest_index = width * y_dest + x_dest;
		flippedData[dest_index] = data[i];
		flippedData[dest_index + 3] = 255;
	}
	return flippedData;
};

INTSYS.CanvasHelper.calculateRestrictionData = function(allItems) {
	var restrictionCanvas = document.getElementById(INTSYS.CONS.CANVAS_RESTR_ID);
	if (restrictionCanvas == undefined) {
		restrictionCanvas = document.createElement('canvas');
		restrictionCanvas.id = INTSYS.CONS.CANVAS_RESTR_ID;
		restrictionCanvas.width = INTSYS.CONS.RESOLUTION;
		restrictionCanvas.height = INTSYS.CONS.RESOLUTION;
		if (!INTSYS.CONS.DEBUG) {
			restrictionCanvas.style.display = "none";
		}
		document.body.appendChild(restrictionCanvas);

		var restrictionCanvasContext = restrictionCanvas.getContext('2d');
		restrictionCanvasContext.fillStyle = "rgb(0,0,0)";
		restrictionCanvasContext.fillRect(0, 0, restrictionCanvas.width, restrictionCanvas.height);

		for ( var index in allItems) {
			var item = allItems[index];

			restrictionCanvasContext.fillStyle = "rgba(255,0,0,0.2)";
			restrictionCanvasContext.fillRect(item.x - 10, item.y - 10, 20, 20);
			restrictionCanvasContext.fillStyle = "rgba(255,0,0,0.6)";
			restrictionCanvasContext.fillRect(item.x - 8, item.y - 8, 16, 16);
			restrictionCanvasContext.fillStyle = "rgba(255,0,0,0.8)";
			restrictionCanvasContext.fillRect(item.x - 4, item.y - 4, 8, 8);
			restrictionCanvasContext.fillStyle = "rgba(255,0,0,0)";
			restrictionCanvasContext.fillRect(item.x - 2, item.y - 2, 4, 4);

		}

		stackBlurCanvasRGB(INTSYS.CONS.CANVAS_RESTR_ID, 0, 0, restrictionCanvas.width, restrictionCanvas.height, 5);

		for ( var index in allItems) {
			var item = allItems[index];

			restrictionCanvasContext.fillStyle = "rgb(255,0,0)";
			restrictionCanvasContext.fillRect(item.x - 1, item.y - 1, 2, 2);
		}
	}
	var unflippedData = restrictionCanvas.getContext('2d').getImageData(0, 0, restrictionCanvas.width, restrictionCanvas.height).data;
	return INTSYS.CanvasHelper._flipData(unflippedData);
};