// じゃあ作ってみる？？
// TITLE画面辺りから。pythonもそこまでは、やった。そこからは、知らんけど。
// ていうか状態遷移ならフラッピーでやったから知ってるでしょ・・。

// 2+2 3+3 4+4.
// 5, 10, 15.
// 残フレーム数かける30, 50, 100. おわり。

// 640x480でいいよ。
// 割合指定の方が分かりやすいのよね。
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

const THINKING = 0;
const SHOW_ANSWER = 1;
const FINISHED = 2;

let myGame;
let palette = {};
const scoreFactor = [0, 30, 50, 100, 60, 100, 200]; // レベルごとのスコアボーナス
const allClearBonus = [0, 20000, 50000, 100000, 40000, 100000, 200000]; // 全問正解ボーナス

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
  palette.titleBG = "#00bfff"; // deepskyblue.
  palette.selectBG = "#3cb371"; // mediumseagreen.
  palette.totitle = "#ff9900"; // オレンジ系
  // 暗算は水色系。高いほど濃く。暗算だからa1, a2, a3で。
  palette.level_a1 = "#ccccff";
  palette.level_a2 = "#9999ff";
  palette.level_a3 = "#6666ff";
  // 電卓は赤系。高いほど濃く。電卓だからd1, d2, d3で。
  palette.level_d1 = "#ffcccc";
  palette.level_d2 = "#ff9999";
  palette.level_d3 = "#ff6666";
  palette["CORRECT!"] = "#008000"; // みどり
  palette["WRONG..."] = "#ff0000"; // あか
  palette["TIME UP!"] = "#800080"; // むらさき
  palette["NEARLY!"] = "#ff8c00"; // だいだい
  palette.result = "#20b2aa"; // light sea green.
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
    this.mainScreen.textSize(AREA_HEIGHT * 0.08);
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.background(color(palette.titleBG));
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        this.simpleShift("select");
        break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(0);
    gr.textAlign(CENTER, CENTER)
    gr.text("calc game", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.25);
    gr.text("press enter key", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.55);
    image(gr, 0, 0);
  }
}

// 上から順にTO TITLE, LEVEL 1, LEVEL 2, LEVEL 3.
// 色はオレンジ、水色系でレベル、高いほど濃く。
// 上下キーで選択できるように変更。選択中のボックスを黒い枠で覆う（カーソル）
// おいおいマウスとかでも・・（要相談）
// のちのち右隣にハイスコア置くけどとりあえず中央でいいです

// createGraphicでまとめて作っちゃって順に並べた方がいいかも。その方がデザイン工夫できるし。shootでそうやった。
// まあメインロジックが先か。装飾は後でいいや。
// 投稿は完成してから一回だけでいいや。めんどくさい。

