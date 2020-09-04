
// レーザーはボールの衝突判定のままで、描画の仕方を変える。
// 衝突するたびに点の情報を取得してスタックに放り込んでそれらを点で後ろ向きにつないでいって
// 長さの限界が来たらそこで切るみたいな感じですかね・・

// セグメントモードではマウスダウンからマウスリリースまでで線を引く
// あんま短いのは引けないのとあと太さ固定
// ボールモードではマウスダウンでボール出して矢印で速さを決める感じ
// 重力に従うかは応相談って感じで

// 動的にセグメントやボールを作る
// ボールは画面外に出たら消滅させるのとあと個数の限界を決めておく
// SEGMENT押すとセグメントモードになってマウスで線が引ける
// BALL押すとボールモードになってマウスでボール出せる
// ERASE押すとランダムでボールが一つ消える
// そんくらい？

let balls = [];
let segments = [];

let mode = 0;
let segmentStart, ballPosition;
const SEGMENT_LIMIT = 40;
const BALL_LIMIT = 20;
const SEGMENT_WEIGHT = 5;
const BALL_RADIUS = 6;
let actionPreparation = false;
let targetSegment;
let moveType; // parallelもしくはrotation
let moveStartTime;
let rotateMoveInfo, parallelMoveInfo; // パラレルムーヴを設定する際の変位情報
let gravitationFlag = false;
const GRAVITY = 0.15;

const DEFAULT_BALL_COLOR = "dodgerblue";
const GRAVITY_BALL_COLOR = "tomato";
const DEFAULT_SEGMENT_COLOR = "turquoise";
const MOVING_SEGMENT_COLOR = "goldenrod";
const INACTIVE_UI_COLOR = "gray";
const ACTIVE_UI_COLOR = "royalblue";

function setup(){
	createCanvas(640, 480);
	noStroke();
  segmentStart = createVector();
  ballPosition = createVector();
}

function draw(){
	background(0);
	for(let sg of segments){ sg.update(); }
	for(let b of balls){ b.update(); }

	for(let i = 0; i < balls.length - 1; i++){
    let _ball = balls[i];
    for(let j = i + 1; j < balls.length; j++){
      let _other = balls[j];
      if(!_ball.alive || !_other.alive){ continue; }
      if(!collisionCheck(_ball, _other)){ continue; }
      perfectCollision(_ball, _other);
    }
  }

	for(let b of balls){
		for(let sg of segments){
		  if(collideBallAndSegment(b, sg)){
			  const touchInfo = adjustBallPosition(b, sg);
			  applyReflection(b, sg, touchInfo); // 反射処理の適用
			  //b.kill();
		  }
		}
	}

	for(let sg of segments){ sg.draw(); }
	for(let b of balls){ b.draw(); }

  drawGuide();
	drawConfig();

  for(let i = balls.length - 1; i >= 0; i--){ if(!balls[i].alive){ balls.splice(i, 1); } }
  for(let i = segments.length - 1; i >= 0; i--){ if(!segments[i].alive){ segments.splice(i, 1); } }
}

