console.clear()

var appUnit, appRect, app = document.querySelector('#app')
var cvs = document.querySelector('canvas')
var ctx = cvs.getContext('2d')

function resize() {
  appRect = app.getBoundingClientRect()
  if (cvs.width !== appRect.width || cvs.height !== appRect.height) {
    cvs.width = appRect.width
    cvs.height = appRect.height
  }
  update()
}

function update() {
  appUnit = (cvs.width / 32)
  var size = appUnit + 'px'

  // Background
  ctx.fillStyle = '#223'
  ctx.fillRect(0, 0, cvs.width, cvs.height)

  // Text alignment
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'white'
  ctx.font = appUnit * 1.5 + 'px sans-serif'
  ctx.fillText('This text resizes with the viewport.', cvs.width / 2, appUnit * 8)

  ctx.fillStyle = 'rgba(255, 255, 255, .5)'
  ctx.font = appUnit + 'px sans-serif'
  ctx.fillText('It\'s also drawn using the Canvas API.', cvs.width / 2, appUnit * (8 + 2.5))
  ctx.fillText('Try scaling down the window!', cvs.width / 2, appUnit * (8 + 4))
}

window.addEventListener('resize', resize)
window.addEventListener('load', function() {
  resize()
  app.addEventListener('mousemove', function(e) {
    var x = (e.pageX - appRect.left) / appUnit
    var y = (e.pageY - appRect.top)  / appUnit
    var xCenter = x * appUnit
    var yCenter = y * appUnit
    var xStart  = xCenter - appUnit
    var yStart  = yCenter - appUnit

    ctx.fillStyle = '#223'
    ctx.fillRect(xStart, yStart, appUnit * 2, appUnit * 2)
  })
})

player = {
  posDrawn: null,
  pos: [16, 16],
  size: 8,
  draw: function() {
    if (this.posDrawn) {

    }
  }
}
