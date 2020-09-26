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

// 数から解放された。
// これで自由に追加できるようになった。何でもありだ。
// もはやアクティブとかノンアクティブの色に意味はないから統一しちゃおう（いちいち考えるの面倒）。

// メインスケッチでツイート画像をすべて読み込んで、
// ツイート見せるフラグが立っているときに、
// あ、そうか、画像専門のスケッチを立ち上げればいいのか。なんだ。

// 画像だけでいいよ・・・リンクはだめ。ブロックされる。スケッチへのリンクならいいけどまあ変更とかするしな。

const nonActiveButtonColor = "lemonchiffon";
const activeButtonColor = "darkorange";
const textBackColor = "khaki";
// スケッチ名
const sketchNames = ["starry", "blue&nbsp;dragon", "flip&nbsp;flop&nbsp;block", "bullet&nbsp;hell", "lets&nbsp;oekaki",
										 "rainbow&nbsp;mosaic", "small&nbsp;fireworks", "bluesky", "minimum&nbsp;hilbert", "RED",
										 "motion&nbsp;of&nbsp;lines"];
const sketchNamesForTitle = Array.from(sketchNames, s => s.replaceAll("&nbsp;", " "));
const CANVAS_LEFT = 100;
const CANVAS_TOP = 0;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

let currentSketchId = -1; // 現在表示中のスケッチ

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
// -------------------------------------------------------------------------------------------------------------------------

const mainSketch = p =>{
	p.setup = () =>{
		p.createCanvas(600, 480);
		let div1 = p.createDiv();
		div1.id("sketchArea");
		div1.position(CANVAS_LEFT, CANVAS_TOP);
		div1.style("width", CANVAS_WIDTH.toString() + "px");
		div1.style("height", CANVAS_HEIGHT.toString() + "px");
		for(let i = 0; i < sketchNames.length; i++){
			const indentX = 45 * Math.floor(i / 10);
			const indentY = 40 * (i % 10);
			createSketchButton({
				id:i,
				name:sketchNames[i],
				x:5 + indentX, y:15 + indentY, w:40, h:30, fontSize:18,
				bgColor:nonActiveButtonColor,
				labelColor:textBackColor
			});
		}
		let div2 = p.createDiv();
		div2.parent(div1);
		div2.id("tweetImg");
		div2.position(0, 0);
		div2.style("width", CANVAS_WIDTH.toString() + "px");
		div2.style("height", CANVAS_HEIGHT.toString() + "px");
		div2.style("display", "none");
		// ツイート画像表示用
		let btn1 = p.createButton("tweet");
		btn1.id("tweetImgButton");
		btn1.position(CANVAS_LEFT + 20, CANVAS_TOP + CANVAS_HEIGHT + 5);
		btn1.style("width", "60px");
		btn1.style("height", "30px");
		btn1.style("font-size", "18px");
	}
	p.draw = () =>{
		p.background(220);
		p.noStroke();
		/*
		p.fill(128);
		p.rect(CANVAS_LEFT, CANVAS_TOP, CANVAS_WIDTH, CANVAS_HEIGHT);
		p.fill(0);
		p.textSize(32);
		p.textAlign(p.CENTER, p.CENTER);
		p.text("no sketch", CANVAS_LEFT + CANVAS_WIDTH * 0.5, CANVAS_TOP + CANVAS_HEIGHT * 0.5);
		*/
		p.textSize(16);
		if(currentSketchId >= 0){
		  p.textAlign(p.CENTER, p.CENTER);
		  p.text(currentSketchId + ". " + sketchNamesForTitle[currentSketchId], CANVAS_LEFT + CANVAS_WIDTH * 0.5, 420);
		}
		p.textAlign(p.LEFT, p.TOP);
		p.text("ボタンをクリックすると該当するスケッチが起動します", 20, 440);
		p.text("他のボタンをクリックするとそのスケッチは中断したところから再開されます", 20, 460);
	}
	function createSketchButton(data){
		let btn = p.createButton(data.id.toString());
		btn.position(data.x, data.y);
		btn.style("width", data.w.toString() + "px");
		btn.style("height", data.h.toString() + "px");
		btn.style("font-size", data.fontSize.toString() + "px");
		btn.style("background", data.bgColor);
		btn.id("sketch_" + data.id + "_btn");
		// 好きなDOM作りたければcreateElementを使いましょう。labelなら自動的に長さに応じた背景色になります。
		let label = p.createElement("label", data.name); // このように半角スペースではなく&nbspにするとうまくいく。
		label.position(30, 5);
		label.style("background", data.labelColor);
		label.style("display", "none");
		label.id("label_" + data.id);
		label.style("z-index", "1"); // こうすると隠れずに表示される！
		label.parent(btn);
	}
}