function drawGuide(){
	if(!actionPreparation){ return; } // アクションが控えている場合だけ。
	switch(mode){
    case 0:
      fill(255, 0, 0);
      circle(mouseX, mouseY, 6);
      if(mouseIsPressed){
        stroke(255, 0, 0);
        strokeWeight(5);
        line(segmentStart.x, segmentStart.y, mouseX, mouseY);
        noStroke();
      }
      break;
    case 1:
      fill(0, 0, 255);
      circle(mouseX, mouseY, 6);
      if(mouseIsPressed){
        stroke(0, 0, 255);
        strokeWeight(BALL_RADIUS);
        const bx = ballPosition.x;
        const by = ballPosition.y;
				circle(bx, by, BALL_RADIUS);
        const d = dist(bx, by, mouseX, mouseY);
        let properX = mouseX;
        let properY = mouseY;
        if(d > 10 * BALL_RADIUS){
          properX = bx + (mouseX - bx) * 10 * BALL_RADIUS / d;
          properY = by + (mouseY - by) * 10 * BALL_RADIUS / d;
        }
        line(ballPosition.x, ballPosition.y, properX, properY);
        noStroke();
      }
      break;
		case 2:
		  fill(0, 255, 0);
			circle(mouseX, mouseY, 6);
			break;
		case 3:
		  fill(0, 255, 255);
			circle(mouseX, mouseY, 6);
			break;
		case 4:
			fill(0, 128, 255);
			circle(mouseX, mouseY, 6);
			const {p1, p2, length:l} = targetSegment;
			const startPoint = p5.Vector.lerp(p1, p2, 0.5);
			const normalVector = p5.Vector.sub(p2, p1).rotate(PI * 0.5).normalize();
			const ip = p5.Vector.dot(normalVector, p5.Vector.sub(createVector(mouseX, mouseY), p1)); // 符号付の距離
			const endPoint = p5.Vector.add(startPoint, p5.Vector.mult(normalVector, ip)); // マウスの方向に伸ばしたときの終点みたいな。
			if(moveType === "parallel"){
				// セグメントの中心からマウス位置を通るセグメントに平行な直線に向けて垂直に線を引く。これがガイドラインになる感じ。
			  parallelMoveInfo = {x:endPoint.x - startPoint.x, y:endPoint.y - startPoint.y};
			  stroke(0, 128, 255);
			  strokeWeight(5);
			  line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
			  noStroke();
			}else{
				// p5.Vector.dist(startPoint, endPoint)を長さの半分（半径にあたる）で割って角度を出す。
				// そこに符号をつける。符号はrotate1ならipの符号の逆でrotate2ならipの符号とする。
				// これをrotateMoveInfoとして格納しておいて登録の際に使う。
				// 描画に関してはこれが正ならそのままarc作るけど負の場合は逆になるので注意する。

				// やめた。長さだけ伸ばしたときに一周するようにしよう。
				const absAngle = min(p5.Vector.dist(startPoint, endPoint) * 2 * PI / l, 2 * PI);
				rotateMoveInfo = absAngle * (ip > 0 ? 1 : -1) * (moveType === "rotate1" ? -1 : 1);
				if(absAngle < 1e-3){ return; }
				stroke(0, 128, 255);
				strokeWeight(5);
				noFill();
				const arcStart = (moveType === "rotate1" ? atan2(p1.y - startPoint.y, p1.x - startPoint.x) : atan2(p2.y - startPoint.y, p2.x - startPoint.x));
				const arcEnd = arcStart + rotateMoveInfo;
				if(rotateMoveInfo > 0){
				  arc(startPoint.x, startPoint.y, l, l, arcStart, arcEnd);
				}else{
					arc(startPoint.x, startPoint.y, l, l, arcEnd, arcStart);
				}
				noStroke();
			}
  }
}

function drawConfig(){
	fill(INACTIVE_UI_COLOR);
	rect(5, 5, 80, 30);
	rect(5, 35, 80, 30);
	rect(5, 65, 80, 30);
	rect(5, 95, 80, 30);
	rect(5, 125, 80, 30);
	rect(5, 405, 80, 30);
	fill(ACTIVE_UI_COLOR);
	rect(5, 5 + 30 * mode, 80, 30);
	if(gravitationFlag){ rect(5, 405, 80, 30); }
	fill(255);
	textSize(16);
	textAlign(CENTER, CENTER);
	text("add Seg", 45, 20);
	text("add Ball", 45, 50);
	text("rmv Seg", 45, 80);
	text("rmv Ball", 45, 110);
	text("mov Seg", 45, 140);
	text("gravity", 45, 420);
}

