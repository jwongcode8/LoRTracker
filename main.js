const {app, BrowserWindow, remote} = require('electron');
const path = require('path');
const {ipcMain, screen} = require('electron');
const Store = require('electron-store');
const config = new Store();
var trackerWindow, fullCardWindow, graveyardWindow, oppDeckWindow;

function createWindow () {
  // Create the browser window.
  trackerWindow = new BrowserWindow({
    width: config.get("tracker-width"),
    height: config.get("tracker-height"),
    x: config.get("tracker-x"),
    y: config.get("tracker-y"),
    minWidth:173,
    icon: "./icon.png",
    maximizable:false,
    transparent:true,
    frame:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:true
    }
  })

  trackerWindow.loadFile('index.html');
  
  trackerWindow.webContents.on('did-finish-load', () => {
    trackerWindow.setVisibleOnAllWorkspaces(true);
    trackerWindow.setAlwaysOnTop(true, 'screen-saver');
    trackerWindow.setSkipTaskbar(true);

    trackerWindow.on('resize', () => {
      let size = trackerWindow.getSize();
      config.set("tracker-width", size[0]);
      config.set("tracker-height", size[1]);
      trackerWindow.webContents.send('resize', size[0], size[1]);
    });

    trackerWindow.on('move', () => {
      let position = trackerWindow.getPosition();
      config.set("tracker-x", position[0]);
      config.set("tracker-y", position[1]);
    });

    httpGet(url).then(res => waitingForGame(res));
  });
  
  fullCardWindow = new BrowserWindow({
    width:340,
    height:512,
    maximizable:false,
    transparent:true,
    skipTaskbar:true,
    frame:false,
    focusable:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:true
    }
  })

  fullCardWindow.loadFile("./previewCard.html");
  
  fullCardWindow.webContents.on('did-finish-load', () => {
    fullCardWindow.setVisibleOnAllWorkspaces(true);
    fullCardWindow.setSkipTaskbar(true);
    fullCardWindow.setAlwaysOnTop(true, 'screen-saver');
    fullCardWindow.setIgnoreMouseEvents(true);
    fullCardWindow.hide();
  })

  graveyardWindow = new BrowserWindow({
    width: config.get("graveyard-width"),
    height: config.get("graveyard-height"),
    x: config.get("graveyard-x"),
    y: config.get("graveyard-y"),
    minWidth:173,
    icon: "./icon.png",
    maximizable:false,
    transparent:true,
    frame:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:true
    }
  })

  graveyardWindow.loadFile('graveyard.html');

  graveyardWindow.webContents.on('did-finish-load', () => {
    graveyardWindow.setVisibleOnAllWorkspaces(true);
    graveyardWindow.setAlwaysOnTop(true, 'screen-saver');
    graveyardWindow.setSkipTaskbar(true);

    graveyardWindow.on('resize', () => {
      let size = graveyardWindow.getSize();
      config.set("graveyard-width", size[0]);
      config.set("graveyard-height", size[1]);
      graveyardWindow.webContents.send('resize', size[0], size[1]);
    });

    graveyardWindow.on('move', () => {
      let position = graveyardWindow.getPosition();
      config.set("graveyard-x", position[0]);
      config.set("graveyard-y", position[1]);
    });
  });

  oppDeckWindow = new BrowserWindow({
    width: config.get("opponent-deck-width"),
    height: config.get("opponent-deck-height"),
    x: config.get("opponent-deck-x"),
    y: config.get("opponent-deck-y"),
    minWidth:173,
    icon: "./icon.png",
    maximizable:false,
    transparent:true,
    frame:false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:true
    }
  })

  oppDeckWindow.loadFile('oppDeck.html');

  oppDeckWindow.webContents.on('did-finish-load', () => {
    oppDeckWindow.setVisibleOnAllWorkspaces(true);
    oppDeckWindow.setAlwaysOnTop(true, 'screen-saver');
    oppDeckWindow.setSkipTaskbar(true);

    oppDeckWindow.on('resize', () => {
      let size = oppDeckWindow.getSize();
      config.set("opponent-deck-width", size[0]);
      config.set("opponent-deck-height", size[1]);
      oppDeckWindow.webContents.send('resize', size[0], size[1]);
    });

    oppDeckWindow.on('move', () => {
      let position = oppDeckWindow.getPosition();
      config.set("opponent-deck-x", position[0]);
      config.set("opponent-deck-y", position[1]);
    });
  });
  

  ipcMain.on('preview', (event, src, x, y, window) => {
    let windowPosition;
    let windowSize;
    let windowY;

    switch (window) {
      case "tracker":
        windowPosition = trackerWindow.getPosition();
        windowSize = trackerWindow.getSize();
        break;
      case "graveyard": 
        windowPosition = graveyardWindow.getPosition();
        windowSize = graveyardWindow.getSize();
        break;
      case "oppDeck":
        windowPosition = oppDeckWindow.getPosition();
        windowSize = oppDeckWindow.getSize();
        break;
    }

    if (windowPosition[1] - 256 + y < 0) {
      windowY = 0;
    } 
    else if (windowPosition[1] + 256 + y > screen.getPrimaryDisplay().workAreaSize.height) {
      windowY = screen.getPrimaryDisplay().workAreaSize.height - 512;
    } 
    else {
      windowY = windowPosition[1] - 256 + y;
    }

    if (windowPosition[0] > screen.getPrimaryDisplay().workAreaSize.width / 2) { // config
      fullCardWindow.setPosition(windowPosition[0] - 340, windowY); 
    }
    else {
      fullCardWindow.setPosition(windowPosition[0] + windowSize[0], windowY); 
    }

    fullCardWindow.webContents.send('preview', src, x, y);
    fullCardWindow.show();
  });

  ipcMain.on('unpreview', (event) => {
    fullCardWindow.hide();
  });

}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

