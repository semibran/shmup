var Display = (function() {
  var canvases = [];
  var sprites = {};
  var scale = 32;
  var size = [scale, scale * 3 / 4];
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
    drawCanvas(canvas);
  }
  function drawChild(child) {
    var parent  = child.parent;
    var ctx     = parent.context;
    var child, color, gradient;
    var x, y, w, h, box = child.drawBox;

    x = box.pos [0];
    y = box.pos [1];
    w = box.size[0];
    h = box.size[1];

    color = child.color;
    if (typeof color === 'object' && color !== null) {
      if (typeof w !== 'undefined' && typeof h !== 'undefined') {
        gradient = ctx.createLinearGradient(0, 0, 0, h);
        color.some(function(color, index) {
          gradient.addColorStop(index, color);
        });
        color = gradient;
      }
    }

    ctx.fillStyle = color;

    var cx = x;// + w / 2
    var cy = y;// + h / 2

    if (child.type === 'rect') {
      ctx.fillRect(x, y, w, h);
    } else if (child.type === 'circle') {
      ctx.arc(cx, cy, w, 0, 2 * Math.PI);
      ctx.fill();
    } else if (child.type === 'text') {
      ctx.font = unit * 2 + 'px Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(child.content, cx, cy, w, h);
    } else if (child.type === 'sprite') {
      var sprite = child;
      var image = sprites[child.id][color || 'colored'];
      ctx.drawImage(image, cx, cy, w, h);
    }
    child.drawnBox = {
      pos:  [x, y],
      size: [w, h],
      color: child.color
    };
  }
  function eraseChild(child) {
    var box = child.drawnBox;
    if (box) {
      x = box.pos [0];
      y = box.pos [1];
      w = box.size[0];
      h = box.size[1];
      child.parent.context.clearRect(x, y, w, h);
    }
  }
  function drawCanvas(canvas) {
    var unit    = canvas.rect.width / scale;
    var i, imax = canvas.children.length;
    var dirty = [];
    var x, y, w, h, box;

    i = 0;
    while (i < imax) {
      child = canvas.children[i];

      box = x = y = w = h = null;

      x = child.pos [0] * unit;
      y = child.pos [1] * unit;
      if (child.size) {
        w = child.size[0] * unit;
        h = child.size[1] * unit;
      } else if (child.type === 'text') {
        w = ctx.measureText(child.content).width;
        h = unit * 2;
      }

      if (child.type === 'text' || child.type === 'sprite') {
        x -= w / 2;
        y -= h / 2;
      }

      box = child.drawBox = {
        pos:   [x, y],
        size:  [w, h],
        color: child.color
      };

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
        eraseChild(child);
        dirty.push(child);
      }
      i++;
    }

    imax = dirty.length;
    i = 0;
    while (i < imax) {
      child = dirty[i];
      drawChild(child);
      i++;
    }
  }
  function getMethods() {
    var canvas = this;
    return {
      parent: canvas,
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
            type:   'rect',
            size:   size,
            color:  color,
            pos:    pos   || [0, 0],
            parent: canvas
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      },
      circle: function(size, color) {
        if (typeof size === 'number') {
          size = [size, size];
        }
        return function drawCircle(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos];
          }
          var data = {
            type:   'circle',
            size:   size,
            color:  color,
            pos:    pos   || [0, 0],
            parent: canvas
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
            color:   color,
            pos:     pos   || [0, 0],
            parent:  canvas
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      },
      sprite: function(id, size, color) {
        if (typeof id === 'undefined' || !sprites[id]) {
          throw 'DisplayError: Sprite of id `' + id + '` was not loaded.'
        }
        if (typeof size === 'number') {
          size = [size, size];
        }
        return function drawSprite(pos) {
          if (typeof pos === 'number') {
            pos = [pos, pos];
          }
          var data = {
            type:   'sprite',
            id:     id,
            size:   size,
            color:  color,
            pos:    pos ? [pos[0], pos[1]] : [0, 0],
            parent: canvas
          };
          canvas.children.push(data);
          update(canvas, true);
          return data
        }
      },
      delete: function(child) {
        var index = canvas.children.indexOf(child);
        if (index !== -1)
          canvas.children.splice(index, 1);
        else
          console.log('Child was not found.');
        eraseChild(child);
        return index
      }
    }
  }
  return {
    size: size,
    scale: scale,
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
          var response = ajax.responseText;
          var colors = ['white', 'black'];
          var colorIndex = 0;
          var image = new Image();
          image.src = 'data:image/svg+xml;base64,' + window.btoa(response);
          image.onload = function() {
            sprites[sprite].colored = image;
          };
          sprites[sprite] = {};
          function colorNext() {
            var color = colors[colorIndex];
            var replaced = response.replace(/fill="[#\w\d\s]+"/g, 'fill="' + color + '"');
            var image = new Image();
            image.src = 'data:image/svg+xml;base64,' + window.btoa(replaced);
            image.onload = function() {
              sprites[sprite][color] = image;
              colorIndex++;
              if (colorIndex < colors.length) {
                colorNext();
              } else {
                index++;
                if (index < list.length) {
                  next();
                } else {
                  callback && callback.call(window);
                }
              }
            };
          }
          colorNext();
        };
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
    if (!magnitude) return [0, 0]
    vector[0] /= magnitude;
    vector[1] /= magnitude;
    return vector
  },
  normalized: function(vector) {
    var magnitude = this.magnitude(vector);
    if (!magnitude) return [0, 0]
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

var Rect = {
  getCenter: function(rect) {
    var x, y, w, h;
    if (rect.length === 2) {
      x = 0;
      y = 0;
      w = rect[0];
      h = rect[1];
      if (w.length === 2) {
        x = w[0];
        y = w[1];
      }
      if (h.length === 2) {
        w = h[0];
        h = h[1];
      }
    } else {
      throw 'RectError: Rectangle for `getCenter` has invalid number of arguments'
    }
    return [x + w / 2, y + h / 2]
  },
  isColliding: function(a, b) {
    var ax, ay, aw, ah, al, at, ar, ab, bx, by, bw, bh, bl, bt, br, bb;
    ax = a[0][0];
    ay = a[0][1];
    aw = a[1][0];
    ah = a[1][1];

    bx = b[0][0];
    by = b[0][1];
    bw = b[1][0];
    bh = b[1][1];

    // console.log(ax, ay, aw, ah)

    al = ax - aw / 2;
    at = ay - ah / 2;
    ar = ax + aw / 2;
    ab = ay + ah / 2;

    bl = bx - bw / 2;
    bt = by - bh / 2;
    br = bx + bw / 2;
    bb = by + bh / 2;

    return al < br && at < bb && ar > bl && ab > bt
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
        time[code] = null;
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

      function mouseDown(e) {
        var rect = element.getBoundingClientRect();
        that.mousePos = that.mousePos || [0, 0];
        that.mousePos[0] = (e.pageX - rect.left) / rect.width;
        that.mousePos[1] = (e.pageY - rect.top)  / rect.height;
        e.preventDefault();
      }

      function mouseUp() {
        that.mousePos = null;
      }

      element.addEventListener(event,        handleInput);
      window.addEventListener('keydown',     handleInput);
      window.addEventListener('keyup',       handleInput);
      window.addEventListener('mousemove',  mouseDown);
      element.addEventListener('mousedown',  mouseDown);
      window.addEventListener('mouseup',    mouseUp);

      window.addEventListener('touchmove',  mouseDown);
      element.addEventListener('touchstart', mouseDown);
      window.addEventListener('touchend',   mouseUp);

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
        // setTimeout(function() {
        //   loop(callback)
        // }, 1000)
        for (code in pressed)  if (pressed[code]) time[code]++;
        for (code in tapped)   tapped[code]   = false;
        for (code in released) released[code] = false;
      }
      loop();
    }
  }
}());

