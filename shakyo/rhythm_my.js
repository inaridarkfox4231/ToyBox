// リズムジェネレータ写経
// クリックでメロディできるところまで行きたい（予定）
// 涼しくなったら挑戦してみよ

// とりあえず音の長さいじれるようになりたい・・・・
// イメージは？出来てる？
// ピスコラみたいにクリックでチャンネル作って部分的に長さとかいじってその・・できるように。ちょちょいって。できるような、イメージ。
// 関係ないけど螺旋って難しくて、螺旋状に弾丸飛ばしても円形に並んだ点がぶわーっていう風にしか見えなくて、
// 若干ブレさせたり軌跡を残さないといけないのね。そこが難しいのよー。ちなみにwavingも同じ。
// 組み合わせるとまた違うけど。

// ずーっと線が左から右に動いてる感じで、
// クリックで止められるし最初の位置で固定もできる。
// ミリ秒とかいじれる。なんなら♪=120とか使ってもいじれる（♪=bpmの場合60000ミリ秒にbpm個だから1拍が60000/bpmミリ秒）。
// たとえば125だと1秒に8拍だね。500だと1秒に2拍。合ってる。うん、時間の感覚を身に付けたいね・・
// 元ネタは120だからおおよそ1秒に8拍でbpmは500か。bpm=500.ほぇぇ。

// つまり、1小節に4分音符を3個書いた瞬間に小節の長さが4分音符3個分で固定されるわけね。
// ほうほう。
// ていうか4分音符えーと、んーと、、？？

// たとえば♩=240で4/4を選択すると、1小節は4分音符が4つでこれは240個で1分、4つで1秒なので、1小節は1秒で、
// 4分音符は0.25秒の演奏時間になり、8分音符は0.125秒の演奏時間になるわけね。
// ピスコラっぽいものを作るのであれば（まあ「もどき」だけど）、
// ビートを定義して3つなら3つ、4つなら4つの4分音符を用意できるように・・
// そしてその音符の長さはbpmに対して60000/bpmミリ秒・・たとえば240なら500ミリ秒、これをメトロノームに設定すればいいわけね。
// つまり！60000/bpmミリ秒が基準の長さとなり、これを1つの小節にビートの数だけ放り込むと。で、その場所は、基本的に1で、
// 要するにクリックすることでそれがひとつ置かれる。500であれば120ミリ秒が・・だからその場合120ミリ秒が基準となって
// クリックするごとにそこに120ミリ秒のアイテムが置かれると。で、
// タブで分割数をいじるとそういうモードになって直接的に長さを自由に変えられる、その場合1/3のユニットには当然1/3分のミリ秒の
// 単位が当てられる、120なら3で割って40とか4で割って30みたいなね。約数が多いと便利。
// ♩=240ならワンクリックで250ミリ秒の単位が置かれる、半分なら125ミリ秒、みたいな。
// その際既に用意してあるセグメントとかぶると、その分が切り取られ短くなる仕様がピスコラにあるので、
// それも実装したいわね。

// パレットが開いて、そっちでいじれるとか・・んー。
// 複数かぶってる場合は片方がフェードした色で・・編集中のトラックが濃い色みたいになるといいわね。
// ノイズは個別に下の方で・・結局長さだけなので。panとか分かんないから適当で。

// っていっても音楽編集ソフトならそういうの備わってるしじゃあ今何やってるんだって話になっちゃうんだけど。ねぇ。・・・。
// それ言っちゃったらもう
// やることないな
// 終了

// 今日は己の無力さに打ちひしがれたのでもう寝る
// 結局今の水中活動能力じゃ伊豆行ってもお金無駄にするだけ・・
// 鍛えないと
// あと、さっきの問題のひとつの解答としてはね。
// まあ確かにそうなんだけどね。
// 入口、って、大事だと思うのよね。
// 入口がないと中に入れないでしょ、中に入らないと始まらないでしょ、そういう感じの、ね。
// 明日は遊覧しよ。4便辺りで。

let backgroundColor; // 背景色

let metronome;
let myTrackSystem;

let soundEnabled = true;

// --------- Sound. ------------ //

class EnvelopedOscillator{
  constructor(oscillatorType, envelopeParameter){
    this.envelopeParameter = envelopeParameter;
    this.oscillatorType = oscillatorType;
    switch(oscillatorType){
      case 'sine':
      case 'triangle':
      case 'sawtooth':
      case 'square':
        this.oscillator = new p5.Oscillator();
        break;
      case 'white':
      case 'pink':
      case 'brown':
        this.oscillator = new p5.Noise();
        break;
    }
    this.oscillator.setType(oscillatorType);
    this.envelope = new p5.Env();
    this.envelope.setADSR(envelopeParameter.attackTime, envelopeParameter.decayTime, envelopeParameter.susPercent, envelopeParameter.releaseTime);
    this.envelope.setRange(envelopeParameter.attackLevel, envelopeParameter.releaseLevel);
  }
  play(startTime, sustainTime, frequency){
    if(frequency){
      this.oscillator.freq(frequency);
    }
    this.envelope.play(this.oscillator, startTime, sustainTime);
  }
  start(){
    this.oscillator.amp(0);
    this.oscillator.start();
  }
  stop(){
    this.oscillator.amp(0);
    this.oscillator.stop();
  }
  pan(value){
    this.oscillator.pan(value);
  }
  connect(unit){
    this.connectedUnit = unit;
    this.oscillator.disconnect();
    this.oscillator.connect(unit);
  }
}

// envelopedOscillatorがcapacity個集まった集合体としてのクラス
class ParallelEnvelopedOscillatorSet{
  constructor(oscillatorType, envelopeParameter, capacity){
    this.envelopedOscillatorArray = [];
    this.capacity = capacity;
    this.currentIndex = 0;
    for(let i = 0; i < capacity; i++){
      this.envelopedOscillatorArray.push(new EnvelopedOscillator(oscillatorType, envelopeParameter));
    }
  }
  play(startTime, sustainTime, frequency){

  }
}
