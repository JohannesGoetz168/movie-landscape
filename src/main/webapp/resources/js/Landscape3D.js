var INTSYS = INTSYS || {};

console.log('Using INTSYS ' + INTSYS.version);

var CONS = {
	TERRAIN_SIZE : 15,
	TERRAIN_SCULPT_SIZE : 2.5,
	TERRAIN_SCULPT_AMOUNT : 0.07,
	SHADOW_MAP_RES : 1024,
	IMAGE_PATH_PREFIX : "resources/img/",
	CAMERA_POSITION : {
		'x' : 20,
		'y' : 5,
		'z' : 5
	},
	ITEMSIZE : 0.7,
	DEFAULT_IMG_SIZE : 256
};

INTSYS.Landscape3D = function(htmlElement) {

	this._landmarkSprites = [];
	this._decoratedLandmarkSprites = [];
	this._keepAsLandmarks = [];
	this._selectedLandmarkSprite = null;

	this._threeJsScene = this._setupThreeJsScene(htmlElement);
	this._sculptAmount = CONS.TERRAIN_SCULPT_AMOUNT;
	this._sculptPatchSize = CONS.TERRAIN_SCULPT_SIZE;
	this._skulpt = this._setupSkulpt();

	this._heightDataNeedsRefresh = true;
	this._heightData = new Float32Array(INTSYS.CONS.RESOLUTION
			* INTSYS.CONS.RESOLUTION);

	this._startAnimationLoop();
};

INTSYS.Landscape3D.prototype._setupThreeJsScene = function(htmlElement) {
	// setup renderer
	var renderer = new THREE.WebGLRenderer({
		antialias : true
	});
	renderer.setSize(htmlElement.offsetWidth, htmlElement.offsetHeight);
	renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
	renderer.setClearColor('#000000', 1);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	renderer.shadowMapSoft = true;

	htmlElement.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xF4F7F3, 0.01); 
	
	if(INTSYS.CONS.DEBUG){
		var axes = new THREE.AxisHelper(100);
		scene.add( axes );
	}

	// create camera
	var camera = new THREE.PerspectiveCamera(25, renderer.domElement.width
			/ renderer.domElement.height, 0.1, 2000);
	camera.position.set(CONS.CAMERA_POSITION.x, CONS.CAMERA_POSITION.y,
			CONS.CAMERA_POSITION.z);

	// create controls for camera
	var controls = new THREE.OrbitControls(camera, htmlElement);
	controls.enableZoom = false;
	if(!INTSYS.CONS.DEBUG){
		controls.maxPolarAngle = (Math.PI / 2)- (Math.PI / 16);
		controls.maxDistance = INTSYS.CONS.MAX_DISTANCE;
		controls.minDistance = INTSYS.CONS.MIN_DISTANCE;
		controls.maxHorizontalPan = 10;
		controls.maxVerticalPan = 5;
	}

	// create the water base plane
	var waterPlaneGeometry = new THREE.CircleGeometry( 200, 75);
	waterPlaneGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var loader = new THREE.TextureLoader();

	loader.load(CONS.IMAGE_PATH_PREFIX + "textures/classic_water_texture.jpg", function ( texture ) {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set( 75, 75 );
			var waterPlaneMaterial = new THREE.MeshBasicMaterial( {
				map: texture
			});
			var waterPlaneMesh = new THREE.Mesh(waterPlaneGeometry, waterPlaneMaterial);
			waterPlaneMesh.castShadow = false;
			waterPlaneMesh.receiveShadow = false;
			waterPlaneMesh.position.y = 0.01;
			scene.add(waterPlaneMesh);
	} );

	// create plane for reference and for intersection test
	var groundPlaneGeom = new THREE.PlaneGeometry(CONS.TERRAIN_SIZE,
			CONS.TERRAIN_SIZE, 20, 20);
	groundPlaneGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var groundPlaneMaterial = new THREE.MeshPhongMaterial();
	groundPlaneMaterial.wireframe = INTSYS.CONS.DEBUG;
	groundPlaneMaterial.visible = INTSYS.CONS.DEBUG;
	var groundPlaneMesh = new THREE.Mesh(groundPlaneGeom, groundPlaneMaterial);
	groundPlaneMesh.castShadow = false;
	groundPlaneMesh.receiveShadow = false;
	scene.add(groundPlaneMesh);

	// create a sky box around the scene
	var skyGeometry = new THREE.BoxGeometry( 1500, 1500, 1500 );
	var skyMaterial = new THREE.MeshBasicMaterial( {color: scene.fog.color, side: THREE.BackSide} );
	var skyMesh = new THREE.Mesh( skyGeometry, skyMaterial );
	scene.add(skyMesh);
	
	// setup lights
	scene.add(new THREE.AmbientLight(0x999999));

	var keyLight = new THREE.DirectionalLight(0x999999, 0.8);
	keyLight.position.set(5, 15, -15);
	keyLight.target.position.set(0, 0, 0);
	keyLight.castShadow = true;
	keyLight.shadow.camera.near = 16;
	keyLight.shadow.camera.far = 27;
	keyLight.shadow.camera.right = 7;
	keyLight.shadow.camera.left = -7;
	keyLight.shadow.camera.top = 7;
	keyLight.shadow.camera.bottom = -7;
	keyLight.shadow.bias = 0.005;
	keyLight.shadow.mapSize.width = CONS.SHADOW_MAP_RES;
	keyLight.shadow.mapSize.height = CONS.SHADOW_MAP_RES;
	if(INTSYS.CONS.DEBUG){
		scene.add(new THREE.CameraHelper(keyLight.shadow.camera));
	}
	scene.add(keyLight);

	var fillLight = new THREE.DirectionalLight(0xBBBBBB, 0.4);
	fillLight.position.set(5, 2, 15);
	fillLight.target.position.set(0, 0, 0);
	if(INTSYS.CONS.DEBUG){
		scene.add(new THREE.CameraHelper(fillLight.shadow.camera));
	}
	scene.add(fillLight);

	return {
		'renderer' : renderer,
		'scene' : scene,
		'camera' : camera,
		'intersectionMesh' : groundPlaneMesh,
		'controls' : controls,
		'clock' : new THREE.Clock()
	};
};

