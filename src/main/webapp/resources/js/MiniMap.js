var INTSYS = INTSYS || {};

INTSYS.Minimap = function(componentId, mainSceneId, mainLandscape) {
	this._recommendations = [];
	this._heightData = new Float32Array(INTSYS.CONS.RESOLUTION * INTSYS.CONS.RESOLUTION);
	
	this._setupScene(document.getElementById(componentId));
	this._mainLandscape = mainLandscape;
	this._mainScene = mainLandscape._threeJsScene;

	this._camera = this._mainScene.camera.clone();
	
	// create controls
	this._controls = new THREE.OrbitControls(this._camera, document.getElementById(mainSceneId), new THREE.Vector3(0, -1, 0));
	if(!INTSYS.CONS.DEBUG){
		this._controls.maxPolarAngle = (Math.PI / 2)- (Math.PI / 16);
		this._controls.maxDistance = 20;
		this._controls.minDistance = 3;
	}
	this._controls.noPan = true;
	this._controls.noZoom = true;

	this._clock = new THREE.Clock();
	this._startAnimationLoop();
};

INTSYS.Minimap.prototype._setupScene = function(htmlElement) {
	// setup renderer
	this._renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha : true
	});
	this._renderer.setSize(htmlElement.clientWidth, htmlElement.clientHeight);
	this._renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
	this._renderer.setClearColor('#F4F7F3', 0);

	htmlElement.appendChild(this._renderer.domElement);

	this._scene = new THREE.Scene();
	
	// create basic plane for landscape
	var groundPlaneGeom = new THREE.PlaneGeometry(15, 15, INTSYS.CONS.RESOLUTION - 1, INTSYS.CONS.RESOLUTION - 1);
	groundPlaneGeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
	var groundPlaneMesh = new THREE.Mesh(groundPlaneGeom, null);
	groundPlaneMesh.castShadow = true;
	groundPlaneMesh.receiveShadow = true;
	this._scene.add(groundPlaneMesh);

	// create a GpuSkulpt
	this._gpuSkulpt = new SKULPT.GpuSkulpt({
		renderer : this._renderer,
		mesh : groundPlaneMesh,
		size : 10,
		res : INTSYS.CONS.RESOLUTION,
		lutName : "cooltowarm"
	});

	// setup lights
	this._scene.add(new THREE.AmbientLight(0x999999));

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
	this._scene.add(keyLight);

	var fillLight = new THREE.DirectionalLight(0xBBBBBB, 0.4);
	fillLight.position.set(5, 2, 15);
	fillLight.target.position.set(0, 0, 0);
	this._scene.add(fillLight);
};

INTSYS.Minimap.prototype._startAnimationLoop = function() {
	var self = this;
	(function loop() {
		self._render();
		requestAnimationFrame(loop);
	})();
};

INTSYS.Minimap.prototype._render = function() {
	var dt = this._clock.getDelta();
	this._renderer.autoClear = false;
	this._renderer.clear();

	this._controls.noRotate = this._mainScene.controls.noRotate;
	this._gpuSkulpt.update(dt);
	this._renderer.render(this._scene, this._camera);
};

INTSYS.Minimap.prototype.updateHeights = function(heightImageData) {
	this._gpuSkulpt.loadFromImageData(heightImageData);
	this._render();
	var imageData = this._gpuSkulpt.getFlippedPixelData();
	
	for (var i = 0; i < this._heightData.length; i++) {
		this._heightData[i] = imageData[i * 4] / 255;
	}
};

INTSYS.Minimap.prototype.updateRecommendations = function(recommendations){
	this.clearRecommendations();
	for ( var index in recommendations) {
		var recommendation = recommendations[index];
		this.addRecommendation(recommendation);
	}
};

INTSYS.Minimap.prototype.clearRecommendations = function(){
	for ( var index in this._recommendations) {
		var recommendation = this._recommendations[index];
		this._scene.remove(recommendation);
	}
	this._recommendations = [];
};

INTSYS.Minimap.prototype.addRecommendation = function(recommendation){
	var material = new THREE.SpriteMaterial({
		color : INTSYS.CONS.REC_COLOR,
		fog : false
	});
	var recommendationSprite = new THREE.Sprite(material);
	recommendationSprite.userData = recommendation;
	recommendationSprite.scale.set(0.7, 0.5, 1);
	var newPosition = this._mainLandscape._toLocalPosition(Math.round(recommendation.x), Math.round(recommendation.y));
	recommendationSprite.position.x = newPosition.x;
	recommendationSprite.position.y = this.getHeight(Math.round(recommendation.x), Math.round(recommendation.y)) + recommendationSprite.scale.y / 2;
	recommendationSprite.position.z = newPosition.z;
	this._scene.add(recommendationSprite);
	this._recommendations.push(recommendationSprite);	
};

INTSYS.Minimap.prototype.getHeight = function(x,y){
	return this._heightData[this._mainLandscape._calculateIndex(x, y)];
};