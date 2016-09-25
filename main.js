const {app, BrowserWindow} = require('electron')
app.commandLine.appendSwitch('disable-smooth-scrolling')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // calc primary display screen center
  var screen = require('electron').screen
  var primaryDisplay = screen.getPrimaryDisplay()

  var windowHeight = 900
  var windowWidth = 1600
  var displayHeight = primaryDisplay.bounds.height
  var displayWidth = primaryDisplay.bounds.width

  var center_y = (displayHeight - windowHeight) / 2
  var center_x = (displayWidth - windowWidth) / 2

  // Create the browser window.
  if (process.platform == "linux") {
    win = new BrowserWindow({
      width: windowWidth, height: windowHeight,
      frame: true,
      backgroundColor: '#333333',
      darkTheme: true,
      x: 1360 + center_x, // need to make this portable...
      y: center_y
    })
    win.setMenu(null);
  }
  else {
    win = new BrowserWindow({
      width: windowWidth, height: windowHeight,
      frame: false,
      backgroundColor: '#333333',
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
    app.quit()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
