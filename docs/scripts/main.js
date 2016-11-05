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
  sprite: null,
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
    if (this.sprite) {
      this.obj = foreground.sprite(this.sprite, this.size, this.sizeSub || this.size)(this.pos)
      this.obj.pos = this.pos
    }
    this.attached = false
    this.flashing = false

    this.shaking = false
    this.shakeIndex = 0
    this.shakeTimer = 0
    this.shakeTimerMax = 15
    this.shakeOffset = [0, 0]

    this.hitboxSize = [min, min]
    this.hitbox = this.getHitbox()

    this.children = []

    this.frameTimer = 0
    sprites.push(this)
    return this
  },
  kill: function() {
    var index = sprites.indexOf(this)
    if (index !== -1) {
      sprites.splice(index, 1)
    }
    if (this.obj) {
      foreground.delete(this.obj)
    }
    this.children.some(function(child) {
      child.kill()
    })
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
    this.attachOffset = offset || [0, 0]
    this.pos = Vector.added(target.pos, this.attachOffset)
    this.attached = true
    this.attachee = target
    this.attachee.children.push(this)
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
    if (this.attached) {
      this.pos = Vector.added(this.attachee.pos, this.attachOffset)
    }
    if (this.obj) {
      this.obj.pos = Vector.added(this.pos, this.offset)
      if (++this.frameTimer >= this.frameDelay) {
        this.frameTimer = 0
        if (++this.obj.index >= this.frames) {
          this.obj.index = 0
        }
      }
    }
    this.hitbox = this.getHitbox()
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
  size: [1, .25],
  frames: 2,
  duration: Infinity
})

function Impact(size) {
  this.size = size || Vector.clone(this.size)
}

Impact.prototype = extend(Effect, {
  sprite: 'explosion',
  size: [1, 1],
  duration: 8,
  frames: 4,
  frameDelay: 2,
  update: function() {
    Effect.prototype.update.call(this)
  }
})

function Explosion() {

}

