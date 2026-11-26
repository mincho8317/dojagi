// 도자기 프로토타입 공용 코드 · src/qlib.js, src/boots.js, src/tut.js, src/snd.js 에서 생성 (mkshared.py)
(function () {
  var S = window.PotteryShared = {};
  // 한글은 단어 단위로 줄바꿈 (「요」 한 글자만 다음 줄로 넘어가는 것 방지)
  try { var _wb = document.createElement('style'); _wb.textContent = 'body{word-break:keep-all;overflow-wrap:break-word}'; (document.head || document.documentElement).appendChild(_wb); } catch (e) {}
  // 등급 삭제(2026-11) : 보통·상급·특급으로 나뉘어 있던 흙·유약 원료를 한 가지로 합친다
  try { var _k2 = 'pottery-proto-v1', _g2 = JSON.parse(localStorage.getItem(_k2) || 'null'), _ch = false; if (_g2 && _g2.mats) { Object.keys(_g2.mats).forEach(function (k) { var m = /^([cg][wyrkcbj])([23])$/.exec(k); if (m && _g2.mats[k]) { _g2.mats[m[1] + '1'] = (_g2.mats[m[1] + '1'] || 0) + _g2.mats[k]; delete _g2.mats[k]; _ch = true; } else if (m) { delete _g2.mats[k]; _ch = true; } }); if (_ch) { localStorage.setItem(_k2, JSON.stringify(_g2)); } } } catch (e) {}
  // 초벌 공정 삭제(2026-11) : 초벌 대기·초벌 중이던 기물은 유약 대기로 옮긴다 · 화면이 저장 상태를 읽기 전에 실행
  try { var _k = 'pottery-proto-v1', _g = JSON.parse(localStorage.getItem(_k) || 'null'); if (_g && ((_g.bisqueList || []).length || ((_g.bisque || {}).items || []).length || _g.mainFocus === 'bisque')) { _g.glazeList = (_g.glazeList || []).concat(_g.bisqueList || [], (_g.bisque || {}).items || []); _g.bisqueList = []; _g.bisque = { state: 'idle', start: 0, items: [] }; if (_g.mainFocus === 'bisque') { _g.mainFocus = 'glaze'; } localStorage.setItem(_k, JSON.stringify(_g)); } } catch (e) {}
  // 공방 확대 화면(iframe) 모드 : 정면 공방에서 물레·유약·가마를 확대해 띄울 때 · 웹 실행기에서만
  try { window.__embedMode = window.top !== window.self && /(^|[?&])embed=1/.test(location.search); } catch (e) { window.__embedMode = false; }
  try { if (window.__embedMode) { document.documentElement.setAttribute('data-embed', '1'); } } catch (e) {}
  // 건조 공정 삭제(2026-11) : 빚은 그릇·건조 중이던 그릇은 마른 상태로 유약 대기로 옮긴다 (사라지지 않게)
  try { var _k3 = 'pottery-proto-v1', _g3 = JSON.parse(localStorage.getItem(_k3) || 'null'); if (_g3 && ((_g3.formedList || []).length || (_g3.dryList || []).length)) { var _mv = (_g3.formedList || []).concat(_g3.dryList || []).map(function (x) { var y = {}; for (var k in x) { y[k] = x[k]; } if (!y.dry || y.dry === 'early') { y.dry = 'ok'; } delete y.start; return y; }); _g3.glazeList = (_g3.glazeList || []).concat(_mv); _g3.formedList = []; _g3.dryList = []; localStorage.setItem(_k3, JSON.stringify(_g3)); } } catch (e) {}
  // 다듬기 삭제(2026-11) : 채집물이 바로 흙·유약이 된다 · 남은 원토·유약석은 5개당 2개 비율로 흙·유약으로 바꾼다
  try { var _k4 = 'pottery-proto-v1', _g4 = JSON.parse(localStorage.getItem(_k4) || 'null'), _R4 = { ry: 'cy1', rr: 'cr1', rw: 'cw1', rk: 'ck1', ow: 'gw1', oc: 'gc1', ob: 'gb1', oj: 'gj1' }, _c4 = false; if (_g4 && _g4.mats) { Object.keys(_R4).forEach(function (k) { if (k in _g4.mats) { var n = Math.round((_g4.mats[k] || 0) * 0.4); if (n) { _g4.mats[_R4[k]] = (_g4.mats[_R4[k]] || 0) + n; } delete _g4.mats[k]; _c4 = true; } }); if (_c4) { localStorage.setItem(_k4, JSON.stringify(_g4)); } } } catch (e) {}
  // <qlib> 의뢰 공용 라이브러리 · 이 블록은 scratchpad/src/qlib.js 에서 주입된다 (모든 화면 동일)
  S.qlib = function () {
    if (this._ql) { return this._ql; }
    // ── 조정값 (밸런스 데이터) ─────────────────────────────
    var TUNE = {
      fitMin: 60,          // 메인 의뢰 기물 판정 · 모양/높이 일치 최소 %
      itemGold: 750,       // 의뢰 기물 1점당 골드 · 양작 찻잔 일반 판매(약 300G)의 2.5배 안팎
      itemShards: 0,         // (쓰지 않음) 파편은 메인 의뢰에서만
      mainShardShare: 0.5,  // 메인 의뢰 파편 합 = 연구 파편 합의 50%      // 메인 의뢰 기물 1점당 파편
      questFame: 15,       // 메인 의뢰 완료 시 명성 경험치
      gradeBonus: { '수작': 2, '명작': 7, '요변': 7 }, // 납품 작품 등급별 골드 보너스 비율 · 판매가 등급 배수(×3·×8)를 따라가 납품이 늘 판매보다 비싸게
      // 작품 등급 = 공정별 실력 점수(0~100)의 가중 평균 · 무작위 없음
      skillW: { form: 0.55, glaze: 0.25, fire: 0.2 }, // 건조 공정 없음
      skillPart: {
        dry: { ok: 100, over: 70, early: 40 },
        glaze: { ok: 100, thick: 70, thin: 60, drip: 30 },
        fire: { '정합': 100, '근접': 65, '불일치': 25 }
      },
      gradeCut: { '명작': 180, '수작': 140 }, // 실력 점수 200점 만점 · 미만은 양작
      gradeCut3: { '명작': 190, '수작': 160 }, /* 지금 등급 : 성형 일치율(100) + 소성 온도 구간 점수(100) */
      gradeCut2: { '명작': 287, '수작': 250 }, /* 발색은 무작위 없음 · 연구 전부 + 최고 궁합 = 발색 100 → 실력 187+ 이면 명작 */ // 등급 = 실력(200) + 발색(100) = 300점 만점 · 미만은 양작
      colorTemp: { '정합': 55, '근접': 25, '불일치': 0 }, colorRnd: 0, /* 운 요소 없음 · 발색 = 온도 정합 55 + 고른 유약 10 + 연구 12 + 흙·유약 궁합 최대 24 (100에서 자름) */ // 발색 · 온도 정합 몫(%)
      gradeMul: { '양작': 1, '수작': 3, '명작': 8 }, // 평가액 배율
      pieceCap: { table: 1, tea: 2, vase: 2, jar: 3 }, // 의뢰 하나가 요구하는 기물 수 · 메인 의뢰 장(章)에 따라 (초반 1 · 중반 2 · 후반 3)
      deliverMul: 2.5,    // 메인 의뢰 납품가 = 작품 가치 × 2.5
      deliverMulOther: 1, // 일반·단골·시즌 의뢰 납품가 = 작품 가치 × 1
      valueK: 5,          // 기물 가치 = 재료값 × 5 × 등급 배율 × 발색 (양작 기본 찻잔 약 300G)
      g2Bonus: 0.25,      // 이중 시유 +25%
      patternBonus: 0.4,  // 무늬(매화 도장·붓 무늬) +40%
      // 발색 % = 무작위 · 등급과 무관 · 평가액에만 반영
      colorRange: { '정합': [70, 100], '근접': [45, 85], '불일치': [15, 55] },
      colorThick: { ok: 10, thin: -5, thick: 0, drip: -15 },
      colorValue: [0.75, 1.3], // 발색 0% → ×0.75 · 100% → ×1.3
      yohen: { heat: 'none', minPct: 92, chance: 0, valueMul: 2 }, // 요변 = 발색 특수 결과(등급 아님)
      // 가마 칸 온도 = 화도 기준 + 칸별 오프셋 · 중화도는 모든 유약의 적정 칸을 보장
      kilnBase: { low: 1180, mid: 1240, high: 1300 },
      kilnOff: [-50, -10, -60, -20, 0, -30, -70, -40, -80],
      kilnExact: 20, kilnNear: 50
    };
    // 유약 기준 정보 · 적정 온도와 기준 발색
    var GLZ = {
      white: { n: '백자유', opt: 1230, col: '#F3F0E6' }, celadon: { n: '청자유', opt: 1200, col: '#7FA8A0' },
      black: { n: '흑유', opt: 1170, col: '#3A3530' }, jinsa: { n: '진사유', opt: 1260, col: '#A8443A' },
      sakura: { n: '벚꽃유', opt: 1220, col: '#E9A3B5' }, cheonmok: { n: '천목유', opt: 1170, col: '#4A2E1E' }
    };
    // ── 연구 스킬트리 (밸런스 데이터 · 비용과 수치는 자유롭게 조정) ──────────
    // 행: [id, 행, 열, 이름, 선행[], 효과{}, 파편, 골드, 특수조건]
    var FXM = {
      snapTol: { t: '성형', l: '보정 허용 범위', b: 10, m: 100, u: '%' },
      snapRate: { t: '성형', l: '보정 속도', b: 100, m: 100, u: '%' },
      doneTol: { t: '성형', l: '구간 완료 오차', b: 3.5, m: 100, u: '%' },
      fitBonus: { t: '성형', l: '성형 점수 보너스', b: 0, m: 1, u: '점' },
      clayKeep: { t: '성형', l: '흙 아끼기 확률', b: 0, m: 100, u: '%' },
      clayLv: { t: '재료', l: '흙 정제 단계', b: 0, m: 1, u: '단계' },
      glazeLv: { t: '재료', l: '유약 발색 보너스', b: 6, m: 3, u: '%' },
      refineUp: { t: '재료', l: '채집 때 1개 더 얻을 확률', b: 0, m: 100, u: '%' },
      matKeep: { t: '재료', l: '유약 원료 아끼기 확률', b: 0, m: 100, u: '%' },
      dryRack: { t: '건조', l: '건조대 칸', b: 3, m: 1, u: '칸' },
      kilnSlot: { t: '소성', l: '소성가마 칸', b: 6, m: 1, u: '칸' },
      dryCut: { t: '건조', l: '건조 시간', b: 30, m: -30, u: '분' },
      fanZone: { t: '건조', l: '부채질 판정 폭', b: 22, m: 100, u: '%' },
      fanGain: { t: '건조', l: '부채질 1회 건조량', b: 45, m: 45, u: '초' },
      bqCut: { t: '소성', l: '풀무질 속도', b: 100, m: 100, u: '%' },
      bqSafe: { t: '소성', l: '반건조 소성 파손', b: 10, m: -100, u: '%' },
      glazeZone: { t: '유약', l: '적정 담금 폭(백자유)', b: 0.4, m: 0.002, u: '초' },
      kilnTol: { t: '가마', l: '정합 허용 온도', b: 20, m: 1, u: '℃' },
      kilnCut: { t: '가마', l: '소성 시간(중화도)', b: 3.5, m: -3.5, u: '시간' },
      breakCut: { t: '가마', l: '소성 기본 파손', b: 4, m: -100, u: '%' },
      colorMin: { t: '발색', l: '정합 발색 보너스', b: 0, m: 1, u: '%' },
      yohen: { t: '발색', l: '요변 확률(고화도·발색 92%+)', b: 50, m: 100, u: '%' },
      sell: { t: '판매', l: '작품 판매가', b: 100, m: 100, u: '%' },
      questGold: { t: '의뢰', l: '이야기 의뢰 골드', b: 100, m: 100, u: '%' },
      shard: { t: '와장창', l: '파편 획득량', b: 100, m: 100, u: '%' },
      fame: { t: '명성', l: '명성 경험치', b: 100, m: 100, u: '%' },
      expand: { t: '공방', l: '공방 바닥 줄 수', b: 7, m: 2, u: '줄' },
      tixMax: { t: '채집', l: '메밀묵 최대', b: 5, m: 1, u: '그릇' },
      gTime: { t: '채집', l: '채집 제한 시간', b: 30, m: 1, u: '초' },
      comboUp: { t: '채집', l: '흙 파기 콤보 시간', b: 2, m: 1, u: '초' },
      goldUp: { t: '채집', l: '황금 돌 등장 빈도', b: 100, m: 100, u: '%' },
      rareUp: { t: '채집', l: '희귀 흙·진사 확률', b: 0, m: 100, u: '%p' },
      digWide: { t: '채집', l: '삽 한 번 파는 범위', b: 100, m: 100, u: '%' }
    };
    var RCAT = [{ id: 'mat', n: '재료' }, { id: 'form', n: '성형' }, { id: 'fire', n: '유약·소성' }, { id: 'shop', n: '경영·공방' }, { id: 'gather', n: '채집' }];
    // 연구 트리 · 계열마다 9개 (1 · 3 · 3 · 2) · [id, 줄, 칸, 이름, 선행, 효과, 파편, 골드, 조건]
    var RROW = {
      mat: [
        ['r00', 0, 1, '재료 감각', [], { refineUp: 0.1 }, 20, 0],
        ['r10', 1, 0, '흙 정제 I', ['r00'], { clayLv: 1 }, 40, 400], ['r11', 1, 1, '채집 요령', ['r00'], { refineUp: 0.15 }, 40, 300], ['r12', 1, 2, '유약 정제 I', ['r00'], { glazeLv: 1 }, 40, 400],
        ['r20', 2, 0, '흙 정제 II', ['r10'], { clayLv: 1 }, 90, 1500], ['r21', 2, 1, '재료 아끼기', ['r11'], { clayKeep: 0.15, matKeep: 0.15 }, 70, 800], ['r22', 2, 2, '유약 정제 II', ['r12'], { glazeLv: 1 }, 90, 1500],
        ['r30', 3, 0, '흙 장인', ['r20', 'r21'], { refineUp: 0.2, clayKeep: 0.15 }, 150, 3000], ['r32', 3, 2, '유약 장인', ['r21', 'r22'], { refineUp: 0.15, matKeep: 0.15 }, 150, 3000]
      ],
      form: [
        ['f00', 0, 1, '물레 감각', [], { snapTol: 0.01 }, 20, 0],
        ['f10', 1, 0, '손끝 보정 I', ['f00'], { snapTol: 0.015 }, 30, 0], ['f11', 1, 1, '보정 속도 I', ['f00'], { snapRate: 0.2 }, 30, 0], ['f12', 1, 2, '형태 감각 I', ['f00'], { fitBonus: 2 }, 35, 0],
        ['f20', 2, 0, '손끝 보정 II', ['f10'], { snapTol: 0.015 }, 60, 500], ['f21', 2, 1, '완료 판정', ['f11'], { doneTol: 0.01 }, 60, 500], ['f22', 2, 2, '형태 감각 II', ['f12'], { fitBonus: 3 }, 65, 500],
        ['f30', 3, 0, '흙 절약', ['f20', 'f21'], { clayKeep: 0.2 }, 140, 2500], ['f32', 3, 2, '명장의 손', ['f21', 'f22'], { fitBonus: 4, snapRate: 0.25 }, 160, 3000]
      ],
      fire: [
        ['g00', 0, 1, '온도 감각', [], { kilnTol: 5 }, 20, 0],
        ['g10', 1, 0, '가마 단열 I', ['g00'], { kilnCut: 0.05 }, 35, 0], ['g11', 1, 1, '가마 다지기 I', ['g00'], { breakCut: 0.01 }, 35, 0], ['g12', 1, 2, '발색 연구 I', ['g00'], { colorMin: 3 }, 35, 0],
        ['g20', 2, 0, '가마 단열 II', ['g10'], { kilnCut: 0.1 }, 65, 600], ['g21', 2, 1, '가마 다지기 II', ['g11'], { breakCut: 0.015 }, 65, 600], ['g22', 2, 2, '발색 연구 II', ['g12'], { colorMin: 4 }, 65, 600],
        ['g30', 3, 0, '불의 장인', ['g20', 'g21'], { kilnCut: 0.1, kilnTol: 5 }, 160, 3000], ['g32', 3, 2, '빛깔의 장인', ['g21', 'g22'], { colorMin: 5, yohen: 0.2 }, 160, 3000]
      ],
      shop: [
        ['s00', 0, 1, '손님 응대', [], { sell: 0.03 }, 20, 0],
        ['s10', 1, 0, '값 매기기 I', ['s00'], { sell: 0.05 }, 30, 0], ['s11', 1, 1, '이웃 인심 I', ['s00'], { questGold: 0.1 }, 30, 0], ['s12', 1, 2, '파편 줍기 I', ['s00'], { shard: 0.15 }, 30, 0],
        ['s20', 2, 0, '입소문', ['s10'], { fame: 0.15 }, 60, 500], ['s21', 2, 1, '이웃 인심 II', ['s11'], { questGold: 0.1 }, 60, 500], ['s22', 2, 2, '파편 줍기 II', ['s12'], { shard: 0.2 }, 60, 500],
        ['s30', 3, 0, '공방 간판', ['s20', 's21'], { sell: 0.1, fame: 0.15 }, 150, 3000], ['s32', 3, 2, '마을의 공방', ['s21', 's22'], { questGold: 0.15, shard: 0.2 }, 150, 3000]
      ],
      gather: [
        ['c00', 0, 1, '묵 쑤는 요령', [], { tixMax: 1 }, 25, 0],
        ['c10', 1, 0, '넉넉한 시간 I', ['c00'], { gTime: 3 }, 40, 300], ['c11', 1, 1, '콤보 감각', ['c00'], { comboUp: 0.5 }, 40, 300], ['c12', 1, 2, '황금 눈썰미 I', ['c00'], { goldUp: 0.25 }, 40, 300],
        ['c20', 2, 0, '희귀 감별', ['c10'], { rareUp: 0.05 }, 70, 800], ['c21', 2, 1, '큰 묵 솥', ['c11'], { tixMax: 1 }, 70, 800], ['c22', 2, 2, '황금 눈썰미 II', ['c12'], { goldUp: 0.25 }, 70, 800],
        ['c30', 3, 0, '넓은 삽', ['c20', 'c21'], { digWide: 0.12, gTime: 3 }, 140, 2500], ['c32', 3, 2, '채집 장인', ['c21', 'c22'], { tixMax: 1, comboUp: 0.5, rareUp: 0.03 }, 160, 3000]
      ]
    };
    // 설비 확장 · 상점에서 골드로 산다 (연구 트리에는 없음) · 효과는 연구와 같은 방식으로 합산
    var UPG = [
      /* 건조대 증설 · 가마 6→9칸은 뺐다 (건조 공정 없음 · 가마 칸은 공방 가마에서 2,000/5,000/10,000G로 연다) */
      { id: 'u_exp', name: '공방 확장', desc: '공방 바닥 7×7 → 7×9', fx: { expand: 1 }, gold: 80000, req: [], cond: 'fame3' }
    ];
    var RNODE = {};
    RCAT.forEach(function (c) { RROW[c.id].forEach(function (r) { RNODE[r[0]] = { id: r[0], cat: c.id, row: r[1], col: r[2], name: r[3], req: r[4], fx: r[5], shards: r[6], gold: r[7] || [200, 400, 600, 1500][r[1]] || 500, cond: r[8] || '' }; }); }); /* 연구는 파편과 골드를 함께 쓴다 */
    UPG.forEach(function (u) { RNODE[u.id] = { id: u.id, cat: 'upg', row: -1, col: -1, name: u.name, req: u.req, fx: u.fx, shards: 0, gold: u.gold, cond: u.cond, upg: true }; });
    var RCOND = {
      dryUp: { t: '튜토리얼 후 도자기 6점 굽기', ok: function (g) { return !!g.dryUpReady; } },
      fame3: { t: '명성 Lv 3', ok: function (g) { return (g.fameLv || 1) >= 3; } }
    };
    function fx(g) {
      var o = {}, R = (g && g.res) || {};
      for (var id in R) { var n = RNODE[id]; if (!R[id] || !n) { continue; } for (var k in n.fx) { o[k] = (o[k] || 0) + n.fx[k]; } }
      return o;
    }
    function fxVal(key, v) { var M = FXM[key]; if (key === 'dryCut' || key === 'kilnCut') { return M.b * (1 - (v || 0)); } if (key === 'fanGain') { return M.b * (1 + (v || 0)); } return M.b + M.m * (v || 0); }
    function fxFmt(key, v) { var x = fxVal(key, v), M = FXM[key]; var s = Math.abs(x - Math.round(x)) < 0.001 ? String(Math.round(x)) : (Math.abs(x * 10 - Math.round(x * 10)) < 0.001 ? x.toFixed(1) : x.toFixed(2)); return (key === 'expand' ? '7×' + s : s) + M.u; }
    function resState(g, id) {
      var n = RNODE[id], R = g.res || {};
      if (!n) { return 'none'; }
      if (R[id]) { return 'done'; }
      if (!n.req.every(function (q) { return R[q]; })) { return 'locked'; }
      if (n.cond && RCOND[n.cond] && !RCOND[n.cond].ok(g)) { return 'cond'; }
      return 'ready';
    }
    function kMatch(temp, opt, g) { var d = Math.abs(temp - opt), ex = TUNE.kilnExact + (g ? (fx(g).kilnTol || 0) : 0); return d <= ex ? '정합' : (d <= Math.max(TUNE.kilnNear, ex + 10) ? '근접' : '불일치'); }
    function kTemps(heat) { var b = TUNE.kilnBase[heat] || TUNE.kilnBase.mid; return TUNE.kilnOff.map(function (o) { return b + o; }); }
    function skillOf(it, match) {
      var P = TUNE.skillPart, W = TUNE.skillW;
      var parts = {
        form: typeof it.fit === 'number' ? it.fit : Math.min(100, (it.form || 3) * 20),
        glaze: P.glaze[it.thick] != null ? P.glaze[it.thick] : 60,
        fire: P.fire[match] != null ? P.fire[match] : 25
      };
      // 실력 점수 = 성형(120) + 시유(80) · 200점 만점 (건조 공정 없음 · 소성 온도는 발색에 들어간다)
      var pts = { form: Math.round(parts.form * 1.2), glaze: Math.round(parts.glaze * 0.8) };
      var sc = pts.form + pts.glaze;
      var gr = sc >= TUNE.gradeCut['명작'] ? '명작' : (sc >= TUNE.gradeCut['수작'] ? '수작' : '양작');
      return { score: sc, max: 200, grade: gr, parts: parts, pts: pts };
    }
    function mixHex(a, b, t) { function h(x) { var n = parseInt(x.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } var A = h(a), B = h(b); var c = A.map(function (v, i) { return Math.max(0, Math.min(255, Math.round(v + (B[i] - v) * t))); }); return '#' + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1); }
    function tintOf(glaze, pct, rnd) {
      var base = (GLZ[glaze] || GLZ.white).col, lack = 1 - pct / 100;
      var c = mixHex(base, '#B5AA98', lack * 0.6); // 탁도: 발색이 낮을수록 흐리고 탁하다
      var br = ((rnd == null ? Math.random() : rnd) - 0.5) * 0.3 * (0.3 + lack); // 밝기 편차
      return br >= 0 ? mixHex(c, '#FFFFFF', br) : mixHex(c, '#000000', -br);
    }
    function colorRoll(it, match, heat, g) {
      // 발색 = 온도 정합 55% + 유약 보너스(바름 상태 + 연구) + 흙과 유약 궁합 (무작위 없음)
      var F = g ? fx(g) : {};
      var cp = { rnd: 0, temp: TUNE.colorTemp[match] != null ? TUNE.colorTemp[match] : 0, glaze: (TUNE.colorThick[it.thick] || 0) + (match === '정합' ? (F.colorMin || 0) : 0), syn: Math.round((clayOf(it.clay, it.glaze).color + (it.ggp != null ? it.ggp : (it.glaze === 'sakura' ? 2 : (GGRADE[it.gg] || 0)))) * 3) };
      var pct = Math.max(5, Math.min(100, cp.temp + cp.glaze + cp.syn));
      var Y = TUNE.yohen, yo = heat === Y.heat && pct >= Y.minPct && Math.random() < Y.chance + (F.yohen || 0);
      if (yo) { pct = 100; }
      return { pct: pct, parts: cp, yohen: yo, tint: tintOf(yo && it.glaze === 'black' ? 'cheonmok' : it.glaze, pct) };
    }
    // 채집 원료 품질(★)·고운 원료 시스템은 없앴다 (채집 개편 2). 예전 호출부가 깨지지 않게 이름만 남긴다
    function qualBonus(it) { return 0; }
    function addMat(g, k, n) {
      var m = {}, x; for (x in (g.mats || {})) { m[x] = g.mats[x]; }
      m[k] = (m[k] || 0) + n;
      return { mats: m, matsQ: {} };
    }
    function takeClay(g, k) {
      var m = {}, x; for (x in (g.mats || {})) { m[x] = g.mats[x]; }
      if (m[k] > 0) { m[k] -= 1; }
      return { mats: m, matsQ: {}, q: 1 };
    }
    function topQ() { return 1; }
    // ── 흙 : 색(백토·황토·적토·흑토) × 등급(보통·상급·특급) + 봄빛 흙(축제, 항상 상급) ──
    // 키 : 'c' + 색(w y r k) + 등급(1 보통 · 2 상급 · 3 특급) 예) cw3 = 특급 백토 · spring = 봄빛 흙
    // 원토(채집, 등급 없음) : rw ry rr rk → 다듬기(손 토련)로 등급이 정해진다
    var CGRADE = {
      1: { n: '', sell: 0.7, thin: 3.0, carve: 1.4, feel: 1.3, snap: 0.7, color: 0 },
      2: { n: '', sell: 1.0, thin: 2.7, carve: 1.2, feel: 1.15, snap: 0.85, color: 1 },
      3: { n: '', sell: 1.3, thin: 2.4, carve: 1.0, feel: 1.0, snap: 1.0, color: 2 }
    };
    var CCOLOR = {
      w: { n: '백토', aff: { white: 2, celadon: 2 }, sell: 0.1, thin: -0.1, carve: 0.1, snap: -0.1, note: '백자·청자 발색 +6% · 잘 갈라져요', col: '#E4DED2', wet: '#C9C2B4', dry: '#F2EEE6' },
      y: { n: '황토', aff: { celadon: 1, black: 1 }, sell: -0.05, snap: 0.1, note: '청자·흑유 발색 +3% · 보정 +10%', col: '#D2AE7C', wet: '#B48A58', dry: '#E2C79E' },
      r: { n: '적토', aff: { jinsa: 2, black: 1, white: -1 }, thin: 0.1, feel: -0.1, note: '진사 발색 +6% · 끈기 좋아 손맛 -10%', col: '#B9765A', wet: '#9A5A40', dry: '#D49A7E' },
      k: { n: '흑토', aff: { black: 2, white: -1, celadon: -1 }, sell: 0.05, carve: -0.1, note: '흑유 발색 +6% · 단단해 손이 덜 간다', col: '#6E625A', wet: '#4E4540', dry: '#8E837A' },
      s: { n: '봄빛 흙', aff: { sakura: 2 }, sell: 0.05, thin: -0.2, note: '축제 흙 · 벚꽃유 발색 +6%', col: '#E2B4A6', wet: '#B98A7E', dry: '#F0D3C7' }
    };
    // 등급 없음 : 흙·유약 원료는 색·종류별 한 가지(키 끝자리 1). 품질은 연구 「재료」 계열의 정제 단계로 오른다
    var CLAYKEYS = ['cy1', 'cw1', 'cr1', 'ck1'];
    var _gC = null, _gT = 0;
    function curG() { var now = Date.now(); if (_gC && now - _gT < 400) { return _gC; } try { _gC = JSON.parse(localStorage.getItem('pottery-proto-v1') || '{}') || {}; } catch (e) { _gC = {}; } _gT = now; return _gC; }
    function clayLv(g) { return Math.min(2, fx(g || curG()).clayLv || 0); }
    function glazePts(g) { return 2 + Math.min(2, fx(g || curG()).glazeLv || 0); } // 발색 점수 2·3·4 = +6·9·12%
    function lerpG(a, b, t) { var o = {}; for (var k in a) { o[k] = typeof a[k] === 'number' ? a[k] + (b[k] - a[k]) * t : a[k]; } return o; }
    var CLEGACY = { basic: 'cy1', refined: 'cy2', kaolin: 'cw2', porcelain: 'cw3', premium: 'cw3' };
    /* 재료 가격 등급 · 기본 30 / 중급 90 / 특별 500 (상점 가격 = 기물 가치 계산의 바탕) */
    var MATPRICE = { clay: { y: 30, w: 30, r: 90, k: 90, s: 300 }, glaze: { white: 30, celadon: 30, black: 90, jinsa: 500, sakura: 300 } };
    /* 기물에 들어간 재료값 = 흙 종류 × 개수 + 유약 종류 × 입힌 횟수 */
    function matValue(it) {
      var c = clayOf((it && it.clay) || 'cy1'), cp = MATPRICE.clay[c.c] || 30, n = Math.max(1, (it && it.clayN) || 1);
      var g1 = MATPRICE.glaze[it && it.glaze] || 30, g2 = it && it.g2 && it.g2 !== true ? (MATPRICE.glaze[it.g2] || 30) : 0;
      return { clay: cp * n, glaze: g1 + g2, coats: g2 ? 2 : 1, total: cp * n + g1 + g2 };
    }
    function clayOf(id, glaze) {
      id = CLEGACY[id] || id;
      var c = id === 'spring' ? 's' : (id && id.charAt(1)) || 'y', lv = clayLv(), gd = 2 + lv / 2;
      var C = CCOLOR[c] || CCOLOR.y, b = lerpG(CGRADE[2], CGRADE[3], lv / 2);
      return { id: id, c: c, grade: gd, gradeN: '', lv: lv, name: C.n,
        sell: Math.round((b.sell + (C.sell || 0)) * 100) / 100, thin: Math.round((b.thin + (C.thin || 0)) * 10) / 10,
        color: Math.max(0, b.color + ((C.aff || {})[glaze] || 0)), aff: C.aff, feel: b.feel * (1 + (C.feel || 0)), carve: b.carve * (1 + (C.carve || 0)), snap: b.snap * (1 + (C.snap || 0)),
        note: C.note, col: C.col, wet: C.wet, dry: C.dry };
    }
    // ── 유약 원료 : 종류 × 등급. 키 = 'g' + 종류(w 장석 · c 철분 · b 철광 · j 진사) + 등급(1~3). 벚꽃 재(petal)는 축제용·상급 판정 ──
    // 원석(채집, 등급 없음) : ow oc ob oj → 다듬기(절구질)로 등급이 정해진다
    var GMAT = { white: 'gw', celadon: 'gc', black: 'gb', jinsa: 'gj', sakura: 'petal' };
    var GMATN = { white: '장석', celadon: '철분', black: '철광', jinsa: '진사', sakura: '벚꽃 재' };
    var GGRADE = { 1: 0, 2: 2, 3: 4 }; // 원료 등급 → 발색 점수
    function glazeMatKey(glaze) { var b = GMAT[glaze]; return !b ? '' : (glaze === 'sakura' ? 'petal' : b + '1'); }
    function glazeMatName(glaze) { return GMATN[glaze] || ''; }
    function isTut(g) { var t = g && g.tut; try { var p = localStorage.getItem('tutProg'); if (typeof t === 'number' && p !== null && +p > t) { t = +p; } } catch (e) {} return typeof t === 'number' && t < 9; }
    function colorPctOf(p) { return typeof p.colorPct === 'number' ? p.colorPct : Math.min(100, (p.color || 1) * 20); }
    // ── 등장인물 · 대사 ─────────────────────────────
    // {이름} = 플레이어가 정한 주인공 이름 · 할머니 = 강 할매 (손님마다 부르는 호칭이 다르다)
    var NPC = {
      yoon: { name: '윤 할매', role: '골목 국밥집 주인', res: 'CHAR_YOON', tone: '#B9533A', call: '강 할매' },
      cha: { name: '차 선생', role: '동네 다도 선생', res: 'CHAR_CHA', tone: '#4E7D74', call: '강 선생님' },
      jeong: { name: '화가 정윤', role: '꽃집 겸 화실 주인', res: 'CHAR_JEONG', tone: '#7A5A93', call: '강 여사님' },
      festa: { name: '하람 위원', role: '봄 다회 준비위원 · 시즌', res: 'CHAR_HARAM', tone: '#C2577A', call: '강 선생님' },
      jang: { name: '장 씨 할아버지', role: '장 담그는 이웃', res: 'CHAR_JANG', tone: '#8A6410', call: '명옥이' },
      dudu: { name: '두두리', role: '지하실 너머 문지기 도깨비', res: 'CHAR_DUDU', tone: '#3E6B8A', call: '묵 할멈', dok: true },
      bulmok: { name: '불목이', role: '외눈 대장장이 도깨비', res: 'CHAR_BULMOK', tone: '#8A3D10', call: '강 선생', dok: true },
      kids: { name: '방울이와 도롱이', role: '꼬마 도깨비 남매', res: 'CHAR_KIDS', tone: '#6B8E3A', call: '강 할머니', dok: true }
    };
    // 에피소드 · 챕터 (챕터 = 단골 한 명 · 의뢰 5개 안팎)
    var EPIS = {
      main: { n: 1, title: '강 할매네 공방', chapters: [
        { ch: 'table', npc: 'yoon', title: '윤 할매의 국밥집', town: 'market' },
        { ch: 'tea', npc: 'cha', title: '차 선생의 찻자리', town: 'temple' },
        { ch: 'vase', npc: 'jeong', title: '정윤의 화실', town: 'harbor' },
        { ch: 'jar', npc: 'jang', title: '장 씨네 장독대', town: 'gallery' }
      ] },
      dok: { n: 1, title: '김 서방, 오랜만이다!', chapters: [
        { ch: 'dok1', npc: 'dudu', title: '두두리의 묵 잔치' },
        { ch: 'dok2', npc: 'bulmok', title: '불목이의 대장간' },
        { ch: 'dok3', npc: 'kids', title: '방울이와 도롱이' }
      ] }
    };
    // 단골 수첩 · 의뢰를 끝낼 때마다 한 칸씩 열린다 (0: 처음 만남 · 1·2·4: 끝낸 의뢰 수 · 'end': 챕터 완료)
    var PROF = {
      min: { name: '민 씨', role: '찻집 주인', call: '강 선생님', rows: [
        [0, '기본', '40대 · 골목 찻집 주인 · 조용하고 다정해요'],
        [0, '과거', '돌아가신 할머니가 쓰던 찻잔이 깨져서, 강 선생님께 똑같이 빚어 달라고 부탁해 두었어요'],
        [1, '지금', '공방이 닫혀서 포기하고 있었는데, 손녀가 잔을 빚어 줬어요'],
        [1, '취향', '청자 찻잔'],
        [1, '매듭', '“할머님 잔이랑 꼭 닮았어요.” 그 말에 처음으로 뿌듯함을 느꼈어요']
      ] },
      yoon: { name: '윤 할매', role: '골목 국밥집 주인', call: '강 할매', rows: [
        [0, '기본', '70대 · 국밥집 40년 · 무뚝뚝한데 정이 많아요'],
        [1, '과거', '남편을 먼저 보내고 혼자 가게를 지켰어요. 강 할매와 같은 해 골목에 가게를 열어 40년 친구가 됐어요'],
        [2, '지금', '무릎이 안 좋아 가게를 접을까 고민 중이에요. 손주가 이어받겠다는데 영 못 미더워요'],
        [4, '마음에 걸린 것', '내가 그만두면 이 국밥 맛이 끊길까 봐요'],
        [2, '취향', '투박한 황토 사발, 흑유'],
        ['end', '매듭', '손주에게 가게를 맡기기로 했어요. “내 거랑 맛이 좀 달라. 근디 손님은 더 늘었어.”']
      ] },
      cha: { name: '차 선생', role: '동네 다도 선생', call: '강 선생님', rows: [
        [0, '기본', '30대 · 다도 선생 · 단정하고 조심스러워요'],
        [1, '과거', '도예가가 꿈이었어요. 강 선생님께 배우다가 재능이 없다며 그만두고 다도로 갔어요'],
        [2, '지금', '다도 교실 학생이 점점 줄고 있어요'],
        [4, '마음에 걸린 것', '강 선생님이 아프실 때 끝내 병문안을 못 갔어요. 마지막 인사를 못 했어요'],
        [2, '취향', '청자, 찻사발'],
        ['end', '매듭', '{이름} 님이 빚은 다완으로 강 선생님께 차 한 잔을 올렸어요. 늦은 인사를 했어요']
      ] },
      jeong: { name: '화가 정윤', role: '꽃집 겸 화실 주인', call: '강 여사님', rows: [
        [0, '기본', '30대 · 꽃집 겸 화실 · 밝지만 조금 지쳐 있어요'],
        [1, '과거', '서울에서 게임 회사 원화가로 일하다 번아웃이 와서 고향에 내려왔어요. 강 여사님이 공방 한쪽에서 그림을 그리게 해 줬어요'],
        [2, '지금', '1년째 그림을 못 그리고 있어요'],
        [4, '마음에 걸린 것', '다시 그려도 될까, 또 무너지면 어쩌지'],
        [2, '취향', '백자, 매병, 매화 문양'],
        ['end', '매듭', '동네 작은 전시에서 {이름} 님의 매병 옆에 새 그림을 걸었어요. 둘 다 다시 시작했어요']
      ] },
      jang: { name: '장 씨 할아버지', role: '장 담그는 이웃', call: '명옥이', rows: [
        [0, '기본', '80대 · 장 담그는 이웃 · 말수가 적어요'],
        [1, '과거', '명옥이(강 할매)와 어릴 적 같은 동네에서 자랐어요. 장독은 늘 이 공방 가마에서 구웠어요'],
        [2, '지금', '명옥이가 해마다 하던 장 나눔을 올해부터 이어서 해요'],
        [4, '마음에 걸린 것', '끝내 하지 못한 말이 있어요'],
        [2, '취향', '흑토, 큰 독, 흑유'],
        ['end', '매듭', '명옥이가 빚고 싶어 하던 보름달 항아리를 받았어요. 끝까지 “명옥이 손녀”라고만 부르다, 처음으로 {이름}의 이름을 불렀어요']
      ] },
      dudu: { name: '두두리', role: '문지기 도깨비', call: '묵 할멈', dok: true, rows: [
        [0, '기본', '덩치 큰 문지기 도깨비 · 호쾌한 먹보 · 목소리가 크고 허풍이 심해요'],
        [1, '과거', '오래전 길을 잃고 들어온 강 할매와 메밀묵 한 그릇으로 친구가 됐어요'],
        [2, '지금', '“묵 못 먹은 지 삼 년!” (사실은 1년이에요)'],
        [4, '마음에 걸린 것', '지하실 문이 닫히면 사람 세상과 영영 끊길까 봐요'],
        [2, '취향', '큰 그릇이면 다 좋아요. 묵을 많이 담을 수 있으니까요'],
        ['end', '매듭', '“김 서방이 묵만 잘 가져오면 문은 안 닫혀!”']
      ] },
      bulmok: { name: '불목이', role: '외눈 대장장이 도깨비', call: '강 선생', dok: true, rows: [
        [0, '기본', '외눈 대장장이 · 무뚝뚝한 장인 기질 · 불 다루는 솜씨는 마을 제일'],
        [1, '과거', '화로가 꺼져 가던 해에 강 선생이 흙으로 화로 벽을 다시 쌓아 줬어요'],
        [2, '지금', '그 화로로 마을 도깨비들 방망이를 고쳐 줘요'],
        [4, '마음에 걸린 것', '강 선생에게 고맙다는 말을 한 번도 못 했어요'],
        [2, '취향', '흑유, 튼튼하고 두꺼운 그릇'],
        ['end', '매듭', '“…불 다루는 건 강 선생한테 배웠다. 너도 배워라.”']
      ] },
      kids: { name: '방울이와 도롱이', role: '꼬마 도깨비 남매', call: '강 할머니', dok: true, rows: [
        [0, '기본', '장난꾸러기 꼬마 도깨비 남매 · 누나 방울이, 동생 도롱이'],
        [1, '과거', '강 할머니가 놀러 올 때마다 흙으로 작은 그릇을 빚어 줬어요'],
        [2, '지금', '강 할머니가 왜 안 오는지 아직 몰라요'],
        [4, '마음에 걸린 것', '마을 한가운데 큰 독에 금이 간 걸 어른들이 쉬쉬해요'],
        [2, '취향', '알록달록한 작은 그릇'],
        ['end', '매듭', '“할미가 그러는데, 큰 독은 강 할머니만 고칠 수 있대.” (다음 에피소드로 이어져요)']
      ] }
    };
    var STORY = [
      // ── 1챕터 · 윤 할매의 국밥집 ──
      { id: 'm01', npc: 'yoon', ch: 'table', st: ['t1'], title: '강 할매 있슈?', intro: ['골목 끝에 불이 켜졌길래 와 봤어.', '…알고 왔어. 장례 때는 무릎이 말을 안 들어서 못 갔고.', '(빈 작업대를 한참 바라본다)', '그래도 국밥집 그릇은 깨지더라. 종지 하나만 좀 부탁해도 되겠어?', '나/smile: (할머니 단골이시구나.)', '나: 할머니 그릇만은 못해도, 국밥 맛 안 떨어지게 빚어 드릴게요.', '…허, 말하는 건 강 할매 판박이네.'], accLabel: '남은 흙만큼만요', done: ['…손맛이 강 할매 그릇이랑 닮았네.', '쬐끄만 게 맨날 흙 묻히고 다니더니, 이젠 그릇을 빚네. 또 올게.'] },
      { id: 'm04', npc: 'yoon', ch: 'table', st: ['t10', 't11'], choose: { key: 't10', any: ['white', 'celadon'] }, title: '새 메뉴, 새 그릇', intro: ['강 할매랑 나, 같은 해에 이 골목에 가게를 열었어. 벌써 40년이여.', '근디 손주 녀석이 가게를 물려받겠다네. 새 메뉴도 만들자고.', '새 메뉴 그릇은 자네가 골라 줘. 하얀 백자든 푸른 청자든.'], done: ['손주가 그릇 사진을 찍어 가더라.'], doneBy: { white: ['하얀 그릇이라… 강 할매는 늘 까만 걸 줬는디.', '손주가 그러더라. 새 메뉴니께 새 얼굴이 좋대.'], black: ['까만 그릇이네. 강 할매랑 똑같이 골랐어.', '손주가 그러더라. 할머니 국밥 맛은 그대로 두재.'] } },
      { id: 'm05', npc: 'yoon', ch: 'table', st: ['t13', 't14', 't15'], unlockNote: '접시', title: '할매의 접시', intro: ['가게는 손주한테 맡기기로 했어. 나 없어도 맛은 안 끊기더라고.', '강 할매가 마지막으로 빚어 준다던 접시가 있어. 끝내 못 받았지.', '그걸 자네가 빚어 주겠어?'], done: ['…그려. 이 접시여. 고마워, 정말.', '손주 녀석 국밥, 내 거랑 맛이 좀 달라. 근디 손님은 더 늘었어.'] },
      // ── 2챕터 · 차 선생의 찻자리 ──
      { id: 'm06', npc: 'cha', ch: 'tea', st: ['c1'], glz: { c1: { cov: [0.4, 0.7] } }, title: '강 선생님의 제자', intro: ['윤 할매께 소식 들었습니다. …강 선생님께 흙을 배웠던 사람입니다.', '저는 결국 그릇 대신 차를 택했지요.', '다도 수업에 쓸 잔이 필요합니다. 소박한 잔부터 부탁드려도 될까요?'], done: ['손에 감기는 맛이 좋군요. 선생님 잔을 처음 쥐었을 때가 떠오릅니다.'] },
      { id: 'm09', npc: 'cha', ch: 'tea', st: [], type: 'visit', rw: { gold: 800, shards: 20, mats: { gc1: 5 } }, title: '늦은 고백', intro: ['오늘은 그릇이 아니라… 드릴 말씀이 있어 왔습니다.', '선생님이 아프실 때, 저는 병원 앞까지 갔다가 돌아왔습니다. 세 번이나요.', '약해진 모습을 볼 자신이 없었습니다. {이름} 님은 1년을 곁에 있었다지요.', '나/sad: (…나도, 할머니한테 끝내 못 한 말이 있는데.)', '(차 선생이 철분 원료를 내민다) 선생님이 제게 맡겨 두신 겁니다. 이제 주인에게 돌려드려요.'], done: ['들어 주셔서 고맙습니다. 조금 가벼워졌습니다.'] },
      { id: 'm10', npc: 'cha', ch: 'tea', st: ['c14', 'c15'], glz: { c14: { cov: [0.4, 0.7] } }, unlockNote: '화병 · 다완', title: '다완 한 점', intro: ['다회를 열려 합니다. 손님은 한 분, 강 선생님입니다.', '찻자리에 꽃 한 송이 꽂을 화병과, 두 손에 감기는 찻사발, 다완을 부탁드립니다.'], done: ['…훌륭합니다.', '다회 날, 첫 잔은 선생님 자리에 두겠습니다.'] },
      // ── 3챕터 · 정윤의 화실 ──
      { id: 'm11', npc: 'jeong', ch: 'vase', st: ['v1'], glz: { v1: { ang: [30, 60] } }, title: '강 여사님의 공방', intro: ['안녕하세요! 강 여사님 계세요? 저 꽃집 하는 정윤이에요.', '(사정을 들은 정윤이, 들고 온 꽃다발을 말없이 작업대에 내려놓는다)', '…늦었네요, 제가.', '(애써 웃으며) 창가에 둘 화병을 부탁하려고 왔어요. 한 송이만 꽂는 가는 병 하나요.'], done: ['창가에 두니 꽃이 훨씬 살아 보여요.', '여사님이 여기서 그림 그리게 해 주셨거든요. 저 구석 자리요.'] },
      { id: 'm12', npc: 'jeong', ch: 'vase', st: ['v4', 'v5'], glz: { v5: { ang: [0, 15], cov: [0.3, 0.5] } }, title: '빈 캔버스', intro: ['(휴대폰 속 빈 캔버스 사진을 보여 주며) 이거, 1년째 이래요.', '서울에서 게임 회사 원화가였어요. 마감 끝나면 다음 마감이 와 있고… 어느 날 펜을 못 잡겠더라고요.', '…어? {이름} 님도 게임 회사였어요? 기획자요? 아, 그럼 다 아시겠네. 업데이트 전날 밤.', '(둘이 동시에 한숨을 쉬고, 정윤이 처음으로 크게 웃는다)', '그림 대신 병이라도 놓아 보려고요. 화실에 둘 병을 부탁해요.'], done: ['병을 놓으니 빈 캔버스가 덜 무서워요.', '다음엔 {이름} 님이 제 얼굴 좀 봐 주세요. 마감 전 표정인지 아닌지.'] },
      { id: 'm15', npc: 'jeong', ch: 'vase', st: ['v13', 'v14', 'v15'], glz: { v14: { ang: [120, 150], cov: [0.5, 0.8] } }, unlockNote: '항아리', title: '그림 속 항아리', intro: ['병을 놓고 나서, 다시 붓을 잡았어요. 그림 한 장을 끝냈어요!', '그래서… 동네 작은 전시에 나가기로 했어요. 무섭지만요.', '그림 속 공방 앞에 늘 항아리가 있었거든요. 여사님 공방 그림 옆에, {이름} 님 항아리를 같이 놓고 싶어요.'], done: ['그림보다 항아리가 더 예쁘다고들 해요. 질투 나네요!', '다음 전시도 같이 나가요. 이번엔 제가 먼저 신청할게요.'] },
      // ── 4챕터 · 장 씨네 장독대 ──
      { id: 'm16', npc: 'jang', ch: 'jar', st: ['j2'], glz: { j2: { g2: true } }, title: '장독대가 비었구먼', intro: ['…명옥이 손녀로구먼.', '장독대 항아리 하나가 깨졌네. 장 담글 철이 오는데 말이야.'], done: ['튼튼하구먼. 명옥이 독처럼.'] },
      { id: 'm17', npc: 'jang', ch: 'jar', st: [], type: 'visit', rw: { gold: 1000, shards: 30, mats: { ck1: 5 } }, title: '어릴 적 이야기', intro: ['명옥이랑 나는 저 냇가 건너 같은 동네에서 났네.', '그 사람은 어릴 때부터 흙장난을 좋아했지. 손이 늘 시커멨어.', '내 장독은 다 이 공방 가마에서 구웠어. 오십 년을.', '아들 보내고 나서는… 손녀 하나 보고 살았지.', '(흑토 꾸러미를 내민다) 장독 빚을 흙이네. 명옥이한테 주려던 거야.'], done: ['…말이 길었구먼. 늙은이 수다였네.'] },
      { id: 'm20', npc: 'jang', ch: 'jar', st: ['j13', 'j15'], glz: { j13: { g2: true } }, unlockNote: '달항아리', title: '보름달 항아리', intro: ['명옥이가 늘 그랬지. 언젠가 보름달 같은 항아리를 빚겠다고.', '…그 말, 나한테 처음 한 말이었네. 열일곱 살 때.', '자네가 대신 빚어 주겠나?'], done: ['…보름달이구먼.', '고맙네, {이름}.'] }
    ];
    // ── 도깨비 이야기 · 에피소드 1 (지하실 너머) ──
    var DSTORY = [
      { id: 'd01', npc: 'dudu', ch: 'dok1', st: ['da1', 'da2'], title: '묵 그릇이 없어!', intro: ['김 서방! 묵 가져왔나? …어, 그릇이 없네!', '묵 할멈이 준 묵그릇이 지난겨울에 와장창 깨졌거든.', '묵 담을 대접이랑 양념장 종지! 묵이 춤을 출 만큼 멋지게!'], done: ['이거지! 묵이 그릇에서 덩실덩실!'] },
      { id: 'd03', npc: 'dudu', ch: 'dok1', st: [], type: 'visit', rw: { gold: 500, shards: 20, mats: { ry: 6, ow: 4 } }, title: '묵 할멈이 처음 온 날', intro: ['묵 할멈이 처음 여기 왔을 때 말이야, 길을 잃고 울고 있었어. 열 살쯤이었나.', '내가 겁주려고 크게 웃었는데, 그 꼬마가 품에서 메밀묵을 꺼내 주더라고.', '그날부터 친구야. 오십 년도 넘게.', '(두두리가 흙 원료와 원석을 한 아름 안겨 준다) 이건 그냥 줄게. 친구 손녀니까!'], done: ['크흠… 눈에 먼지가 들어갔네.'] },
      { id: 'd05', npc: 'dudu', ch: 'dok1', st: ['da6', 'da7'], title: '두두리의 큰 잔', intro: ['사실 걱정했어. 묵 할멈이 안 오면 지하실 문이 영영 닫힐까 봐.', '근데 김 서방이 왔잖아! 우리 우정의 잔을 빚자고!'], done: ['김 서방이 묵만 잘 가져오면 문은 안 닫혀!', '참, 대장간 불목이가 김 서방을 보고 싶대. 무뚝뚝해도 착한 놈이야.'] },
      { id: 'd06', npc: 'bulmok', ch: 'dok2', st: ['db1', 'db2'], title: '말 없는 대장장이', intro: ['……강 선생 손녀냐.', '물그릇. 화로 옆에 둘 거. 대접도.', '(그게 다였다)'], done: ['……쓸 만하다.'] },
      { id: 'd09', npc: 'bulmok', ch: 'dok2', st: [], type: 'visit', rw: { gold: 700, shards: 25, mats: { oj: 3 } }, title: '꺼져 가던 화로', intro: ['……예전에, 이 화로가 꺼져 가던 해가 있었다.', '마을 방망이를 아무도 못 고쳤지. 강 선생이 와서 사흘 밤을 흙을 쌓았다.', '고맙다는 말을, 못 했다.', '(불목이가 붉은 원석을 내민다) ……진사다. 받아라.'], done: ['……너한테 하는 거 아니다. 강 선생한테 하는 거다.'] },
      { id: 'd10', npc: 'bulmok', ch: 'dok2', st: ['db5', 'db6'], title: '불목이의 찻잔', intro: ['……찻잔 하나. 대접 하나.', '찻잔은 내 거. 대접은…… 강 선생 자리. 그 사람은 차보다 국을 좋아했다.'], done: ['……불 다루는 건 강 선생한테 배웠다. 너도 배워라.', '꼬마들이 너 찾더라. 시끄러운 놈들이다.'] },
      { id: 'd11', npc: 'kids', ch: 'dok3', st: ['dc1', 'dc2'], title: '소꿉놀이 그릇', intro: ['방울이: 김 서방이다! 진짜 사람이다!', '도롱이: 소꿉놀이 그릇 만들어 줘! 강 할머니처럼!'], done: ['방울이: 우와, 강 할머니 그릇이랑 똑같아!', '도롱이: 아니야, 이게 더 커!'] },
      { id: 'd14', npc: 'kids', ch: 'dok3', st: [], type: 'visit', rw: { gold: 600, shards: 30, mats: { rw: 5 } }, title: '강 할머니는 언제 와?', intro: ['방울이: 김 서방, 강 할머니는 언제 와?', '(뭐라고 말해야 할지 몰라 한참 망설인다)', '도롱이: …어른들이 그러는데, 이제 안 온대.', '방울이: 그래도 김 서방이 오니까 괜찮아. 이거, 강 할머니랑 캐던 하얀 흙이야.'], done: ['방울이: 또 놀러 와야 해. 약속!'] },
      { id: 'd15', npc: 'kids', ch: 'dok3', st: ['dc6', 'dc7'], title: '마을 한가운데 큰 독', intro: ['도롱이: 쉿, 비밀인데… 마을 한가운데 큰 독 있잖아.', '방울이: 금이 갔대. 어른들이 쉬쉬해.', '도롱이: 그릇 두 개만 만들어 줘. 그 앞에 물 떠 놓고 빌 거야.'], done: ['방울이: 할미가 그러는데, 큰 독은 강 할머니만 고칠 수 있대.', '도롱이: 김 서방도 강 할머니 손녀니까… 고칠 수 있지?'] }
    ];
    var CHLV = { table: 1, tea: 1, vase: 3, jar: 4, dok1: 1, dok2: 2, dok3: 3 };
    var GP = { white: '백자', celadon: '청자', black: '흑유', jinsa: '진사', sakura: '벚꽃', cheonmok: '천목' };
    var GNM = { white: '백자유', celadon: '청자유', black: '흑유', jinsa: '진사유', sakura: '벚꽃유' };
    var SN = { dish: '종지', cup: '찻잔', bowl: '사발', jar: '항아리' };
    var CLN = { cw1: '백토', cw2: '백토', cw3: '백토', cy1: '황토', cy2: '황토', cy3: '황토', cr1: '적토', cr2: '적토', cr3: '적토', ck1: '흑토', ck2: '흑토', ck3: '흑토', basic: '기본 점토', refined: '정제 점토', kaolin: '고령토', porcelain: '자기토', premium: '특선 소지', spring: '봄빛 흙' };
    // ── 기존 스테이지 데이터 (Contest.genStages와 동일 규칙 · 시즌 제외) ──
    var SHP = {}, WSM = {};
    function stages() {
      var P = {
        dish: { n: '종지', H: 60, p: [40, 45, 50, 55, 59, 63, 66, 69, 72, 74, 76, 78] }, sabal: { n: '사발', H: 85, p: [36, 44, 52, 59, 65, 70, 74, 78, 81, 84, 86, 88] },
        daejeop: { n: '대접', H: 70, p: [40, 50, 60, 68, 74, 78, 82, 85, 87, 89, 90, 91] }, plate: { n: '접시', H: 40, p: [50, 60, 68, 75, 80, 84, 87, 89, 91, 92, 93, 94] },
        jan: { n: '잔', H: 110, p: [34, 33, 32, 33, 35, 37, 39, 41, 43, 44, 45, 46] }, chatjan: { n: '찻잔', H: 125, p: [32, 34, 36, 38, 39, 40, 41, 42, 42, 43, 43, 44] },
        tongjan: { n: '통잔', H: 95, p: [38, 39, 40, 40, 41, 41, 42, 42, 42, 43, 43, 43] }, dawan: { n: '다완', H: 90, p: [34, 40, 47, 53, 58, 62, 65, 67, 68, 69, 69, 68] },
        hwabyeong: { n: '화병', H: 150, p: [28, 36, 44, 48, 48, 44, 36, 26, 18, 16, 18, 22] }, byeong: { n: '병', H: 140, p: [30, 40, 46, 48, 46, 40, 30, 20, 15, 14, 14, 16] },
        maebyeong: { n: '매병', H: 160, p: [30, 38, 46, 52, 55, 55, 52, 46, 38, 28, 20, 22] }, hangari: { n: '항아리', H: 140, p: [36, 50, 60, 66, 68, 68, 64, 58, 50, 44, 40, 40] },
        jangdok: { n: '장독', H: 170, p: [36, 50, 62, 70, 74, 74, 70, 62, 52, 42, 36, 36] }, danji: { n: '단지', H: 110, p: [34, 46, 56, 62, 64, 62, 58, 52, 46, 42, 40, 40] },
        moonjar: { n: '달항아리', H: 150, p: [34, 48, 60, 68, 72, 74, 73, 69, 60, 48, 36, 32] },
        lotuscup: { n: '연꽃잔', H: 60, p: [26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70] }
      };
      var GL = ['white', 'celadon', 'black', 'white', 'celadon', 'black', 'celadon', 'white', 'jinsa', 'black', 'white', 'celadon', 'jinsa', 'black', 'white'];
      var SZ = [{ k: 1, n: '' }]; // 크기 변형(큰/작은)은 물레에 없는 모양이라 쓰지 않는다
      var C = [
        { id: 'table', pre: 't', n: 15, pool: ['dish', 'sabal', 'daejeop'], un: 'plate', cl: ['cy1', 'cy2', 'cw2'], gl: ['white', 'celadon', 'celadon', 'white', 'celadon', 'white', 'celadon', 'white', 'white', 'celadon', 'white', 'celadon', 'white', 'celadon', 'white'] }, /* 1챕터 : 백자유·청자유만 */
        { id: 'tea', pre: 'c', n: 15, pool: ['chatjan', 'dish', 'plate'], un: 'dawan', un2: { 13: 'hwabyeong' }, cl: ['cy1', 'cy2', 'cw3'], gl: ['white', 'celadon', 'black', 'white', 'celadon', 'black', 'celadon', 'white', 'black', 'black', 'white', 'celadon', 'white', 'black', 'white'] }, /* 진사 없음 (적토·진사유는 3챕터 전시 뒤) */
        { id: 'vase', pre: 'v', n: 15, pool: ['hwabyeong', 'sabal', 'hwabyeong'], un: 'hangari', cl: ['cy2', 'cw2', 'cw3'], gl: ['white', 'celadon', 'black', 'white', 'celadon', 'black', 'celadon', 'white', 'celadon', 'black', 'white', 'celadon', 'white', 'black', 'white'] },
        { id: 'jar', pre: 'j', n: 15, pool: ['hangari', 'hangari', 'dish'], un: 'moonjar', cl: ['cy2', 'cr2', 'ck3'] },
        { id: 'season', pre: 's', n: 10, pool: ['chatjan', 'dish', 'sabal'], un: 'lotuscup', cl: ['cy2', 'cw2'] },
        { id: 'dok1', pre: 'da', n: 7, pool: ['daejeop', 'dish', 'sabal'], un: '', cl: ['ck1', 'cy1'], gl: ['black', 'white', 'black', 'celadon', 'white', 'black', 'celadon'] },
        { id: 'dok2', pre: 'db', n: 6, pool: ['sabal', 'daejeop', 'chatjan'], un: '', cl: ['ck1', 'cr1'], gl: ['black', 'black', 'white', 'black', 'celadon', 'black'] },
        { id: 'dok3', pre: 'dc', n: 7, pool: ['dish', 'chatjan', 'sabal'], un: '', cl: ['cw1', 'cy1'], gl: ['white', 'celadon', 'white', 'black', 'celadon', 'white', 'black'] }
      ];
      var WS = { lotuscup: 'dish', dish: 'dish', plate: 'dish', sabal: 'bowl', daejeop: 'bowl', dawan: 'bowl', jan: 'cup', chatjan: 'cup', tongjan: 'cup', hwabyeong: 'jar', byeong: 'jar', maebyeong: 'jar', hangari: 'jar', jangdok: 'jar', danji: 'jar', moonjar: 'jar' };
      SHP = P; WSM = WS;
      var out = {};
      C.forEach(function (c) {
        for (var i = 0; i < c.n; i++) {
          var un2 = (c.un2 || {})[i] || '', last = (i === c.n - 1 && !!c.un) || !!un2, key = un2 || (i === c.n - 1 && c.un ? c.un : c.pool[i % c.pool.length]), GLc = c.gl || GL;
          var b = P[key]; c.cl = c.cl.map(function (k) { return k.slice(0, 2) + '1'; }); var sz = last ? SZ[0] : SZ[Math.floor(i / c.pool.length) % SZ.length], gz = GLc[i % GLc.length];
          out[c.pre + (i + 1)] = { id: c.pre + (i + 1), ch: c.id, name: GP[gz] + ' ' + sz.n + b.n, shapeN: sz.n + b.n, prof: b.p.map(function (v) { return Math.round(v * sz.k * 10) / 10; }), H: Math.round(b.H * sz.k), glaze: gz, clay: last ? c.cl[c.cl.length - 1] : c.cl[Math.min(c.cl.length - 1, Math.floor(i / 5))], wshape: WS[key] || 'bowl', sk: key, newShape: last ? key : '' };
        }
      });
      return out;
    }
    var ST = stages();
    // ── 물레 모양 : 기본 4종 + 챕터 마지막 의뢰로 여는 모양 ──
    var BASE = ['dish', 'daejeop', 'sabal', 'chatjan'];
    var SKN = {}; for (var sk0 in SHP) { SKN[sk0] = SHP[sk0].n; }
    var CATDEF = { dish: 'dish', bowl: 'sabal', cup: 'chatjan', jar: 'hangari' };
    var REACH = BASE.concat(['plate', 'dawan', 'hwabyeong', 'hangari', 'moonjar', 'lotuscup']); // 물레에서 빚을 수 있게 되는 모양 전부
    function knownShapes(g) { var sf = (g && g.shapesFound) || {}, out = BASE.slice(); for (var k in SHP) { if (sf[k] && out.indexOf(k) < 0) { out.push(k); } } return out; }
    // 실제로 빚은 모양(윤곽·높이)과 가장 가까운 모양 · 같은 분류(종지/사발/찻잔/항아리) 안에서 고른다
    // prefer : 빚을 때 고른 모양(또는 의뢰 모양) · 다른 모양과 비슷하게 가깝다면 그쪽으로 본다
    function shapeKeyOf(p, prefer) {
      if (!p) { return ''; }
      var cat = p.shape || p.wshape || '', pf = prefer || p.sk || '';
      if (!p.prof || p.prof.length < 3) { return p.sk || CATDEF[cat] || ''; }
      var list = REACH.filter(function (k) { return SHP[k] && (!cat || WSM[k] === cat); }), best = '', bs = -1, pv = -1;
      list.forEach(function (k) { var sc = shapeScore(p, { prof: SHP[k].p, H: SHP[k].H }), v = sc.s + sc.h * 0.6; if (v > bs) { bs = v; best = k; } if (k === pf) { pv = v; } });
      if (pf && pv >= 0 && pv >= bs - 12) { return pf; }
      return best || p.sk || CATDEF[cat] || '';
    }
    function shapeN(p) { var k = shapeKeyOf(p); return SKN[k] || SN[(p || {}).shape] || '그릇'; }
    try { if (typeof window !== 'undefined') { window.__shN = shapeN; } } catch (e) {}
    // ── 시즌 의뢰 (기존 시즌 스테이지 s1~s10 이관 · 인물·대사는 기획 예시) ──
    var SEASON_UNTIL = new Date('2026-11-17T23:59:59+09:00').getTime();
    // 벚꽃 축제 여는 의뢰 : 도깨비 1챕터 · 에피소드 1의 1챕터를 끝낸 뒤 찾아온다 · 받으면 두두리가 벚꽃 채집터를 알려 준다
    ST.s0 = { id: 's0', ch: 'season', name: '벚꽃 찻잔', shapeN: '찻잔', sk: 'chatjan', prof: SHP.chatjan.p.slice(), H: SHP.chatjan.H, glaze: 'sakura', clay: 'cy1', wshape: 'cup', newShape: '' };
    var SSTORY = [
      { id: 'e00', npc: 'festa', ch: 'season', st: ['s0'], title: '벚꽃 빛 그릇', intro: ['안녕하세요! 봄 다회 준비위원 하람이에요.', '올해 다회 주제가 「벚꽃」이거든요. 찻잔도 벚꽃 빛이었으면 해서요.', '혹시… 벚꽃 색 그릇을 만들어 주실 수 있을까요?', '나: (벚꽃 색…? 그런 유약은 써 본 적이 없는데.)'], accLabel: '한번 알아볼게요', done: ['와… 정말 벚꽃 빛이에요!', '다회 준비, 이제 같이 해 주실 거죠? 공방에 축제 안내를 붙여 둘게요!'] },
      { id: 'e01', npc: 'festa', ch: 'season', st: ['s1', 's2', 's3'], title: '봄 다회 첫 상차림', intro: ['봄 다회 준비위원 하람이에요! 올해 다회 그릇을 공방에 맡기고 싶어서요.', '잔이랑 종지, 사발부터 하나씩 부탁드려요.'], done: ['와, 다회 분위기가 벌써 나요!', '축제 동안 다른 부탁도 드릴게요.'] },
      { id: 'e04', npc: 'festa', ch: 'season', st: ['s10'], unlockNote: '연꽃잔', title: '봄 다회의 연꽃잔', intro: ['마지막 부탁이에요. 다회의 상징, 연꽃잔!', '낮고 활짝 핀 꽃처럼 빚어 주세요.'], done: ['다회의 주인공이 생겼네요. 정말 고마워요!', '연꽃잔 모양은 이제 공방 틀에 남을 거예요.'] }
    ];
    var GRANK = { '범작': 0, '양작': 1, '수작': 2, '명작': 3, '요변': 3 };
    // ── 전시대 : 에피소드마다 · 챕터를 끝내면 자리가 열리고, 다음 챕터 조건을 미리 쓴 명작을 올리면 해금 (영구 고정) ──
    var UNLN = { black: '흑토·흑유', red: '적토·진사유', stamp: '붓 시유 도장', remodel: '공방 리모델링', gather: '채집', research: '연구', event: '이벤트' };
    var UNLI = { black: '⚫', red: '🔴', stamp: '🌸', remodel: '🏠', gather: '⛏', research: '📚', event: '🎉' };
    /* 공방 리모델링 (전시대 ④로 해금 · 상점에서 산다) */
    var DECO = {
      wall: [{ id: 'base', n: '흙벽', d: '따뜻한 황토 흙벽', p: 0, sw: 'linear-gradient(#E8D2AE,#D6B88B)' }, { id: 'tile', n: '청자 타일', d: '은은한 청록 타일 벽', p: 600, sw: 'repeating-linear-gradient(0deg,#9FC4B4 0 22px,#8DB5A4 22px 24px),#9FC4B4' }, { id: 'hanji', n: '한지 창살', d: '창살 무늬 한지 벽', p: 900, sw: 'repeating-linear-gradient(90deg,rgba(122,84,52,.35) 0 3px,transparent 3px 30px),repeating-linear-gradient(0deg,rgba(122,84,52,.35) 0 3px,transparent 3px 30px),#F4EAD6' }, { id: 'night', n: '먹빛 나무벽', d: '차분한 짙은 나무 벽', p: 1200, sw: 'repeating-linear-gradient(90deg,#4A3326 0 40px,#43301F 40px 80px)' }],
      kiln: [{ id: 'base', n: '붉은 벽돌 가마', d: '기본 가마', p: 0, sw: 'linear-gradient(#B35A3A,#7A3A24)', f: 'none' }, { id: 'white', n: '흰 회벽 가마', d: '회칠한 밝은 가마', p: 800, sw: 'linear-gradient(#EDE6DA,#BFB3A3)', f: 'saturate(.25) brightness(1.25)' }, { id: 'stone', n: '검은 돌가마', d: '단단한 현무암 가마', p: 1100, sw: 'linear-gradient(#5E5A57,#2E2B29)', f: 'grayscale(.75) brightness(.75) contrast(1.1)' }],
      tub: [{ id: 'base', n: '나무 유약통', d: '기본 유약통', p: 0, sw: 'linear-gradient(#E9DCC4,#B98A5E)', f: 'none' }, { id: 'blue', n: '청화 유약통', d: '푸른 그림 유약통', p: 500, sw: 'linear-gradient(#DCE6F2,#5878A8)', f: 'hue-rotate(185deg) saturate(1.4)' }, { id: 'onggi', n: '옹기 유약통', d: '검붉은 옹기', p: 700, sw: 'linear-gradient(#8A5A3A,#4A2E1E)', f: 'sepia(.7) brightness(.72) saturate(1.3)' }],
      shelf: [{ id: 'base', n: '참나무 선반', d: '기본 선반', p: 0, sw: '#8A5A36' }, { id: 'pine', n: '소나무 선반', d: '밝은 결의 선반', p: 300, sw: '#C89A62' }, { id: 'ebony', n: '흑단 선반', d: '짙고 고급스러운 선반', p: 900, sw: '#3E2A1E' }]
    };
    function unl(g, k) { return !!((g && g.unl) || {})[k]; }
    var DISP = [
      { ep: 'main', icon: '📖', title: '에피소드 1 · 강 할매네 공방', slots: [
        { id: 'm1', line: 'main', ch: 'table', need: { sk: 'sabal', clay: 'y', cov: [0.4, 0.7], grade: '명작' }, rw: 'black' },
        { id: 'm2', line: 'main', ch: 'tea', need: { sk: 'dawan', glaze: 'celadon', ang: [30, 60], grade: '명작' }, rw: 'stamp' },
        { id: 'm3', line: 'main', ch: 'vase', need: { sk: 'hwabyeong', glaze: 'white', g2: true, grade: '명작' }, rw: 'red' },
        { id: 'm4', line: 'main', ch: 'jar', need: { sk: 'moonjar', brush: true, grade: '명작' }, rw: 'remodel' }
      ] },
      { ep: 'dok', icon: '👹', title: '도깨비 이야기 1 · 김 서방, 오랜만이다!', slots: [
        { id: 'd1', line: 'dok', ch: 'dok1', need: { sk: 'daejeop', clay: 'k', glaze: 'black', fireMin: 95, grade: '명작' }, rw: 'gather' },
        { id: 'd2', line: 'dok', ch: 'dok2', need: { slab: 'sqp', grade: '명작' }, rw: 'research' },
        { id: 'd3', line: 'dok', ch: 'dok3', need: { slab: 'sqb', brush: true, grade: '명작' }, rw: 'event' }
      ] }
    ];
    function chDone(g, line, ch) { var L = lineState(g, line), last = -1; L.defs.forEach(function (d, i) { if (d.ch === ch) { last = i; } }); if (last < 0) { return false; } return L.i > last || (L.i === last && !!L.thanks); }
    function chTitle(line, ch) { var E = EPIS[line], c = E ? E.chapters.filter(function (x) { return x.ch === ch; })[0] : null; return c ? c.title : ch; }
    function dispChecks(p, need) {
      var out = [], P = p || {};
      if (need.slab) { out.push({ t: '판성형 ' + SLN[need.slab], ok: P.sk === 'slab' && P.slabTg === need.slab }); }
      if (need.clay) { out.push({ t: CCOLOR[need.clay].n, ok: !!p && clayOf(P.clay).c === need.clay }); }
      if (need.glaze) { out.push({ t: GNM[need.glaze], ok: !!p && glazeOk(P.glaze, need.glaze) }); }
      if (need.sk) { out.push({ t: SKN[need.sk] || need.sk, ok: !!p && P.sk !== 'slab' && shapeKeyOf(P, need.sk) === need.sk }); }
      glzChecks(P, need).forEach(function (x) { out.push({ t: x.t, ok: !!p && x.ok }); });
      if (need.brush) { out.push({ t: '붓 무늬', ok: !!((P.brush && P.brush.length) || P.bru) }); }
      if (need.fireMin) { out.push({ t: '소성 ' + need.fireMin + '점↑', ok: ((P.skillPts || {}).fire || 0) >= need.fireMin }); }
      if (need.grade) { out.push({ t: need.grade, ok: (GRANK[P.grade] || 0) >= (GRANK[need.grade] || 0) }); }
      return out;
    }
    /* ── 목표 (도감 「목표」 탭) : 최종 목표 · 지금 목표 · 설비 — 게임 상태에서 바로 계산 ── */
    function goals(g) {
      var out = { final: [], now: [], fac: [] }, DP = g.disp || {}, ps = g.pieces || {}, FAC = g.fac || {};
      var go = function (panel) { return { panel: panel }; };
      var slotSt = function (sl) { var pid = DP[sl.id]; if (pid && ps[pid]) { return 'filled'; } return chDone(g, sl.line, sl.ch) ? 'open' : 'locked'; };
      var E1 = DISP[0], E1f = E1.slots.filter(function (sl) { return slotSt(sl) === 'filled'; }).length;
      var nx1 = E1.slots.filter(function (sl) { return slotSt(sl) !== 'filled'; })[0];
      // 최종 목표 1 : 할머니 전시대 채우기 → 공방 리모델링
      out.final.push({ ic: '🏠', t: '할머니의 전시대 채우기', sub: unl(g, 'remodel') ? '공방 리모델링이 열렸어요 · 상점 「리모델링」에서 꾸며요' : '에피소드 1 전시대 4칸을 모두 채우면 「공방 리모델링」이 열려요', prog: E1f + '/4', pct: E1f / 4, done: E1f >= 4, go: unl(g, 'remodel') ? { href: 'Shop.dc.html' } : go(4),
        hint: nx1 && !unl(g, 'remodel') ? '다음 칸 : ' + chTitle(nx1.line, nx1.ch) + (slotSt(nx1) === 'open' ? ' · 지금 올릴 수 있어요' : ' · 챕터를 끝내면 열려요') : '' });
      // 최종 목표 2 : 달항아리 명작
      var mjShape = !!((g.shapesFound || {}).moonjar), mjAny = false, mjBest = false;
      for (var k in ps) { var P = ps[k]; if (P && shapeKeyOf(P, 'moonjar') === 'moonjar' && P.sk !== 'slab') { mjAny = true; if ((GRANK[P.grade] || 0) >= 3) { mjBest = true; } } }
      out.final.push({ ic: '🌕', t: '보름달 같은 달항아리 빚기', sub: mjBest ? '명작 달항아리를 빚었어요!' : (mjShape ? '달항아리 모양이 열렸어요 · 명작으로 빚어 보세요' : '4챕터 「장 씨네 장독대」를 끝내면 달항아리 모양이 열려요'), prog: mjBest ? '명작 ✓' : (mjAny ? '빚음 · 명작 전' : (mjShape ? '모양 열림' : '잠김')), pct: mjBest ? 1 : (mjAny ? 0.66 : (mjShape ? 0.33 : 0)), done: mjBest, go: go(1), hint: '' });
      // 지금 목표 1 : 메인 의뢰
      var M = mainState(g);
      if (!M.allDone) {
        var d = M.def, chQ = MAIN.filter(function (q) { return q.ch === d.ch; }), chI = chQ.indexOf(d), CT = chTitle('main', d.ch), need = questNeeds(g, d);
        var st = M.acc ? '진행 중 · 「' + d.title + '」 기물을 만들어 건네요' : (need.length ? '「' + d.title + '」을 맡으려면 ' + need.map(function (x) { return x.t; }).join(' · ') : '카운터에서 「' + d.title + '」 의뢰를 받아요');
        out.now.push({ ic: '📖', t: '메인 의뢰 · ' + CT, sub: st, prog: (chI + (M.thanks ? 1 : 0)) + '/' + chQ.length, pct: (chI + (M.thanks ? 1 : 0)) / chQ.length, done: false, warn: !M.acc && need.length > 0, go: need.length && !M.acc ? (need[0].k === 'slab' || need[0].k === 'paint' ? { href: 'Shop.dc.html' } : go(4)) : go(M.acc ? 1 : 0), hint: '' });
      } else { out.now.push({ ic: '📖', t: '메인 의뢰 · 에피소드 1', sub: '에피소드 1을 모두 마쳤어요', prog: '완료', pct: 1, done: true, go: go(0), hint: '' }); }
      // 지금 목표 2 : 전시대 (열린 칸 먼저)
      DISP.forEach(function (E) {
        var open = E.slots.filter(function (sl) { return slotSt(sl) === 'open'; }), fN = E.slots.filter(function (sl) { return slotSt(sl) === 'filled'; }).length;
        if (E.ep === 'dok' && !lineState(g, 'dok').open && !fN) { return; }
        var sl = open[0] || E.slots.filter(function (x) { return slotSt(x) === 'locked'; })[0];
        if (!sl) { out.now.push({ ic: E.icon, t: '전시대 · ' + E.title.split(' · ')[0], sub: '모든 칸을 채웠어요', prog: fN + '/' + E.slots.length, pct: 1, done: true, go: go(4), hint: '' }); return; }
        var isOpen = slotSt(sl) === 'open';
        out.now.push({ ic: E.icon, t: '전시대 · ' + E.title.split(' · ')[0], sub: isOpen ? '「' + chTitle(sl.line, sl.ch) + '」 칸이 열렸어요 · ' + dispTxt(sl.need) : '「' + chTitle(sl.line, sl.ch) + '」 챕터를 끝내면 다음 칸이 열려요', prog: fN + '/' + E.slots.length, pct: fN / E.slots.length, done: false, warn: isOpen, go: go(4), hint: '보상 · ' + (UNLI[sl.rw] || '') + ' ' + (UNLN[sl.rw] || '') + ' 해금' });
      });
      // 지금 목표 3 : 도깨비 의뢰
      var D = lineState(g, 'dok');
      if (D.open && D.def) { var dd = D.def, dQ = DOK.filter(function (q) { return q.ch === dd.ch; }), dI = dQ.indexOf(dd), nd = questNeeds(g, dd);
        out.now.push({ ic: '👹', t: '도깨비 의뢰 · ' + chTitle('dok', dd.ch), sub: D.acc ? '진행 중 · 「' + dd.title + '」' : (nd.length ? '「' + dd.title + '」을 맡으려면 ' + nd.map(function (x) { return x.t; }).join(' · ') : '카운터에 도깨비 손님이 와요 · 「' + dd.title + '」'), prog: dI + '/' + dQ.length, pct: dI / dQ.length, done: false, warn: !D.acc && nd.length > 0, go: go(D.acc ? 1 : 0), hint: '' }); }
      else if (!D.open) { out.now.push({ ic: '👹', t: '도깨비 이야기', sub: '전시대 ①에 명작을 올려 흑토·흑유를 해금하면 찾아와요', prog: '잠김', pct: 0, done: false, locked: true, go: go(4), hint: '' }); }
      // 설비
      [['slab', '판 성형대', '판으로 접시·통을 만들어요 · 도깨비 3챕터 · 도깨비 전시대 ②③에 필요'], ['paint', '붓 시유대', '붓·도장으로 무늬를 그려요 · 전시대 ④ · 도깨비 전시대 ③에 필요']].forEach(function (f) {
        out.fac.push({ ic: f[0] === 'slab' ? '🪵' : '🖌', t: f[1] + ' 설치', sub: FAC[f[0]] ? '설치했어요' : f[2], prog: FAC[f[0]] ? '설치됨' : '상점 · 설비', pct: FAC[f[0]] ? 1 : 0, done: !!FAC[f[0]], go: { href: 'Shop.dc.html' }, hint: '' });
      });
      return out;
    }
    /* 의뢰 기물 조건을 하나하나 풀어 쓴 목록 : 모양 · 유약 · 흙 · 시유 깊이 · 기울기 · 덧시유 · 소성 · 무늬 */
    function condList(it) {
      if (!it || it.mat) { return []; }
      var o = [], c = it.clay ? clayOf(it.clay).c : (it.clayReq || '');
      o.push({ k: 'shape', t: it.slabTg ? '판성형 ' + SLN[it.slabTg] : (SKN[it.sk] || it.shapeN || '') + ' 모양' });
      o.push({ k: 'glaze', t: it.glazeAny ? it.glazeAny.map(function (z) { return GNM[z]; }).join(' 또는 ') : (it.glaze ? GNM[it.glaze] : '유약 무관') });
      if (it.clayReq && CCOLOR[it.clayReq]) { o.push({ k: 'clay', t: CCOLOR[it.clayReq].n + ' 필수' }); } /* 흙은 필수일 때만 */
      if (it.ang) { o.push({ k: 'ang', t: it.ang[1] <= 15 ? '굽부터 똑바로 담금' : (it.ang[0] >= 165 ? '입구부터 거꾸로 담금' : '기울여 담금 ' + it.ang[0] + '~' + it.ang[1] + '°') }); }
      if (it.cov) { o.push({ k: 'cov', t: '시유 깊이 ' + Math.round(it.cov[0] * 100) + '~' + Math.round(it.cov[1] * 100) + '%' }); }
      if (it.g2) { o.push({ k: 'g2', t: '덧시유' + (it.g2 !== true ? ' ' + GNM[it.g2] : ' (아무 유약)') }); }
      if (it.ang2) { o.push({ k: 'ang2', t: '덧시유 기울기 ' + it.ang2[0] + '~' + it.ang2[1] + '°' }); }
      if (it.fireMin) { o.push({ k: 'fire', t: '소성 ' + it.fireMin + '점 이상' }); }
      if (it.brush) { o.push({ k: 'brush', t: '붓 무늬' }); }
      return o;
    }
    function baseName(it) { return String((it && it.name) || '').split(' · ')[0]; }
    function dispTxt(need) { return dispChecks(null, need).map(function (x) { return x.t; }).join(' · '); }
    /* 의뢰를 맡으려면 필요한 해금 · 설비 (없으면 받을 수 없다) */
    function questNeeds(g, q) {
      var miss = [], add = function (k, t) { if (!miss.some(function (m) { return m.k === k; })) { miss.push({ k: k, t: t }); } };
      ((q && q.items) || []).forEach(function (it) {
        if (it.mat) { return; }
        var gz = it.glazeAny || [it.glaze], c = it.clay ? clayOf(it.clay).c : '';
        if ((gz.indexOf('black') >= 0 || c === 'k') && !unl(g, 'black')) { add('black', '전시대에서 「흑토·흑유」 해금'); }
        if ((gz.indexOf('jinsa') >= 0 || c === 'r') && !unl(g, 'red')) { add('red', '전시대에서 「적토·진사유」 해금'); }
        if (it.slabTg && !((g.fac || {}).slab)) { add('slab', '상점 「설비」에서 판 성형대 설치'); }
        if (it.brush && !((g.fac || {}).paint)) { add('paint', '상점 「설비」에서 붓 시유대 설치'); }
      });
      return miss;
    }
    var MATN = { cy1: '황토', cw1: '백토', cr1: '적토', ck1: '흑토', gw1: '장석', gc1: '철분', gb1: '철광', gj1: '진사', ry: '황토 원료', rw: '백토 원료', rr: '적토 원료', rk: '흑토 원료', ow: '장석 원석', oc: '철분 원석', ob: '철광 원석', oj: '진사 원석' };
    // 의뢰 종류 : make(빚어서 납품) · grade(등급 이상) · choose(두 유약 중 골라서 · 반응이 달라짐) · visit(이야기만 · 재료 선물) · gather(재료 납품)
    function buildLine(story, kind, lvOf) {
      var chs = [], chIdx = {}; story.forEach(function (q) { if (!(q.ch in chIdx)) { chIdx[q.ch] = chs.length; chs.push(q.ch); } });
      return story.map(function (q, qi) {
        var items = (q.st || []).map(function (sid) { var s0 = ST[sid]; var it = { key: sid, name: s0.name, shapeN: s0.shapeN, sk: s0.sk, wshape: s0.wshape, glaze: s0.glaze, prof: s0.prof, H: s0.H, clay: s0.clay, n: (q.n && q.n[sid]) || 1, newShape: s0.newShape };
          if (q.choose && q.choose.key === sid) { it.glaze = ''; it.glazeAny = q.choose.any; it.name = q.choose.any.map(function (z) { return GP[z]; }).join(' 또는 ') + ' ' + s0.shapeN; }
          if (q.minGrade) { it.minGrade = q.minGrade; it.name += ' · ' + q.minGrade + ' 이상'; }
          var gz0 = (q.glz || {})[sid]; if (gz0) { ['ang', 'cov', 'g2', 'ang2'].forEach(function (k) { if (gz0[k] != null) { it[k] = gz0[k]; } }); it.glzTxt = glzTxt(gz0); it.name += ' · ' + it.glzTxt; } /* 시유 조건 (기울기·담금·덧시유) */
          return it; });
        Object.keys(q.mats || {}).forEach(function (k) { items.push({ key: 'mat_' + k, mat: k, name: (MATN[k] || k) + ' ×' + q.mats[k], n: q.mats[k], wshape: '', glaze: '' }); });
        var type = q.type || (q.choose ? 'choose' : (q.minGrade ? 'grade' : 'make'));
        var unlock = '', unlocks = []; items.forEach(function (it) { if (it.newShape) { unlock = it.newShape; if (unlocks.indexOf(it.newShape) < 0) { unlocks.push(it.newShape); } } });
        var cnt = items.reduce(function (a, it) { return a + (it.mat ? 0 : it.n); }, 0);
        var sameCh = story.filter(function (x) { return x.ch === q.ch; }), inCh = sameCh.indexOf(q);
        return { id: q.id, idx: qi, accLabel: q.accLabel, kind: kind, type: type, npc: q.npc, who: NPC[q.npc].name, role: NPC[q.npc].role, res: NPC[q.npc].res, tone: NPC[q.npc].tone, ch: q.ch, chNo: chIdx[q.ch] + 1, inCh: inCh + 1, chLen: sameCh.length, chEnd: inCh === sameCh.length - 1, needLv: lvOf(q), title: q.title, intro: q.intro, done: q.done, doneBy: q.doneBy || null, items: items, unlock: unlock, unlocks: unlocks, unlockNote: q.unlockNote || '', rw: q.rw || null, reward: q.rw ? { gold: q.rw.gold || 0, shards: q.rw.shards || 0, fame: TUNE.questFame, mats: q.rw.mats || null } : { gold: items.reduce(function (a, it) { return a + (it.mat ? 0 : it.n * Math.round(estVal(it) * (kind === 'main' ? TUNE.deliverMul : TUNE.deliverMulOther) / 10) * 10); }, 0), shards: 0, fame: TUNE.questFame } };
      });
    }
    var MAIN = buildLine(STORY, 'main', function (q) { return CHLV[q.ch] || 1; });
    MAIN.forEach(function (q) { if (q.reward) { q.reward.shards = mainShards(q.id); } }); /* 표시용 보상도 같은 값 */
    var SEASON = buildLine(SSTORY, 'season', function (q) { return q.id === 'e00' ? 1 : 2; });
    var DOK = buildLine(DSTORY, 'dok', function (q) { return CHLV[q.ch] || 1; });
    /* 도깨비 챕터마다 새 조건 하나 : 1 두두리 = 흙 지정 · 2 불목이 = 소성 점수 · 3 방울이·도롱이 = 판성형 */
    var SLN = { sqp: '네모 접시', rdp: '둥근 접시', ova: '타원 쟁반', lef: '나뭇잎 접시', sqb: '네모 통', rdv: '둥근 항아리' }, DSL = { dc1: 'sqp', dc2: 'rdp', dc6: 'sqb', dc7: 'rdv' };
    DOK.forEach(function (q) { (q.items || []).forEach(function (it) {
      if (it.mat) { return; }
      if (q.ch === 'dok1') { it.clayReq = clayOf(it.clay).c; it.name += ' · ' + CCOLOR[it.clayReq].n + '로'; }
      if (q.ch === 'dok2') { it.fireMin = 85; it.name += ' · 소성 85점↑'; }
      if (q.ch === 'dok3' && DSL[it.key]) { it.slabTg = DSL[it.key]; it.prof = null; it.H = null; it.wshape = ''; it.sk = ''; it.shapeN = SLN[it.slabTg]; it.name = GP[it.glaze] + ' ' + SLN[it.slabTg] + ' · 판성형'; }
    }); });
    SEASON.concat(DOK).forEach(function (q) { if (q.reward) { q.reward.shards = 0; } });
    function profileOf(it) {
      if (it && it.prof && it.prof.length >= 3) { return { r: it.prof, H: it.H || 110 }; }
      var T = { dish: [70, function (u) { return 40 + 50 * Math.sqrt(u); }], cup: [130, function (u) { return 34 + 14 * u; }], bowl: [95, function (u) { return 38 + 62 * Math.pow(u, 0.6); }], jar: [140, function (u) { return 34 + 34 * Math.sin(Math.PI * Math.min(1, u * 0.95)); }] };
      var tt = T[it && it.shape] || T.cup, r = []; for (var i = 0; i < 12; i++) { r.push(tt[1](i / 11)); }
      return { r: r, H: tt[0] };
    }
    function shapeScore(p, req) {
      if (!req.prof) { return { s: 100, h: 100 }; }
      var a = profileOf(p), n = req.prof.length, sum = 0, tot = 0;
      for (var i = 0; i < n; i++) { var u = i / (n - 1) * (a.r.length - 1), lo = Math.floor(u), hi = Math.min(a.r.length - 1, lo + 1), v = a.r[lo] + (a.r[hi] - a.r[lo]) * (u - lo); sum += Math.abs(v - req.prof[i]); tot += req.prof[i]; }
      return { s: Math.max(0, 100 - sum / tot * 100 * 2.2), h: Math.max(0, 100 - Math.abs(a.H - req.H) / req.H * 100 * 1.6) };
    }
    /* 시유 조건 : ang = 기울기(절댓값 0~180°) · cov = 담금 비율 · g2 = 덧시유(true 또는 유약) · ang2 = 덧시유 기울기 */
    function GPU(z) { return ({ white: '백자유', celadon: '청자유', black: '흑유', jinsa: '진사유', sakura: '벚꽃유' })[z] || ((GP[z] || '') + '유'); }
    function angAbs(p, k) { var a = p && p[k] != null ? +p[k] : (k === 'covAng' && p && p.covDir === 'foot' ? 0 : 180); a = ((a % 360) + 360) % 360; return a > 180 ? 360 - a : a; }
    function glzTxt(c) {
      var t = [];
      if (c.ang) { t.push(c.ang[1] <= 15 ? '굽부터 담금' : (c.ang[0] >= 165 ? '입구부터 담금' : '기울기 ' + c.ang[0] + '~' + c.ang[1] + '°')); }
      if (c.cov) { t.push('담금 ' + Math.round(c.cov[0] * 100) + '~' + Math.round(c.cov[1] * 100) + '%'); }
      if (c.g2) { t.push('덧시유' + (c.g2 !== true ? ' ' + GPU(c.g2) : '')); }
      if (c.ang2) { t.push('덧시유 ' + c.ang2[0] + '~' + c.ang2[1] + '°'); }
      return t.join(' · ');
    }
    function glzChecks(p, req) {
      var out = [];
      if (req.ang) { var a = angAbs(p, 'covAng'); out.push({ k: 'ang', t: req.ang[1] <= 15 ? '굽부터' : (req.ang[0] >= 165 ? '입구부터' : '기울기 ' + req.ang[0] + '~' + req.ang[1] + '°'), ok: a >= req.ang[0] && a <= req.ang[1] }); }
      if (req.cov) { var c = p && p.cov != null ? p.cov : 1; out.push({ k: 'cov', t: '담금 ' + Math.round(req.cov[0] * 100) + '~' + Math.round(req.cov[1] * 100) + '%', ok: c >= req.cov[0] - 0.02 && c <= req.cov[1] + 0.02 }); }
      if (req.g2) { out.push({ k: 'g2', t: '덧시유' + (req.g2 !== true ? ' ' + GPU(req.g2) : ''), ok: !!(p && p.g2) && (req.g2 === true || p.g2 === req.g2) }); }
      if (req.ang2) { var a2 = angAbs(p, 'ang2'); out.push({ k: 'ang2', t: '덧시유 ' + req.ang2[0] + '~' + req.ang2[1] + '°', ok: !!(p && p.g2) && a2 >= req.ang2[0] && a2 <= req.ang2[1] }); }
      return out;
    }
    function glazeOk(pg, rg) { return !rg || pg === rg || (rg === 'black' && pg === 'cheonmok'); }
    function fits(p, req) {
      if (!p || p.broken) { return false; }
      if (req.wshape && p.shape !== req.wshape) { return false; }
      if (req.mat) { return false; }
      if (req.glazeAny ? req.glazeAny.indexOf(p.glaze) < 0 : !glazeOk(p.glaze, req.glaze)) { return false; }
      if (req.minGrade && (GRANK[p.grade] || 0) < (GRANK[req.minGrade] || 0)) { return false; }
      if (glzChecks(p, req).some(function (x) { return !x.ok; })) { return false; }
      if (req.clayReq && clayOf(p.clay).c !== req.clayReq) { return false; }
      if (req.fireMin && !(((p.skillPts || {}).fire || 0) >= req.fireMin)) { return false; }
      if (req.slabTg) { return p.sk === 'slab' && p.slabTg === req.slabTg && (p.fit || 0) >= TUNE.fitMin; }
      if (req.sk && shapeKeyOf(p, req.sk) !== req.sk) { return false; }
      var sc = shapeScore(p, req);
      return sc.s >= TUNE.fitMin && sc.h >= TUNE.fitMin;
    }
    function reqLabel(it) { return it.name || ((it.glaze ? GP[it.glaze] + ' ' : '') + (SN[it.wshape] || '그릇')); }
    function sideQuests(g) {
      var q = g.quests || {}, out = [];
      if (q.min && !q.minDone) { out.push({ id: 'min', kind: 'side', tag: '사연', who: '민 씨', role: '찻집 주인', res: 'CHAR_MIN', title: '할머님 잔을 닮은 찻잔', items: [{ key: 'a', name: '청자 찻잔', wshape: 'cup', sk: 'chatjan', glaze: 'celadon', n: 1 }], reward: { text: '400G × 등급 · 명성 +20' }, at: q.minAt }); }
      if (q.guest && !q.guestDone) { out.push({ id: 'guest', kind: 'side', tag: '일간', who: '이름 없는 손님', role: '동네 주민', res: 'CHAR_GUEST', title: '둥근 밥공기', items: [{ key: 'a', name: '사발 (유약 무관)', wshape: 'bowl', sk: 'sabal', glaze: '', n: 1 }], reward: { text: '350G' }, at: q.guestAt }); }
      if (q.week && !q.weekDone) { out.push({ id: 'week', kind: 'side', tag: '주간', who: '카페 사장', role: '골목 카페', res: 'CHAR_CAFE', title: '카페 잔 세트', items: [{ key: 'a', name: '백자 찻잔', wshape: 'cup', sk: 'chatjan', glaze: 'white', n: 3 }], reward: { text: '3,600G · 파편 20' }, at: q.weekAt }); }
      (g.tasteOrders || []).forEach(function (o) { out.push({ id: o.id, kind: 'order', tag: '주문', who: o.name, role: '취향 손님', res: o.res, title: (o.want.glaze ? GP[o.want.glaze] + ' ' : '') + (SKN[o.want.sk] || SN[o.want.shape] || '그릇') + ' 주문', items: [{ key: 'a', name: (o.want.glaze ? GP[o.want.glaze] + ' ' : '') + (SKN[o.want.sk] || SN[o.want.shape] || '그릇') + (o.want.glaze ? '' : ' (유약 무관)'), wshape: o.want.shape, sk: o.want.sk || '', glaze: o.want.glaze || '', n: 1 }], reward: { text: '시세 ×2.5 · 명성 +5' }, at: o.at }); });
      return out;
    }
    function seasonOpen() { return Date.now() <= SEASON_UNTIL; }
    function lineState(g, line) {
      // 시즌(이벤트) 의뢰는 첫 메인 의뢰 납품을 마친 뒤부터 찾아온다 (이미 시작한 시즌 의뢰는 그대로)
      if (line === 'season') { var mq0 = g.mq || {}, dq0 = g.dq || {}, mainOk = (mq0.i || 0) >= MAIN.filter(function (q) { return q.ch === MAIN[0].ch; }).length && (dq0.i || 0) >= DOK.filter(function (q) { return q.ch === DOK[0].ch; }).length; /* 에피소드 1의 1챕터 · 도깨비 1챕터를 끝낸 뒤 */ var sm = g.sq || {}, si = sm.i || 0, sd = SEASON[si] || null; return { line: 'season', key: 'sq', defs: SEASON, open: seasonOpen() && ((mainOk && !!g.shopOpen && unl(g, 'event')) || !!sm.acc || (sm.i || 0) > 0), i: si, def: sd, acc: !!sm.acc && !!sd, dl: sm.dl || {}, mig: sm.mig || {}, allDone: si >= SEASON.length, lvOk: sd ? (g.fameLv || 1) >= sd.needLv : false, thanks: !!sm.thanks }; }
      if (line === 'dok') { var tg = ''; try { tg = localStorage.getItem('tutG') || ''; } catch (e) {} var dm = g.dq || {}, di = dm.i || 0, dd = DOK[di] || null; return { line: 'dok', key: 'dq', defs: DOK, open: !isTut(g) && (unl(g, 'black') || !!dm.acc || di > 0), i: di, def: dd, acc: !!dm.acc && !!dd, dl: dm.dl || {}, mig: dm.mig || {}, allDone: di >= DOK.length, lvOk: dd ? (g.fameLv || 1) >= dd.needLv : false, thanks: !!dm.thanks, pick: dm.pick || '' }; }
      var o = mainState(g); o.line = 'main'; o.key = 'mq'; o.defs = MAIN; o.open = true; return o;
    }
    // 단골별 진행 : 만났는지 · 끝낸 의뢰 수 · 챕터 완료
    function npcProg(g, npc) {
      if (npc === 'min') { var q = g.quests || {}; return { met: !!q.min || !!q.minDone, done: q.minDone || q.minThanks ? 1 : 0, total: 1, end: !!q.minThanks }; }
      var line = NPC[npc] && NPC[npc].dok ? 'dok' : (npc === 'festa' ? 'season' : 'main'), L = lineState(g, line), defs = L.defs, done = 0, total = 0, met = false;
      defs.forEach(function (d) { if (d.npc !== npc) { return; } total++; if (d.idx < L.i || (d.idx === L.i && L.thanks)) { done++; met = true; } else if (d.idx === L.i && (L.acc || L.lvOk)) { met = true; } });
      return { met: met, done: done, total: total, end: total > 0 && done >= total };
    }
    function pieceCap(g) { var m = mainState(g), C = TUNE.pieceCap; if (m.allDone) { return 3; } return (m.def && C[m.def.ch]) || 1; }
    function chapterOf(def) { var E = EPIS[def.kind]; return E ? E.chapters[def.chNo - 1] : null; }
    function mainState(g) {
      var m = g.mq || {}, i = m.i || 0, def = MAIN[i] || null;
      return { pick: m.pick || '', i: i, def: def, acc: !!m.acc && !!def, dl: m.dl || {}, mig: m.mig || {}, allDone: i >= MAIN.length, lvOk: def ? (g.fameLv || 1) >= def.needLv : false, thanks: !!m.thanks };
    }
    // 제작 안내를 켠 의뢰들 (여러 개 가능) · 예전 저장(track 하나)은 그대로 읽고, 아무것도 안 정했으면 첫 의뢰
    function tracked(g, act) {
      act = act || active(g); var ids = act.map(function (x) { return x.id; });
      return ids; /* 받은 의뢰(한 번에 1개)를 모두 제작 목표로 */
      if (g.track && ids.indexOf(g.track) >= 0) { return [g.track]; }
      return ids.length ? [ids[0]] : [];
    }
    function active(g) {
      var ms = mainState(g), out = [];
      if (ms.acc && !ms.thanks) { var d = ms.def; out.push({ id: 'main', mid: d.id, kind: 'main', tag: '메인', who: d.who, role: d.role, res: d.res, title: d.title, items: d.items, reward: d.reward, dl: ms.dl, unlock: d.unlock, unlockNote: d.unlockNote, chapter: d.ch, idx: d.idx }); }
      var ss = lineState(g, 'season'); if (ss.open && ss.acc && !ss.thanks) { var d = ss.def; out.push({ id: 'season', mid: d.id, kind: 'season', tag: '시즌', who: d.who, role: d.role, res: d.res, title: d.title, items: d.items, reward: d.reward, dl: ss.dl, unlock: d.unlock, unlockNote: d.unlockNote, chapter: d.ch, idx: d.idx }); }
      var dk = lineState(g, 'dok'); if (dk.open && dk.acc && !dk.thanks && dk.def.type !== 'visit') { var d2 = dk.def; out.push({ id: 'dok', mid: d2.id, kind: 'dok', tag: '도깨비', who: d2.who, role: d2.role, res: d2.res, title: d2.title, items: d2.items, reward: d2.reward, dl: dk.dl, unlock: d2.unlock, unlockNote: d2.unlockNote, chapter: d2.ch, idx: d2.idx }); }
      (g.nq || []).forEach(function (o) { var po = payout({ items: o.items }, { mig: {} }); out.push({ id: o.id, kind: 'normal', tag: '일반', who: o.who, role: '동네 손님', res: o.res, title: o.title, items: o.items, reward: { gold: po.gold, shards: po.shards, fame: po.fame, text: po.gold.toLocaleString() + 'G · 파편 ' + po.shards + ' · 명성 +' + po.fame + ' · 기한 안에 납품하면 2배' }, dl: o.dl || {}, at: o.at, due: o.due }); });
      return out.concat(sideQuests(g));
    }
    var WIPK = ['formedList', 'dryList', 'bisqueList', 'glazeList', 'kilnList'];
    // 대기 위치 → 지금까지 마친 단계 (f 성형 · d 건조 · g 유약)
    var STG = { formedList: 'f', dryList: 'f', bisqueList: 'd', bisque: 'd', glazeList: 'd', kilnList: 'g', kiln: 'g', firing: 'g' };
    // 만드는 중인 작품이 의뢰 조건을 아직 지키고 있는지 (모양 · 유약)
    function wipOk(w, it) {
      if (!w || w.broken) { return false; }
      if (it.slabTg && (w.sk !== 'slab' || w.slabTg !== it.slabTg)) { return false; }
      if (it.clayReq && w.clay && clayOf(w.clay).c !== it.clayReq) { return false; }
      if (it.wshape && w.shape && w.shape !== it.wshape) { return false; }
      if (it.sk && w.prof && shapeKeyOf(w, it.sk) !== it.sk) { return false; }
      if (it.prof && w.prof) { var sc = shapeScore(w, it); if (sc.s < TUNE.fitMin || sc.h < TUNE.fitMin) { return false; } }
      if (w.glaze && (it.glazeAny ? it.glazeAny.indexOf(w.glaze) < 0 : !glazeOk(w.glaze, it.glaze))) { return false; }
      return true;
    }
    function wipItems(g) {
      var out = [];
      WIPK.forEach(function (k) { (g[k] || []).forEach(function (it) { out.push({ it: it, at: k }); }); });
      ((g.bisque || {}).items || []).forEach(function (it) { out.push({ it: it, at: 'bisque' }); });
      ((g.pk2 || {}).k || []).forEach(function (x) { if (x && x.it) { out.push({ it: x.it, at: 'firing' }); } }); /* 공방 가마에서 굽는 중 */
      var kf = g.kilnFilled || {}; for (var c in kf) { if (kf[c] && typeof kf[c] === 'object') { out.push({ it: kf[c], at: 'kiln' }); } }
      if (g.kiln === 'firing') { (g.batchItems || []).forEach(function (it) { if (!it.broken) { out.push({ it: it, at: 'firing' }); } }); }
      return out;
    }
    // 진행 중 의뢰 전체를 한 번에 배정 · 작품 하나는 한 요구 수량에만 집계된다
    function alloc(g, list) {
      list = list || active(g);
      var used = {}, wused = {}, ps = g.pieces || {}, order = (g.order || []).slice(), wips = wipItems(g), res = {};
      wips.forEach(function (w, wi) { w.uid = wi; });
      for (var k in ps) { if (order.indexOf(k) < 0) { order.push(k); } }
      list.forEach(function (q) {
        var rq = res[q.id] = { items: [], ready: 0, need: 0, done: true, deliverable: 0 };
        q.items.forEach(function (it) {
          var dl = (q.dl && q.dl[it.key]) || 0, left = Math.max(0, it.n - dl), got = [];
          if (it.mat) { var have = ((g.mats || {})[it.mat] || 0), okM = have >= left; var rowM = { key: it.key, it: it, n: it.n, dl: dl, ready: [], readyN: okM ? left : Math.min(left, have), wip: 0, wipAt: {}, tag: '', done: dl >= it.n, ok: dl >= it.n || okM, mat: true }; rq.items.push(rowM); rq.need += it.n; rq.ready += dl + rowM.readyN; if (okM && left > 0) { rq.deliverable += 1; } if (!rowM.done) { rq.done = false; } return; }
          order.forEach(function (id) {
            var p = ps[id]; if (got.length >= left || used[id] || !p || (p.where !== 'store' && p.where !== 'shelf')) { return; }
            if (fits(p, it)) { got.push(id); used[id] = true; }
          });
          var tag = q.mid ? 'q:' + q.mid + ':' + it.key : 'q:' + q.id + ':' + it.key;
          var wip = 0, wipAt = {}, stg = { f: 0, d: 0, g: 0 };
          wips.forEach(function (w) { if (w.it && !wused[w.uid] && (w.it.goalSid === tag || (!q.mid && !w.it.goalSid && w.it.shape === it.wshape)) && wipOk(w.it, it)) { wused[w.uid] = 1; wip++; wipAt[w.at] = (wipAt[w.at] || 0) + 1; stg[STG[w.at] || 'f']++; } });
          var room = Math.max(0, left - got.length), sg = Math.min(stg.g, room), sd = Math.min(stg.d, room - sg), sf0 = Math.min(stg.f, room - sg - sd);
          var fired = dl + got.length, glazed = fired + sg, dried = glazed + sd, formed = dried + sf0;
          var row = { key: it.key, it: it, n: it.n, dl: dl, ready: got, readyN: got.length, wip: Math.max(0, Math.min(wip, left - got.length)), wipAt: wipAt, tag: tag, done: dl >= it.n, ok: dl + got.length >= it.n, steps: { formed: Math.min(it.n, formed), dried: Math.min(it.n, dried), glazed: Math.min(it.n, glazed), fired: Math.min(it.n, fired) } };
          rq.items.push(row); rq.need += it.n; rq.ready += dl + got.length; rq.deliverable += got.length; if (!row.done) { rq.done = false; }
        });
      });
      return res;
    }
    function stepCond(it, page) {
      var c = [];
      if (page === 'Wheel') { c.push('모양 · ' + (it.shapeN || SN[it.wshape] || '')); if (it.H) { c.push('높이 ' + it.H + 'mm 안팎'); } c.push('점선에 ' + TUNE.fitMin + '% 이상'); }
      else if (page === 'Glaze') { c.push(it.glaze ? '유약 · ' + GNM[it.glaze] : '유약 무관'); }
      else if (page === 'Kiln' || page === 'KilnOpen') { c.push(it.glaze ? '적정 온도 칸에 넣기' : '아무 칸이나 괜찮음'); }
      else if (page === 'Dry') { c.push('완전 건조 후 빼기'); }
      else if (page === 'Bisque') { c.push('초벌 후 유약대로'); }
      else { c.push(it.glaze ? GNM[it.glaze] : '유약 무관'); }
      return c;
    }
    // 기존 저장 데이터 이관: 스테이지 별 기록(★1 이상) → 메인 의뢰 납품 처리 (이미 받은 보상은 다시 주지 않음)
    function migrate(g) {
      if (g.mq) { return null; }
      var stars = ((g.contest || {}).stars) || {}, i = 0, dl = {}, mig = {};
      while (i < MAIN.length && MAIN[i].items.every(function (it) { return stars[it.key] > 0; })) { i++; }
      var cur = MAIN[i];
      if (cur) { cur.items.forEach(function (it) { if (stars[it.key] > 0) { dl[it.key] = it.n; mig[it.key] = true; } }); }
      var sf = {}; for (var k in (g.shapesFound || {})) { sf[k] = g.shapesFound[k]; }
      for (var j = 0; j < i; j++) { (MAIN[j].unlocks || []).forEach(function (u) { sf[u] = true; }); }
      var patch = { mq: { i: i, acc: Object.keys(dl).length > 0, dl: dl, mig: mig, log: [] }, shapesFound: sf };
      if (g.goal && g.goal.sid && !/^s\d/.test(g.goal.sid)) { patch.goal = null; patch.goalQ = []; }
      return patch;
    }
    // 시즌 스테이지 별 기록 → 시즌 의뢰 납품 처리
    function migrateSeason(g) {
      if (g.sq) { return null; }
      var stars = ((g.contest || {}).stars) || {}, i = 0, dl = {}, mig = {};
      while (i < SEASON.length && SEASON[i].items.every(function (it) { return stars[it.key] > 0; })) { i++; }
      var cur = SEASON[i];
      if (cur) { cur.items.forEach(function (it) { if (stars[it.key] > 0) { dl[it.key] = it.n; mig[it.key] = true; } }); }
      var sf = {}, ch = false; for (var k in (g.shapesFound || {})) { sf[k] = g.shapesFound[k]; }
      for (var j = 0; j < i; j++) { if (SEASON[j].unlock && !sf[SEASON[j].unlock]) { sf[SEASON[j].unlock] = true; ch = true; } }
      var p = { sq: { i: i, acc: Object.keys(dl).length > 0, dl: dl, mig: mig, log: [] } }; if (ch) { p.shapesFound = sf; }
      return p;
    }
    /* 파편 = 메인 의뢰에서만. 메인 의뢰 전부의 파편 합 = 모든 연구 파편 합의 50% (뒤 의뢰일수록 조금씩 많이) */
    var MSH = null;
    function mainShards(id) {
      if (!MSH) {
        MSH = {}; var tot = 0; for (var rk in RNODE) { if (!RNODE[rk].upg) { tot += RNODE[rk].shards || 0; } }
        var T = Math.round(tot * TUNE.mainShardShare), n = MAIN.length, w = MAIN.map(function (q, i) { return 1 + i * 0.12; }), ws = w.reduce(function (a, b) { return a + b; }, 0), acc = 0;
        MAIN.forEach(function (q, i) { var v = i === n - 1 ? T - acc : Math.round(T * w[i] / ws); MSH[q.id] = v; acc += v; });
      }
      return MSH[id] || 0;
    }
    /* 아직 만들기 전 · 조건대로 만든 양작(발색 60%)의 예상 가치 */
    function estVal(it) {
      var mv = matValue({ clay: (it && it.clay) || 'cy1', glaze: (it && (it.glaze || (it.glazeAny && it.glazeAny[0]))) || 'white', g2: it && it.g2 && it.g2 !== true ? it.g2 : '' });
      var cv = TUNE.colorValue, cm = cv[0] + (cv[1] - cv[0]) * 0.6;
      return Math.round(mv.total * TUNE.valueK * cm / 10) * 10;
    }
    function payout(def, ms, grades, g, vals) {
      var cnt = 0, bonus = 0, G = g; if (!G) { try { G = JSON.parse(localStorage.getItem('pottery-proto-v1') || '{}') || {}; } catch (e) { G = {}; } }
      var F = fx(G), gm = 1 + (F.questGold || 0);
      var shM = def.kind === 'main' ? mainShards(def.id) : 0;
      if (def.rw) { return { gold: Math.round((def.rw.gold || 0) * gm), base: def.rw.gold || 0, bonus: 0, shards: shM, fame: Math.round(TUNE.questFame * (1 + (F.fame || 0))), mats: def.rw.mats || null }; }
      def.items.forEach(function (it) { if (!it.mat && !(ms.mig || {})[it.key]) { cnt += it.n; } });
      /* 납품가 = 납품한 작품 가치 × 2.5 · 아직 안 만들었으면 예상 가치로 */
      var D = TUNE.deliverMul || 2.5, base = 0, est = !(vals && vals.length);
      if (def.kind !== 'main') { D = TUNE.deliverMulOther || 1; } /* 메인 외 의뢰 = 작품 가치 그대로 (× 1) */
      if (!est) { vals.forEach(function (v) { base += Math.round((v || 0) * D / 10) * 10; }); }
      else { var gi = 0; def.items.forEach(function (it) { if (it.mat || (ms.mig || {})[it.key]) { return; } for (var q = 0; q < it.n; q++) { var gm2 = grades && grades[gi] ? (TUNE.gradeMul[grades[gi]] || 1) : 1; gi++; base += Math.round(estVal(it) * gm2 * D / 10) * 10; } }); }
      return { gold: Math.round((base + bonus) * gm), base: base, bonus: bonus, est: est, shards: shM, fame: Math.round(TUNE.questFame * (1 + (F.fame || 0))) };
    }
    // 소성 결과 보기를 시작했다가 다른 화면으로 가면, 남은 작품을 그대로 대기함에 넣는다
    /* 소성이 끝날 때 한 번 : 풀무로 불을 잘 다스린 만큼 발색 +0~10% · 요변 찬스 성공 수만큼 요변 굴림 → 등급·값 다시 계산 */
    function fireFinish(g) {
      if (!g || g.kilnFx || !(g.batchItems || []).length) { return null; }
      var KD = g.kilnDur || 1, T = g.kilnTend || {}, pts = ((T.gA || 0) + 0.4 * (T.lA || 0)) / KD, bonus = Math.round(Math.min(1, pts * 1.08) * 10), yo = Math.min(3, g.kilnYo || 0);
      var cv = TUNE.colorValue, G2 = TUNE.gradeCut2;
      var items = g.batchItems.map(function (x) {
        if (x.broken) { return x; }
        var y = {}, k; for (k in x) { y[k] = x[k]; }
        var pct = Math.min(100, (x.colorPct || 0) + bonus), cp = {}; for (k in (x.colorParts || {})) { cp[k] = x.colorParts[k]; } cp.fire = bonus;
        var newYo = !x.yohen && yo > 0 && pct >= 70 && Math.random() < 0.2 * yo;
        if (newYo) { pct = 100; y.yohen = true; if (y.glaze === 'black') { y.glaze = 'cheonmok'; y.name = y.name.replace(/^흑유/, '천목'); } y.name = '요변 ' + y.name; }
        var gr = (x.skill || 0) + pct >= G2['명작'] ? '명작' : ((x.skill || 0) + pct >= G2['수작'] ? '수작' : '양작');
        var m0 = TUNE.gradeMul[x.grade] || 1, m1 = TUNE.gradeMul[gr] || 1, vb = Math.max(10, Math.round((x.valueBase || 10) * m1 / m0 * (newYo ? TUNE.yohen.valueMul : 1) / 10) * 10), cm = cv[0] + (cv[1] - cv[0]) * pct / 100;
        y.colorPct = pct; y.colorParts = cp; y.grade = gr; y.valueBase = vb; y.value = Math.round(vb * cm / 10) * 10; y.colorMul = Math.round(cm * 100) / 100; y.color = Math.max(1, Math.ceil(pct / 20));
        y.tint = tintOf(newYo && x.glaze === 'black' ? 'cheonmok' : y.glaze, pct);
        y.colorWhy = (x.colorWhy || '') + (bonus ? ' · 불 다스림 +' + bonus + '%' : '') + (newYo ? ' · 요변 찬스!' : '');
        return y;
      });
      return { batchItems: items, kilnFx: true, kilnBonus: bonus };
    }
    function settleKiln(g) {
      if (!g || g.kiln !== 'firing' || !g.kilnSeen) { return null; }
      if (g.kilnStart && Date.now() < g.kilnStart + (g.kilnDur || 28800000)) { return null; }
      var ff = fireFinish(g), items = (ff ? ff.batchItems : g.batchItems) || []; if (!items.length) { return null; }
      var pieces = {}, k; for (k in (g.pieces || {})) { pieces[k] = g.pieces[k]; }
      var order = (g.order || []).slice(), log = [], shards = g.shards || 0, broken = g.broken || 0, now = Date.now();
      var sf = {}, gf = {}; for (k in (g.shapesFound || {})) { sf[k] = g.shapesFound[k]; } for (k in (g.glazesFound || {})) { gf[k] = g.glazesFound[k]; }
      items.forEach(function (x, i) {
        if (x.broken) { shards += 3; broken += 1; log.push({ name: x.name, action: '파편 +3' }); return; }
        var id = 'k' + (g.firings || 38) + '_' + i + '_' + now;
        pieces[id] = { name: x.name, grade: x.grade, shape: x.shape, glaze: x.glaze, cov: x.cov, where: 'store', fresh: true, pattern: x.pattern || '', spot: x.spot || '', covDir: x.covDir || '', covAng: x.covAng, g2: x.g2 || '', g2col: x.g2col || '', brush: x.brush || null, cov2: x.cov2, ang2: x.ang2, value: x.value, prof: x.prof, H: x.H, clay: x.clay, form: x.form, fit: x.fit, skill: x.skill, colorPct: x.colorPct, color: x.color, tint: x.tint, yohen: !!x.yohen, goalSid: x.goalSid || '', sk: item.sk || '' };
        order.push(id); sf[x.shape] = true; gf[x.glaze] = true;
        log.push({ name: x.name, action: x.grade + ' · 대기함' });
      });
      return { pieces: pieces, order: order, openLog: log, openIdx: items.length, kiln: 'empty', kilnFilled: {}, kilnStart: 0, batchItems: [], shards: shards, broken: broken, shapesFound: sf, glazesFound: gf, kilnSeen: 0 };
    }
    /* 의뢰 수 : offers = 카운터에서 지금 받을 수 있는 의뢰 · accepted = 받아 둔(진행 중) 의뢰 · 메인·도깨비·시즌 + 튜토리얼 민 씨 */
    function reqCounts(g) {
      var q = g.quests || {}, offers = 0, accepted = 0, tutOk = typeof g.tut !== 'number' || g.tut >= 8;
      if (!q.min) { offers++; } else if (!q.minDone) { accepted++; }
      ['main', 'dok', 'season'].forEach(function (LN) {
        var M = lineState(g, LN); if (!M.open || !M.def || M.allDone) { return; }
        if (M.acc && !M.thanks) { accepted++; } else if (!M.acc && !M.thanks && tutOk && M.lvOk) { offers++; }
      });
      return { offers: offers, accepted: accepted };
    }
    this._ql = { goals: goals, condList: condList, baseName: baseName, DECO: DECO, UNLN: UNLN, UNLI: UNLI, unl: unl, DISP: DISP, chDone: chDone, chTitle: chTitle, dispChecks: dispChecks, dispTxt: dispTxt, questNeeds: questNeeds, SLN: SLN, pieceCap: pieceCap, BOARD: 6, reqCounts: reqCounts, fireFinish: fireFinish, glzChecks: glzChecks, glzTxt: glzTxt, angAbs: angAbs, clayOf: clayOf, CGRADE: CGRADE, CCOLOR: CCOLOR, CLAYKEYS: CLAYKEYS, GGRADE: GGRADE, glazeMatKey: glazeMatKey, clayLv: clayLv, glazePts: glazePts, glazeMatName: glazeMatName, isTut: isTut, GMAT: GMAT, GMATN: GMATN, qualBonus: qualBonus, addMat: addMat, takeClay: takeClay, topQ: topQ, settleKiln: settleKiln, migrate: migrate, migrateSeason: migrateSeason, SEASON: SEASON, DOK: DOK, npcProg: npcProg, chapterOf: chapterOf, lineState2: null, EPIS: EPIS, PROF: PROF, MATN: MATN, GRANK: GRANK, SEASON_UNTIL: SEASON_UNTIL, seasonOpen: seasonOpen, lineState: lineState, payout: payout, estVal: estVal, mainShards: mainShards, matValue: matValue, MATPRICE: MATPRICE, TUNE: TUNE, NPC: NPC, MAIN: MAIN, ST: ST, GP: GP, GNM: GNM, SN: SN, CLN: CLN, fits: fits, shapeScore: shapeScore, profileOf: profileOf, sideQuests: sideQuests, mainState: mainState, active: active, tracked: tracked, alloc: alloc, reqLabel: reqLabel, stepCond: stepCond, glazeOk: glazeOk, GLZ: GLZ, FXM: FXM, RCAT: RCAT, RROW: RROW, RNODE: RNODE, UPG: UPG, RCOND: RCOND, fx: fx, fxVal: fxVal, fxFmt: fxFmt, resState: resState, kMatch: kMatch, kTemps: kTemps, skillOf: skillOf, colorRoll: colorRoll, tintOf: tintOf, colorPctOf: colorPctOf, BASE: BASE, SHP: SHP, WSM: WSM, SKN: SKN, knownShapes: knownShapes, shapeKeyOf: shapeKeyOf, shapeN: shapeN, wipOk: wipOk };
    return this._ql;
  };
  // </qlib>
  // <boots> 공용 부트 · scratchpad/src/boots.js 에서 주입
  S.navBoot = function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__navBooted) { return; }
    window.__navBooted = true;
    var KEY = 'pottery-proto-v1', self = this;
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    var CRAFT = { Wheel: 1, Dry: 1, Glaze: 1, Kiln: 1, KilnOpen: 1 };
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function notify() { try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch (e) {} }
    function patch(p) { var g = load(); for (var k in p) { g[k] = p[k]; } try { localStorage.setItem(KEY, JSON.stringify(g)); } catch (e) {} notify(); }
    var L = this.qlib(), g0 = load(); window.__QL = L; // 검수·디버그용
    // 스크립트로 만든 링크·버튼의 화면 이동: 캔버스(iframe)에서는 문서 자체를 이동시키지 않고
    // 같은 주소를 가진 화면 마크업 링크(<a href>)를 대신 눌러 캔버스가 처리하게 한다
    window.__potGo = function (href) {
      var want = String(href || '').split('/').pop();
      var cand = [].slice.call(document.querySelectorAll('a[href]')).filter(function (x) { return !x.hasAttribute('data-sb') && (x.getAttribute('href') || '').split('/').pop() === want; })[0];
      if (cand) { cand.click(); return; }
      var framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
      if (!framed) { location.href = href; }
    };
    if (!window.__potGoBound) {
      window.__potGoBound = true;
      document.addEventListener('click', function (e) {
        var x = e.target && e.target.closest ? e.target.closest('a[data-sb]') : null; if (!x) { return; }
        e.preventDefault(); window.__potGo(x.getAttribute('href'));
      }, true);
    }
    // 1) 저장 데이터 이관 (스테이지 → 메인 의뢰)
    if (g0.pieces && !g0.mq) { var mg = L.migrate(g0); if (mg) { patch(mg); } }
    if (g0.pieces && !load().sq) { var msq = L.migrateSeason(load()); if (msq) { patch(msq); } } // 시즌 스테이지 → 시즌 의뢰
    // 1-1) 채집 개편 2 : 흙 품질(★)·고운 원료 없앰 → 유약마다 원료 1개 소모. 장석·철분·철광 최소 5개씩 지급 (한 번만)
    if (!load().gv2) {
      var gg = load(), mm2 = {}; for (var mk in (gg.mats || {})) { mm2[mk] = gg.mats[mk]; }
      ['gz_white', 'gz_celadon', 'gz_black'].forEach(function (k) { mm2[k] = Math.max(mm2[k] || 0, 5); });
      patch({ gv2: 1, mats: mm2, matsQ: {} });
    }
    // 1-1b) 흙·유약 개편 3 : 흙 = 색 × 등급, 유약 원료 = 종류 × 등급, 무한 제공 없앰 (한 번만)
    if (!load().gv3) {
      var g3 = load(), M3 = {}, LG = { refined: 'cy1', kaolin: 'cw1', porcelain: 'cw1', premium: 'cw1', gz_white: 'gw1', gz_celadon: 'gc1', gz_black: 'gb1', jinsa: 'gj1' };
      for (var k3 in (g3.mats || {})) { var nk = LG[k3] || k3; if (k3 === 'basic') { continue; } M3[nk] = (M3[nk] || 0) + (g3.mats[k3] || 0); }
      var p3 = { gv3: 1, mats: M3 }; if (g3.pieces && !L.isTut(g3)) { M3.cy1 = (M3.cy1 || 0) + 10; } // 기본 흙(무한)을 쓰던 저장 데이터 : 보통 황토 10개
      patch(p3);
    }
    // 1-1c) 튜토리얼이 끝나면 시작 꾸러미 (황토 2 · 장석·철분·철광 5) — 한 번만 · 흙을 금방 다 써서 채집(흑유 재료)이 일찍 열리게
    if (!load().starter3 && !L.isTut(load()) && typeof load().tut === 'number') {
      var g4 = load(), M4 = {}; for (var k4 in (g4.mats || {})) { M4[k4] = g4.mats[k4]; }
      M4.cy1 = (M4.cy1 || 0) + 2; ['gw1', 'gc1', 'gb1'].forEach(function (k) { M4[k] = (M4[k] || 0) + 5; });
      patch({ starter3: 1, mats: M4 });
    }
    // 1-2) 연구 구조 이관: 옛 연구(파편 지불분) 환급 · 기존 9칸 건조대 유지
    if (g0.pieces && g0.resV !== 2) {
      var g1 = load(), OLD = { tech: [40, 50, 80, 110, 160], glaze: [40, 60, 120, 150, 220], shop: [30, 50, 90, 140, 200] }, refund = 0, old = g1.research || {};
      for (var ok in old) { var mm = /^(tech|glaze|shop)(\d)$/.exec(ok); if (old[ok] && mm) { refund += (OLD[mm[1]] || [])[+mm[2]] || 0; } }
      var res = {}; for (var rk in (g1.res || {})) { res[rk] = g1.res[rk]; }
      var legacy = (g1.firings || 0) > 0 || Object.keys(g1.pieces || {}).length > 6;
      if (legacy) { res.u_dry1 = true; res.u_dry2 = true; }
      patch({ resV: 2, res: res, shards: (g1.shards || 0) + refund, resRefund: refund, firedTotal: g1.firedTotal || 0 });
    }
    // 1-3) 설비 확장을 상점(골드)으로 옮김 · 옛 연구 건조대 증설·공방 확장은 그대로 인정, 기존 공방은 가마 9칸 유지
    if (g0.pieces && g0.resV !== 3) {
      var g3 = load(), r3 = {}; for (var rk3 in (g3.res || {})) { r3[rk3] = g3.res[rk3]; }
      if (r3.d31) { r3.u_dry1 = true; r3.u_dry2 = true; } else if (r3.d11 && (g3.resV === 2)) { r3.u_dry1 = true; }
      if (r3.s31) { r3.u_exp = true; }
      if ((g3.firings || 0) > 0) { r3.u_kiln = true; }
      patch({ resV: 3, res: r3 });
    }
    // 2) 마지막 제작 공정 기억 + 하단 「제작」 버튼을 마지막 공정으로
    if (CRAFT[PAGE]) { try { localStorage.setItem('lastCraft', PAGE === 'KilnOpen' ? 'Kiln' : PAGE); } catch (e) {} }
    function craftHref() {
      var lc = 'Wheel'; try { lc = localStorage.getItem('lastCraft') || 'Wheel'; } catch (e) {}
      var g = load(); if (lc === 'Kiln' && g.kiln === 'firing' && Date.now() >= (g.kilnStart || 0) + (g.kilnDur || 14400000)) { lc = 'KilnOpen'; }
      return lc + '.dc.html';
    }
    function fixNav() {
      [].slice.call(document.querySelectorAll('nav[aria-label="주 메뉴"] a')).forEach(function (a) {
        var h = a.getAttribute('href') || '';
        if (/^(Wheel|Dry|Bisque|Glaze|Kiln|KilnOpen)\.dc\.html$/.test(h) && a.getAttribute('data-craft') !== '0') { var want = craftHref(); if (h !== want) { a.setAttribute('href', want); } a.setAttribute('aria-label', '제작 · 마지막 공정으로'); }
      });
    }
    fixNav(); setInterval(fixNav, 800);
    document.addEventListener('pointerdown', function (e) { var a = e.target && e.target.closest && e.target.closest('nav[aria-label="주 메뉴"] a'); if (a) { fixNav(); } }, true);
    // 3) 첫 건조대 업그레이드 해금 알림 (튜토리얼 이후 6점 소성)
    function upCheck() {
      var g = load(); if (typeof g.tut !== 'number' || g.tut < 9 || !g.pieces) { return; }
      var fired = g.firedTotal || 0;
      if (g.firedAtTut === undefined) { patch({ firedAtTut: fired }); return; }
      var need = (g.resTune && g.resTune.dryUnlockFired) || 6;
      if (!g.dryUpReady && fired - g.firedAtTut >= need) { patch({ dryUpReady: true }); g = load(); }
      if (g.dryUpReady && !g.dryUpSeen && !(g.res || {}).u_dry1) {
        if (PAGE === 'KilnOpen' || document.querySelector('.tut-ov') || document.querySelector('.up-ov') || document.querySelector('.jade-ov')) { return; }
        patch({ dryUpSeen: true });
        var ov = document.createElement('div'); ov.className = 'up-ov';
        ov.setAttribute('style', 'position:fixed;inset:0;z-index:10001;background:rgba(26,15,8,.6);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif');
        ov.innerHTML = '<div role="dialog" aria-label="건조대 업그레이드 해금" style="width:300px;box-sizing:border-box;padding:20px 18px 16px;border-radius:22px;background:#FFF4DE;border:4px solid #5B3A24;text-align:center;color:#2B1A0F"><div style="font-size:40px">🪵</div><div style="font-size:21px;margin:4px 0">건조대 업그레이드 가능!</div><div style="font-family:Noto Sans KR,sans-serif;font-size:13.5px;line-height:1.55;color:#5B3A24">도자기 ' + need + '점을 구워 냈어요.<br>상점 「설비」에서 골드로 <b>건조대 증설</b>을 살 수 있어요.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-x="close" style="all:unset;cursor:pointer;flex:1;padding:12px 0;border-radius:14px;border:3px solid #8A6440;color:#5B3A24;font-size:16px">나중에</button><a href="Shop.dc.html" data-sb="1" data-x="go" style="flex:1.3;padding:12px 0;border-radius:14px;background:#4A9440;border:3px solid #2F6328;color:#FFFDF5;font-size:16px;text-decoration:none">상점 보러 가기</a></div></div>';
        ov.addEventListener('click', function (e) { var x = e.target.getAttribute && e.target.getAttribute('data-x'); if (x === 'close' || e.target === ov) { ov.remove(); } if (x === 'go') {  } });
        document.body.appendChild(ov);
        try { window.__sfx && window.__sfx('unlock'); } catch (e) {}
      }
    }
    setTimeout(upCheck, 1500); setInterval(upCheck, 3000);
  };
  S.trackBoot = function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__trackBooted) { return; }
    window.__trackBooted = true;
    var KEY = 'pottery-proto-v1', L = this.qlib();
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    if (PAGE !== 'Wheel' && PAGE !== 'Glaze') { return; } // 의뢰 체크리스트는 모양·유약을 고르는 성형·유약 화면에서만
    var POS = { Wheel: 124, Dry: 66, Bisque: 66, Glaze: 116, Kiln: 66, KilnOpen: 108 }, DEFOPEN = { Wheel: 0, Dry: 0, Glaze: 0, Bisque: 0, Kiln: 0, KilnOpen: 0 }; // 모든 제작 화면은 접힌 채 시작 (조작 UI를 가리지 않게)
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function gameRect() { var cands = [].slice.call(document.querySelectorAll('div')).filter(function (d) { var w = d.offsetWidth; return (w === 390) && d.offsetHeight >= 780; }); var el = cands[0]; if (!el) { return { l: 0, t: 0, k: 1, w: window.innerWidth }; } var r = el.getBoundingClientRect(); return { l: r.left, t: r.top, k: r.width / 390, w: r.width }; }
    var css = document.createElement('style');
    css.textContent = '.trk{position:fixed;z-index:9990;transform-origin:100% 0;box-sizing:border-box;width:168px;border-radius:13px;background:rgba(255,250,240,.96);border:2.5px solid #5B3A24;box-shadow:0 3px 8px rgba(0,0,0,.3);font-family:"Noto Sans KR",sans-serif;color:#2B1A0F;overflow:hidden}' +
      '.trk-h{all:unset;cursor:pointer;box-sizing:border-box;display:flex;align-items:center;gap:4px;width:100%;min-height:32px;padding:4px 7px;background:#5B3A24;color:#FFE7A8;font-family:Jua,sans-serif;font-size:12.5px}' +
      '.trk-h .t{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trk-h .c{flex:0 0 auto;font-size:11.5px;padding:1px 6px;border-radius:8px;background:#FFE7A8;color:#3E2616}.trk-h .c.ok{background:#8FD07E;color:#173F12}' +
      '.trk-b{padding:4px 5px 5px;display:flex;flex-direction:column;gap:3px}.trk-r{display:flex;gap:5px;align-items:center;min-height:24px;padding:2px 5px;border-radius:8px;background:#F6EBD6}.trk-r.ok{background:#E3F2DC}.trk-r.done{background:#ECE9E3;color:#6B6B6B}.trk-r.cur{outline:2px solid #C8601E;outline-offset:-2px}' +
      '.trk-r .i{flex:0 0 18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#FFF;background:#B9A68A}.trk-r.ok .i{background:#3F8A35}.trk-r.done .i{background:#8A8A8A}.trk-r.wip .i{background:#C8901E}' +
      '.trk-r .n{flex:1 1 auto;min-width:0;font-family:Jua,sans-serif;font-size:13px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trk-r .p{flex:0 0 auto;font-size:11px;font-weight:700;color:#5B3A24}.trk-r.ok .p{color:#2F6328}' +
      '.trk-c{margin-top:2px;padding:4px 6px;border-radius:8px;background:#2E6B5F;color:#FFFDF5;font-size:11.5px;font-weight:700;line-height:1.35}.trk-c b{font-family:Jua,sans-serif;font-weight:400;font-size:12.5px;color:#FFE7A8}' +
      '.trk-r.pulse{animation:trkP .9s ease-out}@keyframes trkP{0%{box-shadow:0 0 0 0 rgba(63,138,53,.9);transform:scale(1.06)}100%{box-shadow:0 0 0 10px rgba(63,138,53,0);transform:scale(1)}}' +
      '.trk-q{margin-top:3px;padding:1px 4px;font-family:Jua,sans-serif;font-size:11.5px;color:#7A5434;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trk.mini{width:auto}.trk.mini .trk-h{padding:4px 9px;min-height:30px}.trk.mini .t{display:none}' +
      '.trk-pill{all:unset;cursor:pointer;position:fixed;z-index:9990;transform-origin:100% 0;padding:7px 11px;border-radius:14px;background:rgba(255,250,240,.97);border:2.5px solid #5B3A24;font-family:Jua,sans-serif;font-size:13px;color:#5B3A24;box-shadow:0 3px 8px rgba(0,0,0,.3)}';
    document.head.appendChild(css);
    var box = document.createElement('div'); box.className = 'trk'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', '의뢰 체크리스트');
    var pill = document.createElement('a'); pill.className = 'trk-pill'; pill.href = 'Commission.dc.html'; pill.setAttribute('data-sb', '1'); pill.innerHTML = '<img src="ui/ui_memo.webp" alt="" aria-hidden="true" style="width:15px;height:15px;vertical-align:-3px;margin-right:3px">제작 안내';
    document.body.appendChild(box); document.body.appendChild(pill);
    var open = !!DEFOPEN[PAGE]; try { var so = localStorage.getItem('trkOpen2_' + PAGE); if (so !== null) { open = so === '1'; } } catch (e) {}
    var prev = {};
    box.addEventListener('click', function (e) { var h = e.target.closest && e.target.closest('.trk-h'); if (h) { open = !open; try { localStorage.setItem('trkOpen2_' + PAGE, open ? '1' : '0'); } catch (e2) {} render(); } });
    function place(el) { var R = gameRect(); el.style.top = (R.t + POS[PAGE] * R.k).toFixed(1) + 'px'; el.style.right = Math.max(0, window.innerWidth - (R.l + R.w) + 8 * R.k).toFixed(1) + 'px'; el.style.transform = 'scale(' + R.k.toFixed(3) + ')'; }
    function render() {
      var g = load();
      var hide = document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov') || document.querySelector('[data-notrk]') || document.querySelector('[role=dialog][aria-label]:not(.trk)');
      var list = L.active(g);
      var tids = L.tracked(g, list), qs = list.filter(function (x) { return tids.indexOf(x.id) >= 0; });
      if (!qs.length) { box.style.display = 'none'; pill.style.display = hide ? 'none' : 'block'; place(pill); pill.innerHTML = '<img src="ui/ui_memo.webp" alt="" aria-hidden="true" style="width:15px;height:15px;vertical-align:-3px;margin-right:3px">' + (list.length ? '제작 안내' : '의뢰 없음'); pill.setAttribute('aria-label', list.length ? '제작 안내할 의뢰 고르기' : '진행 중인 의뢰 없음'); return; }
      pill.style.display = 'none'; box.style.display = hide ? 'none' : 'block'; box.className = 'trk' + (open ? '' : ' mini'); place(box);
      var AL = L.alloc(g, list), curTag = window.__wheelTarget || '', curRow = null, body = '', okN = 0, totN = 0;
      qs.forEach(function (q) {
        var A = AL[q.id], html = '';
        A.items.forEach(function (r) {
          var isCur = PAGE === 'Wheel' && curTag === r.tag;
          if (isCur || (!curRow && !r.ok)) { curRow = r; }
          var cls = r.done ? 'done' : (r.ok ? 'ok' : (r.wip ? 'wip' : ''));
          var k = q.id + ':' + r.key, was = prev[k], now = r.dl + r.readyN;
          var pulse = was !== undefined && now > was; prev[k] = now;
          if (pulse) { try { window.__sfx && window.__sfx('reveal'); } catch (e) {} }
          var need = r.n - r.dl;
          var SP = r.steps, st = r.done ? '납품✓' : (!SP ? (r.ok ? '준비 ' + need + '/' + need : (r.readyN ? '준비 ' + r.readyN + '/' + need : '0/' + need)) : (function () { var L2 = [['fired', '소성'], ['glazed', '유약'], ['dried', '건조'], ['formed', '성형']]; for (var si = 0; si < L2.length; si++) { if (SP[L2[si][0]] > 0) { return L2[si][1] + ' 완료 ' + SP[L2[si][0]] + '/' + r.n; } } return '0/' + r.n; })());
          html += '<div class="trk-r ' + cls + (isCur ? ' cur' : '') + (pulse ? ' pulse' : '') + '"><span class="i">' + (r.done || r.ok ? '✓' : (r.wip ? '…' : '')) + '</span><span class="n">' + esc(r.it.name) + (r.n > 1 ? ' ×' + r.n : '') + '</span><span class="p">' + st + '</span></div>';
        });
        var allOk = A.items.every(function (r) { return r.ok; }); totN++; if (allOk) { okN++; }
        body += (qs.length > 1 ? '<div class="trk-q">' + esc(q.title) + (allOk ? ' · 납품 가능' : '') + '</div>' : '') + html;
      });
      var allOkAll = okN === totN, condLine = '';
      if (curRow && !curRow.ok) { condLine = '<div class="trk-c"><b>' + (PAGE === 'Wheel' ? '지금 빚는 것' : '다음 할 것') + ' · ' + esc(curRow.it.name) + '</b><br>' + esc(L.stepCond(curRow.it, PAGE).join(' · ')) + '</div>'; }
      else if (allOkAll) { condLine = '<div class="trk-c" style="background:#3F8A35"><b>모두 완성!</b> 카운터에서 납품해요</div>'; }
      var head = qs.length > 1 ? '제작 안내 ' + qs.length + '건' : qs[0].title;
      box.innerHTML = '<button type="button" class="trk-h" aria-expanded="' + open + '"><img src="ui/ui_pin.webp" alt="" aria-hidden="true" style="width:16px;height:16px;object-fit:contain"><b style="font-weight:400;flex:0 0 auto">의뢰</b><span class="t">' + esc(head) + '</span><span class="c' + (allOkAll ? ' ok' : '') + '">' + (allOkAll ? (open ? '납품 가능' : '✓ 납품') : (qs.length > 1 ? '납품 가능 ' + okN + '/' + totN : '완성 ' + AL[qs[0].id].items.filter(function (r) { return r.ok; }).length + '/' + AL[qs[0].id].items.length)) + '</span><span>' + (open ? '▾' : '▸') + '</span></button>' +
        (open ? '<div class="trk-b">' + body + condLine + '</div>' : '');
    }
    render(); setInterval(render, 1000); window.addEventListener('storage', render); window.addEventListener('resize', render);
  };
  // </boots>
  S.tutBoot = function (PAGE_ARG) {
    var PAGE = PAGE_ARG;
    if (typeof window === 'undefined' || typeof document === 'undefined') { return; }
    if (window.__tutBooted) { return; }
    window.__tutBooted = true;
    var KEY = 'pottery-proto-v1';
    var NAMES = { Gather: '채집', Wheel: '물레', Dry: '건조대', Queue: '작업 대기함', Glaze: '유약 바르기', Kiln: '소성', KilnOpen: '가마 열기', Display: '진열', Counter: '카운터 손님', Commission: '의뢰 내역서', Shop: '상점', Contest: '스테이지', Research: '연구', Codex: '도감', Season: '봄 축제', Town: '마을' };
    var UNL = [['Wheel'], ['Dry', 'Queue'], [], ['Glaze'], ['Kiln', 'KilnOpen'], ['Display'], ['Shop', 'Contest', 'Research', 'Codex', 'Season', 'Town', 'Gather']];
    var DONE1 = 9; // 기초 튜토리얼 완료 값 (화면 코드의 tut < 9 판정과 맞춤)
    var STEPS = [
      { goal: '카운터에서 첫 의뢰 받기', hint: '카운터에 찾아온 민 씨의 사연을 듣고 의뢰를 맡아 보세요', next: 'Counter' },
      { goal: '물레에서 찻잔 빚기', hint: '의뢰받은 찻잔 모양으로 흙을 빚어 보세요 · 모양 고를 때 「의뢰」 배지를 확인해요', next: 'Wheel' },
      { goal: '청자 유약 바르기', hint: '물레 옆 작업대의 찻잔을 유약통으로 끌어 옮긴 뒤, 청자유를 골라 끌어내려 담가 보세요', next: 'Glaze' }, // (옛 건조 단계 · 건조 공정이 없어져 빚으면 바로 넘어감)
      { goal: '청자 유약 바르기', hint: '물레 옆 작업대의 찻잔을 유약통으로 끌어 옮긴 뒤, 청자유를 골라 끌어내려 담가 보세요', next: 'Glaze' }, // (옛 초벌 단계 · 건조를 마치면 바로 건너뜀)
      { goal: '청자 유약 바르기', hint: '물레 옆 작업대의 찻잔을 유약통으로 끌어 옮긴 뒤, 청자유를 골라 끌어내려 담가 보세요', next: 'Glaze' },
      { goal: '가마에서 굽고 꺼내기', hint: '유약 바른 찻잔을 가마로 끌어 넣고 「굽기 시작」 · 풀무질로 시간을 줄이거나 💎옥으로 바로 완료한 뒤 가마를 눌러 꺼내요', next: 'Kiln' },
      { goal: '민 씨에게 찻잔 납품하기', hint: '완성된 청자 찻잔을 카운터에서 민 씨에게 건네 보세요', next: 'Counter' }
    ];
    function stepNo(t) { return t >= 3 ? t : t + 1; } // 3번(옛 초벌)은 건너뛰므로 화면 번호는 1~6
    function raw() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function prog() { try { var v = localStorage.getItem('tutProg'); return v === null ? null : +v; } catch (e) { return null; } }
    function load() { var g = raw(), p = prog(); if (typeof g.tut === 'number' && p !== null && p > g.tut) { g.tut = p; } return g; }
    function save(g) { try { localStorage.setItem(KEY, JSON.stringify(g)); if (typeof g.tut === 'number') { localStorage.setItem('tutProg', String(g.tut)); } if (g.tutV === 2) { localStorage.setItem('tutMig', '2'); } } catch (e) {} }
    function notify() { try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch (e) { try { var ev = document.createEvent('Event'); ev.initEvent('storage', false, false); ev.key = KEY; window.dispatchEvent(ev); } catch (e2) {} } }
    function len(a) { return (a && a.length) || 0; }
    function cnt(o) { var n = 0; for (var k in (o || {})) { if (o[k]) { n++; } } return n; }
    function pieceN(g, w) { var n = 0, ps = g.pieces || {}; for (var k in ps) { if (ps[k] && (!w || w.indexOf(ps[k].where) >= 0)) { n++; } } return n; }
    function lv(g) {
      var made = pieceN(g) > 0;
      var kilnIn = len(g.kilnList) || cnt(g.kilnFilled) || g.kiln === 'firing' || made;
      var glazed = len(g.glazeList) || kilnIn;
      var bisq = glazed; // 초벌 단계 없음
      var formed = len(g.formedList) || len(g.dryList) || bisq;
      var qq = g.quests || {}, took = !!(qq.min || qq.minDone || qq.minThanks), gave = !!(qq.minDone || qq.minThanks);
      return [took, formed, glazed, glazed, kilnIn, made, gave];
    }
    function gR() { try { return localStorage.getItem('tutG') || ''; } catch (e) { return ''; } }
    function locked(g) {
      var t = g.tut, L = {};
      if (typeof t !== 'number') { return L; }
      if (t >= UNL.length) { // 기초 튜토리얼 뒤 : 메뉴마다 해당 안내가 열릴 때까지 잠근다
        var UN = g.unl || {};
        if (t !== DONE1) { /* 튜토리얼을 끈 공방(99) : 전시대 해금 규칙만 */ if (!UN.gather) { L.Gather = true; } if (!g.shopOpen) { L.Shop = true; } if (!UN.research || !g.resUnl) { L.Research = true; } if (!UN.event) { L.Season = true; } return L; }
        var o3 = t2R(), k3 = o3 && typeof o3.k === 'number' ? o3.k : 99;
        if (!UN.gather) { L.Gather = true; } if (!gR() && !g.shopOpen) { L.Shop = true; } /* 채집은 도깨비 전시대 ①로 해금 · 상점은 「할머니의 전시대」 뒤 */
        if (k3 < 3) { L.Display = true; }
        if (!UN.research || !g.resUnl) { L.Research = true; } // 도깨비 전시대 ②로 해금 → 할머니 일지 컷신 뒤 열림
        if (!g.shopOpen) { L.Contest = true; }
        if (!UN.event || !((g.sq && ((g.sq.i || 0) >= 1 || g.sq.thanks)) || g.evDone)) { L.Season = true; } // 벚꽃 의뢰를 납품하면 이벤트 버튼이 열림
        return L;
      }
      for (var i = t; i < UNL.length; i++) { UNL[i].forEach(function (p) { L[p] = true; }); }
      return L;
    }
    function pageOf(href) { var m = /([A-Za-z]+)\.dc\.html/.exec(href || ''); return m ? m[1] : ''; }
    var css = document.createElement('style');
    var sel = Object.keys(NAMES).map(function (p) { return 'html[data-tl~="' + p + '"] a[href*="' + p + '.dc.html"]'; });
    // 잠긴 메뉴 : 아이콘은 회색으로 남기고 이름만 「??」 (이름 바꾸기는 apply 에서) · 공방 설비는 회색만
    css.textContent = sel.join(',') + '{filter:grayscale(1) brightness(.85)!important;opacity:.6!important}' +
      Object.keys(NAMES).concat(['Wheel']).map(function (p) { return 'html[data-tn="' + p + '"] a[data-fac][href="' + p + '.dc.html"]'; }).join(',') + '{animation:tutPulse 1.2s ease-in-out infinite!important;border-radius:14px}' +
      '.tut-off{filter:grayscale(1)!important;opacity:.38!important}' +
      '@keyframes tutPulse{0%,100%{box-shadow:0 0 0 3px rgba(255,214,107,.9),0 0 10px 2px rgba(255,214,107,.7)}50%{box-shadow:0 0 0 5px rgba(255,214,107,.5),0 0 24px 8px rgba(255,214,107,.9)}}' +
      '@keyframes tutIn{0%{transform:translate(-50%,-14px);opacity:0}100%{transform:translate(-50%,0);opacity:1}}@keyframes tutPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}' +
      '.tut-mini{position:fixed;transform-origin:0 0;z-index:9997;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:2px;width:32px;padding:6px 0 5px;border-radius:0 12px 12px 0;background:rgba(43,26,15,.92);border:2px solid #FFD66B;border-left:0;box-shadow:0 3px 8px rgba(0,0,0,.35);color:#FFE7A8;font-family:Jua,sans-serif;font-size:15px;cursor:pointer;line-height:1}.tut-mini b{font-weight:400;font-size:10.5px}' + '.tut-card{position:fixed;left:50%;top:38%;z-index:9998;width:min(320px,86vw);box-sizing:border-box;padding:9px 12px;border-radius:16px;background:rgba(43,26,15,.94);border:3px solid #FFD66B;box-shadow:0 6px 16px rgba(0,0,0,.4);color:#FFF4DE;font-family:Jua,sans-serif;pointer-events:none;animation:tutIn .35s ease-out both;transition:opacity .4s}' +
      '.tut-card b{display:block;font-weight:400;font-size:15px;color:#FFE7A8}.tut-card span{display:block;font-family:"Noto Sans KR",sans-serif;font-size:11.5px;line-height:1.45;color:#F3E3C4;margin-top:2px}' +
      '.tut-ov{position:fixed;inset:0;z-index:9999;background:rgba(26,15,8,.66);display:flex;align-items:center;justify-content:center}' +
      '.tut-box{width:min(320px,86vw);box-sizing:border-box;padding:22px 18px 16px;border-radius:24px;background:#FFF4DE;border:4px solid #5B3A24;box-shadow:inset 0 0 0 3px #F0D9AE,0 8px 0 rgba(43,26,15,.45);text-align:center;color:#2B1A0F;font-family:"Noto Sans KR",sans-serif;animation:tutPop .45s both}' +
      '.tut-box h3{margin:6px 0 6px;font-family:Jua,sans-serif;font-weight:400;font-size:22px}.tut-box p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#5B3A24;white-space:pre-line}' +
      '.tut-box{border:20px solid transparent!important;border-image:url(ui/dialogue_frame.webp) 40 fill / 20px stretch!important;background:none!important;box-shadow:0 8px 18px rgba(0,0,0,.35)!important;border-radius:0!important;padding:6px 4px 2px!important}' +
      '.tut-box .ic{font-size:44px;line-height:1}.tut-box .chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 0 14px}.tut-box .chips i{font-style:normal;padding:4px 10px;border-radius:12px;background:#FFE7A8;border:2px solid #B8923F;font-family:Jua,sans-serif;font-size:14px;color:#5B3A24}' +
      '.tut-btn{all:unset;cursor:pointer;display:block;box-sizing:border-box;width:100%;padding:12px 0;margin-top:8px;border-radius:16px;font-family:Jua,sans-serif;font-size:18px;text-align:center}' +
      '.tut-btn.go{background:#4A9440;border:3px solid #2F6328;box-shadow:0 4px 0 #2F6328;color:#FFFDF5}.tut-btn.sub{background:#FFFDF5;border:2px solid #C9A27A;color:#7A5434;font-size:15px}' +
      '.tut-toast{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:9999;width:min(320px,86vw);box-sizing:border-box;padding:11px 14px;border-radius:16px;background:rgba(43,26,15,.95);border:3px solid #FFE7A8;font-family:Jua,sans-serif;font-size:14px;line-height:1.45;color:#FFF4DE;text-align:center;pointer-events:none}';
    document.head.appendChild(css);
    var cardEl = null, cardT = 0, toastT = 0;
    function toast(msg) {
      var el = document.querySelector('.tut-toast');
      if (!el) { el = document.createElement('div'); el.className = 'tut-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
      el.textContent = msg; el.style.display = 'block';
      clearTimeout(toastT); toastT = setTimeout(function () { el.style.display = 'none'; }, msg.length > 30 ? 3600 : 2200);
    }
    function overlay(html, btns) {
      var ov = document.createElement('div'); ov.className = 'tut-ov';
      var box = document.createElement('div'); box.className = 'tut-box'; box.setAttribute('role', 'dialog'); box.innerHTML = html;
      btns.forEach(function (b) { var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'tut-btn ' + (b.cls || 'go'); bt.textContent = b.label; bt.addEventListener('click', function () { ov.remove(); if (b.run) { b.run(); } }); box.appendChild(bt); });
      ov.appendChild(box); document.body.appendChild(ov); return ov;
    }
    var spotEl = null, spotT = 0, spotFind = null;
    function spotOff() { clearInterval(spotT); spotT = 0; if (spotEl) { spotEl.remove(); spotEl = null; } }
    function vis(el) { if (!el) { return null; } var r = el.getBoundingClientRect(); if (r.width < 12 || r.height < 12 || r.bottom < 0 || r.top > window.innerHeight) { return null; } var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.3) { return null; } return r; }
    // 안내 스포트라이트 · 밝힌 곳만 누를 수 있고, 다른 곳을 누르면 막고 다시 알려 준다
    var spotKey = '', spotMute = {};
    function spotlight(find, msg, key, onHit) {
      spotOff(); spotFind = find; spotKey = key || '';
      var el0 = find(); if (!el0 || !vis(el0)) { return false; }
      spotEl = document.createElement('div'); spotEl.className = 'tut-spot';
      spotEl.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none';
      var blk = '<div class="blk" style="position:fixed;pointer-events:auto;background:transparent;touch-action:none"></div>';
      spotEl.innerHTML = blk + blk + blk + blk + '<div class="hole" style="position:fixed;border-radius:16px;box-shadow:0 0 0 9999px rgba(15,8,3,.66);transition:all .2s;pointer-events:none"><div style="position:absolute;inset:-3px;border-radius:18px;border:3px solid #FFD66B;animation:tutPulse 1.1s ease-in-out infinite"></div></div><div class="bub" style="position:fixed;max-width:250px;box-sizing:border-box;padding:9px 13px 7px;border-radius:14px;background:#FFF4DE;border:3px solid #5B3A24;box-shadow:0 5px 12px rgba(0,0,0,.4);font-family:Jua,sans-serif;font-size:15px;line-height:1.35;color:#2B1A0F;text-align:center;pointer-events:auto"><span class="tx"></span><button type="button" class="skip" style="all:unset;cursor:pointer;display:block;margin:6px auto 0;padding:4px 10px;min-height:28px;font-family:Noto Sans KR,sans-serif;font-size:11.5px;font-weight:700;color:#8A6440">안내 잠깐 닫기 ✕</button></div>';
      spotEl.querySelector('.tx').textContent = msg;
      document.body.appendChild(spotEl);
      var bubEl = spotEl.querySelector('.bub');
      [].slice.call(spotEl.querySelectorAll('.blk')).forEach(function (b) {
        ['pointerdown', 'click', 'touchstart'].forEach(function (ev) { b.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); if (ev === 'pointerdown') { bubEl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 260 }); toast('반짝이는 곳을 눌러 주세요 · 안내를 닫으려면 「안내 잠깐 닫기」'); } }, { passive: false }); });
      });
      spotEl.querySelector('.skip').addEventListener('click', function (e) { e.stopPropagation(); if (spotKey) { spotMute[spotKey] = Date.now() + 20000; } if (PAGE === 'Main') { spotMute.guideMain = Date.now() + 20000; } spotOff(); });
      var holeR = null;
      function place() {
        var el = spotFind && spotFind(), r = vis(el); if (!r || !spotEl) { spotOff(); return; }
        var h = spotEl.querySelector('.hole'), b = bubEl, pad = 6, W = window.innerWidth, H = window.innerHeight;
        var L0 = r.left - pad, T0 = r.top - pad, R0 = r.right + pad, B0 = r.bottom + pad; holeR = { l: L0, t: T0, r: R0, b: B0 };
        h.style.left = L0 + 'px'; h.style.top = T0 + 'px'; h.style.width = (R0 - L0) + 'px'; h.style.height = (B0 - T0) + 'px';
        var bl4 = spotEl.querySelectorAll('.blk');
        function setB(n, l, t, w, hh) { var s0 = bl4[n].style; s0.left = l + 'px'; s0.top = t + 'px'; s0.width = Math.max(0, w) + 'px'; s0.height = Math.max(0, hh) + 'px'; }
        setB(0, 0, 0, W, T0); setB(1, 0, B0, W, H - B0); setB(2, 0, T0, L0, B0 - T0); setB(3, R0, T0, W - R0, B0 - T0);
        var bw = Math.min(250, W - 20), bl = Math.max(10, Math.min(W - bw - 10, r.left + r.width / 2 - bw / 2));
        b.style.width = bw + 'px'; b.style.left = bl + 'px';
        var bh = b.offsetHeight || 80, below = r.bottom + 16 + bh <= H - 6, above = r.top - 16 - bh >= 6;
        if ((r.top > H * 0.45 && above) || (!below && above)) { b.style.top = 'auto'; b.style.bottom = (H - r.top + 16) + 'px'; } else if (below) { b.style.bottom = 'auto'; b.style.top = (r.bottom + 16) + 'px'; } else { b.style.bottom = 'auto'; b.style.top = Math.max(6, Math.min(H - bh - 6, r.bottom - bh - 14)) + 'px'; }
      }
      place(); spotT = setInterval(place, 250);
      // 밝힌 곳을 누르면 안내를 닫고 원래 동작이 그대로 일어난다
      function hit(e) { if (!spotEl) { document.removeEventListener('pointerdown', hit, true); return; } if (holeR && e.clientX >= holeR.l && e.clientX <= holeR.r && e.clientY >= holeR.t && e.clientY <= holeR.b) { document.removeEventListener('pointerdown', hit, true); setTimeout(spotOff, 60); if (onHit) { try { onHit(); } catch (e2) {} } } }
      document.addEventListener('pointerdown', hit, true);
      return true;
    }
    function linkTo(p) { return function () { var c = [].slice.call(document.querySelectorAll('a[href]')).filter(function (a) { return pageOf(a.getAttribute('href')) === p && vis(a); }); var nx = c.filter(function (a) { return / 옆에서 보기$/.test(a.getAttribute('aria-label') || ''); }); if (nx.length) { return nx[0]; } c.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; }); return c[0] || null; }; }
    function btnWith(txt) { return function () { return [].slice.call(document.querySelectorAll('button')).filter(function (b) { return (b.textContent || '').indexOf(txt) >= 0 && vis(b); })[0] || null; }; }
    function goalReady(g) { var gl = g.goal; if (!gl || !gl.sid) { return false; } var ps = g.pieces || {}; for (var k in ps) { var p = ps[k]; if (p && (p.where === 'store' || p.where === 'shelf') && p.shape === (gl.wshape || p.shape) && (!gl.glaze || p.glaze === gl.glaze)) { return true; } } return false; }
    function nextOf(g) { return STEPS[g.tut].next; }
    function guideNext(g) {
      var t = g.tut; if (typeof t !== 'number' || t >= STEPS.length) { return true; }
      var nx = nextOf(g); if (nx === PAGE) { return true; }
      if (PAGE === 'KilnOpen' && (nx === 'Kiln' || nx === 'KilnOpen')) { return true; } // 가마를 여는 연출 중에는 끌고 가지 않는다
      var key = 'tutSpot_' + t + '_' + PAGE; try { if (sessionStorage.getItem(key)) { return true; } } catch (e) {}
      // 다음 공정 : 옆 화살표가 있으면 바로, 없으면 공방으로 돌아가 해당 설비를 눌러 이동한다
      var nm = { Wheel: '물레', Dry: '건조대', Glaze: '유약대', Kiln: '소성가마', KilnOpen: '소성가마', Counter: '카운터', Display: '진열대' }[nx] || NAMES[nx] || nx;
      var arw = PAGE !== 'Main' ? qsel('a[data-nav][href="' + nx + '.dc.html"]') : null; /* 옆 화살표가 다음 공정이면 공방을 거치지 않는다 */
      var ok = PAGE === 'Main' ? spotlight(function () { return qsel('a[data-fac][href="' + nx + '.dc.html"]')() || linkTo(nx)(); }, '「' + nm + '」를 눌러 이동해요') : (arw && arw() ? spotlight(arw, '옆 화살표로 「' + nm + '」에 바로 가요') : spotlight(function () { return qsel('nav a[href="Main.dc.html"]')() || linkTo('Main')(); }, '공방으로 돌아가서 「' + nm + '」를 눌러요'));
      if (ok) { try { sessionStorage.setItem(key, '1'); } catch (e) {} }
      return ok;
    }
    /* 공방 화면에서는 다음 설비 안내가 꺼져 있으면 계속 다시 띄운다 (컷신·팝업에 가려 놓치는 경우 대비) */
    var gmLoadT = Date.now(), gmAct = 0;
    try { document.addEventListener('pointerdown', function () { gmAct = Date.now(); }, true); } catch (e) {}
    function guideMain(g) {
      var t = g.tut; if (typeof t !== 'number' || t >= STEPS.length) { return; }
      var nx = nextOf(g); if (!nx || nx === PAGE) { return; }
      if (PAGE === 'KilnOpen' && (nx === 'Kiln' || nx === 'KilnOpen')) { return; }
      if (spotEl || ptrDown || document.querySelector('.tut-ov,.jade-ov,.st-ov,.sm-ov,[aria-modal="true"]')) { return; }
      var now = Date.now(); if (spotMute.guideMain && spotMute.guideMain > now) { return; }
      /* 다른 화면에서는 손을 떼고 잠깐 기다린 뒤에만 「공방으로」 안내 (진행 중인 대화·연출을 가로막지 않게) */
      if (PAGE !== 'Main' && (now - gmLoadT < 2500 || now - gmAct < 2500)) { return; }
      var nm = { Wheel: '물레', Dry: '건조대', Glaze: '유약대', Kiln: '소성가마', KilnOpen: '소성가마', Counter: '카운터', Display: '진열대' }[nx] || NAMES[nx] || nx;
      if (PAGE === 'Main') { spotlight(function () { return qsel('a[data-fac][href="' + nx + '.dc.html"]')() || linkTo(nx)(); }, '「' + nm + '」를 눌러 이동해요', 'guideMain'); }
      else if (qsel('a[data-nav][href="' + nx + '.dc.html"]')()) { spotlight(qsel('a[data-nav][href="' + nx + '.dc.html"]'), '옆 화살표로 「' + nm + '」에 바로 가요', 'guideMain'); } /* 공방을 거치지 않고 다음 공정으로 */
      else { spotlight(function () { return qsel('nav a[href="Main.dc.html"]')() || linkTo('Main')(); }, '공방으로 돌아가서 「' + nm + '」를 눌러요', 'guideMain'); }
    }
    // 밝힐 곳이 아직 안 그려졌거나 안내 창이 떠 있으면 조금 뒤 다시 찾는다
    function guideRetry(delay, n) { setTimeout(function () { if (document.querySelector('.tut-ov') || document.querySelector('.jade-ov')) { if (n > 0) { guideRetry(700, n - 1); } return; } if (!guideNext(load()) && n > 0) { guideRetry(700, n - 1); } }, delay); }
    function guideJade(g) {
      var t = g.tut, L = { 2: ['Dry', '바로 말리기', 'dry'], 5: [PAGE === 'KilnOpen' ? 'KilnOpen' : 'Kiln', '바로 완료', 'kiln'] }[t];
      if (!L || L[0] !== PAGE || spotEl || document.querySelector('.tut-ov') || document.querySelector('.jade-ov')) { return; }
      var key = 'tutJade_' + L[2]; try { if (localStorage.getItem(key)) { return; } } catch (e) {}
      var nowJ = Date.now(), busy = L[2] === 'dry' ? (g.dryList || []).some(function (x) { return x && nowJ - x.start < 1800000; }) : (g.kiln === 'firing' && (g.kilnStart || 0) + (g.kilnDur || 28800000) > nowJ + 3000);
      if (!busy) {
        if (L[2] === 'dry' && (g.formedList || []).length) { try { if (sessionStorage.getItem('tutPre_dry')) { return; } } catch (e) {} if (spotlight(qsel('button[data-tray]'), '빚은 그릇을 꾹 잡고 아래 건조대 빈 칸으로 끌어 놓아요')) { try { sessionStorage.setItem('tutPre_dry', '1'); } catch (e) {} } }
        return;
      }
      {
        var fk = 'tutFan_' + L[2], fs = 0; try { fs = +(localStorage.getItem(fk) || 0); } catch (e) {}
        if (!fs) {
          var fsel = L[2] === 'dry' ? 'button[aria-label^="부채질"]' : 'button[aria-label^="풀무질"]';
          var fmsg = L[2] === 'dry' ? '기다리는 동안 부채질! 움직이는 커서가 초록 칸에 올 때 누르면 빨리 말라요 · 몇 번 눌러 봐요' : '풀무질로 바람을 넣어요! 게이지를 초록 칸에 맞추면 시간이 빨리 흘러요 · 빨강까지 밀면 과열돼요';
          if (spotlight(qsel(fsel), fmsg, 'fan_' + L[2])) { try { localStorage.setItem(fk, String(Date.now())); } catch (e) {} }
          return;
        }
        if (nowJ - fs < 9000) { return; }
      }
      var msg = L[2] === 'kiln' ? '풀무질 대신 💎옥으로 바로 완료할 수도 있어요 · 튜토리얼 중엔 무료예요' : (L[2] === 'dry' ? '부채질 대신 💎옥으로 바로 말릴 수도 있어요 · 튜토리얼 중엔 무료예요' : '기다리기 지루하면 💎옥으로 바로 완료! 튜토리얼 중엔 무료예요');
      if (spotlight(btnWith(L[1]), msg)) { try { localStorage.setItem(key, '1'); } catch (e) {} }
    }
    function showCard(g, force) {
      var t = g.tut; if (typeof t !== 'number' || t >= STEPS.length) { var mm = document.querySelector('.tut-mini'); if (mm) { mm.remove(); } return false; }
      var st = STEPS[t];
      var mini = document.querySelector('.tut-mini');
      if (!mini) { mini = document.createElement('button'); mini.type = 'button'; mini.className = 'tut-mini'; mini.setAttribute('aria-label', '튜토리얼 목표 보기'); mini.addEventListener('click', function () { showCard(load(), true); }); document.body.appendChild(mini); }
      mini.innerHTML = '🎯<b>' + stepNo(t) + '/' + (STEPS.length - 1) + '</b>';
      placeMini();
      var seen = -1; try { var sv = localStorage.getItem('tutCardSeen'); if (sv !== null) { seen = +sv; } } catch (e) {}
      if (!force && seen === t) { return false; }
      if (document.querySelector('.tut-ov')) { return false; }
      try { localStorage.setItem('tutCardSeen', String(t)); } catch (e) {}
      overlay('<div class="ic">' + (window.PotteryShared.ICO || String)('🎯') + '</div><h3>목표 ' + stepNo(t) + '/' + (STEPS.length - 1) + '</h3><p><b style="display:block;margin-bottom:6px;font-family:Jua,sans-serif;font-weight:400;font-size:17px;color:#2B1A0F">' + st.goal + '</b>' + st.hint + '</p>', [{ label: '확인', run: function () { setTimeout(function () { guideNext(load()); }, 350); } }]);
      return true;
    }
    function gameRect() { var el = document.getElementById('__host') || document.querySelector('[data-navroot]'); if (el) { var r = el.getBoundingClientRect(); if (r.width > 50) { return { l: r.left, t: r.top, k: r.width / 390 }; } } var w = Math.min(window.innerWidth, 390 * window.innerHeight / 844); return { l: (window.innerWidth - w) / 2, t: 0, k: w / 390 }; }
    function placeMini() { var mm = document.querySelector('.tut-mini'); if (!mm) { return; } var R = gameRect(); mm.style.left = R.l.toFixed(1) + 'px'; mm.style.top = (R.t + 290 * R.k).toFixed(1) + 'px'; mm.style.transform = 'scale(' + R.k.toFixed(3) + ')'; }
    setInterval(placeMini, 400); window.addEventListener('resize', placeMini);
    function apply(g) {
      var L = locked(g), keys = Object.keys(L);
      document.documentElement.setAttribute('data-tl', keys.join(' '));
      var t = g.tut;
      document.documentElement.setAttribute('data-tn', typeof t === 'number' && t < STEPS.length ? nextOf(g) : '');
      lockNames(L);
      return L;
    }
    // 잠긴 메뉴의 이름 글자만 「??」로 바꾸고, 열리면 되돌린다 (공방 설비는 이름 그대로)
    function lockNames(L) {
      [].slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
        var p = pageOf(a.getAttribute('href')), on = !!(p && L[p]) && !a.hasAttribute('data-fac');
        var leaves = [].slice.call(a.querySelectorAll('*')).filter(function (el) { return !el.children.length && el.tagName !== 'svg' && el.tagName !== 'IMG' && !el.closest('svg') && ((el.getAttribute('data-tl-orig') !== null) || /\S/.test(el.textContent || '')); });
        var lb = leaves.filter(function (el) { return !/^[\d,.\s+%·/-]+$/.test(el.getAttribute('data-tl-orig') !== null ? el.getAttribute('data-tl-orig') : el.textContent); });
        lb = lb.length ? [lb[lb.length - 1]] : [];
        if (!leaves.length && /\S/.test(a.textContent || '') && on) { var tn = [].slice.call(a.childNodes).filter(function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); })[0]; if (tn) { if (!a.hasAttribute('data-tl-tn')) { a.setAttribute('data-tl-tn', tn.nodeValue); } if (tn.nodeValue !== '??') { tn.nodeValue = '??'; } } }
        if (!on && a.hasAttribute('data-tl-tn')) { var tn2 = [].slice.call(a.childNodes).filter(function (n) { return n.nodeType === 3; })[0]; if (tn2 && tn2.nodeValue === '??') { tn2.nodeValue = a.getAttribute('data-tl-tn'); } a.removeAttribute('data-tl-tn'); }
        lb.forEach(function (el) {
          if (on) { if (el.getAttribute('data-tl-orig') === null) { el.setAttribute('data-tl-orig', el.textContent); } if (el.textContent !== '??') { el.textContent = '??'; } }
          else if (el.getAttribute('data-tl-orig') !== null) { if (el.textContent === '??') { el.textContent = el.getAttribute('data-tl-orig'); } el.removeAttribute('data-tl-orig'); }
        });
      });
    }
    // 화면이 다시 그려져 원래 이름이 돌아오면 그리기 전에 바로 ??로 되돌린다 (깜빡임 방지)
    var lnL = null, lnBusy = false;
    function lnRun() { if (lnBusy) { return; } lnBusy = true; try { lockNames(lnL || (lnL = locked(load()))); } catch (e) {} lnBusy = false; }
    setInterval(function () { lnL = locked(load()); lnRun(); }, 700);
    try { new MutationObserver(function (ms) { if (lnBusy) { return; } for (var i = 0; i < ms.length; i++) { var t = ms[i].target, el = t.nodeType === 3 ? t.parentElement : t; if (el && el.closest && el.closest('a[href]')) { lnRun(); return; } } }).observe(document.documentElement, { subtree: true, childList: true, characterData: true }); } catch (e) {}
    function freshStart(keep) {
      var g = { tut: 0, tutV: 2, jadeV: 2, jade: 300, gold: 800, shards: 0, fameLv: 1, fameXp: 0, formedList: [], dryList: [], bisqueList: [], bisque: { state: 'idle', start: 0, items: [] }, glazeList: [], kilnList: [], kiln: 'empty', heat: 'mid', kilnFilled: {}, batchItems: [], batch: 0, kilnStart: 0, firings: 0, openIdx: 0, openLog: [], trim: false, mats: {}, gv2: 1, gv3: 1, matsQ: {}, deco: {}, quests: { min: false, guest: false, week: false, minDone: false }, research: {}, pieces: {}, order: [], broken: 0, curator: 'done', walkins: [], tasteOrders: [], tasteDone: [], contest: { stars: {} }, goal: null, glazesFound: { white: true, celadon: true, black: true }, shapesFound: { dish: true, cup: true, bowl: true }, soldBy: {}, soldDay: 0 };
      ['settings', 'feedbacks', 'playerName', 'layout', 'pname', 'scenes'].forEach(function (k) { if (keep[k] !== undefined) { g[k] = keep[k]; } });
      try { Object.keys(localStorage).forEach(function (k) { if (/^(tut|ctab$|lastCraft|wheelWip|trkOpen2_|t2auto|contestCh|resFocus)/.test(k) && k !== 'tutMig') { localStorage.removeItem(k); } }); Object.keys(sessionStorage).forEach(function (k) { if (/^tut/.test(k)) { sessionStorage.removeItem(k); } }); } catch (e) {} save(g); return g; /* 처음부터 : 지난 진행의 튜토리얼·채집 단계 기록도 지운다 (남아 있으면 민 씨 납품 직후 채집 끝 컷신이 나옴) */
    }
    var actLast = {}, ptrDown = false, whStage = '', whLast = 0;
    ['pointerdown', 'pointermove', 'touchmove', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (ev === 'pointermove' && !e.buttons) { return; } window.__tutIn = Date.now(); }, true); });
    document.addEventListener('pointerdown', function () { ptrDown = true; }, true);
    ['pointerup', 'pointercancel'].forEach(function (ev) { window.addEventListener(ev, function () { ptrDown = false; }, true); });
    function qsel(q) { return function () { return [].slice.call(document.querySelectorAll(q)).filter(function (x) { return vis(x); })[0] || null; }; }
    function act(key, cond, find, msg, onHit) {
      if (!cond) { return false; }
      if (spotEl || document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov')) { return true; }
      if (ptrDown) { return true; }
      var now = Date.now(); if (actLast[key] && now - actLast[key] < 3000) { return true; }
      if (spotMute[key] && spotMute[key] > now) { return true; }
      if (spotlight(find, msg, key, onHit)) { actLast[key] = now; return true; }
      return false;
    }
    function anyWith(txt) { return function () { return [].slice.call(document.querySelectorAll('button,a[href]')).filter(function (b) { return (b.textContent || '').indexOf(txt) >= 0 && vis(b); })[0] || null; }; }
    function giftIn(g) { var P0 = g.pieces || {}, n = { store: 0, shelf: 0, badLive: false }; ['tg1', 'tg2', 'tg3', 'tg4', 'tg5', 'tg6'].forEach(function (k) { var p = P0[k]; if (p) { if (p.where === 'store') { n.store++; } else if (p.where === 'shelf') { n.shelf++; } } }); var b = P0.tg7; n.badLive = !!(b && (b.where === 'store' || b.where === 'shelf')); return n; }
    /* 진열 튜토리얼 동안 진열·보관함·안내 말고는 누르지 못하게 */
    var tlStyle = null;
    function tlock(on) {
      try {
        if (!tlStyle) { tlStyle = document.createElement('style'); tlStyle.textContent = 'body[data-tlock] :is(a,button,[role=tab],[role=button]):not(.tut-ov *):not(.tut-spot *):not(.tut-box *):not(#dstore *):not(#dshelf *){pointer-events:none!important;filter:grayscale(.5) brightness(.85)}'; document.head.appendChild(tlStyle); }
        if (on) { document.body.setAttribute('data-tlock', '1'); } else if (document.body.hasAttribute('data-tlock')) { document.body.removeAttribute('data-tlock'); }
      } catch (e) {}
    }
    function guideAct(g) {
      var t = g.tut, now = Date.now();
      if (typeof t !== 'number' || t >= STEPS.length) { return; }
      if (PAGE === 'Wheel' && t === 1 && !(g.formedList || []).length && !(g.dryList || []).length) {
        var W = function (k) { try { return localStorage.getItem('tutWh_' + k); } catch (e) { return null; } }, Wset = function (k) { try { localStorage.setItem('tutWh_' + k, '1'); } catch (e) {} };
        var clayDlg = qsel('[role=dialog][aria-label="흙 고르기"]')(), tgtDlg = qsel('[role=dialog][aria-label="목표 모양 고르기"]')();
        if (clayDlg) { Wset('clayOpen'); act('whClayPick', true, qsel('button[aria-label^="황토"]'), '흙마다 특징이 달라요 · 튜토리얼 동안은 황토를 마음껏 써요 · 고르거나 닫아요'); return; }
        if (tgtDlg) { Wset('tgtOpen'); act('whTgtPick', true, qsel('button[aria-label^="찻잔"]'), '「의뢰」 배지가 붙은 찻잔이 민 씨가 원한 모양이에요 · 골라요'); return; }
        if (!W('clayOpen')) { act('whClay', true, qsel('button[aria-label^="흙 바꾸기"]'), '먼저 흙을 골라요 · 눌러서 흙 종류를 확인해요'); return; }
        if (!W('tgtOpen')) { act('whTgt', true, qsel('button[aria-label^="목표 모양 바꾸기"]'), '이번엔 만들 모양을 골라요'); return; }
        var tbW = qsel('button[aria-label^="목표 모양 바꾸기"]')();
        if (tbW && (tbW.getAttribute('aria-label') || '').indexOf('찻잔') < 0) { act('whTgt2', true, qsel('button[aria-label^="목표 모양 바꾸기"]'), '의뢰는 찻잔이에요 · 모양을 찻잔으로 바꿔요'); return; }
        var mtW = /일치율\s*(\d+)%/.exec(document.body.innerText || ''), pctW = mtW ? +mtW[1] : 0;
        // 성형 3단계 안내: 1 높이 → 2 좌우 모양 → 3 두께
        var WT = window.__wheelTut || {}, stage = qsel('[data-work]')();
        if (!WT.shaping) { if (!W('c1') && WT.fit !== undefined) { if (act('whC', true, function () { return stage; }, '먼저 중심 잡기 — 흙 양옆을 양손(마우스는 꾹)으로 누르고 있으면 흔들림이 가라앉아요')) { Wset('c1'); } } return; }
        // 높이 ↔ 좌우 ↔ 두께를 번갈아 안내 · 하나가 맞으면 바로 다음 것을, 2초 동안 손을 안 대면 다시 안내
        var stg = !WT.hOk ? 'h' : (!WT.sOk ? 's' : (!WT.tOk ? 't' : (pctW >= 100 ? 'done' : 'fine')));
        var MSG = {
          h: ['높이 맞추기 — 「▲ 높이 ▼」 손잡이를 위아래로 끌어 점선 꼭대기 높이에 맞춰요', function () { return document.getElementById('wHdl'); }],
          s: ['좌우 맞추기 — 흙 옆을 좌우로 밀어 점선 모양에 맞춰요 · 초록 화살표 쪽으로 밀면 돼요', function () { return stage; }],
          t: ['두께 맞추기 — 왼쪽 눈금은 높이별 두께예요 · 흙 벽을 위로 쓸면 얇아지고 아래로 쓸면 두꺼워져요 · 눈금이 모두 초록이면 OK', function () { var g2 = qsel('[aria-label="높이별 두께"]')(); return g2 ? g2.parentElement : stage; }],
          fine: ['거의 다 됐어요! 일치율이 100%가 될 때까지 「!」 표시가 있는 곳을 조금 더 다듬어요', function () { return stage; }],
          done: ['일치율 100%! 「완성」을 눌러요', btnWith('완성')]
        };
        var OKT = { h: '', s: '✓ 높이 OK! 이제 좌우 모양이에요', t: '✓ 좌우 OK! 이제 두께예요', fine: '✓ 거의 다 됐어요', done: '✓ 100%!' };
        if (stg !== whStage) {
          var prev = whStage; whStage = stg; spotOff();
          if (prev && OKT[stg] && ({ h: 0, s: 1, t: 2, fine: 3, done: 4 })[stg] > ({ h: 0, s: 1, t: 2, fine: 3, done: 4 })[prev]) { toast(OKT[stg]); }
          if (prev && stg === 'h' && prev !== 'h') { toast('높이가 다시 어긋났어요 · 높이부터 맞춰요'); }
          whLast = now; spotlight(MSG[stg][1], MSG[stg][0], 'wh_' + stg + '_' + now); return;
        }
        if (!spotEl && !ptrDown && now - (window.__tutIn || 0) > 2000 && now - whLast > 2000) { whLast = now; spotlight(MSG[stg][1], MSG[stg][0], 'wh_' + stg + '_' + now); }
      }
      if (PAGE === 'Counter' && (t === 0 || t === 6)) {
        var tabBtn = function (lb) { return function () { return [].slice.call(document.querySelectorAll('[role=tab]')).filter(function (b) { return (b.textContent || '').indexOf(lb) >= 0 && vis(b); })[0] || null; }; };
        var want = t === 0 ? '의뢰 손님' : '납품 대기', tb = tabBtn(want)();
        if (tb && tb.getAttribute('aria-selected') !== 'true') { act('ctTab' + t, true, tabBtn(want), t === 0 ? '「의뢰 손님」 탭에서 민 씨 이야기를 들어요' : '완성한 찻잔은 「납품 대기」 탭에서 건네요'); return; }
        if (t === 6) {
          if (btnWith('부르기')()) { act('ctCall', true, btnWith('부르기'), '민 씨를 불러 찻잔을 건네요'); }
          else if (btnWith('건네기')()) { act('ctGive', true, btnWith('건네기'), '찻잔을 건네요'); }
          else if (qsel('[aria-label="대화 넘기기"]')()) { act('ctTalk6', true, qsel('[aria-label="대화 넘기기"]'), '민 씨 이야기를 들어요 · 눌러서 대화를 넘겨요'); }
        }
      }
      if (PAGE === 'Dry' && t === 2) {
        act('dryOut', (g.dryList || []).some(function (x) { return x && now - x.start >= 1800000; }), btnWith('다 마른 것 빼기'), '다 말랐어요! 눌러서 유약 대기로 옮겨요');
      }
      if (PAGE === 'Bisque' && t === 3) {
        var bq = g.bisque || {};
        if (bq.state === 'firing') { if ((bq.start || 0) + 1200000 <= now) { act('bqOut', true, btnWith('꺼내기'), '다 구워졌어요! 가마를 눌러 꺼내요'); } }
        else if (btnWith('초벌 굽기')()) { act('bqFire', true, btnWith('초벌 굽기'), '이제 불을 지펴 초벌을 구워요'); }
        else { act('bqPick', (g.bisqueList || []).length > 0, function () { return [].slice.call(document.querySelectorAll('button[data-tray]')).filter(function (b) { return vis(b) && (b.getAttribute('aria-label') || '').indexOf('가마 안') < 0; })[0] || null; }, '그릇을 꾹 잡고 아래 가마로 끌어 놓아요'); }
      }
      if (PAGE === 'Glaze' && t === 4 && (g.glazeList || []).length) {
        var gzBtn = qsel('button[aria-label^="유약 고르기 · 지금"]')();
        if (qsel('div[role=dialog] button[aria-label$="청자유"]')()) { act('gzCel', true, qsel('div[role=dialog] button[aria-label$="청자유"]'), '「📋 의뢰」 태그가 붙은 유약이 의뢰 조건이에요 · 민 씨가 원한 청자유를 골라요'); }
        else if (gzBtn && (gzBtn.getAttribute('aria-label') || '').indexOf('청자') < 0) { act('gzOpen', true, qsel('button[aria-label^="유약 고르기 · 지금"]'), '지금은 기본 백자유예요 · 눌러서 유약을 바꿔요'); }
        else { act('gzDip', true, qsel('[aria-label^="도자기를 아래로"]'), '도자기를 아래로 끌어 원하는 만큼 유약에 담그고, 위로 올려 꺼내요 · 깊이 담글수록 넓게 입혀져요'); }
      }
      if (PAGE === 'Kiln' && t === 5) {
        var filled = 0, kf = g.kilnFilled || {}; for (var c in kf) { if (kf[c]) { filled++; } }
        if (g.kiln === 'firing') { if (anyWith('가마 열고 꺼내기')()) { act('knOpen', true, anyWith('가마 열고 꺼내기'), '다 구워졌어요! 가마를 열어 꺼내요'); } }
        else if (btnWith('적정')()) { act('knSel', true, btnWith('적정'), '넣을 그릇을 골라요'); }
        else if ((g.kilnList || []).length) { act('knPut', true, function () { return qsel('button[data-kwait]')() || qsel('button[aria-label^="작품 넣기 · 맞는 자리"]')(); }, '그릇을 꾹 잡고 끌어서 초록으로 빛나는 「✓ 맞음」 칸에 놓아요 · 맞는 온도는 가마 아래 설명 칸에 나와요'); }
        else if (filled) { act('knFire', true, btnWith('불 지피기'), '다 넣었으면 불을 지펴요'); }
      }
    }
    // 2차 튜토리얼 · 의뢰 종류와 받기 → 제작 중 의뢰 확인 → 이벤트 → 연구 (설명 위주)
    var CRAFT = ['Wheel', 'Dry', 'Glaze', 'Kiln', 'KilnOpen'];
    // 2차 튜토리얼 · 이야기 흐름에 맞춰 순서대로 열린다
    // 0 의뢰 받기(카운터) → 1 제작 중 체크리스트 → 2 (채집·「공방에 불을 켜다」 컷신까지 대기) → 3 진열과 와장창 → 4 의뢰의 종류 → 5 연구
    var T2 = [
      { id: 'quest', goal: '이야기 의뢰 받기', go: 'Counter', pages: ['Counter'], ic: '📜', body: '할머니를 찾아온 손님들이 그릇을 부탁해요.\n\n📖 공방 이야기 · 단골 손님의 사연을 따라 순서대로 열려요.\n카운터에서 이야기를 듣고 의뢰를 받으면 의뢰 내역서에 적혀요.' },
      { id: 'track', goal: '제작 중 의뢰 확인하기', go: 'Wheel', pages: ['Wheel', 'Glaze'], passive: true, ic: '📌', body: '받은 의뢰는 의뢰 내역서에 모여요.\n\n📌 제작 안내를 켠 의뢰는 물레·유약 화면 위쪽 체크리스트에 요구 기물과 완성 수가 떠요.\n물레에 들어가면 제작 안내를 켠 의뢰에 맞는 흙과 모양이 자동으로 골라져요.\n다른 걸 빚고 싶으면 흙·목표 버튼으로 바꾸면 돼요.' },
      { id: 'wait', goal: '남은 흙으로 의뢰 만들기', go: 'Counter', pages: [], passive: true, ic: '🍲', body: '' },
      { id: 'display', goal: '명작 진열과 와장창', go: 'Display', pages: ['Display'], ic: '🏺', body: '창고에서 찾은 할머니의 명작 6점과 망작 1점이 보관함에 들어왔어요.\n\n🏺 명작은 꾹 잡고 끌어서 위쪽 진열대에 놓아요. 진열한 작품은 시간당 명성을 올려 줘요.\n🛍️ 진열대에 작품이 올라가 있어야 구경하고 사 가는 판매 손님이 카운터에 찾아와요. 진열대가 비어 있으면 의뢰 손님만 와요.\n💥 망작은 끌어서 와장창 칸에 놓으면 깨지면서 파편을 얻어요. 파편은 연구에 써요.' },
      { id: 'kinds', goal: '새로 오는 손님들', go: 'Counter', pages: ['Counter'], ic: '🔔', body: '공방 문을 열자 새 손님들이 찾아와요.\n\n📖 공방 이야기 · 단골 손님의 사연\n👹 도깨비 이야기 · 지하실 너머 도깨비들의 부탁\n📅 일간·주간 의뢰 · 동네 손님의 짧은 부탁\n🌸 시즌 의뢰 · 기간 한정 이벤트\n🛒 취향 손님 · 진열대를 보고 찾아오는 손님' }
    ]; // 연구는 파편이 100개 모이면 「할머니의 일지」 컷신과 함께 따로 열린다 (resTour)
    var T2LAST = T2.length - 1;
    // 시즌 이벤트 안내 : 시즌 의뢰를 받은 뒤 한 번
    var T3 = { goal: '벚꽃 축제가 열렸어요', go: 'Season', pages: ['Season'], ic: '🌸', body: '벚꽃 축제는 기간 한정 이벤트예요.\n\n🌸 축제 미션을 채우면 꽃잎을 받아요.\n오른쪽 위 꽃잎을 누르면 옥으로 꽃잎을 살 수 있어요.\n꽃잎으로 한정 문양·가구·꽃묵을 교환해요.\n기간이 끝나면 사라지니 남은 기간을 확인하세요.' };
    // 2차 진행 상태는 별도 키에 둔다 (화면 코드가 게임 상태를 통째로 저장해도 지워지지 않게)
    function t2W(o) { try { localStorage.setItem('tut2', JSON.stringify(o)); } catch (e) {} }
    // v3 : 이야기 흐름 순서 · 예전 v2 단계(0 진열 1 의뢰 종류 2 체크리스트 3 납품 대기 4 연구)는 가까운 단계로 옮긴다
    function t2R() { try { var o = JSON.parse(localStorage.getItem('tut2') || 'null'); if (o && typeof o.k === 'number' && o.v !== 3) { var M = { 0: 0, 1: 0, 2: 1, 3: 2, 4: 5, 5: 5 }; if (M[o.k] !== undefined) { o.k = M[o.k]; o.seen = -1; } o.v = 3; t2W(o); } return o; } catch (e) { return null; } }
    function t2Set(k, extra) { var o = t2R() || { k: 0, seen: -1, v: 3 }; o.k = k; o.v = 3; if (extra && extra.tut2Seen !== undefined) { o.seen = extra.tut2Seen; } t2W(o); }
    function tourOn(g) { var o = t2R(); return g.tut === DONE1 && !!o && typeof o.k === 'number' && o.k < T2.length; }
    function tourCard(k, run) {
      var st = T2[k];
      overlay('<div class="ic">' + (window.PotteryShared.ICO || String)(st.ic) + '</div><h3>' + (k + 1) + '/' + T2.length + ' · ' + st.goal + '</h3><p style="text-align:left;word-break:keep-all">' + st.body + '</p>', [
        { label: '확인', run: function () { t2Set(k, { tut2Seen: k }); if (run) { run(); } } },
        { label: '안내 그만 보기', cls: 'sub', run: function () { t2Set(99); var mm = document.querySelector('.tut-mini'); if (mm) { mm.remove(); } } }
      ]);
    }
    function tourDone() { t2Set(99); var mm = document.querySelector('.tut-mini'); if (mm) { mm.remove(); } overlay('<div class="ic">' + (window.PotteryShared.ICO || String)('🏆') + '</div><h3>튜토리얼 완료!</h3><p>이제 공방을 자유롭게 운영해 보세요.\n막히면 설정에서 튜토리얼을 다시 볼 수 있어요.</p>', [{ label: '좋아요' }]); }
    function tourMini(k) {
      var mini = document.querySelector('.tut-mini');
      if (!mini) { mini = document.createElement('button'); mini.type = 'button'; mini.className = 'tut-mini'; mini.setAttribute('aria-label', '튜토리얼 목표 보기'); document.body.appendChild(mini); }
      if (mini.getAttribute('data-t2') !== String(k)) { mini.setAttribute('data-t2', String(k)); mini.innerHTML = '📘<b>' + (k + 1) + '/' + T2.length + '</b>'; mini.onclick = function (e) { e.stopPropagation(); if (!document.querySelector('.tut-ov')) { tourCard(k); } }; }
      placeMini();
    }
    function mainBtn(txt) { return function () { var c = [].slice.call(document.querySelectorAll('button,a[href]')).filter(function (b) { return (b.textContent || '').indexOf(txt) >= 0; }); for (var i = 0; i < c.length; i++) { var p = c[i]; for (var d = 0; d < 7 && p; d++) { p = p.parentElement; if (p && (p.textContent || '').split('제작하러 가기').length > 2) { break; } if (p && (p.textContent || '').indexOf('메인') >= 0) { if (!vis(c[i]) || vis(c[i]).bottom > window.innerHeight - 90) { try { c[i].scrollIntoView({ block: 'center' }); } catch (e) {} } return vis(c[i]) ? c[i] : null; } } } return null; }; }
    function tutGift(g) {
      if (g.tutGift) { return false; }
      var ps = {}; for (var k in (g.pieces || {})) { ps[k] = g.pieces[k]; }
      var order = (g.order || []).slice();
      var G = [
        ['tg1', '백자 달항아리', 'moonjar', 'white', '명작', 24000], ['tg2', '청자 매병', 'maebyeong', 'celadon', '명작', 22000], ['tg3', '천목 다완', 'dawan', 'cheonmok', '명작', 18000],
        ['tg4', '진사 화병', 'vase', 'jinsa', '명작', 16000], ['tg5', '청자 연꽃잔', 'lotuscup', 'celadon', '명작', 14000], ['tg6', '흑유 병', 'bottle', 'black', '명작', 15000],
        ['tg7', '망작 · 일그러진 사발', 'bowl', 'white', '범작', 300]
      ];
      var PRF = { tg1: [[34,52,64,72,76,76,72,64,52,40,32,33], 150], tg2: [[30,32,35,39,44,50,57,62,60,48,24,22], 160], tg3: [[30,42,52,60,66,71,75,78,80,82,83,84], 80], tg4: [[32,40,46,48,46,40,32,26,24,26,32,38], 150], tg5: [[24,26,30,36,44,52,58,62,66,70,74,78], 90], tg6: [[30,40,50,56,58,54,42,28,20,18,20,26], 160], tg7: [[40,58,46,70,62,84,72,98,80,96,88,100], 90] };
      G.forEach(function (a) { ps[a[0]] = { prof: PRF[a[0]][0], H: PRF[a[0]][1], name: a[1], grade: a[4], shape: a[2], glaze: a[3], where: 'store', fresh: true, value: a[5], form: a[4] === '명작' ? 5 : 1, color: a[4] === '명작' ? 5 : 1, clay: 'basic', gift: true }; if (order.indexOf(a[0]) < 0) { order.push(a[0]); } });
      g.pieces = ps; g.order = order; g.tutGift = true; return true;
    }
    function tour(g) {
      var o2 = t2R() || {}, k = o2.k, st = T2[k];
      if (!(tourOn(g) && k === 3 && PAGE === 'Display')) { tlock(false); }
      if (!tourOn(g)) { return; }
      tourMini(k);
      if (document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov')) { return; }
      // 진행 조건
      if (k === 0 && g.mq && (g.mq.acc || (g.mq.i || 0) >= 1)) { t2Set(1); return; }
      if (k <= 2 && g.shopOpen) { t2Set(3); return; }
      if (k === 3) {
        if (tutGift(g)) { save(g); notify(); return; }
        var gi = giftIn(g), shelfN = pieceN(g, ['shelf']);
        if (g.tutGift && !gi.badLive && (gi.store === 0 || shelfN >= 6)) { t2Set(4); return; }
      }
      if (k === 4 && o2.seen === 4) { t2Set(5); return; }
      // 직접 제작·납품하는 동안에는 끌고 가지 않는다 · 단, 의뢰를 막 받은 뒤(1단계)에는 물레까지 안내한다
      if (st.passive && k !== 1 && st.pages.indexOf(PAGE) < 0) { return; }
      if (st.pages.indexOf(PAGE) < 0) {
        if (spotEl) { return; }
        if (k === 1) { // 의뢰를 받은 뒤 : 공방으로 → 물레
          if (PAGE === 'Main') { act('t2go1m', true, linkTo('Wheel'), '「물레」를 눌러 의뢰 기물을 빚으러 가요'); }
          else { act('t2go1', true, function () { return qsel('nav a[href="Main.dc.html"]')() || linkTo('Main')(); }, '공방으로 돌아가서 「물레」를 눌러요'); }
          return;
        }
        act('t2go' + k, true, function () { return linkTo(st.go)() || (st.go === 'Counter' ? null : linkTo('Main')()) || qsel('a[aria-label="공방으로"],a[aria-label="공방으로 돌아가기"]')(); }, (PAGE === 'Main' ? '「' + ({ Counter: '카운터', Display: '진열대' }[st.go] || NAMES[st.go] || st.go) + '」를 눌러 이동해요' : '여기를 눌러 「' + (NAMES[st.go] || st.go) + '」 화면으로 가요'));
        return;
      }
      if (o2.seen !== k && !st.passive) { spotOff(); tourCard(k, k === T2LAST ? function () { setTimeout(tourDone, 200); } : null); return; }
      if (k === 0 && PAGE === 'Counter') {
        var rqT = [].slice.call(document.querySelectorAll('[role=tab]')).filter(function (b) { return (b.textContent || '').indexOf('의뢰 손님') >= 0 && vis(b); })[0];
        if (rqT && rqT.getAttribute('aria-selected') !== 'true') { act('t2tab', true, function () { return rqT; }, '「의뢰 손님」 탭에서 새 의뢰를 받아요'); }
        else if (btnWith('남은 흙만큼만요')() || btnWith('맡을게요')()) { act('t2acc', true, function () { return btnWith('남은 흙만큼만요')() || btnWith('맡을게요')(); }, '버튼을 눌러 의뢰를 받아요'); }
        else { act('t2talk', true, qsel('[aria-label="대화 넘기기"]'), '윤 할매 이야기를 들어요 · 눌러서 대화를 넘겨요'); }
      }
      if (k === 3 && PAGE === 'Display') {
        tlock(true);
        var gj = giftIn(g), shN = pieceN(g, ['shelf']), P2 = g.pieces || {};
        var byName = function (ids) { return function () { var nm = ids.map(function (i) { return P2[i] && (P2[i].where === 'store' || P2[i].where === 'shelf') ? P2[i].name : null; }).filter(Boolean); var c = [].slice.call(document.querySelectorAll('#dstore button[aria-label], #dshelf button[aria-label]')).filter(function (b) { return nm.indexOf(b.getAttribute('aria-label')) >= 0 && vis(b); }); return c[0] || null; }; };
        var stIds = ['tg1', 'tg2', 'tg3', 'tg4', 'tg5', 'tg6'].filter(function (i) { return P2[i] && P2[i].where === 'store'; });
        if (stIds.length && shN < 6) { act('t2ds' + shN, true, byName(stIds), '명작을 꾹 잡고 위 진열대로 끌어서 놓아요 (' + shN + '/6) · 진열해야 판매 손님이 와요'); }
        else if (gj.badLive) { act('t2sm', true, byName(['tg7']), '망작을 꾹 잡고 끌면 💥 와장창 칸이 나타나요 · 거기에 놓아 깨요'); }
      }
      if (k === 1 && (PAGE === 'Wheel' || PAGE === 'Glaze')) {
        var t2a = null; try { t2a = localStorage.getItem('t2auto'); } catch (e) {}
        if (PAGE === 'Wheel' && !t2a) { act('t2auto', true, qsel('button[aria-label^="목표 모양 바꾸기"]'), '📌 제작 안내가 켜져 있으면 의뢰에 맞는 흙과 모양이 자동으로 골라져요 · 지금도 의뢰 기물이 골라져 있어요', function () { try { localStorage.setItem('t2auto', '1'); } catch (e) {} }); return; }
        act('t2trk', true, function () { return qsel('.trk .trk-h')() || qsel('.trk-pill')(); }, '제작 중엔 이 체크리스트로 요구 기물과 완성 수를 확인해요 · 눌러서 펼치고 접어요', function () { t2Set(2); });
      }
    }
    // ── 채집 안내 : 기초 튜토리얼 뒤 처음으로 흙이 다 떨어지면 한 번 ──
    // tutG : 없음 → 1(흙 파기) → r(돌 부수기) → m(메밀묵 안내) → bye(배웅 컷신) → 'done'  (다듬기 단계 2·g 는 삭제 · 예전 저장은 m 으로)
    function gW(v) { try { localStorage.setItem('tutG', String(v)); } catch (e) {} }
    var CLAYK = ['cw1', 'cw2', 'cw3', 'cy1', 'cy2', 'cy3', 'cr1', 'cr2', 'cr3', 'ck1', 'ck2', 'ck3', 'spring'];
    function clayN(g) { var M = g.mats || {}, n = 0; CLAYK.forEach(function (k) { n += M[k] || 0; }); return n; }
    function rawMax(g) { var M = g.mats || {}, b = 0; ['ry', 'rr', 'rw', 'rk'].forEach(function (k) { b = Math.max(b, M[k] || 0); }); return b; }
    function goPage(p) { if (window.__potGo) { window.__potGo(p + '.dc.html'); } else { location.href = p + '.dc.html'; } }
    function gatherTour(g) {
      if (g.tut < DONE1 || document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov') || document.querySelector('.st-ov')) { return; }
      var st = gR();
      if (g.tut !== DONE1 && (!st || st === 'done')) { return; } /* 튜토리얼을 끈 공방(99) : 전시대 「채집」 해금으로 tutG 가 켜진 뒤만 */
      if (st === 'done') { // 예전 저장 : 채집은 끝났는데 아직 공방을 안 열었으면
        var gmD = g.mats || {}, didG = ['ry', 'rr', 'rw', 'rk', 'ow', 'oc', 'ob', 'oj'].some(function (k) { return k in gmD; }) || (g.gather && Object.keys(g.gather).length > 0);
        if (!didG && !g.shopOpen) { gW(''); return; } /* 채집을 한 적 없는데 'done' 이면 지난 진행의 흔적 → 채집 튜토리얼부터 */
        if (!g.shopOpen && PAGE !== 'Gather') { window.PotteryShared.storyPlay('open_shop', function () { var g2 = load(); g2.shopOpen = true; save(g2); notify(); }); }
        return;
      }
      if (!st) {
        if (!(g.unl || {}).gather) { if (!g.shopOpen) { var g5 = load(); g5.shopOpen = true; save(g5); notify(); } return; } /* 상점은 「할머니의 전시대」 컷신 뒤 열림 (예전 저장 보정) */
        if (clayN(g) > 0 || !g.starter3) { return; } // 튜토리얼 끝 선물 흙(starter3)을 받은 뒤부터 센다
        window.PotteryShared.storyPlay('dok_intro', function () { gW(1); if (PAGE !== 'Gather') { goPage('Gather'); } });
        return;
      }
      // 채집 튜토리얼 : 1 흙 파기 → r 돌 부수기 → 2 손 토련 → g 절구질 → m 메밀묵 안내 → 두두리 배웅 → 공방에 불을 켜다
      if (PAGE === 'Gather' && (document.getElementById('gframe') || [].slice.call(document.querySelectorAll('[role=dialog]')).some(function (d) { return vis(d); }))) { return; } // 미니게임·다듬기 중엔 가리지 않는다
      if (PAGE !== 'Gather') { act('tgGo', true, function () { return qsel('nav a[href="Gather.dc.html"]')() || linkTo('Gather')(); }, '「채집」을 눌러 도깨비 골짜기로 가요'); return; }
      var M = g.mats || {}, mx = function (ks) { var b = 0; ks.forEach(function (k) { b = Math.max(b, M[k] || 0); }); return b; };
      var rawC = mx(['ry', 'rr', 'rw', 'rk']), rawG = mx(['ow', 'oc', 'ob', 'oj']), glN = (M.gw1 || 0) + (M.gc1 || 0) + (M.gb1 || 0) + (M.gj1 || 0);
      var tabs = [].slice.call(document.querySelectorAll('[role=tab]')).filter(function (b) { return vis(b); });
      var tabOf = function (t) { return tabs.filter(function (b) { return (b.textContent || '').indexOf(t) >= 0; })[0] || null; };
      var gotoTab = function (t, key, msg) { var tb = tabOf(t); if (tb && tb.getAttribute('aria-selected') !== 'true') { act(key, true, function () { return tb; }, msg); return true; } return false; };
      var mukEl = qsel('[aria-label^="메밀묵 "]');
      var played = function (k) { return k in (((g.gather || {}).best) || {}); };
      var seen = function (k) { try { return !!localStorage.getItem('tutGs_' + k); } catch (e) { return false; } }, mark = function (k) { try { localStorage.setItem('tutGs_' + k, '1'); } catch (e) {} };
      if (st === '1') {
        if (g.tut === DONE1 ? clayN(g) > 0 : played('dig2')) { gW('r'); return; } /* 99 : 흙이 남아 있어도 한 번은 파 보게 */
        if (gotoTab('채집', 'tgTab1', '「채집」 탭으로 가요')) { return; }
        if (!seen('muk0')) { act('tgMuk0', true, mukEl, '🥣 메밀묵은 도깨비 골짜기에 들어가는 값이에요 · 채집 한 판에 한 그릇 · 오늘은 두두리가 그냥 들여보내 줬어요', function () { mark('muk0'); }); return; }
        act('tgDig', true, qsel('button[aria-label="흙 파기 시작"]'), '「흙 파기」로 땅을 파서 흙 원료를 캐요');
        return;
      }
      if (st === 'r') {
        if (g.tut === DONE1 ? glN > 0 : played('rock')) { gW('m'); return; }
        if (gotoTab('채집', 'tgTabR', '「채집」 탭으로 가요')) { return; }
        act('tgRock', true, qsel('button[aria-label="돌 부수기 시작"]'), '이번엔 「돌 부수기」! 돌을 쓸어 부수면 유약 원석이 나와요');
        return;
      }
      if (st === '2' || st === 'g') { gW('m'); return; }
      if (false) {
        var clay = st === '2';
        if (clay && clayN(g) > 0) { gW('g'); return; }
        if (!clay && glN > 0) { gW('m'); return; }
        if (gotoTab('다듬기', 'tgTab' + st, clay ? '원료가 모였어요 · 「다듬기」 탭에서 흙으로 만들어요' : '이번엔 「다듬기」 탭에서 유약 원석을 빻아요')) { return; }
        act('tgRef' + st, true, function () { var c = [].slice.call(document.querySelectorAll('button[aria-label$=" 다듬기"]')).filter(function (b) { var nm = (b.getAttribute('aria-label') || '').replace(' 다듬기', ''); return vis(b) && (clay ? ['황토', '적토', '백토', '흑토'] : ['장석', '철분', '철광', '진사']).indexOf(nm) >= 0 && !/\/5$/.test(b.textContent || ''); }); return c[0] || null; }, clay ? '「손 토련」 · 반죽을 점선 따라 밀어 흙을 만들어요' : '「절구질」 · 바늘이 금색 칸에 올 때 절구를 톡! 유약 원료가 돼요');
        return;
      }
      if (st === 'm') {
        if (gotoTab('채집', 'tgTabM', '「채집」 탭으로 돌아가요')) { return; }
        act('tgMuk1', true, mukEl, '🥣 재료가 부족할 때마다 메밀묵을 두두리에게 주면 채집할 수 있어요 · 묵은 20분마다 한 그릇씩 쑤어져요', function () {
          gW('bye');
          setTimeout(function () {
            window.PotteryShared.storyPlay('dok_bye', function () {
              (load().shopOpen ? function (k0, f0) { f0(); } : window.PotteryShared.storyPlay)('open_shop', function () { var g2 = load(), ga = {}; for (var k in (g2.gather || {})) { ga[k] = g2.gather[k]; } ga.tix = 5; ga.at = Date.now(); g2.gather = ga; g2.shopOpen = true; save(g2); gW('done'); notify(); goPage('Main'); });
            });
          }, 300);
        });
        return;
      }
      if (st === 'bye' && !document.querySelector('.st-ov')) { // 배웅 컷신 중에 닫혔으면 이어서
        window.PotteryShared.storyPlay('dok_bye', function () { (load().shopOpen ? function (k0, f0) { f0(); } : window.PotteryShared.storyPlay)('open_shop', function () { var g2 = load(), ga = {}; for (var k in (g2.gather || {})) { ga[k] = g2.gather[k]; } ga.tix = 5; ga.at = Date.now(); g2.gather = ga; g2.shopOpen = true; save(g2); gW('done'); notify(); goPage('Main'); }); });
      }
    }
    // ── 시즌 이벤트 안내 : 시즌 의뢰를 받은 뒤 한 번 ──
    function seasonTour(g) {
      if (g.tut < DONE1 || document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov') || document.querySelector('.st-ov')) { return; }
      var ev = ''; try { ev = localStorage.getItem('tutEv') || ''; } catch (e) {}
      var evW = function (v) { try { localStorage.setItem('tutEv', v); } catch (e) {} };
      // 벚꽃 의뢰를 받고 두두리 컷신을 본 뒤 : 축제 채집지에서 벚꽃 재 캐기
      if (g.evUnl && !ev) {
        if (PAGE !== 'Gather') { act('evGo', true, function () { return qsel('nav a[href="Gather.dc.html"]')() || linkTo('Gather')(); }, '🌸 「채집」에서 벚꽃 언덕으로 가요'); return; }
        if (document.getElementById('gframe') || [].slice.call(document.querySelectorAll('[role=dialog]')).some(function (d) { return vis(d); })) { return; }
        var tg = [].slice.call(document.querySelectorAll('[role=tab]')).filter(function (b) { return vis(b) && (b.textContent || '').indexOf('채집') >= 0; })[0];
        if (tg && tg.getAttribute('aria-selected') !== 'true') { act('evTab', true, function () { return tg; }, '「채집」 탭으로 가요'); return; }
        act('evSite', true, function () { var box = qsel('[aria-label="축제 채집지"]')(); if (!box) { return null; } var b2 = [].slice.call(box.querySelectorAll('button')).filter(function (b) { return vis(b); }); return b2[1] || b2[0] || box; }, '🌸 벚꽃 언덕 「돌 부수기」에서 벚꽃 재를 모아요 · 꽃묵 🌸 한 그릇이 들어요 · 벚꽃 재로 벚꽃유를 발라요', function () { evW('1'); });
        return;
      }
      // 벚꽃 의뢰를 납품한 뒤 : 공방의 이벤트 버튼이 열린다
      if ((g.sq && ((g.sq.i || 0) >= 1 || g.sq.thanks)) && ev !== '2') {
        if (PAGE === 'Season') { evW('2'); overlay('<div class="ic">' + (window.PotteryShared.ICO || String)(T3.ic) + '</div><h3>' + T3.goal + '</h3><p style="text-align:left;word-break:keep-all">' + T3.body + '</p>', [{ label: '확인' }]); return; }
        if (PAGE === 'Main') { act('evBtn', true, linkTo('Season'), '🌸 벚꽃 축제가 열렸어요! 「이벤트」를 눌러 봐요'); }
        return;
      }
    }
    // ── 연구 이벤트 : 파편이 100개 모이면 할머니의 일지 → 연구 열림 → 연구 안내 ──
    function resTour(g) {
      if (g.tut < DONE1 || !g.shopOpen || document.querySelector('.tut-ov') || document.querySelector('.jade-ov') || document.querySelector('.sm-ov') || document.querySelector('.st-ov')) { return; }
      var rs = ''; try { rs = localStorage.getItem('tutR') || ''; } catch (e) {}
      var rW = function (v) { try { localStorage.setItem('tutR', v); } catch (e) {} };
      if (!g.resUnl) {
        if (locked(g).Research && (g.unl || {}).research && PAGE !== 'Gather' && CRAFT.indexOf(PAGE) < 0) { window.PotteryShared.storyPlay('research_open', function () { var g2 = load(); g2.resUnl = true; save(g2); rW('1'); notify(); }); }
        return;
      }
      if (rs === 'done' || !rs) { return; }
      if (PAGE !== 'Research') { if (PAGE === 'Main') { act('rsGo', true, function () { return qsel('a[href="Research.dc.html"][aria-label="연구"]')() || linkTo('Research')(); }, '🔬 「연구」를 눌러 파편으로 연구해요'); } else { act('rsGo2', true, function () { return qsel('nav a[href="Main.dc.html"]')() || linkTo('Main')(); }, '공방으로 돌아가서 「연구」를 눌러요'); } return; }
      var node = function () { return [].slice.call(document.querySelectorAll('button[aria-label^="재료 감각"]')).filter(function (b) { return vis(b); })[0] || null; };
      if (!node() && (rs === '1' || rs === '2')) { var mt = [].slice.call(document.querySelectorAll('[role=tab]')).filter(function (b) { return vis(b) && (b.textContent || '').indexOf('재료') === 0; })[0]; if (mt) { act('rsTab', true, function () { return mt; }, '「재료」 계열을 눌러요'); } return; }
      if (rs === '1') { act('rsNode', true, node, '「재료 감각」 연구를 눌러 봐요 · 다듬기에서 흙이 더 잘 나와요', function () { rW('2'); }); return; }
      if (rs === '2') {
        var n0 = node(); if (n0 && n0.getAttribute('aria-pressed') !== 'true') { act('rsNode2', true, node, '「재료 감각」을 눌러요', function () {}); return; }
        if ((g.res || {}).r00) { rW('done'); toast('연구 완료! 깨진 그릇에서도 배울 게 있었어요'); return; }
        act('rsBuy', true, btnWith('연구하기'), '파편을 써서 「연구하기」! 파편은 와장창이나 의뢰 보상으로 모여요', function () { setTimeout(function () { if ((load().res || {}).r00) { rW('done'); } }, 800); });
      }
    }
    function check(first) {
      if (document.querySelector('.sm-ov')) { return; }
      var g = load(), t = g.tut, rw = raw();
      if (typeof t === 'number' && rw.tut !== t) { rw.tut = t; save(rw); notify(); }
      if (typeof t === 'number' && t < STEPS.length) {
        var done = lv(g), nt = t, opened = [];
        while (nt < STEPS.length && done[nt]) { opened = opened.concat(UNL[nt]); nt++; }
        if (nt !== t) {
          var fin = nt >= STEPS.length;
          g.tut = fin ? DONE1 : nt; save(g); if (fin) { t2W({ k: 0, seen: -1, v: 2 }); }
          try { localStorage.setItem('tutCardSeen', String(nt)); } catch (e) {}
          var names = opened.filter(function (p) { return p !== 'KilnOpen' && p !== 'Queue'; }).map(function (p) { return NAMES[p]; });
          var showFin = function () {
            overlay('<div class="ic">' + (window.PotteryShared.ICO || String)((fin ? '🏆' : '🔓')) + '</div><h3>' + (fin ? '기초 튜토리얼 완료!' : '새 기능이 열렸어요') + '</h3><div class="chips">' + names.map(function (n) { return '<i>' + n + '</i>'; }).join('') + '</div><p>' + (fin ? '민 씨 의뢰를 마쳤어요! 모든 기능이 열렸어요.\n이어서 명작 진열과 와장창, 의뢰 받기, 제작 중 의뢰 확인, 연구를 짧게 알려 드릴게요.' : '다음 목표: ' + STEPS[nt].goal + (STEPS[nt].hint ? '\n\n' + STEPS[nt].hint : '')) + '</p>', [{ label: fin ? '좋아요' : '확인', run: function () { try { localStorage.setItem('tutCardSeen', String(nt)); } catch (e) {} if (fin) { setTimeout(function () { tour(load()); }, 300); return; } showCard(load(), false); guideRetry(450, 8); } }]);
          };
          if (fin && window.PotteryShared.storyPlay) { window.PotteryShared.storyPlay('after_min', function () { var g2 = load(); g2.shopOpen = true; save(g2); notify(); showFin(); }); } /* 할머니의 전시대 → 상점 열림 */
          else if (fin) { showFin(); }
          else { /* 중간 단계는 화면을 가리지 않는다 : 목표 칩 갱신 + 짧은 알림 */ toast('🎯 다음 목표 ' + stepNo(nt) + '/' + (STEPS.length - 1) + ' · ' + STEPS[nt].goal + (names.length ? '  (🔓 ' + names.join(', ') + ')' : '')); setTimeout(function () { showCard(load(), false); var mm = document.querySelector('.tut-mini'); if (mm && mm.animate) { mm.animate([{ transform: mm.style.transform + ' scale(1)' }, { transform: mm.style.transform + ' scale(1.35)' }, { transform: mm.style.transform + ' scale(1)' }], { duration: 600, iterations: 2 }); } guideRetry(450, 8); }, 100); }
          notify();
        }
      }
      var L = apply(load());
      if (first && L[PAGE]) {
        overlay('<div class="ic">' + (window.PotteryShared.ICO || String)('🔒') + '</div><h3>아직 잠겨 있어요</h3><p>' + '「' + (NAMES[PAGE] || '이 화면') + '」 화면은 ' + ((load().tut || 0) < STEPS.length ? '튜토리얼을 진행하면 열려요.\n지금 목표: ' + STEPS[load().tut].goal : '이야기를 조금 더 진행하면 열려요.') + '</p>', [{ label: '공방으로', run: function () { if (window.__potGo) { window.__potGo('Main.dc.html'); } else { location.href = 'Main.dc.html'; } } }]);
      }
    }
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) { return; }
      var p = pageOf(a.getAttribute('href')), g = load(), L = locked(g);
      if (p && L[p]) {
        e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
        if ((g.tut || 0) >= STEPS.length) { toast('🔒 아직 열리지 않았어요 · 이야기를 진행하면 열려요'); return; }
        var need = 0; for (var i = 0; i < UNL.length; i++) { if (UNL[i].indexOf(p) >= 0) { need = i; break; } }
        toast('🔒 ' + (NAMES[p] || p) + ' · 「' + STEPS[need].goal + '」를 마치면 열려요');
      }
    }, true);
    // 튜토리얼 조건을 벗어나는 조작은 막고 이유를 알려 준다 (다시 만들어야 하는 상황 방지)
    function offChoice(tg, t) {
      var al = tg.getAttribute('aria-label') || '', dlg = tg.closest('[role=dialog]'), dn = dlg ? dlg.getAttribute('aria-label') || '' : '';
      if (al === '닫기' || /닫기/.test(tg.textContent || '') && !al) { return ''; }
      if (PAGE === 'Wheel' && t === 1 && dn === '목표 모양 고르기' && al && al.indexOf('찻잔') !== 0) { return '민 씨 의뢰는 찻잔이에요 · 찻잔을 골라요'; }
      if (PAGE === 'Wheel' && t === 1 && dn === '흙 고르기' && al && al.indexOf('황토') !== 0) { return '튜토리얼 동안은 황토로 빚어요'; }
      if (PAGE === 'Glaze' && t === 4 && dn === '유약 고르기' && al && al.indexOf('청자') < 0) { return '민 씨는 청자유를 원해요 · 청자유를 골라요'; }
      return '';
    }
    // 목표와 다른 선택지는 흐리게 보여 준다
    // 화면이 다시 그려지면 class가 지워져서 속성 선택자 스타일로 흐리게 한다
    var offSt = document.createElement('style'); document.head.appendChild(offSt);
    var OFFX = ':not([aria-label="닫기"])', OFFS = 'filter:grayscale(1)!important;opacity:.38!important';
    setInterval(function () {
      var g = load(), t = g.tut, css = '';
      if (typeof t === 'number' && t < STEPS.length) {
        if (PAGE === 'Wheel' && t === 1) { css = '[role=dialog][aria-label="목표 모양 고르기"] button[aria-label]:not([aria-label^="찻잔"])' + OFFX + ',[role=dialog][aria-label="흙 고르기"] button[aria-label]:not([aria-label^="황토"])' + OFFX + '{' + OFFS + '}'; }
        if (PAGE === 'Glaze' && t === 4) { css = '[role=dialog][aria-label="유약 고르기"] button[aria-label]:not([aria-label*="청자"])' + OFFX + '{' + OFFS + '}'; }
      }
      if (offSt.textContent !== css) { offSt.textContent = css; }
    }, 400);
    function guard(e) {
      var g = load(), t = g.tut; if (typeof t !== 'number' || t >= STEPS.length) { return; }
      var tg = e.target && e.target.closest ? e.target.closest('button,[role=button],[data-work]') : null; if (!tg) { return; }
      var tx = tg.textContent || '', al = tg.getAttribute('aria-label') || '';
      function stop(msg) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); } toast(msg); }
      if (PAGE === 'Wheel' && t === 1 && tx.indexOf('완성') >= 0 && tx.indexOf('성형 대기로') >= 0) {
        var mt = document.querySelector('[role=meter][aria-label="목표 일치율"]'), pct = mt ? +mt.getAttribute('aria-valuenow') || 0 : 0;
        var tb = qsel('button[aria-label^="목표 모양 바꾸기"]')(), tl = tb ? tb.getAttribute('aria-label') || '' : '';
        if (tb && tl.indexOf('찻잔') < 0) { return stop('의뢰는 찻잔이에요 · 목표 모양을 찻잔으로 바꾼 뒤 완성해요'); }
        if (pct < 100) { return stop('일치율 ' + pct + '% · 튜토리얼에서는 100%가 되어야 완성할 수 있어요 · 안내를 따라 점선에 맞춰 봐요'); }
      }
      // 튜토리얼 목표와 다른 선택지는 고를 수 없다
      var bad = offChoice(tg, t); if (bad) { return stop(bad); }
      if (PAGE === 'Dry' && t === 2 && (tx.indexOf('지금 빼기') >= 0 || tx.indexOf('꺼내기 (위험)') >= 0)) { return stop('아직 반건조예요 · 부채질이나 💎옥으로 완전히 말린 뒤 빼요'); }
      if (PAGE === 'Glaze' && t === 4 && (al.indexOf('도자기를 아래로') === 0 || tx.indexOf('꾹 눌러 담그기') >= 0)) {
        var gb = qsel('button[aria-label^="유약 고르기 · 지금"]')(), gl = gb ? gb.getAttribute('aria-label') || '' : '';
        if (gb && gl.indexOf('청자') < 0) { return stop('민 씨는 청자유를 원해요 · 먼저 유약을 청자유로 바꿔요'); }
      }
      if (PAGE === 'Kiln' && t === 5 && al === '작품 넣기' && qsel('button[aria-label^="작품 넣기 · 맞는 자리"]')()) { return stop('이 칸은 온도가 맞지 않아요 · 초록으로 빛나는 「✓ 맞음」 칸에 넣어요'); }
    }
    ['pointerdown', 'click'].forEach(function (ev) { document.addEventListener(ev, guard, true); });
    window.addEventListener('storage', function () { apply(load()); });
    var g0 = load();
    function settle() { if (PAGE === 'KilnOpen') { return false; } try { var rk = JSON.parse(localStorage.getItem('pottery-proto-v1') || '{}'), sk = window.PotteryShared.qlib.call({}).settleKiln(rk); if (sk) { for (var kk in sk) { rk[kk] = sk[kk]; } localStorage.setItem('pottery-proto-v1', JSON.stringify(rk)); notify(); setTimeout(function () { toast('가마에서 꺼낸 작품을 대기함에 넣었어요'); }, 600); return true; } } catch (e) {} return false; }
    if (settle()) { g0 = load(); }
    setInterval(settle, 1500);
    var mig = null; try { mig = localStorage.getItem('tutMig'); } catch (e) {}
    if (typeof g0.tut === 'number' && g0.tutV !== 2 && mig !== '2') { g0.tut = (g0.tut === 0 && !pieceN(g0)) ? 0 : g0.tut + 1; g0.tutV = 2; save(g0); }
    if (g0.tut === 7 || g0.tut === 8) { g0.tut = DONE1; save(g0); if (!t2R()) { t2W({ k: 0, seen: -1, v: 2 }); } }
    if (PAGE === 'Main' && g0.tut === undefined) {
      overlay('<div class="ic">' + (window.PotteryShared.ICO || String)('🏺') + '</div><h3>도자기 공방에 어서 오세요!</h3><p>할머니가 남긴 작은 공방에서 이야기가 시작돼요.\n손님의 의뢰를 받아 빚고 굽고 납품하며\n새 기능이 차례로 열려요.</p>', [
        { label: '이야기 시작', run: function () { window.PotteryShared.storyPlay('prologue', function () { freshStart(load()); apply(load()); notify(); setTimeout(function () { showCard(load(), true); }, 500); }); } },
        { label: '건너뛰고 모든 기능 열기', cls: 'sub', run: function () { var g = load(); g.tut = 99; save(g); apply(g); } }
      ]);
    } else {
      check(true);
      var gS = load(); try { var sv0 = localStorage.getItem('tutCardSeen'); if (sv0 !== null && +sv0 > gS.tut) { localStorage.removeItem('tutCardSeen'); } } catch (e) {}
      // 화면이 늦게 그려지면 밝힐 곳이 아직 없을 수 있어 몇 번 더 찾아본다
      if (!showCard(gS, false)) { guideRetry(1200, 8); }
    }
    setInterval(function () { check(false); guideMain(load()); guideJade(load()); guideAct(load()); tour(load()); seasonTour(load()); gatherTour(load()); resTour(load()); }, 1000);
  };
  S.sndBoot = function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__sndBooted) { return; }
    window.__sndBooted = true;
    var KEY = 'pottery-proto-v1';
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function vol(k) { var s = load().settings || {}, v = s[k]; return (typeof v === 'number' ? v : (k === 'bgm' ? 70 : 80)) / 100; }
    var ac = null, mB = null, mBF = null, mS = null, rev = null, noiseBuf = null, bgmOn = false, amb = null, clayG = null, clayLvl = 0, motorG = null;
    function mkNoise() { var n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) { d[i] = Math.random() * 2 - 1; } return b; }
    function mkRev() { var n = Math.floor(ac.sampleRate * 2.2), b = ac.createBuffer(2, n, ac.sampleRate); for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); } } var cv = ac.createConvolver(); cv.buffer = b; var g = ac.createGain(); g.gain.value = 0.32; cv.connect(g); g.connect(mB); return cv; }
    function upd() { if (!ac) { return; } var b = vol('bgm'), s = vol('sfx'); mB.gain.setTargetAtTime(0.55 * b * b, ac.currentTime, 0.1); mBF.gain.setTargetAtTime(0.9 * b * b, ac.currentTime, 0.1); mS.gain.setTargetAtTime(0.8 * s * s, ac.currentTime, 0.05); }
    function init() {
      if (ac) { if (ac.state === 'suspended') { try { ac.resume().then(kickBgm, function () {}); } catch (e) {} } kickBgm(); return; }
      var C = window.AudioContext || window.webkitAudioContext; if (!C) { return; }
      try { ac = new C(); } catch (e) { ac = null; return; }
      var comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
      mB = ac.createGain(); mS = ac.createGain(); mBF = ac.createGain(); mB.connect(comp); mS.connect(comp); mBF.connect(ac.destination);
      noiseBuf = mkNoise(); rev = mkRev(); upd();
      startFileBgm(); startAmb();
    }
    function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
    function tone(type, f, t, a, peak, dec, out, f2) { var o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) { o.frequency.exponentialRampToValueAtTime(f2, t + a + dec); } env(g, t, a, peak, dec); o.connect(g); g.connect(out || mS); o.start(t); o.stop(t + a + dec + 0.05); return o; }
    function noise(t, dur, type, f, q, peak, out, f2) { var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) { fl.frequency.exponentialRampToValueAtTime(f2, t + dur); } fl.Q.value = q; env(g, t, 0.005, peak, dur); s.connect(fl); fl.connect(g); g.connect(out || mS); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); }
    function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    // 가야금 느낌의 뜯는 소리 (배경음)
    function pluck(m, t, v) {
      var f = mf(m), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o2.type = 'sine';
      o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      o2.frequency.setValueAtTime(f * 2, t);
      var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + 0.5); lfo.connect(lg); lg.connect(o.frequency);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 1.2);
      env(g, t, 0.006, 0.16 * v, 2.2);
      var g2 = ac.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp);
      o.connect(lp); lp.connect(g); g.connect(mB); g.connect(rev);
      [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + 2.4); });
    }
    function startBgm() {
      if (bgmOn || window.__embedMode) { return; } bgmOn = true;
      var SC = [50, 52, 55, 57, 59, 62, 64, 67, 69, 71, 74];
      var dr = [ac.createOscillator(), ac.createOscillator()], dg = ac.createGain(), dl = ac.createOscillator(), dlg = ac.createGain();
      dr[0].frequency.value = mf(43); dr[1].frequency.value = mf(50); dr[0].type = dr[1].type = 'sine';
      dg.gain.value = 0.035; dl.frequency.value = 0.07; dlg.gain.value = 0.018; dl.connect(dlg); dlg.connect(dg.gain);
      dr.forEach(function (o) { o.connect(dg); o.start(); }); dl.start(); dg.connect(mB);
      var idx = 5, next = ac.currentTime + 0.4, beat = 0.62, bar = 0;
      setInterval(function () {
        if (!ac || ac.state !== 'running') { return; }
        while (next < ac.currentTime + 0.6) {
          bar++;
          if (Math.random() < 0.22) { next += beat * (Math.random() < 0.5 ? 1 : 2); continue; }
          var step = [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)];
          idx = Math.max(1, Math.min(SC.length - 2, idx + step));
          if (idx > 8 && Math.random() < 0.5) { idx -= 2; }
          pluck(SC[idx], next, 0.75 + Math.random() * 0.3);
          if (bar % 8 === 0) { pluck(SC[Math.max(0, idx - 4)] - 12, next, 0.5); }
          if (Math.random() < 0.12) { pluck(SC[idx + 1], next + beat * 0.25, 0.45); }
          next += beat * [1, 1, 1, 1.5, 2, 0.5][Math.floor(Math.random() * 6)];
        }
      }, 200);
    }
    /* 배경음악 파일 (bgm/bgm_키.mp3) · 화면·컷신별 곡, 끝나기 전에 같은 곡을 겹쳐 틀어 끊김 없이 반복, 화면을 옮겨도 이어서 재생 · 파일을 못 읽으면 합성음으로 */
    var PAGE_BGM = { Main: 'main', MainSide: 'main', Queue: 'main', Codex: 'main', Settings: 'main', Resources: 'main', Wheel: 'craft', Dry: 'craft', Glaze: 'craft', Kiln: 'craft', KilnOpen: 'craft', Counter: 'counter', Commission: 'counter', Town: 'counter', Display: 'counter', Gather: 'gather', Shop: 'shop', Research: 'shop', Season: 'festa', Contest: 'festa' };
    var SCENE_BGM = { prologue: 'memory', research_open: 'memory', after_min: 'hope', open_shop: 'hope', ep1_end: 'hope', dok_intro: 'dok', dok_bye: 'dok', sakura_ask: 'festa' };
    /* 곡은 화면을 옮겨도 끝까지 이어서 들려준다 · 한 곡이 끝날 때 지금 화면에 맞는 곡으로 넘어감 · 컷신은 바로 바꾸고 끝나면 듣던 곡·자리로 돌아감 */
    var BF = { cur: null, scene: null, prev: null, ok: false, dead: false, XF: 5 };
    function bgmWant() { return BF.scene || PAGE_BGM[PAGE] || 'main'; }
    function bgmFade(g, to, sec, delay) { try { var t0 = ac.currentTime + (delay || 0); g.gain.cancelScheduledValues(ac.currentTime); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ac.currentTime); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t0); g.gain.linearRampToValueAtTime(Math.max(0.0001, to), t0 + sec); } catch (e) {} }
    function bgmPlayer(key, at, fadeIn, delay) {
      var a = new Audio(), g = ac.createGain(), p = { a: a, g: g, key: key, xf: false };
      a.preload = 'auto'; a.src = 'bgm/bgm_' + key + '.mp3';
      try { var src = ac.createMediaElementSource(a); src.connect(g); g.connect(mBF); } catch (e) { BF.dead = true; return null; }
      g.gain.value = 0.0001;
      a.addEventListener('error', function () { if (!BF.ok && !BF.dead) { BF.dead = true; startBgm(); } });
      a.addEventListener('playing', function () { BF.ok = true; });
      var go = function () { if (at && isFinite(a.duration) && at < a.duration - BF.XF - 1) { try { a.currentTime = at; } catch (e) {} } setTimeout(function () { a.play().catch(function () {}); bgmFade(g, 1, fadeIn || 2); }, (delay || 0) * 1000); };
      if (a.readyState >= 1) { go(); } else { a.addEventListener('loadedmetadata', go, { once: true }); }
      return p;
    }
    function bgmStop(p, fade) {
      if (!p) { return; }
      bgmFade(p.g, 0.0001, fade || 2.5);
      setTimeout(function () { try { p.a.pause(); p.a.removeAttribute('src'); p.a.load(); p.g.disconnect(); } catch (e) {} }, ((fade || 2.5) + 0.4) * 1000);
    }
    /* 곡 바꾸기 : 앞 곡을 천천히 줄이고, 조금 뒤 새 곡을 천천히 올린다 */
    function bgmSwitch(key, at, out, inn, gap) {
      if (!ac || BF.dead) { return; }
      if (BF.cur && BF.cur.key === key) { return; }
      var old = BF.cur; BF.cur = bgmPlayer(key, at, inn || 3, old ? (gap == null ? 1.2 : gap) : 0); bgmStop(old, out || 2.5);
    }
    function kickBgm() { var c = BF.cur; if (!c || !c.a.paused || BF.dead) { return; } c.a.play().catch(function () {}); bgmFade(c.g, 1, 1.5); }
    function startFileBgm() {
      if (window.__embedMode) { return; } /* 공방 확대 화면(iframe) 안에서는 배경음악을 겹쳐 틀지 않는다 */
      var key = bgmWant(), at = 0;
      try { var sp = JSON.parse(sessionStorage.getItem('bgmPos') || 'null'); if (sp && sp.k) { key = sp.k; at = sp.t || 0; } } catch (e) {}
      if (!BF.dead) { BF.cur = bgmPlayer(key, at, at ? 1.2 : 2.5, 0); }
      setInterval(function () {
        var c = BF.cur; if (!c || BF.dead || !ac || ac.state !== 'running') { return; }
        var d = c.a.duration;
        if (!c.xf && isFinite(d) && d > 20 && c.a.currentTime > d - BF.XF) { c.xf = true; var nk = bgmWant(); var n = bgmPlayer(nk, 0, BF.XF, nk === c.key ? 0 : 1.5); if (n) { BF.cur = n; bgmStop(c, BF.XF); } }
      }, 200);
      var savePos = function () { try { var c = (BF.prev && BF.scene) || BF.ret ? null : BF.cur; if (BF.ret) { sessionStorage.setItem('bgmPos', JSON.stringify({ k: BF.ret.k, t: BF.ret.t })); } else if (c) { sessionStorage.setItem('bgmPos', JSON.stringify({ k: c.key, t: c.a.currentTime || 0 })); } else if (BF.prev) { sessionStorage.setItem('bgmPos', JSON.stringify({ k: BF.prev.k, t: BF.prev.t })); } } catch (e) {} };
      window.addEventListener('pagehide', savePos); window.addEventListener('beforeunload', savePos); setInterval(savePos, 1000);
    }
    window.__bgmState = function () { return { key: BF.cur && BF.cur.key, ok: BF.ok, dead: BF.dead, t: BF.cur ? BF.cur.a.currentTime : 0, paused: BF.cur ? BF.cur.a.paused : null, ac: ac && ac.state }; };
    window.__bgmSeek = function (t) { if (BF.cur) { BF.cur.a.currentTime = t < 0 ? BF.cur.a.duration + t : t; } };
    window.__bgmScene = function (id) {
      var k = (id && SCENE_BGM[id]) || null;
      if (!ac || BF.dead) { BF.scene = k; return; }
      if (k) { if (!BF.scene && BF.cur) { BF.prev = { k: BF.cur.key, t: BF.cur.a.currentTime || 0 }; } BF.scene = k; bgmSwitch(k, 0, 2, 2.5, 0.8); return; }
      if (!BF.scene) { return; }
      BF.scene = null; var pv = BF.prev; BF.prev = null; BF.ret = pv;
      setTimeout(function () { BF.ret = null; if (BF.scene) { if (pv) { BF.prev = pv; } return; } if (pv) { bgmSwitch(pv.k, pv.t, 2.5, 3, 1); } }, 400); /* 컷신이 이어지면 돌아가지 않는다 */
    };
    // 장면별 배경 효과 (가마 불 소리, 물레 모터)
    function firing() { var g = load(); if (PAGE === 'Bisque') { return (g.bisque || {}).state === 'firing'; } if (PAGE === 'Kiln' || PAGE === 'KilnOpen') { return g.kiln === 'firing'; } return false; }
    function startAmb() {
      if (PAGE === 'Bisque' || PAGE === 'Kiln' || PAGE === 'KilnOpen') {
        var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = 'lowpass'; fl.frequency.value = 380; g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(mS); s.start(); amb = g;
        setInterval(function () {
          if (!ac || ac.state !== 'running') { return; }
          var on = firing(); amb.gain.setTargetAtTime(on ? 0.05 : 0, ac.currentTime, 0.4);
          if (on) { var t = ac.currentTime; for (var i = 0; i < 3; i++) { if (Math.random() < 0.55) { noise(t + Math.random() * 0.35, 0.02 + Math.random() * 0.03, 'bandpass', 1500 + Math.random() * 2500, 2, 0.05 + Math.random() * 0.08); } } }
        }, 400);
      }
      if (PAGE === 'Wheel') {
        var o = ac.createOscillator(), lp = ac.createBiquadFilter(); motorG = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 52; lp.type = 'lowpass'; lp.frequency.value = 160; motorG.gain.value = 0.018; o.connect(lp); lp.connect(motorG); motorG.connect(mS); o.start();
        var cs = ac.createBufferSource(), cf = ac.createBiquadFilter(); clayG = ac.createGain(); cs.buffer = noiseBuf; cs.loop = true; cf.type = 'bandpass'; cf.frequency.value = 520; cf.Q.value = 0.9; clayG.gain.value = 0; cs.connect(cf); cf.connect(clayG); clayG.connect(mS); cs.start();
        setInterval(function () { if (!ac) { return; } clayLvl *= 0.6; clayG.gain.setTargetAtTime(Math.min(0.16, clayLvl), ac.currentTime, 0.05); }, 60);
      }
    }
    var FX = {
      tap: function (t) { tone('triangle', 640, t, 0.002, 0.11, 0.07, null, 420); noise(t, 0.025, 'bandpass', 2400, 3, 0.05); },
      ok: function (t) { [67, 71, 74, 79].forEach(function (m, i) { tone('sine', mf(m), t + i * 0.09, 0.004, 0.16, 0.9); tone('sine', mf(m) * 2.76, t + i * 0.09, 0.002, 0.03, 0.35); }); },
      unlock: function (t) { [62, 67, 71, 74, 79, 83].forEach(function (m, i) { tone('sine', mf(m), t + i * 0.07, 0.004, 0.14, 1.2); tone('triangle', mf(m) * 2, t + i * 0.07, 0.003, 0.03, 0.5); }); },
      fail: function (t) { noise(t, 0.5, 'lowpass', 900, 0.7, 0.35, null, 120); tone('sine', 160, t, 0.005, 0.3, 0.45, null, 55); },
      coin: function (t) { tone('square', 1318, t, 0.002, 0.06, 0.08); tone('square', 1760, t + 0.07, 0.002, 0.06, 0.28); tone('sine', 2637, t + 0.07, 0.002, 0.05, 0.3); },
      jade: function (t) { [84, 88, 91, 96].forEach(function (m, i) { tone('sine', mf(m), t + i * 0.05, 0.002, 0.07, 0.5); }); noise(t, 0.4, 'highpass', 6000, 0.5, 0.05); },
      whoosh: function (t) { noise(t, 0.32, 'bandpass', 300, 1.2, 0.22, null, 1400); },
      hiss: function (t) { noise(t, 0.7, 'highpass', 3000, 0.5, 0.18, null, 1200); tone('sine', 220, t, 0.01, 0.1, 0.4, null, 110); },
      smash: function (t) { noise(t, 0.09, 'lowpass', 1800, 0.7, 0.55); noise(t, 0.6, 'highpass', 2500, 0.6, 0.3, null, 5000); for (var i = 0; i < 9; i++) { var tt = t + 0.04 + Math.random() * 0.45; tone('sine', 2800 + Math.random() * 3800, tt, 0.001, 0.04 + Math.random() * 0.05, 0.08 + Math.random() * 0.12); } tone('sine', 120, t, 0.003, 0.4, 0.25, null, 50); },
      splash: function (t) { noise(t, 0.35, 'bandpass', 900, 1.5, 0.22, null, 350); for (var i = 0; i < 4; i++) { tone('sine', 500 + Math.random() * 600, t + 0.05 + i * 0.05, 0.003, 0.05, 0.08, null, 1200); } },
      drip: function (t) { for (var i = 0; i < 3; i++) { tone('sine', 900 + i * 180, t + i * 0.14, 0.002, 0.06, 0.09, null, 1700); } },
      ignite: function (t) { noise(t, 0.9, 'lowpass', 200, 0.8, 0.4, null, 1200); tone('sine', 80, t, 0.05, 0.2, 0.8, null, 60); },
      shake: function (t) { for (var i = 0; i < 4; i++) { noise(t + i * 0.12, 0.05, 'bandpass', 700, 3, 0.15); } },
      reveal: function (t) { tone('sine', mf(79), t, 0.003, 0.15, 0.7); tone('sine', mf(86), t + 0.08, 0.003, 0.12, 0.8); },
      rare: function (t) { FX.unlock(t); noise(t, 1.2, 'highpass', 7000, 0.5, 0.08); },
      meow: function (t) { var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), p = 0.9 + Math.random() * 0.25; o.type = 'sawtooth'; o.frequency.setValueAtTime(480 * p, t); o.frequency.linearRampToValueAtTime(820 * p, t + 0.16); o.frequency.exponentialRampToValueAtTime(430 * p, t + 0.55); f.type = 'bandpass'; f.Q.value = 2.2; f.frequency.setValueAtTime(800, t); f.frequency.linearRampToValueAtTime(1700, t + 0.18); f.frequency.linearRampToValueAtTime(900, t + 0.55); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.05); g.gain.setValueAtTime(0.22, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(f); f.connect(g); g.connect(mS); o.start(t); o.stop(t + 0.65); },
      dot: function (t, k) { var st = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31], m = 72 + st[Math.min(st.length - 1, k || 0)]; tone('sine', mf(m), t, 0.002, 0.07, 0.12); tone('triangle', mf(m) * 2, t, 0.002, 0.02, 0.06); },
      type: function (t) { tone('triangle', 820 + Math.random() * 160, t, 0.001, 0.025, 0.035, null, 600); }, // 글자가 나올 때 톡톡
      hOk: function (t) { tone('sine', mf(72), t, 0.003, 0.12, 0.5); tone('sine', mf(79), t + 0.09, 0.003, 0.14, 0.6); }, // 성형 · 높이 맞음 (낮은 2음)
      sOk: function (t) { [76, 81, 84].forEach(function (m, i) { tone('triangle', mf(m), t + i * 0.07, 0.003, 0.09, 0.45); }); }, // 성형 · 좌우 맞음 (밝은 3음)
      tOk: function (t) { tone('sine', mf(88), t, 0.002, 0.08, 0.9); tone('sine', mf(95), t + 0.05, 0.002, 0.06, 1.1); noise(t, 0.3, 'highpass', 6500, 0.6, 0.05); }, // 성형 · 두께 맞음 (맑은 종소리)
      pop: function (t) { tone('triangle', 380, t, 0.003, 0.16, 0.12, null, 900); noise(t, 0.08, 'bandpass', 1200, 1.5, 0.12); },
      thud: function (t) { tone('sine', 140, t, 0.003, 0.3, 0.18, null, 70); noise(t, 0.06, 'lowpass', 600, 0.7, 0.2); },
      /* 등급 공개 전용 : 도장 쾅 + 등급별 화음 */
      gPlain: function (t) { FX.thud(t); noise(t, 0.05, 'bandpass', 900, 2, 0.25); tone('triangle', mf(67), t + 0.12, 0.004, 0.2, 0.35); tone('triangle', mf(72), t + 0.12, 0.004, 0.16, 0.35); },
      gGood: function (t) { FX.thud(t); [72, 76, 79, 84].forEach(function (m, i) { tone('sine', mf(m), t + 0.1 + i * 0.08, 0.003, 0.18, 0.8); tone('triangle', mf(m) * 2, t + 0.1 + i * 0.08, 0.002, 0.04, 0.4); }); noise(t + 0.3, 0.6, 'highpass', 7000, 0.5, 0.06); },
      gMaster: function (t) { tone('sine', 70, t, 0.002, 0.5, 0.6, null, 45); noise(t, 0.12, 'lowpass', 500, 0.8, 0.5); [60, 64, 67, 72, 76, 79, 84, 88].forEach(function (m, i) { tone('sine', mf(m), t + 0.12 + i * 0.065, 0.003, 0.2, 1.4); tone('triangle', mf(m) * 2, t + 0.12 + i * 0.065, 0.002, 0.05, 0.8); }); [72, 76, 79].forEach(function (m) { tone('sine', mf(m), t + 0.75, 0.01, 0.16, 1.8); }); noise(t + 0.2, 1.6, 'highpass', 7500, 0.5, 0.1); }
    };
    window.__sfx = function (n, k) { try { init(); if (!ac || !FX[n]) { return; } FX[n](ac.currentTime + 0.01, k); } catch (e) {} };
    window.__clay = function (a) { clayLvl += Math.min(0.08, a * 0.012); };
    var lastTap = 0;
    document.addEventListener('pointerdown', function (e) {
      init();
      var el = e.target && e.target.closest ? e.target.closest('button,a,[role=button],[onclick]') : null;
      if (el && !el.closest('[data-work]') && Date.now() - lastTap > 60) { lastTap = Date.now(); window.__sfx('tap'); }
    }, true);
    document.addEventListener('keydown', function () { init(); }, true);
    setTimeout(function () { try { init(); } catch (e) {} }, 300);
    // 저장 데이터 변화로 공통 효과음 (골드 증가 · 옥 사용 · 튜토리얼 해금)
    var prev = load();
    setInterval(function () {
      upd();
      var g = load();
      if ((g.gold || 0) > (prev.gold || 0)) { window.__sfx('coin'); }
      if ((g.jade || 0) < (prev.jade || 0)) { window.__sfx('jade'); }
      if (typeof g.tut === 'number' && typeof prev.tut === 'number' && g.tut > prev.tut) { window.__sfx('unlock'); }
      prev = g;
    }, 300);
  };
  // 기울여 담근 유약 경계 · it.covAng(0 = 굽부터 세워서 · 180 = 입구부터 뒤집어서 · 그 사이는 비스듬히) + it.cov(담근 비율)
  // 0°·180°는 기존 곡선 경계, 나머지는 기울기 방향을 따라 곧은 사선 경계 + 경계 쪽 진한 띠
  S.covAngOf = function (it) {
    var a = it && it.covAng != null ? +it.covAng : (it && it.covDir === 'foot' ? 0 : 180); a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a;
  };
  // 덧시유 : 첫 층 채색 위에 두 번째 층(it.g2col · it.cov2 · it.ang2)을 반투명으로 겹친 패턴 하나로 칠한다
  S.covFillAng = function (glz, clay, it, geo) {
    var self0 = this;
    var f0 = this.covFillTwo(glz, clay, it, geo);
    if (!it || !it.brush || !it.brush.length) { return f0; }
    try { /* 붓 무늬 : 유약 위에 그린 선을 그릇 좌표 그대로 겹쳐 칠한다 */
      var key = JSON.stringify(it.brush), h = 0;
      for (var i = 0; i < key.length; i++) { h = (h * 31 + key.charCodeAt(i)) | 0; }
      var pid = 'cvb_' + String(f0).replace(/[^a-zA-Z0-9_]/g, '') + '_' + (h >>> 0).toString(36) + (it.sk === 'slab' && !window.__slabSide ? 'q' : '');
      if (!document.getElementById(pid)) {
        var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
        if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
        var defs = host.querySelector('defs') || host.firstChild || host;
        var pt = document.createElementNS(NS, 'pattern'); pt.setAttribute('id', pid); pt.setAttribute('patternUnits', 'userSpaceOnUse'); pt.setAttribute('x', '-2000'); pt.setAttribute('y', '-2000'); pt.setAttribute('width', '4000'); pt.setAttribute('height', '4000');
        var gw = document.createElementNS(NS, 'g'); gw.setAttribute('transform', 'translate(2000 2000)');
        var rc = document.createElementNS(NS, 'rect'); rc.setAttribute('x', '-2000'); rc.setAttribute('y', '-2000'); rc.setAttribute('width', '4000'); rc.setAttribute('height', '4000'); rc.setAttribute('fill', f0); gw.appendChild(rc);
        it.brush.forEach(function (b) { if (!b || !b.p) { return; } var pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', it.sk === 'slab' && it.poly && !window.__slabSide && self0.slabBrushXf ? self0.slabBrushXf(it, String(b.p)) : String(b.p)); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke', String(b.c || '#3A2A20')); pa.setAttribute('stroke-width', String(b.w || 4)); pa.setAttribute('stroke-linecap', 'round'); pa.setAttribute('stroke-linejoin', 'round'); pa.setAttribute('opacity', '.92'); gw.appendChild(pa); });
        pt.appendChild(gw); defs.appendChild(pt);
      }
      return 'url(#' + pid + ')';
    } catch (e) { return f0; }
  };
  S.covFillTwo = function (glz, clay, it, geo) {
    var f = this.covFillOne(glz, clay, it, geo), self = this; if (!it) { return f; }
    /* 덧시유 층을 아래부터 차례로 겹친다 : gx(예전 덧시유들) → g2(맨 위) · 횟수 제한 없음 */
    var L = (it.gx || []).map(function (x) { return { g2: x.g, g2col: x.c, cov2: x.cov, ang2: x.ang }; }).concat(it.g2 && it.g2col ? [{ g2: it.g2, g2col: it.g2col, cov2: it.cov2, ang2: it.ang2 }] : []);
    L.forEach(function (l) { if (l.g2col) { f = self.covLayer(f, l, geo); } });
    return f;
  };
  S.covLayer = function (base, it, geo) {
    try {
      var a2 = it.ang2 != null ? +it.ang2 : 180, c2 = Math.max(0.02, Math.min(1, it.cov2 != null ? it.cov2 : 0.5)), rad = a2 * Math.PI / 180, nx = Math.sin(rad), ny = Math.cos(rad), r = geo.r, n = r.length, H = geo.H, lo = 1e9, hi = -1e9;
      for (var i = 0; i < n; i++) { var y = -H * i / (n - 1); for (var sg = -1; sg <= 1; sg += 2) { var d = sg * r[i] * nx + y * ny; if (d < lo) { lo = d; } if (d > hi) { hi = d; } } }
      var f = (hi - c2 * (hi - lo) - lo) / Math.max(1, hi - lo), col = it.g2col, gid = 'cv2_' + String(col).replace('#', '') + '_' + Math.round(a2) + '_' + Math.round(c2 * 100) + '_' + Math.round(H) + '_' + Math.round(r[0]) + '_' + Math.round(r[n - 1]);
      var pid = 'cvp_' + String(base).replace(/[^a-zA-Z0-9_]/g, '') + '_' + gid;
      if (!document.getElementById(pid)) {
        var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
        if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
        var defs = host.querySelector('defs') || host.firstChild || host;
        if (!document.getElementById(gid)) {
          var lg = document.createElementNS(NS, 'linearGradient'); lg.setAttribute('id', gid); lg.setAttribute('gradientUnits', 'userSpaceOnUse');
          lg.setAttribute('x1', (nx * lo).toFixed(2)); lg.setAttribute('y1', (ny * lo).toFixed(2)); lg.setAttribute('x2', (nx * hi).toFixed(2)); lg.setAttribute('y2', (ny * hi).toFixed(2));
          [[0, 0], [f - 0.006, 0], [f + 0.004, 0.95], [f + 0.05, 0.95], [f + 0.08, 0.8], [1, 0.8]].forEach(function (p) { var st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', Math.max(0, Math.min(1, p[0])).toFixed(4)); st.setAttribute('stop-color', col); st.setAttribute('stop-opacity', String(p[1])); lg.appendChild(st); });
          defs.appendChild(lg);
        }
        var pt = document.createElementNS(NS, 'pattern'); pt.setAttribute('id', pid); pt.setAttribute('patternUnits', 'userSpaceOnUse'); pt.setAttribute('x', '-2000'); pt.setAttribute('y', '-2000'); pt.setAttribute('width', '4000'); pt.setAttribute('height', '4000');
        var gw = document.createElementNS(NS, 'g'); gw.setAttribute('transform', 'translate(2000 2000)'); /* 타일 원점(-2000)을 되돌려 그릇 좌표 그대로 칠한다 */
        [base, 'url(#' + gid + ')'].forEach(function (fl) { var rc = document.createElementNS(NS, 'rect'); rc.setAttribute('x', '-2000'); rc.setAttribute('y', '-2000'); rc.setAttribute('width', '4000'); rc.setAttribute('height', '4000'); rc.setAttribute('fill', fl); gw.appendChild(rc); });
        pt.appendChild(gw);
        defs.appendChild(pt);
      }
      return 'url(#' + pid + ')';
    } catch (e) { return base; }
  };
  S.covFillOne = function (glz, clay, it, geo) {
    var a = this.covAngOf(it), c = Math.max(0.02, Math.min(1, it.cov)), ab = Math.abs(a);
    if (ab === 180) { return this.covFill(glz, clay, 1 - c, { H: geo.H, r: geo.r, cov: c, drip: geo.drip }); }
    if (ab === 0) { return this.covFill(clay, glz, c, { H: geo.H, r: geo.r, cov: 1 - c, drip: clay }); }
    try {
      var rad = a * Math.PI / 180, nx = Math.sin(rad), ny = Math.cos(rad), r = geo.r, n = r.length, H = geo.H, lo = 1e9, hi = -1e9;
      for (var i = 0; i < n; i++) { var y = -H * i / (n - 1); [r[i], -r[i]].forEach(function (x) { var d = x * nx + y * ny; if (d < lo) { lo = d; } if (d > hi) { hi = d; } }); }
      var sb = hi - c * (hi - lo), f = (sb - lo) / Math.max(1, hi - lo), band = Math.min(0.06, 0.02 + c * 0.03), drip = geo.drip || glz;
      var id = 'cva_' + String(glz).replace('#', '') + '_' + String(clay).replace('#', '') + '_' + Math.round(a) + '_' + Math.round(c * 100) + '_' + Math.round(H) + '_' + Math.round(r[0]) + '_' + Math.round(r[n - 1]);
      if (!document.getElementById(id)) {
        var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
        if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
        var lg = document.createElementNS(NS, 'linearGradient'); lg.setAttribute('id', id); lg.setAttribute('gradientUnits', 'userSpaceOnUse');
        lg.setAttribute('x1', (nx * lo).toFixed(2)); lg.setAttribute('y1', (ny * lo).toFixed(2)); lg.setAttribute('x2', (nx * hi).toFixed(2)); lg.setAttribute('y2', (ny * hi).toFixed(2));
        [[0, clay], [f - 0.006, clay], [f + 0.004, drip], [f + band, drip], [f + band + 0.03, glz], [1, glz]].forEach(function (p) { var st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', Math.max(0, Math.min(1, p[0])).toFixed(4)); st.setAttribute('stop-color', p[1]); lg.appendChild(st); });
        (host.querySelector('defs') || host.firstChild || host).appendChild(lg);
      }
      return 'url(#' + id + ')';
    } catch (e) { return glz; }
  };
  // 대기함 끌어 놓기 · 진열대와 같은 방식 (그릇 그림이 손가락을 따라오고, 놓을 곳이 빛난다)
  // o = { target(x, y) → 놓을 요소 | null, drop(el), miss(x, y)?, start()? }
  S.trayDrag = function (e, o) {
    if (!e || (e.button !== undefined && e.button !== 0)) { return; }
    var src = e.currentTarget, x0 = e.clientX, y0 = e.clientY, on = false, ghost = null, over = null, oldBs = '', oldBg = '';
    function hl(c) {
      if (over === c) { return; }
      if (over) { over.style.boxShadow = oldBs; over.style.transform = ''; if (o.tint) { over.style.background = oldBg; } }
      over = c;
      if (c) { oldBs = c.style.boxShadow; if (o.tint) { oldBg = c.style.background; c.style.background = o.tint; } c.style.boxShadow = '0 0 0 4px #FFD66B,0 0 18px 4px rgba(255,214,107,.85)'; c.style.transform = 'scale(1.04)'; }
    }
    function mv(ev) {
      if (!on && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) { return; }
      if (!on) {
        on = true;
        var sv = src.querySelector('svg');
        ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;z-index:9990;pointer-events:none;width:68px;height:68px;margin:-56px 0 0 -34px;filter:drop-shadow(0 6px 4px rgba(0,0,0,.45));transform:scale(1.1)';
        if (sv) { var c2 = sv.cloneNode(true); c2.setAttribute('width', '68'); c2.setAttribute('height', '68'); ghost.appendChild(c2); }
        document.body.appendChild(ghost);
        src.style.opacity = '.3';
        if (o.start) { o.start(); }
        try { window.__sfx && window.__sfx('tap'); } catch (e2) {}
      }
      if (ev.cancelable) { ev.preventDefault(); }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      hl(o.target(ev.clientX, ev.clientY));
    }
    function up(ev) {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (!on) { return; }
      window.__potDragEnd = Date.now();
      if (ghost) { ghost.remove(); } src.style.opacity = ''; var t = ev.type === 'pointercancel' ? null : o.target(ev.clientX, ev.clientY); hl(null);
      if (t) { o.drop(t); } else if (o.miss && ev.type !== 'pointercancel') { o.miss(ev.clientX, ev.clientY); }
    }
    window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  // 화면 좌표가 요소 안인지
  S.ptIn = function (el, x, y) {
    if (!el) { return false; } var r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  // 도자기 질감 · 흙/유약별 결(회색 텍스처)을 soft-light 로 얹고, 일부만 바른 유약은 경계에 흘러내림 스티커
  // potTex(it, H, r) → { fill, op, dX, dY, dW, dH, dMask, dCol, dOp }
  S.potTex = function (it, H, r) {
    var c = this.__ptc || (this.__ptc = {}), key = it ? [it.id || '', it.clay, it.glaze, it.cov, H, (r || []).length].join('|') : '';
    if (c.k === key && c.v) { return c.v; }
    var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
    if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
    function defImg(id, mk) { if (!document.getElementById(id)) { host.firstChild.appendChild(mk()); } return 'url(#' + id + ')'; }
    var GT = { white: 'glaze_white', celadon: 'glaze_celadon', black: 'glaze_black', cheonmok: 'glaze_black', jinsa: 'glaze_copper_red', sakura: 'glaze_cherry' };
    var CT = { cy: 'clay_yellow', cw: 'clay_white', cr: 'clay_red', ck: 'clay_black' };
    var gl = it && it.glaze && it.glaze !== 'none' ? it.glaze : '', cov = it && it.cov != null ? it.cov : 1, part = gl && cov < 0.97;
    var tk = gl && !part ? (GT[gl] || 'glaze_white') : (CT[String((it && it.clay) || 'cy').slice(0, 2)] || 'clay_yellow');
    var fill = defImg('ptx_' + tk, function () { var pt = document.createElementNS(NS, 'pattern'); pt.setAttribute('id', 'ptx_' + tk); pt.setAttribute('patternUnits', 'userSpaceOnUse'); pt.setAttribute('width', '64'); pt.setAttribute('height', '64'); var im = document.createElementNS(NS, 'image'); im.setAttribute('href', 'ui/tex_' + tk + '.webp'); im.setAttribute('width', '64'); im.setAttribute('height', '64'); im.setAttribute('preserveAspectRatio', 'none'); pt.appendChild(im); return pt; });
    var v = { fill: fill, op: gl && !part ? 0.75 : 0.85, dX: 0, dY: 0, dW: 0, dH: 0, dMask: 'none', dCol: 'none', dOp: 0 };
    if (part && r && r.length > 2 && H) {
      var n = r.length, u = (1 - cov) * (n - 1), lo = Math.floor(u), hi = Math.min(n - 1, lo + 1), rh = r[lo] + (r[hi] - r[lo]) * (u - lo), e = Math.max(3, rh * 0.24), yb = -H * (1 - cov) + e;
      var h0 = 0; String((it && it.id) || (it && it.prof || []).join(',')).split('').forEach(function (ch) { h0 = (h0 * 31 + ch.charCodeAt(0)) % 997; });
      var D = [['drip_short', 122 / 256], ['drip_double', 141 / 256], ['drip_long', 214 / 256]][h0 % 3];
      var w = Math.min(rh * 1.1, 90), hgt = w * D[1], room = H * (1 - cov); hgt = Math.min(hgt, Math.max(4, room * 0.8)); w = hgt / D[1];
      var mk = defImg('pdm_' + D[0], function () { var m = document.createElementNS(NS, 'mask'); m.setAttribute('id', 'pdm_' + D[0]); m.setAttribute('maskContentUnits', 'objectBoundingBox'); var im = document.createElementNS(NS, 'image'); im.setAttribute('href', 'ui/' + D[0] + '.webp'); im.setAttribute('width', '1'); im.setAttribute('height', '1'); im.setAttribute('preserveAspectRatio', 'none'); m.appendChild(im); return m; });
      v.dX = -w / 2 + ((h0 % 7) - 3) * rh * 0.05; v.dY = yb - hgt * 0.32; v.dW = w; v.dH = hgt; v.dMask = mk; v.dCol = (it && it.__dripCol) || '#000'; v.dOp = 1;
    }
    c.k = key; c.v = v; return v;
  };
  // 유약 경계를 타원(앞쪽이 아래로 휜 곡선)으로 · 경계 바로 위는 흘러내려 고인 진한 띠
  // geo = { H, r(윤곽 반지름 배열 · 굽→입구), cov(입구에서부터 담근 비율), drip(진한 유약 빛) }
  S.covFillE = function (top, bot, geo) {
    try {
      var c0 = Math.max(0.02, Math.min(1, geo.cov)), H = geo.H, r = geo.r, n = r.length, u = (1 - c0) * (n - 1), lo = Math.floor(u), hi = Math.min(n - 1, lo + 1);
      var rh = r[lo] + (r[hi] - r[lo]) * (u - lo), yb = -H * (1 - c0), e = Math.max(3, rh * 0.24), K = H * 3, B = K + e, A = rh / Math.sqrt(1 - (K / B) * (K / B)), cy = yb - K;
      var band = Math.min(H * 0.09, 3 + H * 0.03 + c0 * H * 0.03), drip = geo.drip || top;
      var id = 'cve_' + String(top).replace('#', '') + '_' + String(bot).replace('#', '') + '_' + Math.round(c0 * 100) + '_' + Math.round(H) + '_' + Math.round(rh);
      if (!document.getElementById(id)) {
        var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
        if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
        var rg = document.createElementNS(NS, 'radialGradient'); rg.setAttribute('id', id); rg.setAttribute('gradientUnits', 'userSpaceOnUse');
        rg.setAttribute('cx', '0'); rg.setAttribute('cy', cy.toFixed(2)); rg.setAttribute('r', B.toFixed(2)); rg.setAttribute('fx', '0'); rg.setAttribute('fy', cy.toFixed(2));
        rg.setAttribute('gradientTransform', 'scale(' + (A / B).toFixed(4) + ' 1)');
        var o1 = 1 - band / B, o2 = 1 - band * 0.35 / B;
        [[0, top], [o1, top], [o2, drip], [0.9985, drip], [1, bot]].forEach(function (p) { var st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', Math.max(0, Math.min(1, p[0])).toFixed(4)); st.setAttribute('stop-color', p[1]); rg.appendChild(st); });
        host.firstChild.appendChild(rg);
      }
      return 'url(#' + id + ')';
    } catch (e) { return null; }
  };
  // 세로 두 색 채색 · 위(0~1-cov)는 top 빛, 아래 cov 비율은 bot 빛 · 유약 담근 만큼만 칠할 때 쓴다
  // 같은 문서 어디서나 url(#id)로 쓰도록 숨은 svg 하나에 그라데이션을 모아 둔다
  S.covFill = function (top, bot, cov, geo) {
    if (geo && geo.r && geo.H) { var ef = this.covFillE ? this.covFillE(top, bot, geo) : null; if (ef) { return ef; } }
    try {
      var c = Math.max(0, Math.min(1, cov)), stop = (1 - c), id = 'cvf_' + String(top).replace('#', '') + '_' + String(bot).replace('#', '') + '_' + Math.round(c * 100);
      if (!document.getElementById(id)) {
        var NS = 'http://www.w3.org/2000/svg', host = document.getElementById('cvf-host');
        if (!host) { host = document.createElementNS(NS, 'svg'); host.setAttribute('id', 'cvf-host'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; host.appendChild(document.createElementNS(NS, 'defs')); document.body.appendChild(host); }
        var lg = document.createElementNS(NS, 'linearGradient'); lg.setAttribute('id', id); lg.setAttribute('x1', '0'); lg.setAttribute('y1', '0'); lg.setAttribute('x2', '0'); lg.setAttribute('y2', '1');
        [[0, top], [Math.max(0, stop - 0.015), top], [Math.min(1, stop + 0.015), bot], [1, bot]].forEach(function (p) { var st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', p[0].toFixed(3)); st.setAttribute('stop-color', p[1]); lg.appendChild(st); });
        host.firstChild.appendChild(lg);
      }
      return 'url(#' + id + ')';
    } catch (e) { return bot; }
  };
  // ── 의뢰 연출 : 의뢰를 받으면 의뢰서가 하단 「의뢰」 탭으로, 보상을 받으면 재화가 재화 표시로 날아간다 ──
  // 저장(localStorage) 직전·직후 상태를 비교해서 감지하므로 화면마다 따로 연결할 필요가 없다
  (function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__qfxBooted) { return; }
    window.__qfxBooted = true;
    var KEY = 'pottery-proto-v1';
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    var ON = { Counter: 1, Commission: 1, Main: 1, Season: 1 };
    if (!ON[PAGE]) { return; }
    var lastPt = null;
    document.addEventListener('pointerdown', function (e) { lastPt = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
    function parse(v) { try { return JSON.parse(v || 'null'); } catch (e) { return null; } }
    function lib() { try { return S.qlib.call(window.__qfxCtx || (window.__qfxCtx = {})); } catch (e) { return null; } }
    function nAct(g) { var L = lib(); try { return L && g ? L.active(g).length : 0; } catch (e) { return 0; } }
    function fameOf(g) { return ((g && g.fameLv) || 1) * 100000 + ((g && g.fameXp) || 0); }
    var orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      var before = null;
      if (this === window.localStorage && k === KEY) { before = parse(window.localStorage.getItem(KEY)); }
      var r = orig.apply(this, arguments);
      if (before) { try { check(before, parse(v)); } catch (e) {} }
      return r;
    };
    function check(a, b) {
      if (!b) { return; }
      var acc = nAct(b) > nAct(a) && (b.tut == null || b.tut >= 1 || PAGE === 'Counter');
      var dg = (b.gold || 0) - (a.gold || 0), ds = (b.shards || 0) - (a.shards || 0), df = fameOf(b) > fameOf(a);
      var paid = dg > 0 && (ds > 0 || df) && PAGE !== 'Main';
      if (acc) { setTimeout(scrollFly, 0); }
      if (paid) { setTimeout(function () { coinFly(dg, ds, (a.gold || 0), (a.shards || 0)); }, acc ? 500 : 0); }
    }
    function startPt() {
      if (lastPt && Date.now() - lastPt.t < 4000) { return { x: lastPt.x, y: lastPt.y }; }
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
    }
    function navRect() { var n = document.querySelector('nav[aria-label="주 메뉴"]'); return n ? n.getBoundingClientRect() : { left: 0, width: window.innerWidth, top: window.innerHeight - 90, height: 90 }; }
    function k() { return navRect().width / 390 || 1; }
    function css() {
      if (document.getElementById('qfx-css')) { return; }
      var st = document.createElement('style'); st.id = 'qfx-css';
      st.textContent = '.qfx{position:fixed;z-index:10050;pointer-events:none;left:0;top:0;will-change:transform,opacity}' +
        '@keyframes qfxBump{0%,100%{transform:scale(1)}40%{transform:scale(1.25)}}' +
        '.qfx-bump{animation:qfxBump .45s ease-out}' +
        '.qfx-hud{position:fixed;z-index:10040;pointer-events:none;display:flex;flex-direction:column;gap:5px;align-items:flex-end;transform-origin:100% 0;transition:opacity .35s,transform .35s}' +
        '.qfx-hud span{display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:14px;background:rgba(43,26,15,.9);border:2px solid #FFD66B;font-family:Jua,sans-serif;font-size:16px;color:#FFE7A8;box-shadow:0 3px 8px rgba(0,0,0,.35)}';
      document.head.appendChild(st);
    }
    function fly(html, from, to, dur, delay, size, done) {
      var el = document.createElement('div'); el.className = 'qfx';
      el.style.fontSize = Math.round(size * k()) + 'px'; el.innerHTML = html;
      el.style.transform = 'translate(' + (from.x - 14) + 'px,' + (from.y - 14) + 'px) scale(.4)'; el.style.opacity = '0';
      document.body.appendChild(el);
      var mx = (from.x + to.x) / 2 + (Math.random() - 0.5) * 120 * k(), my = Math.min(from.y, to.y) - 90 * k();
      var t0 = performance.now() + (delay || 0);
      function step(t) {
        var u = (t - t0) / dur; if (u < 0) { requestAnimationFrame(step); return; }
        if (u >= 1) { el.remove(); if (done) { done(); } return; }
        var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, i = 1 - e;
        var x = i * i * from.x + 2 * i * e * mx + e * e * to.x, y = i * i * from.y + 2 * i * e * my + e * e * to.y;
        var sc = u < 0.15 ? 0.4 + u / 0.15 * 0.9 : 1.3 - 0.6 * u;
        el.style.opacity = u > 0.9 ? String((1 - u) / 0.1) : '1';
        el.style.transform = 'translate(' + (x - 14) + 'px,' + (y - 14) + 'px) scale(' + sc.toFixed(2) + ') rotate(' + Math.round(u * (html.indexOf('📜') >= 0 ? 360 : 0)) + 'deg)';
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function bump(el) { if (!el) { return; } el.classList.remove('qfx-bump'); void el.offsetWidth; el.classList.add('qfx-bump'); }
    function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    function scrollFly() {
      css();
      var tab = document.querySelector('nav[aria-label="주 메뉴"] a[href="Commission.dc.html"]');
      var to = tab ? center(tab) : { x: window.innerWidth * 0.7, y: window.innerHeight - 40 };
      var from = startPt();
      try { window.__sfx && window.__sfx('whoosh'); } catch (e) {}
      fly('<span style="display:inline-block;padding:6px 8px;border-radius:8px;background:#FFF4DE;border:2px solid #8A6440;box-shadow:0 3px 6px rgba(0,0,0,.35);line-height:1">📜</span>', from, to, 750, 0, 30, function () {
        bump(tab); try { window.__sfx && window.__sfx('ok'); } catch (e) {}
        if (tab) { var t = document.createElement('div'); t.className = 'qfx'; var c = center(tab); t.style.cssText += ';font-family:Jua,sans-serif;font-size:' + Math.round(14 * k()) + 'px;color:#FFE7A8;text-shadow:0 2px 0 #2B1A0F;transform:translate(' + (c.x - 10) + 'px,' + (c.y - 40 * k()) + 'px);transition:transform .8s,opacity .8s'; t.textContent = '+1'; document.body.appendChild(t); requestAnimationFrame(function () { t.style.transform = 'translate(' + (c.x - 10) + 'px,' + (c.y - 70 * k()) + 'px)'; t.style.opacity = '0'; }); setTimeout(function () { t.remove(); }, 900); }
      });
    }
    function chip(re) { var a = [].slice.call(document.querySelectorAll('a[aria-label],span[aria-label],div[aria-label]')).filter(function (x) { return re.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0; }); return a[0] || null; }
    function coinFly(dg, ds, g0, s0) {
      css();
      var gChip = chip(/^골드/), sChip = chip(/^파편/), hud = null, gSpan = null, sSpan = null;
      if (!gChip || (ds > 0 && !sChip)) {
        var nr = navRect(), kk = k();
        hud = document.createElement('div'); hud.className = 'qfx-hud';
        hud.style.right = Math.max(0, window.innerWidth - (nr.left + nr.width) + 10 * kk) + 'px';
        hud.style.top = Math.round(nr.top - (844 - 92 - 64) * kk) + 'px';
        hud.style.transform = 'scale(' + kk.toFixed(3) + ') translateY(-8px)'; hud.style.opacity = '0';
        gSpan = document.createElement('span'); gSpan.innerHTML = '🪙 <b style="font-weight:400">' + g0.toLocaleString() + '</b>'; hud.appendChild(gSpan);
        if (ds > 0) { sSpan = document.createElement('span'); sSpan.innerHTML = '🏺 <b style="font-weight:400">' + s0.toLocaleString() + '</b>'; hud.appendChild(sSpan); }
        document.body.appendChild(hud);
        requestAnimationFrame(function () { hud.style.opacity = '1'; hud.style.transform = 'scale(' + kk.toFixed(3) + ')'; });
        gChip = gSpan; sChip = sSpan;
      }
      var from = startPt(), N = Math.min(10, 4 + Math.floor(dg / 800)), got = 0;
      function count(sp, a, b, t) { if (!sp || !sp.querySelector) { return; } var bb = sp.querySelector('b'); if (!bb) { return; } var t0 = performance.now(); (function st(n) { var u = Math.min(1, (n - t0) / t); bb.textContent = Math.round(a + (b - a) * u).toLocaleString(); if (u < 1) { requestAnimationFrame(st); } })(t0); }
      setTimeout(function () {
        for (var i = 0; i < N; i++) {
          (function (i) {
            var off = { x: from.x + (Math.random() - 0.5) * 60 * k(), y: from.y + (Math.random() - 0.5) * 40 * k() };
            fly('🪙', off, center(gChip), 700, i * 70, 24, function () { got++; bump(gChip); try { if (got % 2 === 1) { window.__sfx && window.__sfx('coin'); } } catch (e) {} if (got === 1) { count(gSpan, g0, g0 + dg, 650); } });
          })(i);
        }
        if (ds > 0 && sChip) {
          for (var j = 0; j < 4; j++) {
            (function (j) { fly('🏺', { x: from.x + (Math.random() - 0.5) * 50 * k(), y: from.y }, center(sChip), 750, 200 + j * 90, 22, function () { bump(sChip); if (j === 0) { count(sSpan, s0, s0 + ds, 550); } }); })(j);
          }
        }
        if (hud) { setTimeout(function () { hud.style.opacity = '0'; setTimeout(function () { hud.remove(); }, 400); }, 700 + N * 70 + 1300); }
      }, hud ? 250 : 0);
    }
  })();
  // 끌어 옮기는 기물은 브라우저 가로 스크롤이 가로채지 않게 (가로로 끌면 놓치던 문제)
  (function () {
    if (typeof document === 'undefined' || window.__dragCss) { return; } window.__dragCss = 1;
    var st = document.createElement('style');
    st.textContent = '[data-tray],[data-kwait],[data-kcell]{touch-action:none!important;-webkit-user-select:none;user-select:none}';
    (document.head || document.documentElement).appendChild(st);
  })();
  // ── 프레임 애니메이션 : img 하나의 그림을 차례로 바꿔 끼운다 (부채·풀무·바람·불꽃) ──
  (function () {
    if (typeof window === 'undefined' || window.__seq) { return; }
    var cache = {};
    window.__preload = function (list) { (list || []).forEach(function (u) { if (!cache[u]) { var im = new Image(); im.src = u; cache[u] = im; } }); };
    /* el : img, frames : [[src, ms], ...], end : 'hide' 이면 끝나고 숨김, 그 밖의 문자열이면 그 그림으로 돌아감 */
    window.__seq = function (el, frames, end) {
      if (!el || !frames || !frames.length) { return; }
      clearTimeout(el.__seqT); var i = 0;
      el.style.visibility = 'visible';
      (function step() {
        if (i >= frames.length) { if (end === 'hide') { el.style.visibility = 'hidden'; } else if (end) { el.src = end; } return; }
        el.src = frames[i][0]; var ms = frames[i][1]; i++;
        el.__seqT = setTimeout(step, ms);
      })();
    };
    /* 화면이 다시 그려져도 지워지지 않도록 body 에 띄운 그림으로 재생 · base : 기준 요소, opt.box : 기준 요소 안 좌표 [x, y, w, h] (요소 px), opt.hide : 재생 동안 기준 요소 숨김 */
    var stl = null, HID = {};
    function hideCss() { if (!stl) { stl = document.createElement('style'); document.head.appendChild(stl); } var ks = Object.keys(HID).filter(function (k) { return HID[k] > 0; }); stl.textContent = ks.length ? ks.join(',') + '{opacity:0!important}' : ''; }
    window.__seqOver = function (base, frames, opt) {
      if (!base || !frames || !frames.length) { return; }
      opt = opt || {};
      var r = base.getBoundingClientRect(), k = base.offsetWidth ? r.width / base.offsetWidth : 1, bx = opt.box || [0, 0, base.offsetWidth, base.offsetHeight];
      var im = document.createElement('img'); im.alt = ''; im.setAttribute('aria-hidden', 'true');
      im.style.cssText = 'position:fixed;z-index:9000;pointer-events:none;object-fit:contain;left:' + (r.left + bx[0] * k) + 'px;top:' + (r.top + bx[1] * k) + 'px;width:' + (bx[2] * k) + 'px;height:' + (bx[3] * k) + 'px;' + (opt.css || '');
      document.body.appendChild(im);
      var hs = opt.hideSel || ''; if (hs) { HID[hs] = (HID[hs] || 0) + 1; hideCss(); }
      var slot = opt.slot || 'x'; base.__seqOv = base.__seqOv || {};
      var prev = base.__seqOv[slot]; if (prev && !prev.done) { try { clearTimeout(prev.t); prev.im.remove(); if (prev.hs) { HID[prev.hs] = Math.max(0, (HID[prev.hs] || 0) - 1); hideCss(); } } catch (e) {} }
      var st = { im: im, t: 0, hs: hs }; base.__seqOv[slot] = st; var i = 0;
      if (opt.anim && im.animate) { try { im.animate(opt.anim[0], opt.anim[1]); } catch (e) {} }
      (function step() {
        if (i >= frames.length) { st.done = true; im.remove(); if (hs) { HID[hs] = Math.max(0, (HID[hs] || 0) - 1); hideCss(); } return; }
        im.src = frames[i][0]; var ms = frames[i][1]; i++; st.t = setTimeout(step, ms);
      })();
    };
  })();
  // ── 하단 탭 「의뢰」 숫자 : 받아 둔(진행 중) 의뢰 수 · 모든 화면 공통 (공방은 자체 표시) ──
  (function () {
    if (typeof window === 'undefined' || window.__cbadge) { return; }
    window.__cbadge = 1;
    function upd() {
      try {
        var a = document.querySelector('nav[aria-label="주 메뉴"] a[href="Commission.dc.html"]'); if (!a || a.querySelector('[data-cb]')) { return; }
        var g = JSON.parse(localStorage.getItem('pottery-proto-v1') || 'null'); if (!g || !window.PotteryShared || !window.PotteryShared.qlib) { return; }
        var n = window.PotteryShared.qlib.call(window.PotteryShared).reqCounts(g).accepted;
        var b = a.querySelector('[data-cbx]');
        if (!n) { if (b) { b.remove(); } return; }
        if (!b) { b = document.createElement('span'); b.setAttribute('data-cbx', '1'); b.setAttribute('aria-label', '진행 중 의뢰 ' + n); b.style.cssText = 'position:absolute;right:10px;top:0;min-width:20px;height:20px;box-sizing:border-box;padding:0 5px;border-radius:10px;background:#D0452B;border:2px solid #FFF4DE;color:#fff;font-family:Jua,sans-serif;font-size:11px;display:flex;align-items:center;justify-content:center;pointer-events:none'; if (getComputedStyle(a).position === 'static') { a.style.position = 'relative'; } a.appendChild(b); }
        if (b.textContent !== String(n)) { b.textContent = String(n); }
      } catch (e) {}
    }
    setInterval(upd, 1000); setTimeout(upd, 300);
  })();
  /* ── 유약 뭉침 무늬 : 소성 때 무작위로 정해지는 무늬(spot)를 모든 화면의 그릇 그림에 덧입힌다 ── */
  (function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__spotDefs) { return; }
    window.__spotDefs = true;
    function rng(sd) { return function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }
    function tile(id, body) { return '<pattern id="' + id + '" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">' + body + '</pattern>'; }
    function circles(sd, n, r0, r1, y0, y1, col, op) {
      var R = rng(sd), o = '';
      for (var i = 0; i < n; i++) {
        var r = r0 + (r1 - r0) * R();
        o += '<ellipse cx="' + (0.08 + 0.84 * R()).toFixed(3) + '" cy="' + (y0 + (y1 - y0) * R()).toFixed(3) + '" rx="' + r.toFixed(3) + '" ry="' + (r * (0.8 + 0.3 * R())).toFixed(3) + '" fill="' + col + '" fill-opacity="' + (op * (0.7 + 0.5 * R())).toFixed(3) + '"></ellipse>';
      }
      return o;
    }
    function drips(sd) {
      var R = rng(sd), o = '';
      for (var i = 0; i < 7; i++) {
        var x = 0.08 + 0.84 * R(), y0 = 0.05 + 0.1 * R(), L = 0.25 + 0.4 * R(), w = 0.018 + 0.02 * R();
        o += '<path d="M' + (x - w).toFixed(3) + ' ' + y0.toFixed(3) + 'Q' + (x - w * 1.4).toFixed(3) + ' ' + (y0 + L * 0.6).toFixed(3) + ' ' + x.toFixed(3) + ' ' + (y0 + L).toFixed(3) + 'Q' + (x + w * 1.4).toFixed(3) + ' ' + (y0 + L * 0.6).toFixed(3) + ' ' + (x + w).toFixed(3) + ' ' + y0.toFixed(3) + 'Z" fill="#000" fill-opacity=".13"></path>';
      }
      return o;
    }
    var D = tile('potSp_dot0', circles(11, 9, 0.03, 0.06, 0.12, 0.82, '#000', 0.12)) +
      tile('potSp_dot1', circles(47, 8, 0.03, 0.065, 0.12, 0.82, '#fff', 0.2)) +
      tile('potSp_speck0', circles(23, 34, 0.007, 0.014, 0.08, 0.86, '#000', 0.16)) +
      tile('potSp_speck1', circles(91, 30, 0.007, 0.015, 0.08, 0.86, '#2B1A0F', 0.2)) +
      tile('potSp_cloud0', circles(5, 4, 0.12, 0.2, 0.15, 0.75, '#fff', 0.13)) +
      tile('potSp_cloud1', circles(77, 4, 0.12, 0.2, 0.15, 0.75, '#000', 0.09)) +
      tile('potSp_drip0', drips(13)) + tile('potSp_drip1', drips(59));
    function put() {
      if (!document.body || document.getElementById('potSpotDefs')) { return; }
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('id', 'potSpotDefs'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('width', '0'); s.setAttribute('height', '0');
      s.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
      s.innerHTML = '<defs>' + D + '</defs>';
      document.body.appendChild(s);
    }
    put(); document.addEventListener('DOMContentLoaded', put); setInterval(put, 1500);
    /* 그릇 그림의 무늬 칸 값 : 매화 문양 > 유약 뭉침 무늬 > 기본 물레 자국 */
    window.__potRings = function (it) {
      if (it && it.pattern === 'plum') { return 'url(#potPlum)'; }
      if (it && it.spot) { return 'url(#potSp_' + it.spot + ')'; }
      return 'url(#potRings)';
    };
    /* 소성 때 무늬 뽑기 : 유약 바름 상태(뭉침 정도)에 따라 확률이 다르다 · 좋고 나쁨 없이 생김새만 다름 */
    var W = { thin: { '': 70, speck: 20, dot: 10 }, ok: { '': 45, dot: 25, speck: 15, cloud: 15 }, thick: { '': 20, dot: 35, cloud: 30, speck: 15 }, drip: { '': 10, drip: 60, dot: 15, cloud: 15 } };
    window.__spotRoll = function (thick) {
      var w = W[thick] || W.ok, tot = 0, k; for (k in w) { tot += w[k]; }
      var r = Math.random() * tot; for (k in w) { r -= w[k]; if (r < 0) { return k ? k + (Math.random() < 0.5 ? '0' : '1') : ''; } }
      return '';
    };
    window.__spotName = function (sp) { return ({ dot: '원형 반점', speck: '잔점', cloud: '구름 얼룩', drip: '흐른 자국' })[(sp || '').replace(/[01]$/, '')] || '무늬 없음'; };
  })();
  /* ── 손맛 연출 공용 : 반짝임(__sparkle) · 진동(__buzz) ── */
  (function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__sparkle) { return; }
    var RM = false; try { RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    window.__buzz = function (ms) {
      try { var g = JSON.parse(localStorage.getItem('pottery-proto-v1') || '{}'); if ((g.settings || {}).vib === false) { return; } if (navigator.vibrate) { navigator.vibrate(ms); } } catch (e) {}
    };
    /* target : 요소 또는 {x,y} 화면 좌표 · o.n 개수 · o.r 퍼짐 반경 · o.col 색 · o.big 큰 별 */
    window.__sparkle = function (target, o) {
      o = o || {}; if (!document.body) { return; }
      var x, y, w = 0, h = 0;
      if (target && target.getBoundingClientRect) { var b = target.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; w = b.width; h = b.height; }
      else if (target) { x = target.x; y = target.y; } else { return; }
      var n = o.n || 8, R = o.r || 40, cols = o.col ? [o.col] : ['#FFE27A', '#FFF6C8', '#FFD14A', '#FFFFFF'];
      for (var i = 0; i < n; i++) {
        var s = document.createElement('div'), sz = (o.big ? 10 : 6) + Math.random() * (o.big ? 10 : 6);
        var sx = x + (o.spread ? (Math.random() - 0.5) * w : 0), sy = y + (o.spread ? (Math.random() - 0.5) * h : 0);
        s.setAttribute('aria-hidden', 'true');
        s.style.cssText = 'position:fixed;left:' + (sx - sz / 2) + 'px;top:' + (sy - sz / 2) + 'px;width:' + sz + 'px;height:' + sz + 'px;pointer-events:none;z-index:9999;background:' + cols[i % cols.length] + ';clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);filter:drop-shadow(0 0 4px rgba(255,220,120,.9))';
        document.body.appendChild(s);
        var a = Math.random() * Math.PI * 2, d = R * (0.4 + Math.random() * 0.8);
        if (RM || !s.animate) { setTimeout(function (el) { return function () { el.remove(); }; }(s), 300); continue; }
        var an = s.animate([{ transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 }, { transform: 'translate(' + (Math.cos(a) * d).toFixed(1) + 'px,' + (Math.sin(a) * d).toFixed(1) + 'px) scale(1) rotate(' + (90 + Math.random() * 90).toFixed(0) + 'deg)', opacity: 1, offset: 0.5 }, { transform: 'translate(' + (Math.cos(a) * d * 1.3).toFixed(1) + 'px,' + (Math.sin(a) * d * 1.3 - 8).toFixed(1) + 'px) scale(.2) rotate(200deg)', opacity: 0 }], { duration: 520 + Math.random() * 380, easing: 'cubic-bezier(.2,.8,.3,1)' });
        an.onfinish = function (el) { return function () { el.remove(); }; }(s);
      }
    };
  })();
  /* ── 정면 공방 한 화면 : 물레·유약·가마·가마 열기는 공방(Main) 안에서 확대해 연다 ──
     공정 화면 주소로 직접 들어오면 공방으로 보내 그 설비를 확대해 연다 (웹 실행기에서만 · 디자인 미리보기는 기존 화면 유지) */
  (function () {
    if (typeof window === 'undefined' || typeof document === 'undefined' || window.__studioBooted) { return; }
    window.__studioBooted = true;
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    var WEB = typeof window.morphdom === 'function';
    if (!window.__studioPost) { window.__studioPost = function () {}; }
    if (!WEB || window.top !== window.self) { return; }
    var ZOOM = { Wheel: 1, Glaze: 1, Kiln: 1, KilnOpen: 1, Counter: 1 };
    if (ZOOM[PAGE] || PAGE === 'Dry' || PAGE === 'Queue') {
      try { if (ZOOM[PAGE]) { sessionStorage.setItem('studioOpen', PAGE); } } catch (e) {}
      try { location.replace('Main.dc.html'); } catch (e) {}
    }
  })();
  // ── 이야기 : 컷신 · 이름 입력 · 챕터/해금 연출 · 공방 이야기 카드 ──
  // 컷신 = 장면 그림(CG) 위에 말하는 사람 흉상 + 대사 상자. 그림이 생기면 ART / step.img 에 경로만 넣으면 교체된다
  (function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') { return; }
    var KEY = 'pottery-proto-v1';
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
    function save(g) { try { localStorage.setItem(KEY, JSON.stringify(g)); window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch (e) {} }
    function patch(p) { var g = load(); for (var k in p) { g[k] = p[k]; } save(g); return g; }
    function PN() { return load().pname || '손녀'; }
    function tx(t) { var g = load(); return String(t).split('{이름}').join(g.pname || '손녀').split('{공방}').join(g.wsName || '강 할매네 공방'); }
    // 말하는 사람 흉상 · img 가 생기면 그림으로 바뀐다 (side: 대사 상자 왼쪽/오른쪽)
    var IMG = function (k, f) { return 'char/b_' + k + '_' + f + '.webp'; };
    // 카운터 손님 그림 · wait 기본(기다림) / joy 기쁨(납품) / ask 부탁(의뢰) / face 얼굴(목록 썸네일)
    var CI = {}; [['CHAR_HARAM', 'haram'], ['CHAR_MIN', 'min'], ['CHAR_YOON', 'yoon'], ['CHAR_CHA', 'cha'], ['CHAR_JEONG', 'jeong'], ['CHAR_JANG', 'jang'], ['CHAR_DUDU', 'dudu'], ['CHAR_BULMOK', 'bulmok'], ['CHAR_KIDS', 'kids']].forEach(function (r) {
      CI[r[0]] = { wait: 'char/c_' + r[1] + '_wait.webp', joy: 'char/c_' + r[1] + '_joy.webp', ask: 'char/c_' + r[1] + '_ask.webp', face: 'char/f_' + r[1] + '.webp' };
    });
    S.CHARIMG = CI;
    // 말하는 사람 흉상 · faces = 표정별 그림, 줄마다 {face: '...'} 로 고른다 (없으면 def)
    var ART = {
      '나': { id: 'me', emo: '🧑', tone: '#8A93A6', side: 'l', def: 'neutral', faces: { neutral: IMG('me', 'neutral'), smile: IMG('me', 'smile'), surprise: IMG('me', 'surprise'), sad: IMG('me', 'sad') },
        ws: { neutral: IMG('mews', 'neutral'), smile: IMG('mews', 'smile'), surprise: IMG('mews', 'surprise'), proud: IMG('mews', 'proud'), sad: IMG('mews', 'sad'), worry: IMG('mews', 'worry') } },
      '할머니': { id: 'grandma', emo: '👵', tone: '#7A5A3A', side: 'r', def: 'smile', faces: { smile: IMG('grandma', 'smile'), stubborn: IMG('grandma', 'stubborn'), sick: IMG('grandma', 'sick') } },
      '두두리': { id: 'dudu', emo: '👹', tone: '#3E6B8A', side: 'r', def: 'laugh', faces: { laugh: IMG('dudu', 'laugh'), sulk: IMG('dudu', 'sulk'), muk: IMG('dudu', 'muk') } },
      '???': { id: 'dudu', emo: '👹', tone: '#26323A', side: 'r', def: 'laugh', shadow: true, faces: { laugh: IMG('dudu', 'laugh') } },
      '민 씨': { id: 'min', emo: '🍵', tone: '#6E8A5A', side: 'r', img: null }
    };
    function artImg(a, face, outfit) { if (!a || !a.faces) { return a && a.img; } var set = (outfit && a[outfit]) || a.faces; return set[face] || set[a.def] || a.faces[a.def]; }
    // 줄 = [말하는 사람('' = 내레이션), 대사, {fx: 'shake' | 'knock' | 'flash'}]
    var SCENES = {
      prologue: { title: '프롤로그 · 빈 공방', steps: [
        { img: 'cg/p1.webp', pic: '🏥', cap: '병실 창가 · 회상', bg: '#3A3A44', amb: 'memory', lines: [['', '할머니가 쓰러진 건 작년 이맘때였다.'], ['', '회사엔 한 달만 쉬겠다고 했다. 한 달은 석 달이 되고, 석 달은 일 년이 됐다.'], ['', '마지막 날, 할머니는 내 손을 한참 쥐고 있었다.'], ['할머니', '…우리 아가. 울지 말어.', { face: 'sick' }], ['할머니', '이 할미가 평생 그릇을 빚었는디…', { face: 'sick' }], ['할머니', '…네가, 이 할미가 빚은 것 중에 제일 이쁜 도자기여.', { face: 'sick' }], ['', '그게, 마지막으로 들은 말이었다.']] },
        { img: 'cg/p2.webp', pic: '🏚️', cap: '골목 끝, 닫힌 공방 문', bg: '#2B2A33', amb: 'leaves', lines: [['', '할머니를 보내 드리고, 오랜만에 공방으로 돌아왔다.'], ['나', '할머니가 쓰러지시고 1년이나 지났는데…', { face: 'sad' }], ['나', '아직도 할머니 온기가 남아 있는 것 같아.', { face: 'sad' }]] },
        { input: 'pname', q: '내 이름은…', ph: '이름 (최대 6자)', def: '하윤', bg: '#2B2A33', img: 'cg/p2.webp' },
        { img: 'cg/p3.webp', pic: '🫙', cap: '먼지 앉은 공방 안 · 이어 붙인 사발', bg: '#4A3422', amb: 'dust', lines: [['', '물레도, 선반 위 그릇들도 그대로다. 맨 윗칸엔 금 간 자리를 이어 붙인 사발 하나.'], ['나', '…다녀왔어요, 할머니. {이름}이에요.', { face: 'sad' }], ['나', '얼른 정리만 하고 가자. 오래 걸리진 않을 거야.'], ['', '그때, 누군가 문을 두드렸다.', { fx: 'knock' }]] }
      ] },
      after_min: { title: '할머니의 전시대', steps: [
        { img: 'cg/a1.webp', pic: '🍵', cap: '찻잔을 품에 안고 돌아가는 민 씨', bg: '#3E4A30', amb: 'dusk', lines: [['', '민 씨는 찻잔을 품에 안고, 몇 번이나 고개를 숙이며 돌아갔다.'], ['나', '…전시대에, 편지?', { face: 'surprise' }]] },
        { img: 'cg/p3.webp', pic: '🗄️', cap: '공방 안쪽, 유리문 달린 전시대', bg: '#4A3422', amb: 'dust', lines: [['', '공방 안쪽, 늘 먼지만 쌓여 있던 전시대의 유리문을 열었다.'], ['', '텅 빈 칸들 사이, 맨 아래에 끈으로 묶은 편지 한 다발이 있었다.']] },
        { img: 'cg/r2.webp', pic: '✉️', cap: '부치지 못한 편지들', bg: '#3A2E22', amb: 'dust', lines: [['할머니', '우리 아가, 타지 생활 많이 고되지? 힘들면 언제든 돌아와도 괜찮여.', { face: 'smile' }], ['할머니', '이 공방, 너 줄라고 지키고 있는 거여. 이어받아서 걱정 없이 살았으면 좋겄다.', { face: 'smile' }], ['할머니', '너랑 물레 앞에 붙어 앉아 있던 그때가, 할미 평생에 제일 행복했어.', { face: 'smile' }], ['나', '(읽다 보니, 어느새 마지막 장이네…)', { face: 'sad' }], ['할머니', '손님들 그릇만 빚다 보니, 정작 이 전시대는 아직도 채우질 못하고 있어.'], ['할머니', '텅 빈 칸 보고 있으면 허전하고… 그게 제일 아쉬워.'], ['할머니', '~~네가 와서 할미랑 같이 채워 주면 좋을 텐데…~~']] },
        { img: 'cg/p3.webp', pic: '🥣', cap: '전시대 첫째 칸 · 울퉁불퉁한 그릇', bg: '#4A3422', amb: 'dust', lines: [['', '전시대 첫째 칸에는, 울퉁불퉁한 그릇 하나가 놓여 있었다.'], ['', '그 옆에 할머니 글씨로 쓴 쪽지. 「우리 {이름}이 처음 빚은 그릇」'], ['나', '…이걸, 여태 갖고 계셨어요?', { face: 'sad' }], ['나', '할머니 무릎에 앉아서, 할머니 손 아래 내 손을 얹고 돌리던 물레…', { face: 'sad' }]] },
        { img: 'cg/p3.webp', pic: '🔥', cap: '결심', bg: '#4A3422', amb: 'sparkle', lines: [['나', '정리는 그만할게요, 할머니.'], ['나', '남은 칸은 제가 채울게요. 이 공방도, 제가 이어 갈게요.', { face: 'smile' }], ['', '그날 밤, 할머니가 쓰던 흙집 장부를 찾아 흙과 유약 재료를 주문했다.']] },
        { img: 'cg/a2.webp', pic: '🚶', cap: '다음 날 아침, 영업 중', bg: '#5A4A30', amb: 'morning', lines: [['', '다음 날 아침, 공방 앞에 「영업 중」 팻말이 걸렸다.'], ['', '할머니를 찾아온 단골들이 하나둘 줄을 서기 시작했다.']] }
      ] },
      dok_intro: { title: '지하실 너머', outfit: 'ws', steps: [
        { img: 'cg/d0.webp', pic: '🫙', cap: '텅 빈 흙통', bg: '#2A2018', amb: 'dark', lines: [['', '저녁 무렵, 흙통 바닥이 드러났다.'], ['나', '…흙이 다 떨어졌네.'], ['나', '아직 받은 의뢰도 다 못 끝냈는데… 어떡하지.', { face: 'worry' }], ['', '빈 흙통 앞에 한참을 서 있었다.']] },
        { img: 'cg/d1.webp', pic: '🚪', cap: '공방 안쪽, 늘 잠겨 있던 지하실 문', bg: '#1E2230', amb: 'dark', lines: [['', '덜컹—!', { fx: 'shake' }], ['', '공방 안쪽, 늘 잠겨 있던 지하실 문이 흔들린다.'], ['나', '…누구 있어요?', { face: 'surprise' }]] },
        { img: 'cg/d1b.webp', pic: '🚪', cap: '열린 지하실 문', bg: '#141A28', amb: 'fog', lines: [['', '대답 대신, 문틈으로 푸른 빛이 새어 나온다.'], ['', '조심스레 고리를 당겼다.', { fx: 'enter' }]] },
        { img: 'cg/d2.webp', pic: '🌫️', cap: '지하실 너머, 안개 낀 골짜기', bg: '#20343A', amb: 'fog', lines: [['???', '크하하! 김 서방, 오랜만이다!', { fx: 'shake' }], ['나', '기, 김 서방…? 저는 {이름}인데요.', { face: 'surprise' }], ['두두리', '여기 오는 사람은 다 김 서방이야! 나는 문지기 두두리.'], ['두두리', '그런데 묵 할멈은? 같이 안 왔어?'], ['', '…쉽게 대답이 나오지 않았다.'], ['나', '…할머니는요.', { face: 'sad' }], ['나', '작년에… 돌아가셨어요. 이제, 안 계세요.', { face: 'sad' }], ['두두리', '……그렇구나.', { face: 'sulk' }], ['', '커다란 어깨가 축 처진다. 한동안 둘 다 아무 말이 없었다.']] },
        { img: 'cg/d3.webp', pic: '🥣', cap: '메밀묵 한 그릇', bg: '#3A3022', amb: 'steam', lines: [['두두리', '묵 할멈이 가져다주던 메밀묵… 참 맛있었는데.', { face: 'muk' }], ['두두리', '묵 할멈은 묵을 가져올 때마다 좋은 흙 나는 자리를 물어 갔지. 내가 제일 좋은 데만 알려 줬어!', { face: 'muk' }], ['나', '(흙 나는 자리…)'], ['나', '(아직 의뢰를 다 못 끝냈는데… 여기서 흙이랑 유약 재료를 조금 더 얻어 갈 수 있지 않을까?)'], ['나', '그럼… 다음부터 제가 묵을 가져올게요.', { face: 'smile' }], ['나', '이번 한 번만, 들여보내 주세요.'], ['두두리', '크하하! 좋지! 약속이다, 김 서방!', { fx: 'flash' }]] }
      ] },
      dok_bye: { title: '지하실 너머', outfit: 'ws', steps: [
        { img: 'cg/d2.webp', pic: '🌫️', cap: '골짜기 입구', bg: '#20343A', amb: 'fog', lines: [['두두리', '크하하! 김 서방, 손이 제법인걸? 묵 할멈 손녀 맞네!'], ['두두리', '오늘은 여기까지! 어두우니까 조심히 올라가.'], ['두두리', '묵 잊지 말고! 흙이 모자라면 언제든 와!', { face: 'muk' }], ['나', '고마워요, 두두리. 또 올게요.', { face: 'smile' }]] }
      ] },
      dok_meet: { title: '지하실의 손님', outfit: 'ws', steps: [
        { img: 'cg/d1.webp', pic: '🚪', cap: '공방 안쪽, 늘 잠겨 있던 지하실 문', bg: '#1E2230', amb: 'dark', lines: [['', '전시대에 그릇을 하나 더 올린 날 밤.'], ['', '덜컹—!', { fx: 'shake' }], ['', '늘 잠겨 있던 지하실 문이 흔들린다.'], ['나', '…누구 있어요?', { face: 'surprise' }]] },
        { img: 'cg/s2.webp', pic: '👹', cap: '지하실에서 올라온 도깨비', bg: '#4A3422', amb: 'dust', lines: [['???', '크하하! 김 서방, 오랜만이다!', { fx: 'shake' }], ['나', '기, 김 서방…? 저는 {이름}인데요.', { face: 'surprise' }], ['두두리', '여기 오는 사람은 다 김 서방이야! 나는 골짜기 문지기 두두리.'], ['두두리', '공방에 불이 켜졌길래 올라와 봤지. 묵 할멈은 어디 갔어?'], ['나', '…할머니는 작년에 돌아가셨어요.', { face: 'sad' }], ['두두리', '……그렇구나.', { face: 'sulk' }], ['', '커다란 어깨가 축 처진다.']] },
        { img: 'cg/s2.webp', pic: '🏺', cap: '전시대 앞', bg: '#4A3422', amb: 'dust', lines: [['두두리', '…이 전시대, 묵 할멈이 늘 채우고 싶다던 거잖아.'], ['나', '네. 이제 제가 채우려고요.', { face: 'smile' }], ['두두리', '크하하! 그럼 나도 거들어야지! 도깨비들도 그릇이 한가득 필요하거든.', { face: 'laugh' }], ['두두리', '도깨비 부탁을 잘 들어주면, 묵 할멈이 다니던 흙 좋은 골짜기 길도 열어 줄게!'], ['', '그날부터 카운터에 도깨비 손님이 찾아오기 시작했다.']] }
      ] },
      dok_valley: { title: '지하실 너머', outfit: 'ws', steps: [
        { img: 'cg/d1b.webp', pic: '🚪', cap: '활짝 열린 지하실 문', bg: '#141A28', amb: 'fog', lines: [['두두리', '김 서방! 약속대로 골짜기 길을 열어 줄게!', { fx: 'shake' }], ['', '문틈으로 푸른 빛이 새어 나온다.', { fx: 'enter' }]] },
        { img: 'cg/d2.webp', pic: '🌫️', cap: '지하실 너머, 안개 낀 골짜기', bg: '#20343A', amb: 'fog', lines: [['', '문 너머로 안개 낀 골짜기가 펼쳐졌다.'], ['두두리', '여기서 땅을 파면 흙이 나오고, 돌을 부수면 유약 원석이 나와.'], ['나', '할머니가 쓰던 흙이 여기서 왔구나…', { face: 'surprise' }]] },
        { img: 'cg/d3.webp', pic: '🥣', cap: '메밀묵 한 그릇', bg: '#3A3022', amb: 'steam', lines: [['두두리', '대신 들어올 땐 메밀묵 한 그릇! 묵 할멈이랑 하던 약속이야.', { face: 'muk' }], ['나', '좋아요. 묵은 제가 챙길게요.', { face: 'smile' }], ['두두리', '크하하! 약속이다, 김 서방!', { fx: 'flash' }]] }
      ] },
      open_shop: { title: '공방에 불을 켜다', outfit: 'ws', steps: [
        { img: 'cg/p3.webp', pic: '🫙', cap: '공방 안', bg: '#4A3422', amb: 'dust', lines: [['', '흙이 다시 쌓였다. 묵 한 그릇에, 흙 한 짐.'], ['나', '…도깨비라니. 할머니, 대체 뭘 하고 사신 거예요.', { face: 'smile' }], ['', '창고를 정리하다, 할머니가 아끼던 그릇들을 찾았다.'], ['나', '이대로 창고에 두긴 아깝잖아.'], ['나', '…흙이 있는 동안만이라도, 공방 문을 열어 두자.', { face: 'proud' }]] },
        { img: 'cg/a2.webp', pic: '🚶', cap: '영업 중', bg: '#5A4A30', amb: 'morning', lines: [['', '그날부터 공방 앞에 「영업 중」 팻말이 걸렸다.'], ['', '할머니를 찾는 손님만이 아니라, 그릇을 보러 오는 손님도 하나둘 늘었다.']] }
      ] },
      sakura_ask: { title: '벚꽃 빛', outfit: 'ws', steps: [
        { img: 'cg/s1.webp', pic: '🌸', cap: '공방 작업대 앞', bg: '#4A3422', amb: 'dust', lines: [['', '하람 위원이 돌아간 뒤, 유약 통을 하나씩 열어 보았다.'], ['나', '백자유, 청자유, 흑유… 벚꽃 빛은 어디에도 없네.'], ['나', '할머니 일지에도 벚꽃 유약 얘기는 없었는데… 덜컥 맡아 버렸어.', { face: 'worry' }], ['', '그때, 지하실 문이 빼꼼 열렸다.', { fx: 'knock' }]] },
        { img: 'cg/s2.webp', pic: '👹', cap: '놀러 온 두두리', bg: '#4A3422', amb: 'dust', lines: [['두두리', '김 서방! 묵 냄새 따라 놀러 왔지! …어라, 얼굴이 왜 그래?'], ['나', '벚꽃 색 그릇을 부탁받았는데, 그런 유약을 만들 방법을 모르겠어요.'], ['두두리', '크하하! 그거라면 마침 잘됐다!', { fx: 'shake' }], ['두두리', '지금 도깨비 마을에 벚꽃이 한가득 폈거든! 벚꽃 언덕 돌을 부수면 벚꽃 재가 나와.', { face: 'laugh' }], ['두두리', '벚꽃 재로 유약을 만들면 딱 벚꽃 빛이 난다고, 묵 할멈이 그랬어!'], ['나', '정말요? 고마워요, 두두리!', { face: 'smile' }]] },
        { img: 'cg/s3.webp', pic: '🌸', cap: '벚꽃이 한가득 핀 도깨비 마을', bg: '#4A3442', amb: 'petals', lines: [['두두리', '봐, 김 서방! 이게 도깨비 마을 봄이야!', { face: 'laugh' }], ['나', '와… 온통 분홍빛이네.', { face: 'smile' }]] },
        { note: '🌸 벚꽃 축제 채집지가 열렸어요\n\n채집 화면 아래 「축제 채집지 · 벚꽃 언덕」에서\n꽃묵 🌸으로 채집해요\n\n⛏️ 흙 파기 · 봄빛 흙\n🪨 돌 부수기 · 벚꽃 재 (벚꽃유 재료)', bg: '#4A3422', img: 'cg/p3.webp' }
      ] },
      research_open: { title: '할머니의 일지', outfit: 'ws', steps: [
        { img: 'cg/r1.webp', pic: '🧺', cap: '파편 바구니', bg: '#3A2A1E', amb: 'dust', lines: [['', '와장창 깨고, 가마에서 깨지고… 파편 바구니가 넘칠 지경이 됐다.'], ['나', '파편이 너무 많이 모였는데… 이걸 다 어떡하지?', { face: 'worry' }], ['', '버리려고 바구니를 들다, 선반 위 낡은 공책이 눈에 띄었다.'], ['나', '…할머니 일지?']] },
        { img: 'cg/r2.webp', pic: '📔', cap: '할머니의 일지', bg: '#3A2A1E', amb: 'memory', lines: [['할머니', '망치고 깨진 그릇도 자세히 들여다보면 다 보인다.', { face: 'smile' }], ['할머니', '손에 밴 나쁜 버릇이 어디서 났는지, 뭐가 모자랐는지.'], ['할머니', '쓸모없다 싶은 것에도, 늘 배울 게 있고 뜻이 있는 법이여.']] },
        { img: 'cg/r3.webp', pic: '🔬', cap: '파편을 늘어놓은 작업대', bg: '#4A3422', amb: 'morning', lines: [['나', '…쓸모없는 게 아니었구나.'], ['나', '이 파편들로 연구해 보자. 내가 뭘 놓치고 있었는지.', { face: 'proud' }], ['', '공방에 「연구」가 열렸다.', { fx: 'flash' }]] }
      ] },
      ep1_end: { title: '에피소드 1 · 새 간판', outfit: 'ws', steps: [
        { img: 'cg/e1.webp', pic: '🌕', cap: '보름달 항아리', bg: '#2A2A44', amb: 'moon', lines: [['', '끝까지 ‘명옥이 손녀’라고만 부르던 장 씨 할아버지가, 내 이름을 불렀다.'], ['', '서울로 돌아갈 날짜를, 언제부턴가 세지 않게 됐다.'], ['나', '…정리하러 왔던 건데.'], ['나', '이제 여긴, 내 공방이야.', { face: 'proud' }]] },
        { input: 'wsName', q: '공방 이름을 지어 주세요', ph: '공방 이름 (최대 10자)', defFn: function () { return PN() + '네 공방'; }, bg: '#2A2A44', img: 'cg/e1.webp' },
        { img: 'cg/e2.webp', sign: [53.2, 20.8, 46], pic: '🪧', cap: '새로 걸린 간판', bg: '#4A3422', amb: 'sparkle', lines: [['', '새 간판이 걸렸다. 「{공방}」', { fx: 'flash' }], ['', '강 할매네 공방은, 이제 {이름}의 공방이 되었다.'], ['', '— 에피소드 1 「강 할매네 공방」 끝 —']] }
      ] }
    };
    var css = document.createElement('style');
    css.textContent = '.st-ov,.st-ov.tut-ov{position:fixed;inset:0;z-index:10060;background:#120C08;display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif}' +
      '.st-box{position:relative;width:min(390px,100vw);height:min(844px,100vh);overflow:hidden;background:#120C08}' +
      '.st-box.fx-shake{animation:stShake .5s}.st-box.fx-knock{animation:stKnock .6s}' +
      '.st-scene{position:absolute;inset:0;overflow:hidden;animation:stFade .6s both}' +
      '.st-cg{position:absolute;inset:-4%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:46%;box-sizing:border-box;gap:16px;animation:stKB 16s ease-in-out infinite alternate}' +
      '.st-cg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.st-cg .st-sign{position:absolute;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;font-family:Jua,sans-serif;color:#3E2616;text-shadow:0 1px 0 rgba(255,230,180,.55),0 -1px 0 rgba(0,0,0,.35);letter-spacing:1px;animation:stSign 1.2s .4s both}@keyframes stSign{0%{opacity:0;transform:translate(-50%,-50%) scale(.8)}100%{opacity:1;transform:translate(-50%,-50%)}}' +
      '.st-cg b{font-size:150px;line-height:1;font-weight:400;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45));animation:stFloat 4s ease-in-out infinite}' +
      '.st-cg i{font-style:normal;font-size:13px;color:rgba(255,244,222,.75);padding:3px 12px;border-radius:10px;border:1.5px dashed rgba(255,244,222,.35);background:rgba(18,12,8,.25)}' +
      '.st-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(18,12,8,0) 45%,rgba(18,12,8,.55) 78%,rgba(18,12,8,.8) 100%)}' +
      '.st-amb{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
      '.st-amb.memory{background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,0) 40%,rgba(10,6,2,.7) 100%);mix-blend-mode:normal}.st-amb.memory::after{content:"";position:absolute;inset:0;background:rgba(170,130,80,.18);animation:stFlick 3s steps(6) infinite}' +
      '.st-amb.dark{background:radial-gradient(circle at 50% 30%,rgba(0,0,0,0) 20%,rgba(0,0,0,.7) 80%)}' +
      '.st-amb.morning{background:linear-gradient(180deg,rgba(255,230,160,.25),rgba(255,230,160,0) 60%)}.st-amb.dusk{background:linear-gradient(180deg,rgba(255,150,80,.22),rgba(255,150,80,0) 60%)}' +
      '.st-amb.moon{background:radial-gradient(circle at 50% 26%,rgba(255,250,220,.35),rgba(255,250,220,0) 40%)}' +
      '.st-pt{position:absolute;border-radius:50%;pointer-events:none}' +
      '.st-pt.dust{width:9px;height:9px;border-radius:0;background:url(ui/dust.webp) center/contain no-repeat;animation:stDust linear infinite}' +
      '.st-pt.fog{width:300px;height:130px;border-radius:0;background:url(ui/fog.webp) center/contain no-repeat;opacity:.55;animation:stFog linear infinite}' +
      '.st-pt.steam{width:46px;height:46px;background:radial-gradient(circle,rgba(255,255,255,.35),rgba(255,255,255,0) 70%);animation:stSteam ease-out infinite}' +
      '.st-pt.leaf{width:10px;height:7px;border-radius:7px 0;background:#C9853A;animation:stLeaf linear infinite}.st-pt.petal{width:14px;height:14px;border-radius:0;background:url(ui/fx_petal_pink.webp) center/contain no-repeat;animation:stLeaf linear infinite}' +
      '.st-pt.spark{width:6px;height:6px;background:#FFE7A8;box-shadow:0 0 10px #FFD66B;animation:stSpark ease-in-out infinite}' +
      '.st-enter{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 52% 30%,rgba(170,215,255,.95) 0,rgba(110,170,240,.55) 25%,rgba(18,12,8,0) 60%);animation:stEnterL 1.4s ease-in both}@keyframes stEnterL{0%{opacity:0}60%{opacity:.8}85%{opacity:1;background-color:rgba(200,230,255,.6)}100%{opacity:1;background-color:rgba(220,240,255,.9)}}@keyframes stEnter{0%{transform:scale(1);transform-origin:52% 30%}100%{transform:scale(2.3);transform-origin:52% 30%}}' +
      '.st-flash{position:absolute;inset:0;background:#FFF4DE;pointer-events:none;animation:stFlash .5s both}' +
      // 흉상 · 대사 상자 위에 붙여서 누가 말하는지 바로 보이게
      '.st-bust{position:absolute;bottom:176px;width:150px;height:178px;border-radius:70px 70px 14px 14px;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.45);border:3px solid rgba(255,244,222,.85);transition:opacity .2s}' +
      '.st-bust.l{left:18px}.st-bust.r{right:18px}.st-bust.art{background:none!important;border:0;border-radius:0;box-shadow:none;overflow:visible;width:220px;height:261px;bottom:138px}.st-bust.art.l{left:4px}.st-bust.art.r{right:4px}.st-bust.art img{object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}.st-bust.in{animation:stBustIn .32s both}.st-bust.talk{animation:stTalk .3s}' +
      '.st-bust b{font-size:96px;line-height:1;font-weight:400;margin-bottom:10px}.st-bust.shadow b,.st-bust.shadow img,.st-bust.art.shadow img{filter:brightness(0) drop-shadow(0 0 10px rgba(120,200,255,.6))}.st-bust img{width:100%;height:100%;object-fit:cover;object-position:50% 0}' +
      '.st-bust u{position:absolute;left:0;right:0;top:6px;text-decoration:none;text-align:center;font-size:10px;color:rgba(255,244,222,.7)}' +
      '.st-dlg{position:absolute;left:14px;right:14px;bottom:24px;min-height:144px;box-sizing:border-box;padding:20px 18px 30px;border-radius:20px;background:#FFF4DE;border:4px solid #5B3A24;box-shadow:inset 0 0 0 3px #F0D9AE,0 8px 20px rgba(0,0,0,.4);color:#2B1A0F}' +
      '.st-dlg:not(.narr),.uf-box,.tut-box{border:20px solid transparent!important;border-image:url(ui/dialogue_frame.webp) 40 fill / 20px stretch!important;background:none!important;box-shadow:0 8px 18px rgba(0,0,0,.35)!important;border-radius:0!important}.st-dlg:not(.narr){padding:6px 6px 16px!important}.uf-box,.tut-box{padding:6px 4px 2px!important}' +
      '.st-dlg.narr{background:rgba(30,20,12,.88);border-color:rgba(255,231,168,.55);box-shadow:0 8px 20px rgba(0,0,0,.4);color:#FFF4DE}' +
      '.st-who{position:absolute;top:-19px;padding:4px 16px;border-radius:12px;background:#5B3A24;color:#FFE7A8;font-size:16px;border:2px solid #FFF4DE}.st-who.l{left:16px}.st-who.r{right:16px}' +
      '.st-txt{font-family:"Noto Sans KR",sans-serif;font-size:16.5px;line-height:1.7;word-break:keep-all;white-space:pre-line;min-height:56px}.st-dlg.narr .st-txt{font-style:italic;color:#FFF4DE;text-align:center}' +
      '.st-txt .ch{animation:stCh .18s both}' +
      '.st-next{position:absolute;right:16px;bottom:9px;font-size:12px;color:#8A6440;animation:stBlink 1.2s infinite}.st-dlg.narr .st-next{color:#FFE7A8}' +
      '.st-skip{all:unset;cursor:pointer;position:absolute;right:14px;top:14px;z-index:5;padding:8px 14px;border-radius:14px;background:rgba(18,12,8,.45);border:2px solid rgba(255,244,222,.5);color:#FFF4DE;font-size:13px}' +
      '.st-ttl{position:absolute;left:16px;top:20px;z-index:5;color:rgba(255,244,222,.85);font-size:13px;text-shadow:0 1px 3px rgba(0,0,0,.6)}' +
      '.st-in{width:100%;box-sizing:border-box;margin:12px 0 10px;padding:12px 14px;border-radius:14px;border:3px solid #8A6440;background:#FFFDF5;font-family:"Noto Sans KR",sans-serif;font-size:18px;color:#2B1A0F;outline:none}' +
      '.st-ok{all:unset;cursor:pointer;display:block;box-sizing:border-box;width:100%;text-align:center;padding:12px 0;border-radius:16px;background:#3B7A32;border:3px solid #2F6328;box-shadow:0 4px 0 #2F6328;color:#FFFDF5;font-size:18px}' +
      '@keyframes stIn{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes stBlink{0%,100%{opacity:.4}50%{opacity:1}}' +
      '@keyframes stFade{0%{opacity:0}100%{opacity:1}}@keyframes stKB{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.07) translate(-1.5%,-1%)}}' +
      '@keyframes stFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
      '@keyframes stCh{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}' +
      '@keyframes stBustIn{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:none}}@keyframes stTalk{0%,100%{transform:none}40%{transform:translateY(-6px)}}' +
      '@keyframes stShake{0%,100%{transform:none}15%{transform:translate(-9px,3px)}30%{transform:translate(8px,-4px)}45%{transform:translate(-6px,2px)}60%{transform:translate(5px,-2px)}80%{transform:translate(-2px,1px)}}' +
      '@keyframes stKnock{0%,100%{transform:none}10%{transform:translateX(-4px)}20%{transform:none}45%{transform:translateX(-4px)}55%{transform:none}}' +
      '@keyframes stFlash{0%{opacity:.85}100%{opacity:0}}@keyframes stFlick{0%,100%{opacity:.9}50%{opacity:.6}}' +
      '@keyframes stDust{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translate(30px,-260px);opacity:0}}' +
      '@keyframes stFog{0%{transform:translateX(-300px)}100%{transform:translateX(520px)}}' +
      '@keyframes stSteam{0%{transform:translateY(0) scale(.5);opacity:0}25%{opacity:.9}100%{transform:translateY(-170px) scale(2.2);opacity:0}}' +
      '@keyframes stLeaf{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translate(-160px,700px) rotate(540deg);opacity:.6}}' +
      '@keyframes stSpark{0%,100%{transform:scale(.3);opacity:0}50%{transform:scale(1.3);opacity:1}}' +
      '@media (prefers-reduced-motion:reduce){.st-cg,.st-cg b,.st-pt,.st-txt .ch{animation:none!important}}' +
      '.uf-ov,.uf-ov.tut-ov{position:fixed;inset:0;z-index:10055;background:rgba(18,12,8,.72);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif}' +
      '.uf-box{width:min(320px,86vw);box-sizing:border-box;padding:24px 18px 18px;border-radius:24px;background:#FFF4DE;border:4px solid #5B3A24;box-shadow:inset 0 0 0 3px #F0D9AE,0 0 40px rgba(255,214,107,.6);text-align:center;color:#2B1A0F;animation:stIn .45s both}' +
      '.uf-box .ic{font-size:56px;line-height:1}.uf-box h3{margin:8px 0 4px;font-weight:400;font-size:22px}.uf-box .sub{font-size:13px;color:#8A6440}.uf-box p{margin:10px 0 14px;font-family:"Noto Sans KR",sans-serif;font-size:13.5px;line-height:1.6;color:#5B3A24;white-space:pre-line;word-break:keep-all}';
    (document.head || document.documentElement).appendChild(css);

    // 분위기 입자 · 장면마다 다른 움직임
    function ambient(layer, kind) {
      var R = Math.random, cfg = { dust: ['dust', 18], fog: ['fog', 5], steam: ['steam', 7], leaves: ['leaf', 7], petals: ['petal', 12], sparkle: ['spark', 16], moon: ['spark', 8], morning: ['dust', 10] }[kind];
      if (!cfg) { return; }
      for (var i = 0; i < cfg[1]; i++) {
        var p = document.createElement('i'); p.className = 'st-pt ' + cfg[0];
        var d = cfg[0] === 'fog' ? 14 + R() * 10 : (cfg[0] === 'leaf' || cfg[0] === 'petal' ? 7 + R() * 5 : (cfg[0] === 'steam' ? 2.6 + R() * 1.6 : 3 + R() * 5));
        p.style.animationDuration = d.toFixed(2) + 's'; p.style.animationDelay = (-R() * d).toFixed(2) + 's';
        if (cfg[0] === 'fog') { p.style.top = (35 + R() * 35).toFixed(0) + '%'; p.style.left = '0'; }
        else if (cfg[0] === 'steam') { p.style.left = (44 + R() * 10).toFixed(0) + '%'; p.style.top = '30%'; }
        else if (cfg[0] === 'leaf' || cfg[0] === 'petal') { p.style.left = (40 + R() * 70).toFixed(0) + '%'; p.style.top = '-3%'; }
        else { p.style.left = (R() * 100).toFixed(0) + '%'; p.style.top = (20 + R() * 60).toFixed(0) + '%'; }
        layer.appendChild(p);
      }
    }

    // 컷신 재생 · opt.replay 면 이름 입력은 건너뛴다
    S.storyPlay = function (id, done, opt) {
      var sc = SCENES[id]; if (!sc) { if (done) { done(); } return; }
      try { sc.steps.forEach(function (st) { (st.lines || []).forEach(function (ln) { var src = artImg(ART[ln[0]], ln[2] && ln[2].face, sc.outfit); if (src) { new Image().src = src; } }); }); } catch (e) {}
      opt = opt || {}; try { if (window.__bgmScene) { window.__bgmScene(id); } } catch (e) {}
      var ov = document.createElement('div'); ov.className = 'st-ov tut-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', sc.title);
      var box = document.createElement('div'); box.className = 'st-box'; ov.appendChild(box);
      var steps = sc.steps.filter(function (s) { return !(opt.replay && s.input); }), si = 0, li = 0;
      var dlg = null, bust = null, typing = null, lastWho = null;
      function finish() { stopType(); ov.remove(); try { if (window.__bgmScene) { window.__bgmScene(null); } } catch (e) {} var g = load(), seen = {}; for (var k in (g.scenes || {})) { seen[k] = 1; } seen[id] = 1; patch({ scenes: seen }); if (done) { done(); } }
      function stopType(full) { if (typing) { clearInterval(typing.t); if (full) { typing.el.innerHTML = ''; (typing.cs || []).forEach(function (o) { typing.el.appendChild(chEl(o)); }); } typing = null; if (dlg) { var nx = dlg.querySelector('.st-next'); if (nx) { nx.style.visibility = 'visible'; } } } }
      function fx(kind) {
        if (kind === 'shake' || kind === 'knock') { box.classList.remove('fx-shake', 'fx-knock'); void box.offsetWidth; box.classList.add('fx-' + kind); try { window.__sfx && window.__sfx(kind === 'shake' ? 'shake' : 'thud'); } catch (e) {} if (kind === 'knock') { setTimeout(function () { try { window.__sfx && window.__sfx('thud'); } catch (e) {} }, 260); } }
        if (kind === 'enter') { var cg0 = box.querySelector('.st-cg'); if (cg0) { cg0.style.animation = 'none'; void cg0.offsetWidth; cg0.style.animation = 'stEnter 1.3s ease-in forwards'; } var lt = document.createElement('div'); lt.className = 'st-enter'; box.appendChild(lt); setTimeout(function () { lt.remove(); }, 1500); try { window.__sfx && window.__sfx('whoosh'); } catch (e) {} }
        if (kind === 'flash') { var f = document.createElement('div'); f.className = 'st-flash'; box.appendChild(f); setTimeout(function () { f.remove(); }, 520); try { window.__sfx && window.__sfx('reveal'); } catch (e) {} }
      }
      function scene(st) {
        box.innerHTML = '';
        var scn = document.createElement('div'); scn.className = 'st-scene'; scn.style.background = 'radial-gradient(circle at 50% 32%,' + (st.bg || '#2B1A0F') + ',#120C08 82%)';
        var cg = document.createElement('div'); cg.className = 'st-cg';
        if (st.img) { cg.innerHTML = '<img alt="" src="' + st.img + '"' + (st.dim ? ' style="filter:' + st.dim + '"' : '') + '>'; if (st.sign) { var sg = document.createElement('span'), nm = tx('{공방}'); sg.className = 'st-sign'; sg.textContent = nm; sg.style.cssText = 'left:' + st.sign[0] + '%;top:' + st.sign[1] + '%;width:' + st.sign[2] + '%;font-size:' + Math.max(15, Math.min(30, Math.round(176 / Math.max(5, Array.from(nm).length) * 1.15))) + 'px'; cg.appendChild(sg); } }
        else if (st.pic) { cg.innerHTML = '<b aria-hidden="true">' + st.pic + '</b><i>' + (st.cap || '') + ' · 그림 자리</i>'; }
        scn.appendChild(cg);
        var amb = document.createElement('div'); amb.className = 'st-amb ' + (st.amb || ''); ambient(amb, st.amb); scn.appendChild(amb);
        var sh = document.createElement('div'); sh.className = 'st-shade'; scn.appendChild(sh);
        box.appendChild(scn);
        var ttl = document.createElement('div'); ttl.className = 'st-ttl'; ttl.textContent = sc.title; box.appendChild(ttl);
        if (!st.input) { var sk = document.createElement('button'); sk.type = 'button'; sk.className = 'st-skip'; sk.textContent = '건너뛰기 ▶▶'; sk.addEventListener('click', function (e) { e.stopPropagation(); stopType(); var rest = steps.slice(si).filter(function (s) { return s.input; }); if (rest.length) { si = steps.indexOf(rest[0]); li = 0; render(); } else { finish(); } }); box.appendChild(sk); }
        bust = null; lastWho = null;
        dlg = document.createElement('div'); dlg.className = 'st-dlg'; box.appendChild(dlg);
      }
      function setBust(who, face) {
        var a = who ? ART[who] : null;
        if (!a) { if (bust) { bust.remove(); bust = null; } lastWho = who; return; }
        var src = artImg(a, face, sc.outfit);
        if (bust && lastWho === who) {
          var im0 = bust.querySelector('img'); if (im0 && src && im0.getAttribute('src') !== src) { im0.setAttribute('src', src); }
          bust.classList.remove('talk'); void bust.offsetWidth; bust.classList.add('talk'); return;
        }
        if (bust) { bust.remove(); }
        bust = document.createElement('div'); bust.className = 'st-bust in ' + a.side + (a.shadow ? ' shadow' : '') + (src ? ' art' : '');
        if (!src) { bust.style.background = 'linear-gradient(180deg,' + a.tone + ',#1E140C)'; }
        bust.innerHTML = src ? '<img alt="" src="' + src + '">' : '<u>그림 자리</u><b aria-hidden="true">' + a.emo + '</b>';
        box.insertBefore(bust, dlg); lastWho = who;
      }
      function line() {
        var st = steps[si], ln = st.lines[li] || ['', ''], who = ln[0], a = ART[who], text = tx(ln[1]);
        setBust(who, ln[2] && ln[2].face);
        dlg.className = 'st-dlg' + (who ? '' : ' narr');
        var side = a ? a.side : 'l';
        dlg.innerHTML = (who ? '<span class="st-who ' + side + '">' + tx(who === '나' ? PN() : who) + '</span>' : '') + '<div class="st-txt" aria-live="polite"></div><span class="st-next" style="visibility:hidden">눌러서 계속 ▼</span>';
        /* ~~…~~ : 취소선 (차마 하지 못한 말) */
        var el = dlg.querySelector('.st-txt'), cs = [], stk = false, sp = who ? 34 : 42, n = 0;
        String(text).split('~~').forEach(function (seg, k) { if (k > 0) { stk = !stk; } Array.from(seg).forEach(function (ch) { cs.push({ c: ch, s: stk }); }); });
        var chars = cs.map(function (o) { return o.c; });
        stopType(); typing = { el: el, s: chars.join(''), cs: cs };
        typing.t = setInterval(function () {
          if (n >= chars.length) { stopType(); return; }
          var c = chEl(cs[n++]); el.appendChild(c); if (n % 2 === 1 && /\S/.test(chars[n - 1])) { try { window.__sfx && window.__sfx('type'); } catch (e) {} }
        }, sp);
        if (ln[2] && ln[2].fx) { fx(ln[2].fx); }
      }
      function chEl(o) { var c = document.createElement('span'); c.className = 'ch'; c.textContent = o.c; if (o.s) { c.style.textDecoration = 'line-through'; c.style.textDecorationThickness = '2px'; c.style.opacity = '.6'; } return c; }
      function render() {
        var st = steps[si]; if (!st) { finish(); return; }
        if (li === 0) { scene(st); }
        if (st.input) {
          var dv = st.defFn ? st.defFn() : (st.def || '');
          if (bust) { bust.remove(); bust = null; }
          dlg.className = 'st-dlg';
          dlg.innerHTML = '<div class="st-txt">' + st.q + '</div>';
          var inp = document.createElement('input'); inp.className = 'st-in'; inp.maxLength = st.input === 'pname' ? 6 : 10; inp.placeholder = tx(st.ph); inp.value = load()[st.input] || dv; inp.setAttribute('aria-label', st.q); dlg.appendChild(inp);
          var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'st-ok'; ok.textContent = '정했어요'; dlg.appendChild(ok);
          ok.addEventListener('click', function (e) { e.stopPropagation(); var v = (inp.value || '').trim() || dv; var p = {}; p[st.input] = v.slice(0, inp.maxLength); patch(p); if (opt.onInput) { opt.onInput(st.input, p[st.input]); } si++; li = 0; render(); });
          setTimeout(function () { try { inp.focus(); inp.select(); } catch (e2) {} }, 60);
          return;
        }
        if (st.note) { dlg.className = 'st-dlg'; dlg.innerHTML = '<div class="st-txt">' + tx(st.note) + '</div><span class="st-next">눌러서 계속 ▼</span>'; return; }
        line();
      }
      ov.addEventListener('click', function (e) {
        var st = steps[si]; if (!st || st.input) { return; }
        if (typing) { stopType(true); return; }   // 글자가 나오는 중이면 먼저 다 보여 준다
        if (st.lines && li < st.lines.length - 1) { li++; } else { si++; li = 0; }
        try { window.__sfx && window.__sfx('tap'); } catch (e2) {}
        render();
      });
      document.body.appendChild(ov); render();
    };
    S.storyScenes = function () { return Object.keys(SCENES).map(function (k) { return { id: k, title: SCENES[k].title }; }); };
    // 연출 카드 (해금 · 챕터 완료)
    function card(ic, title, sub, body, btn, done) {
      var ov = document.createElement('div'); ov.className = 'uf-ov tut-ov';
      ov.innerHTML = '<div class="uf-box" role="dialog" aria-label="' + title + '"><div class="ic">' + ic + '</div><h3>' + title + '</h3><div class="sub">' + sub + '</div><p>' + tx(body) + '</p><button type="button" class="st-ok">' + (btn || '좋아요') + '</button></div>';
      ov.querySelector('button').addEventListener('click', function () { ov.remove(); if (done) { done(); } });
      document.body.appendChild(ov);
      try { window.__sfx && window.__sfx('unlock'); } catch (e) {}
    }
    var SHN = { plate: '접시', dawan: '다완', maebyeong: '매병', moonjar: '달항아리', lotuscup: '연꽃잔', hwabyeong: '화병', hangari: '항아리' };
    var TOWN = { market: '오일장 매점', temple: '산사 다실', harbor: '항구 매점', gallery: '미술관 거리' };
    // 의뢰를 끝낸 뒤 · 새 모양 → 챕터 완료 → 에피소드 끝 순서로 보여 준다
    S.storyAfter = function (md) {
      var L = S.qlib.call({}), q = [];
      if (md.unlock) { q.push(function (nx) { card('🏺', '새 모양 「' + ((md.unlocks && md.unlocks.length ? md.unlocks : [md.unlock]).map(function (u) { return SHN[u] || u; }).join(' · ') || md.unlockNote) + '」', '물레에서 고를 수 있어요', md.who + '의 부탁 덕분에 새 모양을 익혔어요.', '물레에서 써 볼게요', nx); }); }
      if (md.chEnd) {
        var C = L.chapterOf(md), E = L.EPIS[md.kind];
        if (C) { q.push(function (nx) { card(md.kind === 'dok' ? '👹' : '📖', C.title, (md.kind === 'dok' ? '도깨비 이야기 ' : '에피소드 ') + E.n + ' · ' + md.chNo + '챕터 완료', md.who + '의 이야기가 단골 수첩에 모두 채워졌어요.' + (C.town ? '\n마을 지도에 새 구역이 열렸어요 · ' + TOWN[C.town] : ''), '다음으로', nx); }); }
      }
      if (md.id === 'm20') { q.push(function (nx) { S.storyPlay('ep1_end', nx); }); }
      if (md.id === 'd15') { q.push(function (nx) { card('🏺', '도깨비 이야기 1 · 끝', '이야기는 다음 에피소드로 이어져요', '마을 한가운데 큰 독은 왜 금이 갔을까요?\n강 할매는 도깨비 마을에 무엇을 남겼을까요?', '계속', nx); }); }
      (function run(i) { if (q[i]) { setTimeout(function () { q[i](function () { run(i + 1); }); }, i ? 200 : 900); } })(0);
    };
    // 명성 칭호
    S.fameTitle = function (lv) { lv = lv || 1; return lv >= 8 ? '명장' : (lv >= 5 ? '장인' : (lv >= 3 ? '도공' : '견습')); };

    // 공방 화면 · 이야기 카드 (지금 에피소드·챕터와 진행)
    var PAGE = ((location.pathname.split('/').pop() || '').replace('.dc.html', '').replace('.html', '')) || 'Main';
    // 안내 카드 머리 그림 : 이모지 → 그림 (없는 건 이모지 그대로) · 모든 화면에서 쓰므로 공방 전용 코드보다 먼저 정의
    var ICOM = { '🏺': 'tutorial_pottery', '🔓': 'tutorial_unlock', '🏆': 'tutorial_trophy', '🎯': 'tutorial_target', '📜': 'tutorial_scroll', '📖': 'tutorial_scroll', '🔔': 'tutorial_bell', '🌸': 'tutorial_blossom', '🔬': 'tutorial_research', '💎': 'ui_jade', '🎁': 'reward_box', '🔥': 'kiln_fire', '📌': 'ui_pin', '📋': 'ui_memo', '🥣': 'muk', '💥': 'display_broken' };
    S.ICO = function (e, px) { var k = ICOM[String(e || '').replace(/\uFE0F/g, '')]; return k ? '<img src="ui/' + k + '.webp" alt="" aria-hidden="true" style="width:' + (px || 64) + 'px;height:' + (px || 64) + 'px;object-fit:contain;display:inline-block">' : e; };
    if (PAGE !== 'Main') { return; }
    function gameK() { var n = document.querySelector('nav[aria-label="주 메뉴"]'); if (!n) { return null; } var r = n.getBoundingClientRect(); return { k: r.width / 390, l: r.left, t: r.top - 752 * (r.width / 390) }; }
    var el = null;
    function draw() {
      var R = gameK(), g = load(); if (!R) { return; }
      if (typeof g.tut !== 'number' || g.tut < 9) { if (el) { el.style.display = 'none'; } return; }
      var L = S.qlib.call({}), rows = [];
      [['main', '📖'], ['dok', '👹']].forEach(function (x) {
        var st = L.lineState(g, x[0]); if (!st.open) { return; }
        var E = L.EPIS[x[0]];
        if (st.allDone || !st.def) { rows.push(x[1] + ' ' + (x[0] === 'dok' ? '도깨비 이야기 ' : '에피소드 ') + E.n + ' 완료 · 다음 이야기를 기다려요'); return; }
        var d = st.def, C = E.chapters[d.chNo - 1];
        rows.push(x[1] + ' ' + (x[0] === 'dok' ? '도깨비 ' : 'EP') + E.n + ' · ' + d.chNo + '챕터 ' + (C ? C.title : '') + ' <b>' + (d.inCh - (st.thanks ? 0 : 1)) + '/' + d.chLen + '</b>');
      });
      if (!rows.length) { if (el) { el.style.display = 'none'; } return; }
      if (!el) {
        el = document.createElement('a'); el.href = 'Commission.dc.html'; el.setAttribute('data-sb', '1'); el.setAttribute('aria-label', '이야기 진행 · 의뢰 내역서 열기');
        el.style.cssText = 'position:fixed;z-index:30;transform-origin:0 0;display:flex;flex-direction:column;gap:2px;box-sizing:border-box;width:250px;padding:6px 10px;border-radius:12px;background:rgba(43,26,15,.82);border:2px solid #FFD66B;text-decoration:none;font-family:Jua,sans-serif;font-size:12.5px;color:#FFF4DE;box-shadow:0 3px 8px rgba(0,0,0,.3)';
        document.body.appendChild(el);
      }
      var h = rows.map(function (r) { return '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + r.replace('<b>', '<b style="font-weight:400;color:#FFD66B">') + '</span>'; }).join('');
      if (el.__h !== h) { el.innerHTML = h; el.__h = h; }
      el.style.display = 'flex'; el.style.left = (R.l + 12 * R.k).toFixed(1) + 'px'; el.style.top = (R.t + 74 * R.k).toFixed(1) + 'px'; el.style.transform = 'scale(' + R.k.toFixed(3) + ')';
    }
    setInterval(draw, 700); setTimeout(draw, 300);

    // ── 공용 작은 팝업 ──
    // 안내 카드 머리 그림 : 이모지 → 그림 (없는 건 이모지 그대로)
    function popup(ic, title, body, btns) {
      var ov = document.createElement('div'); ov.className = 'uf-ov tut-ov'; ov.style.zIndex = '10080'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', title);
      var bx = document.createElement('div'); bx.className = 'uf-box';
      bx.innerHTML = '<div class="ic">' + S.ICO(ic) + '</div><h3>' + title + '</h3><p>' + body + '</p>';
      btns.forEach(function (b, i) {
        var el = document.createElement('button'); el.type = 'button'; el.className = 'st-ok'; el.textContent = b.label;
        if (i > 0) { el.style.cssText = 'margin-top:8px;background:#FFFDF5;border-color:#8A6440;box-shadow:0 4px 0 #8A6440;color:#5B3A24'; }
        el.addEventListener('click', function (e) { e.stopPropagation(); if (!b.keep) { ov.remove(); } if (b.run) { b.run(ov, bx); } });
        bx.appendChild(el);
      });
      ov.appendChild(bx); document.body.appendChild(ov); return ov;
    }
    // ── 공방 메인의 옥 : 누르면 개발자에게 옥 받기 (테스트용) ──
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[aria-label^="옥 "]') : null;
      if (!a || !/Main|\/$/.test(location.pathname || 'Main')) { return; }
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
      function jadeNow() { var g = load(); return g.jadeV === 2 && g.jade != null ? g.jade : 0; }
      popup('💎', '옥 ' + jadeNow().toLocaleString() + '개', '옥은 상점에서 쓰거나, 작업을 바로 끝낼 때 써요.', [
        { label: '개발자한테 옥 달라고 하기 (+100)', keep: true, run: function (ov, bx) {
          var g = load(); g.jade = (g.jadeV === 2 && g.jade != null ? g.jade : 0) + 100; g.jadeV = 2; save(g);
          var h = bx.querySelector('h3'); if (h) { h.textContent = '옥 ' + g.jade.toLocaleString() + '개'; }
          try { window.__sfx && window.__sfx('coin'); } catch (e2) {}
        } },
        { label: '상점 가기', run: function () { if (window.__potGo) { window.__potGo('Shop.dc.html'); } else { location.href = 'Shop.dc.html'; } } },
        { label: '닫기' }
      ]);
    }, true);
    // ── 새 버전 안내 : 진행 기록이 있는 저장 데이터에만 한 번 ──
    var VER = '2026-11-13-story';
    setTimeout(function () {
      var cur = ''; try { cur = localStorage.getItem('potVer') || ''; } catch (e) { return; }
      if (cur === VER || document.querySelector('[aria-label="새 버전 안내"]')) { return; }
      var g = load(), tp = 0; try { tp = +(localStorage.getItem('tutProg') || 0); } catch (e) {}
      var played = (typeof g.tut === 'number' && g.tut > 0) || tp > 0; /* 기본 시드 기물만 있는 첫 실행은 제외 */
      function mark() { try { localStorage.setItem('potVer', VER); } catch (e) {} }
      if (!played) { mark(); return; }
      var ov = popup('✨', '새로운 버전이 나왔어요', '이야기와 튜토리얼 흐름이 바뀌었어요.\n초기화 후 처음부터 진행해 보시겠어요?', [
        { label: '예 · 처음부터', run: function () {
          var keep = { settings: g.settings, feedbacks: g.feedbacks };
          try { localStorage.clear(); localStorage.setItem('pottery-proto-v1', JSON.stringify(keep)); } catch (e) {}
          mark(); location.href = 'Main.dc.html';
        } },
        { label: '아니오 · 이어서 하기', run: function () { mark(); } }
      ]);
      ov.setAttribute('aria-label', '새 버전 안내');
    }, 900);

  })();
  /* 모든 화면 공통 상단 바 : 지금 받은 의뢰(이름 · 기한 · 요구 기물 칩) + 골드 · 옥 + 설정 */
  S.topVals = function (g, sel, pick) {
    var self = this, now = Date.now(), Q = null; try { Q = window.PotteryShared.qlib.call(this); } catch (e) {}
    if (!g) { try { g = JSON.parse(localStorage.getItem('pottery-proto-v1') || '{}') || {}; } catch (e) { g = {}; } }
    var v = { ptGold: (g.gold || 0).toLocaleString(), ptJade: (g.jadeV === 2 && g.jade != null ? g.jade : 0).toLocaleString() };
    var CH = 'all:unset;cursor:pointer;flex:1 1 0;min-width:0;box-sizing:border-box;height:20px;padding:0 5px;border-radius:7px;font-size:10.5px;font-weight:700;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;';
    function go(href) { if (window.__potGo) { window.__potGo(href); } else { location.href = href; } }
    var act = []; try { act = Q ? Q.active(g) : []; } catch (e) {}
    var a = act[0];
    if (!a) {
      v.ptT = '받은 의뢰가 없어요'; v.ptDue = ''; v.ptDueSt = 'display:none'; v.ptN = '없음';
      v.ptChips = [{ t: '카운터에서 손님 맞기', aria: '카운터로', st: CH + 'background:#FFF4DE;color:#5B3A24;border:2px solid #8A6440', tap: function () { if (pick) { pick(null, null); } else { try { sessionStorage.setItem('potPick', JSON.stringify({ counter: 1 })); } catch (e) {} go('Main.dc.html'); } } }];
      return v;
    }
    var AL = {}; try { AL = Q.alloc(g, act); } catch (e) {}
    var r = AL[a.id] || {}, KEYS = { main: 'mq', dok: 'dq', season: 'sq' }, at = a.at || ((g[KEYS[a.id]] || {}).at), its = a.items || (a.def && a.def.items) || [];
    if (!its.length) { var ls = {}; try { ls = Q.lineState(g, a.id); } catch (e) {} its = (ls.def && ls.def.items) || []; }
    var nIt = 0; its.forEach(function (it) { if (!it.mat) { nIt += it.n || 1; } });
    var due = a.kind === 'normal' ? a.due : (KEYS[a.id] && at ? at + (3600 + 1800 * Math.max(0, nIt - 1)) * 1000 : 0), left = due ? due - now : 0;
    function fmt(ms) { var m = Math.round(ms / 60000); return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분'; }
    v.ptN = '1건'; v.ptT = a.title || a.who || '의뢰';
    v.ptDue = due ? (left > 0 ? fmt(left) + ' 남음' : '기한 지남') : '';
    v.ptDueSt = 'flex:none;font-size:10.5px;font-weight:700;color:' + (due && left <= 0 ? '#FFB49A' : (due && left < 600000 ? '#FFD08A' : '#E8D3B5'));
    v.ptChips = (r.items || []).slice(0, 3).map(function (x, k) {
      var have = Math.min(x.n, (x.dl || 0) + (x.readyN || 0)), done = have >= x.n, on = !!x.tag && x.tag === sel, nm = (x.it && (Q && Q.baseName ? Q.baseName(x.it) : (x.it.name || x.it.shapeN))) || '기물';
      /* 진행 단계 : 🏺 성형 완료 · 🎨 시유 완료 · 🔥 굽는 중 · ✓ 완성 */
      var W = x.wipAt || {}, stg = done ? 'ok' : (W.firing || W.kiln ? 'fire' : (W.kilnList ? 'glz' : (W.glazeList || W.bisqueList || W.dryList || W.formedList ? 'form' : '')));
      var SI = { ok: '✓ ', fire: '🔥', glz: '🎨', form: '🏺', '': '' }, SN = { ok: '완성', fire: '굽는 중', glz: '시유 완료', form: '성형 완료', '': '아직 안 빚음' };
      var BG = { ok: 'background:#2F6328;color:#FFFDF5;border:2px solid #2F6328', fire: 'background:#FFE0C2;color:#8A3A1A;border:2px solid #E07A3C', glz: 'background:#DDEBF5;color:#24506E;border:2px solid #5B8DB8', form: 'background:#F3E3C4;color:#5B3A24;border:2px solid #B98A5C', '': 'background:#FFF4DE;color:#5B3A24;border:2px solid #8A6440' };
      return { t: SI[stg] + nm + (x.n > 1 ? ' ' + have + '/' + x.n : ''), aria: '요구 기물 ' + (k + 1) + ' · ' + nm + ' ' + have + '/' + x.n + ' · ' + SN[stg] + (done ? '' : ' · 누르면 이 모양·유약으로 골라요'), stage: SN[stg],
        st: CH + BG[stg] + (on && !done ? ';box-shadow:0 0 0 2px #FFE27A' : ''),
        tap: function () { if (pick) { pick(a, x); return; } try { sessionStorage.setItem('potPick', JSON.stringify({ tag: x.tag || '', id: a.id, key: x.key || '' })); } catch (e) {} go('Main.dc.html'); } };
    });
    if (!v.ptChips.length) { v.ptChips = [{ t: a.who ? a.who + '에게 가 보기' : '카운터에서 확인', aria: '카운터로', st: CH + 'background:#FFF4DE;color:#5B3A24;border:2px solid #8A6440', tap: function () { if (pick) { pick(null, null); } else { try { sessionStorage.setItem('potPick', JSON.stringify({ counter: 1 })); } catch (e) {} go('Main.dc.html'); } } }]; }
    return v;
  };
  /* ── 기물 3D 보기 : 진열대 · 보관함 · 도감에서 기물 하나를 골라 손가락으로 돌려 본다 ──
     물레 기물 = 저장된 옆모습(prof · H)을 한 바퀴 돌린 모양 · 유약 덮임 · 덧시유 · 붓 무늬는 정면 그림을 그대로 입힌다 (뒤쪽은 붓 무늬 없이) */
  S.view3d = function (p) {
    var S = this; if (!p) { return; }
    try { var old = document.getElementById('pv3d'); if (old) { old.remove(); } } catch (e) {}
    var GRC = { '명작': '#C9962E', '수작': '#3E7FA0', '양작': '#3B7A32', '범작': '#8A7A63' };
    var ov = document.createElement('div'); ov.id = 'pv3d'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', (p.name || '기물') + ' 돌려 보기');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(26,14,6,.88);display:flex;align-items:center;justify-content:center;font-family:Jua,sans-serif;touch-action:none';
    ov.innerHTML = '<div style="position:relative;width:min(92vw,400px);display:flex;flex-direction:column;gap:8px;align-items:stretch">'
      + '<div style="display:flex;align-items:center;gap:8px"><span style="flex:1 1 auto;min-width:0;font-size:20px;color:#FFF4DE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + String(p.name || '기물').replace(/</g, '&lt;') + '</span>'
      + (p.grade ? '<span style="flex:none;padding:1px 10px;border-radius:9px;background:' + (GRC[p.grade] || '#8A7A63') + ';font-size:13px;color:#FFFDF5">' + p.grade + '</span>' : '')
      + '<button type="button" data-x="1" aria-label="닫기" style="all:unset;cursor:pointer;flex:none;width:40px;height:40px;border-radius:50%;background:#FFF4DE;border:3px solid #5B3A24;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:17px;color:#5B3A24">✕</button></div>'
      + '<div data-cv="1" style="position:relative;width:100%;aspect-ratio:1/1;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 42%,#FFF6E2 0%,#EAD3AE 62%,#C9A27A 100%);border:4px solid #5B3A24;box-shadow:inset 0 0 0 3px #F0D9AE"><span data-ld="1" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;color:#7A5434">불러오는 중…</span></div>'
      + '<div style="display:flex;justify-content:center;gap:12px;font-size:13px;color:#E8D3B5">' + (p.value ? '<span>평가액 ' + Number(p.value).toLocaleString() + 'G</span>' : '') + (typeof p.skill === 'number' ? '<span>실력 ' + p.skill + '점</span>' : '') + (p.colorPct != null ? '<span>발색 ' + p.colorPct + '%</span>' : '') + '</div>'
      + '<div style="text-align:center;font-size:12px;color:#B9A88E">끌어서 돌려 보기 · 위아래로 기울이기 · 두 손가락으로 확대</div></div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('[data-cv]'), alive = true, raf = 0, ren = null;
    function close() { alive = false; cancelAnimationFrame(raf); try { ren && ren.dispose(); } catch (e) {} ov.remove(); window.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') { close(); } }
    window.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov || (e.target.closest && e.target.closest('[data-x]'))) { close(); } });
    function go() {
      if (!alive) { return; }
      var T = window.THREE; if (!T) { cv.querySelector('[data-ld]').textContent = '3D를 불러오지 못했어요'; return; }
      /* 옆모습 : 아래(0)부터 위(1)까지 반지름 */
      var TB = { dish: [70, function (u) { return 40 + 50 * Math.sqrt(u); }], cup: [130, function (u) { return 34 + 14 * u; }], bowl: [95, function (u) { return 38 + 62 * Math.pow(u, 0.6); }], jar: [140, function (u) { return 34 + 30 * Math.sin(u * Math.PI) + 10 * u; }], vase: [150, function (u) { return 30 + 26 * Math.sin(u * Math.PI * 0.9); }] };
      var r = p.prof, H = p.H; if (!r || r.length < 3) { var tt = TB[p.shape] || TB.cup; r = []; for (var i0 = 0; i0 < 12; i0++) { r.push(tt[1](i0 / 11)); } H = tt[0]; } H = H || 110;
      var n = r.length, M = 0; for (var i1 = 0; i1 < n; i1++) { M = Math.max(M, r[i1]); }
      function rad(u) { var f = u * (n - 1), j = Math.min(n - 2, Math.floor(f)), t = f - j, a = r[Math.max(0, j - 1)], b = r[j], c = r[j + 1], d = r[Math.min(n - 1, j + 2)]; return Math.max(2, 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)); }
      /* 색 : 흙(초벌) · 유약 */
      var CLB = { cw1: '#F2EEE6', cy1: '#E2C79E', cr1: '#D49A7E', ck1: '#9C8F84' }, GZ = { white: '#ECE8DE', celadon: '#9DBFA9', black: '#3B3230', jinsa: '#B5534A', sakura: '#EFB3C2', cheonmok: '#2E2A25' };
      var clay = CLB[(p.clay || '').replace(/[23]$/, '1')] || '#E2C79E', glz = p.tint || GZ[p.glaze] || (p.glaze ? '#ECE8DE' : clay);
      function dk(h, k) { var m = /^#([0-9a-f]{6})$/i.exec(h); if (!m) { return '#3E2616'; } var v = parseInt(m[1], 16); return 'rgb(' + Math.round(((v >> 16) & 255) * k) + ',' + Math.round(((v >> 8) & 255) * k) + ',' + Math.round((v & 255) * k) + ')'; }
      var geo2 = { H: H, r: r, drip: dk(glz, 0.72) }, partial = !!p.glaze && p.cov != null && (p.cov < 0.97 || !!p.g2); /* 붓 무늬는 아래 면별 무늬 층으로 따로 */
      var fF = glz, fB = glz;
      try { if (partial) { fF = fB = S.covFillTwo(glz, clay, p, geo2); } } catch (e) {}
      if (!p.glaze) { fF = fB = clay; }
      var PAD = 12, VX = -M - PAD, VY = -H - PAD, VW = 2 * M + 2 * PAD, VH = H + 2 * PAD;
      function svgOf(fill) { var host = document.getElementById('cvf-host'), defs = host ? host.innerHTML.replace(/^<defs>|<\/defs>$/g, '') : ''; return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="' + VX + ' ' + VY + ' ' + VW + ' ' + VH + '" preserveAspectRatio="none"><defs>' + defs + '</defs><rect x="' + VX + '" y="' + VY + '" width="' + VW + '" height="' + VH + '" fill="' + fill + '"/></svg>'; }
      /* 완성품 2D 처럼 : 유약 두께 차이(입구 테는 옅게 · 아래는 고여 짙게) · 굽은 맨흙 · 흙 티(철분 점) · 물레 자국 · 유약 = 매끈(광택) / 맨흙 = 거칠게 */
      var isSlab = !!(p.poly && p.poly.length > 5);
      function hexRgb(h) { var m = /^#([0-9a-f]{6})$/i.exec(h || ''), v = m ? parseInt(m[1], 16) : 0xE2C79E; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
      function rowOf(y) { return (H + PAD - y) / VH * 512; }
      var rnd = (function () { var sd = 7; String(p.id || p.name || 'x').split('').forEach(function (ch) { sd = (sd * 31 + ch.charCodeAt(0)) % 2147483647; }); return function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; })();
      function finish(c2, full, inner) {
        var rTop = rowOf(H), rBot = rowOf(0), hh = rBot - rTop, gl = !!p.glaze;
        if (gl) {
          var g1 = c2.createLinearGradient(0, rTop, 0, rBot); g1.addColorStop(0, 'rgba(255,250,240,0.14)'); g1.addColorStop(0.04, 'rgba(255,250,240,0.03)'); g1.addColorStop(0.5, 'rgba(0,0,0,0)'); g1.addColorStop(0.85, 'rgba(40,24,10,0.10)'); g1.addColorStop(1, 'rgba(40,24,10,0.20)');
          c2.fillStyle = g1; c2.fillRect(0, 0, 512, 512);
          if (full) { /* 굽 : 유약이 굽 위에서 물결지며 멈추고, 그 경계에 유약이 고여 짙다 */
            var fh = Math.max(4, hh * (isSlab ? 0.1 : 0.06)), cc = hexRgb(clay), edge = [];
            for (var x = 0; x <= 512; x += 8) { edge.push([x, rBot - fh + Math.sin(x * 0.045 + rnd() * 0.6) * fh * 0.22 + (rnd() - 0.5) * fh * 0.25]); }
            c2.beginPath(); c2.moveTo(0, 512); edge.forEach(function (q) { c2.lineTo(q[0], q[1]); }); c2.lineTo(512, 512); c2.closePath(); c2.fillStyle = 'rgb(' + cc.join(',') + ')'; c2.fill();
            c2.beginPath(); edge.forEach(function (q, i) { if (i) { c2.lineTo(q[0], q[1] - 1.5); } else { c2.moveTo(q[0], q[1] - 1.5); } }); c2.strokeStyle = 'rgba(30,18,8,0.30)'; c2.lineWidth = 3.5; c2.stroke();
          }
        }
        if (!isSlab && !inner) { for (var k = 0; k < 46; k++) { var yy = rTop + hh * (k + rnd() * 0.5) / 46; c2.fillStyle = 'rgba(' + (k % 2 ? '255,248,235' : '40,24,10') + ',' + (gl ? 0.035 : 0.06) + ')'; c2.fillRect(0, yy, 512, 1.6 + rnd() * 1.4); } }
        for (var i = 0; i < 700; i++) { var px = rnd() * 512, py = rTop + rnd() * hh, rr = 0.5 + rnd() * (rnd() < 0.1 ? 1.6 : 0.8); c2.beginPath(); c2.arc(px, py, rr, 0, 6.283); c2.fillStyle = rnd() < 0.75 ? 'rgba(70,40,20,' + (0.12 + rnd() * 0.25) + ')' : 'rgba(255,250,240,' + (0.15 + rnd() * 0.2) + ')'; c2.fill(); }
      }
      function roughOf(cnv) { /* 초록 채널 = 거칠기 : 흙색에 가까우면 거칠게(0.85), 유약이면 매끈(0.22) */
        var rc = document.createElement('canvas'); rc.width = rc.height = 128; var r2 = rc.getContext('2d'), cc = hexRgb(clay); r2.drawImage(cnv, 0, 0, 128, 128);
        try { var id = r2.getImageData(0, 0, 128, 128), d = id.data; for (var q = 0; q < d.length; q += 4) { var dd = Math.abs(d[q] - cc[0]) + Math.abs(d[q + 1] - cc[1]) + Math.abs(d[q + 2] - cc[2]), v = !p.glaze || dd < 34 ? 220 : 40; d[q] = d[q + 1] = d[q + 2] = v; d[q + 3] = 255; } r2.putImageData(id, 0, 0); } catch (e) { r2.fillStyle = p.glaze ? '#383838' : '#dcdcdc'; r2.fillRect(0, 0, 128, 128); }
        return new T.CanvasTexture(rc);
      }
      function texOf(fill, cb, inner) { var cnv = document.createElement('canvas'); cnv.width = cnv.height = 512; var c2 = cnv.getContext('2d'); c2.fillStyle = /^#|^rgb/.test(fill) ? fill : glz; c2.fillRect(0, 0, 512, 512); var tx = new T.CanvasTexture(cnv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4;
        function done() { finish(c2, !inner && !/^url/.test(fill) && !!p.glaze, inner); tx.needsUpdate = true; cb(tx, roughOf(cnv)); }
        if (!/^url/.test(fill)) { done(); return; } var im = new Image(); im.onload = function () { c2.drawImage(im, 0, 0, 512, 512); done(); }; im.onerror = done; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(fill)); }
      /* 모양 : 바깥 벽 · 입구 테 · 안쪽 벽 · 안쪽 바닥 · 굽 바닥 (정면 그림 좌표로 입힌다 · 앞 = 붓 무늬 있음, 뒤 = 없음) */
      var RINGS = 44, SEG = 72, wall = Math.max(3, M * 0.07), floorY = Math.max(4, H * 0.07);
      var posF = [], uvF = [], posB = [], uvB = [], posI = [], uvI = [];
      function uv(x, y) { return [(x - VX) / VW, 1 - ((-y) - VY) / VH]; }
      /* 붓 무늬 면 나누기 : 바깥 면을 바라보는 쪽(앞 · 오른쪽 · 뒤 · 왼쪽)으로 나눠, 그 면에서 그린 무늬를 그 방향에서 입힌다 */
      var posV = [[], [], [], []];
      function vOf(a, b, c) { var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2], nx = uy * wz - uz * wy, nz = ux * wy - uy * wx, cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3; if (nx * cx + nz * cz < 0) { nx = -nx; nz = -nz; } if (Math.abs(nx) < 1e-6 && Math.abs(nz) < 1e-6) { nx = cx; nz = cz; } var an = Math.atan2(nx, nz); return ((Math.round(an / (Math.PI / 2)) % 4) + 4) % 4; }
      var IN = false; function tri(a, b, c) { var z = (a[2] + b[2] + c[2]) / 3, fr = z >= 0 && !IN, P = IN ? posI : (fr ? posF : posB), U = IN ? uvI : (fr ? uvF : uvB); /* 안쪽은 따로 · 조금 어둡게 */ [a, b, c].forEach(function (q) { P.push(q[0], q[1], q[2]); var w = uv(q[0], q[1]); U.push(w[0], w[1]); }); if (!IN) { var vv = vOf(a, b, c); posV[vv].push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); } }
      function ring(rr, y, k) { var a = k / SEG * Math.PI * 2; return [rr * Math.sin(a), y, rr * Math.cos(a)]; }
      function strip(rf0, y0, rf1, y1, inward) { for (var k = 0; k < SEG; k++) { var a = ring(rf0, y0, k), b = ring(rf0, y0, k + 1), c = ring(rf1, y1, k + 1), d = ring(rf1, y1, k); if (inward) { tri(a, c, b); tri(a, d, c); } else { tri(a, b, c); tri(a, c, d); } } }
      var rB = rad(0);
      if (p.poly && p.poly.length > 5) {
        /* 판 기물 : 기둥(외곽선 점)마다 바깥 경로 = 굽 바닥 → 휜 띠 아래 → 테두리 → 벽 바깥 / 안쪽 경로 = 벽 안 → 띠 윗면 → 굽 윗면 */
        var PL0 = p.poly, sA = 0; PL0.forEach(function (q, i) { var w = PL0[(i + 1) % PL0.length]; sA += q[0] * w[1] - w[0] * q[1]; });
        var GE0 = S.slabGeo(PL0, p.e || null), GE = sA > 0 ? GE0.slice().reverse() : GE0, NP = GE.length, TT = p.e ? 7 : 0;
        var Hw = p.Hw != null ? p.Hw : (p.e ? 0 : Math.max(0, H - TT)), scA = p.sc || [1, 1, 1, 1, 1, 1, 1, 1], ns = scA.length, Rm = 0; PL0.forEach(function (q) { Rm = Math.max(Rm, Math.hypot(q[0], q[1])); });
        var sAt = function (u) { var f = u * (ns - 1), j0 = Math.min(ns - 2, Math.floor(f)), t = f - j0, a = scA[Math.max(0, j0 - 1)], b = scA[j0], c = scA[j0 + 1], d = scA[Math.min(ns - 1, j0 + 2)]; return Math.max(0.2, 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)); };
        var WT = Math.max(3, Math.min(TT || 5, Rm * 0.06)), LW = Hw > 0 ? Math.max(6, Math.min(RINGS, Math.round(Hw / 4))) : 0;
        var col = GE.map(function (c) {
          var ou = [[c.F[0], 0, c.F[1]]]; c.band.forEach(function (b, bi) { if (bi > 0) { ou.push([b[0], b[2], b[1]]); } }); var R0 = c.R; ou.push([R0[0], c.e + TT, R0[1]]);
          for (var w = 1; w <= LW; w++) { var s = sAt(w / LW); ou.push([R0[0] * s, c.e + TT + Hw * w / LW, R0[1] * s]); }
          var top = ou[ou.length - 1], k = Math.max(0.5, 1 - WT / Math.max(10, Math.hypot(top[0], top[2]))), inn = [];
          for (var w2 = LW; w2 >= 1; w2--) { var s2 = sAt(w2 / LW); inn.push([R0[0] * s2 * k, c.e + TT + Hw * w2 / LW, R0[1] * s2 * k]); }
          var kr = Math.max(0.5, 1 - WT / Math.max(10, Math.hypot(R0[0], R0[1]))); inn.push([R0[0] * kr, c.e + TT, R0[1] * kr]);
          for (var bj = c.band.length - 2; bj >= 0; bj--) { var b2 = c.band[bj]; inn.push([b2[0], b2[2] + TT, b2[1]]); }
          return { ou: ou, inn: inn };
        });
        var nO = col[0].ou.length, nI = col[0].inn.length;
        for (var k3 = 0; k3 < NP; k3++) { var A = col[k3], B = col[(k3 + 1) % NP];
          for (var o = 0; o < nO - 1; o++) { tri(A.ou[o], B.ou[o], B.ou[o + 1]); tri(A.ou[o], B.ou[o + 1], A.ou[o + 1]); }
          tri(A.ou[nO - 1], B.ou[nO - 1], B.inn[0]); tri(A.ou[nO - 1], B.inn[0], A.inn[0]);
          IN = true; for (var q2 = 0; q2 < nI - 1; q2++) { tri(A.inn[q2], B.inn[q2 + 1], B.inn[q2]); tri(A.inn[q2], A.inn[q2 + 1], B.inn[q2 + 1]); } IN = false; }
        var fT = col.map(function (c) { var q = c.inn[nI - 1]; return new T.Vector2(q[0], q[2]); }), trF = T.ShapeUtils.triangulateShape(fT, []), fy = TT || 2;
        IN = true; trF.forEach(function (f) { var A2 = fT[f[0]], B2 = fT[f[1]], C2 = fT[f[2]]; tri([A2.x, fy, A2.y], [C2.x, fy, C2.y], [B2.x, fy, B2.y]); }); IN = false;
        var fBot = col.map(function (c) { return new T.Vector2(c.ou[0][0], c.ou[0][2]); }), trB = T.ShapeUtils.triangulateShape(fBot, []); /* 이름이 뒷면 유약(fB)과 겹쳐 뒷면이 통째로 유약으로 칠해지던 문제 */
        trB.forEach(function (f) { var A3 = fBot[f[0]], B3 = fBot[f[1]], C3 = fBot[f[2]]; tri([A3.x, 0, A3.y], [B3.x, 0, B3.y], [C3.x, 0, C3.y]); });
        rB = Rm * 0.6; M = Math.max(M, Rm);
      } else {
      for (var j = 0; j < RINGS; j++) { var u0 = j / RINGS, u1 = (j + 1) / RINGS; strip(rad(u0), H * u0, rad(u1), H * u1, false); }
      var rTop = rad(1); strip(rTop, H, Math.max(1, rTop - wall), H, false); IN = true;
      for (var j2 = RINGS; j2 > 0; j2--) { var ua = j2 / RINGS, ub = (j2 - 1) / RINGS, ya = H * ua, yb = Math.max(floorY, H * ub); if (ya <= floorY) { break; } strip(Math.max(1, rad(ua) - wall), ya, Math.max(1, rad(ub) - wall), yb, false); }
      var rFl = Math.max(1, rad(floorY / H) - wall); for (var k2 = 0; k2 < SEG; k2++) { tri([0, floorY, 0], ring(rFl, floorY, k2), ring(rFl, floorY, k2 + 1)); }
      IN = false; for (var k3 = 0; k3 < SEG; k3++) { tri([0, 0, 0], ring(rB, 0, k3 + 1), ring(rB, 0, k3)); }
      }
      /* 부드러운 면 : 같은 자리 점끼리 법선을 모아 평균 (앞·뒤·안 조각 사이 이음매도 없앤다) */
      var NM = {}; function key(x, y, z) { return Math.round(x * 20) + ',' + Math.round(y * 20) + ',' + Math.round(z * 20); }
      [posF, posB, posI].forEach(function (P) { for (var q = 0; q < P.length; q += 9) { var ax = P[q], ay = P[q + 1], az = P[q + 2], ux = P[q + 3] - ax, uy = P[q + 4] - ay, uz = P[q + 5] - az, vx = P[q + 6] - ax, vy = P[q + 7] - ay, vz = P[q + 8] - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (var t = 0; t < 3; t++) { var kk = key(P[q + t * 3], P[q + t * 3 + 1], P[q + t * 3 + 2]), a0 = NM[kk] || (NM[kk] = [0, 0, 0]); a0[0] += nx; a0[1] += ny; a0[2] += nz; } } });
      function mk(pos, uvs) { var gg = new T.BufferGeometry(), nr = []; for (var q = 0; q < pos.length; q += 3) { var a0 = NM[key(pos[q], pos[q + 1], pos[q + 2])] || [0, 1, 0], l = Math.hypot(a0[0], a0[1], a0[2]) || 1; nr.push(a0[0] / l, a0[1] / l, a0[2] / l); } gg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); gg.setAttribute('normal', new T.Float32BufferAttribute(nr, 3)); return gg; }
      var gF = mk(posF, uvF), gB = mk(posB, uvB), gI = mk(posI, uvI);
      ren = new T.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.NoToneMapping; ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap; ren.physicallyCorrectLights = false;
      var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 1, 5000), SZ = Math.max(H, 2 * M);
      /* 주변 반사 : 따뜻한 방 + 창문 두 개 (유약 광택에 비치는 하이라이트) */
      try { var es = new T.Scene(), eg = new T.SphereGeometry(100, 32, 16), ec = []; for (var q0 = 0; q0 < eg.attributes.position.count; q0++) { var yv = eg.attributes.position.getY(q0) / 100, cl = yv > 0 ? new T.Color(0xfff3df).lerp(new T.Color(0xffffff), yv) : new T.Color(0xfff3df).lerp(new T.Color(0x5b3a24), -yv); ec.push(cl.r, cl.g, cl.b); } eg.setAttribute('color', new T.Float32BufferAttribute(ec, 3)); es.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
        [[-60, 45, 50, 40, 30], [70, 30, 20, 18, 40]].forEach(function (w) { var pm = new T.Mesh(new T.PlaneGeometry(w[3], w[4]), new T.MeshBasicMaterial({ color: 0xffffff })); pm.position.set(w[0], w[1], w[2]); pm.lookAt(0, 0, 0); pm.material.color.multiplyScalar(3); es.add(pm); });
        var pg = new T.PMREMGenerator(ren); scene.environment = pg.fromScene(es, 0.02).texture; pg.dispose(); } catch (e) {}
      scene.add(new T.HemisphereLight(0xfff6e8, 0x6b4a30, 0.5));
      var dl = new T.DirectionalLight(0xfff1dc, 0.95); dl.position.set(-0.55 * SZ, 1.3 * SZ, 0.75 * SZ); dl.castShadow = true; dl.shadow.mapSize.set(2048, 2048); dl.shadow.bias = -0.0004; dl.shadow.normalBias = 0.6; dl.shadow.radius = 4;
      var sc0 = dl.shadow.camera; sc0.left = sc0.bottom = -SZ * 1.3; sc0.right = sc0.top = SZ * 1.3; sc0.near = 1; sc0.far = SZ * 5; scene.add(dl); scene.add(dl.target);
      var fl = new T.DirectionalLight(0xdfe8ff, 0.3); fl.position.set(0.8 * SZ, 0.4 * SZ, -0.3 * SZ); scene.add(fl);
      var base = new T.Group(); base.position.y = -H / 2; scene.add(base); var grp = new T.Group(); base.add(grp);
      /* 바닥 : 그림자만 받는 투명 판 + 기물 바로 밑 부드러운 접지 그림자 */
      var gnd = new T.Mesh(new T.PlaneGeometry(SZ * 8, SZ * 8), new T.ShadowMaterial({ opacity: 0.26 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; base.add(gnd);
      var ac = document.createElement('canvas'); ac.width = ac.height = 128; var ax2 = ac.getContext('2d'), rg = ax2.createRadialGradient(64, 64, 8, 64, 64, 64); rg.addColorStop(0, 'rgba(43,26,15,0.55)'); rg.addColorStop(0.55, 'rgba(43,26,15,0.22)'); rg.addColorStop(1, 'rgba(43,26,15,0)'); ax2.fillStyle = rg; ax2.fillRect(0, 0, 128, 128);
      var ao = new T.Mesh(new T.PlaneGeometry(rB * 2.9, rB * 2.9), new T.MeshBasicMaterial({ map: new T.CanvasTexture(ac), transparent: true, depthWrite: false })); ao.rotation.x = -Math.PI / 2; ao.position.y = 0.3; base.add(ao);
      var left = 3; function one() { left--; if (left === 0) { var ld = cv.querySelector('[data-ld]'); if (ld) { ld.remove(); } } }
      function mat(tx, rt, tint) { var gm = !!p.glaze; return new T.MeshStandardMaterial({ map: tx, roughnessMap: rt, roughness: 1, metalness: 0, color: tint || 0xffffff, envMapIntensity: gm ? 0.75 : 0.3, side: T.DoubleSide }); }
      function add(gg, m) { var ms = new T.Mesh(gg, m); ms.castShadow = true; ms.receiveShadow = true; grp.add(ms); }
      texOf(fF, function (tx, rt) { add(gF, mat(tx, rt)); one(); });
      texOf(fB, function (tx, rt) { add(gB, mat(tx, rt)); one(); });
      texOf(fB, function (tx, rt) { add(gI, mat(tx, rt, 0xe6ddd2)); one(); }, true);
      /* 면별 붓 무늬 층 : 그 면이 앞으로 오게 돌린 좌표(x')로 투명 그림을 입힌다 (0 앞 = it.brush · 1~3 = it.brushV) */
      var BV = { 0: p.brush || [], 1: (p.brushV || {})[1] || [], 2: (p.brushV || {})[2] || [], 3: (p.brushV || {})[3] || [] };
      [0, 1, 2, 3].forEach(function (v) {
        var L = BV[v]; if (!L.length || !posV[v].length) { return; }
        var P = posV[v], xs = function (x, z) { return v === 0 ? x : (v === 1 ? -z : (v === 2 ? -x : z)); }, Mv = 0; for (var q = 0; q < P.length; q += 3) { Mv = Math.max(Mv, Math.abs(xs(P[q], P[q + 2]))); }
        var VXv = -Mv - PAD, VWv = 2 * Mv + 2 * PAD, uvs = []; for (var q2 = 0; q2 < P.length; q2 += 3) { uvs.push((xs(P[q2], P[q2 + 2]) - VXv) / VWv, 1 - ((-P[q2 + 1]) - VY) / VH); }
        var gg = mk(P, uvs), cnv = document.createElement('canvas'); cnv.width = cnv.height = 1024; var tx = new T.CanvasTexture(cnv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4;
        var sv = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="' + VXv + ' ' + VY + ' ' + VWv + ' ' + VH + '" preserveAspectRatio="none">' + L.map(function (b) { return '<path d="' + String(b.p).replace(/"/g, '') + '" fill="none" stroke="' + String(b.c || '#3A2A20') + '" stroke-width="' + (b.w || 4) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('') + '</svg>';
        var im = new Image(); im.onload = function () { cnv.getContext('2d').drawImage(im, 0, 0, 1024, 1024); tx.needsUpdate = true; }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sv);
        var dm = new T.Mesh(gg, new T.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, roughness: 0.35, metalness: 0, side: T.DoubleSide })); grp.add(dm);
      });
      var W = cv.clientWidth || 360; ren.setSize(W, W); ren.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab'; cv.appendChild(ren.domElement);
      /* 손에 들고 돌려 보듯 : 기물이 돌고 빛·카메라는 그대로 */
      var yaw = -0.5, pitch = 0.32, zoom = 1, auto = true, dist0 = SZ * 2.75;
      function place() { var d = dist0 / zoom; grp.rotation.y = -yaw; cam.position.set(0, d * Math.sin(pitch), d * Math.cos(pitch)); cam.lookAt(0, 0, 0); }
      var pts = {}, pd0 = 0, z0 = 1;
      ren.domElement.addEventListener('pointerdown', function (e) { auto = false; pts[e.pointerId] = [e.clientX, e.clientY]; try { ren.domElement.setPointerCapture(e.pointerId); } catch (er) {} var ks = Object.keys(pts); if (ks.length === 2) { var A = pts[ks[0]], B = pts[ks[1]]; pd0 = Math.hypot(A[0] - B[0], A[1] - B[1]); z0 = zoom; } });
      ren.domElement.addEventListener('pointermove', function (e) { var q = pts[e.pointerId]; if (!q) { return; } var ks = Object.keys(pts); if (ks.length === 1) { yaw -= (e.clientX - q[0]) * 0.011; pitch = Math.max(-0.25, Math.min(1.35, pitch + (e.clientY - q[1]) * 0.008)); } pts[e.pointerId] = [e.clientX, e.clientY]; if (ks.length === 2) { var A = pts[ks[0]], B = pts[ks[1]], dd = Math.hypot(A[0] - B[0], A[1] - B[1]); zoom = Math.max(0.7, Math.min(2.6, z0 * dd / Math.max(1, pd0))); } });
      function upP(e) { delete pts[e.pointerId]; }
      ren.domElement.addEventListener('pointerup', upP); ren.domElement.addEventListener('pointercancel', upP);
      ren.domElement.addEventListener('wheel', function (e) { e.preventDefault(); auto = false; zoom = Math.max(0.7, Math.min(2.6, zoom * (e.deltaY > 0 ? 0.92 : 1.08))); }, { passive: false });
      (function loop() { if (!alive) { return; } if (auto) { yaw += 0.006; } place(); ren.render(scene, cam); raf = requestAnimationFrame(loop); })();
    }
    if (window.THREE) { go(); return; }
    var sc = document.querySelector('script[data-three]');
    if (!sc) { sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; sc.setAttribute('data-three', '1'); document.head.appendChild(sc); }
    sc.addEventListener('load', go); sc.addEventListener('error', function () { var ld = cv.querySelector('[data-ld]'); if (ld) { ld.textContent = '3D를 불러오지 못했어요 · 인터넷 연결을 확인해요'; } });
  };
  /* 판 기물 모양 계산 (판 성형대 · 3D 보기 공용)
     바닥판 외곽선 점마다 : 굽선(60% 지점)까지는 바닥에 붙고, 그 바깥 띠가 휘어 오른다 · 띠 길이는 그대로(판 길이 보존)라 많이 올릴수록 위에서 본 테두리가 안쪽으로 당겨진다
     올림 한도 = 띠 길이의 80% · 반환 : [{ P, F, d (방향), L (띠 길이), e (올린 높이), Lh (위에서 본 띠 폭), band: [[x, y(위에서), z(높이)] × 7], R (테두리 끝) }] */
  S.slabFoot = function () {
    return 0.6;
  };
  S.slabLift = function (P) {
    return 28; /* 테두리는 낮게 휘는 정도까지만 */
  };
  S.slabGeo = function (poly, ee) {
    var FT = 0.6, NT = 6;
    return (poly || []).map(function (P, i) {
      var r = Math.hypot(P[0], P[1]) || 1, d = [P[0] / r, P[1] / r], L = (1 - FT) * r, e = Math.max(0, Math.min(28, (ee && ee[i]) || 0)); /* 띠 길이와 상관없이 같은 높이 · 28까지 */
      function arc(Lh) { var s = 0, px = 0, pz = 0; for (var k = 1; k <= 12; k++) { var t = k / 12, x = Lh * t, z = e * t * t; s += Math.hypot(x - px, z - pz); px = x; pz = z; } return s; }
      var Lh = L, F = [P[0] * FT, P[1] * FT], band = [];
      for (var k2 = 0; k2 <= NT; k2++) { var t2 = k2 / NT; band.push([F[0] + d[0] * Lh * t2, F[1] + d[1] * Lh * t2, e * t2 * t2]); }
      return { P: P, F: F, d: d, L: L, e: e, Lh: Lh, band: band, R: band[NT] };
    });
  };
  /* 판 기물 2D 그림 (선반 · 시유 · 가마 · 전시) : 판 성형대 옆모습과 같은 모양으로 · 굽 바닥 → 휜 띠 → 테두리 두께 → 벽 */
  S.slabPot = function (it, P) {
    /* 판 기물 2D : 실제 모양을 비스듬히 위에서 본 그림 (바닥 모양 그대로 · 테두리 · 벽) — 옆모습+타원 방식은 네모도 둥글게 보여서 버림 */
    var g = this.slabProj(it), o = {}, k;
    for (k in P) { o[k] = P[k]; }
    o.d = g.d; o.rimD = g.rimD; o.rings = 'none'; /* 판 기물엔 물레 자국 없음 */
    if (!window.__slabSide) { var S0 = this; ['b0', 'b1', 'b2'].forEach(function (kb) { if (o[kb] && o[kb] !== 'M0 0') { o[kb] = S0.slabBrushXf(it, o[kb]); } }); } /* 붓 무늬(앞면에서 그린 좌표) → 비스듬히 위에서 본 그림 좌표 */ o.H = g.H; o.M = g.M; o.rimY = (-g.H).toFixed(1); o.rimRx = '0'; o.rimRy = '0';
    try { var mI = /^#([0-9a-f]{6})$/i.exec(P.inner || ''); if (mI) { var vI = parseInt(mI[1], 16), AD = [24, 14.4, 7.2], kI = g.Hw > 0 ? 0.55 : 0.86, ch = [(vI >> 16) & 255, (vI >> 8) & 255, vI & 255].map(function (v, i) { var b0 = Math.max(0, Math.min(255, (v - AD[i] * 0.5) / 0.5)); return Math.max(0, Math.min(255, Math.round(b0 * kI + AD[i] * (1 - kI)))); }); o.inner = '#' + ((1 << 24) + (ch[0] << 16) + (ch[1] << 8) + ch[2]).toString(16).slice(1); } } catch (e) {}
    o.shRx = (g.M * 1.08).toFixed(1); o.shRy = Math.max(3, g.dep * 0.9).toFixed(1); o.shCy = (g.yMax * 0.55).toFixed(1);
    var side = Math.max(g.xMax - g.xMin, g.yMax - g.yMin) + 22, cx = (g.xMax + g.xMin) / 2, cy = (g.yMax + g.yMin) / 2;
    o.vb = (cx - side / 2).toFixed(1) + ' ' + (cy - side / 2).toFixed(1) + ' ' + side.toFixed(1) + ' ' + side.toFixed(1); o.sw = (side / 64).toFixed(2);
    return o;
  };
  /* 판 기물 앞면 붓 무늬 : 옆에서 본 좌표(x, -높이) → 비스듬히 위에서 본 그림(x, -높이 + 앞쪽 깊이 × K) · 절대 좌표 M/L만 옮기면 상대 좌표(도장)는 따라온다 */
  S.slabBrushXf = function (it, path) {
    try { var R = this.slabGeo(it.poly, it.e || []).map(function (c) { return c.R; }), n = R.length, K = 0.32;
      var fy = function (x) { var best = null; for (var i = 0; i < n; i++) { var a = R[i], b = R[(i + 1) % n]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { var t = (x - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * t; if (best === null || y > best) { best = y; } } } return best === null ? 0 : best; };
      return String(path).replace(/([ML])\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/g, function (m, c, x, y) { return c + x + ' ' + (+y + fy(+x) * K).toFixed(1); });
    } catch (e) { return path; } }
  S.slabProj = function (it) {
    /* 3D 점(x 좌우, y 앞뒤, z 높이) → 화면 (x, -z + y·K) · 모든 면을 캔버스에 칠해 겉윤곽만 따낸다 (오목한 모양도 정확) */
    var S = this, SIDE = !!window.__slabSide, key = JSON.stringify([it.poly, it.e, it.wall ? it.Hw : 0, it.wall ? it.sc : 0, SIDE]), C = S._spc || (S._spc = {}); /* __slabSide : 정면 옆모습(유약대에 매단 기물) */
    if (C[key]) { return C[key]; }
    var K = SIDE ? 0 : 0.32, T = 7, Hw = it.wall ? (it.Hw || 44) : 0, sc = it.sc || [1, 1], n = sc.length, GE = S.slabGeo(it.poly, it.e || []);
    function sAt(u) { if (n < 2) { return 1; } var f = u * (n - 1), j0 = Math.min(n - 2, Math.floor(f)), t = f - j0, a = sc[Math.max(0, j0 - 1)], b = sc[j0], c = sc[j0 + 1], d = sc[Math.min(n - 1, j0 + 2)]; return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); }
    function pj(p) { return [p[0], -p[2] + p[1] * K]; }
    var cols = GE.map(function (c) { var o = [[c.F[0], c.F[1], 0]]; c.band.forEach(function (b, j) { if (j) { o.push([b[0], b[1], b[2]]); } }); o.push([c.R[0], c.R[1], c.e + T]); if (Hw > 0) { for (var w = 1; w <= 10; w++) { var s = sAt(w / 10); o.push([c.R[0] * s, c.R[1] * s, c.e + T + Hw * w / 10]); } } return o.map(pj); });
    var N = cols.length, L = cols[0].length, polys = [cols.map(function (c) { return c[0]; }), cols.map(function (c) { return c[L - 1]; })];
    for (var i = 0; i < N; i++) { var A = cols[i], B = cols[(i + 1) % N]; for (var j = 0; j < L - 1; j++) { polys.push([A[j], B[j], B[j + 1], A[j + 1]]); } }
    var xMin = 1e9, xMax = -1e9, yMin = 1e9, yMax = -1e9; polys.forEach(function (q) { q.forEach(function (p) { xMin = Math.min(xMin, p[0]); xMax = Math.max(xMax, p[0]); yMin = Math.min(yMin, p[1]); yMax = Math.max(yMax, p[1]); }); });
    var sk = 2, PD = 3, W = Math.ceil((xMax - xMin) * sk) + PD * 2, Hh = Math.ceil((yMax - yMin) * sk) + PD * 2, out = null;
    try {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; var x2 = cv.getContext('2d'); x2.fillStyle = '#000';
      polys.forEach(function (q) { x2.beginPath(); q.forEach(function (p, m) { var X = (p[0] - xMin) * sk + PD, Y = (p[1] - yMin) * sk + PD; if (m) { x2.lineTo(X, Y); } else { x2.moveTo(X, Y); } }); x2.closePath(); x2.fill(); x2.lineWidth = 1.2; x2.strokeStyle = '#000'; x2.stroke(); });
      var dat = x2.getImageData(0, 0, W, Hh).data, on = function (x, y) { return x >= 0 && y >= 0 && x < W && y < Hh && dat[(y * W + x) * 4 + 3] > 110; };
      /* 겉윤곽 따라가기 (Moore) */
      var sx = -1, sy = -1; for (var yy = 0; yy < Hh && sx < 0; yy++) { for (var xx = 0; xx < W; xx++) { if (on(xx, yy)) { sx = xx; sy = yy; break; } } }
      var DX = [-1, -1, 0, 1, 1, 1, 0, -1], DY = [0, -1, -1, -1, 0, 1, 1, 1], ch = [[sx, sy]], cx = sx, cy = sy, bd = 0, guard = W * Hh;
      while (guard-- > 0) { var found = false; for (var r = 0; r < 8; r++) { var dd = (bd + r) % 8, nx = cx + DX[dd], ny = cy + DY[dd]; if (on(nx, ny)) { cx = nx; cy = ny; bd = (dd + 5) % 8; found = true; break; } } if (!found || (cx === sx && cy === sy)) { break; } ch.push([cx, cy]); }
      /* 계단 다듬기 (더글라스-포이커) */
      function dp(pts, tol) { if (pts.length < 3) { return pts; } var a = pts[0], b = pts[pts.length - 1], mi = 0, md = 0, ex = b[0] - a[0], ey = b[1] - a[1], L2 = Math.hypot(ex, ey) || 1; for (var m = 1; m < pts.length - 1; m++) { var dist = Math.abs((pts[m][0] - a[0]) * ey - (pts[m][1] - a[1]) * ex) / L2; if (dist > md) { md = dist; mi = m; } } if (md <= tol) { return [a, b]; } return dp(pts.slice(0, mi + 1), tol).slice(0, -1).concat(dp(pts.slice(mi), tol)); }
      var far = 0, fd = 0; ch.forEach(function (p, m) { var dq = Math.hypot(p[0] - sx, p[1] - sy); if (dq > fd) { fd = dq; far = m; } });
      var simp = dp(ch.slice(0, far + 1), 1.1).slice(0, -1).concat(dp(ch.slice(far).concat([ch[0]]), 1.1).slice(0, -1));
      out = simp.map(function (p) { return [(p[0] - PD) / sk + xMin, (p[1] - PD) / sk + yMin]; });
    } catch (e) { out = null; }
    if (!out || out.length < 3) { out = polys[0]; }
    function sm(q) { /* 곧은 변은 곧게 · 꼭짓점만 살짝 둥글게 (짧은 변은 그 길이의 1/3까지) */ var m = q.length, s = ''; for (var k = 0; k < m; k++) { var p0 = q[(k - 1 + m) % m], c = q[k], p1 = q[(k + 1) % m], l0 = Math.hypot(c[0] - p0[0], c[1] - p0[1]) || 1, l1 = Math.hypot(p1[0] - c[0], p1[1] - c[1]) || 1, r0 = Math.min(5, l0 / 3), r1 = Math.min(5, l1 / 3), A = [c[0] + (p0[0] - c[0]) * r0 / l0, c[1] + (p0[1] - c[1]) * r0 / l0], B = [c[0] + (p1[0] - c[0]) * r1 / l1, c[1] + (p1[1] - c[1]) * r1 / l1]; s += (k ? ' L' : 'M') + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' Q' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ' ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1); } return s + ' Z'; }
    /* 두께 : 입구(윗면)를 벽 두께만큼 안으로 줄여 그 사이에 흙 테두리가 보이게 */
    var WT = Hw > 0 ? 5.5 : 4.5, topIn = cols.map(function (c, i) { var c3 = GE[i], s1 = Hw > 0 ? sAt(1) : 1, x = c3.R[0] * s1, y = c3.R[1] * s1, z = c3.e + T + Hw, rr = Math.hypot(x, y) || 1, kk = Math.max(0.55, 1 - WT / rr); return pj([x * kk, y * kk, z]); });
    var top = SIDE ? polys[1] : topIn, H = 0, dep = 0; GE.forEach(function (c) { H = Math.max(H, c.e + T + Hw); dep = Math.max(dep, Math.abs(c.F[1]) * K); });
    var res = { d: sm(out), rimD: SIDE ? 'M0 0' : sm(top), H: H, Hw: Hw, M: Math.max(Math.abs(xMin), Math.abs(xMax)), xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax, dep: dep };
    C[key] = res; return res;
  };
})();
