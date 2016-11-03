export default (function() {
  var canvases = []
  var sprites = {}
  var scale = 32
  var size = [scale, scale * 3 / 4]
  var element
  function onresize() {
    var i = canvases.length, canvas
    while (i--) {
      canvas = canvases[i]
      update(canvas)
    }
  }
  function update(canvas) {
    var rect = canvas.parent.getBoundingClientRect()
    if (canvas.element.width !== rect.width || canvas.element.height !== rect.height) {
      canvas.element.width = rect.width
      canvas.element.height = rect.height
      canvas.rect = rect
    }
    drawCanvas(canvas)
  }
  function drawChild(child) {
    var parent  = child.parent
    var ctx     = parent.context
    var child, color, gradient
    var x, y, w, h, box = child.drawBox

    x = box.pos [0]
    y = box.pos [1]
    w = box.size[0]
    h = box.size[1]

    color = child.color
    if (typeof color === 'object' && color !== null) {
      if (typeof w !== 'undefined' && typeof h !== 'undefined') {
        gradient = ctx.createLinearGradient(0, 0, 0, h)
        color.some(function(color, index) {
          gradient.addColorStop(index, color)
        })
        color = gradient
      }
    }

    ctx.fillStyle = color

    var cx = x// + w / 2
    var cy = y// + h / 2

    if (child.type === 'rect') {
      ctx.fillRect(x, y, w, h)
    } else if (child.type === 'circle') {
      ctx.arc(cx, cy, w, 0, 2 * Math.PI)
      ctx.fill()
    } else if (child.type === 'text') {
      ctx.font = unit * 2 + 'px Roboto, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(child.content, cx, cy, w, h)
    } else if (child.type === 'sprite') {
      var sprite = child
      var image = sprites[child.id][color || 'colored']
      ctx.drawImage(image, cx, cy, w, h)
    }
    child.drawnBox = {
      pos:  [x, y],
      size: [w, h],
      color: child.color
    }
  }
  function eraseChild(child) {
    var box = child.drawnBox
    if (box) {
      x = box.pos [0]
      y = box.pos [1]
      w = box.size[0]
      h = box.size[1]
      child.parent.context.clearRect(x, y, w, h)
    }
  }
  function drawCanvas(canvas) {
    var unit    = canvas.rect.width / scale
    var i, imax = canvas.children.length
    var dirty = []
    var x, y, w, h, box

    i = 0
    while (i < imax) {
      child = canvas.children[i]

      box = x = y = w = h = null

      x = child.pos [0] * unit
      y = child.pos [1] * unit
      if (child.size) {
        w = child.size[0] * unit
        h = child.size[1] * unit
      } else if (child.type === 'text') {
        w = ctx.measureText(child.content).width
        h = unit * 2
      }

      if (child.type === 'text' || child.type === 'sprite') {
        x -= w / 2
        y -= h / 2
      }

      box = child.drawBox = {
        pos:   [x, y],
        size:  [w, h],
        color: child.color
      }

      // if (!child.drawnBox) {
      //   child.drawnBox = {
      //     pos:  [x, y],
      //     size: [w, h]
      //   }
      // }

      if (!child.drawnBox ||
          Math.round(box.pos[0]) !== Math.round(child.drawnBox.pos[0]) || Math.round(box.pos[1]) !== Math.round(child.drawnBox.pos[1]) ||
          box.color !== child.drawnBox.color
        ) {
        eraseChild(child)
        dirty.push(child)
      }
      i++
    }

    imax = dirty.length
    i = 0
    while (i < imax) {
      child = dirty[i]
      drawChild(child)
      i++
    }
  }
  function getMethods() {
    var canvas = this
    return {
      parent: canvas,
      update: function() {
        update(canvas, true)
      },
      rect: function(size, color) {
        if (typeof size === 'number') {
          size = [size, size]
        }
        return function drawRect(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          var data = {
            type:   'rect',
            size:   size,
            color:  color,
            pos:    pos   || [0, 0],
            parent: canvas
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      },
      circle: function(size, color) {
        if (typeof size === 'number') {
          size = [size, size]
        }
        return function drawCircle(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          var data = {
            type:   'circle',
            size:   size,
            color:  color,
            pos:    pos   || [0, 0],
            parent: canvas
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      },
      text: function(content, align, color) {
        return function drawText(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          var data = {
            type:    'text',
            content: content,
            align:   align || 'left',
            color:   color,
            pos:     pos   || [0, 0],
            parent:  canvas
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      },
      sprite: function(id, size, color) {
        if (typeof id === 'undefined' || !sprites[id]) {
          throw 'DisplayError: Sprite of id `' + id + '` was not loaded.'
        }
        if (typeof size === 'number') {
          size = [size, size]
        }
        return function drawSprite(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          var data = {
            type:   'sprite',
            id:     id,
            size:   size,
            color:  color,
            pos:    pos ? [pos[0], pos[1]] : [0, 0],
            parent: canvas
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      },
      delete: function(child) {
        var index = canvas.children.indexOf(child)
        if (index !== -1)
          canvas.children.splice(index, 1)
        else
          console.log('Child was not found.')
        eraseChild(child)
        return index
      }
    }
  }
  return {
    size: size,
    scale: scale,
    init: function(parent) {
      init = true
      element = parent || document.body
      window.addEventListener('resize', onresize)
    },
    load: function(list, callback) {
      if (typeof list === 'string') {
        list = [list]
      }
      var index = 0
      function next() {
        var sprite = list[index]
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "sprites/" + sprite + ".svg", true);
        ajax.send();
        ajax.onload = function(e) {
          var response = ajax.responseText
          var colors = ['white', 'black']
          var colorIndex = 0
          var image = new Image()
          image.src = 'data:image/svg+xml;base64,' + window.btoa(response)
          image.onload = function() {
            sprites[sprite].colored = image
          }
          sprites[sprite] = {}
          function colorNext() {
            var color = colors[colorIndex]
            var replaced = response.replace(/fill="[#\w\d\s]+"/g, 'fill="' + color + '"')
            var image = new Image()
            image.src = 'data:image/svg+xml;base64,' + window.btoa(replaced)
            image.onload = function() {
              sprites[sprite][color] = image
              colorIndex++
              if (colorIndex < colors.length) {
                colorNext()
              } else {
                index++
                if (index < list.length) {
                  next()
                } else {
                  callback && callback.call(window)
                }
              }
            }
          }
          colorNext()
        }
      }
      next()
    },
    create: function(id) {
      if (!init) {
        throw 'DisplayError: Must initialize display with `Display.init` before calling other methods'
      }
      var object, canvas = document.createElement('canvas')
      id && (canvas.id = id)
      object = {
        id:       id || null,
        element:  canvas,
        context:  canvas.getContext('2d'),
        parent:   element,
        rect:     null,
        children: []
      }
      object.methods = getMethods.call(object)
      element.appendChild(canvas)
      canvases.push(object)
      update(object)
      return object.methods
    }
  }
}())
