// レールに乗って。
// ゲームのタイトルです。
// レールは障害物であり進むための指針でもあり
// 敵でもあり味方。そんなイメージで。

const AREA_WIDTH = 800;
const AREA_HEIGHT = 640;
const AREA_RADIUS = Math.sqrt(Math.pow(AREA_WIDTH, 2) + Math.pow(AREA_HEIGHT, 2)) * 0.5;

const RAIL_CAPACITY = 5;
const OBJECT_CAPACITY = 5;

// 出現時にパーティクル出そうぜ！！！！
const RAIL_CREATE_SPAN = 30;
const RAIL_APPEAR_SPAN = 30;  // 出現モーション
const OBJECT_CREATE_SPAN = 30;
const OBJECT_APPEAR_SPAN = 30; // 出現モーション

const RAIL_DIRECTIONCHANGE_SPAN = 10; // 折り返すときにしばらくの間判定しないようにする
const OBJECT_UNRIDE_SPAN = 10; // レールに乗れないフレーム数を設けておく（同じレールに再び乗っちゃうのを防ぐ）

const OBJECT_RADIUS = 8; // オブジェクトの半径
const OBJECT_STROKEWEIGHT = 2; // オブジェクトの線の太さ
const RAIL_STROKEWEIGHT = 3; // レールの太さ

// なんかconstでオブジェクト指定するとプロパティの方は変えられちゃうみたいだからこれでいいよ。
// 共通のメソッドで決める。staticで。
const KILL_RAIL_COLOR = "white"; // 殺すレール
const NORMAL_RAIL_COLOR = "lightgreen" // のっかるレール
const NORMAL_OBJECT_COLOR = "orange"; // 通常時のオブジェクトの色

let mySystem;

function setup(){
	createCanvas(AREA_WIDTH, AREA_HEIGHT);
	mySystem = new System();
}

function draw(){
	mySystem.update();
	mySystem.draw();
}

