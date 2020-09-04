// とりあえず衝突判定持ってきて。
// 座布団持ってきてみたいに言うな。
// その前にオブジェクトプールでしょ。
// あと相互参照配列。

// applyReflectionは多角形領域に一般化できる（点と直線の距離の公式を使えばいい）。
// その方が面白そう。辺をランダムで5つくらい用意して。
// あと衝突作って完成みたいな。で、摩擦

// んー。同じ色同士でぶつかったら色が透明になって止まったら消える、一定数より少なくなったら勝手に増えるとかするべきかな。
// その前にパターンを増やす・・
// セグメントにするとか。要するに直線じゃなくて線分、みたいな。

// コピペ元
// 衝突判定関連、オブジェクトプール："break":https://www.openprocessing.org/sketch/820775
// （四分木については古都ことさん（@kfurumiya）のブログ（https://sbfl.net/blog/2017/12/03/javascript-collision/）
// を参考にしました。感謝します。未だに内容理解できてない（は？？？）
// ボールの衝突について："shoot":https://www.openprocessing.org/sketch/850650

// 線分の回転
// 線分は両端点で・・
// もう全部線分にしていいんじゃない。
// で、両端点動かして制御する感じで。パターンも色々定められるし。点の挙動は、往復とある点の周りの回転、もしくはランダム・・んー、うん。
// たとえばAとBがあったとしてAからBに向かうベクトルの時計回り方向からぶつかってきたときに反射するメソッドをぶちこんで・・みたいな。
// 反対方向からについても・・両方書くってこと？んー。それを全部書くのも大変そう、まあそれほど多くなければいいんだけど。

// 今d > this.radiusってなってるところを、線分なので、中心が帯状領域に入ってるかどうかも加味する感じ。
// 端点とぶつかる場合はランダムな方向にとぶように修正するとか・・
// ぶつかったときに中心がどっち側にあるかで90°の領域を用意してそのどっちかに飛ばす感じでいいんじゃない。
// もしくは、その・・ボールで、速度が他者に影響されないものを用意して（速度が変わらないおじゃま的なやつ）、
// それを端点に使うことで面倒を避けるとかね。そうすれば帯状領域だけ計算すれば済むし、
// 点の挙動を別に考えれば色んな動きを実現できるでしょ。どう制御するかだけど・・
// バトンみたいな感じで。ジャグリングの道具とかなんかそんなイメージで。

// 今使ってる直線を排して、衝突判定に放り込めそうな「ライン」にする。で、Colliderを用意する感じ。
// 球との衝突・・まず直線で考えてそれを横切るかどうか調べて横切ったらぶつかるかどうか調べる。
// 接点が線分上なら判定は反射になる、そうでないなら端点と接するか調べて接点における円の接線で反射させる感じ。
// って思ったんだけど、線分が動いてるので、そう単純ではないな・・動かすこと前提だと厳しい。

// ---------------------------------------------------------------------------------------- //
// system constants.

const EMPTY_SLOT = Object.freeze(Object.create(null)); // ダミーオブジェクト
const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;
const BALL_RADIUS = Math.min(AREA_WIDTH, AREA_HEIGHT) * 0.01;
const FRICTION_COEFFICIENT = 0.01;
const SPEED_LOWER_LIMIT = Math.min(AREA_WIDTH, AREA_HEIGHT) * 0.0001;
const colorPalette = ["blue", "tomato", "goldenrod", "limegreen", "darkviolet", "lightseagreen", "slateblue", "navy", "sienna"];

//const lines = []; // バウンダリー。基本上下左右の境界だけど動かしたいと思ってる。
// とりあえず今考えてるのはそれが動く感じのあれ。で、跳ね返す。ボール同士も跳ね返る。みたいな？？
// 直線をクラス化して情報として与えてなんとかかんとかみたいなあれ。もしくはポインタを渡す。

// バウンダリー動かしたら面白そうね。衝突判定まだ実装してない。
// sqrtは負荷が重いから、・・まあ、大した負荷じゃないか。んー。


let ballPool;
let mySystem;

let isLoop = true;
let showInfo = true;
let runTimeMax = 0;
const AVERAGE_CALC_SPAN = 60;
let runTimeSum = 0;
let runTimeAverage = 0;
let averageCalcCounter = 0;