INTSYS.Landscape3D.prototype._setupSkulpt = function() {
	// create a terrain mesh for sculpting
	var terrainGeom = new THREE.PlaneGeometry(CONS.TERRAIN_SIZE,
			CONS.TERRAIN_SIZE, INTSYS.CONS.RESOLUTION - 1,
			INTSYS.CONS.RESOLUTION - 1);
	terrainGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var terrainMesh = new THREE.Mesh(terrainGeom, null);
	terrainMesh.castShadow = true;
	terrainMesh.receiveShadow = true;
	this._threeJsScene.scene.add(terrainMesh);

	// create a GpuSkulpt
	var gpuSkulpt = new SKULPT.GpuSkulpt({
		renderer : this._threeJsScene.renderer,
		mesh : terrainMesh,
		size : CONS.TERRAIN_SIZE,
		res : INTSYS.CONS.RESOLUTION
	});

	gpuSkulpt.setBrushSize(this._sculptPatchSize);
	gpuSkulpt.setBrushAmount(this._sculptAmount);
	
	if(INTSYS.CONS.DEBUG){
		// create a RTT visualization plane
		var visGeom = new THREE.PlaneGeometry(CONS.TERRAIN_SIZE, CONS.TERRAIN_SIZE,
				1, 1);
		visGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
		var sculptDisplayTexture = gpuSkulpt.getSculptDisplayTexture();
		var visMaterial = new THREE.MeshBasicMaterial({
			map : sculptDisplayTexture
		});
		var visMesh = new THREE.Mesh(visGeom, visMaterial);
		visMesh.position.y = 3;
		visMesh.castShadow = false;
		visMesh.receiveShadow = false;
		visMesh.visible = INTSYS.CONS.DEBUG;
		this._threeJsScene.scene.add(visMesh);
	}


	return gpuSkulpt;
};

INTSYS.Landscape3D.prototype.applyRestrictionData = function(restrictionData){
	this._skulpt.applyRestrictionData(restrictionData);
};

INTSYS.Landscape3D.prototype.detectLandmarkIntersection = function(screenX,
		screenY) {
	var intersection = this._detectIntersection(screenX, screenY,
			this._landmarkSprites);
	if (intersection) {
		var clickedObject = intersection.object;
		return clickedObject.userData.id;
	}
};

INTSYS.Landscape3D.prototype.detectPlaneIntersection = function(screenX,
		screenY) {
	var intersection = this._detectIntersection(screenX, screenY,
			this._threeJsScene.intersectionMesh);
	if (intersection) {
		var coordinate = this._toCoordinate(intersection.point);
		return coordinate;
	}
};

