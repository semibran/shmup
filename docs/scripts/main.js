import Display from './display'
import Vector from './vector'
import Rect from './rect'
import Mouse from './mouse'

var app = document.querySelector('#app')

Display.init(app)
background = Display.create('background')
foreground = Display.create('foreground')

background.rect(Display.size / 2, 'black')([0, 0])
background.rect(Display.size / 2, 'gray')(Display.size / 2)

foreground.text('Hello World!', 'center', 'white')(Display.size * (3 / 4))

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