// 暗算は2桁、3桁、4桁で常に二つの数を足す。レベル1, 2, 3.
// これとは別に電卓のレベル1, 2, 3を用意する。それぞれ、3桁、4桁、5桁で加える数はすべて9個(3x3)。
// 電卓ならそのくらいやらないと。
// 制限時間はそれぞれ15秒、20秒、25秒にする。厳しいなおい。
class SelectState extends State{
  constructor(node){
    super(node);
    this.name = "select";
    this.id = 0;
    this.maxId = 7; // idは0, 1, 2, 3で1, 2, 3がレベルに対応する感じ。0はTO TITLE.
    this.mainScreen.rectMode(CENTER); // ボックスはすべてこのタイプなのでめんどうだしこれで。
    this.mainScreen.textSize(AREA_HEIGHT * 0.05);
    this.mainScreen.textAlign(CENTER, CENTER);
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.background(color(palette.selectBG));
    this.id = 0;
  }
  levelShift(code){
    // 4, 5, 6に左右キーで移れるようにするかな・・・
    if(code === _UP){ this.id = (this.id + this.maxId - 1) % this.maxId; }
    if(code === _DOWN){ this.id = (this.id + 1) % this.maxId; }
    if(code === _LEFT || code === _RIGHT){
      if(this.id === 0){ return; }
      this.id += (this.id < 4 ? 3 : -3);
    }
  }
  keyAction(code){
    // これ_ENTERとdefaultでいいな。
    switch(code){
      case _ENTER:
        // 0か1～3かで処理を分ける。レベルの取得はplay側で行う。
        if(this.id > 3){ return; } // 電卓モードは工事中！
        this.simpleShift((this.id > 0 ? "play" : "title"));
        break;
      default:
        this.levelShift(code); break;
    }
  }
  update(){}
  draw(){
    let gr = this.mainScreen;
    this.mainScreen.image(this.backgroundScreen, 0, 0);
    gr.fill(0);
    gr.text("Please choose with UP/DOWN key.", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.3);
    this.drawSelectBox(gr, 0.3, 0.4, 0.3, 0.07, "TO TITLE", palette.totitle);
    this.drawSelectBox(gr, 0.3, 0.5, 0.3, 0.07, "暗算LEVEL1", palette.level_a1);
    this.drawSelectBox(gr, 0.3, 0.6, 0.3, 0.07, "暗算LEVEL2", palette.level_a2);
    this.drawSelectBox(gr, 0.3, 0.7, 0.3, 0.07, "暗算LEVEL3", palette.level_a3);
    this.drawSelectBox(gr, 0.7, 0.5, 0.3, 0.07, "電卓LEVEL1", palette.level_d1);
    this.drawSelectBox(gr, 0.7, 0.6, 0.3, 0.07, "電卓LEVEL2", palette.level_d2);
    this.drawSelectBox(gr, 0.7, 0.7, 0.3, 0.07, "電卓LEVEL3", palette.level_d3);
    gr.noFill();
    gr.strokeWeight(2);
    gr.stroke(0);
    const x = (this.id < 4 ? 0 : 1);
    const y = (this.id < 4 ? this.id : this.id - 3);
    gr.rect(AREA_WIDTH * (0.3 + 0.4 * x), AREA_HEIGHT * (0.4 + 0.1 * y), AREA_WIDTH * 0.32, AREA_HEIGHT * 0.09);
    gr.noStroke();
    image(gr, 0, 0);
  }
  drawSelectBox(gr, x, y, w, h, content, bodyColor){
    gr.fill(color(bodyColor));
    gr.rect(AREA_WIDTH * x, AREA_HEIGHT * y, AREA_WIDTH * w, AREA_HEIGHT * h);
    gr.fill(0);
    gr.text(content, AREA_WIDTH * x, AREA_HEIGHT * y);
  }
}

// レベルは1, 2, 3で。
// ここに何でも放り込むのはばかげてるので、Systemが必要だわね。
// 背景はベースカラーにして問題エリアを灰色背景で別枠にする感じ。
// 電卓モードは「次の数をすべて足してください」って感じで3x3状に9個の数を表示する感じ。
// 桁数はひとつずつ増えて3桁、4桁、5桁。（はぁ！？）
// 合計＝？で、？が正解で補完されるフォーマット。
class PlayState extends State{
  constructor(node){
    super(node);
    this.name = "play";
    this.system = new CalcGameSystem(); // ここに全部入ってる感じ。
    this.mainScreen.textSize(24);
  }
  keyAction(code){
    // テンキーや数字キーのときはsystem経由で数入力、ただし答え表示中は入力できない。
    // エンターキーで解答する。時間切れの場合はデフォルトの0があるので入力値が直接判定される。NaNになる場合は0が採用される。
    // シフトキーのときはタイトルに戻る。
    // 実行されるかどうかはsystemに任せる。
    const inputNum = getNumFromCode(code);
    if(inputNum < 0){
      switch(code){
        case _BACKSPACE:
          this.system.action("number", -1);
          break;
        case _ENTER:
          this.system.action("enter");
          break;
        case _SHIFT:
          this.simpleShift("title");
          break;
      }
    }else{
      this.system.action("number", inputNum);
    }
  }
  initialize(){
    // たとえばポーズから戻る場合など、ほとんど変えるところがなかったりするので・・そういうのを分岐で表現する。
    this.nextState = undefined;
    switch(this.previousState.name){
      case "select":
        const level = this.previousState.id;
        this.system.initialize(level); // レベルを元にもろもろ初期化（モード情報も・・）
        this.backgroundScreen.background(color(palette["level_a" + level]));
        break;
    }
  }
  update(){
    this.system.update();
    const systemState = this.system.getState();
    if(systemState === FINISHED){
      this.simpleShift("result");
    }
  }
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    this.system.draw(gr);
    image(gr, 0, 0);
  }
}

