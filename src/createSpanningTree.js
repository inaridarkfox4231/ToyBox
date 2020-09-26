// createSpanningTreeの移植。
// 他の所にも避難してあるかもだけど、ToyBoxで統一的に扱いたいので。
// 応用して部屋付きの迷路も作れそう、そうなってくるといろいろ応用も広がるので・・


// 連結グラフが与えられたとき、その全域木をランダムで生成する、
// つまりランダムチョイスでいくつか辺を消して木にするアルゴリズムを書きたいの。
// その応用として、迷路。

// 頂点と辺を用意して頂点には辺の情報を入れておく
// それぞれの辺は通行可能かどうかについて3種類のフラグをもつ
// UNDETERMINED, PASSABLE, NOT_PASSABLE.
// 頂点は到達したか否か。
// UNREACHED, ARRIVED.

// 頂点をランダムにチョイスしてARRIVEDマークする。
// 連結であることが前提、まあ、木にするので。
// 伸びている辺をランダムにチョイスする。ただしUNDETERMINEDから選ぶ。p5には配列からのランダムチョイス関数があるので、
// filterと組み合わせれば簡単に書ける。その辺をスタックに入れていくのだが・・
// 主に3つの可能性がある。
// まず、最初の状態では、ランダムに選んだ頂点がcurrentVerticeとして選ばれていて辺スタックedgeStackは空になってる。
// ここでもし辺が伸びてなければやることは何もない（連結だし）。つまり頂点1個だけ。
// 終了条件は至ってシンプル：edgeStack is empty && currentVerticeから伸びるすべての辺がUNDETERMINEDでない.
// これだけ。簡単でしょ。

// stepでやること。
// 1.currentVerticeから伸びている辺のうちUNDETERMINEDなものがある場合：
//   それをランダムに取る。その先のverticeがUNREACHEDならば、状態をARRIVEDにし、
//   辺をPASSABLEにしたあとスタックに放り込んで、currentVerticeをそのverticeに更新して処理終了。
//   （つまり元来た方向の辺は常にPASSABLEなので後戻りしなくて済むわけ）
// 2.そうではなく、ARRIVEDであるなら、辺をNOT_PASSABLEにして処理終了。
// 3.UNDETERMINEDな辺がない場合、辺スタックが空でなければ処理は続く。そこからpopした辺の先の頂点でcurrentVerticeを更新して処理終了。
//   つまり一つ後ろの頂点に戻って処理を再開するわけ。

// あとはVISUALIZEですねーーーー課題ですね。はぁ。
// 頂点を円で。辺を線分で。
// 辺はグレー、通れるなら黒、通れないなら白で色付け。
// 頂点は未到達なら薄い水色、到達済みなら濃い水色。以上！

// 毎回すべての頂点と辺を描くのは負荷が大きいので工夫したい
// 辺のレイヤーと頂点のレイヤーを用意する


// DEDUCTIVE MODE（減らす系）
// 辺は最初にすべて描画しておいてIS_NOT_PASSABLEが現れたらすべて消してIS_NOT_PASSABLEだけ描かない感じで再描画
// IS_PASSABLEの場合は普通にその辺を描画するだけ
// 頂点はすべてデフォ色で描画しといてARRIVEDしたら濃い色でそこだけ再描画する
// ADDITIVE MODE（増やす系）
// 辺は最初何も描かなくて
// IS_PASSABLEが現れるたびに追加していく
// 頂点も最初何も描かなくて
// ARRIVEDが現れるたびに追加していく

// masterの描画システム
// 背景→辺→頂点→currentVertice
// って感じですかね。早く2彩色やりたい・・
// ていうかあれ、unitいつやるの。

const DEDUCTIVE = 0; // あらかじめ点と辺を描画しておいたうえで消していくスタイル。
const ADDITIVE = 1;  // 確定した点と辺だけ描画していくスタイル。

const UNREACHED = 0;
const ARRIVED = 1;

const UNDETERMINED = 0;
const IS_PASSABLE = 1;
const IS_NOT_PASSABLE = 2;

