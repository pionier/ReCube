//============================================================
// 4D Library
//------------------------------------------------------------------
// Minimized for modelbasis
//------------------------------------------------------------------
var fDWL = fDWL||{};

fDWL.namespace = function(ns_string){
	"use strict";
	let	parts = ns_string.split('.'),
		parent = fDWL;

	if( parts[0] === "fDWL" ){
		parts = parts.slice(1);
	}

	for( let idx = 0; idx < parts.length; ++idx ){
		if( typeof parent[ parts[idx] ] === 'undefined' ){
			parent[ parts[idx] ] = {};
		}
		parent = parent[ parts[idx] ];
	}
	return parent;
};
fDWL.namespace( 'fDWL.R4D' );
fDWL.namespace( 'fDWL.WGL' );
fDWL.namespace( 'fDWL.D4D' );

//==================================================================
fDWL.R4D.TriangleBuffer = function( gl, vtxNum ){
	"use strict";
	this.gl = gl;
	this.vtxNum = vtxNum;
	this.triangleVertexBuffer = gl.createBuffer();
	
	this.vertexSizeInByte = 2*3*Float32Array.BYTES_PER_ELEMENT + 4*Uint8Array.BYTES_PER_ELEMENT;	// vertex + normal
	this.vetexSizeInFloats = this.vertexSizeInByte / Float32Array.BYTES_PER_ELEMENT;
	
	this.vertexTexSizeInByte = 3*3*Float32Array.BYTES_PER_ELEMENT + 4*Uint8Array.BYTES_PER_ELEMENT;
	this.vertexTexSizeInFloats = this.vertexTexSizeInByte / Float32Array.BYTES_PER_ELEMENT;

	this.positionOffsetInFloats = 0;		// Position Counter
	this.colorOffsetInBytes = 24;			// Color position Counter
	this.numberOfItems = 0;
};

fDWL.R4D.TriangleBuffer.prototype = {
	
	// Use Program
	useProgram: function( shader ){
		"use strict";
		const gl = this.gl;
		gl.bindBuffer( gl.ARRAY_BUFFER, this.triangleVertexBuffer );
		gl.vertexAttribPointer( shader.attrLoc[0], shader.attrStride[0], gl.FLOAT, false, 40, 0 );
		gl.vertexAttribPointer( shader.attrLoc[1], shader.attrStride[1], gl.FLOAT, false, 40, 12 );
		gl.vertexAttribPointer( shader.attrLoc[2], shader.attrStride[2], gl.UNSIGNED_BYTE, true, 40, 24 );
		gl.vertexAttribPointer( shader.attrLoc[3], shader.attrStride[3], gl.FLOAT, false, 40, 28 );
		
		gl.useProgram( shader.prg );
	},
	// initialize
	initialize: function( shader ){
		"use strict";
		this.itrLvdBuffer = new ArrayBuffer( this.vtxNum * this.vertexSizeInByte );
		this.positionView = new Float32Array( this.itrLvdBuffer );
		this.colorView = new Uint8Array( this.itrLvdBuffer );
		
		this.numberOfItems = 0;					// Number of Vertex to draw
		this.positionOffsetInFloats = 0;		// Position Counter
		this.colorOffsetInBytes = 24;			// Color position Counter
		this.texOffsetInBytes = this.colorOffsetInBytes+4*Uint8Array.BYTES_PER_ELEMENT;
	},
	
	// 三角形を描画バッファに登録
	setTriangle: function( vtx0, vtx1, vtx2  ){
		"use strict";
		const	pV = this.positionView,
				cV = this.colorView,
				vtx = [ vtx0, vtx1, vtx2 ];
		let pOffs = this.positionOffsetInFloats,
			cOffs = this.colorOffsetInBytes;
		
		for( let cnt = 0; cnt < 3; ++cnt ){
			
			pV[pOffs  ] = vtx[cnt][0];
			pV[pOffs+1] = vtx[cnt][1];
			pV[pOffs+2] = vtx[cnt][2];
			pV[pOffs+3] = vtx[cnt][3];
			pV[pOffs+4] = vtx[cnt][4];
			pV[pOffs+5] = vtx[cnt][5];
			cV[cOffs  ] = vtx[cnt][6];
			cV[cOffs+1] = vtx[cnt][7];
			cV[cOffs+2] = vtx[cnt][8];
			cV[cOffs+3] = vtx[cnt][9];
			
			pOffs += this.vetexSizeInFloats;
			cOffs += this.vertexSizeInByte;
		}
		this.numberOfItems += 3;
		this.positionOffsetInFloats = pOffs;
		this.colorOffsetInBytes = cOffs;
	},

	// 三角形を描画バッファに登録：テクスチャ付き
	setTriangleTex: function( vtx0, vtx1, vtx2  ){
		"use strict";
		const	pV = this.positionView,
				cV = this.colorView,
				vtx = [ vtx0, vtx1, vtx2 ];
		let pOffs = this.positionOffsetInFloats,
			cOffs = this.colorOffsetInBytes;
		
		for( let cnt = 0; cnt < 3; ++cnt ){
			
			pV[pOffs  ] = vtx[cnt][0];
			pV[pOffs+1] = vtx[cnt][1];
			pV[pOffs+2] = vtx[cnt][2];
			pV[pOffs+3] = vtx[cnt][3];
			pV[pOffs+4] = vtx[cnt][4];
			pV[pOffs+5] = vtx[cnt][5];
			cV[cOffs  ] = vtx[cnt][6];
			cV[cOffs+1] = vtx[cnt][7];
			cV[cOffs+2] = vtx[cnt][8];
			cV[cOffs+3] = vtx[cnt][9];
			pV[pOffs+7] = vtx[cnt][10];
			pV[pOffs+8] = vtx[cnt][11];
			pV[pOffs+9] = vtx[cnt][12];
			
			pOffs += this.vertexTexSizeInFloats;
			cOffs += this.vertexTexSizeInByte;
		}
		this.numberOfItems += 3;
		this.positionOffsetInFloats = pOffs;
		this.colorOffsetInBytes = cOffs;
	},

	draw: function(){
		"use strict";
		if( this.numberOfItems != 0 ){
			this.gl.bufferData( this.gl.ARRAY_BUFFER, this.itrLvdBuffer, this.gl.STATIC_DRAW );
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.triangleVertexBuffer );
			this.gl.drawArrays( this.gl.TRIANGLES, 0, this.numberOfItems );
		}
	}
};


//==================================================================
// Matrix4
// ４次行列を生成
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Cube4:											// 立方体8個、インデックス形式
//
//==================================================================
fDWL.R4D.Matrix4 = function(){
	"use strict";
	this.aa = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
};

fDWL.R4D.Matrix4.prototype = {
	//------------------------------------------------------------------
	//	和
	//------------------------------------------------------------------
	add: function( rMtx ){
		"use strict";
		for( let idx = 0; idx < 16; ++idx ){
			this.aa[idx] += rMtx[idx];
		}
		return this;
	},
	//------------------------------------------------------------------
	//	積
	//------------------------------------------------------------------
	mul: function( rMtx ){
		"use strict";
		let clm = 0,
			row = 0,
			tmpMtx = [];
		
		for( let idx = 0; idx < 16; ++idx ){
			row = Math.floor(idx/4)*4;
			clm = idx%4;
			
			tmpMtx[idx] = this.aa[row+0]*rMtx.aa[clm+0] + this.aa[row+1]*rMtx.aa[clm+4] +
								this.aa[row+2]*rMtx.aa[clm+8] +this.aa[row+3]*rMtx.aa[clm+12];
		}
		for( let idx = 0; idx < 16; ++idx ){
			this.aa[idx] = tmpMtx[idx];
		}
		return this;
	},
	//------------------------------------------------------------------
	//	スケール行列生成
	//------------------------------------------------------------------
	makeScale: function( scale ){
		"use strict";
		this.aa = [
			scale[0],      0.0,      0.0,      0.0,
			     0.0, scale[1],      0.0,      0.0,
			     0.0,      0.0, scale[2],      0.0,
			     0.0,      0.0,      0.0, scale[3]
		];
		return this;
	},
	//------------------------------------------------------------------
	//	回転行列生成
	//------------------------------------------------------------------
	makeRot: function( axis, angle ){
		"use strict";
		const sinX = Math.sin(angle),
			  cosX = Math.cos(angle);
		
		this.aa = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0
		];
		switch( axis ){
		case 0:		// XY
			this.aa[0] = this.aa[5] = cosX;
			this.aa[1] = -sinX;
			this.aa[4] = sinX;
			break;
		case 1:		// YZ
			this.aa[5] = this.aa[10] = cosX;
			this.aa[6] = -sinX;
			this.aa[9] = sinX;
			break;
		case 2:		// YH
			this.aa[5] = this.aa[15] = cosX;
			this.aa[7] = -sinX;
			this.aa[13] = sinX;
			break;
		case 3:		// ZH
			this.aa[10] = this.aa[15] = cosX;
			this.aa[11] = -sinX;
			this.aa[14] = sinX;
			break;
		case 4:		// XZ
			this.aa[0] = this.aa[10] = cosX;
			this.aa[2] = -sinX;
			this.aa[8] = sinX;
			break;
		case 5:		// XH
			this.aa[0] = this.aa[15] = cosX;
			this.aa[3] = -sinX;
			this.aa[12] = sinX;
			break;
		default:
			break;
		}
		return this;
	},
	//------------------------------------------------------------------
	//	ベクトルとの積
	//------------------------------------------------------------------
	mulVec:	function( x, y, z, h ){
		"use strict";
		const
		xx = this.aa[ 0]*x + this.aa[ 1]*y + this.aa[ 2]*z + this.aa[ 3]*h,
		yy = this.aa[ 4]*x + this.aa[ 5]*y + this.aa[ 6]*z + this.aa[ 7]*h,
		zz = this.aa[ 8]*x + this.aa[ 9]*y + this.aa[10]*z + this.aa[11]*h,
		hh = this.aa[12]*x + this.aa[13]*y + this.aa[14]*z + this.aa[15]*h;
		return [ xx, yy, zz, hh ];
	}
};

