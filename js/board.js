/* 第七管区 緊急放送網：掲示板の小窓（書き込みの生成と反応）。
   js/*.js はすべて同じ広さの名前を共有する（index.html の読み込み順に実行）。名前の重複に注意。 */
/* ================= 掲示板（小窓） =================
   時間帯ごとの独り言、口調と話題だけで見分けがつく「書き癖」、一度きりの書き込み。名前も固定のIDもなく、返信は3割ほど。 */
const BD = window.KB7_BOARD({ R, ri, fmtP, price: k => item(k).p, wageText, wageDays: () => wageDays, stockOut, track: () => rec.playing && rec.piece ? rec.piece.title : '' });
const TX = (x, a) => typeof x === 'function' ? x(a) : x;
const mkId = () => Array.from({ length: 7 }, () => R('abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789+/')).join('');
let IDS = Array.from({ length: 14 }, mkId), voiceIds = {};
let postNo = ri(200, 880), goer = null, arcBusy = false;
const posts = [], hole = ri(2, 14);
const uniq = make => fresh('post', make, x => x, false);
const NIGHTY = /朝まで|寝ろ|寝られ|今夜|眠れ/;
const byHour = make => () => { let t, i = 0; const day = band() === 'asa' || band() === 'hiru'; do t = make(); while (++i < 8 && day && NIGHTY.test(t)); return t; };   // 昼に「朝まで待て」とは返さない
const vid = k => voiceIds[k] || (voiceIds[k] = mkId());   // 書き癖ごとのID。スレが替わると変わる
const VBY = {};
['asa', 'hiru', 'yuu', 'yoru', 'shinya'].forEach(b => { VBY[b] = BD.VOICES.filter(v => v.b.includes(b)); });
/* 時間帯ごとの組み合わせ文（同じ文に当たりにくくする） */
const GEN = {
  asa: [
    () => `${R(['首の後ろ', '手の甲', 'まぶた', '耳', '鼻の頭', '額', '唇', '頬'])}${R(['が焼けて皮がむけた', 'に水ぶくれができた', 'が一晩で黒ずんだ', 'がひび割れて血が出る', 'の感覚がない。焼けすぎて', 'が腫れて熱い。外は氷点下なのに'])}`,
    () => `配給列${R(['の前', 'の後ろ', 'の3人前', 'のすぐ横'])}で${R(['人が倒れた', '喧嘩が始まった', '誰かが泣き出した', '係が怒鳴ってる', '袋を落としたやつが踏まれた'])}。${R(['列は動かない', '誰も助けない', '俺も見てるだけだ', 'いつものことだ', '順番は変わらない'])}`,
    () => `今朝${R(['の廊下', 'の階段', 'の水場', 'の玄関', 'の中庭'])}${R(['に白い布が増えてた', 'が妙に静かだった', 'に知らない靴があった', 'に灰が積もってた', 'の扉が1つ開いたままだった', 'で誰かが座り込んでた'])}`
  ],
  hiru: [
    () => `${R(['瓦礫班', '水汲み', '見張りの下働き', '回収の手伝い', '配給所の荷運び'])}から戻った。${R(['指が1本動かない', '背中の皮がない', '靴底が抜けた', '日当は半分だった', '同じ班が1人減ってた', '帰り道で2回吐いた'])}`,
    () => `${R(['2階', '3階', '4階', '5階', '6階', '地下'])}の${R(['端の部屋', '階段の前', '便所', '水場の横', '踊り場'])}、${R(['通るとき息を止めろ', '昼でも暗い。何かある', '床が濡れてる。水じゃない', '扉が外されてる', '誰か座ってる。朝からずっと', '布がかけてある。数が増えた'])}`,
    () => `今日の配給は${R(['袋が軽い', '列が長すぎて諦めた', '係が1人しかいなかった', '途中で打ち切られた', '券を見せても断られた'])}。${R(['明日はもっと減る', '文句を言う相手がいない', '腹は鳴るのをやめた', '水だけ飲んで寝る'])}`
  ],
  yuu: [
    () => `風が${R(['南', '東', '西', '中庭の方', '向かいの棟'])}から来てる。${R(['甘いにおい', '焦げたにおい', '湿ったにおい', '鉄みたいなにおい', '言いたくないにおい'])}。${R(['窓を閉めろ', '布を口に当てろ', '今夜は眠れない', '慣れたくない', 'もう吐くものがない'])}`,
    () => `${R(['中庭', '踊り場', '向かいの屋上', '裏口', 'ごみ置き場'])}の${R(['あれ', '布の山', '荷物', '袋'])}、${R(['今日も回収に来なかった', 'また1つ増えた', '形が朝と違う', '上に雪が積もり始めた', '誰かが布をめくった跡がある'])}`,
    () => `日が落ちる前に${R(['水を汲んだ', '鍵を確かめた', '窓をふさいだ', 'ろうそくを数えた', '家族の数を数えた'])}。${R(['それでも不安だ', '足りない', '毎日これの繰り返しだ', '明日もできるとは限らない'])}`
  ],
  yoru: [
    () => `${R(['指', '足の指', '耳', '鼻', '頬', '膝'])}が${R(['紫になってきた', '白くなって感覚がない', '動かない', 'じんじんする。まだましな証拠らしい', '黒い。もう駄目だと思う'])}`,
    () => `${R(['廊下', '階段', '上の階', '隣の部屋', '扉の前', '窓の外'])}で${R(['足音', '引きずる音', '咳', '泣き声', '誰かの話し声', '爪でこする音'])}。${R(['数えたら1人分多い', 'うちの前で止まった', '返事はしない', '聞こえないふりをしてる', 'もう慣れた。慣れたくなかった'])}`,
    () => `今夜の寒さは${R(['水が瓶ごと割れた', '吐いた息が床に落ちる', '毛布が板みたいだ', 'まつ毛が凍ってくっつく', '歯が鳴って舌を噛んだ'])}。${R(['朝まで何人残るか', '眠ったら終わりだ', '火がほしい', 'もう震えも出ない'])}`
  ],
  shinya: [
    () => `${R(['眠れない', 'まだ起きてる', 'また目が覚めた', '今夜も駄目だ'])}。${R(['天井のしみを数えてる', '扉の鎖を何度も触ってる', '自分の脈を数えてる', '誰かの息を数えてる', '朝までの時間を数えてる', '同じ行を何度も読んでる'])}。${R(['合わない', '止められない', '数えてないと怖い', '数えても怖い'])}`,
    () => `部屋の${R(['隅', '天井', '窓の外', '扉の下', '寝床の横'])}に${R(['誰かいる気がする', '影がある。動かない', '目がある気がする', 'さっきはなかった形がある'])}。${R(['見ないようにしてる', '明かりをつける勇気がない', '朝になれば消える。たぶん', '昨日より近い'])}`,
    () => `${R(['呼び鈴', '足音', '壁を叩く音', '名前を呼ぶ声', '笑い声'])}を聞いた。${R(['記録には何もない', '家族は誰も聞いてない', '聞いたのは3回目だ', '返事をしそうになった', '自分の声だった気がする'])}`
  ]
};
function setTitle(fresh1) {
  $('boardTitle').textContent = `管区掲示板 ／ 第${hole}壕 ／ ${draw1(C.TITLES)}`;
  if (fresh1) { postNo = 0; voiceIds = {}; IDS = IDS.map(id => Math.random() < 0.5 ? mkId() : id); chatter(); }
}
function renderPost(p, fresh1) {
  const el = document.createElement('div'); el.className = 'post' + (fresh1 && !reduced ? ' new' : '');
  const h = document.createElement('span'); h.className = 'ph';
  h.textContent = `${p.no} 名無しの生存者 ${hhmm(p.at)} ID:${p.id}`;
  el.append(h);
  if (p.anchor) { const a = document.createElement('span'); a.className = 'anc'; a.textContent = `>>${p.anchor}`; el.append(a); }
  el.append(p.text);
  const box = $('posts'); box.append(el);
  while (box.children.length > 9) box.firstChild.remove();
}
function post(text, anchor, avoidId, fresh1 = true, id) {
  if (!id) {                                            // 群衆。3割は一度きりで二度と現れないID
    id = Math.random() < 0.3 ? mkId() : R(IDS); while (id === avoidId) id = R(IDS);
    if (Math.random() < 0.5) text = R(C.TICS)(text);
  }
  const p = { no: ++postNo, id, text, anchor: anchor ? anchor.no : 0, at: new Date() };
  posts.push(p); if (posts.length > 30) posts.shift();
  renderPost(p, fresh1);
  return p;
}
function runArc() {                                     // 数レスだけ続く小さな流れ
  const arc = draw1(BD.ARCS), made = [], xid = mkId(); let t = 0; arcBusy = true;
  arc.forEach((s, i) => { t += (s.d || 0) * 1000; soon(t, () => {
    const a = s.re != null ? made[s.re] : null;
    made[i] = post(s.t, a, a ? a.id : null, true, s.v === 'x' ? xid : s.v === 'c' ? undefined : vid(s.v));
    if (i === arc.length - 1) arcBusy = false;
  }); });
}
function chatter(fresh1 = true) {
  const recent = posts.slice(-5), x = Math.random(), b = band();
  if (fresh1 && !arcBusy && Math.random() < 0.035) return runArc();
  if (recent.length > 1 && x < 0.2) { const t = R(recent); post(uniq(byHour(() => TX(R(BD.RE)))), t, t.id, fresh1); }
  else if (recent.length > 1 && x < 0.3) { const t = R(recent); post(uniq(byHour(() => Math.random() < 0.5 ? R(C.REPLIES)() : R(C.ACC)() + R(C.TAILS))), t, t.id, fresh1); }
  else if (x < 0.57) post(uniq(() => Math.random() < 0.55 ? TX(R(BD.BAND[b])) : R(GEN[b])()), null, null, fresh1);
  else if (x < 0.8) { const v = draw1(VBY[b]); post(TX(draw1(v.l)), null, null, fresh1, vid(v.k)); }
  else if (x < 0.89) post(uniq(() => R(BD.APT)), null, null, fresh1);
  else if (x < 0.94) post(TX(draw1(BD.ADS)), null, null, fresh1, vid('ad'));
  else post(uniq(() => R(C.STARTERS)()), null, null, fresh1);
}
function loopChatter() { chatter(); setTimeout(loopChatter, ri(7000, 19000)); }
function react(key, arg, delay, anchor) {               // 出来事に反応する書き込み
  const pool = C.REACT[key] || (key === 'chalk' ? BD.CHALK : null); if (!pool) return;
  soon(delay, () => { const t = anchor && anchor(); post(uniq(() => R(pool)(arg)), t || null, t ? t.id : null); });
}
function reactTo(b) {
  if (b.lure) {
    react('lure', b, 3500);
    soon(7000, () => { goer = post(uniq(() => R(C.REACT.go)()), null, null, true, mkId()); });
    react('stop', b, 10500, () => goer);
    react('sneer', b, 14000, () => posts[posts.length - 1]);
    return;
  }
  if (b.after === 'lure') {
    soon(4000, () => { if (goer) post('行くって言ってたやつ、あれから書き込みないな', goer, goer.id); else post(uniq(() => R(C.REACT.after)())); });
    react('after', b, 8000);
    react('afterBack', b, 12000, () => posts[posts.length - 1]);
    soon(13000, () => { goer = null; });
    return;
  }
  const key = b.key === 'fire' ? 'boom' : b.key;
  if (C.REACT[key]) { react(key, b, ri(3000, 6000)); if (Math.random() < 0.4) react(key, b, ri(8000, 12000)); }
}