// 動かすのイメージ
// まず動いてるときにマウスダウンすると止まる。
// 止まってるときにマウスダウンすると、
// ダウンの場所が0～0.2または0.8～1.0のときは回転になる。
// 0.4～0.6の場合には平行移動。
// マウスリリースまでの距離を往復する。
// 片道にかかる時間はリリースまでの時間ということにする。それをインプットするイメージ。
// 回転は円周の長さだけ引っ張って（ガイドの線が出るのでそれでわかる）、一周しなければそこまでの往復回転、
// 一回りする場合は往復せずそのままぐるぐる回転する感じでおねがい。わかる？
function mousePressed(){
	if(mouseX > 0 && mouseX < 85 && mouseY > 0 && mouseY < 155){
		modeChange();
		return;
	} // モード変更エリアの場合はそこで終わりみたいな。
	if(mouseX > 0 && mouseX < 85 && mouseY > 405 && mouseY < 435){
		gravityChange();
		return;
	}
  switch(mode){
    case 0:
      segmentStart.set(mouseX, mouseY);
			actionPreparation = true;
			break;
    case 1:
      ballPosition.set(mouseX, mouseY);
			actionPreparation = true;
			break;
		case 2:
		  const removeTargetSegmentInfo = getNearestSegmentInfo(mouseX, mouseY);
			if(removeTargetSegmentInfo === undefined){ return; }
			removeTargetSegmentInfo.sg.kill();
			break;
		case 3:
		  const removeTargetBall = getNearestBall(mouseX, mouseY);
			if(removeTargetBall === undefined){ return; }
			removeTargetBall.kill();
			break;
		case 4:
		  const targetSegmentInfo = getNearestSegmentInfo(mouseX, mouseY);
			if(targetSegmentInfo === undefined){ return; }
			const {h, sg} = targetSegmentInfo;
			if(!sg.fixed){ sg.resetMove(); return; } // 動いてる場合は止める。
			if(h > 0.4 && h < 0.6){
				moveType = "parallel"; // 平行移動～
			}else if(h > 0.0 && h < 0.2){
				moveType = "rotate1"; // p1側を基準に回転
			}else if(h > 0.8 && h < 1.0){
				moveType = "rotate2"; // p2側を基準に回転
			}else{
				return;
			}
			targetSegment = sg;
			moveStartTime = frameCount;
			actionPreparation = true;
			break;
  }
}

function modeChange(){
	mode = floor((max(5, mouseY) - 5) / 30);
}

function gravityChange(){
	gravitationFlag = !gravitationFlag;
	for(let b of balls){
		b.setBodyColor(color((gravitationFlag ? GRAVITY_BALL_COLOR : DEFAULT_BALL_COLOR)));
	}
}

function mouseReleased(){
	if(!actionPreparation){ return; }
	actionPreparation = false;
  const mx = mouseX;
  const my = mouseY;
  switch(mode){
    case 0:
      const sx = segmentStart.x;
      const sy = segmentStart.y;
      if(dist(sx, sy, mx, my) < 6){ return; }
      if(segments.length < SEGMENT_LIMIT){
        segments.push(new Segment(sx, sy, mx, my, SEGMENT_WEIGHT));
      }
      break;
    case 1:
      const bx = ballPosition.x;
      const by = ballPosition.y;
			if(getNearestSegmentInfo(bx, by) !== undefined){ return; } // ボールが設置可能でないときreturnする感じ
      const d = min(dist(mx, my, bx, by), 10 * BALL_RADIUS);
      const speed = (d > 5 ? d / 5.05 : 0);
      const direction = (d > 5 ? atan2(my - by, mx - bx) : 0);
      if(balls.length < BALL_LIMIT){
        balls.push(new Ball(bx, by, speed * cos(direction), speed * sin(direction), BALL_RADIUS));
      }
			break;
		case 4:
		  const moveSpan = frameCount - moveStartTime;
			const {x:p1x, y:p1y} = targetSegment.p1;
			const {x:p2x, y:p2y} = targetSegment.p2;
			if(moveType === "parallel"){
				// パラレルの場合はムーヴインフォに基づいて一定区間を往復
			  const {x:parX, y:parY} = parallelMoveInfo;
			  const parallelMove = (sg) => {
				  // parallelMoveInfoに基づいてspanだけ進み同じspanで戻ってくる感じ
				  const f1 = sg.properFrameCount % (moveSpan * 2);
				  const prg = min(f1, moveSpan * 2 - f1) / moveSpan;
				  sg.p1.set(p1x + prg * parX, p1y + prg * parY);
				  sg.p2.set(p2x + prg * parX, p2y + prg * parY);
				  return;
			  }
				targetSegment.setMove(parallelMove);
			}else{
				// ローテートの場合はインフォに基づいて回転するんだけど、インフォの絶対値が2*PIより小さい場合。
				// 2*PIの場合は往復せずにそのまま回転するのでそこだけ注意するのです。
				const cx = (p1x + p2x) * 0.5;
				const cy = (p1y + p2y) * 0.5;
				const r = targetSegment.length * 0.5;
				const startAngle1 = atan2(p1y - cy, p1x - cx);
				const startAngle2 = atan2(p2y - cy, p2x - cx);
				const rotateMove = (sg) => {
					const f2 = sg.properFrameCount % (moveSpan * 2);
					const prg = (abs(rotateMoveInfo) < 2 * PI ? min(f2, moveSpan * 2 - f2) : f2 % moveSpan) / moveSpan;
					const t1 = startAngle1 + rotateMoveInfo * prg;
					const t2 = startAngle2 + rotateMoveInfo * prg;
					sg.p1.set(cx + r * cos(t1), cy + r * sin(t1));
					sg.p2.set(cx + r * cos(t2), cy + r * sin(t2));
					return;
				}
				targetSegment.setMove(rotateMove);
			}
		  break;
  }
}