class System{
	constructor(){
		this.rails = [];
		this.objects = [];
		this.bg = createGraphics(AREA_WIDTH, AREA_HEIGHT);
		this.prepareBackground();
		this.properFrameCount = 0;
	}
	prepareBackground(){
		let gr = this.bg;
		// 何でもいいから模様
		// この際チェックでいいよもう
		gr.noStroke();
		gr.translate(gr.width * 0.5, gr.height * 0.5);
		const GRID = 40;
		const LIMIT_X = Math.floor(gr.width * 0.5 / GRID) + 1;
		const LIMIT_Y = Math.floor(gr.height * 0.5 / GRID) + 1;
		for(let x = -LIMIT_X; x <= LIMIT_X; x++){
			for(let y = -LIMIT_Y; y <= LIMIT_Y; y++){
				gr.fill(((x + y + LIMIT_X * 2 + LIMIT_Y * 2) % 2) * 60);
				gr.square(x * GRID, y * GRID, GRID);
			}
		}
	}
	createRail(){
		if(this.rails.length === RAIL_CAPACITY){ return; }
		// ここでレールを作る。点とか指定する。速度とか。とりあえずデモでは端っこで折り返して勝手に消える感じでいいんじゃない。
		let p1, p2;
		if(Math.random() < 0.5){
			p1 = createVector(AREA_WIDTH * (0.1 + 0.15 * Math.random()), AREA_HEIGHT * (0.05 + 0.9 * Math.random()));
			p2 = createVector(AREA_WIDTH * (0.9 - 0.15 * Math.random()), AREA_HEIGHT * (0.05 + 0.9 * Math.random()));
		}else{
			p1 = createVector(AREA_WIDTH * (0.05 + 0.9 * Math.random()), AREA_HEIGHT * (0.1 + 0.15 * Math.random()));
			p2 = createVector(AREA_WIDTH * (0.05 + 0.9 * Math.random()), AREA_HEIGHT * (0.9 - 0.15 * Math.random()));
		}
		let direction = p5.Vector.sub(p2, p1).heading() + Math.PI * 0.5;
		let speed = 1 + Math.random();
		let newRail = new LineRail(p1, p2, p5.Vector.fromAngle(direction, speed), "normal", 300);
		newRail.setMove((_line) => {
			_line.previousP1.set(_line.p1);
			_line.previousP2.set(_line.p2);
			_line.p1.add(_line.velocity);
			_line.p2.add(_line.velocity);
			const {p1, p2} = _line;
			const c1 = (p1.x < 0 || p1.x > AREA_WIDTH || p1.y < 0 || p1.y > AREA_HEIGHT);
			const c2 = (p2.x < 0 || p2.x > AREA_WIDTH || p2.y < 0 || p2.y > AREA_HEIGHT);
			if((c1 || c2) && _line.waitCount === 0){
				_line.velocity.mult(-1);
			}
		});
		this.rails.push(newRail);
	}
  createObject(){
		if(this.objects.length === OBJECT_CAPACITY){ return; }
		// ここでオブジェクトを作る。位置とか指定する。
		let p = createVector(AREA_WIDTH * (0.4 + 0.2 * Math.random()), AREA_HEIGHT * (0.4 + 0.2 * Math.random()));
		let newObject = new MovingObject(p, Math.random() * 2 * Math.PI, 2 + 3 * Math.random());
		this.objects.push(newObject);
	}
	removeCheck(){
		// _objectについて所属している直線が消えた場合にそこをチェックする感じ。
		for(let _object of this.objects){
			const data = _object.belongingData;
			if(!data.isBelonging){ continue; }
			if(data.rail.isAlive()){ continue; }
			_object.derailment(); // derailment:脱線。これで。
		}
	}
	crossingCheck(){
		// 直線を横切る物体あったら乗っかる。
		for(let _object of this.objects){
			if(_object.waitCount > 0 || !_object.isVisible() || !_object.isAlive()){ continue; }
			for(let _rail of this.rails){
				// どれかに乗っかるならそこに乗っかる。あとは調べない。breakして次の物体に移る。
				// _objectのpositionとpreviousPositionを結ぶ線分が横切るかどうかで判定する。外積の積を取る。
				if(!_rail.isAlive()){ continue; }
				if(_object.isBelongingRail(_rail)){ continue; } // 所属中のレールの場合はスルー
				const proportion = _rail.getCrossing(_object);
				if(proportion < 0 || proportion > 1){ continue; }
				_object.setRail(_rail, proportion);
				break;
			}
		}
	}
	update(){
		if(this.properFrameCount % RAIL_CREATE_SPAN === 0){ this.createRail(); }
		if(this.properFrameCount % OBJECT_CREATE_SPAN === 0){ this.createObject(); }
		for(let _rail of this.rails){ _rail.update(); }
		for(let _object of this.objects){ _object.update(); }
		this.removeCheck();
		this.crossingCheck();
    // 線分が途中で消える場合、消えたフラグを立てたうえで、オブジェクトを外し、速度を補正し、そのあとで配列から排除する。
		// あー、確かに減っていくイテレータあったらこういうミス（++を--って書いちゃう）減るわね。便利かも。
		for(let index = this.rails.length - 1; index >= 0; index--){
		  if(!this.rails[index].isAlive()){
				this.rails.splice(index, 1);
			}
		}
		for(let index = this.objects.length - 1; index >= 0; index--){
			if(!this.objects[index].isAlive()){
				this.objects.splice(index, 1);
			}
		}
		this.properFrameCount++;
	}
	draw(){
		image(this.bg, 0, 0);
		noFill();
		strokeWeight(RAIL_STROKEWEIGHT);
		for(let _rail of this.rails){ _rail.draw(); }
		strokeWeight(OBJECT_STROKEWEIGHT);
		for(let _object of this.objects){ _object.draw(); }
	}
}

