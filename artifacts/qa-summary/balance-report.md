# Balance simulation

Deterministic active play model, 50ms simulation steps, general-tier rolls; not a prediction of every player's behavior. No ads/payments. First egg 42.6s, first hatch 43.9s, base automatic hit available at 0s. 13 hatches, 7 purchases in ten minutes. Boss avoidance/input mistakes change outcomes. Equal rarity odds by latest requirement; later stages pay higher rewards but take longer to hatch. Discovery/trail/gym gains are not counted in this conservative loop.

## First ten minutes

| Minute | Dust | Pets | Speed | DPS |
|---|---:|---:|---:|---:|
|0|196|1|1.40|4|
|1|444|2|1.40|4|
|2|486|4|1.41|4.32|
|4|1005|5|1.41|4.32|
|5|1046|5|1.41|4.32|
|6|164|7|3.22|4.4496|
|7|195|10|3.22|4.4496|
|8|267|11|3.22|4.4496|
|9|592|13|3.23|4.805568000000001|
|10|804|13|3.23|4.805568000000001|

## Upgrade purchases

```json
[
  {
    "second": 99,
    "upgrade": "damage",
    "level": 1,
    "dust": 230
  },
  {
    "second": 344,
    "upgrade": "speed",
    "level": 1,
    "dust": 423
  },
  {
    "second": 368,
    "upgrade": "rate",
    "level": 1,
    "dust": 164
  },
  {
    "second": 392,
    "upgrade": "carry",
    "level": 1,
    "dust": 16
  },
  {
    "second": 440,
    "upgrade": "tap",
    "level": 1,
    "dust": 195
  },
  {
    "second": 483,
    "upgrade": "training",
    "level": 1,
    "dust": 267
  },
  {
    "second": 525,
    "upgrade": "damage",
    "level": 2,
    "dust": 75
  }
]
```

## Roundtrip estimates (without boss/path detours)