function getNearestSegmentInfo(bx, by){
	// 最も近い位置の線分の情報を取得。無いならundefinedを返す。
  const p = createVector(bx, by);
	for(let sg of segments){
		let info = distWithSegment(p, sg);
		if(info.dist < BALL_RADIUS + SEGMENT_WEIGHT * 0.5){
			info.sg = sg;
			return info;
		}
	}
	return undefined;
}

function getNearestBall(mx, my){
	for(let b of balls){
		if(dist(b.position.x, b.position.y, mx, my) < BALL_RADIUS * 2){ return b; }
	}
	return undefined;
}

class Ball{
	constructor(x, y, u, v, r){
		this.position = createVector(x, y);
		this.previousPosition = createVector(); // 直前のフレームの位置
		this.velocity = createVector(u, v);
		this.radius = r;
    this.massFactor = 1.0;
		this.bodyColor = color((gravitationFlag ? GRAVITY_BALL_COLOR : DEFAULT_BALL_COLOR));
		this.alive = true;
	}
	kill(){
		this.alive = false;
	}
	setBodyColor(newColor){
		this.bodyColor = newColor;
	}
	update(){
		if(this.alive){
			this.previousPosition.set(this.position.x, this.position.y);
			this.position.add(this.velocity);
			const mg = this.velocity.mag();
			if(mg > this.radius * 2){ this.velocity.mult(this.radius * 1.99 / mg); }
			if(gravitationFlag){ this.velocity.y += GRAVITY; }
		}
    if(this.position.x < 0 || this.position.x > 640 || this.position.y < 0 || this.position.y > 480){ this.kill(); }
	}
	draw(){
		fill(this.bodyColor);
		circle(this.position.x, this.position.y, this.radius * 2);
	}
}

class Segment{
	constructor(a, b, c, d, w){
		this.p1 = createVector(a, b);
		this.p2 = createVector(c, d);
    this.length = dist(a, b, c, d); // 長さ固定
		this.previousP1 = createVector();
		this.previousP2 = createVector();
		this.weight = w;
		this.bodyColor = color(DEFAULT_SEGMENT_COLOR);
		this.properFrameCount = 0;
		this.move = () => {};
		this.fixed = true; // 動きを止めるときに使う
		this.alive = true;
	}
	kill(){
		this.alive = false;
	}
	setColor(newColor){
		this.bodyColor = newColor;
	}
	setMove(_move){
		this.move = _move;
		this.setColor(color(MOVING_SEGMENT_COLOR));
		this.fixed = false;
		this.properFrameCount = 0;
	}
	resetMove(){
		this.move = () => {};
		this.setColor(color(DEFAULT_SEGMENT_COLOR));
		this.fixed = true;
	}
	update(){
		this.previousP1.set(this.p1.x, this.p1.y);
		this.previousP2.set(this.p2.x, this.p2.y);
		if(!this.fixed){
			this.move(this);
		  this.properFrameCount++;
		}
	}
	draw(){
		strokeWeight(this.weight);
		stroke(this.bodyColor);
		line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
		noStroke();
	}
}