var Random = (function(){
  function get(min, max) {
    var a = arguments.length;
    if (a === 0) {
      return Math.random()
    } else if (a === 1) {
      max = min;
      min = 0;
    }
    if (min > max) {
      var $ = min;
      min = max;
      max = $;
    }
    return Math.floor(get() * (max - min)) + min
  }

  function choose(array) {
    var a = arguments.length;
    if (a === 0 || !array.length)
      array = [0, 1];
    return array[get(array.length)]
  }

  return {
    get: get,
    choose: choose
  }
}());

var app = document.querySelector('#app');
var paused = false;

function extend(constructor, props) {
  return Object.assign(Object.create(constructor.prototype), props || {})
}

function remove(array, element) {
  var index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

var sprites     = [];

var players = [];
var enemies = [];

function Sprite() {

}

Sprite.prototype = {
  size: [1, 1],
  pos: null,
  dir: [0, 0],
  spd: 0,
  frc: 0,
  vel: null,
  offset: [0, 0],
  attached: null,
  getHitbox: function() {
    var min = Math.min(this.size[0], this.size[1]);
    this.hitboxSize = [min, min];
    return [this.pos, this.hitboxSize]
  },
  spawn: function(pos) {
    if (!pos) throw 'SpriteError: Position specified for spawn is undefined'
    if (typeof pos === 'number') {
      pos = [pos, pos];
    }
    this.pos = Vector.clone(pos);
    this.vel = [0, 0];
    this.obj = foreground.sprite(this.sprite, this.size)(this.pos);
    this.obj.pos = this.pos;
    this.attached = false;
    this.flashing = true;
    this.hitbox = this.getHitbox();
    sprites.push(this);
    return this
  },
  kill: function() {
    var index = sprites.indexOf(this);
    if (index !== -1) {
      sprites.splice(index, 1);
    }
    foreground.delete(this.obj);
  },
  flash: function() {
    this.flashing = Date.now();
    this.obj.color = 'white';
  },
  attach: function(target, offset) {
    this.attached = true;
    this.attachee = target;
    this.offset = offset || [0, 0];
    this.pos = this.obj.pos = target.pos;
  },
  update: function() {
    if (this.flashing && Date.now() - this.flashing > 1000 / 60) {
      this.obj.color = null;
      this.flashing = null;
    }
    if (this.spd) {
      var n = Vector.normalized(this.dir);
      var d = Vector.scaled(n, this.spd);
      Vector.add(this.vel, d);
    }
    Vector.add(this.pos, this.vel);
    Vector.scale(this.vel, this.frc);
    this.obj.pos = Vector.added(this.pos, this.offset);
    this.hitbox = this.getHitbox();
  }
};


function Effect() {

}

Effect.prototype = extend(Sprite, {
  duration: Infinity,
  spd: 0.01,
  dir: Vector.UP,
  spawn: function(pos) {
    this.life = this.duration * 60;
    return Sprite.prototype.spawn.call(this, pos)
  },
  update: function() {
    if (this.life !== Infinity) {
      if (this.life-- <= 0) {
        this.kill();
      }
    }
    Sprite.prototype.update.call(this);
  }
});

function Boost() {

}

Boost.prototype = extend(Effect, {
  sprite: 'boost',
  size: [2, .5],
  duration: Infinity
});

function Explosion() {

}

Explosion.prototype = extend(Effect, {
  sprite: 'explosion',
  size: [1, 1],
  duration: .25,
});

function Spark() {

}

Spark.prototype = extend(Effect, {
  sprite: 'spark',
  size: [0.5, 0.5],
  duration: 0.01
});


function Projectile(targets) {
  this.targets = targets || this.targets;
}

Projectile.prototype = extend(Sprite, {
  power: 1,
  piercing: false,
  targets: [],
  spawn: function(pos) {
    this.hitList = {};
    return Sprite.prototype.spawn.call(this, pos)
  },
  kill: function(silent) {
    if (!silent) {
      var dx = Random.get(-2, 2);
      var dy = Random.get(-2, 2);
      var d  = Vector.scaled([dx, dy], 0.1);
      new Explosion().spawn(Vector.added(this.pos, d));
    }
    Sprite.prototype.kill.call(this, silent);
  },
  update: function() {
    var pastL = this.dir[0] < 0 && this.pos[0] - this.size[0] / 2 < 0;
    var pastR = this.dir[0] > 0 && this.pos[0] + this.size[0] / 2 > Display.size;
    var pastU = this.dir[1] < 0 && this.pos[1] - this.size[1] / 2 < 0;
    var pastD = this.dir[1] > 0 && this.pos[1] + this.size[1] / 2 > Display.size;
    if (pastL || pastR || pastU || pastD) {
      return this.kill(true)
    }
    var hit = null;
    this.targets.some(function(target) {
      if (!this.hitList[target] && Rect.isColliding(this.hitbox, target.hitbox)) {
        target.hit(this.power);
        this.hitList[target] = true;
        if (!this.piercing) {
          hit = target;
          return hit
        }
      }
    }, this);
    if (hit) {
      var distance, normal, minimum, corrected;
      distance  = Vector.subtracted(this.pos, hit.pos);
      normal    = Vector.normalized(distance);
      minimum   = Vector.scaled(normal, hit.hitboxSize[0] / 2);
      corrected = Vector.added(hit.pos, minimum);
      this.pos[0] = corrected[0];
      this.pos[1] = corrected[1];
      return this.kill()
    }
    Sprite.prototype.update.call(this);
  }
});

function Spear(targets) {
  Projectile.call(this, targets);
}

Spear.prototype = extend(Projectile, {
  spd: .7,
  size: [1, .5],
  dir: Vector.RIGHT,
  sprite: 'spear'
});

function Spinny(targets, direction) {
  this.dir = direction || Vector.RIGHT;
  Projectile.call(this, targets, direction);
}

Spinny.prototype = extend(Projectile, {
  spd: 0.1,
  frc: 0.66,
  size: [.5, .5],
  sprite: 'spinny'
});


function Ship() {

}

Ship.prototype = extend(Sprite, {
  health:        1,
  defense:       1,
  shotType:      'spread',
  shotTimer:     0,
  shotSpacing:   0,
  shotCooldown:  0,
  shotsPerBurst: 0,
  shotsPerRound: 0,
  shotsFired:    0,
  shooting:      false,
  overheating:   false,
  shoot: function() {

  },
  hit: function(damage) {
    this.health -= damage / this.defense;
    this.flash();
  },
  update: function() {
    if (this.shooting) {
      if (!this.overheating) {
        this.shotTimer++;
        if (this.shotTimer >= this.shotSpacing * 60) {
          this.shotTimer = 0;
          this.shoot();
          this.shotsFired++;
          if (this.shotsFired >= this.shotsPerRound) {
            this.shotsFired = 0;
            this.overheating = true;
          }
        }
      }
    }
    if (this.overheating) {
      this.shotTimer++;
      if (this.shotTimer >= this.shotCooldown * 60) {
        this.shotTimer = 0;
        this.overheating = false;
      }
    }
    if (this.health <= 0) {
      this.kill();
    }
    Sprite.prototype.update.call(this);
  },
  pushTrigger: function() {
    this.shooting = true;
  },
  releaseTrigger: function() {
    this.shooting   = false;
    this.shotTimer  = this.shotSpacing * 60;
    this.shotsFired = 0;
    this.overheating = false;
  }
});

function Enemy() {

}

Enemy.prototype = extend(Ship, {
  health: 1,
  defense: Infinity,
  shotCooldown:  1,
  shotSpacing:   .1,
  shotsPerBurst: 5,
  shotsPerRound: 25,
  spd: 0.001,
  frc: 0.9999,
  dir: Vector.UP,
  size: [2, 2],
  sprite: 'enemy',
  spawn: function(pos) {
    enemies.push(this);
    return Ship.prototype.spawn.call(this, pos)
  },
  kill: function() {
    Ship.prototype.kill.call(this);
    remove(enemies, this);
  },
  shoot: function() {
    var distance = Vector.subtracted(player.pos, this.pos);
    var normal   = Vector.normalized(distance);
    var centerAngle = Vector.toDegrees(normal);
    var origin   = Vector.added(this.pos, Vector.scale(normal, this.size[0] / 2));
    var imax = this.shotsPerBurst - this.shotsFired % 2;
    var i = imax;
    var burstSpacing = 45 * 0.5;
    while (i--) {
      angle = centerAngle - imax / 2 * burstSpacing + (i + 0.5) * burstSpacing;
      normal = Vector.fromDegrees(angle);
      origin = Vector.added(this.pos, Vector.scale(normal, this.size[0] / 2 + Spinny.prototype.size[0] / 2));
      new Spinny(players, normal).spawn(origin);
    }
  },
  update: function() {
    if (-this.dir[1] * (this.pos[1] - Display.size[1] / 2) < 0) {
      this.dir[1] *= -1;
    }
    Ship.prototype.update.call(this);
  }
});

function Player(controls) {
  this.controls = controls;
}

Player.prototype = extend(Ship, {
  defense: Infinity,
  shotCooldown:  .15,
  shotSpacing:   .05,
  shotsPerRound: 3,
  spd: .2,
  frc: 1,
  size: [3, 1.5],
  sprite: 'ship',
  spawn: function(pos) {
    var ship = Ship.prototype.spawn.call(this, pos);
    boost = new Boost().spawn(Vector.subtracted(pos, [Boost.prototype.size[0], 0]));
    boost.attach(this, [-this.size[0] / 2 - Boost.prototype.size[0] / 2 + .4, 0]);
    players.push(this);
    return ship
  },
  kill: function() {
    Ship.prototype.kill.call(this);
    remove(players, this);
  },
  shoot: function() {
    var origin = Vector.added(this.pos, [.5, .3]);
    new Spark().spawn(Vector.subtracted(origin, [Spear.prototype.size[0] / 2, 0]));
    new Spear(enemies).spawn(origin);
    new Spear(enemies).spawn(Vector.added(origin, [0, -0.33]));
  },
  update: function() {
    var dx = 0, dy = 0, controls = this.controls;
    var mouse, dist, normal, vel;
    if (controls) {
      if (Input.pressed[controls.l || controls.left])  dx--;
      if (Input.pressed[controls.r || controls.right]) dx++;
      if (Input.pressed[controls.u || controls.up])    dy--;
      if (Input.pressed[controls.d || controls.down])  dy++;
      if (!dx && !dy) {
        if (Input.mousePos) {
          mouse  = Vector.scaled(Input.mousePos, Display.scale);
          dist   = Vector.subtracted(mouse, this.pos);
          dx     = dist[0];
          dy     = dist[1];
        }
      } else {
        Input.mousePos = null;
      }
      if (dx || dy) {
        // normal = Vector.normalized([dx, dy])
        this.vel = Vector.scaled([dx, dy], 1 / 24);
      }
      if (Input.pressed[controls.a]) {
        this.pushTrigger();
      } else {
        this.releaseTrigger();
      }
    }
    if (this.pos[0] < 0) {
      this.pos[0] = 0;
    }
    if (this.pos[0] > Display.size[0]) {
      this.pos[0] = Display.size[0];
    }
    if (this.pos[1] < 0) {
      this.pos[1] = 0;
    }
    if (this.pos[1] > Display.size[1]) {
      this.pos[1] = Display.size[1];
    }
    Ship.prototype.update.call(this);
  }
});

function main() {
  background = Display.create('background');
  foreground = Display.create('foreground');

  var half = Vector.multiplied(Display.size, [1, 1 / 2]);

  background.rect(Display.size, ['#9cf', 'white'])();
  background.rect(half, '#454E69')(Vector.multiplied(Display.size, [0, 1 / 2]));

  background.circle(1, 'white')([24, 4]);
  mountains = foreground.sprite('mountains', [16, 1], 'black')([24, 11.6]);

  player = new Player({
    l: 'ArrowLeft',
    r: 'ArrowRight',
    u: 'ArrowUp',
    d: 'ArrowDown',
    a: 'MouseLeft',
  }).spawn(Vector.multiplied(Display.size, [.25, .5]));

  var enemyPos = Vector.multiplied(Display.size, [.75, .25]);
  var enemy    = new Enemy().spawn(enemyPos);

  enemy.pushTrigger();

  var shots = [];

  Input.init(app);
  Input.loop(function() {
    var i;
    if (!paused) {
      i = sprites.length;
      while (i--) {
        sprites[i].update();
      }
      foreground.update();
      mountains.pos[0] -= 0.01;
      background.update();
    }
    if (Input.tapped.KeyP) {
      paused = !paused;
    }
  });
}

Display.init(app);
Display.load(['ship', 'spear' , 'boost', 'mountains', 'enemy', 'explosion', 'spinny', 'spark'], main);
