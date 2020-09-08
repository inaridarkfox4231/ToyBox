// メインスケッチをひとつ用意して、その中にdiv領域を作り、
// 別のスケッチをそこに表示する感じの何か。
// いろいろ使えそう。

// 使うかどうか知らないけどパレット。あった方がいいかもしれないので。分からないけど。
// 便利！！！

// もうちょっと実験が必要。

// 今のコードだといちいちリセットしちゃうんだけどね。
// リセットせずに途中からスタートみたいなこともできるはずで。
// つまり、noLoop()して、displayをnoneにして、あとで解除みたいな。
// それには外部からdisplayのnoneとblockを切り替えつつ、
// さらにloopするかいなかの外部変数をいじればいい。それでいけるはず。要はdrawを実行するかどうかでしょ・・多分。
// それでremoveは必要なくなるはず。純粋なスケッチである必要はあるけど。
// とりあえず今回はremovingでいいです。

// というわけで色々うまくいきました万歳。
// しかしこれで終わりではなくて・・・じゃあ、displayいじろうかなと。

// 簡単すぎた・・・・
// 最初に親と一緒にまとめてすべてのスケッチを作ってしまう。
// それらはdisplay:"none"で隠しておく。さらにすべてloopのフラグをオフにしておく。何も起きない。
// すべてメインスケッチの中に作ったDIV要素の子要素に置いておく。
// そして、ボタンをクリックしない限り何も起きないようにする。
// ボタンを押したら該当するパターンが動き出す仕組み。
// その際違うパターンがアクティブな場合、それに関してはdisplayをnoneにしてループフラグをオフにする。
// で、新しいパターンがフラグオンで動き出す、それについてはdisplayをblockに戻す。以上・・かな。

// という仕組みなので、他のスケッチに移動するとフレームカウントが途中から始まる感じになる。それも出すか。

// おけおけ。キャンバスのサイズに応じてスケッチのリサイズできるようになったぜ。
// これでスケッチがどんな形でも、見合ったサイズに自動的に変形する。
// だから、たとえばウィンドウのサイズを取得してそれに見合った形にしたりとかできる。
// 今までだとそういうのいちいちいじらないといけなかったけど、
// これからはそういうこと気にしないで、メインキャンバスをブラウザ情報に基づいて用意して、そこにハマるようにスケッチを
// おいて、みたいな感じにできるってわけなのね。やったー。
// はぁ、自由に書けるわけだ・・嬉しい。

// リサイズ完了しました。
// これからはサイズに合った作品作れるね。嬉しいね。

// まあ、ワンクッション置かないと無理だけど・・ノードとかできてからでないと。そこら辺あれだけど。

// もしくは、スマホならタッチでやると思うけど、あれ、mouseenterでfalseからtrueにする、あれ使ってループを発動させるとか（インチキだけど）
// すればよさそうな。ともかく全部に合わせてサイズいじるのめんどくさいから・・
// つぶやきProcessing程度の軽い（ものによっては重いので注意）やつだったら簡単にまとめられそう。

const activeButtonPalette = ["blue", "orange", "red", "green", "purple"];
const nonActiveButtonPalette = ["skyblue", "khaki", "#f99", "#9f9", "#b8f"];
const CANVAS_LEFT = 100;
const CANVAS_TOP = 0;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

// いわゆるあれ、tween的な「何か」は外に書けるよね。クラス定義も・・んー。
// -------------------------------------------------
// 動きの部分だけ純粋なJavascriptで記述してすべてのスケッチに共通で使用する感じ。
class Move{
	constructor(x, y){
		this.pos = {x:x, y:y};
		this.depart = {x:0, y:0};
		this.dest = {x:0, y:0};
		this.properFrameCount = 0;
		this.span = 0;
		this.moveFunction = () => {};
		this.behaviorArray = [];
		this.behaviorIndex = 0;
	}
	inputBehavior(behaviorArray){
		this.behaviorArray = behaviorArray;
		this.updateBehavior();
	}
	updateBehavior(){
		const {dx, dy, span, func} = this.behaviorArray[this.behaviorIndex];
		this.behaviorIndex = (this.behaviorIndex + 1) % this.behaviorArray.length;
		this.setDest(dx, dy, span, func);
	}
	setDest(dx, dy, span, func){
		this.properFrameCount = 0;
		this.span = span;
		this.moveFunction = func;
		this.depart = {x:this.pos.x, y:this.pos.y};
		this.dest = {x:dx, y:dy};
	}
	setPos(x, y){
		this.pos.x = x;
		this.pos.y = y;
	}
	getPos(){
		return this.pos;
	}
	update(){
		this.moveFunction(this);
		this.properFrameCount++;
		if(this.properFrameCount === this.span){
			this.updateBehavior();
		}
	}
}