function distWithSegment(p, sg){
	const v1 = p5.Vector.sub(sg.p2, sg.p1);
	const v2 = p5.Vector.sub(p, sg.p1);
	const h1 = p5.Vector.dot(v1, v2) / p5.Vector.dot(v1, v1);
	let obj = {normal:p5.Vector.lerp(sg.p1, sg.p2, h1)}; // sgの直線に下ろした垂線の足(obj.normal)
	obj.h = h1; // この情報も使う。
	const h2 = constrain(h1, 0, 1);
	const q = p5.Vector.lerp(sg.p1, sg.p2, h2);
	obj.dist = p5.Vector.dist(p, q); // sgとの距離(obj.dist)
	return obj;
}

function collideBallAndSegment(b, sg){
	const obj = distWithSegment(b.position, sg);
	return obj.dist < b.radius + sg.weight * 0.5;
}

function adjustBallPosition(b, sg){
	// 線分を軸に持つ厚さがweightの帯と接するまで戻す。
	// それで接するならよし、接しなければ端っこの円と接するはずなのでそっちの接点を出す。
	// 返すのはp1を原点としp2を(length, 0)としたときの相対座標みたいなやつ。
	// たとえば辺の上なら(h, w * 0.5)か(h, -w * 0.5)みたいになる。もしくは、
	// (w * 0.5 * cos(), w * 0.5 * sin())とかそういうの。
	// これを取得したら、これに基づいて衝突時とその1フレーム前の位置を計算、
	// その差でもって速度とし、また、反射面の法線ベクトルも得られるので、
	// それで反射して速度を足す。OK!

	// 書き直し・・・
	// まずb.velocityのところを変えないといけない。もう線分が動いていること前提で考えないといけないので。厳しいな・・
	// しかし今直面しているバグから逃げるわけにはいかないので仕方ないわね。

	let touchInfo = {}; // 接触情報

	// 先にp1からp2に向かうベクトルとそれの90°回転の正規化を作っておく。
	let directionVector = p5.Vector.sub(sg.p2, sg.p1);
	let normalVector = p5.Vector.sub(sg.p2, sg.p1).rotate(PI * 0.5).normalize();

  let relativeVelocity = calcRelativeVelocity(b, sg, normalVector); // bとsgの前フレームでの位置関係により相対速度を算出
  //console.log(p5.Vector.dist(relativeVelocity, b.velocity));

	// まずbから直線に下ろした垂線の足が欲しい。
	const center = b.position;
	const info = distWithSegment(center, sg);
  const normalLeg = info.normal; // 垂線の足
	//let diffVector = p5.Vector.mult(b.velocity, -1); // 速度の逆ベクトル、この方向に移動させる。
  let diffVector = p5.Vector.mult(relativeVelocity, -1); // 速度の逆ベクトル、この方向に移動させる。
	const toCenter = p5.Vector.sub(center, normalLeg).normalize(); // 垂線の足から中心に向かうベクトルの正規化
	let diffUnit = p5.Vector.dot(diffVector, toCenter); // ずらしベクトルのtoCenter成分で、負の場合中心は移動により線をまたぐことになる。
	// ここでボールが軸と平行に移動しているなどで1/abs(diffUnit)がInfinityになってしまう場合があって、
	// その場合は別立ての処理にしないといけない。
	const multiplier = 1.0 / abs(diffUnit);
	if(!isFinite(multiplier)){
		// 別立て処理
		// diffUnitが0ということはp1からp2に向かうベクトルとは平行なはず、この方向ならp1と接するまで戻す。逆ならp2と接するまで戻す。
		// あ、そうか。
		// 具体的に位置を確定させちゃえばいいんだ。
    //let directionVector = p5.Vector.sub(sg.p2, sg.p1);
		let target, diffTotal, id;
		if(p5.Vector.dot(directionVector, relativeVelocity) > 0){
			target = sg.p1;
			id = 1;
			diffTotal = sqrt(pow(b.radius + sg.weight * 0.5, 2) - p5.Vector.sub(normalLeg, center).magSq()) + directionVector.mag() * info.h;
		}else{
			target = sg.p2;
			id = 2;
			diffTotal = sqrt(pow(b.radius + sg.weight * 0.5, 2) - p5.Vector.sub(normalLeg, center).magSq()) + directionVector.mag() * (1 - info.h);
		}
		diffVector.normalize();
		b.position.add(p5.Vector.mult(diffVector, diffTotal));
		// inside:falseのケース。
		touchInfo.inside = false;
		touchInfo.id = id;
		touchInfo.normal = p5.Vector.sub(b.position, target).normalize();
		// 法ベクトル：p1をp2に向かわせるベクトルを90°時計回りに回転させてできるベクトルの正規化。
		// 法ベクトルとnormalで内積取ってacosすればいい感じ。
		touchInfo.angle = Math.acos(p5.Vector.dot(normalVector, touchInfo.normal));
		touchInfo.type = "parallel";
		return touchInfo;
	}
	const t1 = (b.radius + sg.weight * 0.5 - (diffUnit > 0 ? 1 : -1) * info.dist) * multiplier; // このtの分だけdiffで動かすイメージ。
	b.position.add(p5.Vector.mult(diffVector, t1));
	// この時点で幅wの直線と接しているはずなので、その時点で線分と接しているならよし。接点を返す。
	// そうでない場合は両端の円と接するので更に計算を重ねる。
	const v1 = directionVector;
	const v2 = p5.Vector.sub(b.position, sg.p1);
	let h = p5.Vector.dot(v1, v2) / p5.Vector.dot(v1, v1);
	if(h > 0 && h < 1){
		// inside:trueのケース。
		touchInfo.inside = true;
		touchInfo.ratio = h;
		touchInfo.clockwise = (p5.Vector.dot(normalVector, v2) > 0); // p1からpositionへのベクトルと法ベクトルで内積取ればいいんだよ。
		touchInfo.normal = normalVector; // のちのちのことを考えると・・向きはきちんとしてた方がいいかな・・なんて。
		touchInfo.type = "side";
		return touchInfo;
	}

	// h < 0.5ならp1側の円と接するように修正、h > 0.5ならp2側の円と接するように修正。
	const targetEdge = (h < 0.5 ? sg.p1 : sg.p2); // ターゲットとなる端点円の中心。
	diffVector = relativeVelocity;
	diffUnit = p5.Vector.dot(p5.Vector.sub(targetEdge, b.position).normalize(), diffVector);
	const t2 = (p5.Vector.dist(b.position, targetEdge) - b.radius - sg.weight * 0.5) / abs(diffUnit);
	b.position.add(p5.Vector.mult(diffVector, t2));
	// 計算が正しければこれで円に接したはず。
	// inside:falseのケース。
	touchInfo.inside = false;
	touchInfo.id = (h < 0.5 ? 1 : 2);
	touchInfo.normal = p5.Vector.sub(b.position, targetEdge).normalize();
	touchInfo.angle = Math.acos(p5.Vector.dot(touchInfo.normal, normalVector));
	touchInfo.type = "edge";
	return touchInfo;
}