// 縦横うまく工夫して、imgがどんなあれであっても、適切な範囲に収まるようにする。
// displayのオンオフは別で。
// どんな
const tweetImg = p =>{
	let imgs = [];
	let normalizedWidthArray = [];
	let normalizedHeightArray = [];
	let startXArray = [];
	let startYArray = [];
	p.preload = () => {
		for(let i = 0; i < sketchNames.length; i++){
			imgs.push(p.loadImage("https://inaridarkfox4231.github.io/tweets/tweet" + i.toString() + ".PNG"));
		}
	}
	p.setup = () => {
	  p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
		for(let i = 0; i < imgs.length; i++){
			const img = imgs[i];
			const w = img.width;
		  const h = img.height;
			const normalizeFactor = Math.min(Math.min(CANVAS_WIDTH, w) / w, Math.min(CANVAS_HEIGHT, h) / h);
		  const normalizedWidth = w * normalizeFactor;
		  const normalizedHeight = h * normalizeFactor;
		  normalizedWidthArray.push(normalizedWidth);
		  normalizedHeightArray.push(normalizedHeight);
		  startXArray.push((CANVAS_WIDTH - normalizedWidth) * 0.5);
		  startYArray.push((CANVAS_HEIGHT - normalizedHeight) * 0.5);
		}
	}
	p.draw = () => {
		const id = currentSketchId;
		if(id < 0){ return; }
		const img = imgs[id];
		p.clear();
		p.image(img, startXArray[id], startYArray[id], normalizedWidthArray[id], normalizedHeightArray[id], 0, 0, img.width, img.height);
	}
}

// -------------------------------------------------------------------------------------------------------------------------------

// 以下、スケッチコード。
// クラス名としてmySketchesを設定することで、アクティブになってるスケッチのDOM要素を特定し排除するのに使う。
// sketchAreaのchildでもいいのか？いいのかな・・んー。その方がいいのかどうか。その方がよさそう？ああでもあれ、
// まあ、どっちが柔軟性あるかはおいおい考えるか。

// ああそっか、マージンってそれによって領域の占有状態が決まる場合に指定するんね、基本的には（それはそう）。
// もともと決まってるのおかしいよな・・んー。まあ、戻すか・・・・

// マージンのところの処理完了したみたい。

function prepareSketch(sk, id){
	sk.id("sketch_" + id);
	sk.class("mySketches");
	sk.style("display", "none");
}

let sketchList = [];
let buttonNameList = [];

/*
面倒なのでテンプレート。ほいっ。
sketchList.push((p) =>{
	p.setup = () =>{
		prepareSketch(p.createCanvas(600, 600), id);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[id]){ return; }
	}
})
*/

/*
starry. https://twitter.com/inaba_darkfox/status/1301908261822578688
f=0;
setup=_=>{createCanvas(600, 600);background(0);strokeWeight(2);noFill()}
draw=_=>{background(0,4);translate(300,300);g=min(a=(f%510),510-a);
for(r=8;r<800;r+=4){t=noise(r)*2*PI+2*(r%3);stroke(g,r/4,255-g);
q=20+noise(r+1)*160;arc(0,0,r,r,k=f/q+t,k+0.2)}f++}
*/

