const {app, BrowserWindow} = require('electron')
app.commandLine.appendSwitch('disable-smooth-scrolling')
app.commandLine.appendSwitch('ignore-certificate-errors')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // calc primary display screen center
  var screen = require('electron').screen
  var primaryDisplay = screen.getPrimaryDisplay()

  var windowHeight = 690
  var windowWidth = 1160
  var displayHeight = primaryDisplay.bounds.height
  var displayWidth = primaryDisplay.bounds.width

  var center_y = (displayHeight - windowHeight) / 2
  var center_x = (displayWidth - windowWidth) / 2

  // Create the browser window.
  if (process.platform == "linux") {
    win = new BrowserWindow({
      width: windowWidth, height: windowHeight,
      frame: false,
      backgroundColor: '#212121',
      darkTheme: true,
      x: center_x, // need to make this portable...
      y: center_y + 10
    })
    win.setMenu(null);
  }
  else {
    win = new BrowserWindow({
      width: windowWidth, height: windowHeight,
      frame: false,
      backgroundColor: '#212121',
      x: center_x,
      y: center_y
    })
  }

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
    try {
      app.quit()
    }
    catch (err){
      return
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
