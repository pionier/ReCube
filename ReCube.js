//==================================================================================
//	Re-Cube	--- Re-development for 4D driver
//	2018/01/20	by pionier
//	http://www7b.biglobe.ne.jp/~fdw
//==================================================================================

//============================================================
//	OnLoad
//============================================================


function ReCube(){
	"use strict";
	var cnvs = document.getElementById('canvas'),
		cntrls = {},
		gl = {},
		views = {},
		light00 = {},
		triangleShader = {},
		texShader = {},
		TriBuffer = {},
		TRI_BUFFER_SIZE = 4096,
		WalkerBody_SCALE = 1,
		Phoenix_OffsY = 0,
		Phoenix_OffsH = 3,
		EquinoxFloor = {},
		SIGHT_LENGTH = 3*2,
		SIGHT_HEIGHT = 2,
		VELOCITY = 0.05,
		Roller = {},
		modelMatrix		= mat4.identity(mat4.create()),
		viewMatrix		= mat4.identity(mat4.create()),
		eyeMatrix		= mat4.identity(mat4.create()),
		projMatrix		= mat4.identity(mat4.create()),
		vepMatrix		= mat4.identity(mat4.create()),
		mvpMatrix		= mat4.identity(mat4.create()),
		invMatrix		= mat4.identity(mat4.create());
	
	const	ROT_RATE = 0.003;
	let floorPos = [ 0, 0, 0 ];
	
	try{
		if( !window.WebGLRenderingContext ){
			alert("No GL context.");
			return;
		}
		gl = cnvs.getContext('webgl2');
		if( !gl ){
			alert("Fail to create GL.\r\nPlease use Chrome or FireFox.");
			return;
		}
	}catch( e ){
		alert("Catch: Fail to create GL.\r\nPlease use Chrome or FireFox.");
		return;
	}
	// ブラウザごとのキーイベント名称を取得
	let keyEventNames = getKeyEventNames( fDWL.getBrowserInfo( gl ) );
	
	cnvs.width  = 512;
	cnvs.height = 384;
	
	// キーイベント
	let keyStatus = [ false, false, false, false, false, false, false, false, false ];
	let keyBackup = [ false, false, false, false, false, false, false, false, false ];
	if( window.addEventListener ){
		function KeyDownFunc( evt ){
			"use strict";
			const keyname = evt.key;
			if( keyname === keyEventNames.up ){
				keyStatus[0] = true;
			}
			if( keyname === keyEventNames.down ){
				keyStatus[1] = true;
			}
			if( keyname === keyEventNames.left ){
				keyStatus[2] = true;
			}
			if( keyname === keyEventNames.right ){
				keyStatus[3] = true;
			}
			if( keyname === keyEventNames.shift ){
				keyStatus[4] = true;
			}
			if( keyname === keyEventNames.keyB ){
				keyStatus[5] = true;
			}
			if( keyname === keyEventNames.ctrl ){
				keyStatus[6] = true;
			}
			if( keyname === keyEventNames.space ){
				keyStatus[7] = true;
			}
			if( keyname === keyEventNames.keyR ){
				keyStatus[8] = true;
			}
		}
		
		function KeyUpFunc( evt ){
			"use strict";
			const keyname = evt.key;
			if( keyname === keyEventNames.up ){
				keyStatus[0] = false;
			}
			if( keyname === keyEventNames.down ){
				keyStatus[1] = false;
			}
			if( keyname === keyEventNames.left ){
				keyStatus[2] = false;
			}
			if( keyname === keyEventNames.right ){
				keyStatus[3] = false;
			}
			if( keyname === keyEventNames.shift ){
				keyStatus[4] = false;
			}
			if( keyname === keyEventNames.keyB ){
				keyStatus[5] = false;
			}
			if( keyname === keyEventNames.ctrl ){
				keyStatus[6] = false;
			}
			if( keyname === keyEventNames.space ){
				keyStatus[7] = false;
			}
			if( keyname === keyEventNames.keyR ){
				keyStatus[8] = false;
			}
		}
		// ドキュメントにリスナーを登録
		document.addEventListener( "keydown", KeyDownFunc, false );
		document.addEventListener( "keyup", KeyUpFunc, false );
		
	}
	
	// 移動方向
	let moveXZ = {
		rot:	Math.PI/2,					// 移動方向
		vel:	0.0,				// 移動量
		dif:	[ 0.0, 0.0 ]		// 実移動量(偏差)
	};
	
	// 視線ベクトル
	views = {
		eyePosition:	[ 0,  SIGHT_HEIGHT, SIGHT_LENGTH*2 ],
		lookAt:			[ 0, 0, -4 ],
		height:			1
	};
	
	// 光源・環境光関連
	light00 = {
		position:	 [ -1.0, 20.0, 0.0 ],
		upDirection: [ 0.0, 0.0, 1.0 ],
		ambient:	 [ 0.3, 0.3, 0.3, 1.0 ]
	};
	
	// 三角バッファ用シェーダ作成
	triangleShader.prg = createShaderProgram( gl, 'triangle_vs', 'triangle_fs' );
	triangleShader.attrLoc = [
		gl.getAttribLocation( triangleShader.prg, 'aVertexPosition' ),
		gl.getAttribLocation( triangleShader.prg, 'aVertexNormal' ),
		gl.getAttribLocation( triangleShader.prg, 'aVertexColor' ),
//		gl.getAttribLocation( triangleShader.prg, 'texCoord' )
	];
//	triangleShader.attrStride = [ 3, 3, 4, 3 ];
	triangleShader.attrStride = [ 3, 3, 4 ];
	triangleShader.uniLoc = [
		gl.getUniformLocation( triangleShader.prg, 'mvpMatrix' ),
		gl.getUniformLocation( triangleShader.prg, 'invMatrix' ),
		gl.getUniformLocation( triangleShader.prg, 'lightPosition' ),
		gl.getUniformLocation( triangleShader.prg, 'eyeDirection' ),
		gl.getUniformLocation( triangleShader.prg, 'ambientColor' )
	];
	gl.enableVertexAttribArray( triangleShader.attrLoc[0] );
	gl.enableVertexAttribArray( triangleShader.attrLoc[1] );
	gl.enableVertexAttribArray( triangleShader.attrLoc[2] );
//	gl.enableVertexAttribArray( triangleShader.attrLoc[3] );
	
	triangleShader.setUniLoc = function( mvpMtx, invMtx, lgtPos, viewDir, color ){
		"use strict";
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mvpMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, invMtx );
		gl.uniform3fv( uniLoc[2], light00.position );
		gl.uniform3fv( uniLoc[3], views.eyePosition );
		gl.uniform4fv( uniLoc[4], light00.ambient );
	};
	triangleShader.setProgram = function( param ){
		"use strict";
		var uniLoc = this.uniLoc;
		gl.useProgram( this.prg );
		gl.uniformMatrix4fv( uniLoc[0], false, param[1] );
		gl.uniformMatrix4fv( uniLoc[1], false, param[2] );
		gl.uniform3fv( uniLoc[2], param[3] );
		gl.uniform3fv( uniLoc[3], param[4] );
		gl.uniform4fv( uniLoc[4], param[5] );
	};

	// Tex用シェーダの生成
	texShader.prg = createShaderProgram( gl, 'tex_vs', 'tex_fs' );
	texShader.attrLoc = [
		gl.getAttribLocation( texShader.prg, 'aVertexPosition' ),
		gl.getAttribLocation( texShader.prg, 'aVertexNormal' ),
		gl.getAttribLocation( texShader.prg, 'aVertexColor' ),
		gl.getAttribLocation( texShader.prg, 'texCoord' )
	];
	texShader.attrStride = [ 3, 3, 4, 3 ];
	gl.enableVertexAttribArray( texShader.attrLoc[0] );
	gl.enableVertexAttribArray( texShader.attrLoc[1] );
	gl.enableVertexAttribArray( texShader.attrLoc[2] );
	gl.enableVertexAttribArray( texShader.attrLoc[3] );
	texShader.uniLoc = [
		gl.getUniformLocation( texShader.prg, 'mvpMatrix' ),
		gl.getUniformLocation( texShader.prg, 'invMatrix' ),
		gl.getUniformLocation( texShader.prg, 'lightPosition' ),
		gl.getUniformLocation( texShader.prg, 'eyeDirection' ),
		gl.getUniformLocation( texShader.prg, 'ambientColor' ),
		gl.getUniformLocation( texShader.prg, 's3_texture' )
	];
	texShader.setUniLoc = function( mvpMtx, invMtx, lgtPos, viewDir, color ){
		"use strict";
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mvpMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, invMtx );
		gl.uniform3fv( uniLoc[2], light00.position );
		gl.uniform3fv( uniLoc[3], views.eyePosition );
		gl.uniform4fv( uniLoc[4], light00.ambient );
		gl.uniform1i( uniLoc[5], 0 );
	};
	texShader.setProgram = function( param ){
		"use strict";
		var uniLoc = this.uniLoc;
		gl.useProgram( this.prg );
		gl.uniformMatrix4fv( uniLoc[0], false, param[1] );
		gl.uniformMatrix4fv( uniLoc[1], false, param[2] );
		gl.uniform3fv( uniLoc[2], param[3] );
		gl.uniform3fv( uniLoc[3], param[4] );
		gl.uniform4fv( uniLoc[4], param[5] );
		gl.uniform1i( uniLoc[5], param[6] );
	};

	// ポリゴンバッファ
	TriBuffer = new fDWL.R4D.TriangleBuffer( gl, TRI_BUFFER_SIZE );
	
	// キューブ for 3d