const axios = require('axios');


async function httpGet(theUrl)
{
  try {
    let res = await axios({
         url: theUrl,
         method: 'get'
         }
     );
     return res.data
 }
 catch (err) {
     console.error(err);
 }
}

var url = "http://127.0.0.1:21337/positional-rectangles";
var setJson = require('./set1-en_us.json');
var prevDraw;
var cardsLeft;
var height;
var handSize;
var currentRectangles = [];
global.decklist = [];
global.graveyardArr = [];
global.oppDeckArr = [];


function waitingForGame(r) {
  console.log("Waiting");

  if (!r) {
    setTimeout(function() {httpGet(url).then(res => waitingForGame(res));}, 500);
    console.log("r NOT EXIST1");
  }
  else {
    if ((r.GameState) === ('InProgress')) {
      prevDraw = null;
      cardsLeft = 40;
      height = r.Screen.ScreenHeight;
      httpGet("http://127.0.0.1:21337/static-decklist").then(res => matchFound(res));
    }
    else
      setTimeout(function() {httpGet(url).then(res => waitingForGame(res));}, 5000);
  }
}

function matchFound(r) {
  if (!r) {
    console.log("r NOT EXIST2");
    setTimeout(function() {httpGet(url).then(res => waitingForGame(res));}, 500);
  }

  global.decklist = r.CardsInDeck;
  global.graveyardArr = [];
  global.oppDeckArr = [];
  currentRectangles = [];

  trackerWindow.show();
  
  size = trackerWindow.getSize();
  trackerWindow.webContents.send('start', size[0], size[1]);

  handSize = 4;
  trackerWindow.webContents.send('handUpdate', handSize);

  console.log("Waiting for Mulligan");
  httpGet(url).then(res => waitingForMulligan(res));
}

function waitingForMulligan(r) { //Mulligan  
  if (!r) {
    console.log("r NOT EXIST3");
    setTimeout(function() {httpGet(url).then(res => waitingForGame(res));}, 500);
  }
  var card = null;
  var firstCard = null;
  
  for (let element of r.Rectangles) {
    if ((element.Height > height / 2 - 10) && (element.Height < height / 2 + 10)) {
      card = element;
      firstCard = element.CardID;
      break;
    }
  };

  if (card == null) {
    setTimeout(function() {httpGet(url).then(res => waitingForMulligan(res));}, 1000);
  }
  else { // First Draw

    prevDraw = card;
    
    for (let element of r.Rectangles) {

      if ((element.CardCode !== ("face")) && (element.LocalPlayer) && (element.CardID !== firstCard)) {
        cardsLeft--;
        
        let setCard = setJson.find(o => o.cardCode === element.CardCode);
        
        if (setCard.type === "Unit") 
          trackerWindow.webContents.send('update', element.CardCode, true);
        else
          trackerWindow.webContents.send('update', element.CardCode, false);
      }
    };

    console.log("Tracking Game");

    httpGet(url).then(res => trackingGame(res));
  }
}

