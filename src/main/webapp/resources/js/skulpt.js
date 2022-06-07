/**
 * @fileOverview Adapted script for 3D sculpting of Skeel Lee <skeel@skeelogy.com>. Original can be found at http://skeelogy.github.io/skulpt.js/examples/skulpt_terrain.html. 
 */

var SKULPT = SKULPT || {};

/**
 * Add sculpt operation
 * @const
 */
SKULPT.ADD = 1;
/**
 * Remove sculpt operation
 * @const
 */
SKULPT.REMOVE = 2;

/**
 * Creates a GpuSkulpt instance for sculpting
 * @constructor
 * @param {object} options Options
 * @param {THREE.WebGLRenderer} options.renderer Three.js WebGL renderer
 * @param {THREE.Mesh} options.mesh Three.js mesh for sculpting
 * @param {number} options.size size of mesh
 * @param {number} options.res resolution of mesh
 */
SKULPT.GpuSkulpt = function (options) {

    this.__mesh = options.mesh;
    this.__renderer = options.renderer;
    this.__size = options.size;
    this.__halfSize = this.__size / 2.0;
    this.__res = options.res;
    
    this.__lutName = options.lutName;
    if (typeof this.__lutName === 'undefined'){
    	this.__lutName = "realistic_b";
    }
    
    this.__texelSize = 1.0 / this.__res;
    this.__texelWorldSize = this.__texelSize * this.__size;

    this.__isSculpting = false;
    this.__sculptUvPos = new THREE.Vector2();

    this.__cursorHoverColor = new THREE.Vector3(0.9, 0.9, 0.9);
    this.__cursorAddColor = new THREE.Vector3(0.3, 0.5, 0.1);
    this.__cursorRemoveColor = new THREE.Vector3(0.5, 0.2, 0.1);

    this.__shouldClear = false;
    
    this.__init();
};