// 動くものと動かないもの
// 障害物と乗っかるレール
// まとめて扱いたい。
// さらに直線も円も・・もしくは円弧？ああ円弧でもいいわね。んー。となるとarcとcircleとlineと・・
// 同じ長さ（にした方が楽だろ）の線分のコンポジットとかあるいは正多角形とか面白いわね。
// で、それとは別に属性・・（乗っかってるときダメージ受けない、乗っかってないときダメージ受けない、強制的に加速するなど）があったり？
// 加速時にダメージ受けないとか。そういうのも面白そう。
// 基本的にはいくつかの点があってそれらが互いの長さとかの関係、もしくは順序とかを変化させないように動く。
// で、それに対してproportionから位置を計算する機構が備わっていてレールの上の点っていうのはそれに基づいて位置を変える。
// アクションゲームのリフトみたいな？
// で、移動に関してはmoveというクラスで制御・・するはず。オブジェクトでもいいか。undefinedの場合位置の更新はしない。
class Rail{
  constructor(){
		this.id = Rail.id++;
    this.type = undefined; // 円とか線分とか。
    this.attribute = undefined; // 属性に応じて色が決まる感じ。
    this.properFrameCount = 0;
    this.alive = true;
		this.visible = false;
    // pointsやめて個別にする。
    this.move = undefined;
		this.length = 0;
		this.life = Infinity;
		this.appearCount = 0;
		this.waitCount = 0;
  }
  isAlive(){
    return this.alive;
  }
	isVisible(){
		return this.visible;
	}
	appearCheck(){
		if(this.appearCount < RAIL_APPEAR_SPAN){
			this.appearCount++;
			if(this.appearCount === RAIL_APPEAR_SPAN){
				this.visible = true;
			}
		}
		return this.visible;
	}
  kill(){
    this.alive = false;
  }
	setMove(_move){
		this.move = _move;
	}
	calcPositionFromPropotion(proportion){
		// 割合から点の位置を算出する処理はここで。
	}
	getCrossing(_object){
		// オブジェクトのそのときの位置とか前の位置とかからいろいろ計算して、交わってないなら-1,
		// 交わってるときはそのプロポーションを返すのね。点に対して計算。大きさは無視。0～1の値が返ってくるはずです・・！
	}
	update(){
		// 多分moveとか動き関連。位置の変更はここで。
		if(this.waitCount > 0){ this.waitCount--; }
		if(!this.appearCheck()){ return; }
		this.move(this);
		this.properFrameCount++;
		if(this.properFrameCount > this.life){ this.kill(); }
	}
  draw(){
		// 図形の描画。
	}
  static getColorFromAttribute(attr){
    switch(attr){
      case "kill": return KILL_RAIL_COLOR; break;
      case "normal": return NORMAL_RAIL_COLOR; break;
    }
  }
}

Rail.id = 0;

class LineRail extends Rail{
	constructor(p1, p2, v, attribute = "normal", life = Infinity){
		super();
		this.p1 = p1;
		this.p2 = p2;
		this.previousP1 = p1.copy();
		this.previousP2 = p2.copy();
		this.velocity = v;
		this.length = p5.Vector.dist(p1, p2);
		this.type = "line";
		this.attribute = attribute;
		this.railColor = Rail.getColorFromAttribute(attribute);
		this.life = life;
	}
	calcPositionFromProportion(proportion){
		return p5.Vector.lerp(this.p1, this.p2, proportion);
	}
	getCrossing(_object){
		const {x:a, y:b} = this.p1;
		const {x:c, y:d} = this.p2;
		const {x:e, y:f} = this.previousP1;
		const {x:g, y:h} = this.previousP2;
		const {x:u, y:v} = _object.position;
		const {x:w, y:z} = _object.previousPosition;
		const flag_previous = ((u - a) * (d - b) > (v - b) * (c - a) ? 1 : -1);
		const flag_current = ((w - e) * (h - f) > (z - f) * (g - e) ? 1 : -1);
		let proportion = -1;
		if(flag_previous * flag_current < 0){
			const det = (c - a) * (v - z) - (u - w) * (d - b);
	    proportion = ((v - z) * (u - a) + (w - u) * (v - b)) / det;
		}
		return proportion; // 0より小さいか1より大きいときもダメにする。
	}
	draw(){
		stroke(this.railColor);
		if(this.visible){
			// まあこの方がいいでしょ。
			line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
			return;
		}
		const prg = this.appearCount / RAIL_APPEAR_SPAN;
		// ここでイージングさせたら面白そう
		line(this.p1.x, this.p1.y, this.p1.x + (this.p2.x - this.p1.x) * prg, this.p1.y + (this.p2.y - this.p1.y) * prg);
	}
}

