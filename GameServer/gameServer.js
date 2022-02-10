const BABYLON = require('babylonjs/babylon.max');
const TeamDeathmatch = require("./src/TeamDeathmatch.js");
const FFADeathmatch = require("./src/FFADeathmatch.js");
const WebSocketServer = require("./src/Server.js");

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var port = 7777;
const port2 = 7777;

var engine = new BABYLON.NullEngine();
var gamemode = "FFADeathmatch", load = false;

var myArgs = process.argv.slice(2);
console.log(myArgs);
for (var i=0; i<myArgs.length; i++) {
  if ((myArgs[i]+"").charAt(0) == '-') {
    switch((myArgs[i]+"").toLowerCase()) {
      case "-gamemode": 
        gamemode = myArgs[i+1];
        break;
      case "-load":
        load = myArgs[i+1].toLowerCase();
        break;
      case "-loadlast":
        load = true;
        break;
      case "-port":
        port = myArgs[i+1] ? parseInt(myArgs[i+1]) : port;
        break;
      default:
        console.log("Unknown command: " + myArgs[i]);
        break;
    } 
  }
}
var game;
switch(gamemode.toLowerCase()) {
  case "teamdeathmatch": case "tdm":
    game = new TeamDeathmatch(load);
    break;
  case "ffadeathmatch": case "ffadm":
    game = new FFADeathmatch(load);
    break;
  default:
    game = new FFADeathmatch(load);
    console.log("Unknown gamemode: " + gamemode);
    break;
}

var scene = game.createScene(engine);
startBabylon(engine,scene);

function startBabylon(engine, scene) {
	engine.runRenderLoop(() => {
    scene.render();
  });
}

const app = WebSocketServer.init(port != NaN ? port : port2, game);
game.server = WebSocketServer;
game.ws = app;
  