function setup(){
  createCanvas(AREA_WIDTH, AREA_HEIGHT);
  noStroke();
  ballPool = new ObjectPool(() => { return new Ball(); }, 512);
  mySystem = new System();
  for(let x = 0.1; x < 1.0; x += 0.16){
    for(let y = 0.1; y < 1.0; y += 0.16){
      const speed = 1 + random() * 2;
      const direction = random() * 2 * PI;
      mySystem.addBall(AREA_WIDTH * x, AREA_HEIGHT * y, speed * cos(direction), speed * sin(direction), BALL_RADIUS * (1 + 1.6 * random()));
    }
  }
  mySystem.addLineWithCoord(15, 15, AREA_WIDTH - 15, 15);
  mySystem.addLineWithCoord(AREA_WIDTH - 15, 15, AREA_WIDTH - 15, AREA_HEIGHT - 15);
  mySystem.addLineWithCoord(AREA_WIDTH - 15, AREA_HEIGHT - 15, 15, AREA_HEIGHT - 15);
  mySystem.addLineWithCoord(15, AREA_HEIGHT - 15, 15, 15);
  textSize(16);
}

function draw(){
  background(0);
  const runStart = performance.now();
  mySystem.update();
  mySystem.collisionCheck();
  mySystem.remove();
  mySystem.draw();
  const runEnd = performance.now();

  if(showInfo){ showPerformanceInfo({run:runEnd - runStart}); }
}

// ---------------------------------------------------------------------------------------- //
// performance infomation.

function showPerformanceInfo(data){
  fill(255);
  displayRealNumber(data.run, 20, 40, "run");
  runTimeMax = max(runTimeMax, data.run);
  displayRealNumber(runTimeMax, 20, 60, "runMax");
  averageCalcCounter++;
  runTimeSum += data.run;
  if(averageCalcCounter % AVERAGE_CALC_SPAN === 0){
    runTimeAverage = runTimeSum / AVERAGE_CALC_SPAN;
    runTimeSum = 0;
    averageCalcCounter = 0;
  }
  displayRealNumber(runTimeAverage, 20, 80, "runAverage");
}

// 表示関数（実数版）
function displayRealNumber(value, x, y, explanation, precision = 4){
  // 与えられた実数を(x, y)の位置に小数点以下precisionまで表示する感じ(explanation:~~~って感じ)
  const valueStr = value.toPrecision(precision);
  const innerText = `${valueStr}ms`;
  text(explanation + ":" + innerText, x, y);
}

// ---------------------------------------------------------------------------------------- //
// ball.

class Ball{
  constructor(){
    this.position = createVector();
    this.velocity = createVector();
    this.alive = false;
    this.massFactor = 1.0;
    this.friction = FRICTION_COEFFICIENT;
    this.collider = new CircleCollider();
  }
  initialize(x, y, u, v, r){
    this.position.set(x, y);
    this.velocity.set(u, v);
    this.alive = true;
    this.radius = r;
    this.massFactor = r / BALL_RADIUS;
    this.bodyColor = color(random(colorPalette));
    this.collider.update(x, y, r);
  }
  applyReflection(){
    for(const l of mySystem.lines){
      let d = l.getDist(this);
      if(d > this.radius){ continue; }
      // ここabs(d)にしてたけどdにしたら壁の向こう側に行かなくなった。なるほどね・・・
      positionAdjustment(this, d, l.normal);
      this.velocity = reflection(this.velocity, l.normal);
    }
  }
  applyFriction(){
    this.velocity.mult(1.0 - this.friction);
  }
  remove(){
    if(!this.alive){ this.belongingArray.remove(this); }
  }
  update(){
    if(!this.alive){ return; }
    this.position.add(this.velocity);
    this.applyReflection();
    //this.applyFriction();
    if(this.velocity.mag() < SPEED_LOWER_LIMIT){ this.velocity.set(0, 0); }
    this.collider.update(this.position.x, this.position.y);
    //if(this.boundaryCheck()){ this.alive = false; }
  }
  draw(){
    if(!this.alive){ return; }
    fill(this.bodyColor);
    circle(this.position.x, this.position.y, this.radius * 2);
  }
  hit(other){
    // otherとぶつかったときのあれこれ
  }
}