const FORWARD = 0; // 次の頂点が見つかりました。次のステップは新しい頂点から始まります。
const AVOID = 1;   // 頂点は到達済みでした。別の頂点を探します。
const BACK = 2;    // 次の頂点が見つからないので引き返します。
const FINISH = 3;  // 木の作成が完了しました。

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;

let master;
let configBoard;

class Component{
	constructor(){
		this.state = undefined;
		this.connected = [];
		this.index = -1;
	}
	setState(newState){ this.state = newState; }
	getState(){ return this.state; }
	setIndex(i){ this.index = i; }
	getIndex(){ return this.index; }
	regist(other){ this.connected.push(other); }
	draw(gr){}
}

// 頂点
class Vertice extends Component{
	constructor(x = 0, y = 0, d = 1){
		super();
		this.position = createVector(x, y);
		this.diameter = d;
	}
	draw(gr){
		gr.noStroke();
		if(this.state === UNREACHED){ gr.fill(158, 198, 255); }else{ gr.fill(0, 0, 225); }
		gr.circle(this.position.x, this.position.y, this.diameter);
	}
}

// 辺
class Edge extends Component{
	constructor(weight){
		super();
		this.weight = weight;
	}
	getOther(v){
		// 与えられた引数の頂点とは反対側の頂点を返す。
		if(this.connected[0].getIndex() === v.getIndex()){ return this.connected[1]; }
	  if(this.connected[1].getIndex() === v.getIndex()){ return this.connected[0]; }
		return undefined;
	}
	draw(gr){
		// IS_NOT_PASSABLEのときは描画しない
		if(this.state === UNDETERMINED){ gr.stroke(128, 255, 255); }else if(this.state === IS_PASSABLE){ gr.stroke(0, 128, 255); }else{ return; }
		gr.strokeWeight(this.weight);
		const {x:fx, y:fy} = this.connected[0].position;
		const {x:tx, y:ty} = this.connected[1].position;
		gr.line(fx, fy, tx, ty);
	}
}

