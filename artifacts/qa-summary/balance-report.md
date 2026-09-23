# Balance simulation

Deterministic active play model, 50ms simulation steps, general-tier rolls; not a prediction of every player's behavior. No ads/payments. First egg 53.6s, first hatch 56.1s, base automatic hit available at 0s. 28 hatches, 14 purchases in ten minutes. Boss avoidance/input mistakes change outcomes. Equal rarity odds by latest requirement; later stages pay higher rewards but take longer to hatch. Discovery/trail/gym gains are not counted in this conservative loop.

## First ten minutes

| Minute | Dust | Pets | Speed | DPS |
|---|---:|---:|---:|---:|
|0|0|1|3.24|3|
|1|5|2|3.63|3|
|2|20|6|3.63|4.5|
|3|35|8|3.63|4.5|
|4|6|10|4.02|7.5|
|5|7|15|4.06|10|
|6|37|17|4.06|10|
|7|53|20|4.06|10|
|8|28|24|4.46|14|
|9|88|26|4.46|14|
|10|148|28|4.46|14|

## Upgrade purchases

```json
[
  {
    "second": 56,
    "upgrade": "damage",
    "level": 1,
    "dust": 0
  },
  {
    "second": 67,
    "upgrade": "speed",
    "level": 1,
    "dust": 5
  },
  {
    "second": 86,
    "upgrade": "rate",
    "level": 1,
    "dust": 15
  },
  {
    "second": 95,
    "upgrade": "carry",
    "level": 1,
    "dust": 10
  },
  {
    "second": 122,
    "upgrade": "tap",
    "level": 1,
    "dust": 20
  },
  {
    "second": 148,
    "upgrade": "training",
    "level": 1,
    "dust": 5
  },
  {
    "second": 232,
    "upgrade": "damage",
    "level": 2,
    "dust": 16
  },
  {
    "second": 240,
    "upgrade": "speed",
    "level": 2,
    "dust": 6
  },
  {
    "second": 262,
    "upgrade": "rate",
    "level": 2,
    "dust": 6
  },
  {
    "second": 308,
    "upgrade": "carry",
    "level": 2,
    "dust": 7
  },
  {
    "second": 331,
    "upgrade": "tap",
    "level": 2,
    "dust": 7
  },
  {
    "second": 419,
    "upgrade": "training",
    "level": 2,
    "dust": 23
  },
  {
    "second": 433,
    "upgrade": "damage",
    "level": 3,
    "dust": 2
  },
  {
    "second": 485,
    "upgrade": "speed",
    "level": 3,
    "dust": 28
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
        "distance": 14,
        "seconds": 9.1,
        "recommendedSpeed": 3.2
      },
      {
        "region": 1,
        "distance": 46,
        "seconds": 30,
        "recommendedSpeed": 3.2
      },
      {
        "region": 2,
        "distance": 78,
        "seconds": 50.9,
        "recommendedSpeed": 3.9
      },
      {
        "region": 3,
        "distance": 110,
        "seconds": 71.7,
        "recommendedSpeed": 5.5
      },
      {
        "region": 4,
        "distance": 142,
        "seconds": 96,
        "recommendedSpeed": 7.1
      },
      {
        "region": 5,
        "distance": 174,
        "seconds": 117.6,
        "recommendedSpeed": 8.7
      },
      {
        "region": 6,
        "distance": 206,
        "seconds": 139.2,
        "recommendedSpeed": 10.3
      },
      {
        "region": 7,
        "distance": 238,
        "seconds": 160.9,
        "recommendedSpeed": 11.9
      },
      {
        "region": 8,
        "distance": 270,
        "seconds": 189.8,
        "recommendedSpeed": 13.5
      },
      {
        "region": 9,
        "distance": 302,
        "seconds": 212.3,
        "recommendedSpeed": 15.1
      },
      {
        "region": 10,
        "distance": 334,
        "seconds": 234.8,
        "recommendedSpeed": 16.7
      },
      {
        "region": 11,
        "distance": 366,
        "seconds": 257.3,
        "recommendedSpeed": 18.3
      },
      {
        "region": 12,
        "distance": 398,
        "seconds": 292.4,
        "recommendedSpeed": 19.9
      },
      {
        "region": 13,
        "distance": 430,
        "seconds": 316,
        "recommendedSpeed": 21.5
      },
      {
        "region": 14,
        "distance": 462,
        "seconds": 339.5,
        "recommendedSpeed": 23.1
      },
      {
        "region": 15,
        "distance": 494,
        "seconds": 363,
        "recommendedSpeed": 24.7
      },
      {
        "region": 16,
        "distance": 526,
        "seconds": 406.1,
        "recommendedSpeed": 26.3
      },
      {
        "region": 17,
        "distance": 558,
        "seconds": 430.8,
        "recommendedSpeed": 27.9
      },
      {
        "region": 18,
        "distance": 590,
        "seconds": 455.5,
        "recommendedSpeed": 29.5
      },
      {
        "region": 19,
        "distance": 622,
        "seconds": 480.2,
        "recommendedSpeed": 31.1
      }
    ]
  },
  {
    "level": 5,
    "regions": [
      {
        "region": 0,
        "distance": 14,
        "seconds": 5.7,
        "recommendedSpeed": 3.2
      },
      {
        "region": 1,
        "distance": 46,
        "seconds": 18.7,
        "recommendedSpeed": 3.2
      },
      {
        "region": 2,
        "distance": 78,
        "seconds": 31.8,
        "recommendedSpeed": 3.9
      },
      {
        "region": 3,
        "distance": 110,
        "seconds": 44.8,
        "recommendedSpeed": 5.5
      },
      {
        "region": 4,
        "distance": 142,
        "seconds": 60,
        "recommendedSpeed": 7.1
      },
      {
        "region": 5,
        "distance": 174,
        "seconds": 73.5,
        "recommendedSpeed": 8.7
      },
      {
        "region": 6,
        "distance": 206,
        "seconds": 87,
        "recommendedSpeed": 10.3
      },
      {
        "region": 7,
        "distance": 238,
        "seconds": 100.5,
        "recommendedSpeed": 11.9
      },
      {
        "region": 8,
        "distance": 270,
        "seconds": 118.7,
        "recommendedSpeed": 13.5
      },
      {
        "region": 9,
        "distance": 302,
        "seconds": 132.7,
        "recommendedSpeed": 15.1
      },
      {
        "region": 10,
        "distance": 334,
        "seconds": 146.8,
        "recommendedSpeed": 16.7
      },
      {
        "region": 11,
        "distance": 366,
        "seconds": 160.8,
        "recommendedSpeed": 18.3
      },
      {
        "region": 12,
        "distance": 398,
        "seconds": 182.8,
        "recommendedSpeed": 19.9
      },
      {
        "region": 13,
        "distance": 430,
        "seconds": 197.5,
        "recommendedSpeed": 21.5
      },
      {
        "region": 14,
        "distance": 462,
        "seconds": 212.2,
        "recommendedSpeed": 23.1
      },
      {
        "region": 15,
        "distance": 494,
        "seconds": 226.9,
        "recommendedSpeed": 24.7
      },
      {
        "region": 16,
        "distance": 526,
        "seconds": 253.8,
        "recommendedSpeed": 26.3
      },
      {
        "region": 17,
        "distance": 558,
        "seconds": 269.3,
        "recommendedSpeed": 27.9
      },
      {
        "region": 18,
        "distance": 590,
        "seconds": 284.7,
        "recommendedSpeed": 29.5
      },
      {
        "region": 19,
        "distance": 622,
        "seconds": 300.1,
        "recommendedSpeed": 31.1
      }
    ]
  },
  {
    "level": 10,
    "regions": [
      {
        "region": 0,
        "distance": 14,
        "seconds": 4.2,
        "recommendedSpeed": 3.2
      },
      {
        "region": 1,
        "distance": 46,
        "seconds": 13.6,
        "recommendedSpeed": 3.2
      },
      {
        "region": 2,
        "distance": 78,
        "seconds": 23.1,
        "recommendedSpeed": 3.9
      },
      {
        "region": 3,
        "distance": 110,
        "seconds": 32.6,
        "recommendedSpeed": 5.5
      },
      {
        "region": 4,
        "distance": 142,
        "seconds": 43.6,
        "recommendedSpeed": 7.1
      },
      {
        "region": 5,
        "distance": 174,
        "seconds": 53.5,
        "recommendedSpeed": 8.7
      },
      {
        "region": 6,
        "distance": 206,
        "seconds": 63.3,
        "recommendedSpeed": 10.3
      },
      {
        "region": 7,
        "distance": 238,
        "seconds": 73.1,
        "recommendedSpeed": 11.9
      },
      {
        "region": 8,
        "distance": 270,
        "seconds": 86.3,
        "recommendedSpeed": 13.5
      },
      {
        "region": 9,
        "distance": 302,
        "seconds": 96.5,
        "recommendedSpeed": 15.1
      },
      {
        "region": 10,
        "distance": 334,
        "seconds": 106.7,
        "recommendedSpeed": 16.7
      },
      {
        "region": 11,
        "distance": 366,
        "seconds": 117,
        "recommendedSpeed": 18.3
      },
      {
        "region": 12,
        "distance": 398,
        "seconds": 132.9,
        "recommendedSpeed": 19.9
      },
      {
        "region": 13,
        "distance": 430,
        "seconds": 143.6,
        "recommendedSpeed": 21.5
      },
      {
        "region": 14,
        "distance": 462,
        "seconds": 154.3,
        "recommendedSpeed": 23.1
      },
      {
        "region": 15,
        "distance": 494,
        "seconds": 165,
        "recommendedSpeed": 24.7
      },
      {
        "region": 16,
        "distance": 526,
        "seconds": 184.6,
        "recommendedSpeed": 26.3
      },
      {
        "region": 17,
        "distance": 558,
        "seconds": 195.8,
        "recommendedSpeed": 27.9
      },
      {
        "region": 18,
        "distance": 590,
        "seconds": 207.1,
        "recommendedSpeed": 29.5
      },
      {
        "region": 19,
        "distance": 622,
        "seconds": 218.3,
        "recommendedSpeed": 31.1
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
    "hp": 30,
    "reward": 30,
    "baseAutoSeconds": 30,
    "manual4HzSeconds": 6,
    "grownAutoSeconds": 0.1
  },
  {
    "type": 1,
    "hp": 400,
    "reward": 100,
    "baseAutoSeconds": 400,
    "manual4HzSeconds": 80,
    "grownAutoSeconds": 0.9
  },
  {
    "type": 2,
    "hp": 1500,
    "reward": 300,
    "baseAutoSeconds": 1500,
    "manual4HzSeconds": 300,
    "grownAutoSeconds": 3.3
  },
  {
    "type": 3,
    "hp": 7500,
    "reward": 800,
    "baseAutoSeconds": 7500,
    "manual4HzSeconds": 1500,
    "grownAutoSeconds": 16.6
  },
  {
    "type": 4,
    "hp": 40000,
    "reward": 2400,
    "baseAutoSeconds": 40000,
    "manual4HzSeconds": 8000,
    "grownAutoSeconds": 88.7
  },
  {
    "type": 5,
    "hp": 48,
    "reward": 60,
    "baseAutoSeconds": 48,
    "manual4HzSeconds": 9.6,
    "grownAutoSeconds": 0.1
  },
  {
    "type": 6,
    "hp": 640,
    "reward": 200,
    "baseAutoSeconds": 640,
    "manual4HzSeconds": 128,
    "grownAutoSeconds": 1.4
  },
  {
    "type": 7,
    "hp": 2400,
    "reward": 600,
    "baseAutoSeconds": 2400,
    "manual4HzSeconds": 480,
    "grownAutoSeconds": 5.3
  },
  {
    "type": 8,
    "hp": 12000,
    "reward": 1600,
    "baseAutoSeconds": 12000,
    "manual4HzSeconds": 2400,
    "grownAutoSeconds": 26.6
  },
  {
    "type": 9,
    "hp": 64000,
    "reward": 4800,
    "baseAutoSeconds": 64000,
    "manual4HzSeconds": 12800,
    "grownAutoSeconds": 141.9
  },
  {
    "type": 10,
    "hp": 66,
    "reward": 150,
    "baseAutoSeconds": 66,
    "manual4HzSeconds": 13.2,
    "grownAutoSeconds": 0.1
  },
  {
    "type": 11,
    "hp": 880,
    "reward": 500,
    "baseAutoSeconds": 880,
    "manual4HzSeconds": 176,
    "grownAutoSeconds": 2
  },
  {
    "type": 12,
    "hp": 3300,
    "reward": 1500,
    "baseAutoSeconds": 3300,
    "manual4HzSeconds": 660,
    "grownAutoSeconds": 7.3
  },
  {
    "type": 13,
    "hp": 16500,
    "reward": 4000,
    "baseAutoSeconds": 16500,
    "manual4HzSeconds": 3300,
    "grownAutoSeconds": 36.6
  },
  {
    "type": 14,
    "hp": 88000,
    "reward": 12000,
    "baseAutoSeconds": 88000,
    "manual4HzSeconds": 17600,
    "grownAutoSeconds": 195.1
  },
  {
    "type": 15,
    "hp": 84,
    "reward": 300,
    "baseAutoSeconds": 84,
    "manual4HzSeconds": 16.8,
    "grownAutoSeconds": 0.2
  },
  {
    "type": 16,
    "hp": 1120,
    "reward": 1000,
    "baseAutoSeconds": 1120,
    "manual4HzSeconds": 224,
    "grownAutoSeconds": 2.5
  },
  {
    "type": 17,
    "hp": 4200,
    "reward": 3000,
    "baseAutoSeconds": 4200,
    "manual4HzSeconds": 840,
    "grownAutoSeconds": 9.3
  },
  {
    "type": 18,
    "hp": 21000,
    "reward": 8000,
    "baseAutoSeconds": 21000,
    "manual4HzSeconds": 4200,
    "grownAutoSeconds": 46.6
  },
  {
    "type": 19,
    "hp": 112000,
    "reward": 24000,
    "baseAutoSeconds": 112000,
    "manual4HzSeconds": 22400,
    "grownAutoSeconds": 248.3
  },
  {
    "type": 20,
    "hp": 102,
    "reward": 510,
    "baseAutoSeconds": 102,
    "manual4HzSeconds": 20.4,
    "grownAutoSeconds": 0.2
  },
  {
    "type": 21,
    "hp": 1360,
    "reward": 1700,
    "baseAutoSeconds": 1360,
    "manual4HzSeconds": 272,
    "grownAutoSeconds": 3
  },
  {
    "type": 22,
    "hp": 5100,
    "reward": 5100,
    "baseAutoSeconds": 5100,
    "manual4HzSeconds": 1020,
    "grownAutoSeconds": 11.3
  },
  {
    "type": 23,
    "hp": 25500,
    "reward": 13600,
    "baseAutoSeconds": 25500,
    "manual4HzSeconds": 5100,
    "grownAutoSeconds": 56.5
  },
  {
    "type": 24,
    "hp": 136000,
    "reward": 40800,
    "baseAutoSeconds": 136000,
    "manual4HzSeconds": 27200,
    "grownAutoSeconds": 301.6
  },
  {
    "type": 25,
    "hp": 120,
    "reward": 780,
    "baseAutoSeconds": 120,
    "manual4HzSeconds": 24,
    "grownAutoSeconds": 0.3
  },
  {
    "type": 26,
    "hp": 1600,
    "reward": 2600,
    "baseAutoSeconds": 1600,
    "manual4HzSeconds": 320,
    "grownAutoSeconds": 3.5
  },
  {
    "type": 27,
    "hp": 6000,
    "reward": 7800,
    "baseAutoSeconds": 6000,
    "manual4HzSeconds": 1200,
    "grownAutoSeconds": 13.3
  },
  {
    "type": 28,
    "hp": 30000,
    "reward": 20800,
    "baseAutoSeconds": 30000,
    "manual4HzSeconds": 6000,
    "grownAutoSeconds": 66.5
  },
  {
    "type": 29,
    "hp": 160000,
    "reward": 62400,
    "baseAutoSeconds": 160000,
    "manual4HzSeconds": 32000,
    "grownAutoSeconds": 354.8
  },
  {
    "type": 30,
    "hp": 138,
    "reward": 1110,
    "baseAutoSeconds": 138,
    "manual4HzSeconds": 27.6,
    "grownAutoSeconds": 0.3
  },
  {
    "type": 31,
    "hp": 1840,
    "reward": 3700,
    "baseAutoSeconds": 1840,
    "manual4HzSeconds": 368,
    "grownAutoSeconds": 4.1
  },
  {
    "type": 32,
    "hp": 6900,
    "reward": 11100,
    "baseAutoSeconds": 6900,
    "manual4HzSeconds": 1380,
    "grownAutoSeconds": 15.3
  },
  {
    "type": 33,
    "hp": 34500,
    "reward": 29600,
    "baseAutoSeconds": 34500,
    "manual4HzSeconds": 6900,
    "grownAutoSeconds": 76.5
  },
  {
    "type": 34,
    "hp": 184000,
    "reward": 88800,
    "baseAutoSeconds": 184000,
    "manual4HzSeconds": 36800,
    "grownAutoSeconds": 408
  }
]
```

Damage and rate multiply: damage levels add 자동 타격 피해 +2, rate levels add 초당 타격 +0.5회; marginal value changes with the other stat. Late automation 451 DPS is an example at both level caps, not a promised ten-minute state. Small-egg farming is useful early; long-term collection rewards grow by rarity and region. Rare failures consume the carried egg, never purchased upgrades or owned pets.