// ---------------------------------------------------------------------------------------- //
// system.

class System{
  constructor(){
    this.balls = new CrossReferenceArray();
    this._qTree = new LinearQuadTreeSpace(AREA_WIDTH, AREA_HEIGHT, 3);
    this._detector = new CollisionDetector();
    this.lines = [];
  }
  addBall(x, y, u, v, r){
    let newBall = ballPool.use();
    newBall.initialize(x, y, u, v, r);
    this.balls.add(newBall);
  }
  addLineWithCoord(a, b, c, d){
    this.lines.push(new BoundaryLine({type:"coord", coord:{a:a, b:b, c:c, d:d}}));
  }
  update(){
    this.balls.loop("update");
  }
  collisionCheck(){
    this._qTree.clear();
    for(let _ball of this.balls){ this._qTree.addActor(_ball); }
    if(!this.balls.length){ return; }
    this._hitTest();
  }
  _hitTest(currentIndex = 0, objList = []){
    // 衝突判定のメインコード。これと、このあとセルごとの下位関数、更にvalidationを追加して一応Systemは完成とする。
  	const currentCell = this._qTree.data[currentIndex];

    // 現在のセルの中と、衝突オブジェクトリストとで
    // 当たり判定を取る。
    this._hitTestInCell(currentCell, objList);

    // 次に下位セルを持つか調べる。
    // 下位セルは最大4個なので、i=0から3の決め打ちで良い。
    let hasChildren = false;
    for(let i = 0; i < 4; i++) {
      const nextIndex = currentIndex * 4 + 1 + i;

      // 下位セルがあったら、
      const hasChildCell = (nextIndex < this._qTree.data.length) && (this._qTree.data[nextIndex] !== null);
      hasChildren = hasChildren || hasChildCell;
      if(hasChildCell) {
        // 衝突オブジェクトリストにpushして、
        objList.push(...currentCell);
        // 下位セルで当たり判定を取る。再帰。
        this._hitTest(nextIndex, objList);
      }
    }
    // 終わったら追加したオブジェクトをpopする。
    if(hasChildren) {
      const popNum = currentCell.length;
      for(let i = 0; i < popNum; i++) {
        objList.pop();
      }
    }
  }
  _hitTestInCell(cell, objList) {
    // セルの中。総当たり。
    const length = cell.length;
    const cellColliderCahce = new Array(length); // globalColliderのためのキャッシュ。
    if(length > 0){ cellColliderCahce[0] = cell[0].collider; }

    for(let i = 0; i < length - 1; i++){
      const obj1 = cell[i];
      const collider1  = cellColliderCahce[i]; // キャッシュから取ってくる。
      for(let j = i + 1; j < length; j++){
        const obj2 = cell[j];

        // キャッシュから取ってくる。
        // ループ初回は直接取得してキャッシュに入れる。
        let collider2;
        if(i === 0) {
          collider2 = obj2.collider;
          cellColliderCahce[j] = collider2;
        }else{
          collider2 = cellColliderCahce[j];
        }
        // Cahceへの代入までスルーしちゃうとまずいみたい
        const hit = this._detector.detectCollision(collider1, collider2);

        if(hit) {
          if(obj1.alive && obj2.alive){
            perfectCollision(obj1, obj2);
            obj1.hit(obj2);
            obj2.hit(obj1);
          }
        }
      }
    }

    // 衝突オブジェクトリストと。
    const objLength = objList.length;
    const cellLength = cell.length;

    // これはもう最初に一通りobjListとcellをさらってplayerもenemyもいなければそのままスルー・・
    for(let i = 0; i < objLength; i++) {
      const obj = objList[i];
      const collider1 = obj.collider; // 直接取得する。
      for(let j = 0; j < cellLength; j++) {
        const cellObj = cell[j];

        const collider2 = cellColliderCahce[j]; // キャッシュから取ってくる。
        const hit = this._detector.detectCollision(collider1, collider2);

        if(hit) {
          if(obj.alive && cellObj.alive){
            perfectCollision(obj, cellObj);
            obj.hit(cellObj);
            cellObj.hit(obj);
          }
        }
      }
    }
  }
  remove(){
    this.balls.loopReverse("remove"); // リムーブは逆から。
  }
  draw(){
    this.balls.loop("draw");
    for(const l of this.lines){ l.draw(); }
  }
}

