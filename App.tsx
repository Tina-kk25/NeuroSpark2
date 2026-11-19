import React, { useEffect, useId, useRef, useState } from 'react';
import './App.css';

// Working title: change these four strings to rename the game.
const LOGO_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 96 96\" fill=\"none\"><defs><linearGradient id=\"b\" x1=\"17\" y1=\"15\" x2=\"77\" y2=\"82\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#e5ceff\"/><stop offset=\".52\" stop-color=\"#c8a8ed\"/><stop offset=\"1\" stop-color=\"#9473cc\"/></linearGradient><linearGradient id=\"w\" x1=\"20\" y1=\"30\" x2=\"76\" y2=\"65\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#fff2c7\"/><stop offset=\".5\" stop-color=\"#8cf2ea\"/><stop offset=\"1\" stop-color=\"#c8ecff\"/></linearGradient><filter id=\"g\" x=\"-80%\" y=\"-80%\" width=\"260%\" height=\"260%\"><feGaussianBlur stdDeviation=\"1.6\" result=\"a\"/><feMerge><feMergeNode in=\"a\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter></defs><path d=\"M46 17C37 9 25 15 22 25C10 24 5 36 11 46C3 59 11 73 24 73C27 86 42 89 52 81C65 89 79 80 80 69C94 63 95 47 84 39C88 23 72 10 59 17C54 12 49 12 46 17Z\" fill=\"url(#b)\" stroke=\"#9975ca\" stroke-width=\"1.5\"/><g stroke=\"#a17acb\" stroke-width=\"2\" stroke-linecap=\"round\" opacity=\".65\"><path d=\"M46 17C42 27 48 34 45 43M22 25C32 25 37 34 33 41M11 46C22 41 29 48 28 58M24 73C29 62 41 64 45 74M59 17C56 27 66 31 72 28M84 39C74 36 66 43 68 50M80 69C70 66 65 72 65 80M51 53C45 61 50 69 56 68\"/></g><g stroke=\"url(#w)\" stroke-width=\"2.4\" stroke-linecap=\"round\" filter=\"url(#g)\"><path d=\"M25 35C34 40 35 49 49 48S62 38 73 38M49 48C42 59 34 63 27 62M49 48C62 49 65 59 72 63\"/></g><g fill=\"#fff3bf\" stroke=\"#fffce8\" stroke-width=\".7\" filter=\"url(#g)\"><circle cx=\"25\" cy=\"35\" r=\"3\"/><circle cx=\"49\" cy=\"48\" r=\"4.1\"/><circle cx=\"73\" cy=\"38\" r=\"3\"/><circle cx=\"27\" cy=\"62\" r=\"3\"/><circle cx=\"72\" cy=\"63\" r=\"3\"/></g></svg>");
const TITLE = ['НейроИскра', 'NeuroSpark', 'ニューロスパーク', '神经火花'] as const;
type Lang = 0 | 1 | 2 | 3;
type Text4 = readonly [string, string, string, string];
type Tier = 0 | 1 | 2 | 3;
type TopicStats = Record<Exclude<Category, 'all'>, {answered:number; correct:number}>;
type Category = 'all' | 'nets' | 'area' | 'percent' | 'mental';
type Solid = 'cube' | 'box' | 'prism' | 'pyramid' | 'tetra';
type Shape = 'square' | 'rectangle' | 'triangle' | 'parallelogram' | 'trapezoid' | 'circle';
type Visual = { kind: 'solid' | 'net'; solid: Solid; turn?: number } | { kind: 'shape'; shape: Shape };
type Option = { text: Text4; visual?: Visual };
export type Question = {
  id: string; category: Exclude<Category, 'all'>; level: number; prompt: Text4;
  visual?: Visual; options: Option[]; correct: number; hint: Text4;
  explanation: Text4; application: Text4; source: 'openstax' | 'nets' | 'arithmetic' | 'distributive';
};
type HistoryEntry = {id:string; at:number; round:string; selected:number; helped:boolean; training:boolean; tier:Tier};
const HISTORY_LIMIT=3000;
type Attempt = { q: Question; selected: number; helped: boolean };
const tx = (ru: string, en: string, ja: string, zh: string): Text4 => [ru, en, ja, zh];
const UI = {
  history: tx('История ответов','Answer history','回答履歴','答题记录'),
  historyNote: tx('Последние 3000 ответов, включая тренировку. История начинается с этой версии и хранится в этом браузере. Старые игры восстановить нельзя.','The latest 3,000 answers, including practice. History starts with this version and stays in this browser. Earlier games cannot be recovered.','復習を含む直近3000件をこのブラウザに保存します。このバージョン以降の記録です。以前のゲームは復元できません。','保存最近3000次作答（含练习），记录从此版本开始，仅保存在当前浏览器中，无法恢复旧游戏。'),
  historyEmpty: tx('Пока нет ответов. Сыграй первый раунд!','No answers yet. Play your first round!','まだ回答がありません。まずプレイしてみよう！','暂无记录，开始第一轮吧！'),
  onlyMistakes: tx('Только ошибки','Mistakes only','間違いのみ','只看错题'),
  loadMore: tx('Показать ещё','Show more','さらに表示','显示更多'),
  seenProgress: tx('Уже встречалось','Cards seen','出題済み','已见题目'),

  tagline: tx('Маленький раунд. Новые связи.', 'Small rounds. New connections.', '短い挑戦、新しいつながり。', '短时挑战，连接新思路。'),
  intro: tx('Смотри, считай, соединяй. Разбуди любопытство за одну минуту.', 'See, calculate, connect. Spark your curiosity in one minute.', '見て、計算して、つなげよう。1分間のひらめき。', '观察、计算、连接。用一分钟点亮好奇心。'),
  play: tx('Начать игру', 'Let’s play', 'ゲーム開始', '开始游戏'),
  rules: tx('60 секунд · до 3 ошибок · 1 подсказка', '60 seconds · 3 mistakes end the round · 1 hint', '60秒・3回のミスで終了・ヒント1回', '60秒 · 错3次结束 · 1次提示'),
  theme: tx('Что тренируем?', 'Pick your focus', 'テーマを選択', '选择训练主题'),
  all: tx('Всё вместе', 'Mix it up', 'ミックス', '综合挑战'),
  nets: tx('Развёртки', 'Nets & solids', '立体と展開図', '立体与展开图'),
  area: tx('Площади', 'Areas', '面積', '面积公式'),
  percent: tx('Проценты', 'Percentages', '百分率', '百分比'),
  mental: tx('Устный счёт', 'Mental math', '暗算', '心算技巧'),
  hint: tx('Подсказка', 'Hint', 'ヒント', '提示'),
  used: tx('Использована', 'Used', '使用済み', '已使用'),
  score: tx('Верно', 'Correct', '正解', '答对'),
  mistakes: tx('Ошибки', 'Mistakes', 'ミス', '错误'),
  level: tx('Сложность', 'Difficulty', '難易度', '难度'),
  streak: tx('Серия', 'Streak', '連続正解', '连对'),
  neural: tx('Твоя сеть', 'Your network', 'あなたのネットワーク', '你的神经网络'),
  schema: tx('Условная схема: не измеряет активность мозга.', 'Illustrative diagram, not a measurement of brain activity.', '模式図です。脳活動の測定ではありません。', '示意图，不代表实际脑活动测量。'),
  sound: tx('Звук', 'Sound', 'サウンド', '音效'),
  soundOn: tx('Звук включён. Выключить', 'Sound on. Mute', 'サウンドON・消音する', '音效已开启，点击静音'),
  soundOff: tx('Звук выключен. Включить', 'Sound off. Enable', 'サウンドOFF・有効にする', '音效已关闭，点击开启'),
  soundUnavailable: tx('Звук недоступен в этом браузере', 'Sound is unavailable in this browser', 'このブラウザではサウンドを使えません', '当前浏览器不支持音效'),
  replayMagic: tx('Ещё немного волшебства', 'A little more magic', 'もう一度きらめきを', '再来一点魔法'),
  levelUp: tx('Новый шаг!', 'A new step!', 'ステップアップ！', '更进一步！'),
  playMenu: tx('Играть', 'Play', '遊ぶ', '开始'),
  myProgress: tx('Мои успехи', 'My progress', 'マイ成績', '我的进步'),
  chooseDifficulty: tx('Уровень сложности', 'Difficulty level', '難易度を選択', '选择难度'),
  freelyOpen: tx('Все уровни открыты', 'All levels available', '全レベル選択可能', '所有难度均已开放'),
  difficultyNames: [tx('Простой', 'Easy', '初級', '简单'),tx('Средний', 'Medium', '中級', '中等'),tx('Сложный', 'Hard', '上級', '困难'),tx('Продвинутый', 'Advanced', '発展', '进阶')],
  difficultyDescriptions: [tx('Знакомые формы и лёгкий счёт', 'Familiar shapes & easy sums', '身近な図形と簡単な計算', '常见图形与简单计算'),tx('Чуть больше размышлений', 'A little more thinking', '少し考える問題', '多一点思考'),tx('Несколько шагов к ответу', 'A few steps to the answer', '段階を踏んで解こう', '需要分步思考'),tx('Самые интересные вызовы', 'The biggest challenges', '手応えのある挑戦', '更具挑战性的题目')],
  progressIntro: tx('Каждый раунд — маленький шаг вперёд.', 'Every round is a small step forward.', '1ラウンドずつ、少しずつ前へ。', '每一局，都是向前的一小步。'),
  bestResult: tx('Лучший результат', 'Personal best', '最高記録', '最佳成绩'),
  bestNote: tx('Верных ответов за один раунд', 'Correct answers in one round', '1ラウンドの正解数', '单局答对题数'),
  points: tx('очков', 'points', '点', '分'),
  rounds: tx('Раундов сыграно', 'Rounds played', 'プレイ回数', '已玩局数'),
  finishedRounds: tx('Завершённые игровые раунды', 'Completed game rounds', '終了したゲームの回数', '已结束的正式游戏'),
  correctOf: tx('верных ответов', 'correct answers', '正解', '题答对'),
  strongest: tx('Что удаётся лучше всего', 'Your strongest topics', '得意なテーマ', '最擅长的主题'),
  strongestNote: tx('Лучшая точность среди тем, где есть хотя бы 3 ответа. Результат меняется вместе с твоим опытом.', 'Highest accuracy among topics with at least 3 answers. This changes as you play.', '3問以上回答したテーマの中で最も高い正答率です。プレイに応じて変わります。', '在至少作答3题的主题中正确率最高，会随着练习而变化。'),
  notEnough: tx('Давай узнаем твои сильные стороны', 'Let’s discover your strengths', '得意を見つけよう', '一起发现你的强项'),
  tryMore: tx('Ответь хотя бы на 3 вопроса одной темы — здесь появится первый результат.', 'Answer at least 3 questions in one topic to see your first result.', '同じテーマで3問以上答えると、最初の結果が表示されます。', '在同一主题作答至少3题，就能看到第一个结果。'),
  topicProgress: tx('По темам', 'By topic', 'テーマ別', '各主题表现'),
  allTime: tx('За все игры', 'All games', '全ゲーム', '所有游戏'),
  formulas: tx('Формулы и площади', 'Formulas & areas', '公式と面積', '公式与面积'),
  statsNote: tx('Подробная статистика собирается с этой версии. Тренировка ошибок не меняет общие результаты. Данные сохраняются в этом браузере.', 'Detailed statistics start with this version. Mistake practice does not affect totals. Data is saved in this browser.', '詳しい統計はこのバージョンから記録します。復習は集計に含みません。データはこのブラウザに保存されます。', '详细统计从此版本开始记录，错题复习不计入总成绩，数据保存在当前浏览器中。'),
  ranks: [tx('Нейрон', 'Neuron', 'ニューロン', '神经元'), tx('Первая связь', 'First connection', '最初のつながり', '初次连接'), tx('Цепочка', 'Neural chain', 'つながりの輪', '神经链'), tx('Нейросеть', 'Neural network', 'ニューラルネットワーク', '神经网络'), tx('Супермозг', 'Super brain', 'スーパーブレイン', '超级大脑')],
  nextRank: tx('до следующего ранга', 'to the next rank', '次のランクまで', '距离下一等级'),
  xp: tx('связей', 'connections', 'つながり', '连接'),
  rankNote: tx('Игровой прогресс, а не оценка IQ.', 'Game progress, not an IQ score.', 'ゲーム内の進捗です。IQ評価ではありません。', '仅表示游戏进度，不是智商评分。'),
  done: tx('Связи стали крепче', 'Connections made', 'ひらめきがつながった', '思路已连接'),
  timeout: tx('Время вышло', 'Time’s up', '時間終了', '时间到'),
  three: tx('Три ошибки — пора разобрать решения', 'Three mistakes — time to explore the solutions', '3回のミス。解説を見てみよう', '错了三次，一起看看解法'),
  complete: tx('Все карточки пройдены', 'All cards completed', '全問終了', '全部完成'),
  accuracy: tx('Точность', 'Accuracy', '正答率', '正确率'),
  again: tx('Ещё раунд', 'Play again', 'もう一度', '再来一局'),
  home: tx('На главную', 'Home', 'ホーム', '返回首页'),
  review: tx('Разбор ответов', 'Explore your answers', '答えと解説', '答案解析'),
  retry: tx('Повторить ошибки', 'Practice mistakes', '間違いを復習', '复习错题'),
  training: tx('Тренировка без таймера', 'Untimed practice', '時間制限なしの復習', '不限时练习'),
  chosen: tx('Твой ответ', 'Your answer', 'あなたの答え', '你的答案'),
  right: tx('Правильный ответ', 'Correct answer', '正しい答え', '正确答案'),
  why: tx('Как это работает', 'How it works', '考え方', '解题思路'),
  life: tx('Пригодится в жизни', 'Use it in real life', '日常での活用', '生活中的应用'),
  helped: tx('С подсказкой', 'With a hint', 'ヒント使用', '使用了提示'),
  empty: tx('Ответов пока нет. Попробуем ещё раз?', 'No answers yet. Try another round?', 'まだ回答がありません。もう一度挑戦しよう。', '还没有作答，再试一次吧。'),
  sources: tx('Источники и точность', 'Sources & accuracy', '出典と正確性', '来源与准确性'),
  sourceNote: tx('Формулы сверены с OpenStax. Развёртки — с MathWorld и учебными образцами Pearson. Рисунки и задания созданы для игры. Арифметические ответы вычисляются из условий. Масштаб рисунков условный.', 'Formulas checked against OpenStax; nets against MathWorld and Pearson teaching models. Original game diagrams and questions. Arithmetic answers are calculated from each problem. Diagrams are not to scale.', '公式はOpenStax、展開図はMathWorldとPearsonの教材を参照。図と問題は本ゲーム用に作成。計算問題の答えは条件から算出しています。図は縮尺どおりではありません。', '公式参照OpenStax，展开图参照MathWorld及Pearson教材。图形与题目为本游戏原创，算术答案根据题目条件计算，图形不按比例绘制。'),
  storage: tx('Прогресс не удалось сохранить в этом браузере.', 'Progress could not be saved in this browser.', 'このブラウザでは進捗を保存できませんでした。', '此浏览器无法保存进度。'),
  shortcuts: tx('Клавиши 1–4 — ответ · H — подсказка', 'Keys 1–4 to answer · H for a hint', '1〜4キーで回答・Hでヒント', '按1–4作答 · H查看提示'),
  furigana: tx('Фуригана', 'Furigana', 'ふりがな', '日语注音'),
  stop: tx('Завершить раунд', 'End round', 'ラウンド終了', '结束本局'),
};
export const DIFFICULTY_RANGES = [{min:1,max:2},{min:2,max:3},{min:3,max:4},{min:4,max:5}] as const;
const TOPICS = ['nets','area','percent','mental'] as const;
const emptyStats = ():TopicStats => ({nets:{answered:0,correct:0},area:{answered:0,correct:0},percent:{answered:0,correct:0},mental:{answered:0,correct:0}});
const NAMES: Record<Solid | Shape, Text4> = {
  cube: tx('Куб', 'Cube', '立方体', '正方体'), box: tx('Прямоугольный параллелепипед', 'Rectangular prism', '直方体', '长方体'),
  prism: tx('Прямая треугольная призма', 'Right triangular prism', '直三角柱', '直三棱柱'), pyramid: tx('Правильная четырёхугольная пирамида', 'Regular square pyramid', '正四角錐', '正四棱锥'),
  tetra: tx('Правильный тетраэдр', 'Regular tetrahedron', '正四面体', '正四面体'), square: tx('Квадрат', 'Square', '正方形', '正方形'), rectangle: tx('Прямоугольник', 'Rectangle', '長方形', '长方形'),
  triangle: tx('Треугольник', 'Triangle', '三角形', '三角形'), parallelogram: tx('Параллелограмм', 'Parallelogram', '平行四辺形', '平行四边形'), trapezoid: tx('Трапеция', 'Trapezoid', '台形', '梯形'), circle: tx('Круг', 'Disk', '円', '圆'),
};
const SOURCE = {
  openstax: 'https://openstax.org/books/prealgebra-2e/pages/c-geometric-formulas',
  nets: 'https://mathworld.wolfram.com/Net.html',
  distributive: 'https://openstax.org/books/prealgebra-2e/pages/7-3-distributive-property',
  arithmetic: 'https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent',
};
const SOLIDS: Solid[] = ['cube', 'box', 'prism', 'pyramid', 'tetra'];
const netFacts: Record<Solid, Text4> = {
  cube: tx('У куба 6 одинаковых квадратных граней. Их расположение тоже важно: при складывании грани не должны накладываться.', 'A cube has 6 congruent square faces. Their arrangement matters: the faces must not overlap when folded.', '立方体は合同な正方形6枚でできています。折るときに面が重ならない配置が必要です。', '正方体有6个全等的正方形面。排列也很重要，折叠时各面不能重叠。'),
  box: tx('Три пары равных прямоугольников образуют противоположные грани коробки. Длины соединяемых рёбер совпадают.', 'Three pairs of congruent rectangles form the opposite faces of the box. Joined edges have matching lengths.', '直方体は合同な長方形3組でできています。つなぐ辺の長さは一致します。', '三对全等长方形组成长方体的相对面，相连的棱长度相等。'),
  prism: tx('Два одинаковых треугольника — основания. Три прямоугольника — боковые грани прямой призмы.', 'Two congruent triangles are the bases. Three rectangles are the lateral faces of a right prism.', '合同な三角形2枚が底面、長方形3枚が直角柱の側面です。', '两个全等三角形是底面，三个长方形是直棱柱的侧面。'),
  pyramid: tx('Квадрат — основание, а четыре одинаковых равнобедренных треугольника сходятся в одной вершине.', 'A square is the base. Four congruent isosceles triangles meet at one apex.', '正方形が底面で、合同な二等辺三角形4枚が1つの頂点で集まります。', '正方形是底面，四个全等的等腰三角形汇聚于一个顶点。'),
  tetra: tx('Правильный тетраэдр состоит из 4 одинаковых равносторонних треугольников. Квадратного основания у него нет.', 'A regular tetrahedron has 4 congruent equilateral triangles. It has no square base.', '正四面体は合同な正三角形4枚でできています。正方形の底面はありません。', '正四面体由4个全等的等边三角形组成，没有正方形底面。'),
};
const netLife: Record<Solid, Text4> = {
  cube: tx('Подарочная коробка: при ребре 5 см площадь шести граней равна 6 × 25 = 150 см², без припусков и клапанов.', 'Gift box: a 5 cm edge needs 6 × 25 = 150 cm² for its six faces, excluding tabs and allowances.', '一辺5cmの箱：6面で6 × 25 = 150cm²。のりしろは別です。', '边长5厘米的礼盒，六面共需6 × 25 = 150平方厘米，不含粘贴边。'),
  box: tx('Упаковка: для закрытой коробки 2 × 3 × 4 см нужно 2(6 + 8 + 12) = 52 см² картона, без припусков.', 'Packaging: a closed 2 × 3 × 4 cm box needs 2(6 + 8 + 12) = 52 cm² of card, excluding allowances.', '2 × 3 × 4cmの箱には2(6 + 8 + 12) = 52cm²の厚紙が必要。のりしろは別です。', '2 × 3 × 4厘米的封闭纸盒需要2(6 + 8 + 12) = 52平方厘米纸板，不含粘贴边。'),
  prism: tx('Треугольная упаковка шоколада: два торца закрывают основания, а три прямоугольника оборачивают боковые стороны.', 'Triangular chocolate packaging: two end pieces close the bases, and three rectangles wrap around the sides.', '三角柱のお菓子箱：三角形2枚で両端を閉じ、長方形3枚で側面を包みます。', '三角形巧克力包装：两个三角形封住两端，三个长方形包住侧面。'),
  pyramid: tx('Подарочная упаковка-пирамида: квадрат задаёт размер дна, а четыре треугольника — стенки.', 'Pyramid gift packaging: the square sets the base size, and four triangles form the walls.', 'ピラミッド型の包装：正方形が底の大きさを決め、三角形4枚が壁になります。', '金字塔形礼盒：正方形决定底部大小，四个三角形构成侧壁。'),
  tetra: tx('Бумажная модель или четырёхгранный игровой кубик: все четыре грани имеют одинаковую форму и размер.', 'Paper models or four-sided dice: all four faces have the same shape and size.', '紙模型や4面サイコロ：4つの面はすべて同じ形と大きさです。', '纸模型或四面骰子：四个面的形状和大小完全相同。'),
};
const areaFacts: Record<Shape, { formula: string; hint: Text4; explanation: Text4; application: Text4 }> = {
  square: { formula: 'S = a²', hint: tx('У квадрата длина равна ширине.', 'A square has equal length and width.', '正方形は縦と横が同じ長さです。', '正方形的长和宽相等。'), explanation: tx('Площадь — сторона, умноженная на себя: a × a = a².', 'Area is the side multiplied by itself: a × a = a².', '面積は一辺 × 一辺、つまりa²です。', '面积等于边长乘以自身：a × a = a²。'), application: tx('Квадратная плитка со стороной 20 см занимает 400 см².', 'A square tile with a 20 cm side covers 400 cm².', '一辺20cmの正方形タイルの面積は400cm²です。', '边长20厘米的正方形瓷砖面积为400平方厘米。') },
  rectangle: { formula: 'S = ab', hint: tx('Посчитай ряды и количество клеток в каждом.', 'Think of rows and the number of squares in each row.', 'マスの行数と1行のマス数を考えよう。', '想想有几行，每行有几个方格。'), explanation: tx('Умножаем две соседние стороны: S = ab.', 'Multiply the two adjacent side lengths: S = ab.', '隣り合う2辺の長さを掛けます。S = ab。', '将相邻两边的长度相乘：S = ab。'), application: tx('Ковёр 2 × 3 м закрывает 6 м² пола.', 'A 2 × 3 m rug covers 6 m² of floor.', '2 × 3mのカーペットは床6m²を覆います。', '2 × 3米的地毯可覆盖6平方米地面。') },
  triangle: { formula: 'S = bh / 2', hint: tx('Два одинаковых треугольника можно сложить в параллелограмм.', 'Two congruent triangles can form a parallelogram.', '合同な三角形2枚で平行四辺形を作れます。', '两个全等三角形可以拼成平行四边形。'), explanation: tx('Половина произведения основания b и перпендикулярной высоты h. Наклонная сторона не заменяет высоту.', 'Half the base b times its perpendicular height h. A sloping side cannot replace the height.', '底辺b × 垂直な高さhの半分です。斜めの辺は高さの代わりになりません。', '底b乘以对应的垂直高度h，再除以2。斜边不能代替高。'), application: tx('Ткань для флажка: основание 30 см, высота 20 см → 300 см² без припусков.', 'Flag fabric: base 30 cm, height 20 cm → 300 cm², excluding seam allowances.', '旗の布：底辺30cm、高さ20cmなら300cm²。縫い代は別です。', '三角旗布料：底30厘米、高20厘米，需要300平方厘米，不含缝份。') },
  parallelogram: { formula: 'S = bh', hint: tx('Мысленно переставь крайний треугольник к другой стороне.', 'Move the end triangle to the other side in your mind.', '端の三角形を反対側へ移すと長方形になります。', '把一端的三角形移到另一端，想象拼成长方形。'), explanation: tx('Основание b умножаем на перпендикулярную высоту h, а не на наклонную сторону.', 'Multiply base b by perpendicular height h, not the sloping side.', '底辺bに垂直な高さhを掛けます。斜めの辺ではありません。', '底b乘以垂直高度h，而不是斜边。'), application: tx('Декоративная панель: основание 4 м и высота 2 м → 8 м² материала.', 'Decorative panel: base 4 m and height 2 m → 8 m² of material.', '装飾パネル：底辺4m、高さ2mなら材料は8m²です。', '装饰板底4米、高2米，需要8平方米材料。') },
  trapezoid: { formula: 'S = (a + b)h / 2', hint: tx('Найди среднее двух параллельных оснований.', 'Find the average of the two parallel bases.', '平行な2つの底辺の平均を考えよう。', '先求两条平行底边的平均值。'), explanation: tx('Среднее оснований (a + b)/2 умножаем на расстояние между ними h.', 'Multiply the average base length (a + b)/2 by the perpendicular distance h between them.', '上底と下底の平均(a + b)/2に、垂直な高さhを掛けます。', '两底平均长度(a + b)/2乘以它们之间的垂直距离h。'), application: tx('Клумба с основаниями 2 и 4 м и высотой 3 м занимает 9 м².', 'A flower bed with bases 2 and 4 m and height 3 m covers 9 m².', '上底2m、下底4m、高さ3mの花壇は9m²です。', '花坛两底为2米和4米，高3米，面积为9平方米。') },
  circle: { formula: 'S = πr²', hint: tx('r — радиус, не диаметр. Площадь измеряют в квадратных единицах.', 'r is the radius, not the diameter. Area uses square units.', 'rは直径ではなく半径です。面積は平方単位で表します。', 'r是半径，不是直径。面积使用平方单位。'), explanation: tx('Площадь круга равна πr². Формула 2πr даёт длину окружности, а не площадь.', 'The disk area is πr². The formula 2πr gives circumference, not area.', '円の面積はπr²。2πrは面積ではなく円周の長さです。', '圆的面积是πr²，2πr求的是周长，不是面积。'), application: tx('Круглая столешница радиусом 0,5 м: S = 0,25π ≈ 0,785 м².', 'A round tabletop with radius 0.5 m: S = 0.25π ≈ 0.785 m².', '半径0.5mの円形天板：S = 0.25π ≈ 0.785m²。', '半径0.5米的圆桌面：S = 0.25π ≈ 0.785平方米。') },
};
const numeric = (n: number) => Number(n.toFixed(4)).toString();
function numOptions(answer: number, distractors: number[]): Option[] {
  const values = [answer, ...distractors].filter((v, i, a) => Number.isFinite(v) && v >= 0 && a.indexOf(v) === i);
  let delta = 1;
  while (values.length < 4) { if (!values.includes(answer + delta)) values.push(answer + delta); delta++; }
  return values.slice(0, 4).map(v => ({ text: tx(numeric(v), numeric(v), numeric(v), numeric(v)) }));
}

