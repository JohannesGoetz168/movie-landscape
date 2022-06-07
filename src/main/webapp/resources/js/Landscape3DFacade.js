var INTSYS = INTSYS || {};

INTSYS.Landscape3DFacade = function(allItems, componentId) {
	var htmlComponent = document.getElementById(componentId);

	this._allItems = allItems;

	this._landscape = new INTSYS.Landscape3D(htmlComponent);
	this._landscape.applyRestrictionData(INTSYS.CanvasHelper.calculateRestrictionData(this._allItems));
	this._userEventHandler = new INTSYS.UserEventHandler(this._landscape, this, htmlComponent);
	
	var self = this;
	window.addEventListener( 'resize', function(){
		self._landscape.onWindowResize();
	}, false );
};

INTSYS.Landscape3DFacade.prototype.addSampleAt = function(point) {
	addSample([ {
		name : "x",
		value : point.x
	}, {
		name : "y",
		value : point.y
	} ]);
};

INTSYS.Landscape3DFacade.prototype.addSample = function(sampleItemId) {
	var self = this;
	this._landscape.addLandmark(this._findLandmarkById(sampleItemId), false, function(){
		self.changeDetailItem(sampleItemId);
	});
};

INTSYS.Landscape3DFacade.prototype._findLandmarkById = function(landmarkId) {
	for ( var index in this._allItems) {
		var item = this._allItems[index];
		if (item.id == landmarkId) {
			return item;
		}
	}
}

INTSYS.Landscape3DFacade.prototype.notifySampleRemoved = function(sampleId) {
	removeSample([ {
		name : "itemId",
		value : "" + sampleId
	} ]);
};

INTSYS.Landscape3DFacade.prototype.notifyDetailItemChanged = function(itemId) {
	showDetails([ {
		name : "itemId",
		value : "" + itemId
	} ]);
};

INTSYS.Landscape3DFacade.prototype.notifyPreferencesChanged = function() {
	this.applyChangedPreferences();
};

INTSYS.Landscape3DFacade.prototype.applyChangedPreferences = function() {
	var preferenceMap = [];
	for ( var index in this._allItems) {
		var item = this._allItems[index];
		var x = item.x;
		var y = item.y;
		var height = this._landscape._getHeight(x, y);
		preferenceMap.push([ item.id, this._heightToRating(height) ]);
	}
	changePreferences([ {
		name : 'preferenceMap',
		value : JSON.stringify(preferenceMap)
	} ]);
};


INTSYS.Landscape3DFacade.prototype.updateHeights = function(imageHeightData) {
	this._landscape.reloadTexture(imageHeightData);
};

/**
 * Linearly map heights to ratings. The minimum height of items is 0.2, which
 * maps to a rating of 1, which is also the minimal possible rating value.
 * Heights of 0 inside the landscape mean that there is no item.
 */
INTSYS.Landscape3DFacade.prototype._heightToRating = function(height) {
	return height * 5;
};

INTSYS.Landscape3DFacade.prototype._ratingToHeight = function(rating) {
	return rating / 5;
};

INTSYS.Landscape3DFacade.prototype.updateRecommendations = function(recommendations) {
	this._landscape.changeDecoratedLandmarks(recommendations);
};

INTSYS.Landscape3DFacade.prototype.updateSamplePoints = function(sampleItems) {
	this._landscape.clearLandmarks();
	for ( var index in sampleItems) {
		var sampleItem = sampleItems[index];
		this._landscape.addLandmark(sampleItem);
	}
};

INTSYS.Landscape3DFacade.prototype.setShowMode = function() {
	this._userEventHandler.changeMode(INTSYS.MODES.SHOW_MODE);
};
INTSYS.Landscape3DFacade.prototype.setMoveMode = function() {
	this._userEventHandler.changeMode(INTSYS.MODES.MOVE_MODE);
};
INTSYS.Landscape3DFacade.prototype.setSculptMode = function() {
	this._userEventHandler.changeMode(INTSYS.MODES.SCULPT_MODE);
};

INTSYS.Landscape3DFacade.prototype.setSculptAmount = function(sculptAmount){
	if(sculptAmount && sculptAmount > 0){
		this._landscape.setSculptAmount(sculptAmount);
	}
};

INTSYS.Landscape3DFacade.prototype.setSculptPatchSize = function(sculptPatchSize){
	if(sculptPatchSize && sculptPatchSize > 0){
		this._landscape.setSculptPatchSize(sculptPatchSize);
	}
};

INTSYS.Landscape3DFacade.prototype.changeDetailItem = function(movielensId) {
	this._landscape.changeSelectedLandmark(movielensId);
	this.notifyDetailItemChanged(movielensId);
};

INTSYS.Landscape3DFacade.prototype.recoverState = function() {
	var modulatorState = localStorage.getItem(INTSYS.STORAGE_KEYS.MODULATOR_STATE);
	if (modulatorState) {
		this._landscape.recallState(JSON.parse(modulatorState));
	}
	var currentMode = localStorage.getItem(INTSYS.STORAGE_KEYS.CURRENT_MODE);
	if (currentMode) {
		this._userEventHandler.changeMode(JSON.parse(currentMode));
	}
};