// ここからしばらく衝突判定関連
// ---------------------------------------------------------------------------------------- //
// quadTree関連。
class LinearQuadTreeSpace {
  constructor(_width, _height, level){
    this._width = _width;
    this._height = _height;
    this.data = [null];
    this._currentLevel = 0;

    // 入力レベルまでdataを伸長する。
    while(this._currentLevel < level){
      this._expand();
    }
  }

  // dataをクリアする。
  clear() {
    this.data.fill(null);
  }

  // 要素をdataに追加する。
  // 必要なのは、要素と、レベルと、レベル内での番号。
  _addNode(node, level, index){
    // オフセットは(4^L - 1)/3で求まる。
    // それにindexを足せば線形四分木上での位置が出る。
    const offset = ((4 ** level) - 1) / 3;
    const linearIndex = offset + index;

    // もしdataの長さが足りないなら拡張する。
    while(this.data.length <= linearIndex){
      this._expandData();
    }

    // セルの初期値はnullとする。
    // しかし上の階層がnullのままだと面倒が発生する。
    // なので要素を追加する前に親やその先祖すべてを
    // 空配列で初期化する。
    let parentCellIndex = linearIndex;
    while(this.data[parentCellIndex] === null){
      this.data[parentCellIndex] = [];

      parentCellIndex = Math.floor((parentCellIndex - 1) / 4);
      if(parentCellIndex >= this.data.length){
        break;
      }
    }

    // セルに要素を追加する。
    const cell = this.data[linearIndex];
    cell.push(node);
  }

  // Actorを線形四分木に追加する。
  // Actorのコリジョンからモートン番号を計算し、
  // 適切なセルに割り当てる。
  addActor(actor){
    const collider = actor.collider;

    // モートン番号の計算。
    const leftTopMorton = this._calc2DMortonNumber(collider.left, collider.top);
    const rightBottomMorton = this._calc2DMortonNumber(collider.right, collider.bottom);

    // 左上も右下も-1（画面外）であるならば、
    // レベル0として扱う。
    // なおこの処理には気をつける必要があり、
    // 画面外に大量のオブジェクトがあるとレベル0に
    // オブジェクトが大量配置され、当たり判定に大幅な処理時間がかかる。
    // 実用の際にはここをうまく書き換えて、あまり負担のかからない
    // 処理に置き換えるといい。
    if(leftTopMorton === -1 && rightBottomMorton === -1){
      this._addNode(actor, 0, 0);
      return;
    }

    // 左上と右下が同じ番号に所属していたら、
    // それはひとつのセルに収まっているということなので、
    // 特に計算もせずそのまま現在のレベルのセルに入れる。
    if(leftTopMorton === rightBottomMorton){
      this._addNode(actor, this._currentLevel, leftTopMorton);
      return;
    }

    // 左上と右下が異なる番号（＝境界をまたいでいる）の場合、
    // 所属するレベルを計算する。
    const level = this._calcLevel(leftTopMorton, rightBottomMorton);

    // そのレベルでの所属する番号を計算する。
    // モートン番号の代表値として大きい方を採用する。
    // これは片方が-1の場合、-1でない方を採用したいため。
    const larger = Math.max(leftTopMorton, rightBottomMorton);
    const cellNumber = this._calcCell(larger, level);

    // 線形四分木に追加する。
    this._addNode(actor, level, cellNumber);
  }
  // addActorsは要らない。個別に放り込む。

  // 線形四分木の長さを伸ばす。
  _expand(){
    const nextLevel = this._currentLevel + 1;
    const length = ((4 ** (nextLevel + 1)) - 1) / 3;

    while(this.data.length < length) {
      this.data.push(null);
    }

    this._currentLevel++;
  }

  // 16bitの数値を1bit飛ばしの32bitにする。
  _separateBit32(n){
    n = (n|(n<<8)) & 0x00ff00ff;
    n = (n|(n<<4)) & 0x0f0f0f0f;
    n = (n|(n<<2)) & 0x33333333;
    return (n|(n<<1)) & 0x55555555;
  }

