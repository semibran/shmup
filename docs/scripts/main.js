import Display from './display'
import Vector from './vector'
import Rect from './rect'
import Input from './input'

var app = document.querySelector('#app')
var paused = false
var ship

function main() {
  background = Display.create('background')
  foreground = Display.create('foreground')

  background.rect(Display.size / 2, '#223')([0, 0])
  background.rect(Display.size / 2, 'indigo')(Display.size / 2)

  foreground.text('Hello World!', 'center', 'white')(Display.size * (3 / 4))

  ship = foreground.sprite('ship', 3, 'crimson')(Display.size * (1 / 4))
  shot = foreground.sprite('shot', 3)([Display.size * (3 / 4), Display.size * (1 / 4)])

  Input.init(app)
  Input.loop(function() {
    var dx = 0, dy = 0, speed = .5
    var mouse, dist, normal, vel
    if (!paused) {
      if (Input.pressed.ArrowLeft)  dx--
      if (Input.pressed.ArrowRight) dx++
      if (Input.pressed.ArrowUp)    dy--
      if (Input.pressed.ArrowDown)  dy++
      if (!dx && !dy) {
        if (Input.mousePos) {
          mouse  = Vector.scaled(Input.mousePos, Display.size)
          dist   = Vector.subtracted(mouse, ship.pos)
          dx     = dist[0]
          dy     = dist[1]
        }
      } else {
        Input.mousePos = null
      }
      if (dx || dy) {
        normal = Vector.normalized([dx, dy])
        vel    = Vector.scaled(normal, speed)
        if (dist && Vector.magnitude(dist) < Vector.magnitude(vel)) {
          vel = dist
        }
        Vector.add(ship.pos, vel)
        foreground.update()
      }
    }
    if (Input.tapped.KeyP) {
      paused = !paused
    }
  })
}

Display.init(app)
Display.load(['ship', 'shot'], main)

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
