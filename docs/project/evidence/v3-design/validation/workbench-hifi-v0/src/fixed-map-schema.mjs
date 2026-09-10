/** Fixed presentation geometry from the user-reviewed fixed-map-skeleton-v2.
 * Route geometry is independent of labels, acquisition order and selection.
 * These ID locations are not obtained facts and are never rendered by themselves.
 */
export const SCALE = 1.5;
export const WORLD_WIDTH = 1104;
export const WORLD_HEIGHT = 2760;
export const NAMES = {
  "W": "obs.current.whole",
  "B": "obs.current.base",
  "P": "obs.phase.t1",
  "C": "obs.corpus.identity",
  "X": "obs.structure.xray.early",
  "D": "obs.structure.major.cross-time",
  "H": "interpretation:photo-change",
  "T2": "obs.accident.major",
  "DA": "obs.structure.major.documented-cross-time",
  "HA": "interpretation:archive-change",
  "EARLY": "interpretation:photo-repair",
  "T3": "obs.phase.t3",
  "ID": "claim:identity",
  "MAJOR": "claim:majorReassembly",
  "THREE": "claim:threePhase",
  "ALL": "claim:coherentDecisionProfile",
  "DECOR": "obs.appearance.restore",
  "UV": "obs.surface.no-signal.unresolved",
  "MAT": "obs.key-material.substrate-readings",
  "LAYER": "obs.key-material.layer-sequence",
  "POINT": "obs.surface.point-layering",
  "SURF": "obs.surface.resolved",
  "STAB": "obs.stability.resolved",
  "PROV": "obs.documentation.resolved"
};
export const POSITIONS = {
  "W": [
    350,
    90
  ],
  "B": [
    150,
    195
  ],
  "P": [
    320,
    265
  ],
  "C": [
    85,
    370
  ],
  "X": [
    630,
    155
  ],
  "D": [
    580,
    320
  ],
  "H": [
    615,
    485
  ],
  "T2": [
    425,
    590
  ],
  "DA": [
    280,
    710
  ],
  "HA": [
    370,
    815
  ],
  "EARLY": [
    160,
    835
  ],
  "T3": [
    620,
    965
  ],
  "ID": [
    205,
    530
  ],
  "MAJOR": [
    565,
    755
  ],
  "THREE": [
    385,
    1085
  ],
  "DECOR": [
    95,
    1160
  ],
  "UV": [
    215,
    1230
  ],
  "MAT": [
    615,
    1170
  ],
  "LAYER": [
    605,
    1300
  ],
  "POINT": [
    130,
    1370
  ],
  "SURF": [
    250,
    1460
  ],
  "STAB": [
    585,
    1480
  ],
  "PROV": [
    120,
    1540
  ],
  "ALL": [
    390,
    1750
  ]
};
export const LABELS = {
  "W": [
    "整器形制",
    "与可见修补"
  ],
  "B": [
    "底足制造痕迹"
  ],
  "P": [
    "旧照片"
  ],
  "C": [
    "同期真品比对"
  ],
  "X": [
    "当前内部",
    "接合痕迹"
  ],
  "D": [
    "旧照—现状",
    "区域差异报告"
  ],
  "H": [
    "此碗两个时点间",
    "的区域变化"
  ],
  "T2": [
    "事故记录组"
  ],
  "DA": [
    "事故记录—现状",
    "比较报告"
  ],
  "HA": [
    "事故处理",
    "与现物的对应"
  ],
  "EARLY": [
    "照片拍摄时",
    "已有锔修痕迹"
  ],
  "T3": [
    "后期处理记录"
  ],
  "ID": [
    "晚18世纪",
    "外销瓷方向"
  ],
  "MAJOR": [
    "曾发生",
    "重大重组"
  ],
  "THREE": [
    "修复史可分为",
    "三个阶段"
  ],
  "ALL": [
    "形成可用于决策的",
    "连贯说明"
  ],
  "DECOR": [
    "外观重整痕迹"
  ],
  "UV": [
    "紫外未见",
    "补绘信号"
  ],
  "MAT": [
    "关键点位",
    "基底读数"
  ],
  "LAYER": [
    "关键界面",
    "层序读数"
  ],
  "POINT": [
    "试窗点位",
    "层压关系"
  ],
  "SURF": [
    "表面处理",
    "覆盖范围"
  ],
  "STAB": [
    "承力与陈列条件"
  ],
  "PROV": [
    "流转记录",
    "可追边界"
  ]
};
export const GROUPS = {
  "proof-group:major:documented-current": {
    "key": "JAC",
    "xy": [470, 675]
  },
  "proof-group:identity:comparison": {
    "key": "JC",
    "xy": [
      160,
      435
    ],
    "label": "比对路线"
  },
  "proof-group:identity:continuity": {
    "key": "JP",
    "xy": [
      260,
      435
    ],
    "label": "核验路线"
  },
  "interpretation-group:photo": {
    "key": "JH",
    "xy": [
      550,
      430
    ]
  },
  "proof-group:major:physical": {
    "key": "JM",
    "xy": [
      610,
      650
    ],
    "label": "物证路线"
  },
  "proof-group:major:documented-cross-time": {
    "key": "JA",
    "xy": [
      470,
      735
    ]
  },
  "interpretation-group:archive": {
    "key": "JDA",
    "xy": [
      335,
      770
    ]
  },
  "proof-group:threePhase": {
    "key": "JT",
    "xy": [
      385,
      1000
    ]
  },
  "proof-group:coherentDecisionProfile": {
    "key": "JALL",
    "xy": [
      390,
      1650
    ]
  }
};
export const GUIDES = {
  "B>P": [
    [
      205,
      230
    ],
    [
      260,
      228
    ]
  ],
  "P>EARLY": [
    [
      319,
      365
    ],
    [
      310,
      628
    ],
    [
      230,
      751
    ]
  ],
  "T2>W": [
    [
      450,
      520
    ],
    [
      465,
      380
    ],
    [
      444,
      178
    ]
  ],
  "T3>W": [
    [
      690,
      895
    ],
    [
      711,
      520
    ],
    [
      713,
      210
    ],
    [
      580,
      73
    ],
    [
      430,
      65
    ]
  ],
  "W>C": [
    [
      230,
      120
    ],
    [
      86,
      235
    ]
  ],
  "B>C": [
    [
      124,
      270
    ]
  ],
  "POINT>SURF": [
    [
      165,
      1410
    ],
    [
      215,
      1405
    ]
  ],
  "P>D": [
    [
      405,
      284
    ],
    [
      470,
      280
    ]
  ],
  "W>D": [
    [
      423,
      175
    ],
    [
      493,
      239
    ]
  ],
  "X>D": [
    [
      650,
      245
    ]
  ],
  "T2>DA": [
    [
      374,
      635
    ],
    [
      317,
      635
    ]
  ],
  "W>DA": [
    [
      385,
      178
    ],
    [
      394,
      465
    ],
    [
      341,
      565
    ],
    [
      240,
      648
    ]
  ],
  "W>JC": [
    [
      245,
      145
    ],
    [
      190,
      310
    ]
  ],
  "B>JC": [
    [
      136,
      300
    ]
  ],
  "C>JC": [
    [
      110,
      413
    ]
  ],
  "W>JP": [
    [
      321,
      177
    ],
    [
      265,
      320
    ]
  ],
  "B>JP": [
    [
      204,
      260
    ],
    [
      219,
      370
    ]
  ],
  "P>JP": [
    [
      312,
      350
    ]
  ],
  "D>JH": [
    [
      584,
      377
    ]
  ],
  "P>JH": [
    [
      395,
      328
    ],
    [
      480,
      383
    ]
  ],
  "JH>H": [
    [
      588,
      448
    ]
  ],
  "W>JM": [
    [
      532,
      77
    ],
    [
      687,
      110
    ],
    [
      696,
      428
    ],
    [
      681,
      579
    ]
  ],
  "X>JM": [
    [
      671,
      272
    ],
    [
      664,
      517
    ]
  ],
  "H>JM": [
    [
      631,
      560
    ]
  ],
  "T2>MAJOR": [
    [
      488,
      619
    ],
    [
      520,
      680
    ]
  ],
  "T2>JA": [
    [
      455,
      652
    ]
  ],
  "HA>JA": [
    [
      430,
      790
    ]
  ],
  "DA>JDA": [
    [
      300,
      754
    ]
  ],
  "T2>JDA": [
    [
      402,
      700
    ],
    [
      385,
      741
    ]
  ],
  "JDA>HA": [
    [
      350,
      802
    ]
  ],
  "EARLY>JT": [
    [
      214,
      895
    ],
    [
      285,
      918
    ]
  ],
  "T2>JT": [
    [
      464,
      848
    ],
    [
      445,
      930
    ]
  ],
  "T3>JT": [
    [
      525,
      965
    ],
    [
      444,
      993
    ]
  ],
  "ID>JALL": [
    [
      62,
      609
    ],
    [
      35,
      972
    ],
    [
      38,
      1460
    ],
    [
      200,
      1624
    ]
  ],
  "MAJOR>JALL": [
    [
      682,
      829
    ],
    [
      716,
      1220
    ],
    [
      705,
      1535
    ],
    [
      548,
      1641
    ]
  ],
  "THREE>JALL": [
    [
      376,
      1250
    ],
    [
      404,
      1480
    ]
  ],
  "MAT>JALL": [
    [
      521,
      1214
    ],
    [
      479,
      1430
    ],
    [
      438,
      1586
    ]
  ],
  "LAYER>JALL": [
    [
      558,
      1355
    ],
    [
      514,
      1545
    ]
  ],
  "SURF>JALL": [
    [
      285,
      1508
    ],
    [
      325,
      1592
    ]
  ],
  "STAB>JALL": [
    [
      574,
      1551
    ],
    [
      487,
      1614
    ]
  ],
  "PROV>JALL": [
    [
      225,
      1575
    ],
    [
      307,
      1620
    ]
  ]
};