Explosion.prototype = extend(Effect, {
  duration: 0.25 * 60,
  update: function() {
    var amount = 1
    var offset = 1
    var origin = this.pos
    function getOffset() {
      var x = (Random.get() * 2 - 1) * offset
      var y = (Random.get() * 2 - 1) * offset
      return Vector.added(origin, [x, y])
    }
    while (amount--) {
      new Impact().spawn(getOffset())
      new Smoke().spawn(getOffset())
    }
    Effect.prototype.update.call(this)
  }
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
      new Impact().spawn(Vector.added(this.pos, d))
    }
    Sprite.prototype.kill.call(this, silent)
  },
  update: function() {
    var pastL = this.dir[0] < 0 && this.pos[0] < -this.size[0]
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

function Missile(targets) {
  Projectile.call(this, targets)
}

Missile.prototype = extend(Projectile, {
  spd: 0.01,
  frc: 0.99,
  dir: Vector.DOWN,
  power: 3,
  size: [0.5 * 3, 0.5],
  sprite: 'missile',
  spawn: function(pos) {
    var missile = Projectile.prototype.spawn.call(this, pos)
    this.dropping = true
    this.dropPos  = Vector.clone(pos)
    return missile
  },
  kill: function(silent) {
    if (!silent) {
      new Explosion().spawn(this.pos)
      Display.shake()
    }
    Projectile.prototype.kill.call(this)
  },
  ignite: function() {
    var dist, degrees, range, dir
    var target  = this.targets[0]
    var offset  = [-(Missile.prototype.size[0] / 2 + MissileBoost.prototype.size[0] / 2), 0]
    var origin  = Vector.added(this.pos, offset)
    if (target) {
      dist    = Vector.subtracted(target.pos, this.pos)
      degrees = Vector.toDegrees(dist) - 90
      range   = 5
      if (degrees < -range) {
        degrees = -range
      }
      if (degrees > range) {
        degrees = range
      }
      dir     = Vector.fromDegrees(degrees + 90)
    }
    this.vel[1] = 0
    this.dropping = false
    this.dir = dir || Vector.RIGHT
    this.spd = 0.02
    boost = new MissileBoost().spawn(origin)
    boost.attach(this, offset)
  },
  update: function() {
    if (this.dropping) {
      if (this.pos[1] - this.dropPos[1] > 1) {
        this.ignite()
      }
    } else {
      var origin = Vector.added(this.pos, [-Missile.prototype.size[0] / 2, 0])
      function getOffset() {
        var x = (Random.get() * 2 - 1) * 0.25
        var y = (Random.get() * 2 - 1) * 0.25
        return Vector.added(origin, [x, y])
      }
      var i = 2
      while (i--) {
        new Smoke().spawn(getOffset())
      }
    }
    Projectile.prototype.update.call(this)
  }
})

function MissileBoost() {

}

MissileBoost.prototype = extend(Effect, {
  sprite: 'missile-boost',
  size: [.4 * 6, .4],
  frames: 2,
  duration: Infinity
})

function Smoke() {

}

Smoke.prototype = extend(Effect, {
  sprite: 'smoke',
  size: [0.5, 0.5],
  spd: 0.1,
  dir: Vector.UP,
  duration: 9,
  frames: 3,
  frameDelay: 3,
  update: function() {
    Effect.prototype.update.call(this)
  }
})


function Ship() {

}

Ship.prototype = extend(Sprite, {
  dying:         false,
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
  kill: function() {
    if (!this.dying) {
      this.explode()
    }
    this.dying = true
    this.shooting = false
    this.dir = Vector.DOWN_LEFT
    this.spd = 0.01
    this.frc = 0.99
  },
  shoot: function() {

  },
  reload: function() {

  },
  smoke: function(origin) {
    var amount = 3
    var offset = 0.5
    origin = origin || this.pos
    function getOffset() {
      var x = (Random.get() * 2 - 1) * offset
      var y = (Random.get() * 2 - 1) * offset
      return Vector.added(origin, [x, y])
    }
    while (amount--) {
      new Smoke().spawn(getOffset())
    }
  },
  explode: function() {
    new Explosion().spawn(this.pos)
  },
  hit: function(damage) {
    this.health -= damage / this.defense
    this.flash()
    this.shake()
  },
  update: function() {
    if (!this.dying) {
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
    } else {
      this.smoke()
      if (this.pos[1] > Display.size[1]) {
        Display.flash()
        Display.shake()
        Sprite.prototype.kill.call(this)
      }
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
  defense: 32,
  shotCooldown:  1,
  shotSpacing:   .25,
  shotsPerBurst: 3,
  shotsPerRound: 3,
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
    var imax = this.shotsPerBurst // - this.shotsFired % 2
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
    if (!this.dying) {
      if (-this.dir[1] * (this.pos[1] - Display.size[1] / 2) < 0) {
        this.dir[1] *= -1
      }
    }
    Ship.prototype.update.call(this)
  }
})

function Player(controls) {
  this.controls = controls
}

Player.prototype = extend(Ship, {
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
    this.altTimerMax = 45
    this.altTimer = this.altTimerMax
    // var hitbox = foreground.circle(Vector.scaled(this.hitboxSize, 2), 'lime')(this.pos)
    return ship
  },
  kill: function() {
    Ship.prototype.kill.call(this)
    remove(players, this)
  },
  hit: function(damage) {
    Ship.prototype.hit.call(this, damage)
    Display.flash()
  },
  flash: function() {
    Ship.prototype.flash.call(this)
    this.obj.color = 'black'
  },
  shoot: function() {
    var origin = Vector.added(this.pos, [.5, .3])
    new Spark().spawn(Vector.subtracted(origin, [Spear.prototype.size[0] / 2, 0]))
    new Spear(enemies).spawn(origin)
    // new Spear(enemies).spawn(Vector.added(origin, [0, -0.33]))
  },
  update: function() {
    var dx = 0, dy = 0, controls = this.controls
    var mouse, dist, normal, vel
    if (!this.dying) {
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
          if (!this.altTimer--) {
            var origin = Vector.added(this.pos, [0, this.size[1] / 2])
            new Missile(enemies).spawn(origin)
            this.altTimer = this.altTimerMax
          }
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
    } else {
      if (Random.get() < 0.05) {
        Display.flash()
        Display.shake()
      }
    }
    Ship.prototype.update.call(this)
  }
})

function main() {
  background = Display.create('background')
  foreground = Display.create('foreground')

  background.rect(Display.size, ['#9cf', 'white'])()
  background.rect(Vector.multiplied(Display.size, [1, 1 / 2]), '#449')(Vector.multiplied(Display.size, [0, 1 / 2]))

  clouds = background.sprite('clouds', [40, 4])([16, 10])
  sun = background.sprite('sun', [10, 10])([25, 5])

  mountains = foreground.sprite('mountains', [32, 1])([24, 11.6])
  crag = foreground.sprite('crag', [3, 6])([8, 18])

  ctx = foreground.parent.context

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

      mountains.pos[0] -= 0.025
      if (mountains.pos[0] < -mountains.size[0] / 2) {
        mountains.pos[0] += Display.size[0] + mountains.size[0]
      }

      crag.pos[0] -= 0.5
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
Display.load(['ship', 'spear', 'boost', 'mountains', 'crag', 'enemy', 'explosion', 'spinny', 'spark', 'missile', 'missile-boost', 'smoke', 'clouds', 'sun'], main)
