export default (function() {
  var pressed  = {}
  var tapped   = {}
  var time     = {}
  var released = {}

  var element = document.body
  var mousePos = null

  var init = false
  var looping = false

  function handleInput(e) {
    var type, down, code
    if (e.type === 'keydown' || e.type === 'keyup') {
      type = 'key'
      code = e.code
      down = e.type === 'keydown'
    } else if (e.type === 'mousedown' || e.type === 'mouseup') {
      type = 'key'
      code = e.button === 0 ? 'MouseLeft' : e.button === 2 ? 'MouseRight' : null
      down = e.type === 'mousedown'
    } else if (e.type === 'touchstart' || e.type === 'touchend') {
      type = 'key'
      code = 'MouseLeft'
      down = e.type === 'touchstart'
    }
    if (down) {
      if (!pressed[code]) {
        time[code] = 0
        tapped[code] = true
      }
    } else {
      if (pressed[code]) {
        time[code] = null
        released[code] = true
      }
    }
    pressed[code] = down
  }

  return {
    mousePos: mousePos,
    pressed: pressed,
    tapped: tapped,
    time: time,
    released: released,
    init: function(parent) {
      var that = this
      element = parent || element
      init = true

      function mouseDown(e) {
        var rect = element.getBoundingClientRect()
        that.mousePos = that.mousePos || [0, 0]
        that.mousePos[0] = (e.pageX - rect.left) / rect.width
        that.mousePos[1] = (e.pageY - rect.top)  / rect.height
        e.preventDefault()
      }

      function mouseUp() {
        that.mousePos = null
      }

      element.addEventListener(event,        handleInput)
      window.addEventListener('keydown',     handleInput)
      window.addEventListener('keyup',       handleInput)
      window.addEventListener('mousemove',  mouseDown);
      element.addEventListener('mousedown',  mouseDown);
      window.addEventListener('mouseup',    mouseUp);

      window.addEventListener('touchmove',  mouseDown);
      element.addEventListener('touchstart', mouseDown);
      window.addEventListener('touchend',   mouseUp);

      ['mousedown', 'mouseup', 'touchstart', 'touchend'].some(function(event) {
        element.addEventListener(event, handleInput)
      })
    },
    loop: function(callback) {
      if ( looping) throw 'InputError: `loop` function is already in progress.'
      if (!init) this.init()
      looping = true
      function loop() {
        callback.call(window)
        requestAnimationFrame(function() {
          loop(callback)
        })
        // setTimeout(function() {
        //   loop(callback)
        // }, 1000)
        for (code in pressed)  if (pressed[code]) time[code]++
        for (code in tapped)   tapped[code]   = false
        for (code in released) released[code] = false
      }
      loop()
    }
  }
}())