SKULPT.GpuSkulpt.prototype.__init = function () {

    this.__setupRttScene();

    //setup a reset material for clearing render targets
    this.__clearMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { type: 'v4', value: new THREE.Vector4() }
        },
        vertexShader: SKULPT.Shaders.vert['passUv'],
        fragmentShader: SKULPT.Shaders.frag['setColor']
    });

    this.__setupRttRenderTargets();
    this.__setupMaterials();

    //create a DataTexture, with linear filtering and mipmapping
    this.__imageDataTexture = new THREE.DataTexture(null, this.__res, this.__res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
    this.__imageDataTexture.generateMipmaps = true;
    
    this.__restrictionDataTexture = new THREE.DataTexture(null, this.__res, this.__res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
    this.__restrictionDataTexture.generateMipmaps = true;
};

SKULPT.GpuSkulpt.prototype.__setupRttScene = function () {

    //create a RTT scene
    this.__rttScene = new THREE.Scene();

    //create an orthographic RTT camera
    var far = 1;
    var near = -far;
    this.__rttCamera = new THREE.OrthographicCamera(-this.__halfSize, this.__halfSize, this.__halfSize, -this.__halfSize, near, far);
    
    //create a quad which we will use to invoke the shaders
    this.__rttQuadGeom = new THREE.PlaneGeometry(this.__size, this.__size);
    this.__rttQuadMesh = new THREE.Mesh(this.__rttQuadGeom, this.__skulptMaterial);
    this.__rttScene.add(this.__rttQuadMesh);
};

SKULPT.GpuSkulpt.prototype.__setupRttRenderTargets = function () {

	var linearFloatRgbaParams = {
    		minFilter: THREE.LinearFilter,
    		magFilter: THREE.LinearFilter,
    		wrapS: THREE.ClampToEdgeWrapping,
    		wrapT: THREE.ClampToEdgeWrapping,
    		format: THREE.RGBAFormat,
    		type: THREE.FloatType,
    		stencilBuffer: false,
    		depthBuffer: false
    };

    var nearestUByteRgbaParams = {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: false,
        type: THREE.UnignedByteType
    };
	
    //create RTT render targets (we need two to do feedback)
    this.__rttRenderTarget1 = new THREE.WebGLRenderTarget(this.__res, this.__res, linearFloatRgbaParams);    
    this.__rttRenderTarget1.texture.generateMipmaps = false;
    
    this.__rttRenderTarget2 = this.__rttRenderTarget1.clone();

    //create a RTT render target for storing the combine results of all layers
    this.__rttCombinedLayer = this.__rttRenderTarget1.clone();

    //create RTT render target for storing proxy terrain data
    this.__rttFlipTextureRenderTarget = this.__rttRenderTarget1.clone();

    //create another RTT render target encoding float to 4-byte data
    this.__rttFloatEncoderRenderTarget = new THREE.WebGLRenderTarget(this.__res, this.__res, nearestUByteRgbaParams);
    this.__rttFloatEncoderRenderTarget.texture.generateMipmaps = false;
};

SKULPT.GpuSkulpt.prototype.__setupMaterials = function () {

    this.__skulptMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uBaseTexture: { type: 't', value: null },
            uSculptTexture1: { type: 't', value: null },
            uRestrictionTexture: { type: 't', value: null},
            uTexelSize: { type: 'v2', value: new THREE.Vector2(this.__texelSize, this.__texelSize) },
            uTexelWorldSize: { type: 'v2', value: new THREE.Vector2(this.__texelWorldSize, this.__texelWorldSize) },
            uIsSculpting: { type: 'i', value: 0 },
            uSculptType: { type: 'i', value: 0 },
            uSculptPos: { type: 'v2', value: new THREE.Vector2() },
            uSculptAmount: { type: 'f', value: 0.05 },
            uSculptRadius: { type: 'f', value: 0.0 }
        },
        vertexShader: SKULPT.Shaders.vert['passUv'],
        fragmentShader: SKULPT.Shaders.frag['skulpt']
    });

    this.__combineTexturesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture1: { type: 't', value: null },
            uTexture2: { type: 't', value: null }
        },
        vertexShader: SKULPT.Shaders.vert['passUv'],
        fragmentShader: SKULPT.Shaders.frag['combineTextures']
    });

   this.__passTextureMaterial = new THREE.MeshBasicMaterial({
    	map : this.__rttCombinedLayer.texture    	
    });

    this.__flipTextureMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: null },
        },
        vertexShader: SKULPT.Shaders.vert['passUv'],
        fragmentShader: SKULPT.Shaders.frag['flipTexture']
    });
    
    this.__mesh.material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            {
                uTexture: { type: 't', value: null },
                uHeightColorLookupTexture: { type: 't', value: null},
                uNoiseTexture: { type: 't', value: null},
                uTexelSize: { type: 'v2', value: new THREE.Vector2(this.__texelSize, this.__texelSize) },
                uTexelWorldSize: { type: 'v2', value: new THREE.Vector2(this.__texelWorldSize, this.__texelWorldSize) },
                uBaseColor: { type: 'v3', value: new THREE.Vector3(0.0, 0.9, 0.0) },
                uShowCursor: { type: 'i', value: 0 },
                uCursorPos: { type: 'v2', value: new THREE.Vector2() },
                uCursorRadius: { type: 'f', value: 0.0 },
                uCursorColor: { type: 'v3', value: new THREE.Vector3() },
                uClippingLevelY: {type: 'f', value: 0.001}
            }
        ]),
        vertexShader: SKULPT.Shaders.vert['heightMap'],
        fragmentShader: SKULPT.Shaders.frag['lambertCursor'],
        lights: true
    });
     
    var self = this;
    var loader = new THREE.TextureLoader();
	loader.load(CONS.IMAGE_PATH_PREFIX + "textures/noise01.jpg", function ( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 4, 4 );
		self.__mesh.material.uniforms['uNoiseTexture'].value = texture;
	} );
	
    this.__setupHeightColorLookupTexuture();
};