function createLineBehavior(dx, dy, span, easingType){
  return {dx:dx, dy:dy, span:span, func:(m) => {
		let prg = m.properFrameCount / span;
		prg = easing(easingType, prg);
		const px = (1 - prg) * m.depart.x + prg * m.dest.x;
		const py = (1 - prg) * m.depart.y + prg * m.dest.y;
		m.setPos(px, py);
	}}
}

// hはdyやdepart.yよりも大きいかもしくは小さい。間（境界含む）だとバグる。注意！
function createParabolaBehavior(dx, dy, span, h){
	return {dx:dx, dy:dy, span:span, func:(m) => {
		let prg = m.properFrameCount / span;
		const s = Math.sqrt((h - dy) / (h - m.depart.y));
		const b = 1 / (1 + s);
		const a = (h - m.depart.y) / (b * b);
		const px = (1 - prg) * m.depart.x + prg * dx;
		const py = h - a * Math.pow(prg - b, 2);
		m.setPos(px, py);
	}}
}

// どこどこ中心に角度を時計回りにspanでangle回転させるやつ。弧度法で。
// スタート位置は固定してね。
function createCircularBehavior(depx, depy, cx, cy, span, diffAngle){
	const r = Math.sqrt(Math.pow(depx - cx, 2) + Math.pow(depy - cy, 2));
	const startAngle = Math.atan2(depy - cy, depx - cx);
	const dx = cx + r * Math.cos(startAngle + diffAngle);
	const dy = cy + r * Math.sin(startAngle + diffAngle);
	return {dx:dx, dy:dy, span:span, func:(m) => {
		let prg = m.properFrameCount / span;
		m.setPos(cx + r * Math.cos(startAngle + prg * diffAngle), cy + r * Math.sin(startAngle + prg * diffAngle));
	}}
}

// イージング
function easing(name, x){
	switch(name){
		case "normal": return x;
		case "easeInQuad": return x * x;
		case "easeOutCirc": return Math.sqrt(x * (2 - x));
	}
}
// -------------------------------------------------

const mainSketch = p =>{
	p.setup = () =>{
		p.createCanvas(600, 480);
		let div1 = p.createDiv();
		div1.id("sketchArea");
		div1.position(CANVAS_LEFT, CANVAS_TOP);
		div1.style("width", CANVAS_WIDTH.toString() + "px");
		div1.style("height", CANVAS_HEIGHT.toString() + "px");
		createSketchButton({name:"sk_0", x:20, y:20, w:60, h:60, fontSize:20, bgColor:nonActiveButtonPalette[0], id:"sketch_0_btn"});
		createSketchButton({name:"sk_1", x:20, y:100, w:60, h:60, fontSize:20, bgColor:nonActiveButtonPalette[1], id:"sketch_1_btn"});
		createSketchButton({name:"sk_2", x:20, y:180, w:60, h:60, fontSize:20, bgColor:nonActiveButtonPalette[2], id:"sketch_2_btn"});
		createSketchButton({name:"sk_3", x:20, y:260, w:60, h:60, fontSize:20, bgColor:nonActiveButtonPalette[3], id:"sketch_3_btn"});
		createSketchButton({name:"sk_4", x:20, y:340, w:60, h:60, fontSize:20, bgColor:nonActiveButtonPalette[4], id:"sketch_4_btn"});
	}
	p.draw = () =>{
		p.background(220);
		p.noStroke();
		p.fill(128);
		p.rect(CANVAS_LEFT, CANVAS_TOP, CANVAS_WIDTH, CANVAS_HEIGHT);
		p.fill(0);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
		p.text("no sketch", CANVAS_LEFT + CANVAS_WIDTH * 0.5, CANVAS_TOP + CANVAS_HEIGHT * 0.5);
		p.textSize(16);
		p.textAlign(p.LEFT, p.TOP);
		p.text("ボタンをクリックすると該当するスケッチが起動します", 20, 420);
		p.text("他のボタンをクリックするとそのスケッチは中断したところから再開されます", 20, 440);
	}
	function createSketchButton(data){
		let btn = p.createButton(data.name);
		btn.position(data.x, data.y);
		btn.style("width", data.w.toString() + "px");
		btn.style("height", data.h.toString() + "px");
		btn.style("font-size", data.fontSize.toString() + "px");
		btn.style("background", data.bgColor);
		btn.id(data.id);
	}
}

