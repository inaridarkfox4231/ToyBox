// p5関数使って見た：https://p5js.org/reference/#/p5/p5

// idをスケッチ内で設定しています。
// それによりdocument.getElementByIdでDOM要素を特定しそれを排除、その上でp5の要素を出現させていますね。
// ちなみにこの削除をしないとスケッチがどんどんたまっていってしまう（そういう仕組みらしい）。
// でもこれp5作るときの指定の仕方でなんとか・・ならないか。うーん、まあでも消してどうにかなるならそれでいいか（適当）。
// あと便利そうだからリンク張った。
// 自動的に別タブで開くようにしといた。でないとスケッチが壊れちゃうみたいだから（戻ろうとしたらおかしなことになった）。
// それに普通は別タブで開くでしょ。手間が省けていいよね。

// コンスタントもpで紐付けしないとなのか・・でもまあ便利よね。
// つまりあれ、p5のあれこれってみんなグローバルだから、通常のスケッチで書く時の独自のグローバル、
// もしくはjs備え付けのグローバルとごっちゃになっちゃうでしょ、
// それを防ぎたいんじゃないかなぁ・・（想像）

const s1 = p => {
  let x = 160;
  let y = 100;

  p.setup = function() {
    let cnv = p.createCanvas(640, 480);
		cnv.id("sketch_1");
		p.rectMode(p.CENTER);
		p.textSize(20);
		let rf = p.createA("https://p5js.org/reference/#/p5/p5", "reference: function p5()");
		rf.position(50, 280);
		rf.style("color", "skyblue");
		rf.style("font-size", "20px");
		rf.attribute("target", "_blank");
  };

  p.draw = function() {
    p.background(0);
		p.fill(0, 128, 255);
    p.rect(x + 40 * p.sin(p.frameCount * 0.1), y, 50, 50);
		p.fill(255);
		p.text("エンターキーを押すともう一つのスケッチに切り替わります。", 50, 200);
		p.text("Press enter key. Then, alternative sketch will be activate.", 50, 250);
  };
};

const s2 = p => {
  let x = 480;
  let y = 100;

  p.setup = function() {
    let cnv = p.createCanvas(640, 480);
		cnv.id("sketch_2");
		p.rectMode(p.CENTER);
		p.textSize(20);
		let rf = p.createA("https://p5js.org/reference/#/p5/p5", "reference: function p5()");
		rf.position(50, 280);
		rf.style("color", "khaki");
		rf.style("font-size", "20px");
		rf.attribute("target", "_blank");
  };

  p.draw = function() {
    p.background(0);
		p.fill(255, 127, 0);
    p.rect(x + 40 * p.cos(p.frameCount * 0.1), y, 50, 50);
		p.fill(255);
		p.text("スペースキーを押すともう一つのスケッチに切り替わります。", 50, 200);
		p.text("Press space key. Then, alternative sketch will be activate.", 50, 250);
  };
};

new p5(s1); // invoke p5.

document.addEventListener("keydown", function(e){
	if(e.keyCode === 13){
		document.getElementById("sketch_1").remove(); // やった！これで消せる！でもidって設定できないんかな・・
		new p5(s2);
	}
	if(e.keyCode === 32){
		document.getElementById("sketch_2").remove();
		new p5(s1);
	}
})
