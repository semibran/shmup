var Display = (function() {
  var canvases = [];
  var sprites = {};
  var size = 32;
  var element;
  function onresize() {
    var i = canvases.length, canvas;
    while (i--) {
      canvas = canvases[i];
      update(canvas);
    }
  }
  function update(canvas, force) {
    var rect = canvas.parent.getBoundingClientRect();
    if (force || canvas.element.width !== rect.width || canvas.element.height !== rect.height) {
      canvas.element.width = rect.width;
      canvas.element.height = rect.height;
      canvas.rect = rect;
      draw(canvas);
    }
  }
  function draw(canvas) {
    var unit = canvas.rect.width / size;
    var ctx  = canvas.context;
    var i    = canvas.children.length;
    var child;

    while (i--) {
      child = canvas.children[i];
      ctx.fillStyle = child.color || 'black';
      if (child.type === 'rect') {
        var x = child.pos [0] * unit;
        var y = child.pos [1] * unit;
        var w = child.size[0] * unit;
        var h = child.size[1] * unit;
        ctx.fillRect(x, y, w, h);
      } else if (child.type === 'text') {
        var x = child.pos[0] * unit;
        var y = child.pos[1] * unit;
        ctx.font = unit * 2 + 'px Roboto, sans-serif';
        if (child.align === 'center') {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        } else { // if (child.align === 'left') {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
        }
        ctx.fillText(child.content, x, y);
      } else if (child.type === 'sprite') {
        var x = child.pos [0] * unit;
        var y = child.pos [1] * unit;
        var w = child.size[0] * unit;
        var h = child.size[1] * unit;
        var sprite = child;
        var image = sprites[child.id];
        ctx.drawImage(image, x - w / 2, y - w / 2, w, h);
      }
    }
  }
  function getMethods() {
    var canvas = this;
    return {
      update: function() {
        update(canvas, true);
      },
      rect: function(size, color) {
        if (typeof size === 'number') {
          size = [size, size];
        }
        return function drawRect(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos];
          }
          var data = {
            type:  'rect',
            size:  size,
            color: color || 'black',
            pos:   pos   || [0, 0]
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      },
      text: function(content, align, color) {
        return function drawText(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos];
          }
          var data = {
            type:    'text',
            content: content,
            align:   align || 'left',
            color:   color || 'black',
            pos:     pos   || [0, 0]
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      },
      sprite: function(id, size, color) {
        if (typeof size === 'number') {
          size = [size, size];
        }
        return function drawSprite(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos];
          }
          var data = {
            type:    'sprite',
            id:      id,
            size:    size,
            color:   color || 'black',
            pos:     pos   || [0, 0]
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      }
    }
  }
  return {
    size: size,
    init: function(parent) {
      init = true;
      element = parent || document.body;
      window.addEventListener('resize', onresize);
    },
    load: function(list, callback) {
      if (typeof list === 'string') {
        list = [list];
      }
      var index = 0;
      function next() {
        var sprite = list[index];
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "sprites/" + sprite + ".svg", true);
        ajax.send();
        ajax.onload = function(e) {
          var image = new Image();
          image.src = 'data:image/svg+xml;base64,' + window.btoa(ajax.responseText);
          image.onload = function() {
            sprites[sprite] = image;
            if (index < list.length) {
              next();
            } else {
              callback && callback.call(window);
            }
          };
        };
        index++;
      }
      next();
    },
    create: function(id) {
      if (!init) {
        throw 'DisplayError: Must initialize display with `Display.init` before calling other methods'
      }
      var object, canvas = document.createElement('canvas');
      id && (canvas.id = id);
      object = {
        id:       id || null,
        element:  canvas,
        context:  canvas.getContext('2d'),
        parent:   element,
        rect:     null,
        children: []
      };
      object.methods = getMethods.call(object);
      element.appendChild(canvas);
      canvases.push(object);
      update(object);
      return object.methods
    }
  }
}());