// Each family teaches one reusable shortcut with six worked examples.
function addMentalPractice(bank:Question[]) {
  const f=numeric;
  const add=(id:string,category:'mental'|'percent',level:number,prompt:Text4,answer:number,hint:Text4,steps:Text4,life:Text4)=>bank.push({id,category,level,prompt,options:numOptions(answer,[answer+Math.max(1,Math.round(answer*.1)),Math.max(0,answer-Math.max(1,Math.round(answer*.1))),answer*2]),correct:0,hint,explanation:steps,application:life,source:category==='percent'?'arithmetic':'distributive'});
  const arithmeticLife=(n:number,a:number,result:number):Text4=>tx(`По ${n} за штуку, ${a} штук: всего ${f(result)}. Этот приём помогает быстро проверить общую стоимость.`,`At ${n} per item, ${a} items cost ${f(result)}. Use this shortcut to check the total.`, `1個${n}の商品を${a}個：合計${f(result)}。合計金額を暗算で確かめられます。`,`每件${n}，${a}件共${f(result)}。用这个方法快速核对总价。`);
  for(let k=0;k<6;k++) {
    const n=32+6*k;
    const cases:[string,string,number,number,Text4,Text4,Text4][]=[
      ['times11',`${n} × 11`,n*11,2,tx('11 = 10 + 1. Умножь число на 10 и прибавь само число.','11 = 10 + 1. Multiply by 10, then add the original number.','11 = 10 + 1。10倍して元の数を足そう。','11 = 10 + 1。先乘10，再加原数。'),tx(`1) ${n} × 10 = ${n*10}. 2) ${n*10} + ${n} = ${n*11}.`,`1) ${n} × 10 = ${n*10}. 2) ${n*10} + ${n} = ${n*11}.`,`① ${n} × 10 = ${n*10}。② ${n*10} + ${n} = ${n*11}。`,`① ${n} × 10 = ${n*10}。② ${n*10} + ${n} = ${n*11}。`),arithmeticLife(n,11,n*11)],
      ['times12',`${n} × 12`,n*12,2,tx('12 = 10 + 2. Сложи десятикратное число и удвоенное.','12 = 10 + 2. Add ten times the number and twice the number.','12 = 10 + 2。10倍と2倍を足そう。','12 = 10 + 2。把10倍与2倍相加。'),tx(`${n} × 10 = ${n*10}; ${n} × 2 = ${n*2}. Сложи: ${n*10} + ${n*2} = ${n*12}.`,`${n} × 10 = ${n*10}; ${n} × 2 = ${n*2}. Add: ${n*10} + ${n*2} = ${n*12}.`,`${n} × 10 = ${n*10}、${n} × 2 = ${n*2}。合計${n*12}。`,`${n} × 10 = ${n*10}，${n} × 2 = ${n*2}，合计${n*12}。`),arithmeticLife(n,12,n*12)],
      ['times15',`${n} × 15`,n*15,3,tx('15 = 10 + 5. Найди ×10, затем прибавь половину полученного.','15 = 10 + 5. Find ×10, then add half of that result.','15 = 10 + 5。10倍した値に、その半分を足そう。','15 = 10 + 5。先乘10，再加所得结果的一半。'),tx(`${n} × 10 = ${n*10}. Половина ${n*10} — ${n*5}. Итого ${n*10} + ${n*5} = ${n*15}.`,`${n} × 10 = ${n*10}. Half of ${n*10} is ${n*5}. Total: ${n*10} + ${n*5} = ${n*15}.`,`${n} × 10 = ${n*10}。その半分は${n*5}。足して${n*15}。`,`${n} × 10 = ${n*10}，其一半为${n*5}，相加得${n*15}。`),arithmeticLife(n,15,n*15)],
      ['times25',`${n} × 25`,n*25,2,tx('25 — четверть от 100. Умножь на 100 и раздели на 4.','25 is a quarter of 100. Multiply by 100, then divide by 4.','25は100の4分の1。100倍して4で割ろう。','25是100的四分之一。先乘100，再除以4。'),tx(`${n} × 100 = ${n*100}. Половина: ${n*50}; ещё половина: ${n*25}.`,`${n} × 100 = ${n*100}. Half: ${n*50}; half again: ${n*25}.`,`${n} × 100 = ${n*100}。半分は${n*50}、もう一度半分で${n*25}。`,`${n} × 100 = ${n*100}。减半得${n*50}，再减半得${n*25}。`),arithmeticLife(n,25,n*25)],
      ['times50',`${n} × 50`,n*50,1,tx('50 — половина 100. Умножь на 100 и возьми половину.','50 is half of 100. Multiply by 100, then halve.','50は100の半分。100倍して半分にしよう。','50是100的一半。先乘100，再减半。'),tx(`${n} × 100 = ${n*100}. ${n*100} ÷ 2 = ${n*50}.`,`${n} × 100 = ${n*100}. ${n*100} ÷ 2 = ${n*50}.`,`${n} × 100 = ${n*100}。${n*100} ÷ 2 = ${n*50}。`,`${n} × 100 = ${n*100}。${n*100} ÷ 2 = ${n*50}。`),arithmeticLife(n,50,n*50)],
      ['times99',`${n} × 99`,n*99,3,tx('99 = 100 − 1. Умножь на 100 и вычти исходное число.','99 = 100 − 1. Multiply by 100 and subtract the original number.','99 = 100 − 1。100倍して元の数を引こう。','99 = 100 − 1。先乘100，再减原数。'),tx(`${n} × 100 − ${n} = ${n*100} − ${n} = ${n*99}.`,`${n} × 100 − ${n} = ${n*100} − ${n} = ${n*99}.`,`${n} × 100 − ${n} = ${n*99}。`,`${n} × 100 − ${n} = ${n*99}。`),arithmeticLife(n,99,n*99)],
      ['times101',`${n} × 101`,n*101,3,tx('101 = 100 + 1. К стократному числу прибавь исходное.','101 = 100 + 1. Add the original number to one hundred times it.','101 = 100 + 1。100倍に元の数を足そう。','101 = 100 + 1。先乘100，再加原数。'),tx(`${n} × 100 + ${n} = ${n*100} + ${n} = ${n*101}.`,`${n} × 100 + ${n} = ${n*100} + ${n} = ${n*101}.`,`${n} × 100 + ${n} = ${n*101}。`,`${n} × 100 + ${n} = ${n*101}。`),arithmeticLife(n,101,n*101)],
      ['times125',`${n} × 125`,n*125,4,tx('125 — восьмая часть 1000. Умножь на 1000, затем трижды раздели на 2.','125 is one eighth of 1000. Multiply by 1000, then halve three times.','125は1000の8分の1。1000倍して3回半分にしよう。','125是1000的八分之一。先乘1000，再连续减半三次。'),tx(`${n} × 1000 = ${n*1000} → ÷2: ${n*500} → ÷2: ${n*250} → ÷2: ${n*125}.`,`${n} × 1000 = ${n*1000} → ÷2: ${n*500} → ÷2: ${n*250} → ÷2: ${n*125}.`,`${n} × 1000 = ${n*1000} → ${n*500} → ${n*250} → ${n*125}（毎回半分）。`,`${n} × 1000 = ${n*1000} → ${n*500} → ${n*250} → ${n*125}（每次减半）。`),arithmeticLife(n,125,n*125)],
      ['divide5',`${n*5} ÷ 5`,n,1,tx('Деление на 5: удвой число и раздели на 10.','To divide by 5, double the number and divide by 10.','5で割るには2倍して10で割ろう。','除以5，可以先乘2，再除以10。'),tx(`${n*5} × 2 = ${n*10}; ${n*10} ÷ 10 = ${n}.`,`${n*5} × 2 = ${n*10}; ${n*10} ÷ 10 = ${n}.`,`${n*5} × 2 = ${n*10}。10で割ると${n}。`,`${n*5} × 2 = ${n*10}，再除以10得${n}。`),tx(`Разделить счёт ${n*5} на 5 человек: по ${n}.`,`Split a bill of ${n*5} among 5 people: ${n} each.`,`${n*5}を5人で分けると1人${n}。`,`${n*5}由5人平分，每人${n}。`)],
      ['divide25',`${n*25} ÷ 25`,n,2,tx('Деление на 25: умножь на 4 и раздели на 100.','To divide by 25, multiply by 4 and divide by 100.','25で割るには4倍して100で割ろう。','除以25，可以先乘4，再除以100。'),tx(`${n*25} × 4 = ${n*100}; ${n*100} ÷ 100 = ${n}.`,`${n*25} × 4 = ${n*100}; ${n*100} ÷ 100 = ${n}.`,`${n*25} × 4 = ${n*100}。100で割ると${n}。`,`${n*25} × 4 = ${n*100}，再除以100得${n}。`),tx(`${n*25} предметов в коробках по 25: ${n} коробок.`,`${n*25} items packed 25 per box: ${n} boxes.`,`${n*25}個を25個ずつ詰めると${n}箱。`,`${n*25}件，每箱25件，共${n}箱。`)],
      ['divide8',`${n*8} ÷ 8`,n,2,tx('8 = 2 × 2 × 2. Возьми половину три раза.','8 = 2 × 2 × 2. Halve three times.','8 = 2 × 2 × 2。半分を3回求めよう。','8 = 2 × 2 × 2。连续减半三次。'),tx(`${n*8} → ${n*4} → ${n*2} → ${n}. На каждом шаге делим на 2.`,`${n*8} → ${n*4} → ${n*2} → ${n}. Divide by 2 at each step.`,`${n*8} → ${n*4} → ${n*2} → ${n}。毎回2で割ります。`,`${n*8} → ${n*4} → ${n*2} → ${n}。每步除以2。`),tx(`Разделить ${n*8} на 8 равных порций: по ${n}.`,`Split ${n*8} into 8 equal portions: ${n} each.`,`${n*8}を8等分すると1つ${n}。`,`${n*8}分为8等份，每份${n}。`)],
    ];
    cases.forEach(([id,expr,answer,level,hint,steps,life])=>add(`extra-${id}-${k}`,'mental',level,tx(`${expr} = ?`,`${expr} = ?`,`${expr} = ?`,`${expr} = ?`),answer,hint,steps,life));
    const t=k+2,v=t*10+5,base=30+10*k,d=2+k,a=100-(k+2),b=100-(k+4),r=300+k*100-3,other=68+k*7,sub=98+k*100,whole=703+k*200,even=16+4*k,odd=35+10*k;
    const more:[string,string,number,number,Text4,Text4,Text4][]=[
      ['square5',`${v}²`,v*v,4,tx('Число оканчивается на 5: умножь число десятков на следующее и припиши 25.','For a number ending in 5, multiply its tens part by the next integer, then append 25.','末尾が5の平方：十の位以上の数と次の整数を掛け、後ろに25を付けよう。','末位为5的数求平方：去掉5后，乘以它加1的数，再在末尾添25。'),tx(`Десятков ${t}. ${t} × ${t+1} = ${t*(t+1)}. Приписываем 25: ${v*v}. Это работает для целых чисел, оканчивающихся на 5.`,`Tens part: ${t}. ${t} × ${t+1} = ${t*(t+1)}. Append 25: ${v*v}. This works for whole numbers ending in 5.`,`十の位以上は${t}。${t} × ${t+1} = ${t*(t+1)}。後ろに25を付けると${v*v}。`,`去掉5后为${t}。${t} × ${t+1} = ${t*(t+1)}。末尾添25得${v*v}。`),tx(`Квадрат со стороной ${v} см: площадь ${v*v} см².`,`A square with side ${v} cm has area ${v*v} cm².`,`一辺${v}cmの正方形は${v*v}cm²。`,`边长${v}厘米的正方形面积为${v*v}平方厘米。`)],
      ['symmetric',`${base-d} × ${base+d}`,base*base-d*d,4,tx('Числа на одинаковом расстоянии от круглого: квадрат середины минус квадрат расстояния.','For numbers equally spaced around a round number: middle squared minus gap squared.','中央から等しく離れた2数：中央の平方から差の平方を引こう。','两数与中间数距离相同：中间数的平方减去距离的平方。'),tx(`Середина ${base}, расстояние ${d}. ${base}² − ${d}² = ${base*base} − ${d*d} = ${base*base-d*d}.`,`Middle ${base}, gap ${d}. ${base}² − ${d}² = ${base*base} − ${d*d} = ${base*base-d*d}.`,`中央${base}、差${d}。${base}² − ${d}² = ${base*base-d*d}。`,`中间数${base}，距离${d}。${base}² − ${d}² = ${base*base-d*d}。`),tx('Полезно для площади прямоугольника с почти равными сторонами.','Useful for the area of a rectangle with nearly equal sides.','縦と横が近い長方形の面積に便利です。','适合计算长宽相近的长方形面积。')],
      ['near100',`${a} × ${b}`,a*b,5,tx('Представь оба числа как 100 минус небольшое число. Раскрой скобки.','Write both numbers as 100 minus a small number, then expand.','両方を100から小さい数を引いた形にして展開しよう。','把两数都写成100减小数，再展开括号。'),tx(`${a}=100−${100-a}; ${b}=100−${100-b}. 10000 − 100 × ${(100-a)+(100-b)} + ${(100-a)*(100-b)} = ${a*b}.`,`${a}=100−${100-a}; ${b}=100−${100-b}. 10000 − 100 × ${(100-a)+(100-b)} + ${(100-a)*(100-b)} = ${a*b}.`,`${a}=100−${100-a}、${b}=100−${100-b}。10000 − 100 × ${(100-a)+(100-b)} + ${(100-a)*(100-b)} = ${a*b}。`,`${a}=100−${100-a}，${b}=100−${100-b}。10000 − 100 × ${(100-a)+(100-b)} + ${(100-a)*(100-b)} = ${a*b}。`),arithmeticLife(a,b,a*b)],
      ['roundadd',`${r} + ${other}`,r+other,1,tx('До круглого числа не хватает 3. Добавь 3 к первому числу, а потом вычти 3 из суммы.','The first number is 3 short of a round number. Add 3, then subtract 3 from the total.','最初の数に3を足して丸め、最後に3を引こう。','第一个数加3凑整，最后从总数中减3。'),tx(`${r} + ${other} = ${r+3} + ${other} − 3 = ${r+other}.`,`${r} + ${other} = ${r+3} + ${other} − 3 = ${r+other}.`,`${r} + ${other} = ${r+3} + ${other} − 3 = ${r+other}。`,`${r} + ${other} = ${r+3} + ${other} − 3 = ${r+other}。`),tx('Сложить две цены, когда одна почти круглая.','Add two prices when one is almost a round number.','一方が切りのよい数に近い価格の合計に。','用于相加两个价格，其中一个接近整百数。')],
      ['roundsubtract',`${whole} − ${sub}`,whole-sub,2,tx('Вычитаемое на 2 меньше круглого. Вычти круглое число и верни 2.','The amount subtracted is 2 below a round number. Subtract the round number, then add 2 back.','引く数を2増やして丸め、最後に2を戻そう。','减数加2凑整，减去后再加回2。'),tx(`${whole} − ${sub} = ${whole} − ${sub+2} + 2 = ${whole-sub}.`,`${whole} − ${sub} = ${whole} − ${sub+2} + 2 = ${whole-sub}.`,`${whole} − ${sub} = ${whole} − ${sub+2} + 2 = ${whole-sub}。`,`${whole} − ${sub} = ${whole} − ${sub+2} + 2 = ${whole-sub}。`),tx('Быстро посчитать сдачу с почти круглой покупки.','Quickly calculate change for a purchase near a round amount.','切りのよい数に近い買い物のお釣りに。','用于快速计算接近整数价格的找零。')],
      ['halvedouble',`${even} × ${odd}`,even*odd,3,tx('Раздели чётный множитель на 2, а второй удвой. Произведение не изменится.','Halve the even factor and double the other. The product stays the same.','偶数の方を半分、もう一方を2倍にしても積は同じです。','一个因数减半，另一个加倍，乘积不变。'),tx(`${even} × ${odd} = ${even/2} × ${odd*2} = ${even/2} × ${odd*2/10} × 10 = ${even*odd}.`,`${even} × ${odd} = ${even/2} × ${odd*2} = ${even/2} × ${odd*2/10} × 10 = ${even*odd}.`,`${even} × ${odd} = ${even/2} × ${odd*2} = ${even*odd}。`,`${even} × ${odd} = ${even/2} × ${odd*2} = ${even*odd}。`),arithmeticLife(even,odd,even*odd)]
    ];
    more.forEach(([id,expr,answer,level,hint,steps,life])=>add(`extra-${id}-${k}`,'mental',level,tx(`${expr} = ?`,`${expr} = ?`,`${expr} = ?`,`${expr} = ?`),answer,hint,steps,life));
    const amount=350+k*130, eighth=160+k*80, part=15+k*5, total=100+k*100, share=total*(k+1)/10, price=400+k*200;
    const percents:[string,number,number,number,Text4,Text4][]=[
      ['one',1,amount,1,tx('1% — сотая часть. Раздели число на 100: например, 1% от 500 = 5.','1% is one hundredth. Divide by 100: for example, 1% of 500 is 5.','1%は100分の1。100で割ろう。例：500の1%は5。','1%是百分之一。除以100，例如500的1%是5。'),tx(`10%: ${amount} ÷ 10 = ${f(amount/10)}. 1%: ${f(amount/10)} ÷ 10 = ${f(amount/100)}. Быстрее: сразу ÷100, запятая на два разряда влево.`,`10%: ${amount} ÷ 10 = ${f(amount/10)}. 1%: ${f(amount/10)} ÷ 10 = ${f(amount/100)}. Faster: divide by 100; move the decimal point two places left.`,`10%は${f(amount/10)}。さらに10で割ると1%の${f(amount/100)}。直接100で割っても同じです。`,`10%为${f(amount/10)}，再除以10得1%为${f(amount/100)}。也可直接除以100，小数点左移两位。`)],
      ['two',2,amount,2,tx('Сначала найди 1%: раздели на 100. Затем удвой.','Find 1% by dividing by 100, then double it.','100で割って1%を求め、2倍しよう。','先除以100求1%，再加倍。'),tx(`1% = ${amount} ÷ 100 = ${f(amount/100)}. 2% = ${f(amount/100)} × 2 = ${f(amount*.02)}.`,`1% = ${amount} ÷ 100 = ${f(amount/100)}. 2% = ${f(amount/100)} × 2 = ${f(amount*.02)}.`,`1%は${f(amount/100)}。2倍して${f(amount*.02)}。`,`1%为${f(amount/100)}，加倍得${f(amount*.02)}。`)],
      ['eighth',12.5,eighth,3,tx('12,5% = 1/8. Раздели исходное число на 2 три раза.','12.5% = 1/8. Halve the original number three times.','12.5% = 1/8。元の数を3回半分にしよう。','12.5% = 1/8。把原数连续减半三次。'),tx(`${eighth} → ${eighth/2} → ${eighth/4} → ${eighth/8}. Это восьмая часть, то есть 12,5%.`,`${eighth} → ${eighth/2} → ${eighth/4} → ${eighth/8}. This is one eighth, or 12.5%.`,`${eighth} → ${eighth/2} → ${eighth/4} → ${eighth/8}。8分の1は12.5%。`,`${eighth} → ${eighth/2} → ${eighth/4} → ${eighth/8}。八分之一就是12.5%。`)],
      ['threequarters',75,eighth,2,tx('75% = 3/4. Найди четверть (÷4) и вычти её из целого.','75% = 3/4. Find a quarter (÷4), then subtract it from the whole.','75% = 3/4。4分の1を求めて元の数から引こう。','75% = 3/4。先求四分之一，再从原数减去。'),tx(`25% = ${eighth} ÷ 4 = ${eighth/4}. 75% = ${eighth} − ${eighth/4} = ${eighth*.75}.`,`25% = ${eighth} ÷ 4 = ${eighth/4}. 75% = ${eighth} − ${eighth/4} = ${eighth*.75}.`,`25%は${eighth/4}。${eighth} − ${eighth/4} = ${eighth*.75}。`,`25%为${eighth/4}。${eighth} − ${eighth/4} = ${eighth*.75}。`)],
      ['thirtyfive',35,eighth,3,tx('35% = 25% + 10%. Найди четверть числа и десятую часть, сложи.','35% = 25% + 10%. Add a quarter and a tenth of the number.','35% = 25% + 10%。4分の1と10分の1を足そう。','35% = 25% + 10%。求四分之一和十分之一，再相加。'),tx(`25% = ${eighth/4}; 10% = ${eighth/10}. ${eighth/4} + ${eighth/10} = ${f(eighth*.35)}.`,`25% = ${eighth/4}; 10% = ${eighth/10}. ${eighth/4} + ${eighth/10} = ${f(eighth*.35)}.`,`25%は${eighth/4}、10%は${eighth/10}。合計${f(eighth*.35)}。`,`25%为${eighth/4}，10%为${eighth/10}，合计${f(eighth*.35)}。`)],
      ['swap',part,50,2,tx('a% от b = b% от a. Можно поменять числа местами и найти половину.','a% of b = b% of a. Swap the numbers and find half.','aのb%とbのa%は同じ。入れ替えて半分を求めよう。','a%的b等于b%的a。交换数值后求一半。'),tx(`${part}% от 50 = 50% от ${part} = ${part} ÷ 2 = ${part/2}. Оба выражения равны ${part} × 50 ÷ 100.`,`${part}% of 50 = 50% of ${part} = ${part} ÷ 2 = ${part/2}. Both equal ${part} × 50 ÷ 100.`,`50の${part}% = ${part}の50% = ${part/2}。どちらも${part} × 50 ÷ 100。`,`50的${part}% = ${part}的50% = ${part/2}。两者都等于${part} × 50 ÷ 100。`)]
    ];
    percents.forEach(([id,p,n,level,hint,steps])=>add(`extra-percent-${id}-${k}`,'percent',level,tx(`Найди ${p}% от ${n}.`,`Find ${p}% of ${n}.`,`${n}の${p}%は？`,`求${n}的${p}%。`),Number((p*n/100).toFixed(4)),hint,steps,tx(`Скидка ${p}% с ${n}: экономия ${f(p*n/100)}, к оплате ${f(n-p*n/100)}.`,`A ${p}% discount on ${n}: save ${f(p*n/100)}, pay ${f(n-p*n/100)}.`,`${n}の${p}%引き：値引き${f(p*n/100)}、支払額${f(n-p*n/100)}。`,`${n}优惠${p}%：节省${f(p*n/100)}，应付${f(n-p*n/100)}。`)));
    add(`extra-growth-${k}`,'percent',3,tx(`Цена ${price} выросла на 15%. Новая цена?`,`A price of ${price} rises by 15%. New price?`,`${price}が15%値上がり。新しい価格は？`,`价格${price}上涨15%，新价格是多少？`),price*1.15,tx('Найди 10% и ещё 5% (половину от 10%). Прибавь обе суммы к исходной цене.','Find 10%, then 5% (half of 10%). Add both to the original price.','10%とその半分の5%を求め、元の価格に足そう。','求10%和它一半的5%，都加到原价上。'),tx(`10% = ${price/10}, 5% = ${price/20}. ${price} + ${price/10} + ${price/20} = ${f(price*1.15)}.`,`10% = ${price/10}, 5% = ${price/20}. ${price} + ${price/10} + ${price/20} = ${f(price*1.15)}.`,`10%は${price/10}、5%は${price/20}。合計${f(price*1.15)}。`,`10%为${price/10}，5%为${price/20}，合计${f(price*1.15)}。`),tx('Так проверяют итог после повышения цены.','Use this to check a price increase.','値上げ後の価格確認に。','用于核对涨价后的金额。'));
    add(`extra-share-${k}`,'percent',4,tx(`${share} из ${total} — сколько процентов?`,`${share} out of ${total} is what percent?`,`${total}のうち${share}は何%？`,`${share}占${total}的百分之几？`),10*(k+1),tx('Раздели часть на целое и умножь на 100. Или сначала найди, сколько составляет 10%.','Divide the part by the whole and multiply by 100. Or first find the amount equal to 10%.','部分 ÷ 全体 × 100。まず10%の量を求めてもよいです。','部分 ÷ 整体 × 100。也可先求10%对应的量。'),tx(`10% от ${total} = ${total/10}. В ${share} таких частей ${k+1}. Значит, ${(k+1)*10}%.`,`10% of ${total} is ${total/10}. ${share} contains ${k+1} such parts, so ${(k+1)*10}%.`,`${total}の10%は${total/10}。${share}には${k+1}個分なので${(k+1)*10}%。`,`${total}的10%是${total/10}。${share}包含${k+1}份，所以是${(k+1)*10}%。`),tx(`Выполнено ${share} из ${total} заданий: прогресс ${(k+1)*10}%.`,`${share} of ${total} tasks done: ${(k+1)*10}% complete.`,`${total}問中${share}問できたら進捗${(k+1)*10}%。`,`${total}题完成${share}题，进度为${(k+1)*10}%。`));
  }
  [25,50,75].forEach((p,k)=>{const original=360+k*120,sale=original*(1-p/100),unit=sale/(100-p);add(`extra-original-${p}`,'percent',5,tx(`После скидки ${p}% осталось заплатить ${sale}. Исходная цена?`,`After ${p}% off, the price is ${sale}. Original price?`,`${p}%引きで${sale}。元の価格は？`,`优惠${p}%后为${sale}，原价是多少？`),original,tx(`Осталось ${100-p}%. Раздели цену на ${100-p}, чтобы найти 1%, затем умножь на 100.`,`${100-p}% remains. Divide by ${100-p} to find 1%, then multiply by 100.`,`${100-p}%が${sale}。${100-p}で割って1%を求め、100倍しよう。`,`剩下${100-p}%。先除以${100-p}求1%，再乘100。`),tx(`${100-p}% = ${sale}. 1% = ${sale} ÷ ${100-p} = ${unit}. 100% = ${unit} × 100 = ${original}.`,`${100-p}% = ${sale}. 1% = ${sale} ÷ ${100-p} = ${unit}. 100% = ${unit} × 100 = ${original}.`,`${100-p}%は${sale}。1%は${unit}、100%は${original}。`,`${100-p}%为${sale}，1%为${unit}，100%为${original}。`),tx('Восстановить цену до скидки по ценнику распродажи.','Recover the original price from a sale tag.','セール価格から元の価格を調べるときに。','根据折后价还原原价。'));});
}