```json
[
  {
    "level": 0,
    "regions": [
      {
        "region": 0,
        "distance": 18,
        "seconds": 8.8,
        "recommendedSpeed": 1
      },
      {
        "region": 1,
        "distance": 66,
        "seconds": 32.1,
        "recommendedSpeed": 3
      },
      {
        "region": 2,
        "distance": 114,
        "seconds": 55.5,
        "recommendedSpeed": 5
      },
      {
        "region": 3,
        "distance": 162,
        "seconds": 78.8,
        "recommendedSpeed": 7
      },
      {
        "region": 4,
        "distance": 210,
        "seconds": 102.2,
        "recommendedSpeed": 10
      },
      {
        "region": 5,
        "distance": 258,
        "seconds": 125.6,
        "recommendedSpeed": 15
      },
      {
        "region": 6,
        "distance": 306,
        "seconds": 148.9,
        "recommendedSpeed": 25
      },
      {
        "region": 7,
        "distance": 354,
        "seconds": 172.3,
        "recommendedSpeed": 40
      },
      {
        "region": 8,
        "distance": 402,
        "seconds": 195.7,
        "recommendedSpeed": 65
      },
      {
        "region": 9,
        "distance": 450,
        "seconds": 219,
        "recommendedSpeed": 100
      },
      {
        "region": 10,
        "distance": 498,
        "seconds": 242.4,
        "recommendedSpeed": 180
      },
      {
        "region": 11,
        "distance": 546,
        "seconds": 265.7,
        "recommendedSpeed": 320
      },
      {
        "region": 12,
        "distance": 594,
        "seconds": 289.1,
        "recommendedSpeed": 600
      },
      {
        "region": 13,
        "distance": 642,
        "seconds": 312.5,
        "recommendedSpeed": 1100
      },
      {
        "region": 14,
        "distance": 690,
        "seconds": 335.8,
        "recommendedSpeed": 2000
      },
      {
        "region": 15,
        "distance": 738,
        "seconds": 359.2,
        "recommendedSpeed": 4000
      },
      {
        "region": 16,
        "distance": 786,
        "seconds": 382.6,
        "recommendedSpeed": 7500
      },
      {
        "region": 17,
        "distance": 834,
        "seconds": 405.9,
        "recommendedSpeed": 14000
      },
      {
        "region": 18,
        "distance": 882,
        "seconds": 429.3,
        "recommendedSpeed": 26000
      },
      {
        "region": 19,
        "distance": 930,
        "seconds": 452.6,
        "recommendedSpeed": 50000
      }
    ]
  },
  {
    "level": 5,
    "regions": [
      {
        "region": 0,
        "distance": 18,
        "seconds": 5.2,
        "recommendedSpeed": 1
      },
      {
        "region": 1,
        "distance": 66,
        "seconds": 18.9,
        "recommendedSpeed": 3
      },
      {
        "region": 2,
        "distance": 114,
        "seconds": 32.7,
        "recommendedSpeed": 5
      },
      {
        "region": 3,
        "distance": 162,
        "seconds": 46.4,
        "recommendedSpeed": 7
      },
      {
        "region": 4,
        "distance": 210,
        "seconds": 60.2,
        "recommendedSpeed": 10
      },
      {
        "region": 5,
        "distance": 258,
        "seconds": 73.9,
        "recommendedSpeed": 15
      },
      {
        "region": 6,
        "distance": 306,
        "seconds": 87.6,
        "recommendedSpeed": 25
      },
      {
        "region": 7,
        "distance": 354,
        "seconds": 101.4,
        "recommendedSpeed": 40
      },
      {
        "region": 8,
        "distance": 402,
        "seconds": 115.1,
        "recommendedSpeed": 65
      },
      {
        "region": 9,
        "distance": 450,
        "seconds": 128.9,
        "recommendedSpeed": 100
      },
      {
        "region": 10,
        "distance": 498,
        "seconds": 142.6,
        "recommendedSpeed": 180
      },
      {
        "region": 11,
        "distance": 546,
        "seconds": 156.4,
        "recommendedSpeed": 320
      },
      {
        "region": 12,
        "distance": 594,
        "seconds": 170.1,
        "recommendedSpeed": 600
      },
      {
        "region": 13,
        "distance": 642,
        "seconds": 183.9,
        "recommendedSpeed": 1100
      },
      {
        "region": 14,
        "distance": 690,
        "seconds": 197.6,
        "recommendedSpeed": 2000
      },
      {
        "region": 15,
        "distance": 738,
        "seconds": 211.4,
        "recommendedSpeed": 4000
      },
      {
        "region": 16,
        "distance": 786,
        "seconds": 225.1,
        "recommendedSpeed": 7500
      },
      {
        "region": 17,
        "distance": 834,
        "seconds": 238.9,
        "recommendedSpeed": 14000
      },
      {
        "region": 18,
        "distance": 882,
        "seconds": 252.6,
        "recommendedSpeed": 26000
      },
      {
        "region": 19,
        "distance": 930,
        "seconds": 266.4,
        "recommendedSpeed": 50000
      }
    ]
  },
  {
    "level": 10,
    "regions": [
      {
        "region": 0,
        "distance": 18,
        "seconds": 3.4,
        "recommendedSpeed": 1
      },
      {
        "region": 1,
        "distance": 66,
        "seconds": 12.5,
        "recommendedSpeed": 3
      },
      {
        "region": 2,
        "distance": 114,
        "seconds": 21.5,
        "recommendedSpeed": 5
      },
      {
        "region": 3,
        "distance": 162,
        "seconds": 30.6,
        "recommendedSpeed": 7
      },
      {
        "region": 4,
        "distance": 210,
        "seconds": 39.6,
        "recommendedSpeed": 10
      },
      {
        "region": 5,
        "distance": 258,
        "seconds": 48.7,
        "recommendedSpeed": 15
      },
      {
        "region": 6,
        "distance": 306,
        "seconds": 57.8,
        "recommendedSpeed": 25
      },
      {
        "region": 7,
        "distance": 354,
        "seconds": 66.8,
        "recommendedSpeed": 40
      },
      {
        "region": 8,
        "distance": 402,
        "seconds": 75.9,
        "recommendedSpeed": 65
      },
      {
        "region": 9,
        "distance": 450,
        "seconds": 84.9,
        "recommendedSpeed": 100
      },
      {
        "region": 10,
        "distance": 498,
        "seconds": 94,
        "recommendedSpeed": 180
      },
      {
        "region": 11,
        "distance": 546,
        "seconds": 103.1,
        "recommendedSpeed": 320
      },
      {
        "region": 12,
        "distance": 594,
        "seconds": 112.1,
        "recommendedSpeed": 600
      },
      {
        "region": 13,
        "distance": 642,
        "seconds": 121.2,
        "recommendedSpeed": 1100
      },
      {
        "region": 14,
        "distance": 690,
        "seconds": 130.2,
        "recommendedSpeed": 2000
      },
      {
        "region": 15,
        "distance": 738,
        "seconds": 139.3,
        "recommendedSpeed": 4000
      },
      {
        "region": 16,
        "distance": 786,
        "seconds": 148.4,
        "recommendedSpeed": 7500
      },
      {
        "region": 17,
        "distance": 834,
        "seconds": 157.4,
        "recommendedSpeed": 14000
      },
      {
        "region": 18,
        "distance": 882,
        "seconds": 166.5,
        "recommendedSpeed": 26000
      },
      {
        "region": 19,
        "distance": 930,
        "seconds": 175.5,
        "recommendedSpeed": 50000
      }
    ]
  }
]
```