INTSYS.Landscape3D.prototype._detectIntersection = function(screenX, screenY,
		objects) {
	// cast a ray from camera into screen
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2(screenX, screenY);
	raycaster.setFromCamera(mouse, this._threeJsScene.camera);
	var intersections = null;
	if (objects instanceof Array) {
		intersections = raycaster.intersectObjects(objects);
	} else {
		intersections = raycaster.intersectObject(objects, true);
	}
	return (intersections && intersections[0]) ? intersections[0] : null;
};

INTSYS.Landscape3D.prototype.updateSculptCursor = function(coordinate) {
	if (coordinate) {
		this._skulpt.updateCursor(this._toLocalPosition(coordinate.x,
				coordinate.y));
		this._skulpt.showCursor();
	} else {
		this._skulpt.hideCursor();
	}
};

INTSYS.Landscape3D.prototype.hideSculptCursor = function() {
	this._skulpt.hideCursor();
};

INTSYS.Landscape3D.prototype.doAddSculpt = function(coordinate) {
	var currentHeight = this._getHeight(coordinate.x, coordinate.y);
	var sculptAmount = this._calculateAddSculptAmount(currentHeight);
	this._skulpt.sculpt(SKULPT.ADD, this._toLocalPosition(coordinate.x,
			coordinate.y), sculptAmount);
	this._heightDataNeedsRefresh = true;
};

INTSYS.Landscape3D.prototype.doRemoveSculpt = function(coordinate) {
	var currentHeight = this._getHeight(coordinate.x, coordinate.y);
	var sculptAmount = this._sculptAmount;
	this._skulpt.sculpt(SKULPT.REMOVE, this._toLocalPosition(coordinate.x,
			coordinate.y), sculptAmount);
	this._heightDataNeedsRefresh = true;
};

INTSYS.Landscape3D.prototype._calculateAddSculptAmount = function(height){
	var sculptAmount = this._sculptAmount;
	if(height > 0.7){
		var sinHeight =  Math.sin(height * Math.PI);
		sculptAmount *= Math.pow(sinHeight, 2);
	}
	return sculptAmount;
};

INTSYS.Landscape3D.prototype._startAnimationLoop = function() {
	var self = this;
	(function loop() {
		self._render();
		requestAnimationFrame(loop);
	})();
};

INTSYS.Landscape3D.prototype._render = function() {

	var dt = this._threeJsScene.clock.getDelta(); // have to call this before
													// getElapsedTime()
	var time = this._threeJsScene.clock.getElapsedTime();

	var v = new THREE.Vector3();
	var scaleFactor = 30;
	for ( var index in this._landmarkSprites) {
		var sprite = this._landmarkSprites[index];
		var scaleSize = v.subVectors(sprite.position,
				this._threeJsScene.camera.position).length()
				/ scaleFactor;
		sprite.scale.x = scaleSize * 0.7;
		sprite.scale.y = scaleSize;
		var terrainHeight = this._getHeight(sprite.userData.x,
				sprite.userData.y);
		sprite.position.y = terrainHeight + scaleSize / 2;
	}

	if (this._selectedLandmarkSprite) {
		var sinusScale = Math.sin(time * 3);
		var itemSize = this._selectedLandmarkSprite.scale.y;
		var scaleSize = itemSize + (itemSize / 4) * sinusScale;
		this._selectedLandmarkSprite.scale.set(scaleSize * 0.7, scaleSize, 1);
		var terrainHeight = this._getHeight(
				this._selectedLandmarkSprite.userData.x,
				this._selectedLandmarkSprite.userData.y);
		this._selectedLandmarkSprite.position.y = terrainHeight + scaleSize / 2;
	}

	var renderer = this._threeJsScene.renderer;
	renderer.autoClear = false;
	renderer.clear();
	this._skulpt.update(dt);
	renderer.render(this._threeJsScene.scene, this._threeJsScene.camera);

	if (this._heightDataNeedsRefresh) {
		this._refreshHeightData();
	}
};

INTSYS.Landscape3D.prototype._refreshHeightData = function() {
	var imageData = this._skulpt.getFlippedPixelData();
	
	for (var i = 0; i < this._heightData.length; i++) {
		this._heightData[i] = imageData[i * 4] / 255;
	}

	this._updateHeightDependendData();
	this._heightDataNeedsRefresh = false;
};

