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
  function update(canvas) {
    var rect = canvas.parent.getBoundingClientRect();
    if (canvas.element.width !== rect.width || canvas.element.height !== rect.height) {
      canvas.element.width = rect.width;
      canvas.element.height = rect.height;
      canvas.rect = rect;
    }
    draw(canvas);
  }
  function draw(canvas) {
    var unit = canvas.rect.width / size;
    var ctx  = canvas.context;
    var i    = canvas.children.length;
    var child;
    var x, y, w, h;

    while (i--) {
      child = canvas.children[i];
      ctx.fillStyle = child.color || 'black';
      if (child.drawn) {
        x = child.drawn.pos [0];
        y = child.drawn.pos [1];
        w = child.drawn.size[0];
        h = child.drawn.size[1];
        ctx.clearRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2);
      }
      x = y = w = h = null;
      x = child.pos [0] * unit;
      y = child.pos [1] * unit;
      if (child.size) {
        w = child.size[0] * unit;
        h = child.size[1] * unit;
      }
      if (child.type === 'rect') {
        ctx.fillRect(x, y, w, h);
      } else if (child.type === 'text') {
        ctx.font = unit * 2 + 'px Roboto, sans-serif';
        w = ctx.measureText(child.content).width;
        h = unit * 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(child.content, x - w / 2, y - h / 2, w, h);
      } else if (child.type === 'sprite') {
        var sprite = child;
        var image = sprites[child.id];
        ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
      }
      child.drawn = {
        pos: [x, y],
        size: [w, h]
      };
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

var Input = (function() {
  var pressed  = {};
  var tapped   = {};
  var time     = {};
  var released = {};

  var element = document.body;
  var mousePos = null;

  var init = false;
  var looping = false;

  function handleInput(e) {
    var type, down, code;
    if (e.type === 'keydown' || e.type === 'keyup') {
      type = 'key';
      code = e.code;
      down = e.type === 'keydown';
    } else if (e.type === 'mousedown' || e.type === 'mouseup') {
      type = 'key';
      code = e.button === 0 ? 'MouseLeft' : e.button === 2 ? 'MouseRight' : null;
      down = e.type === 'mousedown';
    } else if (e.type === 'touchstart' || e.type === 'touchend') {
      type = 'key';
      code = 'MouseLeft';
      down = e.type === 'touchstart';
    }
    if (down) {
      if (!pressed[code]) {
        time[code] = 0;
        tapped[code] = true;
      }
    } else {
      if (pressed[code]) {
        time[code] = 0;
        released[code] = true;
      }
    }
    pressed[code] = down;
  }

  return {
    mousePos: mousePos,
    pressed: pressed,
    tapped: tapped,
    time: time,
    released: released,
    init: function(parent) {
      var that = this;
      element = parent || element;
      init = true;
      element.addEventListener(event, handleInput);
      window.addEventListener('keydown', handleInput);
      window.addEventListener('keyup', handleInput);
      element.addEventListener('mousemove', function(e) {
        var rect = element.getBoundingClientRect();
        that.mousePos = that.mousePos || [0, 0];
        that.mousePos[0] = (e.pageX - rect.left) / rect.width;
        that.mousePos[1] = (e.pageY - rect.top)  / rect.height;
      });
      ['mousedown', 'mouseup', 'touchstart', 'touchend'].some(function(event) {
        element.addEventListener(event, handleInput);
      });
    },
    loop: function(callback) {
      if ( looping) throw 'InputError: `loop` function is already in progress.'
      if (!init) this.init();
      looping = true;
      function loop() {
        callback.call(window);
        requestAnimationFrame(function() {
          loop(callback);
        });
        for (code in pressed)  if (pressed[code]) time[code]++;
        for (code in tapped)   tapped[code]   = false;
        for (code in released) released[code] = false;
      }
      loop();
    }
  }
}());

var app = document.querySelector('#app');
var paused = false;
var ship;

function main() {
  background = Display.create('background');
  foreground = Display.create('foreground');

  background.rect(Display.size / 2, '#223')([0, 0]);
  background.rect(Display.size / 2, 'indigo')(Display.size / 2);

  foreground.text('Hello World!', 'center', 'white')(Display.size * (3 / 4));

  ship = foreground.sprite('ship', 3, 'crimson')(Display.size * (1 / 4));
  shot = foreground.sprite('shot', 3)([Display.size * (3 / 4), Display.size * (1 / 4)]);

  Input.init(app);
  Input.loop(function() {
    var dx = 0, dy = 0, speed = .5;
    var mouse, dist, normal, vel;
    if (!paused) {
      if (Input.pressed.ArrowLeft)  dx--;
      if (Input.pressed.ArrowRight) dx++;
      if (Input.pressed.ArrowUp)    dy--;
      if (Input.pressed.ArrowDown)  dy++;
      if (!dx && !dy) {
        if (Input.mousePos) {
          mouse  = Vector.scaled(Input.mousePos, Display.size);
          dist   = Vector.subtracted(mouse, ship.pos);
          dx     = dist[0];
          dy     = dist[1];
        }
      } else {
        Input.mousePos = null;
      }
      if (dx || dy) {
        normal = Vector.normalized([dx, dy]);
        vel    = Vector.scaled(normal, speed);
        if (dist && Vector.magnitude(dist) < Vector.magnitude(vel)) {
          vel = dist;
        }
        Vector.add(ship.pos, vel);
        foreground.update();
      }
    }
    if (Input.tapped.KeyP) {
      paused = !paused;
    }
  });
}

Display.init(app);
Display.load(['ship', 'shot'], main);

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