function trackingGame(r) {
  if (!r) {
    console.log("r NOT EXIST 4")
    setTimeout(function() {httpGet(url).then(res => waitingForGame(res));}, 500);
  }

  var tempHandSize = 0;
  let tempCurrentRectangles = [];

  if (r.GameState !== ("InProgress")) {
    httpGet("http://127.0.0.1:21337/game-result").then(res => matchOver(res));
  }
  else {
    //let card;
    for (let element of r.Rectangles) {
      if (element.CardCode !== "face") {
        tempCurrentRectangles.push({"CardID": element.CardID, "CardCode": element.CardCode, "LocalPlayer": element.LocalPlayer});
      }

      if ((element.TopLeftY < height * 0.17)) {
        tempHandSize++;
      }
      if ((element.Height > height / 2 - 10) && (element.Height < height / 2 + 10)) {
        card = element;
        break;
      }
    };
    
    if (currentRectangles !== tempCurrentRectangles && tempHandSize !== 0) {
      for (let element of tempCurrentRectangles) {
        if ( !currentRectangles.find(o => o.CardID === element.CardID) && !element.LocalPlayer) {
          let card = setJson.find(o => o.cardCode === element.CardCode);

          if (card.type === "Unit" || card.type === "Spell") {
            if (oppDeckArr.find(o => o.cardCode === element.CardCode && o.localPlayer === element.LocalPlayer)) {
              let existingCard = oppDeckArr.find(o => o.cardCode === element.CardCode);
              if (!existingCard.IDs.includes(element.CardID)) {
                existingCard.quantity++;
                existingCard.IDs.push(element.CardID)
              }
            }
            else {
              oppDeckArr.push({
                "cardCode": card.cardCode,
                "mana": card.cost,
                "quantity": 1,
                "imageUrl": null,
                "name": card.name,
                "region": card.regionRef,
                "localPlayer": element.LocalPlayer,
                "type": card.type,
                "IDs": [element.CardID]
              });
            }
          }
          oppDeckWindow.webContents.send('update', "test");
        }
      }

      for (let element of currentRectangles) {
        if ( !tempCurrentRectangles.find(o => o.CardID === element.CardID)) {//!tempCurrentRectangles.includes(element)) {
          let card = setJson.find(o => o.cardCode === element.CardCode);

          if (card.type === "Unit" || card.type === "Spell") {
            if (graveyardArr.find(o => o.cardCode === element.CardCode && o.localPlayer === element.LocalPlayer)) {
              let existingCard = graveyardArr.find(o => o.cardCode === element.CardCode);
              if (!existingCard.IDs.includes(element.CardID)) {
                existingCard.quantity++;
                existingCard.IDs.push(element.CardID)
              }
            }
            else {
              graveyardArr.push({
                "cardCode": card.cardCode,
                "mana": card.cost,
                "quantity": 1,
                "imageUrl": null,
                "name": card.name,
                "region": card.regionRef,
                "localPlayer": element.LocalPlayer,
                "type": card.type,
                "IDs": [element.CardID]
              });
            }
          }
          graveyardWindow.webContents.send('update', "test");
        }
      }

      currentRectangles = tempCurrentRectangles;
    }


    if (card != null && card.CardID !== prevDraw) {
      let setCard = setJson.find(o => o.cardCode === card.CardCode);
      prevDraw = card.CardID;
      cardsLeft--;
      //console.log(card);
      if (setCard.type === "Unit") 
        trackerWindow.webContents.send('update', card.CardCode, true);
      else
        trackerWindow.webContents.send('update', card.CardCode, false);
    }

    if (handSize !== tempHandSize && tempHandSize !== 0) {
      handSize = tempHandSize;
      trackerWindow.webContents.send('handUpdate', handSize);
    }

    setTimeout(function() {httpGet(url).then(res => trackingGame(res));}, 1000);
  }
}

function matchOver(r) {
  if (!r)
    httpGet(url).then(res => waitingForGame(res));


  if (r.LocalPlayerWon)
    console.log("Victory");
  else
    console.log("Defeat");

  trackerWindow.hide();
  
  httpGet(url).then(res => waitingForGame(res));
}