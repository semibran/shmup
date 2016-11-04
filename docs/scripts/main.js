import Display from './display'
import Vector from './vector'
import Rect from './rect'
import Input from './input'
import Random from './random'

var app = document.querySelector('#app')
var paused = false

function extend(constructor, props) {
  return Object.assign(Object.create(constructor.prototype), props || {})
}

function remove(array, element) {
  var index = array.indexOf(element)
  if (index !== -1) {
    array.splice(index, 1)
  }
}

var ships       = []
var projectiles = []
var effects     = []
var sprites     = []

var players = []
var enemies = []

function Sprite() {

}

var shakeSequence = [
  Vector.UP,
  Vector.DOWN_RIGHT,
  Vector.LEFT,
  Vector.UP_RIGHT,
  Vector.DOWN,
  Vector.UP_LEFT,
  Vector.RIGHT,
  Vector.DOWN_LEFT
]

Sprite.prototype = {
  size: [1, 1],
  pos: null,
  dir: [0, 0],
  spd: 0,
  frc: 0,
  vel: null,
  offset: [0, 0],
  attached: null,
  frames: 1,
  frameDelay: 1,
  getHitbox: function() {
    return [this.pos, this.hitboxSize]
  },
  spawn: function(pos) {
    var min = Math.min(this.size[0], this.size[1])
    if (!pos) throw 'SpriteError: Position specified for spawn is undefined'
    if (typeof pos === 'number') {
      pos = [pos, pos]
    }
    this.pos = Vector.clone(pos)
    this.vel = [0, 0]
    this.obj = foreground.sprite(this.sprite, this.size, this.sizeSub || this.size)(this.pos)
    this.obj.pos = this.pos
    this.attached = false
    this.flashing = false

    this.shaking = false
    this.shakeIndex = 0
    this.shakeTimer = 0
    this.shakeTimerMax = 15
    this.shakeOffset = [0, 0]

    this.hitboxSize = [min, min]
    this.hitbox = this.getHitbox()

    this.frameTimer = 0
    sprites.push(this)
    return this
  },
  kill: function() {
    var index = sprites.indexOf(this)
    if (index !== -1) {
      sprites.splice(index, 1)
    }
    foreground.delete(this.obj)
  },
  flash: function() {
    this.flashing = Date.now()
    this.obj.color = 'white'
  },
  shake: function() {
    this.shakeOffset = [0, 0] // Vector.clone(this.offset)
    this.shaking = true
    this.shakeTimer += 8
    if (this.shakeTimer > this.shakeTimerMax) {
      this.shakeTimer = this.shakeTimerMax
    }
  },
  attach: function(target, offset) {
    this.attached = true
    this.attachee = target
    this.offset = offset || [0, 0]
    this.pos = this.obj.pos = target.pos
  },
  update: function() {
    if (this.flashing && Date.now() - this.flashing > 1000 / 60) {
      this.obj.color = null
      this.flashing = null
    }
    if (this.spd) {
      var n = Vector.normalized(this.dir)
      var d = Vector.scaled(n, this.spd)
      Vector.add(this.vel, d)
    }
    Vector.add(this.pos, this.vel)
    Vector.scale(this.vel, this.frc)
    if (this.shaking) {
      if (this.shakeTimer--) {
        if (++this.shakeIndex >= shakeSequence.length) {
          this.shakeIndex -= shakeSequence.length
        }
        var offset = Vector.scaled(shakeSequence[this.shakeIndex], 0.05)
        this.offset = Vector.added(this.shakeOffset, offset)
      } else {
        this.offset = Vector.clone(this.shakeOffset)
        this.shakeOffset = null
        this.shaking = false
      }
    }
    this.obj.pos = Vector.added(this.pos, this.offset)
    this.hitbox = this.getHitbox()
    if (++this.frameTimer >= this.frameDelay) {
      this.frameTimer = 0
      if (++this.obj.index >= this.frames) {
        this.obj.index = 0
      }
    }
  }
}


function Effect() {

}

Effect.prototype = extend(Sprite, {
  duration: Infinity,
  spd: 0.01,
  dir: Vector.UP,
  spawn: function(pos) {
    this.life = this.duration
    return Sprite.prototype.spawn.call(this, pos)
  },
  update: function() {
    if (this.life !== Infinity) {
      this.life--
      if (this.life <= 0) {
        this.kill()
      }
    }
    Sprite.prototype.update.call(this)
  }
})

function Boost() {

}

Boost.prototype = extend(Effect, {
  sprite: 'boost',
  size: [2, .5],
  duration: Infinity
})

function Explosion(size) {
  this.size = size || Vector.clone(this.size)
}

Explosion.prototype = extend(Effect, {
  sprite: 'explosion',
  size: [1, 1],
  duration: 8,
  frames: 4,
  frameDelay: 2
})

function Spark() {

}

Spark.prototype = extend(Effect, {
  sprite: 'spark',
  size: [0.5, 0.5],
  duration: 1,
})