//==================================================================
// affine4D
// ４次元アフィン変換
//------------------------------------------------------------------
//
//	src:		// 頂点、( x, y, z, h )x数
//	rotate:		// ローカル座標系での回転
//	offs:		// ローカス座標系での位置オフセット
//	scale:		// 各方向のスケール、省略時は全要素1
//
//==================================================================
fDWL.R4D.affine4D = function( src, rotate, offs, scale ){
		"use strict";
	let mx4Scale = new fDWL.R4D.Matrix4(),
		mx4Rotate,
		mx4Rots = [
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4(),
			new fDWL.R4D.Matrix4()
		],
		vec4 = [ 0.0, 0.0, 0.0, 0.0 ],
		dst = [];
	
	// 各Matrixの生成
	if( scale === undefined ){
		scale = [ 1,1,1,1 ];
	}
	mx4Scale.makeScale( scale );
	for( let idx = 0; idx < 6; ++idx ){
		mx4Rots[idx].makeRot( idx, rotate[idx]);
	}
	// 各Matrixの合成
	mx4Rotate = mx4Scale.
			mul( mx4Rots[5] ).
			mul( mx4Rots[4] ).
			mul( mx4Rots[3] ).
			mul( mx4Rots[2] ).
			mul( mx4Rots[1] ).
			mul( mx4Rots[0] );
	
	// 各頂点のaffine変換
	for( let idx = 0; idx < src.length; idx += 4 ){
		vec4 = mx4Rotate.mulVec( src[idx], src[idx+1], src[idx+2], src[idx+3] );
		dst.push( vec4[0]+offs[0], vec4[1]+offs[1], vec4[2]+offs[2], vec4[3]+offs[3] );
	}
	
	return dst;
};

//==================================================================
// inProd4D
// 四次元ベクトルの内積を計算
//------------------------------------------------------------------
//------------------------------------------------------------------
fDWL.inProd4D = function( vec0, vec1 ){
	"use strict";
	return ( vec0[0]*vec1[0] + vec0[1]*vec1[1] + vec0[2]*vec1[2] + vec0[3]*vec1[3] );
}

//==================================================================
// add4D
// 四次元ベクトルの単純和を計算
//------------------------------------------------------------------
fDWL.add4D = function( vec0, vec1 ){
	"use strict";
	return [ vec0[0]+vec1[0], vec0[1]+vec1[1], vec0[2]+vec1[2], vec0[3]+vec1[3] ];
}

//==================================================================
// addArray
// 配列の単純和
//------------------------------------------------------------------
fDWL.addArray = function( array0, array1 ){
	"use strict";
	let dst, adder;
	if( array0.length <= array1.length ){
		dst = array0.concat();
		adder = array1;
	}else{
		dst = array1.concat();
		adder = array0;
	}
	for( let idx = 0; idx < dst.length; ++idx ){
		dst[idx] += adder[idx];
	}
	return dst;
}


//==================================================================
// calcNormal4D
// 四面体の法線を計算
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 4個
//	center:											// 四面体の属する図形の重心
//
//==================================================================
fDWL.R4D.calcNormal4D = function( vertice, center ){
	"use strict";
	let nor4D = [ 0,0,0,0 ],
		v0 = [ vertice[ 4]-vertice[0], vertice[ 5]-vertice[1], vertice[ 6]-vertice[2], vertice[ 7]-vertice[3] ],
		v1 = [ vertice[ 8]-vertice[0], vertice[ 9]-vertice[1], vertice[10]-vertice[2], vertice[11]-vertice[3] ],
		v2 = [ vertice[12]-vertice[0], vertice[13]-vertice[1], vertice[14]-vertice[2], vertice[15]-vertice[3] ],
		vec0 = [], vec1 = [], vec2 = [],
		vc0  = [], vc1  = [], vc2  = [],
		isEnd = false,
		sign = 0;
	
	// 前処理：体に垂直なケースを取り除く
	for( let idx = 0; idx < 4; ++idx ){
		if(( v0[idx] == 0 )&&( v1[idx] == 0 )&&( v2[idx] == 0 )){
			nor4D[idx] = 1.0;
			isEnd = true;
			break;
		}
	}
	// 本処理：ガウス・ジョルダン法
	while( !isEnd ){
		// X座標のピボットを得る
		const tmp0 = Math.abs( v0[0] ), tmp1 = Math.abs( v1[0] ), tmp2 = Math.abs( v2[0] );
		// ベクトルの並び替え
		if( tmp0 >= tmp1 ){
			if( tmp1 >= tmp2 ){
				// tmp0 >= tmp1 >= tmp2
				vec0 = v0, vec1 = v1, vec2 = v2;
			}else
			if( tmp0 >= tmp2 ){
				// tmp0 >= tmp2 >= tmp1
				vec0 = v0, vec1 = v2, vec2 = v1;
			}else{
				// tmp2 >= tmp0 >= tmp1
				vec0 = v1, vec1 = v2, vec2 = v0;
			}
		}else{
			if( tmp2 >= tmp1 ){
				// tmp0 >= tmp1 >= tmp2
				vec0 = v2, vec1 = v1, vec2 = v0;
			}else
			if( tmp0 >= tmp2 ){
				// tmp0 >= tmp2 >= tmp1
				vec0 = v0, vec1 = v2, vec2 = v1;
			}else{
				// tmp2 >= tmp0 >= tmp1
				vec0 = v2, vec1 = v0, vec2 = v1;
			}
		}
		// X座標を処理( vec[0].x = 1.0, vec[1].x = vec[2].x = 0.0 )
		vc0 = [ 1.0, vec0[1]/vec0[0], vec0[2]/vec0[0], vec0[3]/vec0[0] ];
		vc1 = [ vec1[0]-vc0[0]*vec1[0], vec1[1]-vc0[1]*vec1[0], vec1[2]-vc0[2]*vec1[0], vec1[3]-vc0[3]*vec1[0] ];
		vc2 = [ vec2[0]-vc0[0]*vec2[0], vec2[1]-vc0[1]*vec2[0], vec2[2]-vc0[2]*vec2[0], vec2[3]-vc0[3]*vec2[0] ];
		
		// Y=0.0 の例外処理
		if( vc1[1] == 0.0 ){
			if( vc1[2] == 0.0 ){
				nor4D[3] = 1.0;
			}else{
				nor4D[2] = 1.0;
			}
			break;
		}
		
		// Y座標を処理( vec[1].y = 1.0, vec[0].y = vec[2].y = 0.0 )
		vec1 = [ vc1[0]/vc1[1], 1.0, vc1[2]/vc1[1], vc1[2]/vc1[1] ];
		vec0 = [ vc0[0]-vec1[0]*vc0[1], vc0[1]-vec1[1]*vc0[1], vc0[2]-vec1[2]*vc0[1], vc0[3]-vec1[3]*vc0[1] ];
		vec2 = [ vc2[0]-vec1[0]*vc2[1], vc2[1]-vec1[1]*vc2[1], vc2[2]-vec1[2]*vc2[1], vc2[3]-vec1[3]*vc2[1] ];
		
		// Z=0.0 の例外処理
		if( vec2[2] == 0.0 ){
			nor4D[3] =1.0;
			break;
		}
		
		// Z座標を処理( vec[2].z = 1.0, vec[0].z = vec[1].z = 0.0 )
		vc2 = [ vec2[0]/vec2[2], vec2[1]/vec2[2], 1.0, vec2[3]/vec2[2] ];
		vc0 = [ vec0[0]-vc2[0]*vec0[2], vec0[1]-vc2[1]*vec0[2], vec0[2]-vc2[2]*vec0[2], vec0[3]-vc2[3]*vec0[2] ];
		vc1 = [ vec1[0]-vc2[0]*vec1[2], vec1[1]-vc2[1]*vec1[2], vec1[2]-vc2[2]*vec1[2], vec1[3]-vc2[3]*vec1[2] ];
		
		// 方向ベクトルを得る
		if( vc0[3] ){
			nor4D[0] = vc0[0]/vc0[3];
		}else{
			nor4D[0] = 0;
		}
		if( vc1[3] ){
			nor4D[1] = vc1[1]/vc1[3];
		}else{
			nor4D[1] = 0;
		}
		if( vc1[3] ){
			nor4D[2] = vc2[2]/vc2[3];
		}else{
			nor4D[2] = 0;
		}
		nor4D[3] = 1;
		
		break;
	}
	
	// 後処理：正負の方向を定める
	sign = fDWL.inProd4D( nor4D, [ vertice[0]-center[0], vertice[1]-center[1], vertice[2]-center[2], vertice[3]-center[3] ] );
	if( sign < 0 ){
		// 方向反転
		nor4D = [ nor4D[0]*(-1), nor4D[1]*(-1), nor4D[2]*(-1), nor4D[3]*(-1) ];
	}else
	if( sign == 0 ){
		// エラー
		nor4D = [ 0,0,0,0 ];
	}
	return nor4D;
};

