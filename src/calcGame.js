// じゃあ作ってみる？？
// TITLE画面辺りから。pythonもそこまでは、やった。そこからは、知らんけど。
// ていうか状態遷移ならフラッピーでやったから知ってるでしょ・・。

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;

const _ENTER = 13;
const _SPACE = 32;
const _LEFT = 37;
const _UP = 38;
const _RIGHT = 39;
const _DOWN = 40;
const _SHIFT = 16;
const _BACKSPACE = 8;

const UNTIL = 0;
const CORRECT = 1;
const WRONG = 2;

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
    this.states = {title:new TitleState(this), select:new SelectState(this), play:new PlayState(this), result:new ResultState(this)};
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

// テキストボックスの方がいいかなぁ・・多分。
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
  }
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    image(gr, 0, 0);
  }
}

// リザルトステート
// プレイステートから行きます。プレイからはギブアップボタンで（シフトを押す）タイトルに戻ります。
// プレイが終了した後で結果を表示します。評価します。80％と50％と20％にボーダー。
class ResultState extends State{
  constructor(node){
    super(node);
    this.node = "result";
  }
  initialize(){

  }
  keyAction(){}
  update(){}
  draw(){}
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
// 8:バックスペース
// 0から9までの数字：48, 49, 50, 51, ..., 57が0, 1, 2, 3, ..., 9に対応する。48を引く。
// テンキーの場合：96, 97, 98, 99, 100, 101, 102, 103, 104, 105が0～9に対応するので96を引いてください。以上です。
// 48と96で1:2になってるの有難いな。実装しやすそう。
function keyPressed(){
  myGame.currentState.keyAction(keyCode);
  return false; // これがないとバックスペースで戻っちゃう
}

// テンキーや数字キーを押された場合に0～9を返す関数みたいなもの。
function getNumFromCode(code){
  if(code < 48 || (code > 57 && code < 96) || code > 105){ return -1; }
  if(code < 75){ return code - 48; }
  return code - 96;
}
