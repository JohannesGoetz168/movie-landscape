var INTSYS = INTSYS || {};

INTSYS.MODES = {
	SCULPT_MODE : 0,
	MOVE_MODE : 1,
	SHOW_MODE : 2
};

INTSYS.LANDSCAPE_EVENTS = {
		LEFT_CLICK_LANDMARK : 0,
		RIGHT_CLICK_LANDMARK : 1,
		HOVER_LANDMARK : 2,
		RENDER : 3,
		ENDED_SCULPTING : 4
};

INTSYS.STORAGE_KEYS = {
		MODULATOR_STATE : "modulatorState",
		CURRENT_MODE : "currentMode"
};

INTSYS.UserEventHandler = function(landscape, landscapeFacade, htmlElement){
	this._landscape = landscape;
	this._landscapeFacade = landscapeFacade;
	this._htmlElement = htmlElement;
	
	this._runningTimeouts = {};
	this._sculptingTimeoutKey = "sculptingTimeout";
	
	this._currentMode;
	
	this._isSculpting = false;
	this._mouseEvent = null;
	this._mouseDownButton = -1; // firefox hack (unable to detect RMB during mousemove event)
	this._sculptIntervalID;
	this._mousePosition;
	
	this._attachEventsToElement(htmlElement);
	this.changeMode(INTSYS.MODES.MOVE_MODE);
	
	this._sculptLog = {};
	
	this._mouseZoomDelta = 0;
	
	// create "infinite" plane mesh for intersection tests on zoom
	this.planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial());
	this.planeMesh.rotation.x = - Math.PI / 2;
	this._landscape._threeJsScene.scene.add(this.planeMesh);
};

INTSYS.UserEventHandler.prototype._attachEventsToElement = function(htmlElement){
	var self = this;
	this._htmlElement.addEventListener('mousedown', function(mouseEvent){
		self._onMouseDown(mouseEvent);
	}, false);
	this._htmlElement.addEventListener('mousemove', function(mouseEvent){
		self._onMouseMove(mouseEvent);
	}, false);
	this._htmlElement.addEventListener('mouseup',  function(mouseEvent){
		self._onMouseUp(mouseEvent);
	}, false);
	this._htmlElement.addEventListener('mousewheel', function(mouseEvent){
		self._onMouseWheel(mouseEvent);
	}, false);
	this._htmlElement.addEventListener('wheel', function(mouseEvent){
		self._onMouseWheel(mouseEvent);
	}, false);
	window.onbeforeunload = function() {
		localStorage.setItem(INTSYS.STORAGE_KEYS.MODULATOR_STATE, JSON.stringify(self._landscape.snapshotState()));
		localStorage.setItem(INTSYS.STORAGE_KEYS.CURRENT_MODE, JSON.stringify(self._currentMode));
	};
};

INTSYS.UserEventHandler.prototype._onMouseDown = function(mouseEvent){
	mouseEvent.preventDefault();
	this._mouseEvent = mouseEvent;
	this._mouseDownButton = mouseEvent.button;
	this._mousePosition = this._getMousePosition(mouseEvent);
	
	switch(this._currentMode){
	case INTSYS.MODES.SCULPT_MODE: 
		this._startSculpting(); 
		break;
	case INTSYS.MODES.SHOW_MODE: 
		this._startShowing(); 
		break;
	}
};

INTSYS.UserEventHandler.prototype._startSculpting = function(){
	var intersection = this._detectLandscapeMousePosition();
	if (intersection) {
		var timeoutId = this._runningTimeouts[this._sculptingTimeoutKey];
		if(timeoutId){
			clearTimeout(timeoutId);
		}
		this._isSculpting = true;
		this._sculptLog.startTime = new Date().getTime(); 
		var self = this;
		this._sculptIntervalID = setInterval( function(){
			self._doContinuousSculpt();
		}, 100 );
	}
};

INTSYS.UserEventHandler.prototype._detectLandscapeMousePosition = function(){
	var intersectionPoint = this._landscape.detectPlaneIntersection(this._mousePosition.x, this._mousePosition.y);
	this._landscape.updateSculptCursor(intersectionPoint);
	return intersectionPoint;
};

INTSYS.UserEventHandler.prototype._getMousePosition = function(event){
	var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
	var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
	return {'x' : mouseX, 'y' : mouseY};
};

INTSYS.UserEventHandler.prototype._doContinuousSculpt = function(){
	var intersectionPoint = this._detectLandscapeMousePosition();
	if (intersectionPoint && this._isSculpting) {
		if (this._mouseDownButton === 0) { // LMB
			this._landscape.doAddSculpt(intersectionPoint);
			this._sculptLog.modus = "ADD";
		} else if (this._mouseDownButton === 2) { // RMB
			this._landscape.doRemoveSculpt(intersectionPoint);
			this._sculptLog.modus = "REMOVE";
		}
	}
};

INTSYS.UserEventHandler.prototype._startShowing = function(){
	if (this._mouseDownButton === 0) { // LMB
		var intersectionPoint = this._landscape.detectPlaneIntersection(this._mousePosition.x, this._mousePosition.y);
		this._landscapeFacade.addSampleAt(intersectionPoint);
	} else if(this._mouseDownButton === 2) { // RMB
		var landmarkId = this._landscape.detectLandmarkIntersection(this._mousePosition.x, this._mousePosition.y);
		if (landmarkId && !this._landscape.isDecorated(landmarkId, INTSYS.CONS.REC_COLOR)) {
			this._landscape.removeLandmark(landmarkId);
			this._landscapeFacade.notifySampleRemoved(landmarkId);
		}
	}
};