//==================================================================
// CalcAve
// 配列の平均を計算
//------------------------------------------------------------------
//
//	elemNum:	要素数（配列の要素数）
//	itemNum:	アイテム数（平均をとるアイテムの数）
//	vertice:	頂点配列
//	vertIdx:	頂点インデックス
//
//==================================================================
fDWL.calcAve = function( elemNum, itemNum, vertice, vertIdx ){
		"use strict";
	let aveArray = [];
	
	// 要素数分の配列要素を準備
	for( let ii = 0; ii < elemNum; ++ii ){
		aveArray.push( 0 );
	}
	// 各アイテムを要素ごとに加算
	let idx = 0;
	for( let ii = 0; ii < itemNum; ++ii ){
		idx = vertIdx[ii]*elemNum;
		for( let jj = 0; jj < elemNum; ++jj ){
			aveArray[jj] += vertice[idx+jj];
		}
	}
	// アイテム数で割って平均を出す
	for( let ii = 0; ii < elemNum; ++ii ){
		aveArray[ii] /= itemNum;
	}
	return aveArray;
}

//==================================================================
// Pylams4D
// ５胞体の集合を生成
//------------------------------------------------------------------
//
//	vertex:											// 頂点、( x, y, z, h ) x 16個
//	Cube4:											// 立方体8個、インデックス形式
//
//==================================================================
fDWL.R4D.Pylams4D = function( gl, prg, pos, rotate, scale, vertex, color, center, index, texPos, texIdx, tex, chrnIdx, centIdx, colorIdx, offs, rot ){
		"use strict";
	let norms = [],
		vert = [],
		center0 = [],
		vertIdx = [],
		vId = 0;

	this.gl = gl;
	this.prg = prg;
	this.pos = pos;					// [ x, y, z, h ]
	this.rotate = rotate;			// [ xy, yz, yh, zh, xz, xh ]
	this.scale = [ 1,1,1,1 ];		// [ x, y, z, h ]：対ワールドスケールはここでは設定しない
	this.mx4Rot = new fDWL.R4D.Matrix4();
	
	// ローカル変換
	this.vertex = fDWL.R4D.affine4D( vertex, rot, offs, scale );
	this.center = fDWL.R4D.affine4D( center, rot, offs, scale );
	this.centerIndex = centIdx;
	
	/**
	// 中心配列の生成
	this.centers = [];
	for( let idx = 0; idx < chrnIdx.length; idx += 5 ){
		vertIdx = [ chrnIdx[idx], chrnIdx[idx+1], chrnIdx[idx+2], chrnIdx[idx+3], chrnIdx[idx+4] ];
		center = fDWL.calcAve( 4, 5, vertex, vertIdx );
		this.centers.push( center[0], center[1], center[2], center[3] );
	}
	/**/
	// 体の法線の算出
	this.centers = center;
	this.fieldNormal = [];
	for( let idx = 0; idx < index.length; idx += 4 ){
//		vId = idx*4;
		vId = idx;
		// 四面体
		vert = [
			vertex[index[vId  ]*4], vertex[index[vId  ]*4+1], vertex[index[vId  ]*4+2], vertex[index[vId  ]*4+3],
			vertex[index[vId+1]*4], vertex[index[vId+1]*4+1], vertex[index[vId+1]*4+2], vertex[index[vId+1]*4+3],
			vertex[index[vId+2]*4], vertex[index[vId+2]*4+1], vertex[index[vId+2]*4+2], vertex[index[vId+2]*4+3],
			vertex[index[vId+3]*4], vertex[index[vId+3]*4+1], vertex[index[vId+3]*4+2], vertex[index[vId+3]*4+3]
		];

		vertIdx = centIdx[Math.floor(idx/4)]*4;
		center0 = [ this.centers[vertIdx], this.centers[vertIdx+1], this.centers[vertIdx+2], this.centers[vertIdx+3] ];
		
		norms = fDWL.R4D.calcNormal4D( vert, center0 );
		this.fieldNormal.push( norms[0], norms[1], norms[2], norms[3] );
	}
	this.workVtx = [];
	this.workNrm = [];
	this.workCenter = [];
	this.color = color;
	this.colorIndex = colorIdx;
	this.index = index;
	this.centIdx = centIdx;
	this.triVertices = [];							// 生成三角形用バッファ
	this.triBuf = {};
	this.tex = tex;
	this.texPos = texPos;
	this.texIndex = texIdx;
};


