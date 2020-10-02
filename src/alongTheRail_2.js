// レールに乗って。
// ゲームのタイトルです。
// レールは障害物であり進むための指針でもあり
// 敵でもあり味方。そんなイメージで。

// いい感じですねー
// 消滅モーション作った。あとはパーティクル。

// railのメソッドで「record」を用意する。
// ようするにpreviousのもろもろ。これはすべてに共通なので、move内に書くのは具合が悪い。分離したい。
// まあ、move書くのがめんどくさいだけ。

// というわけでアクションゲームにするひとつのバリエーションを作ることにします
// 他の派生もありそうなのでとりあえず分けます

const AREA_WIDTH = 800;
const AREA_HEIGHT = 640;
const AREA_RADIUS = Math.sqrt(Math.pow(AREA_WIDTH, 2) + Math.pow(AREA_HEIGHT, 2)) * 0.5;

const RAIL_CAPACITY = 15;
const OBJECT_CAPACITY = 15;

const RAIL_CREATE_SPAN = 30;
const RAIL_APPEAR_SPAN = 30;  // 出現モーション
const RAIL_VANISH_SPAN = 30; // 消滅モーション
const OBJECT_CREATE_SPAN = 30;
const OBJECT_APPEAR_SPAN = 30; // 出現モーション
const OBJECT_VANISH_SPAN = 30; // 消滅モーション

// パーティクルは要相談って感じ
// 少なくともObjectが消えるときは出したいね
// aliveの他に、完全に消滅した後で消えるvanishってのを用意して、vanishがtrueになったときに
// 配列から外すようにするといいかも。

const OBJECT_UNRIDE_SPAN = 10; // レールに乗れないフレーム数を設けておく（同じレールに再び乗っちゃうのを防ぐ）

const OBJECT_RADIUS = 8; // オブジェクトの半径
const OBJECT_STROKEWEIGHT = 2; // オブジェクトの線の太さ
const RAIL_STROKEWEIGHT = 3; // レールの太さ

// なんかconstでオブジェクト指定するとプロパティの方は変えられちゃうみたいだからこれでいいよ。
// 共通のメソッドで決める。staticで。
const KILL_RAIL_COLOR = "white"; // 殺すレール
const NORMAL_RAIL_COLOR = "lightgreen" // のっかるレール
const NORMAL_OBJECT_COLOR = "orange"; // 通常時のオブジェクトの色