// リザルトステート
// プレイステートから行きます。プレイからはギブアップボタンで（シフトを押す）タイトルに戻ります。
// とりあえずSCORE:~~~~~~でいいです。
class ResultState extends State{
  constructor(node){
    super(node);
    this.name = "result";
    this.mainScreen.textSize(24);
    this.mainScreen.textAlign(CENTER, CENTER);
    this.level = 0; // レベル情報と正解数に基づいてボーナス（後で追加）
    this.score = 0;
    this.correctAnswerNum = 0; // 正解数ボーナス。
    this.bonus = 0;
    this.properFrameCount = 0; // 一応テキストが順繰りに表示される感じ・・全部表示し終えたらエンターキーで戻れるようにする。
  }
  initialize(){
    this.nextState = undefined;
    this.backgroundScreen.background(color(palette.result));
    const prev = this.previousState; // playしかないけど。
    this.level = prev.system.level;
    this.score = prev.system.score; // スコア
    this.correctAnswerNum = prev.system.correctAnswerNum; // 正解数
    this.bonus = (this.correctAnswerNum < 10 ? 0 : allClearBonus[this.level]); // 全クリボーナス
  }
  keyAction(code){
    switch(code){
      case _ENTER:
        this.score += this.bonus; // タイトルが最後のスコアの情報を獲得する感じのあれ。あるいは直接アクセスもできるが。
        this.simpleShift("title");
        break;
    }
  }
  update(){
    if(this.properFrameCount < 180){ this.properFrameCount++; }
  }
  draw(){
    let gr = this.mainScreen;
    gr.image(this.backgroundScreen, 0, 0);
    gr.fill(0);
    const fc = this.properFrameCount;
    if(fc > 29){ gr.text("result(暗算モード LEVEL" + this.level + ")", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.3); }
    if(fc > 59){ gr.text("SCORE:" + this.score, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.38); }
    if(fc > 89){ gr.text("ALL CORRECT BONUS:" + this.bonus, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.46); }
    if(fc > 134){ gr.text("FINAL SCORE:" + (this.score + this.bonus), AREA_WIDTH * 0.5, AREA_HEIGHT * 0.6); }
    if(fc > 179){ gr.text("to title: press enter key.", AREA_WIDTH * 0.5, AREA_HEIGHT * 0.68); }
    image(gr, 0, 0);
  }
}

// ---------------------------------
// 計算ゲームのメインロジック
// 電卓モード用に別に作る必要があるわね

