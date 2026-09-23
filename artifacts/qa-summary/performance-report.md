# Performance measurements

```json
{
  "readyMs": 1238,
  "initialDevelopmentTransferBytes": 3652804,
  "modelRequests": 65,
  "base": {
    "frame": 13,
    "calls": 60,
    "triangles": 29262,
    "points": 0,
    "lines": 0,
    "memory": {
      "geometries": 44,
      "textures": 1
    },
    "objects": 18,
    "camera": [
      8,
      11.3,
      13
    ],
    "player": [
      0.09462198098384404,
      0.012677951130871192,
      -0.7900847865231838
    ],
    "fallen": false,
    "selection": []
  },
  "giant": {
    "frame": 93,
    "calls": 94,
    "triangles": 32452,
    "points": 0,
    "lines": 0,
    "memory": {
      "geometries": 74,
      "textures": 1
    },
    "objects": 18,
    "camera": [
      8,
      11.3,
      13
    ],
    "player": [
      0.09462198098384404,
      0.012677951130871192,
      -0.7900847865231838
    ],
    "fallen": false,
    "selection": []
  },
  "hazardScenes": [
    {
      "id": "tentacle",
      "frame": 211,
      "calls": 48,
      "triangles": 29190,
      "points": 0,
      "lines": 0,
      "memory": {
        "geometries": 82,
        "textures": 1
      },
      "objects": 18,
      "camera": [
        8,
        11.3,
        -3.4000000000000004
      ],
      "player": [
        -0.18387734215069393,
        -0.11168487146527294,
        -0.8077367642629227
      ],
      "fallen": false,
      "selection": []
    },
    {
      "id": "laser",
      "frame": 240,
      "calls": 48,
      "triangles": 25940,
      "points": 0,
      "lines": 0,
      "memory": {
        "geometries": 87,
        "textures": 1
      },
      "objects": 18,
      "camera": [
        8,
        11.3,
        -3.4000000000000004
      ],
      "player": [
        -0.18387734215069393,
        -0.11168487146527294,
        -0.8077367642629227
      ],
      "fallen": false,
      "selection": []
    },
    {
      "id": "meteors",
      "frame": 257,
      "calls": 52,
      "triangles": 58066,
      "points": 0,
      "lines": 0,
      "memory": {
        "geometries": 92,
        "textures": 1
      },
      "objects": 18,
      "camera": [
        8,
        11.3,
        -3.4000000000000004
      ],
      "player": [
        -0.18387734215069393,
        -0.11168487146527294,
        -0.8077367642629227
      ],
      "fallen": false,
      "selection": []
    },
    {
      "id": "creation-wave",
      "frame": 276,
      "calls": 49,
      "triangles": 46010,
      "points": 0,
      "lines": 0,
      "memory": {
        "geometries": 97,
        "textures": 1
      },
      "objects": 18,
      "camera": [
        8,
        11.3,
        -3.4000000000000004
      ],
      "player": [
        -0.18387734215069393,
        -0.11168487146527294,
        -0.8077367642629227
      ],
      "fallen": false,
      "selection": []
    }
  ],
  "frameMs": {
    "median": 18.200000000000045,
    "p95": 24.300000000000182,
    "max": 35.59999999999991
  },
  "sceneSwitchMemory": [
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    },
    {
      "geometries": 75,
      "textures": 1
    }
  ],
  "bundle": {
    "jsBytes": 699624,
    "gzipBytes": 196161
  },
  "limits": "Desktop headless Edge/SwiftShader, no network throttling. Not mobile WebView FPS; 180 frames and 12 scene switches are a short soak, not long-term device validation."
}
```