class TriangleRail extends Rail{

}

class SquareRail extends Rail{

}

class CircleRail extends Rail{

}

class ArcRail extends Rail{

}

class MovingObject{
	constructor(p, direction, speed){
		this.appearCount = 0;
		this.properFrameCount = 0; // 図形が回転するならそういうのをとかなんかそんなの
		this.alive = true;
		this.visible = false; // 出現するまでは直線と交わっても乗っからないとかそういうの。
		this.speed = speed;
		this.velocity = p5.Vector.fromAngle(direction, speed);
		this.position = p;
		this.previousPosition = p.copy();
		this.radius = OBJECT_RADIUS;
		this.belongingData = {isBelonging:false, rail:undefined, proportion:undefined, sign:0};
		this.waitCount = 0;
    this.bodyColor = color(NORMAL_OBJECT_COLOR);
	}
	isAlive(){
		return this.alive;
	}
	isVisible(){
		return this.visible;
	}
	isBelongingRail(_rail){
		// 所属している直線ならtrueを返す。
		if(!this.belongingData.isBelonging){ return false; }
		return this.belongingData.rail.id === _rail.id;
	}
	kill(){
		this.alive = false;
	}
	setRail(_rail, proportion){
		let data = this.belongingData;
		data.isBelonging = true;
		data.rail = _rail;
	  data.proportion = proportion;
		data.sign = random([-1, 1]);
		this.waitCount = OBJECT_UNRIDE_SPAN;
	}
	derailment(){
		// レールから離脱する。
		// 先に速度を何とかする。
		const direction = p5.Vector.sub(this.position, this.previousPosition).heading();
		this.velocity.set(p5.Vector.fromAngle(direction, this.speed));
		this.belongingData.isBelonging = false;
		this.belongingData.rail = undefined;
		this.belongingData.proportion = undefined;
		this.belongingData.sign = 0;
		this.waitCount = OBJECT_UNRIDE_SPAN;
	}
	calcPosition(){
		const _rail = this.belongingData.rail;
		let p = this.belongingData.proportion;
		p += this.belongingData.sign * this.speed / _rail.length;
		if(p < 0 || p > 1){ this.belongingData.sign *= -1; } // 方向転換
		p = constrain(p, 0, 1);
		this.belongingData.proportion = p;
		this.position.set(_rail.calcPositionFromProportion(p));
	}
	appearCheck(){
		if(this.appearCount < OBJECT_APPEAR_SPAN){
			this.appearCount++;
			if(this.appearCount === OBJECT_APPEAR_SPAN){
				this.visible = true;
			}
		}
		return this.visible;
	}
	update(){
		if(this.waitCount > 0){ this.waitCount--; }

		// appearするかどうかチェック。その間properFrameCountは変化なし。
		if(!this.appearCheck()){ return; }

		this.previousPosition.set(this.position.x, this.position.y);
		if(this.belongingData.isBelonging){
			// 所属する直線がある場合の処理。具体的には直線がスピードを指定するのでそれに従って直線に沿って動く。
			this.calcPosition();
		}else{
			// ない場合は普通に速度を足す。
			this.position.add(this.velocity);
		}
		if(this.position.x < -5 || this.position.x > AREA_WIDTH + 5 || this.position.y < -5 || this.position.y > AREA_HEIGHT + 5){ this.kill(); }
		this.properFrameCount++;
	}
	draw(){
		stroke(this.bodyColor);
		if(this.visible){
			circle(this.position.x, this.position.y, this.radius * 2);
			return;
		}
		let prg = (this.appearCount < OBJECT_APPEAR_SPAN ? this.appearCount / OBJECT_APPEAR_SPAN : 1);
		// ここprgイージングさせてもいいかも
		circle(this.position.x, this.position.y, this.radius * 2 * prg);
	}
}