INTSYS.Landscape3D.prototype._updateHeightDependendData = function() {
	this._updateLandmarks();
	this._updateIntersectionPlane();
};

INTSYS.Landscape3D.prototype._updateLandmarks = function() {
	for ( var index in this._landmarkSprites) {
		var landmark = this._landmarkSprites[index];
		var terrainHeight = this._getHeight(landmark.userData.x,
				landmark.userData.y);
		landmark.position.y = terrainHeight + landmark.scale.y / 2;
	}
};

INTSYS.Landscape3D.prototype._updateIntersectionPlane = function() {
	var geo = this._threeJsScene.intersectionMesh.geometry;
	for ( var index in geo.vertices) {
		var vertex = geo.vertices[index];
		var coordinate = this._toCoordinate(vertex);
		var height = this._getHeight(coordinate.x, coordinate.y);
		if (height != undefined) {
			geo.vertices[index].y = height;
		} else {
			geo.vertices[index].y = 0.5;
			console.log("height is undefined for vertex (" + vertex.x + ", "
					+ vertex.y + ", " + vertex.z + ") and coordinate ("
					+ coordinate.x + ", " + coordinate.y + ")!");
		}
	}
	geo.verticesNeedUpdate = true;
};

INTSYS.Landscape3D.prototype.reloadTexture = function(data) {
	this._skulpt.loadFromImageData(data);
	this._heightDataNeedsRefresh = true;

};

INTSYS.Landscape3D.prototype._toCoordinate = function(position) {
	var x = ((position.x + CONS.TERRAIN_SIZE / 2) / CONS.TERRAIN_SIZE)
			* (INTSYS.CONS.RESOLUTION - 1);
	var y = ((position.z + CONS.TERRAIN_SIZE / 2) / CONS.TERRAIN_SIZE)
			* (INTSYS.CONS.RESOLUTION - 1);

	return {
		'x' : Math.floor(x),
		'y' : Math.floor(y)
	};
};

INTSYS.Landscape3D.prototype._toLocalPosition = function(x, y) {
	var newX = ((x / (INTSYS.CONS.RESOLUTION - 1)) * CONS.TERRAIN_SIZE) - CONS.TERRAIN_SIZE / 2;
	var newY = this._getHeight(x, y);
	var newZ = ((y / (INTSYS.CONS.RESOLUTION - 1)) * CONS.TERRAIN_SIZE)
			- CONS.TERRAIN_SIZE / 2;

	return new THREE.Vector3(newX, newY, newZ);
};

INTSYS.Landscape3D.prototype._getHeight = function(x, y) {
	return this._heightData[this._calculateIndex(x, y)];
};

INTSYS.Landscape3D.prototype._calculateIndex = function(x, y) {
	return y * INTSYS.CONS.RESOLUTION + x;
};

INTSYS.Landscape3D.prototype.clearLandmarks = function() {
	for ( var index in this._landmarkSprites) {
		var landmark = this._landmarkSprites[index];
		this.removeLandmark(landmark.userData.id);
	}
	this._landmarkSprites = [];
};

INTSYS.Landscape3D.prototype.addLandmark = function(landmark, decorate, callback) {
	var landmarkSprite;
	var foundLandmarkIndex = this._findLandmark(landmark.id);
	if (foundLandmarkIndex) {
		landmarkSprite = this._landmarkSprites[foundLandmarkIndex];
		if(!this.isDecorated(landmark.id) && decorate){
			this._decorate(landmarkSprite);
			this._keepAsLandmarks.push(landmark);
		} 
	} else {
		this._createLandmark(landmark, decorate);
	} 
	
	if(callback){
		callback();
	}
};

