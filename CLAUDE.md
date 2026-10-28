# 第七管区 緊急放送網

架空の終末世界のニュースを流し続ける静的な1枚ページ（GitHub Pages で `main` を公開）。ビルドなし、依存なし。

## 持ち主について

- 持ち主はプログラミングを学び始めたところ。説明は日本語で、専門用語（commit・push・PR など）は出てきたときに一言で説明する。
- 持ち主はコードを1行ずつは読まない。変更は「何を・なぜ・どう確かめたか」を日本語で要約して伝える。

## 変更の進め方（必ず守る）

- 変更ができたら、まず会話の中で「何を・なぜ・どう確かめたか」を説明し、「PR にするか、`main` に push するか」を聞く。
  - PR：ブランチに送って PR を作る。公開ページは変わらず、持ち主が GitHub で確かめて取り込んだときに反映される。
  - push：`main` に直接送る。数分で公開ページに反映される。
- 持ち主の返事なしに `main` へ push しない（「push して」と言われたときだけ）。
- push・PR の前に `tools/check.js` を通す（下記）。

## トークンを節約する読み方

- ファイル全体を読まない。まず Grep で場所を探し、前後だけを `offset`/`limit` 付きで読む。
- `data/music.js` は読まない（1行が数万文字。`.ignore` で検索からも外してある）。曲の一覧は
  `grep -o '"id":"[^"]*","t":"[^"]*","c":"[^"]*"' data/music.js`、1曲だけなら `grep -n '"id":"曲のid"' data/music.js | cut -c1-200`。
- 何ファイルにもまたがる広い調査は、サブエージェント（Explore、model は haiku）に場所探しだけを任せ、
  結論（ファイル名と行番号）だけを受け取る。修正は自分で読んでから行う。小さな調査には使わない（かえって高くつく）。
- 同じファイルを何度も読み直さない。

## ファイルの地図

| 場所 | 中身 |
| --- | --- |
| `index.html` | 画面の骨組み。末尾の `<script>` の並び順が実行順 |
| `style.css` | 見た目。区切りは `grep -n '^/\* ---' style.css` で一覧できる |
| `js/base.js` | 共通の道具（`$` `R` `ri` `draw1` `fresh`）・架空の地名・設定の保存（`prefs` `save`）・闇市相場・配給所の黒板 |
| `js/news.js` | 速報の発報（`issue` `tick`）・続きもの・画面の揺れと明滅 |
| `js/board.js` | 掲示板の小窓（`chatter` `post` `reactTo`） |
| `js/meters.js` | 計器（線量・気温）・画面下の通達（`fillTicker`） |
| `js/door.js` | 玄関インターホン（`doorRing` `drawVisitor` `drawThing`） |
| `js/outside.js` | 壁外監視カメラ（`outTrigger` `drawOut`） |
| `js/takeover.js` | 画面の乗っ取り（`takeover` `SCENES`） |
| `js/sound.js` | 音の配線・効果音・警報・呼び鈴・読み上げ（`ensureAudio` `sfx` `siren`） |
| `js/gramophone.js` | 館内蓄音機（`TIMBRES` `renderPiece` `startRec`）・画面の消灯防止 |
| `js/settings.js` | 設定シート・操作バー・全画面・パネル切り替え（`layout` `showPane`） |
| `js/pip.js` | 小窓（最前面の小さな窓。`openPip` `closedPip`）。開くと `#app` などを小窓の文書へ移す。`$()` は両方から探す |
| `js/main.js` | 起動とタイマー開始・動作確認用の `window.__kb7` |
| `data/news/<分類>.js` | 速報の部品。1分類1ファイル（boom 爆発, rad 放射線, weather 気象, water 給水, food 配給, power 電力, comm 通信, odd 異常, order 治安, move 交通, health 衛生, gov 行政, econ 経済, outside 壁外, missing 行方不明, station 局から） |
| `data/content.js` | その他の文面：一点もの・親切そうな放送・続きもの・通達・来訪者・掲示板の共通部分・乗っ取り・壁外カメラ・人以外の来訪 |
| `data/board.js` | 掲示板の文面（時間帯ごと・書き癖・広告・集合住宅の苦情・黒板） |
| `data/music.js` | 曲の音符データ（読まない） |

## 仕組みの注意

- `js/*.js` は1つの広さの名前を共有する（モジュールではない）。新しい名前は全ファイルで重複させない。
  ブラウザに元からある名前（`opener` `name` `top` `status` など）も使わない。
- 読み込み時にすぐ実行する処理は `js/main.js` に置く。ほかのファイルは定義と、自分のファイル内で完結する登録だけにする
  （後ろのファイルの関数は、読み込み中にはまだ存在しない）。
- 速報の分類を足すときは `data/news/` にファイルを作り、`index.html` の `data/content.js` より前に `<script>` を足す。
- 新しい `js/` ファイルを作ったら `index.html` の `<script>` に足す。

## 動作確認

```
NODE_PATH=$(npm root -g) node tools/check.js
```

Chromium でページを開き、エラーの有無と主な仕掛け（乗っ取り・壁外・来訪者・掲示板・黒板・パネル・設定・曲の合成）を一通り動かす。
「エラーなし」で終わればよい。見た目の確認が要るときは、スクリーンショットを撮って持ち主に見せる。