/**
	const colorSize = 4;
	const texSize = 64;
	const maxTexSize = texSize*texSize*colorSize;
	let tex3D = new Uint8Array(texSize*maxTexSize);
	(function(){
		let texData = new Uint8Array(maxTexSize);
		let texData2 = new Uint8Array(maxTexSize);
		for( let idx = 0; idx < maxTexSize; idx += colorSize*8 ){
			let redVal = 255;
			let greenVal = 127;
			let blueVal = 127;
			if(( ( 4*texSize*colorSize) <= idx )&&( idx < ( 8*texSize*colorSize)) ||
			( (12*texSize*colorSize) <= idx )&&( idx < (16*texSize*colorSize)) ||
			( (20*texSize*colorSize) <= idx )&&( idx < (24*texSize*colorSize)) ||
			( (28*texSize*colorSize) <= idx )&&( idx < (32*texSize*colorSize)) ||
			( (36*texSize*colorSize) <= idx )&&( idx < (40*texSize*colorSize)) ||
			( (44*texSize*colorSize) <= idx )&&( idx < (48*texSize*colorSize)) ||
			( (52*texSize*colorSize) <= idx )&&( idx < (56*texSize*colorSize)) ||
			( (60*texSize*colorSize) <= idx )&&( idx < (64*texSize*colorSize))
			){
				redVal = 127;
				blueVal = 255;
			}
			if( idx > maxTexSize/2){
				greenVal = 255;
			}else{
				greenVal = 127;
			}
			for( let subIdx = 0; subIdx < 4; subIdx++ ){
				let offs = idx+(subIdx*4);
				texData[offs  ] = redVal;
				texData[offs+1] = 127;
				texData[offs+2] = blueVal;
				texData[offs+3] = 255;
				texData2[offs]  = blueVal;
				texData2[offs+1] = 127;
				texData2[offs+2] = redVal;
				texData2[offs+3] = 255;
			}
			for( let subIdx = 0; subIdx < 4; subIdx++ ){
				let offs = idx+16+(subIdx*4);
				texData[offs  ] = blueVal;
				texData[offs+1] = 127;
				texData[offs+2] = redVal;
				texData[offs+3] = 255;
				texData2[offs]  = redVal;
				texData2[offs+1] = 127;
				texData2[offs+2] = blueVal;
				texData2[offs+3] = 255;
			}
		}

		// テクスチャを３D化
		let depthCnt = 0;
		for( let idx = 0; idx < texSize; ++idx ){
			let offs = idx * maxTexSize;
			if(depthCnt >= colorSize*2){
				depthCnt = 0;
			}
			for( let subIdx = 0; subIdx < maxTexSize; ++subIdx ){
				if(depthCnt < 4){
					tex3D[offs+subIdx] = texData[subIdx];
				}else{
					tex3D[offs+subIdx] = texData2[subIdx];
				}
			}
			depthCnt++;
		}	
	}());
/**/
	const squareSize = 16;
	const texSize = 128;
	const colorSize = 4;
	const maxTexSize = texSize*texSize*colorSize;
	let tex3D = new Uint8Array(texSize*maxTexSize/2);
	(function(){
			function swapPen( penCol, col ){
			if(( penCol[0] == 255 )&&( penCol[1] == 255 )&&( penCol[2] == 255 )){
				penCol[0] = 127;
				penCol[1] = 127;
				penCol[2] = 127;
				penCol[col] = 255;
			}else{
				penCol[0] = penCol[1] = penCol[2] = 255;
			}
			return penCol;
		}

		let pixCnt = 0;
		let correntColor = 0;	// 0:red, 1:green, 2:blue, 3:black, 4:white
		let penColor = [ 255, 127, 127, 255 ];
		let zSqrCnt = 0;
		for( let zz = 0; zz < texSize/2; ++zz ){
			let sqrCnt = 0;
			for( let yy = 0; yy < texSize; ++yy ){
				if( yy == texSize/2 ){
					correntColor += 2;
				}
				for( let xx = 0; xx < texSize/squareSize; ++xx ){
					if( xx == texSize/(squareSize*2) ){
						correntColor++;
					}
					swapPen( penColor, correntColor );
					for( let qq = 0; qq < squareSize; ++qq ){
						tex3D[pixCnt  ] = penColor[0];
						tex3D[pixCnt+1] = penColor[1];
						tex3D[pixCnt+2] = penColor[2];
						tex3D[pixCnt+3] = penColor[3];
						pixCnt += 4;
					}
				}
				correntColor--;
				sqrCnt++;
				if( sqrCnt >=squareSize ){
					sqrCnt = 0;
					swapPen( penColor, correntColor );
				}
			}
			correntColor = 0;
			zSqrCnt++;
			if( zSqrCnt >= squareSize ){
				zSqrCnt = 0;
				swapPen( penColor, correntColor );
			}
		}
	}());

	let tex3DObj = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_3D, tex3DObj);
	gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, texSize,texSize,texSize/2,0, gl.RGBA, gl.UNSIGNED_BYTE, tex3D);
	gl.generateMipmap(gl.TEXTURE_3D);

	// 
	let ReCube = function( gl, pos, rotate, shader, texObj ){
		"use strict";
		this.pos = pos;
		this.rot = rotate;
		this.scale = [ 1,1,1,1 ];
		this.shader = shader;
		this.localMtx = new fDWL.R4D.Matrix4();
		this.tex = texObj;
		this.texType = gl.TEXTURE_3D;
		const texSizeB = 0.05;
		const texSizeE = 0.95;

		// 胴体部分
		this.Body = new fDWL.R4D.Pylams4D(
			gl,
			shader.prg,
			[ 0, 0, 0, 0 ],			// pos
			this.rot.concat(),									// rotate
			[ WalkerBody_SCALE, WalkerBody_SCALE, WalkerBody_SCALE, WalkerBody_SCALE ],
			[ // Vertice
				-0.5, 0.5,  0.5,  0.5,   0.5, 0.5,  0.5,  0.5,   -0.5, -0.5,  0.5,  0.5,    0.5, -0.5,  0.5,  0.5,
				 0.5, 0.5, -0.5,  0.5,  -0.5, 0.5, -0.5,  0.5,    0.5, -0.5, -0.5,  0.5,   -0.5, -0.5, -0.5,  0.5,
				-0.5, 0.5,  0.5, -0.5,   0.5, 0.5,  0.5, -0.5,   -0.5, -0.5,  0.5, -0.5,    0.5, -0.5,  0.5, -0.5,
				 0.5, 0.5, -0.5, -0.5,  -0.5, 0.5, -0.5, -0.5,    0.5, -0.5, -0.5, -0.5,   -0.5, -0.5, -0.5, -0.5
			],
			// color
			[ 192, 192, 192, 255 ],
			// center
			[ 0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
				0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0 ],
			[	// index of Pylamids
/**/
				0, 1, 2, 5,  1, 2, 3, 6,   4, 5, 6, 1,   5, 6, 7, 2,   1, 2, 5, 6,		// こっち(h=+1)
				8, 9,10,13,  9,10,11,14,  12,13,14, 9,  13,14,15,10,   9,10,13,14,		// あっち(h=-1)
/**/
				9, 1,11,12,  1,11, 3, 6,   4,12, 6, 1,  11, 6,12,14,   1,11, 6,12,		// 右(X=+1)
				0, 8, 2, 5,  8, 2,10,15,   5,13,15, 8,  5, 7,15, 2,   2, 8, 5,15,		// 左(X=-1)
/**/
				0, 1, 8, 5,  1, 8, 9,12,   5, 4,12, 1,   5,12,13, 8,   1, 8, 5,12,		// 上(Y=+1)
				2,10,11,15,  2, 3,11, 6,  15,14, 6,11,  15, 6, 7, 2,   2,11, 6,15,		// 下(Y=-1)
/**/
				0, 1, 2, 8,  1, 2, 3,11,   8, 9,11, 1,   8,11,10, 2,   1, 2, 8,11,		// 手前(Z=+1)
				13,12,15, 5, 12,15,14, 6,   5, 4, 6,12,   5, 6, 7,15,  12,15, 5, 6		// 奥(Z=-1)
/**/
			],
			[	// texPos
//				0.0, 1.0, 1.0,  1.0, 1.0, 1.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0,
//				1.0, 1.0, 0.0,  0.0, 1.0, 0.0,  1.0, 0.0, 0.0,  0.0, 0.0, 0.0
				texSizeB, texSizeE, texSizeE,  texSizeE, texSizeE, texSizeE,  texSizeB, texSizeB, texSizeE,  texSizeE, texSizeB, texSizeE,
				texSizeE, texSizeE, texSizeB,  texSizeB, texSizeE, texSizeB,  texSizeE, texSizeB, texSizeB,  texSizeB, texSizeB, texSizeB
			],
			[	// texIdx corespodent with index of Pyramids
/**/
				0,1,2,5,  1,2,3,6,  4,5,6,1,  5,6,7,2,  1,2,5,6,
				0,1,2,5,  1,2,3,6,  4,5,6,1,  5,6,7,2,  1,2,5,6,
/**/
				1,0,3,4,  0,3,2,7,  5,4,7,0,  3,7,4,6,  0,3,7,4,
				1,0,3,4,  0,3,2,7,  4,6,7,3,  4,5,7,0,  3,0,4,7,
/**/
				0,1,2,5,  1,2,3,6,  5,4,6,1,  5,6,7,2,  1,2,5,6,
				2,0,1,5,  2,3,1,6,  5,4,6,1,  5,6,7,2,  2,1,6,5,
/**/
				0,1,2,5,  1,2,3,6,  5,4,6,1,  5,6,7,2,  1,2,5,6,
				0,1,2,5,  1,2,3,6,  5,4,6,1,  5,6,7,2,  1,2,5,6
/**/
			],
			// Texture Object
			texObj,
			[	// chrnIdx: 各四面体ごとに重心位置を指定
				0,0,0,0,0
			],
			[	// centIdx
				0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0,
				0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0
			],
			[	// color index of pylamid
				0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 
				0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0
			],
			[ 0, 0, 0, 0 ],				// offs: vertex生成時位置オフセット
			[ 0, 0, 0, 0, 0, 0 ]		// rot:  vertex生成時回転
		);
		this.Body.walk = function( pos, rot ){
			this.setPos( pos );
			this.setRotate( rot );
		}
		this.BodyPlace = [ 0,0,0,0 ];	// 基準位置
		this.BodyPos = [ 0,0,0,0 ];		// ローカル座標変換結果
		this.Body.resetPos = function( param ){
			this.setPos( param.pos );
			this.setRotate( param.rotate );
		}
		
		this.resetParam = {};
	}
	
	ReCube.prototype = {
		initParts:	function( primBuffer ){
			// シェーディングルーチン選択
			this.Body.setTriangle = this.Body.setTriangleFlat;
			this.Body.setTriangleTex = this.Body.setTriangleFlatTex;
			this.Body.getNormal = this.Body.getNormalPlane;
			this.Body.getColor = this.Body.getColorPlane;
			// 初期化変換
			this.Body.transform();
			this.Body.setTriBuffer( primBuffer );
		},
		
		// 位置・角度等再設定
		resetPos:	function(){
			this.pos = this.resetParam.pos;
			this.rot = this.resetParam.rotate;
			this.Body.resetPos( this.resetParam );
			this.Head.resetPos( this.resetParam );
			this.Face.resetPos( this.resetParam );
			this.brain.resetPos();
			for( let idx = 0; idx < LEG_NUM; ++idx ){
				this.Legs[idx].resetPos( this.resetParam );
			}
			//this.isReset = this.resetParam.isReset;
		},
		isReset:	function(){
			return false;
		},
		setIsReset:	function( resetFunc ){
			this.isReset = resetFunc;
		},
		setResetParam: function( param ){
			this.resetParam = param;
		},
		
		setRotate:	function( rotate ){
			this.rot = rotate;
		},
		getRotate: function(){
			return this.rot.concat();
		},
		getPos:	function(){
			return this.pos.concat();
		},
		
		calcRotMtx:	function(){
			// ローカル変換行列の作成
			let mx4Rots = [
					new fDWL.R4D.Matrix4(),
					new fDWL.R4D.Matrix4(),
					new fDWL.R4D.Matrix4(),
					new fDWL.R4D.Matrix4(),
					new fDWL.R4D.Matrix4(),
					new fDWL.R4D.Matrix4()
				];
			for( let idx = 0; idx < 6; ++idx ){
				mx4Rots[idx].makeRot( idx, this.rot[idx] );
			}
			let mx4Scale = new fDWL.R4D.Matrix4();
			mx4Scale.makeScale( this.scale );
			// 各Matrixの合成
			this.localMtx = mx4Scale.
					mul( mx4Rots[5] ).
					mul( mx4Rots[4] ).
					mul( mx4Rots[3] ).
					mul( mx4Rots[2] ).
					mul( mx4Rots[1] ).
					mul( mx4Rots[0] );
		},
		
		walk:	function( speed ){
			
			// 変換行列作成
			this.calcRotMtx();
			
			// 各ローカル基準点の変換
			this.BodyPos = this.localMtx.mulVec( this.BodyPlace[0], this.BodyPlace[1], this.BodyPlace[2], this.BodyPlace[3] );	
			this.Body.walk( fDWL.add4D( this.pos, this.BodyPos ), this.rot );
		},
		
		draw:	function( isTex, isRedraw, hPos, viewProjMtx, shaderParam ){
			if( isRedraw ){
				this.Body.transform();
				this.Body.dividePylams( hPos, isTex );
			}
		}
	}
	
	let Cube = new ReCube( gl, [ 0,1.2,0,Phoenix_OffsH ], [ 0,0,0,0,0,0 ], texShader, tex3DObj );
	Cube.initParts( TriBuffer );
	
	Cube.setResetParam({
		pos:	[ 0,1.2,0,Phoenix_OffsH ],
		rotate:	[ 0,0,0,0,0,0 ],
		isReset: function(){
			
			return false;
		}
	});
	Cube.setIsReset( function( isReset ){
		
		return isReset;
	});
	
	// テクスチャ無し地面
	EquinoxFloor.Data = fDWL.tiledFloor( 1.0, 16, [0.01, 0.01, 0.01, 1.0], [1.0, 1.0, 1.0, 1.0 ] );
	EquinoxFloor.VboList = [
		fDWL.WGL.createVbo( gl, EquinoxFloor.Data.p ),
		fDWL.WGL.createVbo( gl, EquinoxFloor.Data.n ),
		fDWL.WGL.createVbo( gl, EquinoxFloor.Data.c )
	];
	EquinoxFloor.Ibo = fDWL.WGL.createIbo( gl, EquinoxFloor.Data.i );
	
	// 注視点表示
	(function(){
		"use strict";
		var data = [],
			dataType = [ gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLE_FAN ];
		data[0] = fDWL.cylinder( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0],  [ 0, 0, 0 ], [ 0, 0, Math.PI/2 ] );
		data[1] = fDWL.corn( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0], 1.0, [ 0,  0.1, 0 ], [ 0, 0, Math.PI/2 ] );
		data[2] = fDWL.corn( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0], 1.0, [ 0,  0.1, 0 ], [ 0, 0, Math.PI*3/2 ] );
		Roller = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
		Roller.height = 0.5;
	}());
	
	// ビューxプロジェクション座標変換行列
	mat4.lookAt( views.eyePosition, views.lookAt, [0, 1, 0], viewMatrix);
	mat4.perspective(45, cnvs.width / cnvs.height, 0.1, 100, projMatrix);
	mat4.multiply(projMatrix, viewMatrix, vepMatrix);
    
	// Depth Test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	// cntrls
	cntrls.nbrOfFramesForFps = 0;
	cntrls.prevFrameTimeStamp = Date.now();
	cntrls.fpsCounter = document.getElementById("fps");

	cntrls.eHPos = document.getElementById('H_Pos');
	cntrls.eHPosBox = document.getElementById('H_PosTxt');
	
	cntrls.RotXY = document.getElementById('RotXY');
	cntrls.RotYZ = document.getElementById('RotYZ');
	cntrls.RotYH = document.getElementById('RotYH');
	cntrls.RotZH = document.getElementById('RotZH');
	cntrls.RotXH = document.getElementById('RotXH');
	cntrls.RotXZ = document.getElementById('RotXZ');
	cntrls.Dist = document.getElementById('Dist');
	
	cntrls.RotXYTxt = document.getElementById('RotXYTxt');
	cntrls.RotYZTxt = document.getElementById('RotYZTxt');
	cntrls.RotYHTxt = document.getElementById('RotYHTxt');
	cntrls.RotZHTxt = document.getElementById('RotZHTxt');
	cntrls.RotXHTxt = document.getElementById('RotXHTxt');
	cntrls.RotXZTxt = document.getElementById('RotXZTxt');
	cntrls.DistTxt = document.getElementById('DistTxt');
	
	cntrls.oldHPos = (-100);
	cntrls.oldHPosBox = cntrls.eHPos.value;
	
	cntrls.RotXY.old = cntrls.RotXY.value;
	cntrls.RotYZ.old = cntrls.RotYZ.value;
	cntrls.RotYH.old = cntrls.RotYH.value;
	cntrls.RotZH.old = cntrls.RotZH.value;
	cntrls.RotXH.old = cntrls.RotXH.value;
	cntrls.RotXZ.old = cntrls.RotXZ.value;
	cntrls.Dist.old = cntrls.Dist.value;
	
	cntrls.RotXYTxt.old = cntrls.RotXY.value;
	cntrls.RotYZTxt.old = cntrls.RotYZ.value;
	cntrls.RotYHTxt.old = cntrls.RotYH.value;
	cntrls.RotZHTxt.old = cntrls.RotZH.value;
	cntrls.RotXHTxt.old = cntrls.RotXH.value;
	cntrls.RotXZTxt.old = cntrls.RotXZ.value;
	cntrls.DistTxt.old = cntrls.DistTxt.value;
	
	cntrls.wkrPos = [ 0,0,0,0 ];
	
	// チェック用
	cntrls.RotXY.value = 100;
	cntrls.RotYZ.value = 256;
	
	
	draw();
	
	// 恒常ループ
	function draw(){
		"use strict";
		var	hPos = 0,
			isTex = true,
			currentTime = 0;
		
		// 現在のフレーム数を表示
		cntrls.requestId = requestAnimationFrame( draw );
		currentTime = Date.now();
		if( currentTime - cntrls.prevFrameTimeStamp >= 1000 ){
			cntrls.fpsCounter.innerHTML = cntrls.nbrOfFramesForFps;
			cntrls.nbrOfFramesForFps = 0;
			cntrls.prevFrameTimeStamp = currentTime;
		}
		
/**/
		// キー入力から移動速度・進行方向・視点位置を修正
		(function(){
			if( keyStatus[5] ){
				speed *= 2;
			}
			moveXZ.vel = 0.0;
			
			// 移動偏差
			var sinRot = Math.sin( moveXZ.rot ),
				cosRot = Math.cos( moveXZ.rot );
			moveXZ.dif[0] = -sinRot*moveXZ.vel;
			moveXZ.dif[1] =  cosRot*moveXZ.vel;
			// 衝突判定による位置調整を行う
			checkCollision( views.lookAt, moveXZ );
			views.lookAt[0] += moveXZ.dif[0];
			views.lookAt[1] = views.height;
			views.lookAt[2] += moveXZ.dif[1];
			// 視点位置
			views.eyePosition[0] = views.lookAt[0] + sinRot*SIGHT_LENGTH;
			views.eyePosition[1] = views.lookAt[1] +        SIGHT_HEIGHT - views.height;
			views.eyePosition[2] = views.lookAt[2] - cosRot*SIGHT_LENGTH;
			
			// 視点行列を算出
			mat4.lookAt( views.eyePosition, views.lookAt, [0, 1, 0], viewMatrix);
			mat4.multiply( projMatrix, viewMatrix, vepMatrix );
		}());
/**/
		// 視点調整：Walkerの方を向く
		(function(){
			const posW = Cube.getPos();
			views.lookAt[0] = posW[0];
			views.lookAt[1] = views.height;
			views.lookAt[2] = posW[2];
			// 視点調整：Walkerとの距離を離されない
			let distV = Math.sqrt(
						(posW[0]-views.eyePosition[0])*(posW[0]-views.eyePosition[0])+
						(posW[2]-views.eyePosition[2])*(posW[2]-views.eyePosition[2])
			);
			const stdDist = 10;	// 基準距離
			if( distV > stdDist ){
				let rate = 1-stdDist/distV;
				views.eyePosition[0] += (posW[0]-views.eyePosition[0])*rate;
				views.eyePosition[2] += (posW[2]-views.eyePosition[2])*rate;
			}
			
			// 視点行列を算出
			mat4.lookAt( views.eyePosition, views.lookAt, [0, 1, 0], viewMatrix);
			mat4.multiply( projMatrix, viewMatrix, vepMatrix );
		}());
/**/
		
		// 入力ボックス：変更適用
//		let isRedraw = false;
		let isRedraw = true;
		if( cntrls.eHPos.value !== cntrls.oldHPos ){
			cntrls.eHPosBox.value = cntrls.eHPos.value;
		}else
		if( cntrls.eHPosBox.value !== cntrls.oldHPosBox ){
			cntrls.eHPos.value = cntrls.eHPosBox.value;
		}
		if( cntrls.RotXY.old !== cntrls.RotXY.value ){
			cntrls.RotXYTxt.value = cntrls.RotXY.value;
		}else
		if( cntrls.RotXYTxt.old !== cntrls.RotXYTxt.value ){
			cntrls.RotXY.value = cntrls.RotXYTxt.value;
		}
		if( cntrls.RotYZ.old !== cntrls.RotYZ.value ){
			cntrls.RotYZTxt.value = cntrls.RotYZ.value;
		}else
		if( cntrls.RotYZTxt.old !== cntrls.RotYZTxt.value ){
			cntrls.RotYZ.value = cntrls.RotYZTxt.value;
		}
		if( cntrls.RotYH.old !== cntrls.RotYH.value ){
			cntrls.RotYHTxt.value = cntrls.RotYH.value;
		}else
		if( cntrls.RotYHTxt.old !== cntrls.RotYHTxt.value ){
			cntrls.RotYH.value = cntrls.RotYHTxt.value;
		}
		if( cntrls.RotZH.old !== cntrls.RotZH.value ){
			cntrls.RotZHTxt.value = cntrls.RotZH.value;
		}else
		if( cntrls.RotZHTxt.old !== cntrls.RotZHTxt.value ){
			cntrls.RotZH.value = cntrls.RotZHTxt.value;
		}
		if( cntrls.RotXH.old !== cntrls.RotXH.value ){
			cntrls.RotXHTxt.value = cntrls.RotXH.value;
		}else
		if( cntrls.RotXHTxt.old !== cntrls.RotXHTxt.value ){
			cntrls.RotXH.value = cntrls.RotXHTxt.value;
		}
		if( cntrls.RotXZ.old !== cntrls.RotXZ.value ){
			cntrls.RotXZTxt.value = cntrls.RotXZ.value;
		}else
		if( cntrls.RotXZTxt.old !== cntrls.RotXZTxt.value ){
			cntrls.RotXZ.value = cntrls.RotXZTxt.value;
		}
		if( cntrls.Dist.old !== cntrls.Dist.value ){
			isRedraw = true;
			cntrls.DistTxt.value = cntrls.Dist.value;
		}else
		if( cntrls.DistTxt.old !== cntrls.DistTxt.value ){
			isRedraw = true;
			cntrls.Dist.value = cntrls.DistTxt.value;
		}
		
		// H軸位置設定
		hPos = cntrls.eHPos.value*(0.01)+0.01;
		
		// 真４Ｄオブジェクトの更新：非移動時のみ
		if( ( cntrls.RotXY.old !== cntrls.RotXY.value )||
			( cntrls.RotYZ.old !== cntrls.RotYZ.value )||
			( cntrls.RotYH.old !== cntrls.RotYH.value )||
			( cntrls.RotZH.old !== cntrls.RotZH.value )||
			( cntrls.RotXH.old !== cntrls.RotXH.value )||
			( cntrls.RotXZ.old !== cntrls.RotXZ.value )
		){
			cntrls.oldHPos = (-100);
		}
		// 現在値記録
		cntrls.oldHPosBox = cntrls.eHPosBox.value;
		cntrls.RotXY.old = cntrls.RotXY.value;
		cntrls.RotYZ.old = cntrls.RotYZ.value;
		cntrls.RotYH.old = cntrls.RotYH.value;
		cntrls.RotZH.old = cntrls.RotZH.value;
		cntrls.RotXH.old = cntrls.RotXH.value;
		cntrls.RotXZ.old = cntrls.RotXZ.value;
		cntrls.Dist.old = cntrls.Dist.value;
		cntrls.RotXYTxt.old = cntrls.RotXYTxt.value;
		cntrls.RotYZTxt.old = cntrls.RotYZTxt.value;
		cntrls.RotYHTxt.old = cntrls.RotYHTxt.value;
		cntrls.RotZHTxt.old = cntrls.RotZHTxt.value;
		cntrls.RotXHTxt.old = cntrls.RotXHTxt.value;
		cntrls.RotXZTxt.old = cntrls.RotXZTxt.value;
		cntrls.DistTxt.old = cntrls.DistTxt.value;
		if(( moveXZ.vel != 0 )||( cntrls.oldHPos != cntrls.eHPos.value )){
			isRedraw = true;
		}
		// 現hPos値の記録
		cntrls.oldHPos = cntrls.eHPos.value;
		
		// canvasを初期化
		gl.clearColor(0.8, 0.8, 1.0, 1.0);
		gl.clearDepth( 1.0 );
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		
		// ビューポート調整
		gl.viewport( 0.0, 0.0, cnvs.width, cnvs.height );
		
		gl.enable(gl.CULL_FACE);
		
/**/
		// 地面
		(function(){
			"use strict";
			var vbo = [],
				attL = [],
				attS = [];
			// Walkerに合わせて位置補正
			const posWk = Cube.getPos();
			floorPos[0] = Math.floor( posWk[0]/2 )*2;
			floorPos[2] = Math.floor( posWk[2]/2 )*2;
			
			mat4.identity( modelMatrix );
			mat4.translate( modelMatrix, floorPos, modelMatrix );
			mat4.multiply( vepMatrix, modelMatrix, mvpMatrix );
			mat4.inverse( modelMatrix, invMatrix);
			triangleShader.setProgram( [ modelMatrix, mvpMatrix, invMatrix, light00.position, views.eyePosition, light00.ambient ] );
			
			vbo = EquinoxFloor.VboList;
			attL = triangleShader.attrLoc;
			attS = triangleShader.attrStride;
			for( var idx in vbo ){
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo[idx]);
				gl.enableVertexAttribArray(attL[idx]);
				gl.vertexAttribPointer(attL[idx], attS[idx], gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, EquinoxFloor.Ibo );
			gl.drawElements( gl.TRIANGLES, EquinoxFloor.Data.i.length, gl.UNSIGNED_SHORT, 0 );
		}());
		
		// LegBrain
		let isReset = false;
		keyBackup = keyStatus.concat();
		
		let rotWalker = [
			cntrls.RotXY.value/100,
			cntrls.RotYZ.value/100,
			cntrls.RotYH.value/100,
			cntrls.RotZH.value/100,
			cntrls.RotXZ.value/100,
			cntrls.RotXH.value/100
		];
		
		if( Cube.isReset( isReset ) ){
			Cube.resetPos();
			views.eyePosition = [ 0,  SIGHT_HEIGHT, SIGHT_LENGTH*2 ];
			views.lookAt = [ 0, 0, -4 ];
			return;
		}

		Cube.setRotate( rotWalker );
		if(( cntrls.wkrPos[0] !== Cube.pos[0] )||( cntrls.wkrPos[1] !== Cube.pos[1] )||( cntrls.wkrPos[2] !== Cube.pos[2] )||( cntrls.wkrPos[3] !== Cube.pos[3] )){
			isRedraw = true;
			cntrls.wkrPos = Cube.pos.concat();
		}
		Cube.walk( 0.01 );	// APIは仮
		if( isRedraw ){
			// 八胞体切断体の作成
			TriBuffer.initialize( texShader );
		}
		Cube.draw( isTex, isRedraw, hPos, vepMatrix, [ 0, 0, 0, light00.position, views.eyePosition, light00.ambient ] );
		
		// 三角バッファの描画
		gl.disable(gl.CULL_FACE);
		if(isTex){
			TriBuffer.useProgram( texShader );
		}else{
			TriBuffer.useProgram( triangleShader );
		}
		mat4.identity( modelMatrix );
		mat4.inverse( modelMatrix, invMatrix);
		mat4.multiply( vepMatrix, modelMatrix, mvpMatrix );
		if(isTex){
			texShader.setUniLoc(
				mvpMatrix, invMatrix, light00.position, views.eyePosition, light00.ambient
			);
		}else{
			triangleShader.setUniLoc(
				mvpMatrix, invMatrix, light00.position, views.eyePosition, light00.ambient
			);
		}
		TriBuffer.draw();
		
		// コンテキストの再描画
		gl.flush();
		
		cntrls.nbrOfFramesForFps++;
	}
	
	// 衝突判定による位置調整を行う
	function checkCollision( viewPos, moveXZ ){
		"use strict";
		var pos = [];
		
		pos[0] = viewPos[0]+moveXZ.dif[0];	// 
		pos[2] = viewPos[2]+moveXZ.dif[1];	// 移動先で判定
		
		if(( pos[0] < -8 )||( 8 < pos[0] )){
			moveXZ.dif[0] = 0;
		}
		if(( pos[2] < -8 )||( 8 < pos[2] )){
			moveXZ.dif[1] = 0;
		}
	};
	
	// プログラムオブジェクトとシェーダを生成しリンクする関数
	function createShaderProgram( gl, vsId, fsId ){
		"use strict";
		let shader = [],
			scriptElement = [ document.getElementById(vsId), document.getElementById(fsId) ];
		
		if(( !scriptElement[0] )||( !scriptElement[1] )){
			return;
		}
		if(( scriptElement[0].type === 'x-shader/x-vertex' )&&( scriptElement[1].type === 'x-shader/x-fragment' )){
			shader[0] = gl.createShader(gl.VERTEX_SHADER);
			shader[1] = gl.createShader(gl.FRAGMENT_SHADER);
		}else{
			return;
		}
		for( let cnt = 0; cnt < 2; ++cnt ){
			gl.shaderSource(shader[cnt], scriptElement[cnt].text);
			gl.compileShader(shader[cnt]);
			if( !gl.getShaderParameter(shader[cnt], gl.COMPILE_STATUS) ){
				alert(gl.getShaderInfoLog(shader[cnt]));
				return;
			}
		}
		
		let program = gl.createProgram();
		gl.attachShader(program, shader[0]);
		gl.attachShader(program, shader[1]);
		gl.linkProgram(program);
		if( gl.getProgramParameter( program, gl.LINK_STATUS ) ){
			gl.useProgram(program);
			return program;
		}else{
			alert(gl.getProgramInfoLog(program));
			return;
		}
	};
	
	
	// ブラウザごとのキーイベント名称を取得
	function getKeyEventNames( browserInfo ){
		"use strict";
		let info = {
			up:		"ArrowUp",
			down:	"ArrowDown",
			left:	"ArrowLeft",
			right:	"ArrowRight",
			shift:	"Shift",
			ctrl:	"Control",
			space:	" ",
			keyB:	"b",
			keyF:	"f",
			keyG:	"g",
			keyP:	"p",
			keyR:	"r",
		};
		
		if( browserInfo[0] === "Microsoft Edge" ){
			info.up = "Up";
			info.down = "Down";
			info.left = "Left";
			info.right = "Right";
		}
		
		return info;
	};
};




