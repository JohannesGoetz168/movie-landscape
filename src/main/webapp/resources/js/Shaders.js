/**
 * 
 */

var SKULPT = SKULPT || {};

SKULPT.Shaders = {
		
	vert: {

        passUv: [

            //Pass-through vertex shader for passing interpolated UVs to fragment shader

            "varying vec2 vUv;",

            "void main() {",
                "vUv = vec2(uv.x, uv.y);",
                "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"

        ].join('\n'),

        heightMap: [

            //Vertex shader that displaces vertices in local Y based on a texture

            "uniform sampler2D uTexture;",
            "uniform vec2 uTexelSize;",
            "uniform vec2 uTexelWorldSize;",

            "varying vec3 vViewNormal;",
            "varying vec2 vUv;",
            "varying vec4 vWorldPosition;",
            
//            THREE.ShaderChunk['clipping_planes_pars_vertex'],

            THREE.ShaderChunk['shadowmap_pars_vertex'],
            
            "void main() {",

                "vUv = uv;",

                //displace y based on texel value
                "vec4 t = texture2D(uTexture, vUv);",
                "vec3 transformed = vec3(position.x, t.r, position.z);",

                //find normal
                "vec2 du = vec2(uTexelSize.r, 0.0);",
                "vec2 dv = vec2(0.0, uTexelSize.g);",
                "vec3 vecPosU = vec3(transformed.x + uTexelWorldSize.r, texture2D(uTexture, vUv + du).r, transformed.z) - transformed;",
                "vec3 vecNegU = vec3(transformed.x - uTexelWorldSize.r, texture2D(uTexture, vUv - du).r, transformed.z) - transformed;",
                "vec3 vecPosV = vec3(transformed.x, texture2D(uTexture, vUv + dv).r, transformed.z - uTexelWorldSize.g) - transformed;",
                "vec3 vecNegV = vec3(transformed.x, texture2D(uTexture, vUv - dv).r, transformed.z + uTexelWorldSize.g) - transformed;",
                "vViewNormal = normalize(normalMatrix * 0.25 * (cross(vecPosU, vecPosV) + cross(vecPosV, vecNegU) + cross(vecNegU, vecNegV) + cross(vecNegV, vecPosU)));",

                "vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);",
                "vWorldPosition = worldPosition;",
                
                THREE.ShaderChunk['project_vertex'],
                THREE.ShaderChunk['shadowmap_vertex'],
            "}"

        ].join('\n')

    },

    frag: {

        skulpt: [

            //Fragment shader for sculpting

            "uniform sampler2D uBaseTexture;",
            "uniform sampler2D uSculptTexture1;",
            "uniform sampler2D uRestrictionTexture;",
            "uniform vec2 uTexelSize;",
            "uniform int uIsSculpting;",
            "uniform int uSculptType;",
            "uniform float uSculptAmount;",
            "uniform float uSculptRadius;",
            "uniform vec2 uSculptPos;",

            "varying vec2 vUv;",

            "float add(vec2 uv) {",
                "float len = length(uv - vec2(uSculptPos.x, 1.0 - uSculptPos.y));",
                "return uSculptAmount * smoothstep(uSculptRadius, 0.0, len);",
            "}",

            "void main() {",

                //r channel: height

                //read base texture
                "vec4 tBase = texture2D(uBaseTexture, vUv);",

                //read texture from previous step
                "vec4 t1 = texture2D(uSculptTexture1, vUv);",
                
                "vec4 restrictionValue = texture2D(uRestrictionTexture, vUv);",

                //do sculpt 
                "if (uIsSculpting == 1) {",
                    "if (uSculptType == 1) {",  //add
                        "t1.r += add(vUv);",
                        "t1.r = min(restrictionValue.r, tBase.r + t1.r) - tBase.r;",
                    "} else if (uSculptType == 2) {",  //remove
                        "t1.r -= add(vUv);",
                        "t1.r = max(0.0, tBase.r + t1.r) - tBase.r;",
                    "}",
                "}",

                //write out to texture for next step
                "gl_FragColor = t1;",
            "}"

        ].join('\n'),

        combineTextures: [

            //Fragment shader to combine textures

            "uniform sampler2D uTexture1;",
            "uniform sampler2D uTexture2;",

            "varying vec2 vUv;",

            "void main() {",
                "gl_FragColor = texture2D(uTexture1, vUv) + texture2D(uTexture2, vUv);",
                
            "}"

        ].join('\n'),

        setColor: [

            //Fragment shader to set colors on a render target

            "uniform vec4 uColor;",

            "void main() {",
                "gl_FragColor = uColor;",
            "}"

        ].join('\n'),

        flipTexture: [

            //Fragment shader to flip a texture

            "uniform sampler2D uTexture;",

            "varying vec2 vUv;",

            "void main() {",
                "vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);",
                "gl_FragColor = texture2D(uTexture, flippedUv);",
            "}"

        ].join('\n'),

        lambertCursor: [

            //Fragment shader that does basic lambert shading.
            //This is the version that overlays a circular cursor patch.

            "uniform vec3 uBaseColor;",

            "uniform sampler2D uTexture;",
            "uniform sampler2D uHeightColorLookupTexture;",
            "uniform sampler2D uNoiseTexture;",
            
            "uniform int uShowCursor;",
            "uniform vec2 uCursorPos;",
            "uniform float uCursorRadius;",
            "uniform vec3 uCursorColor;",

            "varying vec3 vViewNormal;",
            "varying vec2 vUv;",
            
            THREE.ShaderChunk['common'],
            
            THREE.ShaderChunk['lights_pars_begin'],
            THREE.ShaderChunk['packing'],
            
            "varying vec4 vWorldPosition;",
            "uniform float uClippingLevelY;",

            "void main() {",
            
            	"if ( vWorldPosition.y < uClippingLevelY) discard;",

                //ambient component
                "vec3 ambient = ambientLightColor;",

                //diffuse component
                "vec3 diffuse = vec3(0.0);",

                "#if NUM_DIR_LIGHTS > 0",

                    "for (int i = 0; i < NUM_DIR_LIGHTS; i++) {",
                        "vec4 lightVector = viewMatrix * vec4(directionalLights[i].direction, 0.0);",
                        "float normalModulator = dot(normalize(vViewNormal), normalize(lightVector.xyz));",
                        "diffuse += normalModulator * directionalLights[i].color;",
                    "}",

                "#endif",

                //get height from height texture
                "vec4 heightColor = texture2D(uTexture, vUv);",
                
	            //convert height to color using lookup texture
                "float heightValue = min(heightColor.r, 0.99);",
                "vec3 baseColor = texture2D(uHeightColorLookupTexture, vec2(heightValue, 0)).rgb;",
                "vec3 finalColor = baseColor * (ambient + diffuse);",
                
                //mix in noise texture
                "finalColor = finalColor * 0.98 + texture2D(uNoiseTexture, vUv).rgb * 0.02;",
                
                //mix in cursor color
                "if (uShowCursor == 1) {",
                    "float len = length(vUv - vec2(uCursorPos.x, 1.0 - uCursorPos.y));",
                    "finalColor = mix(finalColor, uCursorColor, smoothstep(uCursorRadius, 0.0, len));",
                "}",

                "gl_FragColor = vec4(finalColor, 1.0);",

            "}"

        ].join('\n')

    }

};