class CalcGameSystem{
  constructor(){
    this.level = 0;
    this.num1 = 0;
    this.num2 = 0;
    this.correctAnswer = 0;
    this.inputAnswer = 0;
    this.restCount = 0;
    this.countLimit = 0;
    this.score = 0;
    this.correctAnswerNum = 0;
    this.judgeText = "";
    this.queryNumber = 0;
    this.maxQueryNumber = 10; // 10問。
    this.state = THINKING; // THINKINGは考え中、SHOW_ANSWERは答え合わせ中（2秒）,FINISHEDは終了。
  }
  getState(){
    return this.state;
  }
  action(_type, _input = -1){
    // 答え出してる間は操作不能！
    if(this.state === SHOW_ANSWER){ return; }
    switch(_type){
      case "number":
        // 不正な入力でなければthis.inputAnswerを更新する.0～9の場合は10倍してそれを足す、-1(backspace)なら10で割って切り捨て。
        this.updateInputAnswer(_input);
        break;
      case "enter":
        // 強制的に答え合わせに跳ぶ。比較して合ってれば全部いただける。間違ってたら0点。近ければ半分の点。
        this.checkAnswer();
        break;
    }
  }
  updateInputAnswer(i){
    if(i < 0){
      this.inputAnswer = Math.floor(this.inputAnswer * 0.1);
    }else{
      this.inputAnswer = this.inputAnswer * 10 + i;
    }
  }
  initialize(level){
    this.level = level;
    this.countLimit = 300 * this.level;
    this.score = 0;
    this.correctAnswerNum = 0;
    this.queryNumber = 0;
    this.setQuery();
  }
  setQuery(){
    const minNum = Math.pow(10, this.level);
    const maxNum = Math.pow(10, this.level + 1);
    this.num1 = Math.floor(minNum + random() * (maxNum - minNum));
    this.num2 = Math.floor(minNum + random() * (maxNum - minNum));
    this.correctAnswer = this.num1 + this.num2; // 答え。
    this.inputAnswer = 0; // 初期化
    this.restCount = this.countLimit;
    this.state = THINKING;
    this.queryNumber++; // 10より小さい時はクエリを作れるが10のときは作れないイメージ。
    // クエリナンバーに応じて問題を難しくしても面白そう。
  }
  checkAnswer(){
    // 答え合わせする。
    // もしプラスマイナス0.05倍で合ってれば半分の点が入る感じ。
    // タイムアップは容赦なく0点。
    // WRONGは用意した解答どうのこうのではなく、残り時間があるときにエンターで解答したら間違ってた場合とする。
    const baseScore = scoreFactor[this.level] * this.restCount;
    if(baseScore === 0){
      this.judgeText = "TIME UP!"
    }else if(this.inputAnswer === this.correctAnswer){
      this.score += scoreFactor[this.level] * this.restCount;
      this.judgeText = "CORRECT!";
      this.correctAnswerNum++;
    }else if(abs(this.inputAnswer - this.correctAnswer) / this.correctAnswer < 0.05){
      this.score += baseScore * 0.5;
      this.judgeText = "NEARLY!";
    }else{
      this.judgeText = "WRONG...";
    }
    this.state = SHOW_ANSWER;
    this.restCount = 120;
  }
  shiftState(){
    // state,及びqueryのnumberに応じて異なる処理
    // simpleShiftじゃないでしょ・・
    switch(this.state){
      case THINKING:
        this.checkAnswer();
        break;
      case SHOW_ANSWER:
        if(this.queryNumber < this.maxQueryNumber){
          this.setQuery();
        }else{
          this.state = FINISHED; // クエリ終了。この情報をあっちで取得してステートをリザルトに移す。
        }
        break;
    }
  }
  update(){
    this.restCount--;
    if(this.restCount === 0){ this.shiftState(); }
  }
  draw(gr){
    // 問題文テキスト、問題番号のテキスト、インプットした数のテキストなどが必要。あと正誤表示。正解：青、不正解：赤。
    // 色と文だけだと分かりづらいので頭に〇とか×をつけるといいかも。（テキストでなく2D描画の方がいい）
    gr.rectMode(CENTER);
    gr.fill(255);
    gr.rect(AREA_WIDTH * 0.5, AREA_HEIGHT * 0.5, AREA_WIDTH * 0.9, AREA_HEIGHT * 0.9);
    gr.fill(200);
    gr.rect(AREA_WIDTH * 0.5, AREA_HEIGHT * 0.5, AREA_WIDTH * 0.88, AREA_HEIGHT * 0.88);
    gr.fill(0);
    gr.textAlign(CENTER, CENTER);
    gr.text("問題" + this.queryNumber, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.4);
    const n = (this.state === THINKING ? "?" : this.correctAnswer);
    gr.text(this.num1 + " + " + this.num2 + " = " + n, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.5);
    gr.text("あなたの解答：" + this.inputAnswer, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.6);
    if(this.state === SHOW_ANSWER){
      gr.fill(color(palette[this.judgeText]));
      gr.text(this.judgeText, AREA_WIDTH * 0.5, AREA_HEIGHT * 0.7);
    }
    // タイムゲージなど
    gr.rectMode(CORNER);
    gr.textAlign(LEFT, TOP);
    gr.fill(0);
    gr.text("TIME:", AREA_WIDTH * 0.1, AREA_HEIGHT * 0.1);
    gr.text("SCORE:" + this.score, AREA_WIDTH * 0.1, AREA_HEIGHT * 0.16);
    gr.text("numberkey:input, enterkey:answer", AREA_WIDTH * 0.1, AREA_HEIGHT * 0.22);
    gr.fill(160);
    gr.rect(AREA_WIDTH * 0.22, AREA_HEIGHT * 0.1, AREA_WIDTH * 0.6, AREA_HEIGHT * 0.05);
    gr.fill(255, 128, 0);
    const prg = (this.state === THINKING ? this.restCount / this.countLimit : 0);
    gr.rect(AREA_WIDTH * 0.22, AREA_HEIGHT * 0.1, AREA_WIDTH * 0.6 * prg, AREA_HEIGHT * 0.05);
  }
}
// ---------------------------------

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