// data = {vNum:12, eNum:17, connect:[[0, 8], [1, 8, 11], [2, 11, 14], ...], x:[...], y:[...]}
// connectはindex番目の頂点に接する辺のindexの配列が入ったもの。
// x, yには頂点の座標が入る予定だけど今はそこまで余裕ないです。
// dataを元にまず頂点と辺が用意されて接続情報が登録されます。
class Graph{
	constructor(data){
		this.mode = DEDUCTIVE;
		this.stepNum = 0;
		this.bg = createGraphics(AREA_WIDTH, AREA_HEIGHT);
		this.bg.background(0);
		this.edgeLayer = createGraphics(AREA_WIDTH, AREA_HEIGHT);
		this.verticeLayer = createGraphics(AREA_WIDTH, AREA_HEIGHT);
		this.verticeArray = [];
		this.edgeArray = [];
		this.prepareComponents(data); // 頂点の個数だけ入っててその分verticeを準備し端点として登録・・
		this.initialize();
	}
	getFinished(){
		return this.finished;
	}
	getStepNum(){
		return this.stepNum;
	}
	getMode(){
		return this.mode;
	}
	setMode(newMode){
		this.mode = newMode;
		this.verticeLayer.clear();
		this.edgeLayer.clear();
		for(let v of this.verticeArray){
			if(newMode === ADDITIVE && v.getState() !== ARRIVED){ continue; }
			v.draw(this.verticeLayer);
		}
		for(let e of this.edgeArray){
			if(newMode === ADDITIVE && e.getState() !== IS_PASSABLE){ continue; }
			e.draw(this.edgeLayer);
		}
	}
	prepareComponents(data){
		const {vNum:vn, eNum:en} = data;
		for(let i = 0; i < vn; i++){
			let newV = new Vertice(data.x[i], data.y[i], data.verticeDiameter);
			newV.setIndex(i);
			this.verticeArray.push(newV);
		}
		for(let i = 0; i < en; i++){
			let newE = new Edge(data.edgeWeight);
			newE.setIndex(i);
			this.edgeArray.push(newE);
		}
		for(let vIndex = 0; vIndex < vn; vIndex++){
			for(let eIndex of data.connect[vIndex]){
				let v = this.verticeArray[vIndex];
				let e = this.edgeArray[eIndex];
				v.regist(e);
				e.regist(v);
			}
		}
	}
	initialize(){
		// 状態の初期化と起点の設定
	  for(let v of this.verticeArray){ v.setState(UNREACHED); }
		for(let e of this.edgeArray){ e.setState(UNDETERMINED); }
		this.verticeLayer.clear();
		this.edgeLayer.clear();
		this.currentVertice = random(this.verticeArray);
		this.currentVertice.setState(ARRIVED);
		// 描画に関してはすべての頂点と辺を描画したうえで起点だけ濃い色で塗る感じ
		if(this.mode === DEDUCTIVE){
	    for(let v of this.verticeArray){ v.draw(this.verticeLayer); } // DEDUCTIVE
		  for(let e of this.edgeArray){ e.draw(this.edgeLayer); } // DEDUCTIVE
		}
		this.currentVertice.draw(this.verticeLayer); // DEDUCTIVE, ADDITIVE
		this.edgeStack = []; // 辺スタック
		this.finished = false;
		this.stepNum = 0;
	}
	step(){
		// 終了状況を返す。FINISHを返したら処理終了。
		const undeterminedEdges = this.currentVertice.connected.filter((e) => { return e.getState() === UNDETERMINED; })
		if(undeterminedEdges.length + this.edgeStack.length === 0){ return FINISH; }
		if(undeterminedEdges.length > 0){
			// 現在の頂点から未確定の辺が伸びている場合
			let connectedEdge = random(undeterminedEdges);
			let nextVertice = connectedEdge.getOther(this.currentVertice);
			if(nextVertice.getState() === UNREACHED){
				// 辺の先の頂点が未到達の場合
				nextVertice.setState(ARRIVED);
				// 通過した辺は通れるようにフラグを立てる
				connectedEdge.setState(IS_PASSABLE);
				this.currentVertice = nextVertice;
				this.edgeStack.push(connectedEdge);
				return FORWARD;
			}else{
				// すでに到達済みの場合
				connectedEdge.setState(IS_NOT_PASSABLE);
			}
			return AVOID;
		}
		// 現在の頂点から伸びているすべての辺が確定済みの場合
		const backEdge = this.edgeStack.pop();
		const backVertice = backEdge.getOther(this.currentVertice);
		this.currentVertice = backVertice;
		return BACK;
	}
  layerUpdate(state){
	  if(state === FORWARD){
			// 前進する場合は点と辺をそれぞれ描画。辺に関してはスタックの先頭なので長さ-1で出る
			this.currentVertice.draw(this.verticeLayer);
			this.edgeStack[this.edgeStack.length - 1].draw(this.edgeLayer);
		}
		if(state === AVOID && this.mode === DEDUCTIVE){
			// 回避する場合はDEDUCTIVEの時に限り普通にclearしてまとめて再描画
			this.edgeLayer.clear();
			for(let e of this.edgeArray){ e.draw(this.edgeLayer); }
		}
	}
	update(){
		if(this.finished){ return; }
		const state = this.step();
		this.stepNum++;
		this.layerUpdate(state); // 描画部分を切り離す。これじゃ何の為のstateなのか分からんでしょ。
		if(state === FINISH){ this.finished = true; }
	}
	drawCurrentVertice(){
		const {x, y} = this.currentVertice.position;
		fill(255);
		rect(x - 10, y - 10, 20, 20);
	}
	draw(){
		image(this.bg, 0, 0);
		image(this.edgeLayer, 0, 0);
		image(this.verticeLayer, 0, 0);
	  if(!this.finished){ this.drawCurrentVertice(); }
	}
}