INTSYS.Landscape3D.prototype._createLandmark = function(landmark, decorate){
	var imageURL;
	if (landmark.image) {
		imageURL = landmark.image;
	} else {
		imageURL = CONS.IMAGE_PATH_PREFIX + "movie_img/noimage.png";
	}
	
	var canvas = document.createElement('canvas');
	canvas.width = CONS.DEFAULT_IMG_SIZE;
	canvas.height = CONS.DEFAULT_IMG_SIZE;
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var texture = new THREE.Texture(canvas);
	this._setTextureParams(texture);
	var material = new THREE.SpriteMaterial({
		map : texture,
		fog : false
	});
	var landmarkSprite = new THREE.Sprite(material);
	landmarkSprite.userData = landmark;
	landmarkSprite.scale.set(CONS.ITEMSIZE, CONS.ITEMSIZE, 1);
	var newPosition = this._toLocalPosition(Math.round(landmark.x), Math.round(landmark.y));
	landmarkSprite.position.x = newPosition.x;
	landmarkSprite.position.y = newPosition.y + landmarkSprite.scale.y / 2;
	landmarkSprite.position.z = newPosition.z;
	this._threeJsScene.scene.add(landmarkSprite);
	this._landmarkSprites.push(landmarkSprite);
	
	var self = this;
	var onLoaded = 
	(function(sprite, decorated){
		 return function(image) {
			var texture = self._createTextureFromImage(image);
			texture.format = THREE.RGBFormat;
			sprite.material.map = texture;
			sprite.material.map.needsUpdate = true;
			if(decorated || sprite.userData.decorated){
				self._decorate(sprite);
			}
		};
	})(landmarkSprite, decorate);
	
	var imageLoader = new THREE.ImageLoader();
	imageLoader.load(imageURL, onLoaded);
};

INTSYS.Landscape3D.prototype._createTextureFromImage = function(image){
	var canvas = document.createElement('canvas');
	canvas.width = CONS.DEFAULT_IMG_SIZE;
	canvas.height = CONS.DEFAULT_IMG_SIZE;
	var context = canvas.getContext('2d');
	context.drawImage(image, 0, 0, CONS.DEFAULT_IMG_SIZE, CONS.DEFAULT_IMG_SIZE);
	var texture = new THREE.Texture(canvas);
	this._setTextureParams(texture);
    return texture;
};

INTSYS.Landscape3D.prototype.isDecorated = function(landmarkId) {
	return this._findDecoratedLandmark(landmarkId) !== undefined;
};

INTSYS.Landscape3D.prototype._findDecoratedLandmark = function(landmarkId) {
	for (var index in this._decoratedLandmarkSprites) {
		var decoratedLandmarkSprite = this._decoratedLandmarkSprites[index];
		if (decoratedLandmarkSprite.userData.id == landmarkId) {
			return index;
		}
	}
};

INTSYS.Landscape3D.prototype._decorate = function(landmarkSprite) {
	var img = landmarkSprite.material.map.image;
	var canvas = document.createElement('canvas');
	canvas.width = CONS.DEFAULT_IMG_SIZE;
	canvas.height = CONS.DEFAULT_IMG_SIZE;
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = INTSYS.CONS.REC_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#AAAAAA";
	ctx.fillRect(13, 13, canvas.width-26, canvas.height-26);
	ctx.drawImage(img, 16, 16, canvas.width-32, canvas.width-32);
	var texture = new THREE.Texture(canvas);
	this._setTextureParams(texture);
	var material = landmarkSprite.material;
	if (material) {
		material.map = texture;
	} else {
		material = new THREE.SpriteMaterial({
			map : texture,
			fog : false
		});
	}
	material.map.needsUpdate = true;
	landmarkSprite.material = material;
	landmarkSprite.userData.decorated = true;
	this._decoratedLandmarkSprites.push(landmarkSprite);
};

INTSYS.Landscape3D.prototype._setTextureParams = function(texture){
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1,1);
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestMipMapNearestFilter;
	var maxAnisotropy = this._threeJsScene.renderer.capabilities.getMaxAnisotropy();
	texture.anisotropy = maxAnisotropy;
	texture.needsUpdate = true;
};

INTSYS.Landscape3D.prototype._findLandmark = function(landmarkId) {
	for ( var index in this._landmarkSprites) {
		var landmarkSprite = this._landmarkSprites[index];
		if (landmarkSprite.userData.id == landmarkId) {
			return index;
		}
	}
};

INTSYS.Landscape3D.prototype.removeLandmarks = function(landmarkIds) {
	for ( var index in landmarkIds) {
		var landmarkId = landmarkIds[index];
		this.removeLandmark(landmarkId);
	}
};

INTSYS.Landscape3D.prototype.removeLandmark = function(landmarkId) {
	var foundIndex = this._findLandmark(landmarkId);
	if (foundIndex) {
		this._threeJsScene.scene.remove(this._landmarkSprites[foundIndex]);
		this._landmarkSprites.splice(foundIndex, 1);
	}
};