var Vector = {
  LEFT:       [-1, 0],
  RIGHT:      [ 1, 0],
  UP:         [ 0,-1],
  DOWN:       [ 0, 1],
  UP_LEFT:    [-1,-1],
  UP_RIGHT:   [ 1,-1],
  DOWN_LEFT:  [-1, 1],
  DOWN_RIGHT: [ 1, 1],
  add: function(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    return a
  },
  added: function(a, b) {
    return [a[0] + b[0], a[1] + b[1]]
  },
  subtract: function(a, b) {
    a[0] -= b[0];
    a[1] -= b[1];
    return a
  },
  subtracted: function(a, b) {
    return [a[0] - b[0], a[1] - b[1]]
  },
  multiply: function(a, b) {
    a[0] *= b[0];
    a[1] *= b[1];
    return a
  },
  multiplied: function(a, b) {
    return [a[0] * b[0], a[1] * b[1]]
  },
  divide: function(a, b) {
    a[0] /= b[0];
    a[1] /= b[1];
    return a
  },
  divided: function(a, b) {
    return [a[0] / b[0], a[1] / b[1]]
  },
  round: function(vector) {
    vector[0] = Math.round(vector[0]);
    vector[1] = Math.round(vector[1]);
  },
  rounded: function(vector) {
    return [Math.round(vector[0]), Math.round(vector[1])]
  },
  invert: function(vector) {
    vector[0] *= -1;
    vector[1] *= -1;
    return vector
  },
  inverted: function(vector) {
    return [-vector[0], -vector[1]]
  },
  scale: function(vector, scalar) {
    vector[0] *= scalar;
    vector[1] *= scalar;
    return vector
  },
  scaled: function(vector, scalar) {
    return [vector[0] * scalar, vector[1] * scalar]
  },
  magnitude: function(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
  },
  normalize: function(vector) {
    var magnitude = this.magnitude(vector);
    vector[0] /= magnitude;
    vector[1] /= magnitude;
    return vector
  },
  normalized: function(vector) {
    var magnitude = this.magnitude(vector);
    return this.scaled(vector, 1 / magnitude)
  },
  clone: function(vector) {
    return [vector[0], vector[1]]
  },
  fromDegrees: function(degrees) {
    var radians = (degrees - 90) * Math.PI / 180;
    return [Math.cos(radians), Math.sin(radians)]
  },
  toDegrees: function(vector) {
    return Math.atan2(vector[1], vector[0]) * 180 / Math.PI + 90
  },
  getNormal: function(direction) {
    var n, t = typeof direction;
    if (t === 'number') {
      n = this.fromDegrees(direction);
    } else if (t === 'object') {
      n = this.normalized(direction);
    }
    return n
  }
};

var app = document.querySelector('#app');
var ship;

function main() {
  background = Display.create('background');
  foreground = Display.create('foreground');

  background.rect(Display.size / 2, '#223')([0, 0]);
  background.rect(Display.size / 2, 'indigo')(Display.size / 2);

  foreground.text('Hello World!', 'center', 'white')(Display.size * (3 / 4));

  ship = foreground.sprite('ship', 3, 'crimson')(Display.size * (1 / 4));

  loop();
}

Display.init(app);
Display.load('ship', main);

var keyPressed = {};
function handleKeys(e) {
  var keydown = e.type === 'keydown';
  keyPressed[e.code] = keydown;
}

window.addEventListener('keydown', handleKeys);
window.addEventListener('keyup',   handleKeys);

function loop() {
  var dx = 0, dy = 0;
  if (keyPressed.ArrowLeft) {
    dx--;
  }
  if (keyPressed.ArrowRight) {
    dx++;
  }
  if (dx != 0 || dy != 0) {
    Vector.add(ship.pos, Vector.scaled([dx, dy], .2));
    foreground.update();
  }
  requestAnimationFrame(loop);
}

// app.addEventListener('mousemove', function(e) {
//   var x = (e.pageX - appRect.left) / appUnit
//   var y = (e.pageY - appRect.top)  / appUnit
//   var xCenter = x * appUnit
//   var yCenter = y * appUnit
//   var xStart  = xCenter - appUnit
//   var yStart  = yCenter - appUnit
//
//   ctx.fillStyle = '#223'
//   ctx.fillRect(xStart, yStart, appUnit * 2, appUnit * 2)
// })
