# 第七管区 緊急放送網

架空の終末世界のニュースを流し続けるWebページです。iPadなどで開きっぱなしにして、偽の終末世界の雰囲気を楽しむためのものです。

**開く → https://kakkun15.github.io/shuumatsu-news/**

> 登場する地名・施設・組織・出来事はすべてフィクションです。実在の警報や放送とは関係ありません。

## 出てくるもの

- **速報**：爆破、線量、黒い雨、通信途絶、正体不明の異常、壁の外の動きなど16分類。「見出し × 状況 × 対応 × 指示」を組み合わせて作るので、1分間隔で24時間流しても、同じ文面はほぼ出ません（見出しの型は約220、ほかに一点もの34本）。出した見出しは端末が覚えていて、開き直しても繰り返しません。
- **続きもの**：調査隊の出発→通信途絶→1名だけ帰還、のように数報にまたがる話が12本あります。
- **親切そうな放送**：発信元不明の「ご案内」がたまに混ざります。数報あとに、本物の局から訂正が出ます。
- **玄関インターホン**：扉の前に、出てはいけない相手や都合の悪い相手が来ます（85種類＋「おかしな点」の組み合わせ）。
- **壁外監視カメラ**：壁の外の廃墟を映します。人影の列、移動する灯火、昨日はなかった塔など。時刻で空の色が変わります。
- **管区掲示板**：住民どうしの罵り合い。速報・来訪者・壁外の動き・流れている曲にも反応します。
- **闇市相場**：物の値段は上がり続け、日当は据え置きのまま。桁が増えすぎると新券に切り替わります。
- **画面の乗っ取り**：数分に一度、不明な信号が画面全体を奪います（9種類）。何も操作しなくても、数秒〜20秒ほどで自動的に終わります。
- **館内蓄音機**：著作権の切れた56曲（合計およそ143分）を、壊れたレコードのように流します。曲は1曲まるごと入っています。音色（ピアノ／弦／オルガン／オルゴール／声のようなもの）と、盤の状態（針飛び・回転むら・ノイズ・こもり・残響・回転数）を変えられます。自分の音声ファイルを選んで同じ壊れ方で流すこともできます（ファイルは端末の中だけで処理され、どこにも送信されません）。

## 使い方

1. 上のリンクを開く（iPadは横向きがおすすめ）。
2. 右上の「設定」から、速報の間隔・警報音・読み上げ・盤・音色・盤の状態などを変えられます。
3. 音はブラウザの決まりで、ボタンを押すまで鳴りません。「館内蓄音機」の再生と、設定の「警報音・呼び鈴」を自分で入れてください。

## 注意

- **急な明るさの変化と画面の揺れがあります。** 光の刺激が苦手な方は、設定の「画面の揺れ・明滅」と「画面の乗っ取り」を切ってください。端末側で「視差効果を減らす」などを有効にしている場合は自動で止まります。
- 警報音は大きめです。音量に気をつけてください。
- 人目につく場所で流すと本物の警報と間違われるおそれがあります。画面下に「この放送はフィクションです」と表示していますが、場所は選んでください。

## ファイル

| ファイル | 中身 |
| --- | --- |
| `index.html` | 画面と動きの本体 |
| `content.js` | 文面の部品（速報・来訪者・掲示板・乗っ取り・壁外カメラ） |
| `music.js` | 曲の音符データ |

3つを同じ場所に置けば、ダウンロードしてそのまま開いても動きます（文字のフォントだけ Google Fonts から読み込みます）。

## 曲と権利について

