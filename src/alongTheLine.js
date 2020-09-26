// あ、そうか、線分でやればいいんだ。それも固定して。まあ動かしてもいいけど。
// あれみたいに線をマウスで引いてその上を運ぶゲームとか作ったら面白そう。外すとその方向に進む、つまり、
// 線引かないと進めないとこがあったり、線では進めないとこがあったりみたいな。
// ブロック。当たると壊れるもの、何回か当たると壊れるもの。
// ゾーン。基本は当たるとアウト。線に乗ってると通過できるところ、自由に動いているときだけ通過できるところ、みたいな。
// うまく誘導してゴールに連れていく。場合によってはキーを集めないとゴールが出現しなかったりして。
// で、動く障害物とか用意して。それをうまくかわす・・みたいな？

// 線分にするなら別のプログラムにするかな・・
// 線分にしたいので別のプログラムを書きます。

// うんこのほうが
// うんこじゃない
// この方が面白いかもね。

// 以前、ボールをリフトで動かすみたいなのやろうとしてたけどこれ使えば楽に実現できるわね。

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;
const AREA_RADIUS = Math.sqrt(Math.pow(AREA_WIDTH, 2) + Math.pow(AREA_HEIGHT, 2)) * 0.5;

const LINE_CAPACITY = 20;
const OBJECT_CAPACITY = 20;

const LINE_CREATE_SPAN = 30;
const OBJECT_CREATE_SPAN = 30;
const OBJECT_APPEAR_SPAN = 15;