SKULPT.GpuSkulpt.prototype.__setupHeightColorLookupTexuture = function () {

	var heightColorData = new Float32Array(256*4);
	
	var lut = new THREE.Lut(this.__lutName, 512 );
	lut.setMax(255);
	lut.setMin( 0 );
	
	for(var i = 0; i < heightColorData.length; i+=4){
		
		var color = lut.getColor( i/4 );
		if ( color == undefined ) {
			console.log( "ERROR: " + i );
		} else {
			heightColorData[i] = color.r;
			heightColorData[i+1] = color.g;
			heightColorData[i+2] = color.b;
			heightColorData[i+3] = 1.0;
		}
	}
	
	var lookupTexture = new THREE.DataTexture(
			heightColorData, 
			256, 
			1, 
			THREE.RGBAFormat, 
			THREE.FloatType, 
			undefined, 
			THREE.RepeatWrapping, 
			THREE.RepeatWrapping, 
			THREE.NearestFilter, 
			THREE.NearestFilter
	);
	
	lookupTexture.generateMipmaps = false;
	lookupTexture.needsUpdate = true;
	this.__mesh.material.uniforms['uHeightColorLookupTexture'].value = lookupTexture;
};

/**
 * Updates the skulpt<br/><strong>NOTE:  This needs to be called every frame, after renderer.clear() and before renderer.render(...)</strong>
 * @param {number} dt Elapsed time since previous frame
 */
SKULPT.GpuSkulpt.prototype.update = function (dt) {
    //have to set flags from other places and then do all steps at once during update

    //clear sculpts if necessary
    if (this.__shouldClear) {
        this.__rttQuadMesh.material = this.__clearMaterial;
        this.__clearMaterial.uniforms['uColor'].value.set(0.0, 0.0, 0.0, 0.0);
        this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttRenderTarget1, false);
        this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttRenderTarget2, false);
        this.__shouldClear = false;
        this.__updateCombinedLayers = true;
    }

    //do the main sculpting
    if (this.__isSculpting) {
        this.__rttQuadMesh.material = this.__skulptMaterial;
        this.__skulptMaterial.uniforms['uBaseTexture'].value = this.__imageDataTexture;
        this.__skulptMaterial.uniforms['uSculptTexture1'].value = this.__rttRenderTarget2.texture;
    	this.__skulptMaterial.uniforms['uRestrictionTexture'].value = this.__restrictionDataTexture;
        this.__skulptMaterial.uniforms['uIsSculpting'].value = this.__isSculpting;
        this.__skulptMaterial.uniforms['uSculptPos'].value.copy(this.__sculptUvPos);
        this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttRenderTarget1, false);
        this.__swapRenderTargets();
        this.__isSculpting = false;
        this.__updateCombinedLayers = true;
    }

    //combine layers into one
    if (this.__updateCombinedLayers) {  //this can be triggered somewhere else without sculpting

        this.__rttQuadMesh.material = this.__combineTexturesMaterial;
        this.__combineTexturesMaterial.uniforms['uTexture1'].value = this.__imageDataTexture;
        this.__combineTexturesMaterial.uniforms['uTexture2'].value = this.__rttRenderTarget2.texture;
        this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttCombinedLayer, false);
        this.__updateCombinedLayers = false;

        //need to rebind rttCombinedLayer to uTexture
        this.__mesh.material.uniforms['uTexture'].value = this.__rttCombinedLayer.texture;
    }
};
SKULPT.GpuSkulpt.prototype.__swapRenderTargets = function ()  { 
	var temp = this.__rttRenderTarget1;
    this.__rttRenderTarget1 = this.__rttRenderTarget2;
    this.__rttRenderTarget2 = temp;
};
/**
 * Sets brush size
 * @param {number} size Brush size
 */
SKULPT.GpuSkulpt.prototype.setBrushSize = function (size) {
	console.log("Change brush size to ", size);
    var normSize = size / (this.__size * 2.0);
    this.__skulptMaterial.uniforms['uSculptRadius'].value = normSize;
    this.__mesh.material.uniforms['uCursorRadius'].value = normSize;
};
/**
 * Sets brush amount
 * @param {number} amount Brush amount
 */
SKULPT.GpuSkulpt.prototype.setBrushAmount = function (amount) {
    this.__skulptMaterial.uniforms['uSculptAmount'].value = amount;
};
SKULPT.GpuSkulpt.prototype.getBrushAmount = function(){
	return this.__skulptMaterial.uniforms['uSculptAmount'].value;
};
/**
 * Loads terrain heights from image data
 * @param  {array} data Image data from canvas
 */
SKULPT.GpuSkulpt.prototype.loadFromImageData = function (data) {

    var processedImageData = this._convertFromUint8ToFloat32(data);

    //assign data to DataTexture
    this.__imageDataTexture.image.data = processedImageData;
    this.__imageDataTexture.needsUpdate = true;
    this.__shouldClear = true;
    this.__updateCombinedLayers = true;
};

