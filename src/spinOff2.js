// ゲームにするのはキー操作ぶちこむだけだからまあ簡単だとは思うけどこれどういう方向に
// 持っていったらいいの・・・？

// ボールが消えてしまうバグ発生中。
// やっぱ交差判定に問題があるね・・んー。ていうかなんで消えちゃうんだろ。

// まあでもゲームテンプレートはそれとは別に作るけど。

// たぶんだけど、ボールの衝突の後でセグメントとの衝突取るようにしたら改善したかも。

// ステージ作って横スクロールとか縦スクロールにしてゴールとか作ってまああとはアイテムとか用意して
// アイテム取りながらゴール目指してタイム競うとかでいいんじゃない。

let balls = [];
let segments = [];
let myBall;

function setup(){
	createCanvas(640, 480);
  //for(let i = 0; i < 20; i++){ balls.push(new Ball(20 + i * 20, 20, 1.2, 1.6, 6)); }
  myBall = new PlayerBall(40, 40, 0, 0, 6, 0.01);
  balls.push(myBall);

	balls.push(new Ball(320, 220, 0, 0, 6));
	balls.push(new Ball(300, 40, 2.1, 2.8, 6));
	balls.push(new Ball(280, 40, 2.2, 2.6, 6));
	balls.push(new Ball(260, 40, 2.3, 2.4, 6));
	balls.push(new Ball(240, 40, 2.4, 2.2, 6));


	segments.push(new Segment(240, 240, 400, 240, 10));
	segments[0].setMove((sg) => {
    const angle = sg.properFrameCount * 0.01;
    sg.p1.x = 320 + 80 * cos(angle);
		sg.p1.y = 240 + 80 * sin(angle);
    sg.p2.x = 320 - 80 * cos(angle);
		sg.p2.y = 240 - 80 * sin(angle);
	});
	segments.push(new Segment(120, 320, 200, 320, 10));
	segments.push(new Segment(360, 240, 440, 240, 10));
	segments[1].setMove((sg) => {
		sg.p1.x = 120 + abs(sg.properFrameCount % 160 - 80);
		sg.p2.x = 200 + abs(sg.properFrameCount % 160 - 80);
	});
	segments[2].setMove((sg) => {
		sg.p1.x = 360 + abs(sg.properFrameCount % 160 - 80);
		sg.p2.x = 440 + abs(sg.properFrameCount % 160 - 80);
	});

	segments.push(new Segment(0, 0, 640, 0, 40));
	segments.push(new Segment(0, 0, 0, 480, 40));
	segments.push(new Segment(640, 0, 640, 480, 40));
	segments.push(new Segment(0, 480, 640, 480, 40));
	noStroke();
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
  fill(255);
  textSize(18);
  text("jump:SPACE KEY", 50, 50);
  text("move:LEFT_ARROW/RIGHT_ARROW", 50, 75);
}

function keyPressed(){
  if(keyCode === 32){
    if(balls[0].jumpGauge > 1){ balls[0].velocity.y = -5; balls[0].jumpGauge = max(0, balls[0].jumpGauge - 1); }
  }
}

class Ball{
	constructor(x, y, u, v, r, restitution = 1){
		this.position = createVector(x, y);
		this.previousPosition = createVector(); // 直前のフレームの位置
		this.velocity = createVector(u, v);
		this.radius = r;
    this.massFactor = 1.0;
		this.bodyColor = color("aqua");
		this.alive = true;
    this.restitution = restitution;
	}
	kill(){
		this.alive = false;
	}
	update(){
		if(this.alive){
			this.previousPosition.set(this.position.x, this.position.y);
			this.position.add(this.velocity);
			const mg = this.velocity.mag();
			if(mg > this.radius * 2){ this.velocity.mult(this.radius * 1.99 / mg); }
		}
	}
	draw(){
		fill(this.bodyColor);
		circle(this.position.x, this.position.y, this.radius * 2);
	}
}

class PlayerBall extends Ball{
  constructor(x, y, u, v, r, restitution = 1){
    super(x, y, u, v, r, restitution);
    this.jumpGauge = 2;
    this.jumpGaugeMax = 2;
    this.bodyColor = color("orange");
  }
  update(){
		if(this.alive){
      this.jumpGauge = min(this.jumpGaugeMax, this.jumpGauge + 0.02);
			this.previousPosition.set(this.position.x, this.position.y);
      if(keyIsDown(RIGHT_ARROW) && this.velocity.x < 4){ this.velocity.x += 0.1; }
      else if(keyIsDown(LEFT_ARROW) && this.velocity.x > -4){ this.velocity.x -= 0.1; }
      else{
        if(abs(this.velocity.x) > 1e-6){ this.velocity.x *= 0.95; }else{ this.velocity.x = 0; }
      }
			this.position.add(this.velocity);
			const mg = this.velocity.mag();
			//if(mg > this.radius * 2){ this.velocity.mult(this.radius * 1.99 / mg); }
      if(this.velocity.y < 6){ this.velocity.y += 0.2; }
		}
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
		this.properFrameCount = 0;
		this.move = () => {};
    this.bodyColor = color("turquoise");
	}
	setMove(_move){
		this.move = _move;
	}
	update(){
		this.previousP1.set(this.p1.x, this.p1.y);
		this.previousP2.set(this.p2.x, this.p2.y);
		this.move(this);
		this.properFrameCount++;
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
	b.velocity.sub(p5.Vector.mult(info.normal, (1 + b.restitution) * p5.Vector.dot(info.normal, v)));
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