// 直線_lineが_objectの直前の点と現在の点を結ぶ線分と交わる。_lineはedge1とedge2を持っておりこれで判定する感じ。
// 横切らないなら-1を返す。横切るなら交点のedge1からの割合を返す。0に近いならedge1側、1に近いならedge2側。
// ってやるつもりだったけどなんか色々出したいみたいで（運営が）しばくぞこら（運営を）
// 冗談は置いといて
// 線分の場合はこれでいいんだけど例えば円弧とかだと変わってくるわけです。めんどくさ・・円なら楽なのになぜに円弧。

// ただ、線分はこれが基本となるので、消さないでね。ていうかもうグローバル関数にするか・・？や、やめとこ。
/*
function getCrossing(_rail, _object){
	const {x:a, y:b} = _line.edge1;
	const {x:c, y:d} = _line.edge2;
	const {x:e, y:f} = _line.previousEdge1;
	const {x:g, y:h} = _line.previousEdge2;
	const {x:u, y:v} = _object.position;
	const {x:w, y:z} = _object.previousPosition;
	const det_previous = ((u - a) * (d - b) - (v - b) * (c - a));
	const det_current = ((w - e) * (h - f) - (z - f) * (g - e));
	let proportion = -1;
	if(det_previous * det_current < 0){
		const det0 = (c - a) * (v - z) - (u - w) * (d - b);
    proportion = ((v - z) * (u - a) + (w - u) * (v - b)) / det0;
	}
	return proportion; // 0より小さいか1より大きいときもダメにする。
}
*/

/*
class MovingLine{
	constructor(direction){
		this.id = MovingLine.id++; // 識別用。乗っかっている直線には渡らないので。それを知るための。
		this.lineColor = color(NORMAL_RAIL_COLOR);
		this.prepareEdges(direction);
		this.speed = 1 + Math.random() * 1; // 直線の移動スピード
		this.velocity = p5.Vector.fromAngle(direction, this.speed);
		this.properFrameCount = 0;
		this.life = Math.floor(AREA_RADIUS * 2 / this.speed) * 0.75;
		this.alive = true;
	}
	isAlive(){
		return this.alive;
	}
	kill(){
		this.alive = false;
	}
	prepareEdges(direction){
		const c = createVector(AREA_WIDTH * 0.5, AREA_HEIGHT * 0.5);
		const u = p5.Vector.fromAngle(direction, -AREA_RADIUS * 0.75);
		const v1 = p5.Vector.fromAngle(direction + Math.PI * 0.5, AREA_RADIUS * 0.3 + Math.random() * 0.2);
		const v2 = p5.Vector.fromAngle(direction - Math.PI * 0.5, AREA_RADIUS * 0.3 + Math.random() * 0.2);
		this.edge1 = p5.Vector.add(c, p5.Vector.add(u, v1));
		this.edge2 = p5.Vector.add(c, p5.Vector.add(u, v2));
		this.length = p5.Vector.dist(this.edge1, this.edge2);
		this.previousEdge1 = this.edge1.copy();
		this.previousEdge2 = this.edge2.copy();
	}
	update(){
		this.previousEdge1.set(this.edge1);
		this.previousEdge2.set(this.edge2);
		this.edge1.add(this.velocity);
		this.edge2.add(this.velocity);
		this.properFrameCount++;
		if(this.properFrameCount > this.life){ this.kill(); }
	}
	draw(){
		stroke(this.lineColor);
		strokeWeight(3.0);
		line(this.edge1.x, this.edge1.y, this.edge2.x, this.edge2.y);
	}
}
*/
