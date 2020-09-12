// じゃあ作ってみる？？
// TITLE画面辺りから。pythonもそこまでは、やった。そこからは、知らんけど。
// ていうか状態遷移ならフラッピーでやったから知ってるでしょ・・。

// アクションゲームのリフトは要するに・・横ボタンで速度を与えてボタンでジャンプ、で、反発係数はすべて0にする感じ・・かなぁ。プレイヤー側の。
// 重力は常にかかる、とかして。→駄目だった

// まあ、ゲーム作るならまずは状態遷移やな。

// 普段のプログラム作りでもそういうの使いたいんだよほんとは。できないからやってないだけで。・・・。

// ゲーム作るのなんて簡単簡単～だよ～～（ほんとか？？）

// これ思ったんだけど前のステートのポインタを直接渡せばいいんじゃないの。
// infoとか小細工必要ない気がするんだけど・・nameで識別して分岐処理するだけだし。infoだとどんどんプロパティ増やさないといけなくなるし、
// 一部のプロパティだけ抜き出すメリットあんまないと思うんだよね。とりまそこだけ修正。

// こっちやろう。

// ブロック崩しをパドルを使わないで表現する。長さの限界を設けてその範囲でしかあれしないようにするとか。
// 今までのように下に落ちたら終わりとか・・んー、エリアを制限するのもありかな・・だったら周囲にそういう範囲を設けるとか。
// スピードが速くなった時に時間経過で通常の速さに戻る処理を加えれば自由にスピードを変えたりできるようになった時のストレスを減らせる（かもしれない）
// 両サイドとかいろんなパターンが実現できるよね。ふれたらアウトの領域を左右に設けて。

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;

const _ENTER = 13;
const _SPACE = 32;
const _LEFT = 37;
const _UP = 38;
const _RIGHT = 39;
const _DOWN = 40;
const _SHIFT = 16;

const UNTIL = 0;
const CORRECT = 1;
const WRONG = 2;

let myGame;
let palette = {};

function setup(){
  createCanvas(AREA_WIDTH, AREA_HEIGHT);
  createPalette();
  myGame = new Game();
}

function draw(){
  myGame.update();
  myGame.draw();
}

function createPalette(){
  // 色を決める
  palette.titleBG = "skyblue"; // こんな感じ
}

class Game{
  constructor(){
    this.states = {title:new TitleState(this), select:new SelectState(this), play:new PlayState(this),
                   clear:new ClearState(this), gameover:new GameOverState(this), pause:new PauseState(this)};
    this.previousState = this.states.title;
    this.currentState = this.states.title;
  }
  getState(stateName){
    return this.states[stateName];
  }
  getCurrentState(){
    return this.currentState.name;
  }
  setCurrentState(newState){
    this.currentState = newState;
    this.currentState.initialize();
  }
  update(){
    this.currentState.update();
    const next = this.currentState.nextState;
    if(next !== undefined){
      this.previousState = this.currentState;
      this.setCurrentState(next);
    }
  }
  draw(){
    this.currentState.draw();
  }
}

class State{
  constructor(node){
    this.node = node;
    this.previousState = undefined;
    this.nextState = undefined;
    this.backgroundScreen = createGraphics(AREA_WIDTH, AREA_HEIGHT);
    this.mainScreen = createGraphics(AREA_WIDTH, AREA_HEIGHT);
  }
  initialize(){}
  keyAction(code){}
  clickAction(x, y){}
  update(){}
  draw(){}
  simpleShift(nextStateName){
    // めんどくさくなってきたのでメソッド化
    this.nextState = this.node.getState(nextStateName);
    this.nextState.previousState = this; // あっ。。
  }
}

class TitleState extends State{
  constructor(node){
    super(node);
    this.name = "title";
    this.initialize();
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.background(0, 128, 255);
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        this.nextState = this.node.getState("select");
        this.nextState.previousState = this;
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.textSize(24);
    gr.textAlign(CENTER, CENTER)
    gr.text("title", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.25);
    gr.text("press enter key", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.55);
    image(gr, 0, 0);
  }
}