  // x, y座標からモートン番号を算出する。
  _calc2DMortonNumber(x, y){
    // 空間の外の場合-1を返す。
    if(x < 0 || y < 0){
      return -1;
    }

    if(x > this._width || y > this._height){
      return -1;
    }

    // 空間の中の位置を求める。
    const xCell = Math.floor(x / (this._width / (2 ** this._currentLevel)));
    const yCell = Math.floor(y / (this._height / (2 ** this._currentLevel)));

    // x位置とy位置をそれぞれ1bit飛ばしの数にし、
    // それらをあわせてひとつの数にする。
    // これがモートン番号となる。
    return (this._separateBit32(xCell) | (this._separateBit32(yCell)<<1));
  }

  // オブジェクトの所属レベルを算出する。
  // XORを取った数を2bitずつ右シフトして、
  // 0でない数が捨てられたときのシフト回数を採用する。
  _calcLevel(leftTopMorton, rightBottomMorton){
    const xorMorton = leftTopMorton ^ rightBottomMorton;
    let level = this._currentLevel - 1;
    let attachedLevel = this._currentLevel;

    for(let i = 0; level >= 0; i++){
      const flag = (xorMorton >> (i * 2)) & 0x3;
      if(flag > 0){
        attachedLevel = level;
      }

      level--;
    }

    return attachedLevel;
  }

  // 階層を求めるときにシフトした数だけ右シフトすれば
  // 空間の位置がわかる。
  _calcCell(morton, level){
    const shift = ((this._currentLevel - level) * 2);
    return morton >> shift;
  }
}

// ---------------------------------------------------------------------------------------- //
// collider関連。
// 今回は全部円なので円判定のみ。
// unitの場合は最初に作ったものをinitializeや毎フレームのアップデートで変えていく感じ（余計に作らない）
// 衝突判定のタイミングはactionの直前、behaviorの直後にする。

class Collider{
	constructor(){
		this.type = "";
    this.index = Collider.index++;
	}
}

Collider.index = 0;

// circle.
// 今のinFrameの仕様だと端っこにいるときによけられてしまう、これは大きくなるとおそらく無視できないので、
// レクトと画面との共通を取った方がよさそう。その理屈で行くとプレイヤーが端っこにいるときにダメージ受けないはずだが、
// プレイヤーは毎フレーム放り込んでたので問題が生じなかったのでした。
// たとえば今の場合、敵が体の半分しか出てない時に倒せない。
// leftとtopは0とMAX取る。これらは<AREA_WIDTHかつ<AREA_HEIGHTでないといけない。
// rightとbottomはそれぞれw-1とh-1でMIN取る。これらは>0でないといけない。
class CircleCollider extends Collider{
	constructor(x, y, r){
    super();
		this.type = "circle";
		this.x = x;
		this.y = y;
		this.r = r;
	}
	get left(){ return Math.max(0, this.x - this.r); }
	get right(){ return Math.min(AREA_WIDTH - 1, this.x + this.r); }
	get top(){ return Math.max(0, this.y - this.r); }
	get bottom(){ return Math.min(AREA_HEIGHT - 1, this.y + this.r); }
  inFrame(){
    // trueを返さなければTreeには入れない。
    const flag1 = (this.left < AREA_WIDTH && this.top < AREA_HEIGHT);
    const flag2 = (this.right > 0 && this.bottom > 0);
    return flag1 && flag2;
  }
	update(x, y, r = -1){
		this.x = x;
		this.y = y;
		if(r > 0){ this.r = r; } // rをupdateしたくないときは(x, y)と記述してくださいね！それでスルーされるので！
	}
}

