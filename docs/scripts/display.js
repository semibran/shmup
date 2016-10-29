export default (function() {
  var canvases = []
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

    // ctx.clearRect(0, 0, canvas.rect.width, canvas.rect.height)

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
        ctx.font = unit * 2 + 'px sans-serif'
        if (child.align === 'center') {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
        } else { // if (child.align === 'left') {
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
        }
        ctx.fillText(child.content, x, y)
      }
    }
  }
  function getMethods() {
    var canvas = this
    return {
      rect: function(size, color) {
        if (typeof size === 'number') {
          size = [size, size]
        }
        return function drawRect(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          canvas.children.push({
            type:  'rect',
            size:  size,
            color: color || 'black',
            pos:   pos   || [0, 0]
          })
          update(canvas, true)
        }
      },
      text: function(content, align, color) {
        return function drawText(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos]
          }
          canvas.children.push({
            type:    'text',
            content: content,
            align:   align || 'left',
            color:   color || 'black',
            pos:     pos   || [0, 0]
          })
          update(canvas, true)
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