sketchList.push((p) =>{
	let f = 0;
	p.setup = () =>{
		prepareSketch(p.createCanvas(600, 600), 0);
		p.background(0);
		p.strokeWeight(2);
		p.noFill();
	}
	p.draw = () =>{
		if(!sketchLoopFlag[0]){ return; }
		p.background(0, 4);
		p.translate(300, 300);
		let g = Math.min(f % 510, 510 - (f % 510));
		for(let r = 8; r < 800; r += 4){
			let t = p.noise(r) * 2 * Math.PI + 2 * (r % 3);
			p.stroke(g, r / 4, 255 - g);
			let q = 20 + p.noise(r + 1) * 160;
			p.arc(0, 0, r, r, f / q + t, f / q + t + 0.2);
		}
		f++;
	}
})

/*
blue dragon: https://twitter.com/inaba_darkfox/status/1296510140867215360
w=640;a=b=320;f=0
setup=_=>{createCanvas(w,w)}
draw=_=>{e=(f&1)*2-1;h=1;while(f>=h){if(!(f&h)&&(f&(h*2))){e+=4}h*=2}s=9*cos(PI*e/4);
t=9*sin(PI*e/4);r=5;while(--r){applyMatrix(0,-1,1,0,0,w);
fill(0,64*r,96*r);
quad(a,b,a,b+t,a+s,b+t,a+s,b)}a+=s;b+=t;f++}
*/

sketchList.push((p) =>{
	let w = 640;
	let a = 320;
	let b = 320;
	let f = 0;
	p.setup = () =>{
		prepareSketch(p.createCanvas(w, w), 1);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[1]){ return; }
		let e = (f & 1) * 2 - 1;
		let h = 1;
		while(f >= h){
			if(!(f & h) && (f & (h * 2))){ e += 4; }
			h *= 2;
		}
		let s = 9 * Math.cos(Math.PI * e / 4);
		let t = 9 * Math.sin(Math.PI * e / 4);
		let r = 5;
		while(--r){
			p.applyMatrix(0, -1, 1, 0, 0, w);
			p.fill(0, 64 * r, 96 * r);
			p.quad(a, b, a, b + t, a + s, b + t, a + s, b);
		}
		a += s;
		b += t;
		f++;
	}
})

/*
flip flop block: https://twitter.com/inaba_darkfox/status/1288084411951353858
g=20;w=g*g;f=0;E=(z)=>{return 16*z*z*(1-z)*(1-z)}
setup=()=>{createCanvas(w,w)}
draw=()=>{background(200);
for(x=-g;x<w;x+=g){for(y=0;y<w;y+=g){v=x+y;if(v%40==0){n=60+g*noise(x,y,0);
h=floor(f/n);z=f/n-h;s=g*E(z);
fill(0,v/2,(h%2==0)*w);rect(x+g-s,y,2*s,g)}}}f++}
*/

sketchList.push((p) =>{
	let g = 20;
	let w = g * g;
	let f = 0;
	let E = (z) => { return 16 * z * z * (1 - z) * (1 - z); }
	p.setup = () =>{
		prepareSketch(p.createCanvas(w, w), 2);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[2]){ return; }
		p.background(200);
		for(let x = -g; x < w; x += g){
			for(let y = 0; y < w; y += g){
				let v = x + y;
				if(v % 40 === 0){
					let n = 60 + g * p.noise(x, y, 0);
					let h = Math.floor(f / n);
					let z = f / n - h;
					let s = g * E(z);
					p.fill(0, v / 2, (h % 2 === 0) * w);
					p.rect(x + g - s, y, 2 * s, g);
				}
			}
		}
		f++;
	}
})

/*
bullet hell: https://twitter.com/inaba_darkfox/status/1296626202543677440
w=600;f=0;g=50;setup=()=>{createCanvas(w,w)}
draw=()=>{background(0);translate(w/2,w/2);i=100;while(i--){n=noise(i);
s=1+n/2;t=g+99*n;p=(f/t)-floor(f/t);
fill(0,w*p,w);
for(c=-1.5;c<2;c++){rect(430*p,g*max(0,1-1/4/p)*c-3*s,8*s,6*s)}rotate(PI/g)}f++}
*/