## Egg hatch times

```json
[
  {
    "type": 0,
    "hp": 51,
    "reward": 196,
    "baseAutoSeconds": 51,
    "manual4HzSeconds": 10.2,
    "grownAutoSeconds": 0.1
  },
  {
    "type": 1,
    "hp": 76,
    "reward": 1136,
    "baseAutoSeconds": 76,
    "manual4HzSeconds": 15.2,
    "grownAutoSeconds": 0.2
  },
  {
    "type": 2,
    "hp": 113,
    "reward": 6559,
    "baseAutoSeconds": 113,
    "manual4HzSeconds": 22.6,
    "grownAutoSeconds": 0.3
  },
  {
    "type": 3,
    "hp": 167,
    "reward": 37859,
    "baseAutoSeconds": 167,
    "manual4HzSeconds": 33.4,
    "grownAutoSeconds": 0.4
  },
  {
    "type": 4,
    "hp": 246,
    "reward": 218523,
    "baseAutoSeconds": 246,
    "manual4HzSeconds": 49.2,
    "grownAutoSeconds": 0.5
  },
  {
    "type": 5,
    "hp": 82,
    "reward": 216,
    "baseAutoSeconds": 82,
    "manual4HzSeconds": 16.4,
    "grownAutoSeconds": 0.2
  },
  {
    "type": 6,
    "hp": 122,
    "reward": 1250,
    "baseAutoSeconds": 122,
    "manual4HzSeconds": 24.4,
    "grownAutoSeconds": 0.3
  },
  {
    "type": 7,
    "hp": 181,
    "reward": 7215,
    "baseAutoSeconds": 181,
    "manual4HzSeconds": 36.2,
    "grownAutoSeconds": 0.4
  },
  {
    "type": 8,
    "hp": 267,
    "reward": 41645,
    "baseAutoSeconds": 267,
    "manual4HzSeconds": 53.4,
    "grownAutoSeconds": 0.6
  },
  {
    "type": 9,
    "hp": 393,
    "reward": 240375,
    "baseAutoSeconds": 393,
    "manual4HzSeconds": 78.6,
    "grownAutoSeconds": 0.9
  },
  {
    "type": 10,
    "hp": 122,
    "reward": 246,
    "baseAutoSeconds": 122,
    "manual4HzSeconds": 24.4,
    "grownAutoSeconds": 0.3
  },
  {
    "type": 11,
    "hp": 183,
    "reward": 1420,
    "baseAutoSeconds": 183,
    "manual4HzSeconds": 36.6,
    "grownAutoSeconds": 0.4
  },
  {
    "type": 12,
    "hp": 271,
    "reward": 8198,
    "baseAutoSeconds": 271,
    "manual4HzSeconds": 54.2,
    "grownAutoSeconds": 0.6
  },
  {
    "type": 13,
    "hp": 401,
    "reward": 47323,
    "baseAutoSeconds": 401,
    "manual4HzSeconds": 80.2,
    "grownAutoSeconds": 0.9
  },
  {
    "type": 14,
    "hp": 590,
    "reward": 273154,
    "baseAutoSeconds": 590,
    "manual4HzSeconds": 118,
    "grownAutoSeconds": 1.3
  },
  {
    "type": 15,
    "hp": 224,
    "reward": 285,
    "baseAutoSeconds": 224,
    "manual4HzSeconds": 44.8,
    "grownAutoSeconds": 0.5
  },
  {
    "type": 16,
    "hp": 335,
    "reward": 1647,
    "baseAutoSeconds": 335,
    "manual4HzSeconds": 67,
    "grownAutoSeconds": 0.7
  },
  {
    "type": 17,
    "hp": 497,
    "reward": 9510,
    "baseAutoSeconds": 497,
    "manual4HzSeconds": 99.4,
    "grownAutoSeconds": 1.1
  },
  {
    "type": 18,
    "hp": 734,
    "reward": 54895,
    "baseAutoSeconds": 734,
    "manual4HzSeconds": 146.8,
    "grownAutoSeconds": 1.6
  },
  {
    "type": 19,
    "hp": 1081,
    "reward": 316858,
    "baseAutoSeconds": 1081,
    "manual4HzSeconds": 216.2,
    "grownAutoSeconds": 2.4
  },
  {
    "type": 20,
    "hp": 367,
    "reward": 354,
    "baseAutoSeconds": 367,
    "manual4HzSeconds": 73.4,
    "grownAutoSeconds": 0.8
  },
  {
    "type": 21,
    "hp": 548,
    "reward": 2045,
    "baseAutoSeconds": 548,
    "manual4HzSeconds": 109.6,
    "grownAutoSeconds": 1.2
  },
  {
    "type": 22,
    "hp": 813,
    "reward": 11806,
    "baseAutoSeconds": 813,
    "manual4HzSeconds": 162.6,
    "grownAutoSeconds": 1.8
  },
  {
    "type": 23,
    "hp": 1202,
    "reward": 68146,
    "baseAutoSeconds": 1202,
    "manual4HzSeconds": 240.4,
    "grownAutoSeconds": 2.7
  },
  {
    "type": 24,
    "hp": 1769,
    "reward": 393341,
    "baseAutoSeconds": 1769,
    "manual4HzSeconds": 353.8,
    "grownAutoSeconds": 3.9
  },
  {
    "type": 25,
    "hp": 663,
    "reward": 433,
    "baseAutoSeconds": 663,
    "manual4HzSeconds": 132.6,
    "grownAutoSeconds": 1.5
  },
  {
    "type": 26,
    "hp": 989,
    "reward": 2500,
    "baseAutoSeconds": 989,
    "manual4HzSeconds": 197.8,
    "grownAutoSeconds": 2.2
  },
  {
    "type": 27,
    "hp": 1468,
    "reward": 14430,
    "baseAutoSeconds": 1468,
    "manual4HzSeconds": 293.6,
    "grownAutoSeconds": 3.3
  },
  {
    "type": 28,
    "hp": 2170,
    "reward": 83290,
    "baseAutoSeconds": 2170,
    "manual4HzSeconds": 434,
    "grownAutoSeconds": 4.8
  },
  {
    "type": 29,
    "hp": 3195,
    "reward": 480751,
    "baseAutoSeconds": 3195,
    "manual4HzSeconds": 639,
    "grownAutoSeconds": 7.1
  },
  {
    "type": 30,
    "hp": 1377,
    "reward": 511,
    "baseAutoSeconds": 1377,
    "manual4HzSeconds": 275.4,
    "grownAutoSeconds": 3.1
  },
  {
    "type": 31,
    "hp": 2055,
    "reward": 2954,
    "baseAutoSeconds": 2055,
    "manual4HzSeconds": 411,
    "grownAutoSeconds": 4.6
  },
  {
    "type": 32,
    "hp": 3050,
    "reward": 17053,
    "baseAutoSeconds": 3050,
    "manual4HzSeconds": 610,
    "grownAutoSeconds": 6.8
  },
  {
    "type": 33,
    "hp": 4507,
    "reward": 98433,
    "baseAutoSeconds": 4507,
    "manual4HzSeconds": 901.4,
    "grownAutoSeconds": 10
  },
  {
    "type": 34,
    "hp": 6635,
    "reward": 568160,
    "baseAutoSeconds": 6635,
    "manual4HzSeconds": 1327,
    "grownAutoSeconds": 14.7
  },
  {
    "type": 35,
    "hp": 224,
    "reward": 285,
    "baseAutoSeconds": 224,
    "manual4HzSeconds": 44.8,
    "grownAutoSeconds": 0.5
  }
]
```

Damage and rate multiply: damage levels add 자동 피해 +8% · 팀 생산 +1%p, rate levels add 초당 타격 +0.03회 · 팀 생산 +1%p; marginal value changes with the other stat. Late automation 451 DPS is an example at both level caps, not a promised ten-minute state. Small-egg farming is useful early; long-term collection rewards grow by rarity and region. Rare failures consume the carried egg, never purchased upgrades or owned pets.