function calcRelativeVelocity(b, sg, nor){
  // bのpositionとsgのpreviousのpositionに対するbのpreviousのpositionを現在のsgのpositionに引き戻した点を比較して
  // それに基づいて差を取ったものを返す感じ。
  // norはsgの現在のnormalVectorで、まあ、計算が面倒だから。
  let v1 = p5.Vector.sub(sg.previousP2, sg.previousP1);
  const v2 = p5.Vector.sub(b.previousPosition, sg.previousP1);
  const prevH = p5.Vector.dot(v1, v2) / p5.Vector.dot(v1, v1);
  const ip = p5.Vector.dot(v2, v1.rotate(PI * 0.5).normalize());
  const relativePositionOfPrev = p5.Vector.lerp(sg.p1, sg.p2, prevH).add(p5.Vector.mult(nor, ip));
  return p5.Vector.sub(b.position, relativePositionOfPrev);
}

// おそらく、戻したときに・・だから、戻すとあんな感じになるってことね。戻す前はsurface, 戻して両端にまわしたらあんな感じになる。

function applyReflection(b, sg, info){
	// infoのnormalVectorでbの速度を反転させつつ、
	// infoの内容から接触点の情報を得て局所速度を計算しbの速度に加える。とりあえず反射だけ。

	// だめですね・・相対速度？ああそうか。つまりね。
	// まず局所速度を計算する。次に、速度から局所速度を引き算して、それに対して反射処理をして、それから引いた局所速度を足し直す感じ。

	// じゃあ次に・・
	let touchPoint;
	let previousTouchPoint;
	const directionVector = p5.Vector.sub(sg.p2, sg.p1);
	const previousDirectionVector = p5.Vector.sub(sg.previousP2, sg.previousP1);
	const normalVector = directionVector.copy().rotate(PI * 0.5).normalize();
	const previousNormalVector = previousDirectionVector.copy().rotate(PI * 0.5).normalize();
	if(info.inside){
		// 辺の上。clockwiseの情報を忘れずに。
		const properWeight = sg.weight * 0.5 * (info.clockwise ? 1 : -1);
		touchPoint = sg.p1.copy().add(p5.Vector.mult(directionVector, info.ratio)).add(p5.Vector.mult(normalVector, properWeight));
		previousTouchPoint = sg.previousP1.copy().add(p5.Vector.mult(previousDirectionVector, info.ratio)).add(p5.Vector.mult(previousNormalVector, properWeight));
	}else{
		// はしっこ。
		const targetPoint = (info.id === 1 ? sg.p1 : sg.p2);
		const previousTargetPoint = (info.id === 1 ? sg.previousP1 : sg.previousP2);
		touchPoint = targetPoint.copy().add(normalVector.copy().rotate(info.angle * (info.id === 1 ? 1 : -1)));
		previousTouchPoint = previousTargetPoint.copy().add(previousNormalVector.copy().rotate(info.angle * (info.id === 1 ? 1 : -1)));
	}
	// まず局所速度を算出
	const localSegmentVelocity = p5.Vector.sub(touchPoint, previousTouchPoint);
	// 相対速度にする
	b.velocity.sub(localSegmentVelocity);
	// 反射処理(v = v - 2 * (v, n)n)
	const v = b.velocity;
	b.velocity.sub(p5.Vector.mult(info.normal, 2 * p5.Vector.dot(info.normal, v)));
	// 局所速度の分だけ戻す
	b.velocity.add(localSegmentVelocity);
}