// 以下、スケッチコード。
// クラス名としてmySketchesを設定することで、アクティブになってるスケッチのDOM要素を特定し排除するのに使う。
// sketchAreaのchildでもいいのか？いいのかな・・んー。その方がいいのかどうか。その方がよさそう？ああでもあれ、
// まあ、どっちが柔軟性あるかはおいおい考えるか。

// ああそっか、マージンってそれによって領域の占有状態が決まる場合に指定するんね、基本的には（それはそう）。
// もともと決まってるのおかしいよな・・んー。まあ、戻すか・・・・

// マージンのところの処理完了したみたい。

const sketch_0 = p =>{
	let move_0;
	let properFrameCount = 0;
	p.setup = () =>{
		let sk_0 = p.createCanvas(400, 400);
		sk_0.id("sketch_0");
		sk_0.class("mySketches");
		sk_0.style("display", "none");
		// sk_0.style("margin", "20px 20px"); // というわけでmargin指定。こうすると。
		// sk_0.position(20, 20); // こうすると親のDIV要素から20, 20の位置にくる！absoluteだね。
		p.fill(0, 128, 255);
		p.rectMode(p.CENTER);
		move_0 = new Move(100, 100);
		let beh_0 = createLineBehavior(300, 100, 50, "normal");
		let beh_1 = createLineBehavior(300, 300, 50, "easeInQuad");
		let beh_2 = createLineBehavior(100, 300, 50, "normal");
		let beh_3 = createLineBehavior(100, 100, 50, "easeOutCirc");
		move_0.inputBehavior([beh_0, beh_1, beh_2, beh_3]);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[0]){ return; }
		p.background(0);
		move_0.update();
		const pos = move_0.getPos();
		p.rect(pos.x, pos.y, 40, 40);
		properFrameCount++;
		p.text(Math.floor(properFrameCount / 60), 200, 200);
	}
}

const sketch_1 = p =>{
	let move_1;
	let properFrameCount = 0;
	p.setup = () =>{
		let sk_1 = p.createCanvas(400, 400);
		sk_1.id("sketch_1");
		sk_1.class("mySketches");
		sk_1.style("display", "none");
		p.fill(255, 127, 0);
		p.rectMode(p.CENTER);
		move_1 = new Move(80, 300);
		let beh_0 = createParabolaBehavior(160, 300, 60, 150);
		let beh_1 = createParabolaBehavior(240, 300, 60, 150);
		let beh_2 = createParabolaBehavior(320, 300, 60, 150);
		let beh_3 = createParabolaBehavior(200, 300, 60, 90);
		let beh_4 = createParabolaBehavior(80, 300, 60, 90);
		move_1.inputBehavior([beh_0, beh_1, beh_2, beh_3, beh_4]);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[1]){ return; }
		p.background(0);
		move_1.update();
		const pos = move_1.getPos();
		p.rect(pos.x, pos.y, 40, 40);
		properFrameCount++;
		p.text(Math.floor(properFrameCount / 60), 200, 200);
	}
}

const sketch_2 = p =>{
	let move_2;
	let properFrameCount = 0;
	p.setup = () =>{
		let sk_2 = p.createCanvas(400, 400);
		sk_2.id("sketch_2");
		sk_2.class("mySketches");
		sk_2.style("display", "none");
		p.fill(p.color("red"));
		p.rectMode(p.CENTER);
		move_2 = new Move(100, 200);
		let beh_0 = createCircularBehavior(100, 200, 200, 200, 90, 2 * Math.PI);
		let beh_1 = createLineBehavior(300, 300, 90, "easeOutCirc");
		let beh_2 = createParabolaBehavior(100, 200, 60, 80);
		move_2.inputBehavior([beh_0, beh_1, beh_2]);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[2]){ return; }
		p.background(0);
		move_2.update();
		const pos = move_2.getPos();
		p.rect(pos.x, pos.y, 40, 40);
		properFrameCount++;
		p.text(Math.floor(properFrameCount / 60), 200, 200);
	}
}

