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
  function update(canvas, force) {
    var rect = canvas.parent.getBoundingClientRect()
    if (force || canvas.element.width !== rect.width || canvas.element.height !== rect.height) {
      canvas.element.width = rect.width
      canvas.element.height = rect.height
      canvas.rect = rect
      draw(canvas)
    }
  }
  function draw(canvas) {
    var unit = canvas.rect.width / size
    var ctx  = canvas.context
    var i    = canvas.children.length
    var child

    while (i--) {
      child = canvas.children[i]
      ctx.fillStyle = child.color || 'black'
      if (child.type === 'rect') {
        var x = child.pos [0] * unit
        var y = child.pos [1] * unit
        var w = child.size[0] * unit
        var h = child.size[1] * unit
        ctx.fillRect(x, y, w, h)
      } else if (child.type === 'text') {
        var x = child.pos[0] * unit
        var y = child.pos[1] * unit
        ctx.font = unit * 2 + 'px Roboto, sans-serif'
        if (child.align === 'center') {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
        } else { // if (child.align === 'left') {
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
        }
        ctx.fillText(child.content, x, y)
      } else if (child.type === 'sprite') {
        var x = child.pos [0] * unit
        var y = child.pos [1] * unit
        var w = child.size[0] * unit
        var h = child.size[1] * unit
        var sprite = child
        var image = sprites[child.id]
        ctx.drawImage(image, x - w / 2, y - w / 2, w, h)
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
