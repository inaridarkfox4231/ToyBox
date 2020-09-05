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

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;

const _ENTER = 13;
const _SPACE = 32;
const _LEFT = 37;
const _UP = 38;
const _RIGHT = 39;
const _DOWN = 40;
const _SHIFT = 16;

let myGame;

function setup(){
  createCanvas(AREA_WIDTH, AREA_HEIGHT);
  myGame = new Game();
}

function draw(){
  myGame.update();
  myGame.draw();
}

class Game{
  constructor(){
    this.states = {title:new TitleState(this), select:new SelectState(this),
                   play:new PlayState(this), gameover:new GameOverState(this), pause:new PauseState(this)};
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
  update(){}
  draw(){}
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
  }
  keyAction(code){
    if(code >= 48 && code <= 57){
      const inputNum = (code - 48) % 10;
      this.nums[3] = inputNum;
      if(inputNum === this.nums[2]){
        this.judgementSentence = "right!";
      }else{
        this.judgementSentence = "wrong!";
      }
    }
  }
  initialize(){
    // たとえばポーズから戻る場合など、ほとんど変えるところがなかったりするので・・そういうのを分岐で表現する。
    this.nextState = undefined;
    switch(this.previousState.name){
      case "select":
        this.backgroundScreen.background(0, this.level * 80, 0);
        this.nums.push(floor(random() * 5));
        this.nums.push(floor(random() * 5));
        this.nums.push(this.nums[0] + this.nums[1]);
        this.nums.push(-1);
        break;
    }
  }
  update(){}
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
    if(this.nums[3] > 0){
      gr.text("your answer is " + this.nums[3], AREA_WIDTH * 0.5, AREA_HEIGHT * 0.65);
      gr.text(this.judgementSentence, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.75);
    }
    image(gr, 0, 0);
  }
}

// PLAYからの分岐ステートです。PLAYの流れを一旦止め、画像を受け取りそれをブラインドしたものを背景に設定しつつ、
// コンフィグやタイトルに戻るなどの操作を実行します。何をするかはゲームに依るけどまあパズルとかなら全部リセットするとか
class PauseState extends State{
  constructor(node){
    super(node);
    this.name = "pause";
  }
  update(){}
  draw(){}
}

class GameOverState extends State{
  constructor(node){
    super(node);
    this.name = "gameover";
  }
  update(){}
  draw(){}
}

// ゲームによってはゲームオーバーとかクリアとかなくて、リザルトステートがあってリザルトが表示されたのち・・・とかもあるでしょう。
// そこら辺はほんとにゲームによるでしょうね。完全に共通のテンプレートは難しいと思う。

// 32:スペース
// 13:エンター
// 37:ひだり←
// 38:うえ↑
// 39:みぎ→
// 40:した↓
// 16:シフト
// 0から9までの数字：49, 50, 51, ..., 57, 58が1, 2, 3, ..., 9, 0に対応する。
// キーコードを数字にするには48を引いて10で割り算する。
function keyPressed(){
  myGame.currentState.keyAction(keyCode);
}