function Projectile(targets) {
  this.targets = targets || this.targets
}

Projectile.prototype = extend(Sprite, {
  power: 1,
  piercing: false,
  targets: [],
  spawn: function(pos) {
    this.hitList = {}
    return Sprite.prototype.spawn.call(this, pos)
  },
  kill: function(silent) {
    if (!silent) {
      var dx = Random.get(-2, 2)
      var dy = Random.get(-2, 2)
      var d  = Vector.scaled([dx, dy], 0.1)
      new Explosion().spawn(Vector.added(this.pos, d))
    }
    Sprite.prototype.kill.call(this, silent)
  },
  update: function() {
    var pastL = this.dir[0] < 0 && this.pos[0] - this.size[0] / 2 < 0
    var pastR = this.dir[0] > 0 && this.pos[0] + this.size[0] / 2 > Display.size
    var pastU = this.dir[1] < 0 && this.pos[1] - this.size[1] / 2 < 0
    var pastD = this.dir[1] > 0 && this.pos[1] + this.size[1] / 2 > Display.size
    if (pastL || pastR || pastU || pastD) {
      return this.kill(true)
    }
    var hit = null
    this.targets.some(function(target) {
      if (!this.hitList[target] && Rect.isColliding(this.hitbox, target.hitbox)) {
        target.hit(this.power)
        this.hitList[target] = true
        if (!this.piercing) {
          hit = target
          return hit
        }
      }
    }, this)
    if (hit) {
      var distance, normal, minimum, corrected
      distance  = Vector.subtracted(this.pos, hit.pos)
      normal    = Vector.normalized(distance)
      minimum   = Vector.scaled(normal, hit.hitboxSize[0] / 2)
      corrected = Vector.added(hit.pos, minimum)
      this.pos[0] = corrected[0]
      this.pos[1] = corrected[1]
      return this.kill()
    }
    Sprite.prototype.update.call(this)
  }
})

function Spear(targets) {
  Projectile.call(this, targets)
}

Spear.prototype = extend(Projectile, {
  spd: .7,
  size: [1.5, .5],
  dir: Vector.RIGHT,
  frames: 1,
  sprite: 'spear'
})

function Spinny(targets, direction) {
  this.dir = direction || Vector.RIGHT
  Projectile.call(this, targets, direction)
}

Spinny.prototype = extend(Projectile, {
  spd: 0.25,
  frc: 0.1,
  size: [.5, .5],
  sprite: 'spinny',
  frames: 6,
  frameDelay: 2
})


function Ship() {

}

Ship.prototype = extend(Sprite, {
  health:        1,
  defense:       1,
  shotType:      'spread',
  shotTimer:     0,
  shotSpacing:   0,
  shotCooldown:  0,
  shotDirection: 0,
  shotsPerBurst: 0,
  shotsPerRound: 0,
  shotsFired:    0,
  shooting:      false,
  overheating:   false,
  shoot: function() {

  },
  reload: function() {

  },
  hit: function(damage) {
    this.health -= damage / this.defense
    this.flash()
    this.shake()
  },
  update: function() {
    if (this.shooting) {
      if (!this.overheating) {
        this.shotTimer++
        if (this.shotTimer >= this.shotSpacing * 60) {
          this.shotTimer = 0
          this.shoot()
          this.shotsFired++
          if (this.shotsFired >= this.shotsPerRound) {
            this.shotsFired = 0
            this.overheating = true
          }
        }
      }
    }
    if (this.overheating) {
      this.shotTimer++
      if (this.shotTimer >= this.shotCooldown * 60) {
        this.shotTimer = 0
        this.overheating = false
        this.reload()
      }
    }
    if (this.health <= 0) {
      this.kill()
    }
    Sprite.prototype.update.call(this)
  },
  pushTrigger: function() {
    this.shooting = true
  },
  releaseTrigger: function() {
    this.shooting   = false
    this.shotTimer  = this.shotSpacing * 60
    this.shotsFired = 0
    this.overheating = false
  }
})

function Enemy() {

}

Enemy.prototype = extend(Ship, {
  health: 1,
  defense: Infinity,
  shotCooldown:  2,
  shotSpacing:   .25,
  shotsPerBurst: 9,
  shotsPerRound: 9,
  spd: 0.0025,
  frc: 0.9975,
  dir: Vector.UP,
  size: [2, 2],
  sprite: 'enemy',
  spawn: function(pos) {
    var hitbox, ship = Ship.prototype.spawn.call(this, pos)
    enemies.push(this)
    // hitbox = foreground.circle(Vector.scaled(this.hitboxSize, 0.5), 'lime')(this.pos)
    return ship
  },
  kill: function() {
    Ship.prototype.kill.call(this)
    remove(enemies, this)
  },
  shoot: function() {
    var centerAngle = Vector.toDegrees(this.shotDirection)
    var origin   = Vector.added(this.pos, Vector.scale(this.shotDirection, this.size[0] / 2))
    var imax = this.shotsPerBurst - this.shotsFired % 2
    var i = imax
    var burstSpacing = 45 * 0.25
    while (i--) {
      angle = centerAngle - imax / 2 * burstSpacing + (i + 0.5) * burstSpacing
      normal = Vector.fromDegrees(angle)
      origin = Vector.added(this.pos, Vector.scale(normal, this.size[0] / 2 + Spinny.prototype.size[0] / 2))
      new Spinny(players, normal).spawn(origin)
    }
  },
  reload: function() {
    var distance = Vector.subtracted(player.pos, this.pos)
    this.shotDirection = Vector.normalized(distance)
  },
  update: function() {
    if (-this.dir[1] * (this.pos[1] - Display.size[1] / 2) < 0) {
      this.dir[1] *= -1
    }
    Ship.prototype.update.call(this)
  }
})