class SelectState extends State{
  constructor(node){
    super(node);
    this.name = "select";
    this.level = 0;
    this.maxLevel = 3;
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.background(64);
    this.level = 0;
  }
  levelShift(code){
    if(code === _LEFT){ this.level = (this.level + this.maxLevel - 1) % this.maxLevel; }
    if(code === _RIGHT){ this.level = (this.level + 1) % this.maxLevel; }
  }
  keyAction(code){
    switch(code){
      case _LEFT:
        this.levelShift(code); break;
      case _RIGHT:
        this.levelShift(code); break;
      case _ENTER:
        this.nextState = this.node.getState("play");
        this.nextState.level = this.level;
        this.nextState.previousState = this;
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    this.mainScreen.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.textSize(24);
    gr.textAlign(CENTER, CENTER);
    gr.text("choice level.", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.4);
    gr.fill(0, 0, 255);
    gr.square(AREA_WIDTH * 0.3, AREA_HEIGHT * 0.7, AREA_WIDTH * 0.1);
    gr.fill(0, 255, 255);
    gr.square(AREA_WIDTH * 0.45, AREA_HEIGHT * 0.7, AREA_WIDTH * 0.1);
    gr.fill(255, 0, 255);
    gr.square(AREA_WIDTH * 0.6, AREA_HEIGHT * 0.7, AREA_WIDTH * 0.1);
    gr.fill(0);
    gr.square(AREA_WIDTH * (0.3 + 0.15 * this.level + 0.01), AREA_HEIGHT * 0.7 + AREA_WIDTH * 0.01, AREA_WIDTH * 0.08);
    image(gr, 0, 0);
  }
}

class PlayState extends State{
  constructor(node){
    super(node);
    this.name = "play";
    this.level = 0;
    this.nums = [];
    this.judgementSentence = "";
    this.correctFlag = UNTIL; // UNTIL, CORRECT, WRONG.
    this.properFrameCount = 0;
  }
  keyAction(code){
    if(code >= 48 && code <= 57){
      if(this.correctFlag !== UNTIL){ return; }
      const inputNum = code - 48;
      this.nums[3] = inputNum;
      if(inputNum === this.nums[2]){
        this.judgementSentence = "right!";
        this.correctFlag = CORRECT;
        return;
      }else{
        this.judgementSentence = "wrong!";
        this.correctFlag = WRONG;
        return;
      }
    }else if(code === _SHIFT){
      // シフトキーでポーズ
      this.nextState = this.node.getState("pause");
      this.nextState.previousState = this;
    }
  }
  toClear(){
    this.nextState = this.node.getState("clear");
    this.nextState.previousState = this;
  }
  toGameOver(){
    this.nextState = this.node.getState("gameover");
    this.nextState.previousState = this;
  }
  initialize(){
    // たとえばポーズから戻る場合など、ほとんど変えるところがなかったりするので・・そういうのを分岐で表現する。
    this.nextState = undefined;
    this.properFrameCount = 0;
    this.correctFlag = UNTIL;
    switch(this.previousState.name){
      case "select":
        this.backgroundScreen.background(0, this.level * 80, 0);
        this.nums = [];
        this.nums.push(floor(random() * 5));
        this.nums.push(floor(random() * 5));
        this.nums.push(this.nums[0] + this.nums[1]);
        this.nums.push(-1);
        break;
      case "pause":
        break;
    }
  }
  update(){
    if(this.correctFlag !== UNTIL){
      this.properFrameCount++;
      if(this.properFrameCount > 60){
        switch(this.correctFlag){
          case CORRECT:
            this.toClear();
            break;
          case WRONG:
            this.toGameOver();
            break;
        }
      }
    }
  }
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.textSize(32);
    gr.textAlign(CENTER, CENTER);
    gr.text("this level is " + this.level, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.2);
    gr.fill(255);
    gr.textSize(32);
    gr.textAlign(CENTER, CENTER);
    gr.text(this.nums[0] + " + " + this.nums[1] + " = ?", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.5);
    if(this.correctFlag !== UNTIL){
      gr.text("your answer is " + this.nums[3], AREA_WIDTH * 0.5, AREA_HEIGHT * 0.65);
      gr.text(this.judgementSentence, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.75);
    }
    image(gr, 0, 0);
  }
}