fDWL.R4D.Pylams4D.prototype = {
	// 三角バッファの指定
	setTriBuffer: function( triBuf ){
		"use strict";
		this.triBuf = triBuf;
	},
	// 三角錐切断・三角形生成
	dividePylams: function( hPos, isTex ){
		"use strict";
		let cnt = 0,
			cutType = 0,
			iPylamid = [ 0, 0, 0, 0 ],
			maxPlmCnt = 0,
			fldCnt = 0,
			norVec,
			clrCnt = 0,
			clrVec = [ 128, 128, 128, 128 ],
			texArray = [],
			pylamArray = this.index;

		maxPlmCnt = Math.floor( pylamArray.length/4 );
		for( let plmCnt = 0; plmCnt < maxPlmCnt; plmCnt++ ){	// 三角錐ごとにチェック
			cnt = plmCnt*4;
			
			iPylamid = [ pylamArray[cnt], pylamArray[cnt+1], pylamArray[cnt+2], pylamArray[cnt+3] ];
			cutType = this.getCutType( this.workVtx, iPylamid, hPos );
			if( isTex ){
				texArray = this.makeTexArray( plmCnt, cutType );	// iPylamidとVertexBufから逆算してTexIndexを求め、テクスチャ配列を得る
			}
			
			if( plmCnt == 46 ){
				clrCnt = 1;
			}else
			if( plmCnt == 47 ){
				clrCnt = 2;
			}
			// 色を取得
			clrVec = this.getColor( plmCnt );
			// 法線設定
			norVec = this.getNormal( plmCnt );
			
			switch( cutType[0] ){
			default:
			case 0:	// ０～２包含／交差なし
				// 処理もなし
				break;
			case 1:	// 包含なし／１点交差（最標準パターン）
				if(isTex){
					this.makeTriangle3VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );
				}else{
					this.makeTriangle3Vtx( hPos, this.workVtx, cutType, norVec, clrVec );
				}
				break;
			case 2:	// 包含なし／２点交差（四角形パターン）
				if(isTex){
					this.makeTriangleDuo4VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );
				}else{
					this.makeTriangleDuo4Vtx( hPos, this.workVtx, cutType, norVec, clrVec );
				}
				break;
			case 3:	// １点包含／２点交差パターン
				if(isTex){
					this.makeTriangle2VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );
				}else{
					this.makeTriangle2Vtx( hPos, this.workVtx, cutType, norVec, clrVec );
				}
				break;
			case 4:	// ２点包含／１点交差
				if(isTex){
					this.makeTriangle1VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );
				}else{
					this.makeTriangle1Vtx( hPos, this.workVtx, cutType, norVec, clrVec );
				}
				break;
			case 5:	// ３点包含／交差なし
				if(isTex){
					this.makeTriangle0VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );
				}else{
					this.makeTriangle0Vtx( hPos, this.workVtx, cutType, norVec, clrVec );
				}
				break;
			case 6:	// ４点包含／交差なし
				if(isTex){
					this.makeTriangleQuadra0VtxTex( hPos, this.workVtx, cutType, norVec, clrVec, texArray );	// makeTriangle0Vtx * 4
				}else{
					this.makeTriangleQuadra0Vtx( hPos, this.workVtx, cutType, norVec, clrVec );	// makeTriangle0Vtx * 4
				}
				break;
			}
		}
	},
	// 四面体が分断されている状態を調査
	// 頂点H軸位置が正負で分類
	// 戻り値の位置には分類ごとに規則があるので注意
	// この規則を三角形構成時に利用する
	getCutType: function( vtx, iPylam, hPos ){
		"use strict";
		let cutType = 0,
			hVal = 0.0,
			minusBuf = [0,0,0,0],
			plusBuf = [0,0,0,0],
			zeroBuf = [0,0,0,0],
			mIdx = 0,
			pIdx = 0,
			zIdx = 0,
			minusNum = 0,
			plusNum = 0,
			zeroNum = 0,
			iVtx0 = 0,
			iVtx1 = 0,
			iVtx2 = 0,
			iVtx3 = 0;
		// ゼロ／正／負を調べてそれぞれのバッファに代入
		for( let cnt = 0; cnt < 4; ++cnt ){
			hVal = vtx[ iPylam[cnt] ][3];
			if( hVal < hPos ){
				minusNum++;
				minusBuf[mIdx] = iPylam[cnt];
				mIdx++;
			}else
			if( hVal > hPos ){
				plusNum++;
				plusBuf[pIdx] = iPylam[cnt];
				pIdx++;
			}else{
				zeroNum++;
				zeroBuf[zIdx] = iPylam[cnt];
				zIdx++;
			}
		}
		// ゼロの個数で分類
		if( zeroNum === 0 ){
			if(( minusNum === 0 )||( plusNum === 0 )){
				// 正負何れかが０個ならば、描画せず
				cutType = 0;
			}else
			if( minusNum === 1 ){
				// 負が１(=正が３)
				iVtx0 = minusBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = plusBuf[1];
				iVtx3 = plusBuf[2];
				cutType = 1;
			}else
			if( plusNum === 1 ){
				// 正が１(=負が３)
				iVtx0 = plusBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = minusBuf[1];
				iVtx3 = minusBuf[2];
				cutType = 1;
			}else
			if( minusNum === 2 ){
				// 正負ともに２
				iVtx0 = minusBuf[0];
				iVtx1 = minusBuf[1];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 2;
			}
		}else
		if( zeroNum === 1 ){
			// ゼロの個数が１
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else
			if( minusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = minusBuf[0];
				iVtx2 = plusBuf[0];
				iVtx3 = plusBuf[1];
				cutType = 3;
			}else
			if( plusNum === 1 ){
				iVtx0 = zeroBuf[0];
				iVtx1 = plusBuf[0];
				iVtx2 = minusBuf[0];
				iVtx3 = minusBuf[1];
				cutType = 3;
			}
		}else
		if( zeroNum === 2 ){
			// ゼロの個数が２
			if(( minusNum === 0 )||( plusNum === 0 )){
				cutType = 0;
			}else{
				iVtx0 = zeroBuf[0];
				iVtx1 = zeroBuf[1];
				iVtx2 = minusBuf[0];
				iVtx3 = plusBuf[0];
				cutType = 4;
			}
		}else
		if( zeroNum === 3 ){
			// ゼロの個数が３＝一面が完全に含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			if( minusNum === 0 ){
				iVtx3 = plusBuf[0];
			}else{
				iVtx3 = minusBuf[0];
			}
			cutType = 5;
		}else{
			// ゼロの個数が４＝四面体が全部含まれる
			iVtx0 = zeroBuf[0];
			iVtx1 = zeroBuf[1];
			iVtx2 = zeroBuf[2];
			iVtx3 = zeroBuf[3];
			cutType = 6;
		}
		
		return [ cutType, iVtx0, iVtx1, iVtx2, iVtx3 ];
	},
	makeTexArray: function( baseCnt, cutType ){		// vertex.indexから逆算してTexIndexを求め、テクスチャ配列を得る
		"use strict";
		let texArray = [ 0.0,0.0,0.0, 0.0,0.0,0.0, 0.0,0.0,0.0, 0.0,0.0,0.0 ];
		const cntBegin = baseCnt*4;

		for( let idx = 0; idx < 4; ++idx ){
			const vtxIdx = cutType[idx+1];
			// インデックスが一致する場所を探す
			for( let cnt = 0; cnt < 4; cnt++ ){
				let idxCnt = cnt+cntBegin;
				if( vtxIdx == this.index[idxCnt] ){
					let srcIdx = this.texIndex[idxCnt]*3;
					let dstIdx = idx*3;
					texArray[dstIdx  ] = this.texPos[srcIdx  ];
					texArray[dstIdx+1] = this.texPos[srcIdx+1];
					texArray[dstIdx+2] = this.texPos[srcIdx+2];
					break;
				}
			}
		}
		return texArray;
	},
	// ３頂点を算出
	makeTriangle3Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				rate01 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p1][3] ),
				rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
				rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] ),
				lerpedCol = fDWL.lerpColor( 0,1,0,2,0,3, rate01, rate02, rate03, clrVec );
		
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				rate01
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			nrm4,
			lerpedCol
		);
	},
	makeTriangle3VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				t0 = 0,
				t1 = 3,
				t2 = 6,
				t3 = 9,
				rate01 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p1][3] ),
				rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
				rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] );
		
		this.setTriangleTex(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				rate01
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			nrm4,
			clrVec,
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				rate01
			),
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				rate02
			),
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate03
			)
		);
	},
	// ４頂点を算出、２三角形を登録
	makeTriangleDuo4Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] ),
			rate12 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate13 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		let lerpedCol;
		
		// 四辺形を対角線で分けて２つの三角形を作っているが、
		// 一組の２三角形として(strip)描画したほうが望ましい
		lerpedCol = fDWL.lerpColor( 0,2,0,3,1,3, rate02, rate03, rate12, clrVec );
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			nrm4,
			lerpedCol
		);
		lerpedCol = fDWL.lerpColor( 0,3,1,2,1,3, rate03, rate12, rate13, clrVec );
		this.setTriangle(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate13
			),
			nrm4,
			lerpedCol
		);
	},
	makeTriangleDuo4VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const p0 = cutType[1],		// 4 is sizeof( vertex )
			p1 = cutType[2],
			p2 = cutType[3],
			p3 = cutType[4],
			t0 = 0,
			t1 = 3,
			t2 = 6,
			t3 = 9,
			rate02 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p2][3] ),
			rate03 = fDWL.getLerpRate( hPos, vtx[p0][3], vtx[p3][3] ),
			rate12 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
			rate13 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		
		// 四辺形を対角線で分けて２つの三角形を作っているが、
		// 一組の２三角形として(strip)描画したほうが望ましい
		this.setTriangleTex(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate02
			),
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			nrm4,
			clrVec,
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				rate02
			),
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate03
			),
			fDWL.lerp3(
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				rate12
			)
		);