/**
 * Convert data from Uint8ClampedArray to Float32Array so that DataTexture can use
 */
SKULPT.GpuSkulpt.prototype._convertFromUint8ToFloat32 = function(data){
    var i, len;
    var processedImageData = new Float32Array(4 * this.__res * this.__res);
    
    for (i = 0; i < processedImageData.length; i++) {
    	processedImageData[i] = data[i] / 255.0;
    }
    
    return processedImageData;
};

/**
 * Sculpt the terrain
 * @param  {enum} type Sculpt operation type: INTSYS.GpuSkulpt.ADD, INTSYS.GpuSkulpt.REMOVE
 * @param  {THREE.Vector3} position World-space position to sculpt at
 * @param  {number} amount Amount to sculpt
 */
SKULPT.GpuSkulpt.prototype.sculpt = function (type, position, amount) {
    this.__skulptMaterial.uniforms['uSculptType'].value = type;
	this.__skulptMaterial.uniforms['uSculptAmount'].value = amount;
    this.__isSculpting = true;
    this.__sculptUvPos.x = (position.x + this.__halfSize) / this.__size;
    this.__sculptUvPos.y = (position.z + this.__halfSize) / this.__size;
    if (type === 1) {
        this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorAddColor);
    } else if (type === 2) {
        this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorRemoveColor);
    }
};

/**
 * Updates the cursor position
 * @param  {THREE.Vector3} position World-space position to update the cursor to
 */
SKULPT.GpuSkulpt.prototype.updateCursor = function (position) {
    this.__sculptUvPos.x = (position.x + this.__halfSize) / this.__size;
    this.__sculptUvPos.y = (position.z + this.__halfSize) / this.__size;
    this.__mesh.material.uniforms['uCursorPos'].value.set(this.__sculptUvPos.x, this.__sculptUvPos.y);
    this.__mesh.material.uniforms['uCursorColor'].value.copy(this.__cursorHoverColor);
};

/**
 * Shows the sculpt cursor
 */
SKULPT.GpuSkulpt.prototype.showCursor = function () {
    this.__mesh.material.uniforms['uShowCursor'].value = 1;
};

/**
 * Hides the sculpt cursor
 */
SKULPT.GpuSkulpt.prototype.hideCursor = function () {
    this.__mesh.material.uniforms['uShowCursor'].value = 0;
};

/**
 * Gets the sculpt texture that is used for displacement of mesh
 * @return {THREE.WebGLRenderTarget} Sculpt texture that is used for displacement of mesh
 */
SKULPT.GpuSkulpt.prototype.getSculptDisplayTexture = function () {
    return this.__rttCombinedLayer.texture;
};

SKULPT.GpuSkulpt.prototype.getFlippedPixelData = function () {

    //flip texture
    this.__rttQuadMesh.material = this.__flipTextureMaterial;
    this.__flipTextureMaterial.uniforms['uTexture'].value = this.__rttCombinedLayer.texture;
    this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttFlipTextureRenderTarget, false);

    return this.__getUnsignedBytePixelData(this.__rttFlipTextureRenderTarget, this.__res, this.__res);
};

SKULPT.GpuSkulpt.prototype.__getUnsignedBytePixelData = function (renderTarget, width, height) {
	
	var unsignedBytePixelData = new Uint8Array(width * height * 4);

    this.__rttQuadMesh.material = this.__passTextureMaterial;
    this.__passTextureMaterial.map = renderTarget.texture;
    this.__renderer.render(this.__rttScene, this.__rttCamera, this.__rttFloatEncoderRenderTarget, false);

    this.__renderer.readRenderTargetPixels(this.__rttFloatEncoderRenderTarget, 0, 0, width, height, unsignedBytePixelData);
    
    return unsignedBytePixelData;
};

SKULPT.GpuSkulpt.prototype.applyRestrictionData = function(restrictionData){
	var convertedData = this._convertFromUint8ToFloat32(restrictionData);
    this.__restrictionDataTexture.image.data = convertedData;
    this.__restrictionDataTexture.needsUpdate = true;
};