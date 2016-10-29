export default (function() {
  var canvases = []
  var sprites = {}
  var size = 32
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
    draw(canvas)
  }
  function draw(canvas) {
    var unit = canvas.rect.width / size
    var ctx  = canvas.context
    var i    = canvas.children.length
    var child
    var x, y, w, h

    while (i--) {
      child = canvas.children[i]
      ctx.fillStyle = child.color || 'black'
      if (child.drawn) {
        x = child.drawn.pos [0]
        y = child.drawn.pos [1]
        w = child.drawn.size[0]
        h = child.drawn.size[1]
        ctx.clearRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2)
      }
      x = y = w = h = null
      x = child.pos [0] * unit
      y = child.pos [1] * unit
      if (child.size) {
        w = child.size[0] * unit
        h = child.size[1] * unit
      }
      if (child.type === 'rect') {
        ctx.fillRect(x, y, w, h)
      } else if (child.type === 'text') {
        ctx.font = unit * 2 + 'px Roboto, sans-serif'
        w = ctx.measureText(child.content).width
        h = unit * 2
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(child.content, x - w / 2, y - h / 2, w, h)
      } else if (child.type === 'sprite') {
        var sprite = child
        var image = sprites[child.id]
        ctx.drawImage(image, x - w / 2, y - h / 2, w, h)
      }
      child.drawn = {
        pos: [x, y],
        size: [w, h]
      }
    }
  }
  function getMethods() {
    var canvas = this
    return {
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
            type:  'rect',
            size:  size,
            color: color || 'black',
            pos:   pos   || [0, 0]
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
            color:   color || 'black',
            pos:     pos   || [0, 0]
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      },
      sprite: function(id, size, color) {
        if (typeof size === 'number') {
          size = [size, size]
        }
        return function drawSprite(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          var data = {
            type:    'sprite',
            id:      id,
            size:    size,
            color:   color || 'black',
            pos:     pos   || [0, 0]
          }
          canvas.children.push(data)
          update(canvas, true)
          return data
        }
      }
    }
  }
  return {
    size: size,
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
          var image = new Image()
          image.src = 'data:image/svg+xml;base64,' + window.btoa(ajax.responseText);
          image.onload = function() {
            sprites[sprite] = image
            if (index < list.length) {
              next()
            } else {
              callback && callback.call(window)
            }
          }
        }
        index++
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
