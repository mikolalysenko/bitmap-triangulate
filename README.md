bitmap-triangulate
==================
Triangulates a 2D bitmap image.

# Example

```javascript
var pack = require("ndarray-pack")
var bitmap = pack([
  [1, 1, 1, 1],
  [1, 0, 1, 1],
  [1, 1, 0, 1],
  [1, 1, 1, 0]
])

var mesh = require("bitmap-triangulate")(bitmap)
```

# Install

```
npm install bitmap-triangulate
```

# API

### `require("bitmap-triangulate")(bitmap)`
Triangulates a 2D bitmap

* `bitmap` is a 2D ndarray encoding an image

**Returns** A simplicial complex with two properties:

* `cells` which are the faces of the triangulation
* `positions` which are the vertices

# Credits
(c) 2014 Mikola Lysenko. MIT License