// PLAYからの分岐ステートです。PLAYの流れを一旦止め、画像を受け取りそれをブラインドしたものを背景に設定しつつ、
// コンフィグやタイトルに戻るなどの操作を実行します。何をするかはゲームに依るけどまあパズルとかなら全部リセットするとか

// 実際はおそらくもっともっとたくさんのStateがあるんだろうねぇ・・
class PauseState extends State{
  constructor(node){
    super(node);
    this.name = "pause";
    this.choiceId = 0; // 0でPLAYに戻る、1でタイトルに戻る。
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        switch(this.choiceId){
          case 0:
            this.nextState = this.node.getState("play");
            this.nextState.previousState = this;
            break;
          case 1:
            this.nextState = this.node.getState("title");
            this.nextState.previousState = this;
            break;
        }
        break;
      case _UP:
        this.choiceId = (this.choiceId + 2 - 1) % 2;
        break;
      case _DOWN:
        this.choiceId = (this.choiceId + 1) % 2;
    }
  }
  initialize(){
    this.nextState = undefined;
    switch(this.previousState.name){
      case "play":
        this.backgroundScreen.image(this.previousState.mainScreen, 0, 0);
        this.backgroundScreen.fill(0, 0, 0, 192);
        this.backgroundScreen.rect(0, 0, AREA_WIDTH, AREA_HEIGHT);
        this.mainScreen.textSize(32);
        this.mainScreen.textAlign(CENTER, CENTER);
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(0, 128, 255);
    gr.rect(AREA_WIDTH * 0.25, AREA_HEIGHT * (0.56 + 0.1 * this.choiceId), AREA_WIDTH * 0.5, AREA_HEIGHT * 0.08);
    gr.fill(255);
    gr.text("PAUSE!!", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.35);
    gr.text("BACK TO PLAY", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.6);
    gr.text("TO TITLE", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.7);
    image(gr, 0, 0);
  }
}

// とりあえず画面がフェードしたのちゲームオーバー表示してエンターキーでタイトルへ
class GameOverState extends State{
  constructor(node){
    super(node);
    this.name = "gameover";
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.image(this.previousState.mainScreen, 0, 0);
    this.backgroundScreen.fill(0, 0, 0, 192);
    this.backgroundScreen.rect(0, 0, AREA_WIDTH, AREA_HEIGHT);
    this.mainScreen.textSize(32);
    this.mainScreen.textAlign(CENTER, CENTER);
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        this.nextState = this.node.getState("title");
        this.nextState.previousState = this;
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.text("GAME OVER...", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.35);
    gr.text("PRESS ENTER KEY", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.55);
    image(gr, 0, 0);
  }
}

// とりあえず画面がフェードしたのちクリアー！表示してエンターキーでタイトルへ
class ClearState extends State{
  constructor(node){
    super(node);
    this.name = "clear";
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.image(this.previousState.mainScreen, 0, 0);
    this.backgroundScreen.fill(0, 0, 0, 192);
    this.backgroundScreen.rect(0, 0, AREA_WIDTH, AREA_HEIGHT);
    this.mainScreen.textSize(32);
    this.mainScreen.textAlign(CENTER, CENTER);
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        this.nextState = this.node.getState("title");
        this.nextState.previousState = this;
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.text("CLEAR!!", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.35);
    gr.text("PRESS ENTER KEY", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.55);
    image(gr, 0, 0);
  }
}

// ゲームによってはゲームオーバーとかクリアとかなくて、リザルトステートがあってリザルトが表示されたのち・・・とかもあるでしょう。
// そこら辺はほんとにゲームによるでしょうね。完全に共通のテンプレートは難しいと思う。

// 計算系はリザルトの方が多い感じだと思う

// 32:スペース
// 13:エンター
// 37:ひだり←
// 38:うえ↑
// 39:みぎ→
// 40:した↓
// 16:シフト
// 0から9までの数字：48, 49, 50, 51, ..., 57が0, 1, 2, 3, ..., 9に対応する。
// キーコードを数字にするには48を引くだけ。簡単！！
function keyPressed(){
  myGame.currentState.keyAction(keyCode);
	return false;
}