// 迷路とは限らない以上、迷路用のデータ作成部分は分離して記述すべき。
// wは格子の横のサイズ、hは格子の縦のサイズ。
// バリエーションとして円形格子とか三角形や六角形も作ってみたいけど。あと長方形格子使って迷路生成するとか。
function createMazeData(w, h){
	let data = {};
	data.vNum = w * h;
	data.eNum = w * (h - 1) + (w - 1) * h;
	data.verticeDiameter = min(AREA_WIDTH * 0.4 / w, AREA_HEIGHT * 0.4 / h);
	data.edgeWeight = data.verticeDiameter * 0.25;
	data.x = [];
	data.y = [];
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			data.x.push((AREA_WIDTH / w) * (0.5 + m));
		}
	}
	for(let k = 0; k < h; k++){
		for(let m = 0; m < w; m++){
			data.y.push((AREA_HEIGHT / h) * (0.5 + k));
		}
	}
	data.connect = [];
	for(let index = 0; index < w * h; index++){
		const x = index % w;
		const y = Math.floor(index / w);
		let connectedData = [];
		if(y > 0){ connectedData.push(x + (y - 1) * w); }
		if(y < h - 1){ connectedData.push(x + y * w); }
		if(x > 0){ connectedData.push(w * (h - 1) + h * (x - 1) + y); }
		if(x < w - 1){ connectedData.push(w * (h - 1) + h * x + y); }
		data.connect.push(connectedData);
	}
	return data;
}

class Config{
  constructor(){
		this.board = createGraphics(AREA_WIDTH, 160);
		this.board.noStroke();
		this.board.textSize(24);
		this.board.textAlign(CENTER, CENTER);
		this.state = [false, false, false];
		if(master.getMode() === DEDUCTIVE){ this.state[0] = true; }else{ this.state[1] = true; }
	}
	mouseAction(x, y){
		if(x < 0 || x > AREA_WIDTH || y < 0 || y > 160){ return; }
		if(x > 40 && x < 120 && y > 40 && y < 80 && master.getMode() !== DEDUCTIVE){
			master.setMode(DEDUCTIVE);
			this.state[0] = true;
			this.state[1] = false;
		}
		if(x > 160 && x < 240 && y > 40 && y < 80 && master.getMode() !== ADDITIVE){
			master.setMode(ADDITIVE);
			this.state[0] = false;
			this.state[1] = true;
		}
		if(x > 280 && x < 360 && y > 40 && y < 80 && this.state[2]){
			master.initialize();
			this.state[2] = false;
		}
	}
	drawButton(x, y, name, bodyColor, isActive = true){
		if(!isActive){ bodyColor = lerpColor(bodyColor, color(255), 0.9); }
		this.board.fill(bodyColor);
		this.board.rect(x, y, 80, 40);
		this.board.fill(0);
		this.board.text(name, x + 40, y + 20);
	}
	update(){
		if(master.getFinished()){ this.state[2] = true; }
	}
	drawResult(){
		this.board.fill(255);
		this.board.textAlign(LEFT);
		this.board.text("step：" + master.getStepNum(), 40, 120);
		this.board.textAlign(CENTER, CENTER);
	}
	draw(){
		this.board.background(64);
		this.drawButton(40, 40, "minus", color(0, 0, 255), this.state[0]);
		this.drawButton(160, 40, "plus", color(255, 23, 68), this.state[1]);
		this.drawButton(280, 40, "reset", color(29, 148, 65), this.state[2]); // finishedとリンク
		this.drawResult(); // 作業記録
		image(this.board, 0, AREA_HEIGHT);
	}
}

function setup(){
	createCanvas(AREA_WIDTH, AREA_HEIGHT + 160);
	const data = createMazeData(24, 18);
	master = new Graph(data);
	configBoard = new Config();
}

function draw(){
	background(255, 200, 180);
  master.update();
	master.draw();
	configBoard.update();
	configBoard.draw();
}

function mousePressed(){
	configBoard.mouseAction(mouseX, mouseY - AREA_HEIGHT);
}