const LINE_PALETTE = ["deepskyblue", "dodgerblue", "blue", "navy", "slateblue"];
const CIRCLE_PALETTE = ["darkviolet", "purple", "orchid", "violet"];
const TRIANGLE_PALETTE = ["red", "orangered", "tomato"];
const SQUARE_PALETTE = ["limegreen", "lime", "chartreuse", "seagreen"];
const STAR_PALETTE = ["orange", "darkorange", "goldenrod", "gold", "coral"];

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
		this.lines = [];
		this.objects = [];
		this.bg = createGraphics(AREA_WIDTH, AREA_HEIGHT);
		this.prepareBackground();
		this.properFrameCount = 0;
	}
	prepareBackground(){
		let gr = this.bg;
		gr.noStroke();
		for(let k = 0; k < 80; k++){
			gr.fill(60 + k * 2);
			gr.rect(0, AREA_HEIGHT * (k / 80), AREA_WIDTH, AREA_HEIGHT / 80);
		}
	}
	createLine(){
		if(this.lines.length === LINE_CAPACITY){ return; }
		this.lines.push(new MovingLine(Math.random() * 2 * Math.PI));
	}
  createObject(){
		if(this.objects.length === OBJECT_CAPACITY){ return; }
		this.objects.push(new MovingObject(Math.random() * 2 * Math.PI, 8));
	}
	removeCheck(){
		// _objectについて所属している直線が消えた場合にそこをチェックする感じ。
		for(let _object of this.objects){
			const data = _object.belongingData;
			if(!data.isBelonging){ continue; }
			if(data.line.isAlive()){ continue; }
			_object.removeLine();
		}
	}
	crossingCheck(){
		// 直線を横切る物体あったら乗っかる。
		for(let _object of this.objects){
			if(_object.waitCount > 0 || !_object.isVisible() || !_object.isAlive()){ continue; }
			for(let _line of this.lines){
				// どれかに乗っかるならそこに乗っかる。あとは調べない。breakして次の物体に移る。
				// _objectのpositionとpreviousPositionを結ぶ線分が横切るかどうかで判定する。外積の積を取る。
				if(!_line.isAlive()){ continue; }
				if(_object.isBelongingLine(_line)){ continue; } // 所属中の直線の場合はスルー
				const proportion = getCrossing(_line, _object);
				if(proportion < 0 || proportion > 1){ continue; }
				_object.setLine(_line, proportion);
				break;
			}
		}
	}
	update(){
		if(this.properFrameCount % LINE_CREATE_SPAN === 0){ this.createLine(); }
		if(this.properFrameCount % OBJECT_CREATE_SPAN === 0){ this.createObject(); }
		for(let _line of this.lines){ _line.update(); }
		for(let _object of this.objects){ _object.update(); }
		this.removeCheck();
		this.crossingCheck();
    // 線分が途中で消える場合、消えたフラグを立てたうえで、オブジェクトを外し、速度を補正し、そのあとで配列から排除する。
		// あー、確かに減っていくイテレータあったらこういうミス（++を--って書いちゃう）減るわね。便利かも。
		for(let index = this.lines.length - 1; index >= 0; index--){
		  if(!this.lines[index].isAlive()){
				this.lines.splice(index, 1);
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
		for(let _line of this.lines){ _line.draw(); }
		for(let _object of this.objects){ _object.draw(); }
	}
}

class MovingLine{
	constructor(direction){
		this.id = MovingLine.id++; // 識別用。乗っかっている直線には渡らないので。それを知るための。
		this.lineColor = color(random(LINE_PALETTE));
		this.prepareEdges(direction);
		this.speed = 1 + Math.random() * 2; // 直線の移動スピード
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
		const v1 = p5.Vector.fromAngle(direction + Math.PI * 0.5, AREA_RADIUS * 0.5);
		const v2 = p5.Vector.fromAngle(direction - Math.PI * 0.5, AREA_RADIUS * 0.5);
		this.edge1 = p5.Vector.add(c, p5.Vector.add(u, v1));
		this.edge2 = p5.Vector.add(c, p5.Vector.add(u, v2));
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

MovingLine.id = 0;

class MovingObject{
	constructor(direction, radius){
		this.appearCount = 0;
		this.properFrameCount = 0; // 図形が回転するならそういうのをとかなんかそんなの
		this.alive = true;
		this.visible = false; // 出現するまでは直線と交わっても乗っからないとかそういうの。
		this.speed = 2 + Math.random() * 3;
		this.velocity = p5.Vector.fromAngle(direction, this.speed);
		this.position = createVector(AREA_WIDTH * (0.4 + 0.2 * Math.random()), AREA_HEIGHT * (0.4 + 0.2 * Math.random()));
		this.previousPosition = createVector();
		this.radius = radius;
		this.belongingData = {isBelonging:false, line:undefined, proportion:undefined, sign:0};
		this.waitCount = 15;
		this.drawType = random(["circle", "triangle", "square", "star"]);
		switch(this.drawType){
			case "circle": this.bodyColor = color(random(CIRCLE_PALETTE)); break;
			case "triangle": this.bodyColor = color(random(TRIANGLE_PALETTE)); break;
			case "square": this.bodyColor = color(random(SQUARE_PALETTE)); break;
			case "star": this.bodyColor = color(random(STAR_PALETTE)); break;
		}
	}
	isAlive(){
		return this.alive;
	}
	isVisible(){
		return this.visible;
	}
	isBelongingLine(_line){
		// 所属している直線ならtrueを返す。
		if(!this.belongingData.isBelonging){ return false; }
		return this.belongingData.line.id === _line.id;
	}
	kill(){
		this.alive = false;
	}
	setLine(_line, proportion){
		let data = this.belongingData;
		data.isBelonging = true;
		data.line = _line;
	  data.proportion = proportion;
		data.sign = random([-1, 1]);
		this.waitCount = 15;
	}
	removeLine(){
		// 線分から離脱する。
		// 先に速度を何とかする。
		const direction = p5.Vector.sub(this.position, this.previousPosition).heading();
		this.velocity.set(p5.Vector.fromAngle(direction, this.speed));
		this.belongingData.isBelonging = false;
		this.belongingData.line = undefined;
		this.belongingData.proportion = undefined;
		this.belongingData.sign = 0;
		this.waitCount = 15;
	}
	calcPosition(){
		const _line = this.belongingData.line;
		this.belongingData.proportion += this.belongingData.sign * this.speed / (AREA_RADIUS * 2);
		if(this.belongingData.proportion < 0 || this.belongingData.proportion > 1){
			this.belongingData.sign *= -1; // 方向転換
		}
		this.position.set(p5.Vector.lerp(_line.edge1, _line.edge2, this.belongingData.proportion));
	}
	update(){
		this.properFrameCount++;
		if(this.waitCount > 0){ this.waitCount--; }
		if(this.appearCount < OBJECT_APPEAR_SPAN){
			this.appearCount++;
			if(this.appearCount === OBJECT_APPEAR_SPAN){
				this.visible = true;
			}else{
			  return;
			}
		}
		this.previousPosition.set(this.position.x, this.position.y);
		if(this.belongingData.isBelonging){
			// 所属する直線がある場合の処理。具体的には直線がスピードを指定するのでそれに従って直線に沿って動く。
			this.calcPosition();
		}else{
			// ない場合は普通に速度を足す。
			this.position.add(this.velocity);
		}
		if(this.position.x < -5 || this.position.x > AREA_WIDTH + 5 || this.position.y < -5 || this.position.y > AREA_HEIGHT + 5){ this.kill(); }
	}
	drawShape(prg){
		const {x, y} = this.position;
		const r = this.radius;
		const phase = this.properFrameCount * 0.1;
		switch(this.drawType){
			case "circle":
				arc(x, y, r * 2 * prg, r * 2 * prg, 0, 2 * Math.PI);
				break;
			case "triangle":
				triangle(x + r * 1.5 * cos(phase), y + r * 1.5 * sin(phase),
								 x + r * 1.5 * cos(phase + Math.PI * 2 / 3), y + r * 1.5 * sin(phase + Math.PI * 2 / 3),
								 x + r * 1.5 * cos(phase + Math.PI * 4 / 3), y + r * 1.5 * sin(phase + Math.PI * 4 / 3));
				break;
			case "square":
				quad(x + r * 1.4 * cos(phase), y + r * 1.4 * sin(phase),
						 x + r * 1.4 * cos(phase + Math.PI * 1 / 2), y + r * 1.4 * sin(phase + Math.PI * 1 / 2),
						 x + r * 1.4 * cos(phase + Math.PI * 2 / 2), y + r * 1.4 * sin(phase + Math.PI * 2 / 2),
						 x + r * 1.4 * cos(phase + Math.PI * 3 / 2), y + r * 1.4 * sin(phase + Math.PI * 3 / 2));
				break;
			case "star":
				for(let t = 0; t < Math.PI * 4; t += Math.PI * 4 / 5){
					line(x + r * 1.5 * cos(phase + t), y + r * 1.5 * sin(phase + t),
							 x + r * 1.5 * cos(phase + t + Math.PI * 4 / 5), y + r * 1.5 * sin(phase + t + Math.PI * 4 / 5));
				}
				break;
		}
	}
	draw(){
		stroke(this.bodyColor);
		strokeWeight(2);
		noFill();
		let prg = (this.appearCount < OBJECT_APPEAR_SPAN ? this.appearCount / OBJECT_APPEAR_SPAN : 1);
		this.drawShape(prg);
	}
}

function getCrossing(_line, _object){
	// 直線_lineが_objectの直前の点と現在の点を結ぶ線分と交わる。_lineはedge1とedge2を持っておりこれで判定する感じ。
	// 横切らないなら-1を返す。横切るなら交点のedge1からの割合を返す。0に近いならedge1側、1に近いならedge2側。
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