const sketch_3 = p =>{
	let move_3;
	let properFrameCount = 0;
	p.setup = () =>{
		let sk_3 = p.createCanvas(400, 400);
		sk_3.id("sketch_3");
		sk_3.class("mySketches");
		sk_3.style("display", "none");
		p.fill(p.color("green"));
		p.rectMode(p.CENTER);
		move_3 = new Move(200, 200);
		let behList = [];
		for(let i = 0; i < 8; i++){
			behList.push(createLineBehavior(40 + p.random() * 320, 40 + p.random() * 320, 30, "easeInQuad"));
		}
		behList.push(createLineBehavior(200, 200, 60, "normal"));
		move_3.inputBehavior(behList);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[3]){ return; }
		p.background(0);
		move_3.update();
		const pos = move_3.getPos();
		p.rect(pos.x, pos.y, 40, 40);
		properFrameCount++;
		p.text(Math.floor(properFrameCount / 60), 200, 200);
	}
}

const sketch_4 = p =>{
	let move_4;
	let properFrameCount = 0;
	p.setup = () =>{
		let sk_4 = p.createCanvas(400, 400);
		sk_4.id("sketch_4");
		sk_4.class("mySketches");
		sk_4.style("display", "none");
		p.fill(p.color("purple"));
		p.rectMode(p.CENTER);
		move_4 = new Move(80, 80);
		let behList = [];
		behList.push(createLineBehavior(80, 320, 60, "easeOutCirc"));
		behList.push(createParabolaBehavior(320, 320, 60, 160));
		behList.push(createLineBehavior(320, 80, 60, "easeInQuad"));
		behList.push(createCircularBehavior(320, 80, 200, 80, 60, Math.PI));
		move_4.inputBehavior(behList);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[4]){ return; }
		p.background(0);
		move_4.update();
		const pos = move_4.getPos();
		p.rect(pos.x, pos.y, 40, 40);
		properFrameCount++;
		p.text(Math.floor(properFrameCount / 60), 200, 200);
	}
}

const sketchList = [sketch_0, sketch_1, sketch_2, sketch_3, sketch_4];
const sketchNameList = ["sketch_0_btn", "sketch_1_btn", "sketch_2_btn", "sketch_3_btn", "sketch_4_btn"];
let sketchLoopFlag = new Array(5);
sketchLoopFlag.fill(false);

new p5(mainSketch);
for(let sketch of sketchList){ new p5(sketch, "sketchArea"); }

// イベントリスナーでターゲットがボタンになってるときに、そのidに応じた処理を書けばいいのね。
// これでうまくいく・・ああ、勉強不足ね。
// 文字列操作最強やな
document.addEventListener("click", (e) => {
	const targetId = e.target.id;
	if(sketchNameList.includes(targetId)){
		for(let i = 0; i < sketchLoopFlag.length; i++){
			if(sketchLoopFlag[i]){
				document.getElementById("sketch_" + i).style.display = "none";
				sketchLoopFlag[i] = false;
				break;
			}
		}
		const sketchId = Number(targetId.split("_")[1]);
		let newSketch = document.getElementById("sketch_" + sketchId);
		newSketch.style.display = "block";
		// 以下、大きさ調整。400のところはおいおいいじる。
		// reference:https://lab.syncer.jp/Web/JavaScript/Snippet/41/ これによると、まずgetComputedStyleでcssをまるごと取得し、
		// 次いでそこからgetPropertyValueでcssの値を個別に取得、それを元に表示するときのサイズやマージンを指定していますね。そんだけ。
		const css = getComputedStyle(newSketch, null);
		const w = Number(css.getPropertyValue("width").split("px")[0]);
		const h = Number(css.getPropertyValue("height").split("px")[0]);
		const factor = Math.min(Math.min(w, CANVAS_WIDTH) / w, Math.min(h, CANVAS_HEIGHT) / h);
		const new_w = w * factor;
		const new_h = h * factor;
    newSketch.style.width = new_w.toString() + "px";
    newSketch.style.height = new_h.toString() + "px";
		newSketch.style.margin = (CANVAS_HEIGHT * 0.5 - new_h * 0.5).toString() + "px " + (CANVAS_WIDTH * 0.5 - new_w * 0.5).toString() + "px";
		sketchLoopFlag[sketchId] = true;
	}
})

// マウスオーバーとは
document.addEventListener("mouseover", (e) => {
	const targetId = e.target.id;
	if(sketchNameList.includes(targetId)){
		const sketchId = Number(targetId.split("_")[1]);
		if(isNaN(sketchId)){ return; }
		e.target.style.background = activeButtonPalette[sketchId];
	}
}, false)

// マウスリーブとは
// マウスアウト？？
document.addEventListener("mouseout", (e) => {
	const targetId = e.target.id;
	if(sketchNameList.includes(targetId)){
		const sketchId = Number(targetId.split("_")[1]);
		if(isNaN(sketchId)){ return; }
		e.target.style.background = nonActiveButtonPalette[sketchId];
	}
}, false)