// あーそうか、なるほど、平行な場合に対応してないのね。
// うまくいった？でも平行な場合はどうしような・・動かせないわけだ。別立てやるしかないか。

// -------------------------------------------------------------------------------------------------------------------- //
// Functions for collide.

// 半径を見て衝突判定。これは半径が異なっても普通に使える。
function collisionCheck(_ball, _other){
  return p5.Vector.dist(_ball.position, _other.position) < _ball.radius + _other.radius;
}

function perfectCollision(_ball, _other){
	// ballとotherが衝突したときの速度の変化を記述する（面倒なので完全弾性衝突で）

  // 重心ベクトル
	const g = getCenterVector(_ball, _other);
	// 相対速度
	let u = p5.Vector.sub(_ball.velocity, g);
	let v = p5.Vector.sub(_other.velocity, g);

  // ここまでOK.
	// collisionPlaneNormalVectorの名称はやめて、fromOtherToBallとでもする（_otherから_ballへ）
	// uとfromOtherToBallのなす角のcosと、fromOtherToBallの長さ(intiialDistance)と両者の半径の和(radiusSum)から
	// 移動距離の総和(l=adjustDistanceSum)が出る、それを質量比で割って、それぞれの移動距離を出してu,vと同じ方向のベクトルでそういう大きさの
	// 物を作ってsubすればOK.

	const fromOtherToBall = p5.Vector.sub(_ball.position, _other.position);
	const initialDistance = fromOtherToBall.mag();
	const c = p5.Vector.dot(u, fromOtherToBall) / (u.mag() * initialDistance);
	const radiusSum = _ball.radius + _other.radius;

  const adjustDistanceSum = initialDistance * c + sqrt(radiusSum * radiusSum - initialDistance * initialDistance * (1 - c * c));
	const adjustDistanceForBall = adjustDistanceSum * _other.massFactor / (_ball.massFactor + _other.massFactor);
	const adjustDistanceForOther = adjustDistanceSum * _ball.massFactor / (_ball.massFactor + _other.massFactor);
  // なんかあれだけど片方が遅すぎる場合にinfiniteエラー出ちゃうみたい。切ろう。
  //if(!isFinite(adjustDistanceForBall / u.mag()) || !isFinite(adjustDistanceForOther / v.mag())){ console.log("error"); }
  if(isFinite(adjustDistanceForBall / u.mag())){
	  _ball.position.sub(p5.Vector.mult(u, adjustDistanceForBall / u.mag()));
  }
  if(isFinite(adjustDistanceForOther / v.mag())){
	  _other.position.sub(p5.Vector.mult(v, adjustDistanceForOther / v.mag()));
  }

	// 位置が変わったあとは同じように接触面のベクトルで反射処理するだけ。
  // _otherについてはmassFactor===Infinityの場合は速度が変化しない。なぜならvが0でgが元の速度だから。
  // この場合_ballについては単純に速度を加える感じになる・・
  // あー、あれ。キャッチボールでグラブを引きながらキャッチすると速度を抑えられるでしょ。あれ。

  const newNormalVector = p5.Vector.sub(_ball.position, _other.position);
	u = reflection(u, newNormalVector);
	v = reflection(v, newNormalVector);
	_ball.velocity = p5.Vector.add(u, g);
	_other.velocity = p5.Vector.add(v, g);
	//collideSound.play();
}