// typeプロパティをやめて、reverseにする。reverseがtrueの場合は往復するが、そうでない場合は単純に1を足したり引いたりする。

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
	createLineRail(){
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
		let newRail = new LineRail("normal", 240 + 120 * Math.random(), p1, p2, p5.Vector.fromAngle(direction, speed));
		newRail.setMove((_line) => {
			const {p1, p2} = _line;
			const c1 = (p1.x < 0 || p1.x > AREA_WIDTH || p1.y < 0 || p1.y > AREA_HEIGHT);
			const c2 = (p2.x < 0 || p2.x > AREA_WIDTH || p2.y < 0 || p2.y > AREA_HEIGHT);
			if((c1 || c2) && _line.waitCount === 0){
				_line.velocity.mult(-1);
			}
		});
		this.rails.push(newRail);
	}
	createCircleRail(){
		if(this.rails.length === RAIL_CAPACITY){ return; }
		let c = createVector(AREA_WIDTH * (0.3 + Math.random() * 0.4), AREA_HEIGHT * (0.3 + Math.random() * 0.4));
		let v = p5.Vector.fromAngle(Math.PI * 2 * Math.random(), 2.5);
		let r = Math.min(AREA_WIDTH, AREA_HEIGHT) * (0.05 + 0.2 * Math.random());
		let newCircle = new CircleRail("normal", 360, c, v, r);
		newCircle.setMove((_circle) => {
			_circle.center.add(_circle.velocity);
			const {x, y} = _circle.center;
			const {x:vx, y:vy} = _circle.velocity;
			const r = _circle.radius;
			if(x - r < 0 || x + r > AREA_WIDTH){
				const diffX = (x - r < 0 ? (r - x) / vx : (AREA_WIDTH - r - x) / vx);
				_circle.center.add(p5.Vector.mult(_circle.velocity, diffX));
				_circle.velocity.x *= -1;
			}else if(y - r < 0 || y + r > AREA_HEIGHT){
				const diffY = (y - r < 0 ? (r - y) / vy : (AREA_HEIGHT - r - y) / vy);
				_circle.center.add(p5.Vector.mult(_circle.velocity, diffY));
				_circle.velocity.y *= -1;
			}
		})
		this.rails.push(newCircle);
	}
	createArcRail(){
		// 角速度も追加～
		if(this.rails.length === RAIL_CAPACITY){ return; }
		let c = createVector(AREA_WIDTH * (0.3 + Math.random() * 0.4), AREA_HEIGHT * (0.3 + Math.random() * 0.4));
		let v = p5.Vector.fromAngle(Math.PI * 2 * Math.random(), 2.5);
		let r = Math.min(AREA_WIDTH, AREA_HEIGHT) * (0.05 + 0.2 * Math.random());
		let newArc = new ArcRail("normal", 330, c, v, r, 2 * Math.PI * Math.random(), Math.PI * (0.2 + 1.6 * Math.random()),
		                         (1 + Math.random()) * random([1, -1]) * 0.01);
		newArc.setMove((_arc) => {
			_arc.t1 += _arc.angleSpeed;
			_arc.t2 += _arc.angleSpeed;
			_arc.center.add(_arc.velocity);
			// めんどくさいので円の場合の反射処理を援用する。どうせ最終的な実装では使わないので・・
			const {x, y} = _arc.center;
			const {x:vx, y:vy} = _arc.velocity;
			const r = _arc.radius;
			if(x - r < 0 || x + r > AREA_WIDTH){
				const diffX = (x - r < 0 ? (r - x) / vx : (AREA_WIDTH - r - x) / vx);
				_arc.center.add(p5.Vector.mult(_arc.velocity, diffX));
				_arc.velocity.x *= -1;
			}else if(y - r < 0 || y + r > AREA_HEIGHT){
				const diffY = (y - r < 0 ? (r - y) / vy : (AREA_HEIGHT - r - y) / vy);
				_arc.center.add(p5.Vector.mult(_arc.velocity, diffY));
				_arc.velocity.y *= -1;
			}
		})
		this.rails.push(newArc);
	}
  createObject(){
		if(this.objects.length === OBJECT_CAPACITY){ return; }
		// ここでオブジェクトを作る。位置とか指定する。
		let p = createVector(AREA_WIDTH * (0.4 + 0.2 * Math.random()), AREA_HEIGHT * (0.4 + 0.2 * Math.random()));
		let newObject = new MovingObject(p, Math.random() * 2 * Math.PI, 2 + 3 * Math.random());
		this.objects.push(newObject);
	}
	derailmentCheck(){
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
			if(_object.waitCount > 0 || !_object.isVisible()){ continue; }
			for(let _rail of this.rails){
				// どれかに乗っかるならそこに乗っかる。あとは調べない。breakして次の物体に移る。
				// _objectのpositionとpreviousPositionを結ぶ線分が横切るかどうかで判定する。外積の積を取る。
				if(!_rail.isVisible()){ continue; }
				if(_object.isBelongingRail(_rail)){ continue; } // 所属中のレールの場合はスルー
				const proportion = _rail.getCrossing(_object);
				if(proportion < 0 || proportion > 1){ continue; }
        // このタイミングで交叉していることが確定するのでreactionしてsetRailするなりダメージするなりやる。
				_object.reaction(_rail, proportion);
				break;
			}
		}
	}
	remove(){
		// remove.
		// 線分が途中で消える場合、消えたフラグを立てたうえで、オブジェクトを外し、速度を補正し、そのあとで配列から排除する。
		// 修正。vanishしたところで排除する。
		// あー、確かに減っていくイテレータあったらこういうミス（++を--って書いちゃう）減るわね。便利かも。
		for(let index = this.rails.length - 1; index >= 0; index--){
		  if(this.rails[index].isVanish()){
				this.rails.splice(index, 1);
			}
		}
		for(let index = this.objects.length - 1; index >= 0; index--){
			if(this.objects[index].isVanish()){
				this.objects.splice(index, 1);
			}
		}
	}
	update(){
		if(this.properFrameCount % RAIL_CREATE_SPAN === 0){
			const rdm = Math.random();
			if(rdm < 0.4){
				this.createLineRail();
			}else if(rdm < 0.7){
			  this.createCircleRail();
			}else{
				this.createArcRail();
			}
		}
		if(this.properFrameCount % OBJECT_CREATE_SPAN === 0){
			this.createObject();
		}
		for(let _rail of this.rails){ _rail.update(); }
		for(let _object of this.objects){ _object.update(); }
		this.derailmentCheck();
		this.crossingCheck();
    this.remove();
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

// 流れ。まずalive:trueのvisible:falseで始まってそのあとalive:trueとvisible:trueになってそのあとで
// 両方falseになってそれからvanishがtrueになって配列から排除。
class Rail{
  constructor(attribute, life){
		this.id = Rail.id++;
    this.properFrameCount = 0;
    this.alive = true;
		this.visible = false;
    // pointsやめて個別にする。
    this.move = undefined;
		this.length = 0;
		this.appearCount = 0;
		this.waitCount = 0;
		this.vanish = false;
		this.vanishCount = 0;
		this.attribute = attribute; // 属性に応じて色が決まる感じ。
		this.life = life;
		this.lineColor = Rail.getColorFromAttribute(attribute);
  }
  isAlive(){
    return this.alive;
  }
	isVisible(){
		return this.visible;
	}
	isVanish(){
		return this.vanish;
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
	vanishCheck(){
		if(this.vanishCount < RAIL_VANISH_SPAN){
			this.vanishCount++;
			if(this.vanishCount === RAIL_VANISH_SPAN){
				this.vanish = true;
			}
		}
	}
  kill(){
    this.alive = false;
		this.visible = false;
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
	record(){
		// previousを設定する処理
	}
	update(){
		// 多分moveとか動き関連。位置の変更はここで。
		if(!this.alive){ this.vanishCheck(); return; } // vanishするのはここで判定
		if(this.waitCount > 0){ this.waitCount--; }
		if(!this.appearCheck()){ return; }
		this.record(); // previous関連
		if(this.move !== undefined){ this.move(this); }
		this.properFrameCount++;
		if(this.properFrameCount > this.life){ this.kill(); }
	}
	drawRail(){
		// 通常の描画処理。
	}
	drawAppearingRail(prg){
		// prgは操作してイージングをかけられる。0から1に増加していく。
	}
	drawVanishingRail(prg){
		// prgは操作してイージングをかけられる。1から0に減少していく。
	}
  draw(){
		// 図形の描画。
		stroke(this.lineColor); // ああここ文字列でいいのね・・初めて知った。
		if(this.visible){
			this.drawRail(); return;
		}
		if(!this.alive){
			const prgForVanish = this.vanishCount / RAIL_VANISH_SPAN;
			this.drawVanishingRail(prgForVanish); return;
		}
		const prgForAppear = this.appearCount / RAIL_APPEAR_SPAN;
		this.drawAppearingRail(prgForAppear); return;
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
	constructor(attribute, life, p1, p2, v){
		super(attribute, life);
		this.reverse = true;
		this.p1 = p1;
		this.p2 = p2;
		this.previousP1 = p1.copy();
		this.previousP2 = p2.copy();
		this.velocity = v;
		this.length = p5.Vector.dist(p1, p2);
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
	record(){
		this.previousP1.set(this.p1);
		this.previousP2.set(this.p2);
		this.p1.add(this.velocity);
		this.p2.add(this.velocity);
	}
	drawRail(){
		line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
	}
	drawAppearingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		line(this.p1.x, this.p1.y, this.p1.x + (this.p2.x - this.p1.x) * prg, this.p1.y + (this.p2.y - this.p1.y) * prg);
	}
	drawVanishingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		line(this.p1.x + (this.p2.x - this.p1.x) * prg, this.p1.y + (this.p2.y - this.p1.y) * prg, this.p2.x, this.p2.y);
	}
}

class CircleRail extends Rail{
  constructor(attribute, life, c, v, r){
		super(attribute, life);
		this.reverse = false;
		this.center = c;
		this.radius = r;
		this.previousCenter = c.copy();
		this.velocity = v;
		this.length = 2 * Math.PI * r;
	}
	calcPositionFromProportion(proportion){
		const angle = proportion * 2 * Math.PI;
		return createVector(this.center.x + this.radius * Math.cos(angle), this.center.y + this.radius * Math.sin(angle));
	}
	getCrossing(_object){
		const flag_previous = (p5.Vector.dist(this.previousCenter, _object.previousPosition) > this.radius ? 1 : -1);
		const flag_current = (p5.Vector.dist(this.center, _object.position) > this.radius ? 1 : -1);
		let proportion = -1;
		if(flag_previous * flag_current < 0){
			// 線分と円弧の交点を求めるめんどくさい計算。
			const p = _object.position;
			const q = _object.previousPosition;
			const c = this.center;
			const e = this.previousCenter;
			const r = this.radius;
			const xi = p5.Vector.sub(c, p);
			const nu = p5.Vector.sub(p5.Vector.sub(p, q), p5.Vector.sub(c, e))
			const coeffA = nu.magSq();
			const coeffB = p5.Vector.dot(xi, nu);
			const coeffC = xi.magSq() - r * r;
			const coeffD = Math.sqrt(coeffB * coeffB - coeffA * coeffC);
			const l1 = (-coeffB + coeffD) / coeffA;
			const l2 = (-coeffB - coeffD) / coeffA;
			const l = (l1 > 0 && l1 < 1 ? l1 : l2);
			proportion = p5.Vector.sub(p5.Vector.lerp(p, q, l), c).heading() * 0.5 / Math.PI;
			if(proportion < 0){ proportion += 1; }
		}
		return proportion;
	}
	record(){
		this.previousCenter.set(this.center);
	}
	drawRail(){
		circle(this.center.x, this.center.y, this.radius * 2);
	}
	drawAppearingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		arc(this.center.x, this.center.y, this.radius * 2, this.radius * 2, 0, prg * 2 * Math.PI);
	}
	drawVanishingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		arc(this.center.x, this.center.y, this.radius * 2, this.radius * 2, prg * 2 * Math.PI, 2 * Math.PI);
	}
}

// ある角度に対して0～2*PI未満、を与えてその範囲で動かす感じ。
// 算出した角度を2PIの足し引きで定めた範囲に落として・・そのうえで交わるかどうか判断する感じね。
// たとえばtからt+PIだったら・・
// proportionの算出計算で0～2PIが出るんだけど、t～t+Aでtが増加したり減少したりっていうのを考えた時に・・いや、いいや、
// 常にt～t+Aみたいな感じで考える、で、0～2PIに落としてから・・
// 内積使った方が楽だと思う。lerpで点出したら中心からのベクトル取って正規化して、弧の真ん中に向かう単位ベクトルと内積して、
// そうするとcosの値が出るからそれがある値以上なら弧の上って出るからそれ使った方が明らかに楽。あとは・・
// headingで出した角度をt～t+Aに落とした方が簡単そう・・t～t+2PIに落として。そうすればproportionもすぐ出るし判定も一瞬。それで行こう。
class ArcRail extends Rail{
	constructor(attribute, life, c, v, r, t, diff, angleSpeed = 0){
		super(attribute, life);
		this.reverse = true;
		this.center = c;
		this.previousCenter = c.copy();
		this.velocity = v;
		this.radius = r;
		this.length = 2 * diff * r;
		this.t1 = t;
		this.t2 = t + diff;
		this.angleSpeed = angleSpeed;
	}
	calcPositionFromProportion(proportion){
		let angle = this.t1 + proportion * (this.t2 - this.t1);
		return createVector(this.center.x + this.radius * Math.cos(angle), this.center.y + this.radius * Math.sin(angle));
	}
	getCrossing(_object){
		const flag_previous = (p5.Vector.dist(this.previousCenter, _object.previousPosition) > this.radius ? 1 : -1);
		const flag_current = (p5.Vector.dist(this.center, _object.position) > this.radius ? 1 : -1);
		let proportion = -1;
		if(flag_previous * flag_current < 0){
			// 線分と円弧の交点を求めるめんどくさい計算。
			const p = _object.position;
			const q = _object.previousPosition;
			const c = this.center;
			const e = this.previousCenter;
			const r = this.radius;
			const xi = p5.Vector.sub(c, p);
			const nu = p5.Vector.sub(p5.Vector.sub(p, q), p5.Vector.sub(c, e))
			const coeffA = nu.magSq();
			const coeffB = p5.Vector.dot(xi, nu);
			const coeffC = xi.magSq() - r * r;
			const coeffD = Math.sqrt(coeffB * coeffB - coeffA * coeffC);
			const l1 = (-coeffB + coeffD) / coeffA;
			const l2 = (-coeffB - coeffD) / coeffA;
			const l = (l1 > 0 && l1 < 1 ? l1 : l2);
			let direction = p5.Vector.sub(p5.Vector.lerp(p, q, l), c).heading(); // -Math.PI～Math.PIです。
			// t～t+2PIに落とす。
			if(direction < this.t1){ direction += 2 * Math.PI * (Math.floor((this.t1 - direction) * 0.5 / Math.PI) + 1); }
			if(direction > this.t1 + 2 * Math.PI){ direction -= 2 * Math.PI * (Math.floor((direction - this.t1 - 2 * Math.PI) * 0.5 / Math.PI) + 1); }
			proportion = (direction - this.t1) / (this.t2 - this.t1);
		}
		return proportion;
	}
	record(){
		this.previousCenter.set(this.center);
	}
	drawRail(){
		arc(this.center.x, this.center.y, this.radius * 2, this.radius * 2, this.t1, this.t2);
	}
	drawAppearingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		arc(this.center.x, this.center.y, this.radius * 2, this.radius * 2, this.t1, this.t1 + (this.t2 - this.t1) * prg);
	}
	drawVanishingRail(prg){
		prg = prg * prg * (3.0 - 2.0 * prg);
		arc(this.center.x, this.center.y, this.radius * 2, this.radius * 2, this.t1 + (this.t2 - this.t1) * prg, this.t2);
	}
}