sketchList.push((p) =>{
	let w = 600;
	let f = 0;
	let g = 50;
	p.setup = () =>{
		prepareSketch(p.createCanvas(w, w), 3);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[3]){ return; }
		p.background(0);
		p.translate(w / 2, w / 2);
		let i = 100;
		while(i--){
			let n = p.noise(i);
			let s = 1 + n / 2;
			let t = g + 99 * n;
			let q = (f / t) - Math.floor(f / t);
			p.fill(0, w * q, w);
			for(let c = -1.5; c < 2; c++){
				p.rect(430 * q, g * Math.max(0, 1 - 1 / (4 * q)) * c - 3 * s, 8 * s, 6 * s);
			}
			p.rotate(Math.PI / g);
		}
		f++;
	}
})

/*
lets oekaki: https://twitter.com/inaba_darkfox/status/1299733450639814657
t="#つぶやきProcessing #pchj03";s="140字以内にコードを収めて レッツお絵かき！";f=g=0
setup=_=>{createCanvas(480,240);fill(0,0,64);rect(10,10,460,220);fill(255);textSize(16)}
draw=_=>{if(t[g]){text(t[g],60+g*16,118);text(s[g],60+g*16,138)}else{noLoop()}f++;if(f%4==0){g++}}
*/

sketchList.push((p) =>{
	let t = "#つぶやきProcessing #pchj03";
	let s = "140字以内にコードを収めて レッツお絵かき！";
	let f = 0;
	let g = 0;
	p.setup = () =>{
		prepareSketch(p.createCanvas(480, 240), 4);
		p.fill(0, 0, 64);
		p.rect(10, 10, 460, 220);
		p.fill(255);
		p.textSize(16);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[4]){ return; }
		if(t[g]){
			p.text(t[g], 60 + g * 16, 118);
			p.text(s[g], 60 + g * 16, 138);
		}else{
			p.noLoop();
		}
		f++;
		if(f % 4 == 0){ g++; }
	}
})

/*
rainbow mosaic: https://twitter.com/inaba_darkfox/status/1282696865666887680
x=200;z=10;y=x+z;u=0;v=-1;R=()=>{w=u;u=v;v=-w};f=0;g=h=1
setup=()=>{createCanvas(400,400);colorMode(HSB,100);noStroke()}
draw=()=>{fill(80-floor(f/16),(f*h)%100,100-(h%10));square(x,y,z);x+=u*z;y+=v*z;if(f==g){R();g+=1+floor((h++)/2)}f++;if(y==400){noLoop()}}
*/
sketchList.push((p) => {
	let x = 200;
	let z = 10;
	let y = x + z;
	let u = 0;
	let v = -1;
	let R = () => {w = u; u = v; v = -w;};
	let f = 0;
	let g = 1;
	let h = 1;
	p.setup = () =>{
		prepareSketch(p.createCanvas(400, 400), 5);
		p.colorMode(p.HSB, 100);
		p.noStroke();
	}
	p.draw = () =>{
		if(!sketchLoopFlag[5]){ return; }
		p.fill(80 - Math.floor(f / 16), (f * h) % 100, 100 - (h % 10));
		p.square(x, y, z);
		x += u * z;
		y += v * z;
		if(f == g){
			R();
			g += 1 + Math.floor((h++) / 2)
		}
		f++;
		if(y === 400){ p.noLoop(); }
	}
})

/*
small fireworks: https://twitter.com/inaba_darkfox/status/1303866995285262336
f=0;r=[]
setup=_=>{createCanvas(400,400);noStroke()}
draw=_=>{if(f%60==0){c=198;while(c--){r[c]=random()}}background(0);
translate(200,200);
n=198;g=(f%60)/60;fill(255,99,0,255*(1-pow(g,3)));
while(n--){rotate(PI/99);circle(200*sqrt(1-r[n]*r[n])*g,0,5)}f++}
*/