// 重心座標を得るために重心ベクトルを計算する
function getCenterVector(_ball, _other){
  const multiplier = 1 / (_ball.massFactor + _other.massFactor);
	const u = p5.Vector.mult(_ball.velocity, _ball.massFactor);
	const v = p5.Vector.mult(_other.velocity, _other.massFactor);
	return p5.Vector.mult(p5.Vector.add(u, v), multiplier);
}

// めり込み処理、速度によりめり込み分を計算して後退させる感じ。
function positionAdjustment(_ball, distanceWithWall, normalVectorWithWall){
  // distanceWithWall:衝突時の壁との距離。normalVectorWithWall:壁に垂直なベクトル（向きは自由）。
	const multiplier = (_ball.radius - distanceWithWall) * normalVectorWithWall.mag() / abs(p5.Vector.dot(_ball.velocity, normalVectorWithWall));
  if(!isFinite(multiplier)){ return; }
	_ball.position.sub(p5.Vector.mult(_ball.velocity, multiplier));
}
// 反射処理。
function reflection(v, n){
	// nは壁の法線ベクトル(normalVector)。これにより反射させる。
	// nとして、v→v - 2(v・n)nという計算を行う。
	// nが単位ベクトルでもいいように大きさの2乗（n・n）で割るか・・（collisionでも使うので）
  const multiplier = p5.Vector.dot(v, n) / p5.Vector.dot(n, n);
  if(!isFinite(multiplier)){ return v; }
	return p5.Vector.sub(v, p5.Vector.mult(p5.Vector.mult(n, 2), multiplier));
}