- 録音は一切含みません。`music.js` に入っているのは音符の並び（開始時刻・長さ・音の高さ）だけで、音はブラウザの中で合成しています。
- 曲そのものは、すべて作曲者の没後80年以上が過ぎた作品です。
- 曲の著作権が切れていても、楽譜の入力データやMIDIファイルには入力した人の権利が残っていることがあります。そのため、音符データは [Mutopia Project](https://www.mutopiaproject.org/) のうち、入力者が **Public Domain と明記して公開している楽譜**だけから作りました（同じ曲でも Creative Commons 表示のものは使っていません）。Mutopia の説明では、Public Domain の楽譜は印刷・変更・配布・演奏などを制限なく行えます（<https://www.mutopiaproject.org/legal.html>）。
- 例外は2曲です。「主よ、人の望みの喜びよ」（BWV 147）は Mutopia に無かったため、バッハの原曲の音（オブリガート・コラール3声・通奏低音）をこのページ用に5声へ縮約して打ち込みました。音の確認には Nancho Alvarez 氏が公開している校訂譜を参照しています（この譜面ファイル自体は使っておらず、ライセンスの記載もありません）。「パッヘルベルのカノン」は手で打ち込んだ3声版です。
- 楽譜を入力・公開してくださった方々に感謝します。

| 曲 | 作曲者 | 長さ | 音符データの出どころ |
| --- | --- | --- | --- |
| 主よ、人の望みの喜びよ | バッハ | 3:14 | このページ用に作った5声の縮約（下記） |
| G線上のアリア | バッハ | 2:07 | Mutopia Project `BachJS/BWV1068/bach_air_bmv_1068`（入力：Mike Blackstock） |
| トッカータとフーガ ニ短調 | バッハ | 9:32 | Mutopia Project `BachJS/BWV565/ToccataFugue`（入力：Anonymous） |
| 平均律 第1巻 前奏曲 ハ長調 | バッハ | 2:20 | Mutopia Project `BachJS/BWV846/wtk1-prelude1`（入力：Tobias Erbsland） |
| 無伴奏チェロ組曲 第1番 前奏曲 | バッハ | 2:09 | Mutopia Project `BachJS/BWV1007/bwv1007`（入力：Andreas Scherer） |
| インベンション 第13番 | バッハ | 1:07 | Mutopia Project `BachJS/BWV784/bach-invention-13`（入力：Allen Garvin） |
| メヌエット ト長調 | ペツォールト（伝バッハ） | 0:46 | Mutopia Project `BachJS/BWVAnh114/anna-magdalena-04`（入力：Allen Garvin） |
| 羊は安らかに草を食み | バッハ | 3:08 | Mutopia Project `BachJS/BWV208/Sheep`（入力：Jeremy Visser） |
| 平均律 第1巻 前奏曲 ハ短調 | バッハ | 1:19 | Mutopia Project `BachJS/BWV847/bwv847a`（入力：Davide Castellone） |
| エリーゼのために | ベートーヴェン | 2:10 | Mutopia Project `BeethovenLv/WoO59/fur_Elise_WoO59`（入力：Stelios Samelis） |
| 悲愴ソナタ 第2楽章 | ベートーヴェン | 4:03 | Mutopia Project `BeethovenLv/O13/pathetique-2`（入力：Chris Sawer） |
| 歓喜の歌 | ベートーヴェン | 0:48 | Mutopia Project `BeethovenLv/ode`（入力：Peter Chubb） |
| トルコ行進曲 | モーツァルト | 4:14 | Mutopia Project `MozartWA/KV331/KV331_3_RondoAllaTurca`（入力：Rune Zedeler and Chris Sawer） |
| アイネ・クライネ・ナハトムジーク 第1楽章 | モーツァルト | 5:20 | Mutopia Project `MozartWA/KV525/eine-kleine-nachtmusik-mvt1`（入力：Anonymous） |
| 雨だれの前奏曲 | ショパン | 4:57 | Mutopia Project `ChopinFF/O28/Chop-28-15`（入力：Magnus Lewis-Smith） |
| 前奏曲 第4番 ホ短調 | ショパン | 1:48 | Mutopia Project `ChopinFF/O28/Chop-28-4`（入力：Magnus Lewis-Smith） |
| 前奏曲 第7番 イ長調 | ショパン | 0:40 | Mutopia Project `ChopinFF/O28/Chop-28-7`（入力：Magnus Lewis-Smith） |
| 子犬のワルツ | ショパン | 1:30 | Mutopia Project `ChopinFF/O64/chopin_valse_op64_no1`（入力：Magnus Lewis-Smith） |
| 幻想即興曲 | ショパン | 4:14 | Mutopia Project `ChopinFF/O66/chopin_fantaisie-impromptu`（入力：Guy D. Lederfein） |
| 革命のエチュード | ショパン | 2:05 | Mutopia Project `ChopinFF/O10/op-10-12-wfi`（入力：Roland Goretzki） |
| トロイメライ | シューマン | 2:18 | Mutopia Project `SchumannR/O15/SchumannOp15No07`（入力：Ying-Chun Liu） |
| 見知らぬ国と人々について | シューマン | 0:46 | Mutopia Project `SchumannR/O15/SchumannOp15No01`（入力：Ying-Chun Liu） |
| アヴェ・マリア | シューベルト | 7:10 | Mutopia Project `SchubertF/D839/SchubertF-D839_AveMaria`（入力：Ph. Raynaud） |
| 楽興の時 第3番 | シューベルト | 1:57 | Mutopia Project `SchubertF/D780/MomentsNo3`（入力：Claude Chaudron） |
| 即興曲 作品90-3 | シューベルト | 5:50 | Mutopia Project `SchubertF/D899/SchubertF-D899-3-Impromptu`（入力：Ph. Raynaud） |
| シューベルトの子守歌 | シューベルト | 0:47 | Mutopia Project `SchubertF/D498/schubert_wiegen_lied`（入力：Shogo Mori） |
| ます | シューベルト | 2:10 | Mutopia Project `SchubertF/D550/forelle`（入力：Maurizio Tomasi） |
| ジムノペディ 第1番 | サティ | 2:46 | Mutopia Project `SatieE/gymnopedie_1`（入力：Evin Robertson） |
| ジムノペディ 第3番 | サティ | 3:00 | Mutopia Project `SatieE/gymnopedie_3`（入力：Evin Robertson） |
| 月の光 | ドビュッシー | 5:22 | Mutopia Project `DebussyC/L75/debussy_Ste_Bergamesq_Clair`（入力：Keith OHara） |
| アラベスク 第1番 | ドビュッシー | 3:16 | Mutopia Project `DebussyC/L66/debussy_Arabesque_1`（入力：Keith OHara） |
| 山の魔王の宮殿にて | グリーグ | 2:25 | Mutopia Project `GriegE/O46/Dans_l_antre_du_roi_de_la_montagne`（入力：Coyau） |
| オーセの死 | グリーグ | 3:36 | Mutopia Project `GriegE/O46/02-lamortdase`（入力：Deborah Lowrey） |
| アニトラの踊り | グリーグ | 1:44 | Mutopia Project `GriegE/O46/03-anitrasdance`（入力：Deborah Lowrey） |
| トロルドハウゲンの婚礼の日 | グリーグ | 6:06 | Mutopia Project `GriegE/O65/troldhaugen`（入力：David Whipple） |
| 朝の祈り | チャイコフスキー | 1:10 | Mutopia Project `TchaikovskyPI/O39/01MorningPrayer`（入力：Rem Zolotykh） |
| 木の兵隊の行進 | チャイコフスキー | 0:40 | Mutopia Project `TchaikovskyPI/O39/05MarchOfTheWoodenSoldiers`（入力：Anonymous） |
| 古いフランスの歌 | チャイコフスキー | 0:55 | Mutopia Project `TchaikovskyPI/O39/16OldFrenchSong`（入力：David McNamara） |
| 四季より 1月「炉端にて」 | チャイコフスキー | 4:17 | Mutopia Project `TchaikovskyPI/O37/Tschaikowsky-op37.1`（入力：Till Rettig） |
| ブラームスの子守歌 | ブラームス | 0:53 | Mutopia Project `BrahmsJ/O49/Wiegenlied`（入力：森 章吾） |
| ワルツ 第15番 | ブラームス | 1:20 | Mutopia Project `BrahmsJ/O39/waltz-op39-15`（入力：Brian D. Rude） |
| ジ・エンターテイナー | ジョプリン | 4:13 | Mutopia Project `JoplinS/entertainer`（入力：Chris Sawer） |
| メープル・リーフ・ラグ | ジョプリン | 2:24 | Mutopia Project `JoplinS/maple`（入力：Chris Sawer） |
| 素直な心 | ブルグミュラー | 0:40 | Mutopia Project `BurgmullerJFF/O100/25EF-01`（入力：Bas Wassink） |
| アラベスク | ブルグミュラー | 0:29 | Mutopia Project `BurgmullerJFF/O100/25EF-02`（入力：Bas Wassink） |
| 無邪気 | ブルグミュラー | 0:30 | Mutopia Project `BurgmullerJFF/O100/25EF-05`（入力：Bas Wassink） |
| バラード | ブルグミュラー | 1:23 | Mutopia Project `BurgmullerJFF/O100/25EF-15`（入力：Bas Wassink） |
| ドリー組曲より 子守歌 | フォーレ | 2:45 | Mutopia Project `FaureG/O56/faure_dolly_berceuse`（入力：Mike Blackstock） |
| 木星の聖歌（サクステッド） | ホルスト | 0:54 | Mutopia Project `HolstGT/Thaxted`（入力：Peter Chubb） |
| アメイジング・グレイス | 賛美歌 | 0:56 | Mutopia Project `Anonymous/new_britain`（入力：Steve Dunlop） |
| グリーンスリーブス | イングランド民謡 | 0:48 | Mutopia Project `Traditional/GreensleevesAcc`（入力：Ralf Axel Gehlert） |
| ソナチネ 作品36-1 | クレメンティ | 3:10 | Mutopia Project `ClementiM/O36/sonatina-1`（入力：Brian D. Rude） |
| ハレルヤ | ヘンデル | 3:08 | Mutopia Project `HandelGF/hallelujah`（入力：Joshua Koo） |
| すべては終わりぬ（Hard Times） | フォスター | 1:20 | Mutopia Project `FosterSC/hardtimes`（入力：Stan Sanderson） |
| メヌエット 変ホ長調 | ベートーヴェン | 3:16 | Mutopia Project `BeethovenLv/WoO82/menuett_WoO82`（入力：Stelios Samelis） |
| パッヘルベルのカノン | パッヘルベル | 2:04 | このページ用に手で打ち込んだ3声版 |

長さは通常の回転数での目安です。繰り返し記号は展開していないので、演奏会の録音より短い曲があります。