/**/
		this.setTriangleTex(
			fDWL.lerp3(
				[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate03
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate12
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate13
			),
			nrm4,
			clrVec,
			fDWL.lerp3(
				[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate03
			),
			fDWL.lerp3(
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				rate12
			),
			fDWL.lerp3(
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate13
			)
		);
/**/
	},
	// 頂点の内１つが３Ｄ空間に包含：２点を算出
	makeTriangle2Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				rate0 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
				rate1 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] ),
				lerpedCol = fDWL.lerpColor( 0,0,1,2,1,3, 1,rate0,rate1, clrVec );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate0
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate1
			),
			nrm4,
			lerpedCol
		);
	},
	makeTriangle2VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				rate0 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p2][3] ),
				rate1 = fDWL.getLerpRate( hPos, vtx[p1][3], vtx[p3][3] );
		
		this.setTriangleTex(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				rate0
			),
			fDWL.lerp3(
				[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate1
			),
			nrm4,
			clrVec,
			[ texPos[texIndex[p0]], texPos[texIndex[p0]+1], texPos[texIndex[p0]+2] ],
			fDWL.lerp3(
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				rate02
			),
			fDWL.lerp3(
				[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate03
			)
		);
	},
	// 頂点の内２つが３Ｄ空間に包含：１点を算出
	makeTriangle1Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				rate = fDWL.getLerpRate( hPos, vtx[p2][3], vtx[p3][3] ),
				lerpedCol = fDWL.lerpColor( 0,0,1,1,2,3, 1,1,rate, clrVec );
		
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.lerp3(
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate
			),
			nrm4,
			lerpedCol
		);
	},
	makeTriangle1VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4],
				rate = fDWL.getLerpRate( hPos, vtx[p2][3], vtx[p3][3] );
		
		this.setTriangleTex(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.lerp3(
				[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
				[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
				rate
			),
			nrm4,
			clrVec,
			[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
			[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
			fDWL.lerp3(
				[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
				[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
				rate03
			)
		);
	},
	// 頂点の内３つが３Ｄ空間に包含されている
	makeTriangle0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3];

		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec
		);
	},
	makeTriangle0VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3];

		this.setTriangleTex(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			nrm4,
			clrVec,
			[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
			[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
			[ texArray[t2], texArray[t2+1], texArray[t2+2] ]
		);
	},
	// 頂点の内４つが３Ｄ空間に包含：４つの三角形を登録
	makeTriangleQuadra0Vtx: function( hPos, vtx, cutType, nrm4, clrVec ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4];
		let lerpedCol = [];

		lerpedCol = [
			clrVec[ 0], clrVec[ 1], clrVec[ 2], clrVec[ 3],
			clrVec[ 4], clrVec[ 5], clrVec[ 6], clrVec[ 7],
			clrVec[ 8], clrVec[ 9], clrVec[10], clrVec[11]
		];
		this.setTriangle(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			fDWL.getDirectVec( vtx[p0], vtx[p1], vtx[p2], vtx[p3] ),
			lerpedCol
		);
		lerpedCol = [
			clrVec[ 4], clrVec[ 5], clrVec[ 6], clrVec[ 7],
			clrVec[ 8], clrVec[ 9], clrVec[10], clrVec[11],
			clrVec[12], clrVec[13], clrVec[14], clrVec[15]
		];
		this.setTriangle(
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			fDWL.getDirectVec( vtx[p1], vtx[p2], vtx[p3], vtx[p0] ),
			lerpedCol
		);
		lerpedCol = [
			clrVec[ 8], clrVec[ 9], clrVec[10], clrVec[11],
			clrVec[12], clrVec[13], clrVec[14], clrVec[15],
			clrVec[ 0], clrVec[ 1], clrVec[ 2], clrVec[ 3]
		];
		this.setTriangle(
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.getDirectVec( vtx[p2], vtx[p3], vtx[p0], vtx[p1] ),
			lerpedCol
		);
		lerpedCol = [
			clrVec[ 8], clrVec[ 9], clrVec[10], clrVec[11],
			clrVec[ 0], clrVec[ 1], clrVec[ 2], clrVec[ 3],
			clrVec[ 4], clrVec[ 5], clrVec[ 6], clrVec[ 7]
		];
		this.setTriangle(
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.getDirectVec( vtx[p3], vtx[p0], vtx[p1], vtx[p2] ),
			lerpedCol
			);
	},
	makeTriangleQuadra0VtxTex: function( hPos, vtx, cutType, nrm4, clrVec, texArray ){
		"use strict";
		const	p0 = cutType[1],		// 4 is sizeof( vertex )
				p1 = cutType[2],
				p2 = cutType[3],
				p3 = cutType[4];

		lerpedCol = [
			clrVec[ 0], clrVec[ 1], clrVec[ 2], clrVec[ 3],
			clrVec[ 4], clrVec[ 5], clrVec[ 6], clrVec[ 7],
			clrVec[ 8], clrVec[ 9], clrVec[10], clrVec[11]
		];
		this.setTriangleTex(
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			fDWL.getDirectVec( vtx[p0], vtx[p1], vtx[p2], vtx[p3] ),
			clrVec,
			[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
			[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
			[ texArray[t2], texArray[t2+1], texArray[t2+2] ]
		);
		this.setTriangleTex(
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			fDWL.getDirectVec( vtx[p1], vtx[p2], vtx[p3], vtx[p0] ),
			clrVec,
			[ texArray[t1], texArray[t1+1], texArray[t1+2] ],
			[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
			[ texArray[t3], texArray[t3+1], texArray[t3+2] ]
		);
		this.setTriangleTex(
			[ vtx[p2][0], vtx[p2][1], vtx[p2][2] ],
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			fDWL.getDirectVec( vtx[p2], vtx[p3], vtx[p0], vtx[p1] ),
			clrVec,
			[ texArray[t2], texArray[t2+1], texArray[t2+2] ],
			[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
			[ texArray[t0], texArray[t0+1], texArray[t0+2] ]
		);
		this.setTriangleTex(
			[ vtx[p3][0], vtx[p3][1], vtx[p3][2] ],
			[ vtx[p0][0], vtx[p0][1], vtx[p0][2] ],
			[ vtx[p1][0], vtx[p1][1], vtx[p1][2] ],
			fDWL.getDirectVec( vtx[p3], vtx[p0], vtx[p1], vtx[p2] ),
			clrVec,
			[ texArray[t3], texArray[t3+1], texArray[t3+2] ],
			[ texArray[t0], texArray[t0+1], texArray[t0+2] ],
			[ texArray[t1], texArray[t1+1], texArray[t1+2] ]
		);
	},
	// 三角形を描画バッファに登録( Flat Shading )
	setTriangleFlat: function( v0, v1, v2, nrm4, clrVec ){
		"use strict";
		// 面の法線を求める
		let vec0 = [ v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2] ],
			vec1 = [ v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2] ],
			nrm = fDWL.normalize3( fDWL.outProd( vec0, vec1 ) ),
			vtx0 = [],
			vtx1 = [],
			vtx2 = [];
		
		// ４次法線との方向を確認、逆なら反転させる
		let det = nrm[0]*nrm4[0] + nrm[1]*nrm4[1] + nrm[2]*nrm4[2];
		if( det < 0 ){
			nrm[0] = -nrm[0];
			nrm[1] = -nrm[1];
			nrm[2] = -nrm[2];
		}
		
		vtx0 = [ v0[0], v0[1], v0[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx1 = [ v1[0], v1[1], v1[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		vtx2 = [ v2[0], v2[1], v2[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3] ];
		
		// 描画用三角バッファに詰め込む
		this.triBuf.setTriangle( vtx0, vtx1, vtx2 );
	},
	// 三角形を描画バッファに登録( Texture )
	setTriangleFlatTex: function( v0, v1, v2, nrm4, clrVec, t0, t1, t2 ){
		// 面の法線を求める
		let vec0 = [ v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2] ],
			vec1 = [ v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2] ],
			nrm = fDWL.normalize3( fDWL.outProd( vec0, vec1 ) ),
			vtx0 = [],
			vtx1 = [],
			vtx2 = [];
		
		// ４次法線との方向を確認、逆なら反転させる
		let det = nrm[0]*nrm4[0] + nrm[1]*nrm4[1] + nrm[2]*nrm4[2];
		if( det < 0 ){
			nrm[0] = -nrm[0];
			nrm[1] = -nrm[1];
			nrm[2] = -nrm[2];
		}
		
		vtx0 = [ v0[0], v0[1], v0[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3], t0[0],t0[1],t0[2] ];
		vtx1 = [ v1[0], v1[1], v1[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3], t1[0],t1[1],t1[2] ];
		vtx2 = [ v2[0], v2[1], v2[2], nrm[0],nrm[1],nrm[2], clrVec[0],clrVec[1],clrVec[2],clrVec[3], t2[0],t2[1],t2[2] ];

		// 描画用三角バッファに詰め込む
		this.triBuf.setTriangleTex( vtx0, vtx1, vtx2 );
	},
	// 三角形を描画バッファに登録( Gouraud Shading )
	setTriangleGouraud: function( v0, v1, v2, center, colors ){
		"use strict";
		const	vc0 = fDWL.normalize3( [ v0[0]-center[0], v0[1]-center[1], v0[2]-center[2] ] ),
				vc1 = fDWL.normalize3( [ v1[0]-center[0], v1[1]-center[1], v1[2]-center[2] ] ),
				vc2 = fDWL.normalize3( [ v2[0]-center[0], v2[1]-center[1], v2[2]-center[2] ] );
		
		const vtx0 = [ v0[0], v0[1], v0[2], vc0[0],vc0[1],vc0[2], colors[0],colors[1],colors[ 2],colors[ 3] ];
		const vtx1 = [ v1[0], v1[1], v1[2], vc1[0],vc1[1],vc1[2], colors[4],colors[5],colors[ 6],colors[ 7] ];
		const vtx2 = [ v2[0], v2[1], v2[2], vc2[0],vc2[1],vc2[2], colors[8],colors[9],colors[10],colors[11] ];
		
		// 描画用三角バッファに詰め込む
		this.triBuf.setTriangle( vtx0, vtx1, vtx2 );
	},
	
	// 平面法線を取得
	getNormalPlane: function( cnt ){
		"use strict";
		return this.workNrm[ cnt ];
	},
	// 頂点法線用中心点を取得
	getNormalVertex: function( cnt ){
		"use strict";
		const centerIdx = this.centerIndex[cnt];
		return [
			this.workCenter[ centerIdx ][0],
			this.workCenter[ centerIdx ][1],
			this.workCenter[ centerIdx ][2]
		];
	},
	// 平面色を取得
	getColorPlane: function( plmCnt ){
		"use strict";
		const clrCnt = this.colorIndex[plmCnt]*4;
		return [
			this.color[ clrCnt ], this.color[ clrCnt+1 ], this.color[ clrCnt+2 ], this.color[ clrCnt+3 ],
			this.color[ clrCnt ], this.color[ clrCnt+1 ], this.color[ clrCnt+2 ], this.color[ clrCnt+3 ],
			this.color[ clrCnt ], this.color[ clrCnt+1 ], this.color[ clrCnt+2 ], this.color[ clrCnt+3 ],
			this.color[ clrCnt ], this.color[ clrCnt+1 ], this.color[ clrCnt+2 ], this.color[ clrCnt+3 ]
		];
	},
	// 頂点色を取得
	getColorVertex: function( plmCnt ){
		"use strict";
		const	vtxCnt = this.index[ plmCnt*4 ],
				clrCnt0 = this.colorIndex[ this.index[ vtxCnt   ] ]*4,
				clrCnt1 = this.colorIndex[ this.index[ vtxCnt+1 ] ]*4,
				clrCnt2 = this.colorIndex[ this.index[ vtxCnt+2 ] ]*4,
				clrCnt3 = this.colorIndex[ this.index[ vtxCnt+3 ] ]*4;
		
		return [
			this.color[clrCnt0], this.color[clrCnt0+1], this.color[clrCnt0+2], this.color[clrCnt0+3],
			this.color[clrCnt1], this.color[clrCnt1+1], this.color[clrCnt1+2], this.color[clrCnt1+3],
			this.color[clrCnt2], this.color[clrCnt2+1], this.color[clrCnt2+2], this.color[clrCnt2+3],
			this.color[clrCnt3], this.color[clrCnt3+1], this.color[clrCnt3+2], this.color[clrCnt3+3]
		];
	},
	
	// ４Ｄ変換
	transform: function( preMtx ){
		"use strict";
		let mx4Scale = new fDWL.R4D.Matrix4(),
			mx4Rots = [
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4(),
				new fDWL.R4D.Matrix4()
			],
			workVtx = [],
			workNrm = [],
			workCenter = [],
			vec4 = [ 0.0, 0.0, 0.0, 0.0 ];
		
		// 各Matrixの生成
		mx4Scale.makeScale( this.scale );
		for( let idx = 0; idx < 6; ++idx ){
			mx4Rots[idx].makeRot( idx, this.rotate[idx]);
		}
		// 外部からの座標変換があれば適用
		if( preMtx !== undefined ){
			mx4Scale = mx4Scale.mul( preMtx );
		}
		// 各Matrixの合成
		this.mx4Rot = mx4Scale.
				mul( mx4Rots[5] ).
				mul( mx4Rots[4] ).
				mul( mx4Rots[3] ).
				mul( mx4Rots[2] ).
				mul( mx4Rots[1] ).
				mul( mx4Rots[0] );
		
		// 各頂点のaffine変換
		for( let idx = 0; idx < this.vertex.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.vertex[idx], this.vertex[idx+1], this.vertex[idx+2], this.vertex[idx+3] );
			vec4[0] += this.pos[0];
			vec4[1] += this.pos[1];
			vec4[2] += this.pos[2];
			vec4[3] += this.pos[3];
			workVtx.push( vec4 );
		}
		this.workVtx = workVtx;
		// 各法線のaffine変換
		for( let idx = 0; idx < this.fieldNormal.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.fieldNormal[idx], this.fieldNormal[idx+1], this.fieldNormal[idx+2], this.fieldNormal[idx+3] );
			workNrm.push( vec4 );
		}
		this.workNrm = workNrm;
		// 各基準点のaffine変換
		for( let idx = 0; idx < this.center.length; idx += 4 ){
			vec4 = this.mx4Rot.mulVec( this.center[idx], this.center[idx+1], this.center[idx+2], this.center[idx+3] );
			vec4[0] += this.pos[0];
			vec4[1] += this.pos[1];
			vec4[2] += this.pos[2];
			vec4[3] += this.pos[3];
			workCenter.push( vec4 );
		}
		this.workCenter = workCenter;
	},
	// 平行移動量の設定
	setPos: function( pos ){
		"use strict";
		this.pos = pos;
	},
	// 回転の設定
	setRotate: function( rotate ){
		"use strict";
		// rotate = [ xy, yz, yh, zh, xz, xh ]
		this.rotate = rotate;
	},
	getRotate: function(){
		return this.rotate.concat();
	},
	// スケーリングの設定
	setScale: function( scale ){
		"use strict";
		this.scale = scale;
	},
	// 頂点の法線を生成：初期化時のみ使用可能
	makeVertexNormal: function(){
		"use strict";
		for( let idx = 0; idx < 16; ++idx ){
			this.vertexNormal[idx] = this.vertex[idx]/2;
		}
	},
};

//------------------------------------------------------------------
// Create VBO
//------------------------------------------------------------------
fDWL.WGL.createVbo = function( gl, data ){
	"use strict";
	let vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return vbo;
}


//------------------------------------------------------------------
// Create IBO
//------------------------------------------------------------------
fDWL.WGL.createIbo = function( gl, data ){
	"use strict";
	let ibo = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	return ibo;
}

//------------------------------------------------------------------
// 座標変換行列計算
//------------------------------------------------------------------
fDWL.WGL.makeMatrix = function( pos, rot, scale, viewProjMtx, modelMtx, mvpMtx, invMtx ){
	"use strict";
	
	mat4.identity( modelMtx );
	// 回転
	mat4.rotateY( modelMtx, rot[1], modelMtx );
	mat4.rotateZ( modelMtx, rot[2], modelMtx );
	mat4.rotateX( modelMtx, rot[0], modelMtx );
	// スケール
	mat4.scale( modelMtx, [ scale[0], scale[1], scale[2] ], modelMtx );
	// 平行移動
	modelMtx[12] = pos[0], modelMtx[13] = pos[1], modelMtx[14] = pos[2];
	// 視点変換
	mat4.multiply( viewProjMtx, modelMtx, mvpMtx );
	// 逆行列
	mat4.inverse( modelMtx, invMtx );
}

//------------------------------------------------------------------
// 外積を計算
//------------------------------------------------------------------
fDWL.outProd = function( vec0, vec1 ){
	"use strict";
	return [
		vec0[1]*vec1[2] - vec0[2]*vec1[1],
		vec0[2]*vec1[0] - vec0[0]*vec1[2],
		vec0[0]*vec1[1] - vec0[1]*vec1[0]
	];
}

//------------------------------------------------------------------
// 3Dベクトルの正規化
//------------------------------------------------------------------
fDWL.normalize3 = function( vec ){
	"use strict";
	const vSize = Math.sqrt( vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2] );
	if( vSize == 0 ){
		return [ 0, 0, 0 ];
	}else{
		return [ vec[0]/vSize, vec[1]/vSize, vec[2]/vSize ];
	}
}

//------------------------------------------------------------------
// 3Dベクトルの線形補間
//------------------------------------------------------------------
fDWL.lerp3 = function( v0, v1, rate ){
	"use strict";
	return [
		v0[0] + rate*( v1[0] - v0[0] ),
		v0[1] + rate*( v1[1] - v0[1] ),
		v0[2] + rate*( v1[2] - v0[2] )
	];
};

//------------------------------------------------------------------
// 線形補間
//------------------------------------------------------------------
fDWL.lerp1 = function( a, b, rate ){
	"use strict";
	return ( a + rate*( b - a ));
};

//------------------------------------------------------------------
// 線形補間比率を算出
//------------------------------------------------------------------
fDWL.getLerpRate = function( pos, low, high ){
	"use strict";
	if( low === high ){
		if( 0 === low ){
			high = 1;
		}else{
			low = high-1;
		}
	}
	return ( (pos-low)/(high-low) );
};

//------------------------------------------------------------------
// 色ベクトルの線形補間
//------------------------------------------------------------------
fDWL.lerpColor = function( idxA0,idxA1, idxB0,idxB1, idxC0,idxC1, rate0,rate1,rate2, clr ){
		"use strict";
	const	lineCnt = 0,
			idx0 = idxA0*4,
			idx1 = idxA1*4,
			idx2 = idxB0*4,
			idx3 = idxB1*4,
			idx4 = idxC0*4,
			idx5 = idxC1*4;
	
	return [
		clr[idx0  ] + rate0*( clr[idx1  ] - clr[idx0  ] ),
		clr[idx0+1] + rate0*( clr[idx1+1] - clr[idx0+1] ),
		clr[idx0+2] + rate0*( clr[idx1+2] - clr[idx0+2] ),
		clr[idx0+3] + rate0*( clr[idx1+3] - clr[idx0+3] ),
		clr[idx2  ] + rate1*( clr[idx3  ] - clr[idx2  ] ),
		clr[idx2+1] + rate1*( clr[idx3+1] - clr[idx2+1] ),
		clr[idx2+2] + rate1*( clr[idx3+2] - clr[idx2+2] ),
		clr[idx2+3] + rate1*( clr[idx3+3] - clr[idx2+3] ),
		clr[idx4  ] + rate2*( clr[idx5  ] - clr[idx4  ] ),
		clr[idx4+1] + rate2*( clr[idx5+1] - clr[idx4+1] ),
		clr[idx4+2] + rate2*( clr[idx5+2] - clr[idx4+2] ),
		clr[idx4+3] + rate2*( clr[idx5+3] - clr[idx4+3] )
	];
};


//------------------------------------------------------------------
// 方向ベクトルを算出
//------------------------------------------------------------------
fDWL.getDirectVec = function( v0, v1, v2, v4 ){
	"use strict";
	return[
		(v0[0]+v1[0]+v2[0])/3 - v4[0],
		(v0[1]+v1[1]+v2[1])/3 - v4[1],
		(v0[2]+v1[2]+v2[2])/3 - v4[2]
	];
};

//==================================================================
// Obj3D
// 3D Cylinder Object
//------------------------------------------------------------------
//	data:	  データの配列
//	dataType: データの型の配列( gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN )
//==================================================================
fDWL.Objs3D = function( gl, pos, rot, scale, data, dataType ){
	"use strict";
	this.gl = gl;
	this.pos = pos;
	this.rotate = rot;
	this.scale = scale;
	this.modelMatrix = mat4.identity(mat4.create());
	this.mvpMatrix = mat4.identity(mat4.create());
	this.invMatrix = mat4.identity(mat4.create());
	this.data = data;
	this.dataType = dataType;
	
	for( let idx in dataType ){
		this.data[idx].vboList = [
			fDWL.WGL.createVbo( gl, this.data[idx].p ),
			fDWL.WGL.createVbo( gl, this.data[idx].n ),
			fDWL.WGL.createVbo( gl, this.data[idx].c ),
		];
		this.data[idx].ibo = fDWL.WGL.createIbo( gl, this.data[idx].i );
	}
};

fDWL.Objs3D.prototype = {
	isDraw: function(){
		"use strict";
		return true;
	},
	
	getPos: function(){
		"use strict";
		return this.pos.concat();
	},
	setPos: function( pos ){
		"use strict";
		this.pos = pos;
	},
	
	getRotate: function(){
		"use strict";
		return this.rotate.concat();
	},
	setRotate: function( rotate ){
		"use strict";
		this.rotate = rotate;
	},
	
	setScale: function( scale ){
		"use strict";
		this.scale = scale;
	},
	
	getScale: function(){
		"use strict";
		return this.scale.concat();
	},
	
	prepDraw: function( shader, viewProjMtx, shaderParam ){
		"use strict";
		
		fDWL.WGL.makeMatrix(
				this.pos,
				this.rotate,
				this.scale,
				viewProjMtx,
				this.modelMatrix,
				this.mvpMatrix,
				this.invMatrix
			);
		
		shaderParam[0] = this.modelMatrix;
		shaderParam[1] = this.mvpMatrix;
		shaderParam[2] = this.invMatrix;
		shader.setProgram( shaderParam );
	},
	
	draw: function( shader ){
		"use strict";
		let vboList = [];
		const gl = this.gl;
		
		// 各配列を描画処理
		for( let objIdx in this.dataType ){
			vboList = this.data[objIdx].vboList;
			
			for( let idx in vboList ){
				gl.bindBuffer( gl.ARRAY_BUFFER, vboList[idx]);
				gl.enableVertexAttribArray( shader.attrLoc[idx]);
				gl.vertexAttribPointer( shader.attrLoc[idx], shader.attrStride[idx], gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.data[objIdx].ibo );
			gl.drawElements( this.dataType[objIdx], this.data[objIdx].i.length, gl.UNSIGNED_SHORT, 0 );
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
		}
	}
};


//==================================================================
// Sphere4D
// 疑似 4D Sphere Object
//------------------------------------------------------------------
//==================================================================
fDWL.D4D.Sphere4D = function( gl, pos, rot, row, column, rad, color, shader ){
	"use strict";
	this.pos = pos;
	this.scale = [ 1, 1, 1 ];
	this.shader = shader;
	this.radius = rad;
	this.rotate = rot;
	
	this.Sphere3D = new fDWL.Objs3D( gl, [ pos[0], pos[1], pos[2] ], [ rot[0], rot[1], rot[2] ], this.scale, [ fDWL.sphere( row, column, rad, color ) ], [ gl.TRIANGLES ] );
};


//------------------------------------------------------------------
// D4D Sphere Object Prototype
//------------------------------------------------------------------
fDWL.D4D.Sphere4D.prototype = {
	
	isDraw: function( hPos ){
		"use strict";
		const dstH = (this.pos[3]-hPos);
		return (( -this.radius <= dstH )&&( dstH <= this.radius ));
	},
	
	setPos: function( pos ){
		"use strict";
		this.pos = pos;
		this.Sphere3D.setPos( pos );
	},
	getPos: function(){
		"use strict";
		return this.pos.concat();
	},
	
	getRotate: function(){
		"use strict";
		return this.Sphere3D.getRotate();
	},
	setRotate: function( rotate ){
		"use strict";
		this.rot = rotate;
		// ３Ｄ回転のみを抜粋
		this.Sphere3D.setRotate( [ rotate[1], rotate[5], rotate[0] ] );
	},
	
	getScale: function(){
		"use strict";
		return this.scale.concat();
	},
	
	prepDraw: function( hPos, viewProjMtx, shaderParam ){
		"use strict";
		// スケール計算
		const dstH = this.pos[3] - hPos;
		const scaledR = Math.sqrt( this.radius*this.radius - dstH*dstH );
		const scale = scaledR/this.radius;
		this.scale = [ scale, scale, scale ];
		this.Sphere3D.setScale( this.scale );
		// 描画準備
		this.Sphere3D.prepDraw( this.shader, viewProjMtx, shaderParam );
	},
	
	draw: function(){
		"use strict";
		this.Sphere3D.draw( this.shader );
	}
};


//------------------------------------------------------------------
// Sphere を生成
//------------------------------------------------------------------
fDWL.sphere = function(row, column, rad, color){
		"use strict";
	var pos = new Array(), nor = new Array(),
	    col = new Array(), st  = new Array(), index = new Array();
	for( let idx = 0; idx <= row; idx++ ){
		const r = Math.PI / row * idx;
		const ry = Math.cos(r);
		const rr = Math.sin(r);
		for( let ii = 0; ii <= column; ii++ ){
			const tr = Math.PI * 2 / column * ii;
			const tx = rr * rad * Math.cos(tr);
			const ty = ry * rad;
			const tz = rr * rad * Math.sin(tr);
			const rx = rr * Math.cos(tr);
			const rz = rr * Math.sin(tr);
			const tc = color?color:hsva(360 / row * idx, 1, 1, 1);
			pos.push(tx, ty, tz);
			nor.push(rx, ry, rz);
			col.push(tc[0], tc[1], tc[2], tc[3]);
			st.push(1 - 1 / column * ii, 1 / row * idx);
		}
	}
	for( let idx = 0; idx < row; idx++){
		for( let ii = 0; ii < column; ii++){
			const r = (column + 1) * idx + ii;
			index.push(r, r + 1, r + column + 2);
			index.push(r, r + column + 2, r + column + 1);
		}
	}
	return {p : pos, n : nor, c : col, t : st, i : index};
};

//------------------------------------------------------------------
// TiledFloor を生成
//------------------------------------------------------------------
fDWL.tiledFloor = function( tileLength, tileNum, color0, color1 ){
	"use strict";
	const tlg = tileLength*0.5;
	const unitPos = [
		-tlg, 0, -tlg,
		-tlg, 0,  tlg,
		 tlg, 0,  tlg,
		 tlg, 0, -tlg
	];
	const unitNor = [ 0.0, 1.0, 0.0 ];
	let pos = new Array(),
		nor = new Array(),
		col = new Array(),
		idx = new Array(),
		st  = new Array(),
		offsX = -tlg*(tileNum-1),
		offsZ = offsX,
		tlNo = 0;

	// 黒のプレート
	offsX = tlg*(tileNum-1);
	offsZ = offsX;
	for( let clmn = 0; clmn < tileNum; clmn++ ){
		offsX = tlg*(tileNum-1)
		for( var row = 0; row < tileNum; row++ ){
			if( (row+clmn) & 0x01 ){
				offsX -= tileLength;
				continue;
			}
			for( var ii = 0; ii < unitPos.length; ii+=3 ){
				pos.push( unitPos[ii]+offsX, unitPos[ii+1], unitPos[ii+2]+offsZ );
				nor.push( unitNor[0], unitNor[1], unitNor[2] );
				col.push( color0[0],  color0[1],  color0[2],  color0[3] );
			}
			idx.push( tlNo, tlNo+1, tlNo+2, tlNo, tlNo+2, tlNo+3 );
			st.push( 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 );
			offsX -= tileLength;
			tlNo += 4;
		}
		offsZ -= tileLength;
	}
	// 白のプレート
	offsZ = tlg*(tileNum-1);
	for( let clmn = 0; clmn < tileNum; clmn++ ){
		offsX = tlg*(tileNum-1)
		for( var row = 0; row < tileNum; row++ ){
			if( ((row+clmn) & 0x01) == 0 ){
				offsX -= tileLength;
				continue;
			}
			for( var ii = 0; ii < unitPos.length; ii+=3 ){
				pos.push( unitPos[ii]+offsX, unitPos[ii+1], unitPos[ii+2]+offsZ );
				nor.push( unitNor[0], unitNor[1], unitNor[2] );
				col.push( color1[0],  color1[1],  color1[2],  color1[3] );
			}
			idx.push( tlNo, tlNo+1, tlNo+2, tlNo, tlNo+2, tlNo+3 );
			st.push( 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 );
			offsX -= tileLength;
			tlNo += 4;
		}
		offsZ -= tileLength;
	}
	return { p : pos, n : nor, c : col, t : st, i : idx };
};


//------------------------------------------------------------------
// Cylinder を生成
//------------------------------------------------------------------
fDWL.cylinder = function( divNum, leng, rad, color, offs, rotate ){
	"use strict";
	let pos = new Array(),
		nor = new Array(),
		col = new Array(),
		st  = new Array(),
		idx = new Array(),
		ang = 0,
		x = 0,
		z = 0,
		px = 0,
		pz = 0,
		rs = 0,
		posV = [],
		norV = [],
		modelMtx = mat4.identity(mat4.create());
	
	mat4.rotateX( modelMtx, rotate[0], modelMtx );
	mat4.rotateZ( modelMtx, rotate[2], modelMtx );
	mat4.rotateY( modelMtx, rotate[1], modelMtx );
	
	for(let ii = 0; ii <= divNum; ii++){
		ang = Math.PI * 2 / divNum * ii;
		x = Math.cos(ang),
		z = Math.sin(ang);
		px = x*rad+offs[0],
		pz = z*rad+offs[2];
		rs = ii/divNum;
		
		mat4.multiplyVec4( modelMtx, [ px, offs[1]-(leng/2), pz, 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		mat4.multiplyVec4( modelMtx, [ x, 0, z, 0 ], norV );
		nor.push( norV[0], norV[1], norV[2] );

		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, 1.0 );
		idx.push( ii*2 );
		
		mat4.multiplyVec4( modelMtx, [ px, offs[1]+(leng/2), pz, 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		nor.push( norV[0], norV[1], norV[2] );

		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, 0.0 );
		idx.push( ii*2+1 );		//gl.TRIANGLE_STRIPを使用
	}
	return { p : pos, n : nor, c : col, t : st, i : idx };
};


//------------------------------------------------------------------
// Corn を生成
//	divNum		円の分割数
//	leng		円錐高さ
//	offs		中心座標(円の中心)
//	rad			半径
//	color		色
//	normalDir	上方方向、1.0:通常、うつ伏せ:(-1.0)
//------------------------------------------------------------------
fDWL.corn = function( divNum, leng, rad, color, normalDir, offs, rotate ){
	"use strict";
	let pos = new Array(),
		nor = new Array(),
		col = new Array(),
		st  = new Array(),
		idx = new Array(),
		ang = 0,
		x = 0,
		z = 0,
		rx = 0,
		ry = 0,
		rz = 0,
		slope = 0,
		rs = 0,
		rt = 0,
		posV = [],
		norV = [],
		modelMtx = mat4.identity(mat4.create());
	
	mat4.rotateX( modelMtx, rotate[0], modelMtx );
	mat4.rotateZ( modelMtx, rotate[2], modelMtx );
	mat4.rotateY( modelMtx, rotate[1], modelMtx );
	
	slope = Math.sqrt( rad*rad + leng*leng );
	ry = normalDir*rad/slope;
	slope = leng/slope;
	
	// 頂点部分
	mat4.multiplyVec4( modelMtx, [ offs[0], offs[1]+leng, offs[2], 0 ], posV );
	pos.push( posV[0], posV[1], posV[2] );
	mat4.multiplyVec4( modelMtx, [ 0, normalDir, 0, 0 ], norV );
	nor.push( norV[0], norV[1], norV[2] );
	
	col.push( color[0], color[1], color[2], color[3] );
	st.push( 0.5, 0.5 );
	idx.push( 0 );		//gl.TRIANGLE_FANを使用
	
	for(let ii = 0; ii < divNum; ii++){
		ang = Math.PI * 2 / divNum * ii;
		x = Math.cos(-ang),
		z = Math.sin(-ang);
		
		rx = x*slope*normalDir;
		rz = z*slope*normalDir;
		rs = 0.5-(x/2);
		rt = 0.5-(z/2);
		
		mat4.multiplyVec4( modelMtx, [ x*rad+offs[0], offs[1], z*rad+offs[2], 0 ], posV );
		pos.push( posV[0], posV[1], posV[2] );
		mat4.multiplyVec4( modelMtx, [ rx, ry, rz, 0 ], norV );
		nor.push( norV[0], norV[1], norV[2] );
		col.push( color[0], color[1], color[2], color[3] );
		st.push( rs, rt );
		idx.push( ii+1 );		//gl.TRIANGLE_FANを使用
	}
	
	// 円周部分終点＝始点
	pos.push( pos[3], pos[4], pos[5] );
	nor.push( nor[3], nor[4], nor[5] );
	col.push( color[0], color[1], color[2], color[3] );
	st.push( 0.0, 0.5 );
	idx.push( divNum+1 );		//gl.TRIANGLE_FANを使用
	
	return { p : pos, n : nor, c : col, t : st, i : idx };
};

//------------------------------------------------------------------
// WebGL版ブラウザ情報
//------------------------------------------------------------------
fDWL.getBrowserInfo = function( gl ){
	"use strict";
	let renderer	= gl.getParameter( gl.RENDERER ),
		vendor		= gl.getParameter( gl.VENDOR ),
		version		= gl.getParameter( gl.VERSION ),
		glslVersion = gl.getParameter( gl.SHADING_LANGUAGE_VERSION );
	return [ renderer, vendor, version, glslVersion ];
};


//------------------------------------------------------------------
// 乱数発生器
//------------------------------------------------------------------
fDWL.xorShift = function( seed ){
	"use strict";
	let rand = seed ^ (seed << 5);
	rand ^= (rand>>7);
	seed = rand ^ (rand<<11);
	return seed;
};
