// ブロック崩し
// マウス操作。
// パドルを指定されたエリア内で上下左右に動かす
// それでボールを弾いてブロックに相当するセグメントにぶつけて壊す
// スピードは高くなり過ぎないように調整する
// とりあえず一面作って。残機終わったらゲームオーバー、回復ブロックとか用意、などなど。

// 後作りたいのは線を引いてボールをゴールまで誘導するのとあとはちょっと思いつかない

const AREA_WIDTH = 640;
const AREA_HEIGHT = 480;

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
  palette.titleBG = color("skyblue");
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
    this.backgroundScreen.background(palette.titleBG);
  }
  clickAction(x, y){
    this.simpleShift("select");
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(255);
    gr.textSize(24);
    gr.textAlign(CENTER, CENTER)
    gr.text("title", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.25);
    gr.text("click to start", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.55);
    image(gr, 0, 0);
  }
}

class SelectState extends State{
  constructor(node){
    super(node);
    this.name = "select";
  }
  initialize(){}
  clickAction(x, y){}
  update(){}
  draw(){}
  drawSelectBox(gr, x, y, w, h, content){
    
  }
}