function Player(controls) {
  this.controls = controls
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
    var ship = Ship.prototype.spawn.call(this, pos)
    boost = new Boost().spawn(Vector.subtracted(pos, [Boost.prototype.size[0], 0]))
    boost.attach(this, [-this.size[0] / 2 - Boost.prototype.size[0] / 2 + .4, 0])
    players.push(this)
    this.hitboxSize = [0.2, 0.2]
    // var hitbox = foreground.circle(Vector.scaled(this.hitboxSize, 2), 'lime')(this.pos)
    return ship
  },
  kill: function() {
    Ship.prototype.kill.call(this)
    remove(players, this)
  },
  shoot: function() {
    var origin = Vector.added(this.pos, [.5, .3])
    new Spark().spawn(Vector.subtracted(origin, [Spear.prototype.size[0] / 2, 0]))
    new Spear(enemies).spawn(origin)
    new Spear(enemies).spawn(Vector.added(origin, [0, -0.33]))
  },
  update: function() {
    var dx = 0, dy = 0, controls = this.controls
    var mouse, dist, normal, vel
    if (controls) {
      if (Input.pressed[controls.l || controls.left])  dx--
      if (Input.pressed[controls.r || controls.right]) dx++
      if (Input.pressed[controls.u || controls.up])    dy--
      if (Input.pressed[controls.d || controls.down])  dy++
      if (!dx && !dy) {
        if (Input.mousePos) {
          mouse  = Vector.scaled(Input.mousePos, Display.scale)
          dist   = Vector.subtracted(mouse, this.pos)
          dx     = dist[0]
          dy     = dist[1]
        }
      } else {
        Input.mousePos = null
      }
      if (dx || dy) {
        // normal = Vector.normalized([dx, dy])
        this.vel = Vector.scaled([dx, dy], 1 / 24)
      }
      if (Input.pressed[controls.a]) {
        this.pushTrigger()
      } else {
        this.releaseTrigger()
      }
    }
    if (this.pos[0] < 0) {
      this.pos[0] = 0
    }
    if (this.pos[0] > Display.size[0]) {
      this.pos[0] = Display.size[0]
    }
    if (this.pos[1] < 0) {
      this.pos[1] = 0
    }
    if (this.pos[1] > Display.size[1]) {
      this.pos[1] = Display.size[1]
    }
    Ship.prototype.update.call(this)
  }
})

function main() {
  background = Display.create('background')
  foreground = Display.create('foreground')

  var half = Vector.multiplied(Display.size, [1, 1 / 2])

  background.rect(Display.size, ['#9cf', 'white'])()
  background.rect(half, '#454E69')(Vector.multiplied(Display.size, [0, 1 / 2]))

  ctx = foreground.parent.context

  mountains = foreground.sprite('mountains', [32, 1])([24, 11.6])
  crag = foreground.sprite('crag', [3, 6])([8, 18])

  player = new Player({
    l: 'ArrowLeft',
    r: 'ArrowRight',
    u: 'ArrowUp',
    d: 'ArrowDown',
    a: 'MouseLeft',
  }).spawn(Vector.multiplied(Display.size, [.25, .5]))

  var enemyPos = Vector.multiplied(Display.size, [.75, .25])
  var enemy    = new Enemy().spawn(enemyPos)

  enemy.pushTrigger()

  var shots = []

  Input.init(app)
  Input.loop(function() {
    var i
    if (!paused) {
      i = sprites.length
      while (i--) {
        sprites[i].update()
      }

      mountains.pos[0] -= 0.01
      if (mountains.pos[0] < -mountains.size[0] / 2) {
        mountains.pos[0] += Display.size[0] + mountains.size[0]
      }

      crag.pos[0] -= 0.25
      if (crag.pos[0] < -crag.size[0] / 2) {
        crag.pos[0] += Display.size[0] + crag.size[0]
      }

      background.update()
      foreground.update()

    }
    if (Input.tapped.KeyP) {
      paused = !paused
    }
  })
}

Display.init(app)
Display.load(['ship', 'spear', 'boost', 'mountains', 'crag', 'enemy', 'explosion', 'spinny', 'spark'], main)
