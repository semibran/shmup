import Display from './display'
import Vector from './vector'
import Rect from './rect'
import Mouse from './mouse'

var app = document.querySelector('#app')
var ship

function main() {
  background = Display.create('background')
  foreground = Display.create('foreground')

  background.rect(Display.size / 2, '#223')([0, 0])
  background.rect(Display.size / 2, 'indigo')(Display.size / 2)

  foreground.text('Hello World!', 'center', 'white')(Display.size * (3 / 4))

  ship = foreground.sprite('ship', 3, 'crimson')(Display.size * (1 / 4))

  loop()
}

Display.init(app)
Display.load('ship', main)

var keyPressed = {}
function handleKeys(e) {
  var keydown = e.type === 'keydown'
  keyPressed[e.code] = keydown
}

window.addEventListener('keydown', handleKeys)
window.addEventListener('keyup',   handleKeys)

function loop() {
  var dx = 0, dy = 0
  if (keyPressed.ArrowLeft) {
    dx--
  }
  if (keyPressed.ArrowRight) {
    dx++
  }
  if (dx != 0 || dy != 0) {
    Vector.add(ship.pos, Vector.scaled([dx, dy], .2))
    foreground.update()
  }
  requestAnimationFrame(loop)
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