INTSYS.Landscape3D.prototype.changeDecoratedLandmarks = function(toBeDecoratedLandmarks){
	var index;
	for (index = this._decoratedLandmarkSprites.length-1; index >= 0; index--) { // To let elements be removed while iterating
		var decoratedLandmarkSprite = this._decoratedLandmarkSprites[index];
		var hasToBeDecorated = false;
		for(index2 in toBeDecoratedLandmarks){
			var toBeDecoratedLandmark = toBeDecoratedLandmarks[index2];
			if(toBeDecoratedLandmark.id == decoratedLandmarkSprite.userData.id){
				hasToBeDecorated = true;
			}
		}
		if(!hasToBeDecorated){
			this._removeDecoratedLandmarkSprite(decoratedLandmarkSprite.userData.id);
		}
	}
	var keepAsLandmarksCopy = this._keepAsLandmarks;
	this._keepAsLandmarks = [];
	
	for(index in toBeDecoratedLandmarks){
		var toBeDecoratedLandmark = toBeDecoratedLandmarks[index];
		if(!this.isDecorated(toBeDecoratedLandmark)){
			this.addLandmark(toBeDecoratedLandmark, true);
		} else {
			for(index2 in keepAsLandmarksCopy){
				var landmarkToKeep = keepAsLandmarksCopy[index2];
				if(landmarkToKeep.id == toBeDecoratedLandmark.id){
					this._keepAsLandmarks.push(landmarkToKeep);
				}
			}
		}
	}
	
};

INTSYS.Landscape3D.prototype._removeDecoratedLandmarkSprite = function(landmarkId){
	this.removeLandmark(landmarkId);
	
	var foundIndex = this._findDecoratedLandmark(landmarkId);
	if (foundIndex) {
		this._decoratedLandmarkSprites.splice(foundIndex, 1);
	}
	
	for(index in this._keepAsLandmarks){
		var landmarkToKeep = this._keepAsLandmarks[index];
		if(landmarkToKeep.id == landmarkId){
			this.addLandmark(landmarkToKeep, false);
		}
	}
};

INTSYS.Landscape3D.prototype.changeSelectedLandmark = function(id) {
	var foundIndex = this._findLandmark(id);
	if (foundIndex) {
		// set former sprite to old size and position
		if (this._selectedLandmarkSprite) {
			var formerSprite = this._selectedLandmarkSprite;
			formerSprite.scale.set(CONS.ITEMSIZE * 0.7, CONS.ITEMSIZE, 1);
			formerSprite.position.y = this._getHeight(formerSprite.userData.x,
					formerSprite.userData.y)
					+ formerSprite.scale.y / 2;
		}
		this._selectedLandmarkSprite = this._landmarkSprites[foundIndex];
	}
};

INTSYS.Landscape3D.prototype.getSelectedLandmarkId = function() {
	if (this._selectedLandmarkSprite) {
		return this._selectedLandmarkSprite.userData.id;
	}
};

INTSYS.Landscape3D.prototype.disableCameraMovement = function() {
	this._threeJsScene.controls.noRotate = true;
	this._threeJsScene.controls.noPan = true;
};

INTSYS.Landscape3D.prototype.enableCameraMovement = function() {
	this._threeJsScene.controls.noRotate = false;
	this._threeJsScene.controls.noPan = false;
};

INTSYS.Landscape3D.prototype.setSculptAmount = function(sculptAmount) {
	this._sculptAmount = sculptAmount;
	this._skulpt.setBrushAmount(this._sculptAmount);
};

INTSYS.Landscape3D.prototype.setSculptPatchSize = function(sculptPatchSize){
	this._sculptPatchSize = sculptPatchSize;
	this._skulpt.setBrushSize(this._sculptPatchSize);
};

INTSYS.Landscape3D.prototype.recallState = function(state) {
	this.changeSelectedLandmark(state.selection);
	this._threeJsScene.camera.position.set(state.camera_position.x,
			state.camera_position.y, state.camera_position.z);
	this._threeJsScene.camera.lookAt(new THREE.Vector3());
};

INTSYS.Landscape3D.prototype.snapshotState = function() {
	return {
		'selection' : this.getSelectedLandmarkId(),
		'camera_position' : this._threeJsScene.camera.position,
		'imageData' : null
	};
};

INTSYS.Landscape3D.prototype.onWindowResize = function() {
	this._threeJsScene.camera.aspect = window.innerWidth / window.innerHeight;
	this._threeJsScene.camera.updateProjectionMatrix();
	this._threeJsScene.renderer.setSize( window.innerWidth, window.innerHeight );
}