INTSYS.UserEventHandler.prototype._onMouseMove = function(event) {
	event.preventDefault();
	this._mouseEvent = event;
	this._mousePosition = this._getMousePosition(event);
	if(this._currentMode == INTSYS.MODES.SCULPT_MODE && !this._isSculpting){
		var intersectionPoint = this._landscape.detectPlaneIntersection(this._mousePosition.x, this._mousePosition.y);
		this._landscape.updateSculptCursor(intersectionPoint);
	}
	var landmarkId = this._landscape.detectLandmarkIntersection(this._mousePosition.x, this._mousePosition.y);
	if(landmarkId){
		this._handleLandmarkHover(landmarkId);
	}
};

INTSYS.UserEventHandler.prototype._handleLandmarkHover = function(landmarkId){
	if(!this._landscape.getSelectedLandmarkId() || (this._landscape.getSelectedLandmarkId() != landmarkId)){
		var self = this;
		if(!this._runningTimeouts[landmarkId]){
			this._runningTimeouts[landmarkId] = setTimeout(function(){
				var currentLandmarkId = self._landscape.detectLandmarkIntersection(self._mousePosition.x, self._mousePosition.y);
				if(currentLandmarkId == landmarkId){
					self._landscape.changeSelectedLandmark(landmarkId);
					self._landscapeFacade.notifyDetailItemChanged(landmarkId);
				}
				delete self._runningTimeouts[landmarkId];
			}, 200);
		}
	}
};

INTSYS.UserEventHandler.prototype._onMouseUp = function(event){
	if(this._isSculpting){
		clearInterval(this._sculptIntervalID);
		this._isSculpting = false;
		var self = this;
		this._runningTimeouts[this._sculptingTimeoutKey] = setTimeout(function(){
			self._landscapeFacade.notifyPreferencesChanged();
			delete self._runningTimeouts[self._sculptingTimeoutKey];
		}, 1000);
	}
	this._mouseDownButton = -1;
};

INTSYS.UserEventHandler.prototype.changeMode = function(mode){
	if(this._currentMode == mode || !(mode in Object.keys(INTSYS.MODES))){
		return;
	}
	this._stopCurrentMode();
	this._currentMode = mode;
	switch(mode){
	case INTSYS.MODES.SCULPT_MODE:
		this._htmlElement.style.cursor = "url('resources/img/cursor/shovel01.png') 0 32, auto";
		break;
	case INTSYS.MODES.MOVE_MODE:
		this._landscape.enableCameraMovement();
		this._landscape.hideSculptCursor();
		this._showHandCursor();
		var self = this;
		this._htmlElement.addEventListener('mousedown', function(event){
			if(self._currentMode != INTSYS.MODES.MOVE_MODE){
				this.removeEventListener('mousedown', arguments.callee, false);
				return;
			} 
			self._showGrabbingCursor();
		}, false);
		this._htmlElement.addEventListener('mouseup', function(event){
			if(self._currentMode != INTSYS.MODES.MOVE_MODE){
				this.removeEventListener('mouseup', arguments.callee, false);
				return;
			}
			self._showHandCursor();
		}, false);
		break;
	case INTSYS.MODES.SHOW_MODE:
		this._landscape.hideSculptCursor();
		this._htmlElement.style.cursor = "crosshair";
		break;
	}
};

INTSYS.UserEventHandler.prototype._showGrabbingCursor = function(){
	this._htmlElement.style.cursor = "url('resources/img/cursor/grab.png') 0 32, auto";
};

INTSYS.UserEventHandler.prototype._showHandCursor = function(){
	this._htmlElement.style.cursor = "url('resources/img/cursor/hand.png') 0 32, auto";
};

INTSYS.UserEventHandler.prototype._stopCurrentMode = function(){
	switch(this._currentMode){
	case INTSYS.MODES.MOVE_MODE: 
		this._landscape.disableCameraMovement();
	}
};

INTSYS.UserEventHandler.prototype._onMouseWheel = function(event){
	event.preventDefault();
	
	var delta = 0;
	if (event.wheelDelta) { // WebKit / Opera / Explorer 9
		delta = event.wheelDelta / 8;
	} else if (event.deltaY) { // Firefox
		delta = -event.deltaY / 2;
	}
	
	var camera = this._landscape._threeJsScene.camera;
	var controls = this._landscape._threeJsScene.controls
	
	var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
	var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
	
	var vector = new THREE.Vector3(mouseX, mouseY, 1);
	vector.unproject(camera);
	vector.sub(camera.position);
	var newPosition = camera.position.clone();
	newPosition.add(vector.setLength(delta));
	
	var distanceToOrigin = newPosition.distanceTo(new THREE.Vector3(0,0,0));
	if(distanceToOrigin >= INTSYS.CONS.MIN_DISTANCE && distanceToOrigin <= INTSYS.CONS.MAX_DISTANCE){
		camera.position.copy(newPosition);
		
		var cameraLookAt = new THREE.Vector3( 0, 0, -1);
		cameraLookAt.applyQuaternion( camera.quaternion );
		
		var customRaycaster = new THREE.Raycaster(camera.position, cameraLookAt.normalize());
		var intersections = customRaycaster.intersectObject(this.planeMesh);
		var meshIntersection = intersections[0].point;
		
		controls.target.copy(meshIntersection);
		
		this._landscape._skulpt.setBrushSize(CONS.TERRAIN_SCULPT_SIZE * distanceToOrigin/20);
	}
	
};