sketchList.push((p) =>{
	let f = 0;
	let r = [];
	p.setup = () =>{
		prepareSketch(p.createCanvas(400, 400), 6);
		p.noStroke();
	}
	p.draw = () =>{
		if(!sketchLoopFlag[6]){ return; }
		if(f % 60 === 0){
			let c = 198;
			while(c--){
				r[c] = p.random();
			}
		}
		p.background(0);
		p.translate(200, 200);
		let n = 198;
		let g = (f % 60) / 60;
		p.fill(255, 99, 0, 255 * (1 - Math.pow(g, 3)));
		while(n--){
			p.rotate(Math.PI / 99);
			p.circle(200 * Math.sqrt(1 - r[n] * r[n]) * g, 0, 5);
		}
		f++;
	}
})

/*
bluesky: https://twitter.com/inaba_darkfox/status/1233765773815861255
x=0;
function setup(){ colorMode(HSB, 100); createCanvas(400,400); noStroke(); }
function draw(){for(let i = 0;i < 400;i++){fill(55, 100 - i / 4, 100); rect(0, i,400,1);
}
fill(0,0,100); x++;
ellipse(x%600-100,80,80,30);
ellipse((x*1.3)%600-100,160,120,50);
}
*/

sketchList.push((p) =>{
	let x = 0;
	p.setup = () =>{
		prepareSketch(p.createCanvas(400, 400), 7);
		p.colorMode(p.HSB, 100);
		p.noStroke();
	}
	p.draw = () =>{
		if(!sketchLoopFlag[7]){ return; }
		for(let i = 0; i < 400; i++){
			p.fill(55, 100 - i / 4, 100);
			p.rect(0, i, 400, 1);
		}
		p.fill(0, 0, 100); x++;
		p.ellipse(x % 600 - 100, 80, 80, 30);
		p.ellipse((x * 1.3) % 600 - 100, 160, 120, 50);
	}
})

/*
minimum hilbert: https://twitter.com/inaba_darkfox/status/1289344187121336320
x=y=[];a=b=i=8
T=(a,b,c,d,e)=>[a,c,b,d,b,e,a.map(u=>-u)].reduce((s,t)=>s.concat(t))
setup=()=>{createCanvas(w=650,w);while(--i>0){u=T(y,x,0,1,0);y=T(x,y,1,0,-1);x=u}stroke(0,128,255)}
draw=()=>{r=9;while(r--){line(a,b,a+=5*x[i],b+=5*y[i++])}}
*/

sketchList.push((p) =>{
	let x = [];
	let y = [];
	let a = 8;
	let b = 8;
	let i = 8;
	let T = (f, g, c, d, e) => [f, c, g, d, g, e, f.map(u => -u)].reduce((s, t) => s.concat(t));
	p.setup = () =>{
		prepareSketch(p.createCanvas(650, 650), 8);
		while(--i > 0){
			let z = T(y, x, 0, 1, 0);
			y = T(x, y, 1, 0, -1);
			x = z;
		}
		p.stroke(0, 128, 255);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[8]){ return; }
		let r = 9;
		while(r--){
			p.line(a, b, a += 5 * x[i], b += 5 * y[i++]);
		}
	}
})

/*
RED: https://twitter.com/inaba_darkfox/status/1241444729230725120
let x = 0, y = 0, u = 0, v = 0;
function setup(){
	createCanvas(480, 640);
	background(0);
	stroke(255, 0, 0);
	strokeWeight(2.0);
}

function draw(){
  background(0, 0, 0, 3);
	u = random(0, width);
	v = random(0, height);
	line(x, y, u, v);
	x = u;
	y = v;
}
*/

sketchList.push((p) =>{
	let x = 0;
	let y = 0;
	let u = 0;
	let v = 0;
	p.setup = () =>{
		prepareSketch(p.createCanvas(480, 640), 9);
		p.background(0);
		p.stroke(255, 0, 0);
		p.strokeWeight(2.0);
	}
	p.draw = () =>{
		if(!sketchLoopFlag[9]){ return; }
		p.background(0, 0, 0, 3);
		let u = p.random(0, p.width);
		let v = p.random(0, p.height);
		p.line(x, y, u, v);
		x = u;
		y = v;
	}
})