class CollisionDetector {
  // 当たり判定を検出する。
  detectCollision(collider1, collider2) {
    if(collider1.type == 'circle' && collider2.type == 'circle'){
      return this.detectCircleCollision(collider1, collider2);
    }
		return false;
  }
  // 円形同士
  detectCircleCollision(circle1, circle2){
    const distance = Math.sqrt((circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2);
    const sumOfRadius = circle1.r + circle2.r;
    return (distance < sumOfRadius);
  }
}

// ---------------------------------------------------------------------------------------- //
// Cross Reference Array.

class CrossReferenceArray extends Array{
	constructor(){
    super();
	}
  add(element){
    this.push(element);
    element.belongingArray = this; // 所属配列への参照
  }
  addMulti(elementArray){
    // 複数の場合
    elementArray.forEach((element) => { this.add(element); })
  }
  remove(element){
    let index = this.indexOf(element, 0);
    this.splice(index, 1); // elementを配列から排除する
  }
  loop(methodName){
		if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
		for(let i = 0; i < this.length; i++){
			this[i][methodName]();
		}
  }
	loopReverse(methodName){
		if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
		for(let i = this.length - 1; i >= 0; i--){
			this[i][methodName]();
		}
  }
	clear(){
		this.length = 0;
	}
}

// ---------------------------------------------------------------------------------------- //
// ObjectPool.
// どうやって使うんだっけ・・

class ObjectPool{
	constructor(objectFactory = (() => ({})), initialCapacity = 0){
		this.objPool = [];
		this.nextFreeSlot = null; // 使えるオブジェクトの存在位置を示すインデックス
		this.objectFactory = objectFactory;
		this.grow(initialCapacity);
	}
	use(){
		if(this.nextFreeSlot == null || this.nextFreeSlot == this.objPool.length){
		  this.grow(this.objPool.length || 5); // 末尾にいるときは長さを伸ばす感じ。lengthが未定義の場合はとりあえず5.
		}
		let objToUse = this.objPool[this.nextFreeSlot]; // FreeSlotのところにあるオブジェクトを取得
		this.objPool[this.nextFreeSlot++] = EMPTY_SLOT; // その場所はemptyを置いておく、そしてnextFreeSlotを一つ増やす。
		return objToUse; // オブジェクトをゲットする
	}
	recycle(obj){
		if(this.nextFreeSlot == null || this.nextFreeSlot == -1){
			this.objPool[this.objPool.length] = obj; // 図らずも新しくオブジェクトが出来ちゃった場合は末尾にそれを追加
		}else{
			// 考えづらいけど、this.nextFreeSlotが0のときこれが実行されるとobjPool[-1]にobjが入る。
			// そのあとでrecycleが発動してる間は常に末尾にオブジェクトが増え続けるからFreeSlotは-1のまま。
			// そしてuseが発動した時にその-1にあったオブジェクトが使われてそこにはEMPTY_SLOTが設定される
			this.objPool[--this.nextFreeSlot] = obj;
		}
	}
	grow(count = this.objPool.length){ // 長さをcountにしてcount個のオブジェクトを追加する
		if(count > 0 && this.nextFreeSlot == null){
			this.nextFreeSlot = 0; // 初期状態なら0にする感じ
		}
		if(count > 0){
			let curLen = this.objPool.length; // curLenはcurrent Lengthのこと
			this.objPool.length += Number(count); // countがなんか変でも数にしてくれるからこうしてるみたい？"123"とか。
			// こうするとかってにundefinedで伸ばされるらしい・・長さプロパティだけ増やされる。
			// 基本的にはlengthはpushとか末尾代入（a[length]=obj）で自動的に増えるけどこうして勝手に増やすことも出来るのね。
			for(let i = curLen; i < this.objPool.length; i++){
				// add new obj to pool.
				this.objPool[i] = this.objectFactory();
			}
			return this.objPool.length;
		}
	}
	size(){
		return this.objPool.length;
	}
}

// ---------------------------------------------------------------------------------------- //
// Boundary Line.

class BoundaryLine{
  constructor(positionData){
    // 判定関数を作るのに指定方法をいろいろ変える感じ。
    this.createDistFunction(positionData);
  }
  createDistFunction(data){
    switch(data.type){
      case "coord":
        const {a, b, c, d} = data.coord; // (a, b), (c, d)を通る直線～
        // (a, b)から(c, d)に向かうベクトルを反時計回りに回した方向の領域に入ってるか調べる感じ。
        this.createDistFunctionWithCoord(a, b, c, d);
        break;
      case "pole":
        const {pa, pb} = data.point;
        const direction = data.direction;
        // (a, b)から（canvasの座標系で）directionの方向、で、その角度が増加する方向の領域に入ってるか調べる。
        const s = pa + cos(direction);
        const t = pb + sin(direction);
        this.createDistFunctionWithCoord(pa, pb, pa + cos(direction), pb + sin(direction));
        break;
    }
  }
  createDistFunctionWithCoord(a, b, c, d){
    const l = b - d;
    const m = c - a;
    const det = a * d - b * c;
    const factor = 1.0 / sqrt(l * l + m * m);
    this.getDist = (_ball) => {
      const {x, y} = _ball.position;
      return factor * (l * x + m * y + det); // もう単純に中心と直線の距離。（もちろん符号付き・・正の時に指定領域）
    }
    this.normal = createVector(b - d, c - a).normalize();
    this.getBoundaryPoints(a, b, c, d);
  }
  getBoundaryPoints(a, b, c, d){
    // 直線を引く際のポイントを確保する。(a, b)から(c, d)方向か逆方向に伸びていって外れたところで止める感じ。
    const direction = atan2(d - b, c - a);
    const u = (AREA_WIDTH + AREA_HEIGHT) * cos(direction);
    const v = (AREA_WIDTH + AREA_HEIGHT) * sin(direction);
    this.boundary = {a:a + u, b:b + v, c:a - u, d:b - v};
  }
  draw(){
    stroke(255);
    const {a, b, c, d} = this.boundary;
    line(a, b, c, d);
    noStroke();
  }
}

// segment.
// まず両端点と太さの情報が必要で、その上でそれらの動かし方を指定する感じ。
// 回転の場合は中心の座標が固定でそこからの距離で接触部分の円の速度を決める。
// 平行移動の場合は全部同じ速度。
// いずれの場合も毎フレーム両端点の位置座標を更新してそれにより衝突判定を行う。
// 衝突判定は線分との距離関数を使う。円の方を後退させて接点を見て位置により円を出現させて衝突演算処理。
// 位置と速度と半径とmassFactor(∞)さえあれば計算に使えるので問題なし。

// どこで引っかかっているかというと位置ベースの移動だと速度がどうしようみたいなあれ。
// じゃああれ、まず位置ベース平行移動。これは端点の前の位置との距離を調べてそこから割り出す。全部一緒。
// 次に回転。これは回転角速度と中心からの距離を使う。
// というわけで、速度は必要ないという方向で・・行こう。
// イージングなどで不規則な移動をさせる場合は回転と組み合わせずあくまでも平行移動に制限することで速度の計算を容易にする仕組み。

// 端点動かすだけでいいんじゃない・・プロポーション使えば各点に存在する仮想円の動きから各部の速度出せるしもうそれでいいよもう。
// 接点で接線引いてそれで反射させる。壁みたいに。以上。
// あ、動くんだっけ？速度を持ってるからそれを考慮する・・普通に計算してあと速度足せばいいよ。普通に反射で計算したうえで、速度を足す。
// 接点出してプロポーション出して直前の位置と比較して算出した速度を反射で計算した速度に足して新しい速度とする。
// 壁みたいに動かなければそこは0だから普通の反射になる。以上。点の動かし方は別途考える。

// colliderはサークルで中点と長さの半分を使ってやる・・
class Segment{
  constructor(){
    this.collider = new CircleCollider();
  }
  initialize(a, b, c, d, w){
    this.p1 = createVector(a, b);
    this.p2 = createVector(c, d);
    this.weight = w; // strokeWeightは円の直径なので半分にすることで円形のcolliderとする。
    this.collider.update((a + c) * 0.5, (b + d) * 0.5, dist(a, b, c, d) * 0.5 + w * 0.5);
  }
}

// ---------------------------------------------------------------------------------------- //
// functions for collide.

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

// ---------------------------------------------------------------------------------------- //
// KeyAction.

function keyTyped(){
  if(key === 'p'){
    if(isLoop){ noLoop(); isLoop = false; return; }
    else{ loop(); isLoop = true; return; }
  }else if(key === 'i'){
    if(showInfo){ showInfo = false; return; }
    else{ showInfo = true; return; }
  }
}
