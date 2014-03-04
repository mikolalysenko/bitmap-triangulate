"use strict"

var tape = require("tape")
var pack = require("ndarray-pack")
var contour = require("contour-2d")
var euler = require("euler-characteristic")
var differential = require("boundary-cells")

var triangulate = require("../ortho.js")

function compareVertex(a,b) {
  var d = a[0] - b[0]
  if(d) {
    return d
  }
  return a[1] - b[1]
}

tape("orthogonal triangulation", function(t) {
  function verify(bitmap) {
    var image = pack(bitmap)
    for(var q=0; q<2; ++q)
    for(var s=-1; s<=1; s+=2) {
      var array = image.step(s,1).transpose(q, q^1)
      var mesh = triangulate(array)
      var curve = contour(array, true)

      //Check that topology matches up
      var nv = 0
      var genus = 0
      var perimeter = 0
      var area = 0.0
      for(var i=0; i<curve.length; ++i) {
        nv += curve[i].length
        var topLeft = 0
        for(var j=0; j<curve[i].length; ++j) {
          var a = curve[i][j]
          var b = curve[i][(j+1)%curve[i].length]
          var dx = a[0] - b[0]
          var dy = a[1] - b[1]
          perimeter += Math.sqrt(dx*dx + dy*dy)
          area += a[0] * b[1] - a[1] * b[0]
          if(compareVertex(a, curve[i][topLeft]) < 0) {
            topLeft = j
          }
        }
        var next = curve[i][(topLeft + 1) % curve[i].length]
        if(next[0] === curve[i][topLeft][0]) {
          genus -= 1
        } else {
          genus += 1
        }
      }

      //Check topology
      t.equals(mesh.positions.length, nv, "checking number of vertices")
      t.equals(euler(mesh.cells), genus, "checking genus")
      t.equals(mesh.cells.length, nv - 2 * genus, "checking face count")

      //Check boundary
      var d = differential(mesh.cells)
      t.equals(d.length, nv)
      
      //Compute length of boundary
      var perim_computed = 0.0
      for(var i=0; i<d.length; ++i) {
        var a = mesh.positions[d[i][0]]
        var b = mesh.positions[d[i][1]]
        perim_computed += Math.sqrt(Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2))
      }
      t.ok(Math.abs(perim_computed-perimeter) < 1e-6, "checking perimenter")

      //Compute area
      var area_computed = 0.0
      for(var i=0; i<mesh.cells.length; ++i) {
        var f = mesh.cells[i]
        var a = mesh.positions[f[0]]
        var b = mesh.positions[f[1]]
        var c = mesh.positions[f[2]]
        var ab = [ b[0]-a[0], b[1]-a[1] ]
        var ac = [ c[0]-a[0], c[1]-a[1] ]
        area_computed += ab[0] * ac[1] - ab[1] * ac[0]
      }
      t.ok(Math.abs(area_computed - area) < 1e-6, "checking area")
    }
  }
  verify([
    [1]
  ])

  verify([
    [1,1]
  ])

  verify([
    [0]
  ])

  verify([
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]
  ])

  verify([
    [0, 1, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 1],
    [0, 0, 0, 0]
  ])

  verify([
    [1, 1, 1, 1, 1,0],
    [1, 0, 1, 0, 1,0],
    [1, 1, 1, 1, 1,0]
  ])

  verify([
    [ 0, 1],
    [ 1, 0]
  ])

  verify([
    [ 1, 0],
    [ 0, 1]
  ])

  t.end()
})