/*
motion of lines: https://twitter.com/inaba_darkfox/status/1283815290040537088
s=256;k=s*2;t=0;f=()=>{}
setup=()=>{createCanvas(k,k);f=(z,u,j)=>{z=z%360;a=1-pow(max(0,1-z/120),5);b=max(0,pow(z/120-2,5));
stroke(j*s,u,s,(a-b)*s);line(b*k,u*2,a*k,u*2);
line(u*2,b*k,u*2,a*k)}}
draw=()=>{background(0);for(u=0;u<=s;u+=8){f(t+u,u,t%720>360)}t++}
*/

sketchList.push((p) =>{
	let s = 256;
	let k = s * 2;
	let t = 0;
	let f = () => {};
	p.setup = () =>{
		prepareSketch(p.createCanvas(k, k), 10);
		f = (z, u, j) => {
			z = z % 360;
			let a = 1 - Math.pow(Math.max(0, 1 - z / 120), 5);
			let b = Math.max(0, Math.pow(z / 120 - 2, 5));
			p.stroke(j * s, u, s, (a - b) * s);
			p.line(b * k, u * 2, a * k, u * 2);
			p.line(u * 2, b * k, u * 2, a * k);
		}
	}
	p.draw = () =>{
		if(!sketchLoopFlag[10]){ return; }
		p.background(0);
		for(let u = 0; u <= s; u += 8){
			f(t + u, u, t % 720 > 360);
		}
		t++;
	}
})

// ---------------------------------------------------------------------------------------------------------------------------------- //

for(let i = 0; i < sketchList.length; i++){ buttonNameList[i] = "sketch_" + i + "_btn"; }

let sketchLoopFlag = new Array(sketchList.length);
sketchLoopFlag.fill(false);
tweetShowFlag = false; // ボタンでオンオフ切り替える。

new p5(mainSketch);
new p5(tweetImg, "tweetImg");
for(let sketch of sketchList){ new p5(sketch, "sketchArea"); }

// イベントリスナーでターゲットがボタンになってるときに、そのidに応じた処理を書けばいいのね。
// これでうまくいく・・ああ、勉強不足ね。
// 文字列操作最強やな

// クリックで一旦すべてのボタン色をリセットしつつ、
// 該当ボタンの色が変わるようにしたい。
document.addEventListener("click", (e) => {
	const targetId = e.target.id;
	// ツイートのオンオフボタンの場合はそれ切り替えてさようならする。
	// フラグはもう要らない。cssを直接取得すればいいので。
	if(targetId === "tweetImgButton"){
		if(currentSketchId < 0){ return; }
		let tweetImg = document.getElementById("tweetImg");
		const tweetImgCss = getComputedStyle(tweetImg, null);
		const state = tweetImgCss.getPropertyValue("display");
		if(state === "none"){ tweetImg.style.display = "block"; }else{ tweetImg.style.display = "none"; }
		return;
	}
	// 以下、スケッチ切り替えボタンの場合。
	if(buttonNameList.includes(targetId)){
		for(let i = 0; i < sketchLoopFlag.length; i++){
			if(sketchLoopFlag[i]){
				document.getElementById("sketch_" + i).style.display = "none";
				document.getElementById("sketch_" + i + "_btn").style.background = nonActiveButtonColor;
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
		document.getElementById("sketch_" + sketchId + "_btn").style.background = activeButtonColor;
		currentSketchId = sketchId;
	}
})

// ラベルの表示/非表示だけやる
// マウスオーバーとは
document.addEventListener("mouseover", (e) => {
	const targetId = e.target.id;
	if(buttonNameList.includes(targetId)){
		const sketchId = Number(targetId.split("_")[1]);
		if(isNaN(sketchId)){ return; }
		document.getElementById("label_" + sketchId).style.display = "block";
	}
}, false)

// マウスリーブとは
// マウスアウト？？
document.addEventListener("mouseout", (e) => {
	const targetId = e.target.id;
	if(buttonNameList.includes(targetId)){
		const sketchId = Number(targetId.split("_")[1]);
		if(isNaN(sketchId)){ return; }
		document.getElementById("label_" + sketchId).style.display = "none";
	}
}, false)