// これをどうするかっていう。
// updateとdraw.
// プレイヤーのupdate:レールの種類に応じた処理, draw:今まで通り、とりあえず。
// drawはグラフィックの貼り付けの方が処理も軽いしそうなるかも。
// 敵のupdateとかdraw・・そもそもレールに乗らないかもしれないっていうね。
// 現在「画面外に出たら消える」ってやってるところはそのうちなくす。
// 結局、レールと一緒でmoveだけ分離した方がすっきりするかな・・
class MovingObject{
	constructor(p, direction, speed){
		this.appearCount = 0;
		this.properFrameCount = 0; // 図形が回転するならそういうのをとかなんかそんなの
		this.alive = true;
		this.visible = false; // 出現するまでは直線と交わっても乗っからないとかそういうの。
		this.position = p;
		this.previousPosition = p.copy();
		this.belongingData = {isBelonging:false, rail:undefined, proportion:undefined, sign:0};
		this.waitCount = 0;
		this.vanish = false;
		this.vanishCount = OBJECT_VANISH_SPAN;

    // とりあえずPlayerとEnemyで色変えるだけでいいんじゃない。
    this.bodyColor = color(NORMAL_OBJECT_COLOR);

    // 個性に関するデータ。この辺がプレーヤーと敵で大きく分かれそう。
  	this.speed = speed;
    this.velocity = p5.Vector.fromAngle(direction, speed);
    this.radius = OBJECT_RADIUS;
	}
	isAlive(){
		return this.alive;
	}
	isVisible(){
		return this.visible;
	}
	isVanish(){
		return this.vanish;
	}
	isBelongingRail(_rail){
		// 所属している直線ならtrueを返す。
		if(!this.belongingData.isBelonging){ return false; }
		return this.belongingData.rail.id === _rail.id;
	}
	kill(){
		this.alive = false;
		this.visible = false;
	}
  reaction(_rail, proportion){
    // 本来はattributeその他もろもろにより分岐処理。signとか決まったりする感じ。
    // attributeによってはkillして終了とか。そういうのをPlayerの方に書く。Enemyの方は普通に乗っからせて・・
    this.setRail(_rail, proportion);
  }
	setRail(_rail, proportion){
		// これはreactionからの分岐でsetRailってしないとダメージレールの処理が書けない・・
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
	simpleMove(){
		// reverseプロパティに応じて右往左往するもっとも基本的な移動メソッド
		const _rail = this.belongingData.rail;
		let p = this.belongingData.proportion;
		p += this.belongingData.sign * this.speed / _rail.length;
		if(p < 0 || p > 1){
			if(_rail.reverse){
			  this.belongingData.sign *= -1; // reverse.
			  p = constrain(p, 0, 1);
			}else{
				if(p < 0){ p += 1; }
				if(p > 1){ p -= 1; }
			}
		}
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
	vanishCheck(){
		this.vanishCount--;
		if(this.vanishCount === 0){
			this.vanish = true;
		}
	}
	update(){
		if(!this.alive){ this.vanishCheck(); return; }
		if(this.waitCount > 0){ this.waitCount--; }

		// appearするかどうかチェック。その間properFrameCountは変化なし。
		if(!this.appearCheck()){ return; }

		this.previousPosition.set(this.position.x, this.position.y);
		if(this.belongingData.isBelonging){
			// 所属する直線がある場合の処理。具体的には直線がスピードを指定するのでそれに従って直線に沿って動く。
			this.simpleMove();
		}else{
			// ない場合は普通に速度を足す。
			this.position.add(this.velocity);
		}
		if(this.position.x < 0 || this.position.x > AREA_WIDTH || this.position.y < 0 || this.position.y > AREA_HEIGHT){ this.kill(); }
		this.properFrameCount++;
	}
	draw(){
    // drawObject, drawAppearingObject, drawVanishingObjectに分けた方がいいかも。
    // Appearingは敵だったらパーティクルが集まってから半径大きくしてどん！みたいな。他にもellipseで横や縦に広げるとか変化を持たせたい。
    // Vanishingも。今使ってるのはPlayer用で・・
		stroke(this.bodyColor);
		if(this.visible){
			circle(this.position.x, this.position.y, this.radius * 2);
			return;
		}
		if(!this.alive){
			let prgForVanish = this.vanishCount / OBJECT_VANISH_SPAN;
			prgForVanish = prgForVanish * prgForVanish;
			circle(this.position.x, this.position.y, this.radius * 2 * prgForVanish);
			return;
		}
		let prgForAppear = this.appearCount / OBJECT_APPEAR_SPAN;
		// ここprgイージングさせてもいいかも
		circle(this.position.x, this.position.y, this.radius * 2 * prgForAppear);
	}
}

// 何が何でも完成させる
class Player extends MovingObject{
	constructor(){}
}

class Enemy extends MovingObject{
	constructor(){}
}
