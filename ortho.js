"use strict"

module.exports = orthoTriangulate

var bounds = require("binary-search-bounds")
var orient = require("robust-orientation")

function compareX(point, x) {
  return point[0] - x
}

function orthoTriangulate(bitmap) {
  var nx = bitmap.shape[0]
  var ny = bitmap.shape[1]
  var row, col, active, create, start, v

  //Allocate horizon
  var cells = []
  var vertices = []
  var horizon = []
  var prevRow = new Array(nx)
  for(var i=0; i<nx; ++i) {
    prevRow[i] = false
  }

  //Finds and remove the first curve in horizon matching predicate
  function takeCurve(pred) {
    for(var i=0, n=horizon.length; i<n; ++i) {
      var c = horizon[i]
      if(pred(c)) {
        horizon[i] = horizon[n-1]
        horizon.pop()
        return c
      }
    }
    return null
  }

  //Remove all left reflex vertices starting from p
  function reflexLeft(left, p, i0, i1) {
    for(var i=i1; i>i0; --i) {
      var a = left[i-1]
      var b = left[i]
      if(orient(a, b, p) <= 0) {
        cells.push([a[2], b[2], p[2]])
      } else {
        return i
      }
    }
    return i0
  }

  //Remove all right reflex vertices starting from p
  function reflexRight(right, p, i0, i1) {
    for(var i=i0; i<i1; ++i) {
      var a = right[i]
      var b = right[i+1]
      if(orient(p, a, b) <= 0) {
        cells.push([p[2], a[2], b[2]])
      } else {
        return i
      }
    }
    return i1
  }

  //Insert new segment into horizon
  function mergeSegment(row, x0, x1) {
    //Take left and right curves out of horizon
    var left = takeCurve(function(c) {
      return c[c.length-1][0] === x0
    })
    var right = takeCurve(function(c) {
      return c[0][0] === x1
    })

    //Create new vertices
    var p0 = [x0,row,vertices.length]
    var p1 = [x1,row,vertices.length+1]
    vertices.push([x0, row], [x1,row])

    //Merge chains
    var ncurve = []
    if(left) {
      var l1 = reflexLeft(left, p0, 0, left.length-1)
      for(var i=0; i<=l1; ++i) {
        ncurve.push(left[i])
      }
    }
    ncurve.push(p0, p1)
    if(right) {
      var r0 = reflexRight(right, p1, 0, right.length-1)
      for(var i=r0; i<right.length; ++i) {
        ncurve.push(right[i])
      }
    }

    //Append new chain to horizon
    horizon.push(ncurve)
  }

  function splitSegment(row, x0, x1) {

    //Locate segment above [x0, x1]
    var above = takeCurve(function(c) {
      return c[0][0] <= x0 && x1 <= c[c.length-1][0]
    })

    //Create new vertices
    var p0 = [x0,row,vertices.length]
    var p1 = [x1,row,vertices.length+1]
    vertices.push([x0, row], [x1,row])

    //Find coordinates of x0, x1 in chain
    var i0 = bounds.le(above, x0, compareX)
    var i1 = bounds.ge(above, x1, compareX)
    
    //Mesh interior region
    var j0 = i0
    var j1 = i1
    if(above[j0][0] < x0) {
      cells.push([above[j0][2], above[j0+1][2], p0[2]])
      j0 += 1
    }
    if(above[j1][0] > x1) {
      if(j0 < j1) {
        cells.push([above[j1-1][2], above[j1][2], p1[2]])
        j1 -= 1
      }
    }
    j0 = reflexRight(above, p0, j0, j1)
    j1 = reflexLeft(above, p1, j0, j1)
    cells.push([p0[2], above[j1][2], p1[2]])

    //Split left and right reflex chains
    if(i0 > 0 || above[i0][0] < x0) {
      var l = reflexLeft(above, p0, 0, i0)
      var left = above.slice(0, l+1)
      left.push(p0)
      horizon.push(left)
    }
    if(i1 < above.length-1 || above[i1][0] > x1) {
      var r = reflexRight(above, p1, i1, above.length-1)
      var right = above.slice(r)
      right.unshift(p1)
      horizon.push(right)
    }
  }

  //Sweep down
  for(row=0; row<ny; ++row) {
    active = false
    start = 0
    create = false
    for(col=0; col<nx; ++col) {
      v = !!(bitmap.get(col, row))
      if(active) {
        if(v !== create || v === prevRow[col]) {
          if(create) {
            mergeSegment(row, start, col)
          } else {
            splitSegment(row, start, col)
          }
          active = false
        }
      }
      if(!active && v !== prevRow[col]) {
        start = col
        active = true
        create = v
      }
      prevRow[col] = v
    }
    if(active) {
      if(create) {
        mergeSegment(row, start, nx)
      } else {
        splitSegment(row, start, nx)
      }
    }
  }

  //Final pass: close off base
  active = false
  start = 0
  for(col=0; col<nx; ++col) {
    if(active) {
      if(!prevRow[col]) {
        splitSegment(ny, start, col, false)
        active = false
      }
    } else if(prevRow[col]) {
      start = col
      active = true
    }
  }
  if(active) {
    splitSegment(ny, start, nx, false)
  }

  //Return result
  return {
    positions: vertices,
    cells: cells
  }
}