export function buildBank(): Question[] {
  const bank: Question[] = [];
  const shapes = Object.keys(areaFacts) as Shape[];
  shapes.forEach((shape, i) => {
    const fact = areaFacts[shape];
    bank.push({ id: `formula-${shape}`, category: 'area', level: i < 3 ? 1 : 2,
      prompt: tx('Какая формула даёт площадь?', 'Which formula gives the area?', '面積の公式はどれ？', '哪个是面积公式？'), visual: { kind: 'shape', shape },
      options: [fact.formula, ...(shape === 'circle' ? ['S = 2πr', 'S = πr', 'S = 2πr²'] : shape === 'square' ? ['S = 4a', 'S = 2a²', 'S = a² / 2'] : shape === 'rectangle' ? ['S = 2(a + b)', 'S = ab / 2', 'S = a + b'] : shape === 'triangle' ? ['S = bh', 'S = 2bh', 'S = (b + h) / 2'] : shape === 'parallelogram' ? ['S = bh / 2', 'S = 2bh', 'S = b + h'] : ['S = (a + b)h', 'S = abh / 2', 'S = (a + b) / 2'])].map(s => ({ text: tx(s, s, s, s) })), correct: 0,
      hint: fact.hint, explanation: fact.explanation, application: fact.application, source: 'openstax' });
    for (let k = 1; k <= 3; k++) {
      const a = 2 + k * 2, b = 3 + k, h = 2 + k;
      const expression = shape === 'square' ? `${a}²` : shape === 'rectangle' ? `${a} × ${b}` : shape === 'triangle' ? `${b} × ${h} ÷ 2` : shape === 'parallelogram' ? `${b} × ${h}` : shape === 'trapezoid' ? `(${a} + ${b + 3}) × ${h} ÷ 2` : `${a}²`;
      const answer = shape === 'square' || shape === 'circle' ? a*a : shape === 'rectangle' ? a*b : shape === 'triangle' ? b*h/2 : shape === 'parallelogram' ? b*h : (a+b+3)*h/2;
      const dims = shape === 'square' ? `a = ${a}` : shape === 'rectangle' ? `a = ${a}, b = ${b}` : shape === 'trapezoid' ? `a = ${a}, b = ${b+3}, h = ${h}` : shape === 'circle' ? `r = ${a}` : `b = ${b}, h = ${h}`;
      const opts = numOptions(answer, [answer*2, answer+3, Math.max(1, answer/2)]);
      if (shape === 'circle') opts.forEach(o => { o.text = o.text.map(s => `${s}π`) as unknown as Text4; });
      bank.push({ id: `calc-${shape}-${k}`, category: 'area', level: Math.min(5, k + (i > 2 ? 2 : 1)), visual: { kind: 'shape', shape },
        prompt: tx(`Найди площадь: ${dims} см. Ответ в см².`, `Find the area: ${dims} cm. Answer in cm².`, `面積は？ ${dims} cm。答えはcm²。`, `求面积：${dims}厘米。答案单位为平方厘米。`), options: opts, correct: 0,
        hint: fact.hint, explanation: tx(`${fact.explanation[0]} Подставляем: ${expression}${shape === 'circle' ? ' × π' : ''} = ${answer}${shape === 'circle' ? 'π' : ''} см².`, `${fact.explanation[1]} Substitute: ${expression}${shape === 'circle' ? ' × π' : ''} = ${answer}${shape === 'circle' ? 'π' : ''} cm².`, `${fact.explanation[2]} 代入：${expression}${shape === 'circle' ? ' × π' : ''} = ${answer}${shape === 'circle' ? 'π' : ''} cm²。`, `${fact.explanation[3]} 代入：${expression}${shape === 'circle' ? ' × π' : ''} = ${answer}${shape === 'circle' ? 'π' : ''}平方厘米。`), application: fact.application, source: 'openstax' });
    }
  });
  SOLIDS.forEach((solid, i) => {
    for (let k = 0; k < 8; k++) {
      const reverse = k % 2 === 1;
      bank.push({ id: `net-${solid}-${k}`, category: 'nets', level: k>=4 ? (i<2?4:5) : Math.min(5, 1 + Math.floor(i/2) + Math.floor(k/2)),
        prompt: reverse ? tx('Какая развёртка подходит этому телу?', 'Which net matches this solid?', 'この立体の展開図はどれ？', '哪个展开图对应这个立体？') : tx('Какое тело получится из развёртки?', 'Which solid does this net form?', 'この展開図でできる立体は？', '这个展开图能折成哪个立体？'),
        visual: { kind: reverse ? 'solid' : 'net', solid, turn: k>=4 ? (k<6?90:270) : k>=2?180:0 },
        options: [solid, ...SOLIDS.filter(s => s !== solid).slice(0, 3)].map((s,index) => ({ text: reverse ? tx(`Развёртка ${index+1}`, `Net ${index+1}`, `展開図 ${index+1}`, `展开图 ${index+1}`) : NAMES[s], visual: { kind: reverse ? 'net' : 'solid', solid: s, turn:k>=4?(k<6?90:270):0 } })), correct: 0,
        hint: tx('Посчитай грани и сравни их форму.', 'Count the faces and compare their shapes.', '面の数と形を比べよう。', '数一数各面，再比较形状。'), explanation: netFacts[solid], application: netLife[solid], source: 'nets' });
    }
  });
  const ps = [10, 50, 25, 5, 15, 20, 30, 75];
  ps.forEach((p, i) => [80, 240, 360].forEach((n, k) => {
    const answer = n*p/100;
    const method = p === 10 ? `${n} ÷ 10` : p === 50 ? `${n} ÷ 2` : p === 25 ? `${n} ÷ 4` : p === 5 ? `${n} ÷ 10 ÷ 2` : p === 15 ? `${n/10} + ${n/20}` : p === 75 ? `${n} × 3 ÷ 4` : `${n} ÷ 10 × ${p/10}`;
    bank.push({ id: `percent-${p}-${n}`, category: 'percent', level: i < 3 ? 1+k : 2+k,
      prompt: tx(`${p}% от ${n} — это…`, `${p}% of ${n} is…`, `${n}の${p}%は？`, `${n}的${p}%是多少？`), options: numOptions(answer, [n-answer, answer*2, answer+10]), correct: 0,
      hint: ({10:tx('10%: раздели исходное число на 10.','10%: divide the original number by 10.','10%は元の数を10で割ろう。','10%：把原数除以10。'),50:tx('50% — половина: раздели на 2.','50% is half: divide by 2.','50%は半分。2で割ろう。','50%是一半：除以2。'),25:tx('25% — четверть: возьми половину, затем ещё половину.','25% is a quarter: halve, then halve again.','25%は4分の1。半分を2回求めよう。','25%是四分之一：连续减半两次。'),5:tx('5% — половина от 10%: сначала ÷10, затем ÷2.','5% is half of 10%: first ÷10, then ÷2.','5%は10%の半分。10で割り、さらに2で割ろう。','5%是10%的一半：先除以10，再除以2。'),15:tx('15% = 10% + 5%. Найди десятую часть и прибавь её половину.','15% = 10% + 5%. Find a tenth and add half of it.','15% = 10% + 5%。10分の1とその半分を足そう。','15% = 10% + 5%。求十分之一，再加它的一半。'),20:tx('20% = 2 × 10%: раздели на 10, затем удвой.','20% = 2 × 10%: divide by 10, then double.','20% = 2 × 10%。10で割って2倍しよう。','20% = 2 × 10%。先除以10，再乘2。'),30:tx('30% = 3 × 10%: раздели на 10, затем умножь на 3.','30% = 3 × 10%: divide by 10, then multiply by 3.','30% = 3 × 10%。10で割って3倍しよう。','30% = 3 × 10%。先除以10，再乘3。'),75:tx('75% — три четверти: раздели на 4 и умножь на 3.','75% is three quarters: divide by 4 and multiply by 3.','75%は4分の3。4で割って3倍しよう。','75%是四分之三：先除以4，再乘3。')} as Record<number,Text4>)[p],
      explanation: tx(`По шагам: ${p===50?`${n} ÷ 2 = ${answer}`:p===25?`${n} ÷ 2 = ${n/2}; ${n/2} ÷ 2 = ${answer}`:p===75?`${n} ÷ 4 = ${n/4}; ${n/4} × 3 = ${answer}`:p===5?`${n} ÷ 10 = ${n/10}; ${n/10} ÷ 2 = ${answer}`:p===15?`10% = ${n/10}; 5% = ${n/10} ÷ 2 = ${n/20}; ${n/10} + ${n/20} = ${answer}`:`${n} ÷ 10 = ${n/10}; ${n/10} × ${p/10} = ${answer}`}.`, `Step by step: ${p===50?`${n} ÷ 2 = ${answer}`:p===25?`${n} ÷ 2 = ${n/2}; ${n/2} ÷ 2 = ${answer}`:p===75?`${n} ÷ 4 = ${n/4}; ${n/4} × 3 = ${answer}`:p===5?`${n} ÷ 10 = ${n/10}; ${n/10} ÷ 2 = ${answer}`:p===15?`10% = ${n/10}; 5% = ${n/20}; ${n/10} + ${n/20} = ${answer}`:`${n} ÷ 10 = ${n/10}; ${n/10} × ${p/10} = ${answer}`}.`, `手順：${method} = ${answer}。基本は元の数 × 割合 ÷ 100。`, `步骤：${method} = ${answer}。通用公式：原数 × 百分数 ÷ 100。`),
      application: tx(`При скидке ${p}% с цены ${n} экономия составит ${answer}, а новая цена — ${n-answer}.`, `A ${p}% discount on ${n} saves ${answer}; the new price is ${n-answer}.`, `価格${n}の${p}%引きなら、値引きは${answer}、支払額は${n-answer}です。`, `原价${n}，优惠${p}%，可省${answer}，现价为${n-answer}。`), source: 'arithmetic' });
  }));
  [10,20,25].forEach((p, k) => {
    const original = 400 + k*200, sale = original*(1-p/100);
    bank.push({ id: `reverse-${p}`, category:'percent', level:4,
      prompt:tx(`После скидки ${p}% цена — ${sale}. Сколько было до скидки?`, `After a ${p}% discount, the price is ${sale}. What was the original price?`, `${p}%引き後の価格は${sale}。元の価格は？`, `优惠${p}%后售价为${sale}，原价是多少？`), options:numOptions(original,[sale*(1+p/100),sale,original+100]),correct:0,
      hint:tx(`Новая цена — ${100-p}% исходной.`, `The new price is ${100-p}% of the original.`, `今の価格は元の${100-p}%です。`, `现价是原价的${100-p}%。`), explanation:tx(`${sale} ÷ ${1-p/100} = ${original}. Прибавить ${p}% к новой цене недостаточно: база изменилась.`, `${sale} ÷ ${1-p/100} = ${original}. Adding ${p}% to the sale price uses a different base.`, `${sale} ÷ ${1-p/100} = ${original}。値引き後の価格に${p}%を足すと、基準が違うため元に戻りません。`, `${sale} ÷ ${1-p/100} = ${original}。直接在现价上增加${p}%，计算基数不同，不能还原原价。`), application:tx('Полезно для восстановления исходной цены по чеку со скидкой.', 'Recover the original price from a discounted receipt.', '割引価格から元の価格を調べるときに便利です。', '可根据打折小票还原原价。'), source:'arithmetic' });
  });
  bank.push({ id:'double-discount', category:'percent',level:5,prompt:tx('Скидки 20% и затем ещё 10%. Итоговая скидка?', '20% off, then another 10% off. Total discount?', '20%引きの後にさらに10%引き。全体の割引率は？', '先优惠20%，再优惠10%，总优惠百分比是多少？'), options:['28%','30%','32%','18%'].map(s=>({text:tx(s,s,s,s)})),correct:0,
    hint:tx('Вторая скидка применяется к уже уменьшенной цене.', 'The second discount applies to the reduced price.', '2回目は値引き後の価格から引きます。', '第二次优惠以降价后的价格为基数。'),explanation:tx('1000 → 800 → 720. Экономия 280 из 1000, то есть 28%.', '1000 → 800 → 720. Saving 280 out of 1000 means 28%.', '1000 → 800 → 720。1000のうち280引きなので28%です。', '1000 → 800 → 720，共省280，占原价的28%。'),application:tx('Проверяй так акции «дополнительная скидка» в магазинах.', 'Use this to check “extra discount” offers.', '「さらに割引」のセールで使えます。', '可用于核算商店的“折上折”优惠。'),source:'arithmetic' });
  for(let k=0;k<5;k++) {
    const n=24+k*13, a=198+k*100, b=47+k*3, m=20+k*10;
    const cases: [string,number,number,Text4,Text4][] = [
      [`${n} × 5`,n*5,1,tx(`${n} × 10 ÷ 2 = ${n*5}. Умножение на 5 — половина умножения на 10.`, `${n} × 10 ÷ 2 = ${n*5}. Multiplying by 5 is half of multiplying by 10.`, `${n} × 10 ÷ 2 = ${n*5}。5倍は10倍の半分です。`, `${n} × 10 ÷ 2 = ${n*5}。乘5等于乘10再除以2。`),tx('Пять одинаковых покупок: удвой удобство, разделив вычисление пополам.', 'Price five identical items by multiplying by ten and halving.', '同じ商品を5個買うとき、10個分の半分で計算できます。', '买5件相同商品时，可先算10件价格再减半。')],
      [`${n} × 9`,n*9,2,tx(`${n} × 10 − ${n} = ${n*9}.`, `${n} × 10 − ${n} = ${n*9}.`, `${n} × 10 − ${n} = ${n*9}。`, `${n} × 10 − ${n} = ${n*9}。`),tx('Сумма за девять предметов — цена десяти минус цена одного.', 'Nine items cost the price of ten minus one.', '9個分の価格は10個分から1個分を引けば求められます。', '9件商品的价格等于10件减去1件。')],
      [`${a} + ${b}`,a+b,2,tx(`${a+2} + ${b} − 2 = ${a+b}. Округли первое число и верни поправку.`, `${a+2} + ${b} − 2 = ${a+b}. Round up and compensate.`, `${a+2} + ${b} − 2 = ${a+b}。丸めた分を最後に引きます。`, `${a+2} + ${b} − 2 = ${a+b}。凑整后减去多加的数。`),tx('Так удобно складывать цены почти круглых сумм.', 'Useful for adding prices close to round numbers.', '切りのよい数に近い価格を足すときに便利です。', '适合计算接近整数的商品总价。')],
      [`${m-1} × ${m+1}`,m*m-1,4,tx(`(${m} − 1)(${m} + 1) = ${m}² − 1 = ${m*m-1}.`, `(${m} − 1)(${m} + 1) = ${m}² − 1 = ${m*m-1}.`, `(${m} − 1)(${m} + 1) = ${m}² − 1 = ${m*m-1}。`, `(${m} − 1)(${m} + 1) = ${m}² − 1 = ${m*m-1}。`),tx('Быстрая оценка площади прямоугольника, стороны которого близки к одному числу.', 'Quickly calculate a rectangle area when its sides are equally spaced around one number.', '縦と横が同じ数から等しく離れている長方形の面積に使えます。', '适合求两边长度围绕同一数对称变化的长方形面积。')],
      [`${n*4} ÷ 4`,n,1,tx(`${n*4} ÷ 2 ÷ 2 = ${n}.`, `${n*4} ÷ 2 ÷ 2 = ${n}.`, `${n*4} ÷ 2 ÷ 2 = ${n}。`, `${n*4} ÷ 2 ÷ 2 = ${n}。`),tx('Раздели общий счёт на четверых, дважды взяв половину.', 'Split a bill four ways by halving twice.', '4人で割り勘するときは、半分を2回求めます。', '四人平分账单时，可连续除以2两次。')],
    ];
    cases.forEach(([expr,answer,level,explanation,application],j)=>bank.push({id:`mental-${j}-${k}`,category:'mental',level:Math.min(5,level+(k>2?1:0)),prompt:tx(`${expr} = ?`,`${expr} = ?`,`${expr} = ?`,`${expr} = ?`),options:numOptions(answer,[answer+10,answer-10,answer*2]),correct:0,
      hint:[tx('Умножь на 10, затем возьми половину.','Multiply by 10, then halve.','10倍して半分にしよう。','先乘10，再减半。'),tx('Умножь на 10 и вычти исходное число.','Multiply by 10 and subtract the original number.','10倍して元の数を引こう。','先乘10，再减原数。'),tx('Добавь 2 к первому числу, сложи, затем вычти 2.','Add 2 to the first number, add, then subtract 2.','最初の数に2を足して計算し、最後に2を引こう。','第一个数加2凑整，最后减2。'),tx('Найди квадрат среднего числа и вычти 1.','Square the middle number, then subtract 1.','中央の数を平方して1を引こう。','求中间数的平方，再减1。'),tx('Деление на 4 — два раза взять половину.','Dividing by 4 means halving twice.','4で割るには半分を2回求めよう。','除以4就是连续减半两次。')][j],explanation,application,source:'arithmetic'}));
  }
  addMentalPractice(bank);
  // Every card is validated before it can enter a round.
  validateBank(bank);
  return bank;
}
export function validateBank(bank: Question[]) {
  if(new Set(bank.map(q=>q.id)).size!==bank.length) throw new Error('Duplicate question ID');
  bank.forEach(q=>{
    if(q.options.length!==4 || q.correct<0 || q.correct>3) throw new Error(`Invalid options: ${q.id}`);
    for(let l=0;l<4;l++) {
      if(new Set(q.options.map(o=>o.text[l])).size!==4) throw new Error(`Ambiguous options: ${q.id}`);
      if(!q.prompt[l] || !q.hint[l] || !q.explanation[l] || !q.application[l]) throw new Error(`Missing translation: ${q.id}`);
    }
  });
}
export const BANK = buildBank();
function shuffle<T,>(items: T[]): T[] {
  const arr=[...items]; for(let i=arr.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr;
}
function shuffledQuestion(q: Question): Question {
  const options=shuffle(q.options.map((o,i)=>({o,i})));
  return {...q,options:options.map(x=>x.o),correct:options.findIndex(x=>x.i===q.correct)};
}
const RUBY: Record<string,string> = {'回答履歴':'かいとうりれき','出題済み':'しゅつだいずみ','部分':'ぶぶん','全体':'ぜんたい','値上がり':'ねあがり','整数':'せいすう','平方':'へいほう','合計':'ごうけい','半分':'はんぶん','復元':'ふくげん','保存':'ほぞん','記録':'きろく','正四角錐':'せいしかくすい','平行四辺形':'へいこうしへんけい','直三角柱':'ちょくさんかくちゅう','正四面体':'せいしめんたい','立方体':'りっぽうたい','直方体':'ちょくほうたい','正方形':'せいほうけい','長方形':'ちょうほうけい','三角形':'さんかくけい','成績':'せいせき','最高記録':'さいこうきろく','初級':'しょきゅう','中級':'ちゅうきゅう','上級':'じょうきゅう','発展':'はってん','展開図':'てんかいず','百分率':'ひゃくぶんりつ','面積':'めんせき','暗算':'あんざん','解説':'かいせつ','正解':'せいかい','難易度':'なんいど','底辺':'ていへん','半径':'はんけい','直径':'ちょっけい','台形':'だいけい','立体':'りったい','公式':'こうしき','計算':'けいさん','価格':'かかく','垂直':'すいちょく','合同':'ごうどう','底面':'ていめん','側面':'そくめん','頂点':'ちょうてん','挑戦':'ちょうせん','選択':'せんたく','開始':'かいし','終了':'しゅうりょう','復習':'ふくしゅう','連続':'れんぞく','進捗':'しんちょく','出典':'しゅってん','正確性':'せいかくせい','測定':'そくてい','脳活動':'のうかつどう','模式図':'もしきず'};
const rubyRE=new RegExp(`(${Object.keys(RUBY).sort((a,b)=>b.length-a.length).join('|')})`,'g');
function Reading({text,on}:{text:string;on:boolean}) { return <>{on?text.split(rubyRE).map((s,i)=>RUBY[s]?<ruby key={i}>{s}<rt>{RUBY[s]}</rt></ruby>:s):text}</>; }

// Geometric drawings use coordinates, not generated pictures. Fold lines are dashed.
function Diagram({visual,label}:{visual:Visual;label:string}) {
  const common={fill:'var(--figure-fill)',stroke:'currentColor',strokeWidth:2.2,strokeLinejoin:'round' as const};
  const line=(x1:number,y1:number,x2:number,y2:number,dash=false)=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.7" strokeDasharray={dash?'5 4':undefined}/>;
  let drawing:React.ReactNode;
  if(visual.kind==='shape') {
    const s=visual.shape;
    drawing=<>{s==='square'?<><rect {...common} x="77" y="27" width="106" height="106"/><text x="130" y="153">a</text></>:s==='rectangle'?<><rect {...common} x="45" y="45" width="170" height="83"/><text x="130" y="150">a</text><text x="30" y="90">b</text></>:s==='circle'?<><circle {...common} cx="130" cy="85" r="62"/>{line(130,85,192,85)}<circle cx="130" cy="85" r="3" fill="currentColor"/><text x="160" y="76">r</text></>:s==='triangle'?<><polygon {...common} points="45,135 215,135 108,25"/>{line(108,25,108,135,true)}<path d="M108 125h10v10" fill="none" stroke="currentColor"/><text x="130" y="156">b</text><text x="95" y="90">h</text></>:s==='parallelogram'?<><polygon {...common} points="35,130 185,130 225,40 75,40"/>{line(75,40,75,130,true)}<path d="M75 120h10v10" fill="none" stroke="currentColor"/><text x="120" y="153">b</text><text x="62" y="92">h</text></>:<><polygon {...common} points="35,130 225,130 180,40 90,40"/>{line(90,40,90,130,true)}<path d="M90 120h10v10" fill="none" stroke="currentColor"/><text x="135" y="29">a</text><text x="130" y="153">b</text><text x="76" y="90">h</text></>}</>;
  } else if(visual.kind==='solid') {
    const s=visual.solid;
    drawing=s==='cube'||s==='box'?<g transform={s==='box'?'translate(-19 16) scale(1.15 .85)':undefined}><polygon {...common} points="75,58 155,58 155,138 75,138"/><polygon {...common} points="75,58 115,25 195,25 155,58" opacity=".8"/><polygon {...common} points="155,58 195,25 195,105 155,138" opacity=".65"/>{line(75,138,115,105,true)}{line(115,25,115,105,true)}{line(115,105,195,105,true)}</g>:s==='prism'?<><polygon {...common} points="50,125 145,125 96,43"/><polygon {...common} points="96,43 156,23 205,105 145,125" opacity=".7"/>{line(50,125,110,105,true)}{line(110,105,156,23,true)}{line(110,105,205,105,true)}</>:s==='pyramid'?<><polygon {...common} points="130,20 48,115 151,145"/><polygon {...common} points="130,20 151,145 215,103" opacity=".7"/>{line(48,115,112,80,true)}{line(112,80,215,103,true)}{line(112,80,130,20,true)}</>:<><polygon {...common} points="130,20 45,132 215,132"/>{line(130,20,136,94)}{line(45,132,136,94)}{line(215,132,136,94)}</>;
  } else {
    const s=visual.solid;
    const square=(x:number,y:number,w:number,h=w)=><rect {...common} x={x} y={y} width={w} height={h}/>;
    drawing=s==='cube'?<><path {...common} d="M105 10h35v35h70v35h-70v35h-35V80H70V45h35Z"/>{line(105,45,140,45,true)}{line(105,80,140,80,true)}{line(105,45,105,80,true)}{line(140,45,140,80,true)}{line(175,45,175,80,true)}</>:s==='box'?<><path {...common} d="M93 16h55v32h32v63h-32v32H93v-32H6V48h87Z"/>{line(93,48,148,48,true)}{line(93,111,148,111,true)}{line(61,48,61,111,true)}{line(93,48,93,111,true)}{line(148,48,148,111,true)}</>:s==='pyramid'?<><path {...common} d="M105 60l25-50 25 50 50 25-50 25-25 50-25-50-50-25Z"/>{line(105,60,155,60,true)}{line(155,60,155,110,true)}{line(155,110,105,110,true)}{line(105,110,105,60,true)}</>:s==='tetra'?<><polygon {...common} points="130,16 212,158 48,158"/>{line(89,87,171,87,true)}{line(89,87,130,158,true)}{line(171,87,130,158,true)}</>:<>{square(42,61,52,62)}{square(94,61,52,62)}{square(146,61,52,62)}<polygon {...common} points="94,61 146,61 120,15.966679"/><polygon {...common} points="94,123 146,123 120,168.033321"/>{line(94,61,146,61,true)}{line(94,123,146,123,true)}{line(94,61,94,123,true)}{line(146,61,146,123,true)}</>;
  }
  const bounds=visual.kind==='net'?{cube:[70,10,210,115],box:[6,16,180,143],pyramid:[55,10,205,160],tetra:[48,16,212,158],prism:[42,15.966679,198,168.033321]}[visual.solid]:null;
  let netTransform: string | undefined;
  if(bounds&&visual.kind==='net'){
    const [x0,y0,x1,y1]=bounds,turn=visual.turn||0,quarter=Math.abs(turn)%180===90;
    const w=quarter?y1-y0:x1-x0,h=quarter?x1-x0:y1-y0,scale=Math.min(1,240/w,160/h);
    netTransform=`translate(130 90) rotate(${turn}) scale(${scale}) translate(${-(x0+x1)/2} ${-(y0+y1)/2})`;
  }
  return <svg className="diagram" viewBox="0 0 260 180" role="img" aria-label={label}><g transform={netTransform}>{drawing}</g></svg>;
}
// Lateral brain illustration: asymmetric cortex, small cerebellum and brainstem.
// Decorative network; it is not an anatomical activity measurement.
const nodePoints=[[85,61],[115,43],[146,40],[177,39],[207,46],[238,51],[267,66],[55,88],[87,86],[119,76],[151,69],[185,67],[218,73],[251,85],[285,91],[310,111],[44,116],[74,117],[106,103],[138,104],[173,96],[204,103],[235,111],[269,119],[304,139],[47,145],[79,143],[111,133],[145,130],[179,127],[213,135],[247,142],[279,155],[65,164],[95,166],[126,158],[160,155],[192,155],[224,164],[253,175],[113,181],[145,184],[176,185],[206,177],[99,59],[163,53],[226,57],[286,73],[296,120],[262,100],[227,94],[155,88],[88,104],[59,129],[95,151],[146,167],[190,173],[235,150]];
const nodes=nodePoints.map(([x,y])=>({x,y,group:x>140&&y<145?0:1}));
const brainEdges=nodes.flatMap((n,i)=>nodes.map((m,j)=>({i,j,d:Math.hypot(n.x-m.x,n.y-m.y)})).filter(e=>e.i!==e.j&&e.d<56).sort((a,b)=>a.d-b.d).slice(0,2)).filter(e=>e.i<e.j);
const brainSilhouette='M55 176C35 168 26 145 32 125C24 104 33 82 51 72C55 50 76 36 98 38C116 22 142 20 162 29C185 19 212 25 228 37C251 32 276 44 284 61C308 66 325 85 323 107C337 126 331 149 314 161C303 178 284 186 264 184C246 198 220 197 203 185C186 200 161 203 143 195C121 207 98 198 89 184C76 190 63 185 55 176Z';
const folds=[
'M99 38C94 49 99 61 113 64C127 67 132 81 124 92',
'M52 73C66 67 80 74 81 87C83 101 97 106 108 100',
'M34 107C46 98 62 103 66 116C69 128 81 131 90 126',
'M33 145C45 133 61 139 65 153C70 167 83 171 95 165',
'M89 184C95 172 109 173 117 181C126 190 137 189 145 182',
'M162 29C148 39 150 53 162 59C174 65 178 76 170 87',
'M193 30C185 42 187 54 199 59C212 64 216 79 207 90',
'M228 38C229 52 239 60 252 61C267 62 270 75 264 85',
'M285 63C277 74 284 85 295 90C309 96 312 107 304 117',
'M320 127C306 121 294 128 292 141C290 155 277 161 265 155',
'M125 107C137 97 151 102 154 115C157 127 170 131 181 123',
'M222 101C210 106 211 120 223 125C237 131 241 144 234 155',
'M169 146C154 143 146 153 150 165C154 177 168 180 177 174',
'M202 148C190 155 193 168 205 172',
'M249 177C245 164 253 152 266 149',
'M135 148C123 145 111 151 111 164'
];
const neuralRoutes=[
'M55 88C84 62 122 74 151 69S195 56 218 73',
'M44 116C71 108 95 113 119 101S153 89 173 96',
'M65 164C94 165 108 142 126 158S170 169 192 155',
'M207 46C236 49 254 58 267 66S295 89 310 111',
'M185 67C196 93 213 99 235 111S280 129 304 139',
'M111 133C145 130 166 122 179 127S218 141 247 142',
'M113 181C137 178 158 173 176 185S198 191 206 177',
'M218 73C241 83 259 102 269 119S276 144 279 155'
];
function Brain({active='all',xp=0,pulse=false,celebrate=false}:{active?:Category;xp?:number;pulse?:boolean;celebrate?:boolean}) {
  const id='neural-'+useId().replace(/[^a-zA-Z0-9]/g,'');
  const unlocked=xp>=110?58:Math.min(58,1+Math.floor(xp/2));
  const litNode=(i:number)=>celebrate||(active==='all'?i<unlocked:active==='nets'?nodes[i].group===0:nodes[i].group===0||nodes[i].y<196);
  const url=(name:string)=>`url(#${id}-${name})`;
  return <svg className={`brain brain-illustration brain-magic brain-lateral ${pulse?'pulse':''} ${celebrate?'celebrating':''}`} viewBox="0 0 360 280" role="img" aria-label="Side-view brain illustration with luminous neural connections">
    <defs>
      <linearGradient id={`${id}-shell`} x1=".12" y1="0" x2=".8" y2="1"><stop stopColor="#eedcff"/><stop offset=".42" stopColor="#cfb5f5"/><stop offset="1" stopColor="#9c9ae2"/></linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#bd8ce1"/><stop offset=".54" stopColor="#a393de"/><stop offset="1" stopColor="#7d83c7"/></linearGradient>
      <radialGradient id={`${id}-light`} cx=".22" cy=".12" r=".9"><stop stopColor="#fff5fc" stopOpacity=".95"/><stop offset=".48" stopColor="#f5d8ff" stopOpacity=".22"/><stop offset="1" stopColor="#b1adef" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-mint`} cx=".88" cy=".24" r=".65"><stop stopColor="#b3f2ed" stopOpacity=".52"/><stop offset="1" stopColor="#a9d8ed" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-wire`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c08bff"/><stop offset=".48" stopColor="#66dcd7"/><stop offset="1" stopColor="#d9b5ff"/></linearGradient>
      <radialGradient id={`${id}-aura`}><stop stopColor="#c3a5f3" stopOpacity=".45"/><stop offset=".6" stopColor="#d9c3ff" stopOpacity=".16"/><stop offset="1" stopColor="#e5d3fb" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-node`} cx=".36" cy=".28"><stop stopColor="#fff"/><stop offset=".42" stopColor="#fff3b8"/><stop offset="1" stopColor="#efc471"/></radialGradient>
      <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
      <clipPath id={`${id}-clip`}><path d={brainSilhouette}/></clipPath>
    </defs>
    <ellipse className="magic-aura" cx="180" cy="139" rx="178" ry="136" fill={url('aura')}/>
    <ellipse cx="183" cy="246" rx="107" ry="9" fill="#b8a9da" opacity=".14" filter={url('soft')}/>
    <g className="brainstem"><path d="M202 178C216 181 224 194 219 210L229 239C231 247 217 251 211 241L197 216C189 205 190 187 202 178Z" fill="#b1a1d8" stroke="#9482bb" strokeWidth="1.1"/><path d="M207 194C205 210 217 227 221 240" fill="none" stroke="#ded2f2" strokeWidth="2.4" strokeLinecap="round"/></g>
    <g className="cerebellum"><path d="M241 156C261 148 287 157 301 172C316 184 319 202 305 215C289 233 260 233 242 218C224 202 222 173 241 156Z" fill="#c3b4e8" stroke="#a58acc" strokeWidth="1.2"/>{['M240 174C258 166 284 172 299 185','M236 185C258 178 285 185 303 196','M239 197C259 191 285 196 301 205','M246 209C264 203 282 208 292 213','M259 219C270 214 279 217 282 220'].map((d,i)=><path key={i} d={d} fill="none" stroke="#a68ac9" strokeWidth="1.8" strokeLinecap="round" opacity=".6"/>)}</g>
    <path className="brain-surface" d={brainSilhouette} fill={url('shell')} stroke={url('rim')} strokeWidth="1.35"/>
    <g clipPath={url('clip')}>
      <path d={brainSilhouette} fill={url('light')}/><path d={brainSilhouette} fill={url('mint')}/>
      <g className="magic-folds">{folds.map((d,i)=><g key={i}><path className="fold-depth" d={d}/><path className="fold-highlight" d={d} transform="translate(0 -1.4)"/></g>)}</g>
      <path className="brain-fissure" d="M68 148C94 138 111 145 134 149C158 143 177 139 199 141C224 135 245 142 263 153"/>
      <g className="magic-mesh">{brainEdges.map(({i,j},e)=>{
        const a=nodes[i],b=nodes[j],lit=litNode(i)&&litNode(j),cx=(a.x+b.x)/2+(e%2?4:-4),cy=(a.y+b.y)/2-6;
        return <path key={`${i}-${j}`} d={`M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`} stroke={url('wire')} className={lit?'neural-edge lit':'neural-edge'} filter={lit?url('glow'):undefined}/>;
      })}</g>
      <g className="magic-route-base" stroke={url('wire')} filter={url('glow')}>{neuralRoutes.map((d,i)=><path key={i} d={d}/>)}</g>
      <g className="magic-route-flow" stroke="#effffe" filter={url('glow')}>{neuralRoutes.map((d,i)=><path key={i} d={d} pathLength="100" style={{animationDelay:`${-i*1.4}s`}}/>)}</g>
      {nodes.map((n,i)=><g key={i} className={litNode(i)?'neural-junction lit':'neural-junction'} style={{'--neuron-delay':`${(i%11)*.075}s`} as React.CSSProperties}>
        <circle className="node-halo" cx={n.x} cy={n.y} r={litNode(i)?9:4} fill={litNode(i)?'#f3d4ff':'#c9b3f0'} filter={url('glow')}/>
        <circle className="node-core" cx={n.x} cy={n.y} r={litNode(i)?3.5:1.9} fill={litNode(i)?url('node'):'#b7a0dc'} stroke={litNode(i)?'#fff9e7':'#e5d7f6'} strokeWidth={litNode(i)?'.85':'.6'}/>
        {litNode(i)&&<circle cx={n.x-.8} cy={n.y-1} r="1" fill="#fff"/>}
      </g>)}
      {celebrate&&<path className="magic-cortex-wave" d={brainSilhouette} stroke="#ffedb6" filter={url('glow')}/>}
    </g>
    <g className="magic-sparkles" fill="#e8ca91" filter={url('glow')}><path d="M34 58l1.6 5.4L41 65l-5.4 1.6L34 72l-1.6-5.4L27 65l5.4-1.6Z"/><path d="M324 196l1.2 4.2 4.2 1.2-4.2 1.2-1.2 4.2-1.2-4.2-4.2-1.2 4.2-1.2Z"/><circle cx="300" cy="32" r="1.8"/><circle cx="60" cy="229" r="1.4"/></g>
    {celebrate&&<><ellipse className="magic-completion-wave wave-one" cx="180" cy="139" rx="143" ry="111"/><ellipse className="magic-completion-wave wave-two" cx="180" cy="139" rx="143" ry="111"/></>}
    {celebrate&&<g className="enchantment" aria-hidden="true">
      <g className="enchantment-trails" fill="none" stroke={url('wire')} filter={url('glow')}>
        {neuralRoutes.map((d,i)=><path key={i} d={d} pathLength="100" style={{animationDelay:`${.15+i*.14}s`}}/>)}
      </g>
      {Array.from({length:26},(_,i)=>{const angle=i*2.39996, radius=85+(i%4)*17,x=180+Math.cos(angle)*radius,y=136+Math.sin(angle)*radius*.75;return <g key={i} className="enchantment-mote" style={{'--dx':`${Math.cos(angle)*22}px`,'--dy':`${Math.sin(angle)*20-12}px`,animationDelay:`${.4+(i%9)*.17}s`} as React.CSSProperties}><circle cx={x} cy={y} r={i%3===0?2.2:1.25} fill={i%2?'#71e9df':'#e1b2ff'} filter={url('glow')}/>{i%3===0&&<path d={`M${x-4} ${y}h8M${x} ${y-4}v8`} stroke="#fff7cf" strokeWidth="1" strokeLinecap="round"/>}</g>})}
      <ellipse className="enchantment-orbit" cx="180" cy="140" rx="147" ry="100" fill="none" stroke={url('wire')} strokeWidth="1.3" pathLength="100" transform="rotate(-18 180 140)"/>
    </g>}
    {pulse&&!celebrate&&<ellipse className="neural-answer-pulse" cx="180" cy="139" rx="139" ry="109"/>}
  </svg>;
}
// Small synthesized celesta: offline, quiet, gesture-unlocked, with immediate mute.
export class MagicChimes {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private echo:DelayNode|null=null;
  private voices=new Set<OscillatorNode>();
  private enabled:boolean;
  constructor(enabled=true){this.enabled=enabled;}
  get available(){return typeof window!=='undefined'&&!!(window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext);}
  setEnabled(value:boolean){this.enabled=value;if(!value)this.stop();}
  async unlock():Promise<boolean>{
    if(!this.enabled||!this.available)return false;
    try{
      if(!this.context||this.context.state==='closed'){
        const AudioCtor=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
        if(!AudioCtor)return false;
        this.context=new AudioCtor();this.master=this.context.createGain();this.master.gain.value=.16;this.master.connect(this.context.destination);
        this.echo=this.context.createDelay(.5);this.echo.delayTime.value=.19;
        const wet=this.context.createGain(),feedback=this.context.createGain();wet.gain.value=.18;feedback.gain.value=.16;
        this.echo.connect(wet);wet.connect(this.master);this.echo.connect(feedback);feedback.connect(this.echo);
      }
      if(this.context.state!=='running')await this.context.resume();
      return this.enabled&&this.context.state==='running';
    }catch{return false;}
  }
  play(kind:'level'|'finish'):boolean{
    const ctx=this.context,master=this.master;
    if(!this.enabled||!ctx||!master||ctx.state!=='running'||document.visibilityState==='hidden')return false;
    this.stop();
    const now=ctx.currentTime+.025;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(.16,ctx.currentTime);
    const notes=kind==='finish'?[523.25,659.25,783.99,1046.5,1318.51]:[659.25,783.99,1046.5];
    const spacing=kind==='finish'?.18:.12,duration=kind==='finish'?1.55:.85;
    notes.forEach((frequency,i)=>{
      [[1,1],[2.004,.23],[3.99,.055]].forEach(([partial,amplitude])=>{
        const osc=ctx.createOscillator(),envelope=ctx.createGain(),at=now+i*spacing;
        osc.type='sine';osc.frequency.setValueAtTime(frequency*partial,at);
        envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.17*amplitude,at+.018);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
        osc.connect(envelope);envelope.connect(master);if(this.echo)envelope.connect(this.echo);
        this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();envelope.disconnect();};
        osc.start(at);osc.stop(at+duration+.02);
      });
    });
    return true;
  }
  stop(){
    const ctx=this.context;if(ctx&&this.master){this.master.gain.cancelScheduledValues(ctx.currentTime);this.master.gain.setTargetAtTime(0,ctx.currentTime,.015);}
    this.voices.forEach(osc=>{try{osc.stop();}catch{/* Already ended. */}});this.voices.clear();
  }
  destroy(){this.stop();const ctx=this.context;this.context=null;this.master=null;this.echo=null;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
}
function SoundToggle({enabled,available,onToggle,lang}:{enabled:boolean;available:boolean;onToggle:()=>void;lang:Lang}){
  const label=available?UI[enabled?'soundOn':'soundOff'][lang]:UI.soundUnavailable[lang];
  return <button className={`sound-toggle ${enabled?'enabled':''}`} onClick={onToggle} disabled={!available} aria-label={label} aria-pressed={enabled&&available} title={label}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/>{enabled?<><path d="M16 8c2 2 2 6 0 8"/><path d="M19 5c4 4 4 10 0 14"/></>:<path d="m17 9 5 6m0-6-5 6"/>}</svg><span className="sound-caption">{UI.sound[lang]}</span></button>;
}
const thresholds=[0,10,30,65,110];
function rankFor(xp:number) {return thresholds.reduce((rank,n,i)=>xp>=n?i:rank,0);}
function readProgress():{xp:number;best:number;lang:Lang;furigana:boolean;tier:Tier;stats:TopicStats;rounds:number;soundEnabled:boolean;history:HistoryEntry[];seen:Record<string,number>} {
  const fallback={xp:0,best:0,lang:0 as Lang,furigana:true,tier:0 as Tier,stats:emptyStats(),rounds:0,soundEnabled:true,history:[] as HistoryEntry[],seen:{} as Record<string,number>};
  try {
    const v=JSON.parse(localStorage.getItem('neurospark-v1')||'{}');
    const count=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
    const stats=emptyStats();
    TOPICS.forEach(c=>{const answered=count(v.stats?.[c]?.answered);stats[c]={answered,correct:Math.min(answered,count(v.stats?.[c]?.correct))};});
    const seen:Record<string,number>={};
    BANK.forEach(q=>{if(count(v.seen?.[q.id]))seen[q.id]=count(v.seen[q.id]);});
    const history:HistoryEntry[]=Array.isArray(v.history)?v.history.filter((e:HistoryEntry)=>e&&typeof e.id==='string'&&BANK.some(q=>q.id===e.id)&&Number.isFinite(e.at)&&e.at>0&&typeof e.round==='string'&&Number.isInteger(e.selected)&&e.selected>=0&&e.selected<4&&typeof e.helped==='boolean'&&typeof e.training==='boolean'&&[0,1,2,3].includes(e.tier)).slice(-HISTORY_LIMIT):[];
    return {history,seen,xp:count(v.xp),best:count(v.best),lang:[0,1,2,3].includes(v.lang)?v.lang:0,furigana:v.furigana!==false,tier:[0,1,2,3].includes(v.tier)?v.tier:0,stats,rounds:count(v.rounds),soundEnabled:v.soundEnabled!==false};
  }catch{return fallback;}
}
export default function App() {
  const [saved]=useState(readProgress),[lang,setLang]=useState<Lang>(saved.lang),[furigana,setFurigana]=useState(saved.furigana);
  const [soundEnabled,setSoundEnabled]=useState(saved.soundEnabled),[glowMode,setGlowMode]=useState<'none'|'level'|'finish'>('none'),[glowKey,setGlowKey]=useState(0);
  const soundEpoch=useRef(0);
  const audio=useRef<MagicChimes|null>(null),glowTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  if(!audio.current)audio.current=new MagicChimes(saved.soundEnabled);
  const [xp,setXp]=useState(saved.xp),[best,setBest]=useState(saved.best),[storageError,setStorageError]=useState(false);
  const [phase,setPhase]=useState<'home'|'game'|'result'|'progress'|'history'>('home'),[category,setCategory]=useState<Category>('all');
  const [tier,setTier]=useState<Tier>(saved.tier),[stats,setStats]=useState<TopicStats>(saved.stats),[rounds,setRounds]=useState(saved.rounds);
  const [history,setHistory]=useState<HistoryEntry[]>(saved.history),[seen,setSeen]=useState(saved.seen),[historyTopic,setHistoryTopic]=useState<Category>('all'),[onlyMistakes,setOnlyMistakes]=useState(false),[historyLimit,setHistoryLimit]=useState(40);
  const seenRef=useRef(saved.seen),roundRef=useRef('');
  const [current,setCurrent]=useState<Question|null>(null),[attempts,setAttempts]=useState<Attempt[]>([]),[remaining,setRemaining]=useState(60),[streak,setStreak]=useState(0);
  const [hintUsed,setHintUsed]=useState(false),[cardHint,setCardHint]=useState(false),[feedback,setFeedback]=useState<number|null>(null),[training,setTraining]=useState(false),[reason,setReason]=useState<'timeout'|'three'|'complete'|'stop'>('timeout');
  const game=useRef({active:false,lock:false,deadline:0,level:1,base:1,cap:2,streak:0,used:new Set<string>(),attempts:[] as Attempt[],queue:[] as Question[],training:false,hintUsed:false,cardHint:false,current:null as Question|null});
  const transition=useRef<ReturnType<typeof setTimeout>|null>(null), questionRef=useRef<HTMLHeadingElement>(null);
  const T=(value:Text4)=><Reading text={value[lang]} on={lang===2&&furigana}/>;
  const score=attempts.filter(a=>a.selected===a.q.correct).length, mistakes=attempts.length-score,rank=rankFor(xp);
  useEffect(()=>{try{localStorage.setItem('neurospark-v1',JSON.stringify({xp,best,lang,furigana,tier,stats,rounds,soundEnabled,history,seen}));setStorageError(false);}catch{setStorageError(true);}},[xp,best,lang,furigana,tier,stats,rounds,soundEnabled,history,seen]);
  useEffect(()=>{document.documentElement.lang=['ru','en','ja','zh-Hans'][lang];document.title=TITLE[lang];},[lang]);
  useEffect(()=>()=>{if(transition.current)clearTimeout(transition.current);if(glowTimer.current)clearTimeout(glowTimer.current);audio.current?.destroy();},[]);
  function toggleSound(){const next=!soundEnabled;setSoundEnabled(next);audio.current?.setEnabled(next);if(next)void audio.current?.unlock();}
  function celebrate(kind:'level'|'finish'){
    if(glowTimer.current)clearTimeout(glowTimer.current);
    soundEpoch.current++;setGlowMode(kind);setGlowKey(v=>v+1);const played=audio.current?.play(kind)||false;
    glowTimer.current=setTimeout(()=>setGlowMode('none'),kind==='finish'?4200:1800);
    return played;
  }
  function replayMagic(){const readiness=audio.current?.unlock(),played=celebrate('finish'),epoch=soundEpoch.current;if(!played)void readiness?.then(ready=>{if(ready&&epoch===soundEpoch.current&&!game.current.active)audio.current?.play('finish');});}

  function finish(why:typeof reason) {
    if(!game.current.active)return;
    game.current.active=false;game.current.lock=true;
    if(transition.current)clearTimeout(transition.current);
    setReason(why);setPhase('result');setFeedback(null);
    if(why!=='stop')celebrate('finish');else{soundEpoch.current++;audio.current?.stop();setGlowMode('none');}
    const completed=game.current.attempts;
    const earned=completed.filter(a=>a.selected===a.q.correct).length;
    if(!game.current.training){
      setXp(v=>v+earned);setBest(v=>Math.max(v,earned));setRounds(v=>v+1);
      setStats(previous=>{const next=Object.fromEntries(TOPICS.map(c=>[c,{...previous[c]}])) as TopicStats;completed.forEach(a=>{next[a.q.category].answered++;if(a.selected===a.q.correct)next[a.q.category].correct++;});return next;});
    }
  }
  function nextQuestion() {
    const g=game.current;
    let pool=g.training?g.queue.filter(q=>!g.used.has(q.id)):BANK.filter(q=>(category==='all'||q.category===category)&&!g.used.has(q.id)&&q.level>=g.base&&q.level<=g.level);
    // Only advance when the current tier has been exhausted; never repeat a card.
    if(!pool.length&&!g.training) {
      const available=BANK.filter(q=>(category==='all'||q.category===category)&&!g.used.has(q.id)&&q.level>=g.base&&q.level<=g.cap);
      if(available.length){g.level=Math.max(g.level,Math.min(...available.map(q=>q.level)));pool=available.filter(q=>q.level<=g.level);}
    }
    if(!pool.length){finish('complete');return;}
    // Least-seen eligible cards first; training deliberately revisits mistakes.
    if(!g.training){const least=Math.min(...pool.map(q=>seenRef.current[q.id]||0));pool=pool.filter(q=>(seenRef.current[q.id]||0)===least);}
    const q=shuffledQuestion(pool[Math.floor(Math.random()*pool.length)]);
    if(!g.training){seenRef.current={...seenRef.current,[q.id]:(seenRef.current[q.id]||0)+1};setSeen(seenRef.current);}
    g.used.add(q.id);g.current=q;g.lock=false;g.cardHint=false;
    setCurrent(q);setCardHint(false);setFeedback(null);
    requestAnimationFrame(()=>questionRef.current?.focus());
  }
  function start(practice?:Question[]) {
    roundRef.current=`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    soundEpoch.current++;audio.current?.stop();void audio.current?.unlock();
    if(glowTimer.current)clearTimeout(glowTimer.current);setGlowMode('none');
    if(transition.current)clearTimeout(transition.current);
    game.current={active:true,lock:false,deadline:performance.now()+60000,level:DIFFICULTY_RANGES[tier].min,base:DIFFICULTY_RANGES[tier].min,cap:DIFFICULTY_RANGES[tier].max,streak:0,used:new Set(),attempts:[],queue:practice||[],training:!!practice,hintUsed:false,cardHint:false,current:null};
    setAttempts([]);setRemaining(60);setStreak(0);setHintUsed(false);setCardHint(false);setFeedback(null);setTraining(!!practice);setPhase('game');nextQuestion();
  }
  function answer(index:number) {
    const g=game.current,q=g.current;if(!g.active||g.lock||!q)return;
    if(!g.training&&performance.now()>=g.deadline){setRemaining(0);finish('timeout');return;}
    g.lock=true;
    const ok=index===q.correct;
    const canonical=BANK.find(item=>item.id===q.id)!;
    const selected=canonical.options.indexOf(q.options[index]);
    if(selected>=0)setHistory(previous=>[...previous,{id:q.id,at:Date.now(),round:roundRef.current,selected,helped:g.cardHint,training:g.training,tier}].slice(-HISTORY_LIMIT));
    g.attempts=[...g.attempts,{q,selected:index,helped:g.cardHint}];setAttempts(g.attempts);setFeedback(index);
    if(!g.training && !ok && g.attempts.filter(a=>a.selected!==a.q.correct).length>=3){finish('three');return;}
    g.streak=ok?g.streak+1:0;
    if(g.streak===3){const previous=g.level;g.level=Math.min(g.cap,g.level+1);g.streak=0;if(g.level>previous&&!g.training)celebrate('level');}setStreak(g.streak);
    transition.current=setTimeout(()=>{
      if(!g.active)return;
      if(!g.training&&g.attempts.filter(a=>a.selected!==a.q.correct).length>=3){finish('three');return;}
      if(!g.training&&performance.now()>=g.deadline){setRemaining(0);finish('timeout');return;}
      nextQuestion();
    },480);
  }
  function revealHint(){const g=game.current;if(!g.active||g.lock||g.hintUsed)return;if(!g.training&&performance.now()>=g.deadline){finish('timeout');return;}g.hintUsed=true;g.cardHint=true;setHintUsed(true);setCardHint(true);}
  useEffect(()=>{
    if(phase!=='game'||training)return;
    const id=setInterval(()=>{const left=Math.max(0,(game.current.deadline-performance.now())/1000);setRemaining(left);if(left<=0)finish('timeout');},80);
    return()=>clearInterval(id);
  },[phase,training]);
  useEffect(()=>{
    if(phase!=='game')return;
    const listener=(e:KeyboardEvent)=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||['SELECT','INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;if(/^[1-4]$/.test(e.key)){e.preventDefault();answer(Number(e.key)-1);}if(e.key.toLowerCase()==='h'){e.preventDefault();revealHint();}};
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[phase]);
  const historyItems=history.slice().reverse().filter(e=>{const q=BANK.find(q=>q.id===e.id);return q&&(historyTopic==='all'||q.category===historyTopic)&&(!onlyMistakes||e.selected!==q.correct);});
  const active=current?.category||'all';
  const mistakesList=attempts.filter(a=>a.selected!==a.q.correct).map(a=>a.q);
  const totalAnswered=TOPICS.reduce((sum,c)=>sum+stats[c].answered,0),totalCorrect=TOPICS.reduce((sum,c)=>sum+stats[c].correct,0);
  const eligible=TOPICS.filter(c=>stats[c].answered>=3);
  const bestTopics=eligible.filter(c=>eligible.every(d=>stats[c].correct*stats[d].answered>=stats[d].correct*stats[c].answered));

  return <div className={`app theme-${phase==='game'?active:'all'}`}>
    <header className="topbar"><button className="wordmark" onClick={()=>{if(phase==='game')finish('stop');else setPhase('home');}} aria-label={UI.home[lang]}><img className="brand-logo" src={LOGO_IMAGE} width="38" height="38" alt="" />{TITLE[lang]}<span className="beta">PLAY / LEARN</span></button><div className="preferences">{lang===2&&<label className="ruby-toggle"><input type="checkbox" checked={furigana} onChange={e=>setFurigana(e.target.checked)}/>{T(UI.furigana)}</label>}<select aria-label="Language / Язык / 言語 / 语言" value={lang} onChange={e=>setLang(Number(e.target.value) as Lang)}><option value="0">Русский</option><option value="1">English</option><option value="2">日本語</option><option value="3">中文</option></select></div></header>
    {storageError&&<p className="storage-warning" role="status">{T(UI.storage)}</p>}
    {phase!=='game'&&<div className="menu-row"><nav className="main-menu" aria-label={UI.home[lang]}><button className={phase==='home'?'active':''} aria-current={phase==='home'?'page':undefined} onClick={()=>setPhase('home')}>{T(UI.playMenu)}</button><button className={phase==='progress'?'active':''} aria-current={phase==='progress'?'page':undefined} onClick={()=>setPhase('progress')}>{T(UI.myProgress)}<span className="menu-best">{best}</span></button><button className={phase==='history'?'active':''} aria-current={phase==='history'?'page':undefined} onClick={()=>setPhase('history')}>{T(UI.history)}</button></nav><SoundToggle enabled={soundEnabled} available={audio.current.available} onToggle={toggleSound} lang={lang}/></div>}
    <main>
    {phase==='home'?<>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">60 SECOND BRAIN BREAK</p><h1>{T(UI.tagline)}</h1><p className="intro">{T(UI.intro)}</p><div className="rule-chips"><span>60 <small>{['сек','sec','秒','秒'][lang]}</small></span><span>3 <small>{T(UI.mistakes)}</small></span><span>1 <small>{T(UI.hint)}</small></span></div></div><div className="hero-brain"><span className="floating-label">{T(UI.neural)}</span><Brain xp={xp}/><div className="rank-label"><span className="rank-dot"/>{T(UI.ranks[rank])}<span>0{rank+1}</span></div></div></section>
      <section className="launch-panel"><div className="section-heading"><h2>{T(UI.theme)}</h2><span className="small-label">{String(BANK.length).padStart(2,'0')} {['карточек','cards','問','题'][lang]}</span></div><div className="category-grid">{(['all','nets','area','percent','mental'] as Category[]).map((c,i)=><button key={c} className={`category ${category===c?'selected':''}`} onClick={()=>setCategory(c)} aria-pressed={category===c}><span className={`category-icon icon-${c}`}>{i===0?<img src={LOGO_IMAGE} alt=""/>:['','⬡','△','%','×'][i]}</span><span>{T(UI[c])}</span>{category===c&&<span className="selected-mark">✓</span>}</button>)}</div><div className="difficulty-section"><div className="section-heading"><h3>{T(UI.chooseDifficulty)}</h3><span className="small-label">{T(UI.freelyOpen)}</span></div><div className="difficulty-grid" role="group" aria-label={UI.chooseDifficulty[lang]}>{UI.difficultyNames.map((name,i)=><button key={i} className={`difficulty-choice ${tier===i?'selected':''}`} aria-pressed={tier===i} onClick={()=>setTier(i as Tier)}><span className="difficulty-number">0{i+1}</span><strong>{T(name)}</strong><small>{T(UI.difficultyDescriptions[i])}</small>{tier===i&&<span className="difficulty-check" aria-hidden="true">✓</span>}</button>)}</div></div><div className="launch-bottom"><p>{T(UI.rules)}</p><button className="primary" onClick={()=>start()}>{T(UI.play)}<span>↗</span></button></div></section>
      <section className="progress-section"><div><p className="eyebrow">{T(UI.neural)}</p><h3>{T(UI.ranks[rank])}</h3><p className="muted">{T(UI.rankNote)}</p></div><div className="progress-detail"><div className="progress-meta"><b>{xp} {T(UI.xp)}</b><span>{rank<4?`${thresholds[rank+1]-xp} ${UI.nextRank[lang]}`:'MAX'}</span></div><div className="progress-track"><span style={{width:`${rank===4?100:((xp-thresholds[rank])/(thresholds[rank+1]-thresholds[rank]))*100}%`}}/></div><div className="rank-steps">{UI.ranks.map((r,i)=><span key={i} className={i<=rank?'reached':''} title={r[lang]}>0{i+1}</span>)}</div></div></section>
    </>:phase==='progress'?<section className="success-page">
      <div className="success-heading"><div><p className="eyebrow">{T(UI.neural)}</p><h1>{T(UI.myProgress)}</h1><p className="muted">{T(UI.progressIntro)}</p></div><div className="success-brain"><Brain xp={xp}/><span>{T(UI.ranks[rank])}</span></div></div>
      <div className="success-metrics"><div className="success-metric best-metric"><span>{T(UI.bestResult)}</span><strong>{best}<small>{T(UI.points)}</small></strong><p>{T(UI.bestNote)}</p></div><div className="success-metric"><span>{T(UI.rounds)}</span><strong>{rounds}</strong><p>{T(UI.finishedRounds)}</p></div><div className="success-metric"><span>{T(UI.accuracy)}</span><strong>{totalAnswered?Math.round(totalCorrect/totalAnswered*100):'—'}<small>{totalAnswered?'%':''}</small></strong><p>{totalCorrect} / {totalAnswered} {T(UI.correctOf)}</p></div></div>
      <section className="strongest-panel"><div className="strongest-symbol" aria-hidden="true"><img src={LOGO_IMAGE} alt=""/></div><div><p className="eyebrow">{T(UI.strongest)}</p><h2>{bestTopics.length?bestTopics.map(c=>UI[c==='area'?'formulas':c][lang]).join(' · '):T(UI.notEnough)}</h2><p>{T(bestTopics.length?UI.strongestNote:UI.tryMore)}</p></div></section>
      <div className="section-heading"><h2>{T(UI.topicProgress)}</h2><span className="small-label">{T(UI.allTime)}</span></div>
      <div className="topic-progress-grid">{TOPICS.map(c=>{const stat=stats[c],percent=stat.answered?Math.round(stat.correct/stat.answered*100):0;return <article key={c} className={`topic-progress topic-${c}`}><div className="topic-progress-title"><h3>{T(UI[c==='area'?'formulas':c])}</h3><b>{stat.answered?`${percent}%`:'—'}</b></div><div className="skill-track" role="progressbar" aria-label={UI[c][lang]} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${percent}%`}}/></div><p>{stat.correct} / {stat.answered} {T(UI.correctOf)}</p></article>;})}</div>
      <p className="statistics-note">{T(UI.statsNote)}</p><p className="statistics-note">{T(UI.seenProgress)}: {Object.keys(seen).length} / {BANK.length}</p><button className="primary success-play" onClick={()=>setPhase('home')}>{T(UI.playMenu)}<span>↗</span></button>
    </section>:phase==='history'?<section className="history-page">
      <p className="eyebrow">NEUROSPARK</p><h1>{T(UI.history)}</h1><p className="muted history-note">{T(UI.historyNote)}</p>
      <div className="history-controls"><label>{T(UI.theme)} <select value={historyTopic} onChange={e=>{setHistoryTopic(e.target.value as Category);setHistoryLimit(40);}}>{(['all',...TOPICS] as Category[]).map(c=><option key={c} value={c}>{UI[c][lang]}</option>)}</select></label><label className="history-check"><input type="checkbox" checked={onlyMistakes} onChange={e=>{setOnlyMistakes(e.target.checked);setHistoryLimit(40);}}/>{T(UI.onlyMistakes)}</label><span>{historyItems.length} {['ответов','answers','件','条'][lang]}</span></div>
      {!historyItems.length&&<p className="history-empty">{T(history.length?UI.empty:UI.historyEmpty)}</p>}
      <div className="review-list">{historyItems.slice(0,historyLimit).map((e,i)=>{const q=BANK.find(q=>q.id===e.id)!;const correct=e.selected===q.correct;return <details key={`${e.round}-${e.id}-${e.at}-${i}`} className={`review-card ${correct?'review-correct':'review-wrong'}`}><summary><span className="review-status">{correct?'✓':'×'}</span><span><small>{new Date(e.at).toLocaleString(['ru-RU','en-GB','ja-JP','zh-CN'][lang])} · {T(UI[q.category])} · {T(e.training?UI.training:UI.difficultyNames[e.tier])}{e.helped?` · ${UI.helped[lang]}`:''}</small><b>{T(q.prompt)}</b></span><span className="expand-icon">+</span></summary><div className="review-content">{q.visual&&<div className="review-visual"><Diagram visual={q.visual} label={q.prompt[lang]}/></div>}<div className="review-answers"><p>{T(UI.chosen)}: <strong>{T(q.options[e.selected].text)}</strong></p>{q.options[e.selected].visual&&<Diagram visual={q.options[e.selected].visual!} label={q.options[e.selected].text[lang]}/>}<p>{T(UI.right)}: <strong>{T(q.options[q.correct].text)}</strong></p>{q.options[q.correct].visual&&<Diagram visual={q.options[q.correct].visual!} label={q.options[q.correct].text[lang]}/>}</div><h4>{T(UI.hint)}</h4><p>{T(q.hint)}</p><h4>{T(UI.why)}</h4><p>{T(q.explanation)}</p><div className="life-example"><h4>{T(UI.life)}</h4><p>{T(q.application)}</p></div></div></details>;})}</div>
      {historyItems.length>historyLimit&&<button className="secondary history-more" onClick={()=>setHistoryLimit(v=>v+40)}>{T(UI.loadMore)}</button>}
    </section>:phase==='game'&&current?<section className="game-shell">
      <div className="game-top"><div className="timer" role="timer" aria-label={training?UI.training[lang]:`${Math.ceil(remaining)} ${['секунд','seconds','秒','秒'][lang]}`}><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22"/><circle cx="26" cy="26" r="22" style={{strokeDasharray:138.23,strokeDashoffset:138.23*(1-remaining/60)}}/></svg><strong>{training?'∞':Math.ceil(remaining)}</strong></div><div className="game-stats"><span>{T(UI.score)}<b>{score.toString().padStart(2,'0')}</b></span><span>{T(UI.mistakes)}<b className="lives" aria-label={`${mistakes} / 3`}>{[0,1,2].map(i=><i key={i} className={i<mistakes?'lost':''}/>)}</b></span></div><SoundToggle enabled={soundEnabled} available={audio.current.available} onToggle={toggleSound} lang={lang}/><button className="quiet stop" onClick={()=>finish('stop')}>{T(UI.stop)}</button></div>
      {!training&&<div className="time-track"><span className={remaining<=10?'urgent':''} style={{width:`${remaining/60*100}%`}}/></div>}
      <div className="play-layout"><div className="question-panel" data-grade={current.level}><div className="question-meta"><span className="tag">{T(UI[current.category])}</span><span>{training?T(UI.training):<>{T(UI.difficultyNames[tier])} <span className="streak">{T(UI.streak)} {streak}/3</span></>}</span></div><h2 ref={questionRef} tabIndex={-1}>{T(current.prompt)}</h2>{current.visual?<div className="question-visual"><Diagram visual={current.visual} label={current.visual.kind==='shape'?NAMES[current.visual.shape][lang]:current.visual.kind==='solid'?NAMES[current.visual.solid][lang]:UI.nets[lang]}/></div>:<div className="number-decoration" aria-hidden="true">{current.category==='percent'?'%':'×'}</div>}
      <div className="answers">{current.options.map((o,i)=><button key={`${current.id}-${i}`} disabled={feedback!==null} onClick={()=>answer(i)} className={`answer ${feedback!==null?(i===current.correct?'correct':i===feedback?'incorrect':'dim'):''}`}><span className="answer-key">{i+1}</span>{o.visual&&<Diagram visual={o.visual} label={o.text[lang]}/>}<span className="answer-text">{T(o.text)}</span>{feedback!==null&&i===current.correct&&<span className="answer-state">✓</span>}{feedback===i&&i!==current.correct&&<span className="answer-state">×</span>}</button>)}</div>
      <div className="hint-row"><button className="hint-button" onClick={revealHint} disabled={hintUsed||feedback!==null}><span>✧</span>{T(hintUsed?UI.used:UI.hint)}<small>{hintUsed?'0/1':'1/1'}</small></button><span className="keyboard-help">{T(UI.shortcuts)}</span></div>{cardHint&&<div className="hint-box" role="status">{T(current.hint)}</div>}<div className="sr-only" aria-live="polite">{feedback!==null?UI[feedback===current.correct?'right':'mistakes'][lang]:''}</div>
      </div><aside className="brain-sidebar"><Brain key={`game-${glowKey}`} active={active} xp={xp+score} pulse={feedback!==null&&feedback===current.correct} celebrate={glowMode==='level'}/>{glowMode==='level'&&<span className="level-up-note" role="status">{T(UI.levelUp)}</span>}<span className="brain-caption">{T(UI[current.category])}</span><p>{T(UI.schema)}</p><div className="mini-rank"><span>0{rank+1}</span><b>{T(UI.ranks[rank])}</b></div></aside></div>
    </section>:<section className="results"><div className="result-hero"><div><p className="eyebrow">{training?T(UI.training):'ROUND COMPLETE'}</p><h1>{T(UI.done)}</h1><p className="muted">{T(reason==='stop'?UI.stop:UI[reason])}</p><div className="result-stats"><div><strong>{score}<small>/{attempts.length}</small></strong><span>{T(UI.score)}</span></div><div><strong>{attempts.length?Math.round(score/attempts.length*100):0}<small>%</small></strong><span>{T(UI.accuracy)}</span></div><div><strong>{training?'—':`+${score}`}</strong><span>{T(UI.xp)}</span></div></div></div><div className="result-brain"><Brain key={`finish-${glowKey}`} xp={xp} celebrate={glowMode==='finish'}/><button className="magic-replay" onClick={replayMagic}>{T(UI.replayMagic)}</button><b>{T(UI.ranks[rank])}</b><small>{T(UI.rankNote)}</small></div></div>
      <div className="result-actions"><button className="primary" onClick={()=>start()}>{T(UI.again)}<span>↗</span></button>{mistakesList.length>0&&<button className="secondary" onClick={()=>start(mistakesList)}>{T(UI.retry)} <span>{mistakesList.length}</span></button>}<button className="quiet" onClick={()=>setPhase('home')}>{T(UI.home)}</button></div>
      <div className="topic-results">{(['nets','area','percent','mental'] as const).filter(c=>attempts.some(a=>a.q.category===c)).map(c=>{const list=attempts.filter(a=>a.q.category===c),n=list.filter(a=>a.selected===a.q.correct).length;return <div key={c}><span>{T(UI[c])}</span><b>{n}/{list.length}</b><div className="topic-bar"><span style={{width:`${n/list.length*100}%`}}/></div></div>;})}</div>
      <h2 className="review-heading">{T(UI.review)}</h2>{!attempts.length&&<p>{T(UI.empty)}</p>}<div className="review-list">{attempts.map((a,i)=><details key={a.q.id} className={`review-card ${a.selected===a.q.correct?'review-correct':'review-wrong'}`} open={a.selected!==a.q.correct?true:undefined}><summary><span className="review-status">{a.selected===a.q.correct?'✓':'×'}</span><span><small>{String(i+1).padStart(2,'0')} · {T(UI[a.q.category])}{a.helped?` · ${UI.helped[lang]}`:''}</small><b>{T(a.q.prompt)}</b></span><span className="expand-icon">+</span></summary><div className="review-content">{a.q.visual&&<div className="review-visual"><Diagram visual={a.q.visual} label={a.q.prompt[lang]}/></div>}<div className="review-answers"><p>{T(UI.chosen)}: <strong>{T(a.q.options[a.selected].text)}</strong></p><p>{T(UI.right)}: <strong>{T(a.q.options[a.q.correct].text)}</strong></p>{a.q.options[a.q.correct].visual&&<Diagram visual={a.q.options[a.q.correct].visual!} label={a.q.options[a.q.correct].text[lang]}/>}</div><h4>{T(UI.why)}</h4><p>{T(a.q.explanation)}</p><div className="life-example"><h4>{T(UI.life)}</h4><p>{T(a.q.application)}</p></div><a className="source-link" href={SOURCE[a.q.source]} target="_blank" rel="noreferrer">{T(UI.sources)} ↗</a></div></details>)}</div>
    </section>}
    <details className="sources"><summary>{T(UI.sources)}</summary><p>{T(UI.sourceNote)}</p><ul><li><a href={SOURCE.openstax} target="_blank" rel="noreferrer">OpenStax · Geometric Formulas</a></li><li><a href={SOURCE.nets} target="_blank" rel="noreferrer">Wolfram MathWorld · Nets</a></li><li><a href="https://www.pearsoned.ca/text/cathcart/nets.html" target="_blank" rel="noreferrer">Pearson · Nets of Geometric Solids</a></li><li><a href={SOURCE.arithmetic} target="_blank" rel="noreferrer">OpenStax · Understand Percent</a></li></ul><p>{T(UI.schema)}</p></details>
    </main><footer><span>{TITLE[lang]}</span><span>LOOK. THINK. CONNECT.</span><span>{['Рекорд','Best','最高記録','最佳'][lang]}: {best}</span></footer>
  </div>;
}
