/// <reference path='../node_modules/uWebSockets.js/index.d.ts' />
const uWS = require('../node_modules/uWebSockets.js');
const Player = require("../src/Player");
const http = require('http');
    
var SOCKETS = [];
var id = 1;
var app, game, scene;

const decoder = new TextDecoder('utf-8');

const MESSAGE_ENUM = Object.freeze({
  SELF_CONNECTED: "SELF_CONNECTED",
  CLIENT_CONNECTED: "CLIENT_CONNECTED",
  CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
  CLIENT_MESSAGE: "CLIENT_MESSAGE",
  SERVER_MESSAGE: "SERVER_MESSAGE",
  AUTH_MESSAGE: "AUTH_MESSAGE"
});

const init = (port, gameP) => { 
    game = gameP;
    scene = game.scene;
    app = uWS.App()
        .ws('/ws', {
        compression: 0,
        maxPayloadLength: 16 * 1024 * 1024,
        idleTimeout: 60,
        
        open: (ws, req) => {
            ws.id = id++;
            ws.subscribe(MESSAGE_ENUM.AUTH_MESSAGE);
            SOCKETS.push(ws);
        },
        
        ping: (ws, message) => {

        },
        
        message: (ws, message, isBinary) => {

        let clientMsg = JSON.parse(decoder.decode(message));
        let serverMsg = {};

        var player = game.players.find(p => p.name == ws.username);

        switch (clientMsg.type) {
        case MESSAGE_ENUM.AUTH_MESSAGE:
            var authSessionID = clientMsg.body.sessionID;
            console.log("AUTH MESSAGE: ",authSessionID);
            var data = JSON.stringify({sessionID: authSessionID});
            var response = '', username = '';
            
            const req = http.request({
                hostname: "localhost",
                port: 8088,
                method: 'POST',
                path: "/authenticateUser",
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
            }, res => {
                res.on('data', d => {
                    response += d;
                    //process.stdout.write(d);
                });
                res.on('end', () => {
                    response = JSON.parse(response);
                    console.log(response);
                    if (response.loggedIn == true) {
                        username = response.username;
                        var originalName = username+"";
                        var i = 1;
                        while (SOCKETS.find(v => v.username == username)) {
                            username = originalName+"("+(i++)+")";
                        }
                        ws.username = username;

                        ws.subscribe(MESSAGE_ENUM.CLIENT_CONNECTED);
                        ws.subscribe(MESSAGE_ENUM.CLIENT_DISCONNECTED);
                        ws.subscribe(MESSAGE_ENUM.CLIENT_MESSAGE);
                        ws.subscribe(MESSAGE_ENUM.SERVER_MESSAGE);
                        
                        console.log("Dołącza użytkownik " + username);
                        let selfMsg = {
                            type: MESSAGE_ENUM.SELF_CONNECTED,
                            body: {
                            id: ws.id,
                            name: ws.username
                            }
                        }
                        
                        let msg = {
                            type: MESSAGE_ENUM.CLIENT_CONNECTED,
                            body: {
                            id: ws.id,
                            name: ws.username
                            }
                        }
                        
                        var player = game.players.find(p => p.name == ws.username);
                        //console.log(player);
                        if (player != undefined) {
                        //console.log("Twoj stary");
                        } else {
                            //console.log("Twoj dasgaga");
                            player = new Player(scene,ws.username,1,game);
                            game.players.push(player);
                            // if (game.players.length > 1 && game.status.started == false) {
                            //     game.startGame();
                            // }
                        }
            
                        setTimeout(() => {
                            ws.send(JSON.stringify(selfMsg));
                            app.publish(MESSAGE_ENUM.CLIENT_CONNECTED, JSON.stringify(msg));
                            if (game.onPlayerConnected) {
                                game.onPlayerConnected(ws);
                            }
                        },100);

                    } else {
                        console.log("Nieudana autoryzacja klienta");
                        ws.close();
                    }
                })
            });

            req.on('error', error => {
                console.error(error)
              });
              
            req.write(data);
            req.end();

            break;
        case MESSAGE_ENUM.CLIENT_MESSAGE:
            serverMsg = {
                type: MESSAGE_ENUM.CLIENT_MESSAGE,
                sender: ws.username,
                body: clientMsg.body
            };

            if (game.onPlayerMessage) {
                game.onPlayerMessage(ws,clientMsg.body);
            }

            if (clientMsg.body.position)
                player.applyMovement(clientMsg.body.position);
            player.updateRotationOfPlayer(clientMsg.body.rotation);

            var shotInfo = clientMsg.body.shot;
            if (shotInfo && player.canShoot()) {
            //console.log(shotInfo);
                if (shotInfo.player) {
                    player.weapon.bullets--;
                    var playerHit = game.players.find(p => p.name == shotInfo.player);
                    if (playerHit == null || playerHit == undefined) {
                        console.log(player.name + " trafił w nieistniejącego gracza " + shotInfo.player);
                    } else {
                        playerHit.dealDamage(player,player.weapon.damage * (shotInfo.head ? 4 : 1),shotInfo.imposter,shotInfo.direction,shotInfo.point);
                    }
                    //console.log(player);
                }
            }

            if (clientMsg.body.reload) {
                player.reload();
            }
            //gracz.rotation = clientMsg.body.rotation;
            
            app.publish(MESSAGE_ENUM.CLIENT_MESSAGE, JSON.stringify(serverMsg));
            break;
        default:
            console.log("Unknown message type.");
        }
        },

        close: (ws, code, message) => {
            if (game.onPlayerDisconnected && ws.username) {
                game.onPlayerDisconnected(ws);
            }
            SOCKETS.find((socket, index) => {
                if (socket && socket.id === ws.id) {
                    SOCKETS.splice(index, 1);
                }
            });            
            if (ws.username) {
                var player = game.players.find(p => p.name == ws.username);
                var index = game.players.indexOf(player);
                game.players.splice(index,1);
                player.capsule.dispose();
                player.gracz.dispose();
                
                    
                let pubMsg = {
                    type: MESSAGE_ENUM.CLIENT_DISCONNECTED,
                    body: {
                    id: ws.id,
                    name: ws.username
                    }
                }	
            
                app.publish(MESSAGE_ENUM.CLIENT_DISCONNECTED, JSON.stringify(pubMsg));
                console.log(pubMsg);
            }
        }
        
    }).listen(port, token => {
        token ?
        console.log(`Listening to port ${port}`) :
        console.log(`Failed to listen to port ${port}`);
    });
    app.MESSAGE_ENUM = MESSAGE_ENUM;

    return app;
}

const kill = (player,killer,imposter,direction,point) => {
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        body: {
          playerState: {
            name: player.name,
            health: 0,
            maxHealth: player.maxHealth
          },
          event: {
            name: "Kill",
            victim: player.name,
            killer: killer.name,
            imposter: imposter,
            direction: direction,
            point: point
          }
        }
    };

    app.publish(MESSAGE_ENUM.SERVER_MESSAGE, JSON.stringify(serverMsg));
}

const updatePlayerState = (player, properties) => {
    console.log("Updating player " + player.name + ", props: " + properties);
    var playerState = { name: player.name };
    properties.forEach(p => playerState[p] = player[p]); // kocham javascripta
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        body: {
            "playerState": playerState
        }
    };

    app.publish(MESSAGE_ENUM.SERVER_MESSAGE, JSON.stringify(serverMsg));
}

const updatePlayerStateForSomeone = (ws, player, properties) => {
    var playerState = { name: player.name };
    properties.forEach(p => playerState[p] = player[p]); // kocham javascripta
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        body: {
            "playerState": playerState
        }
    };

    ws.send(JSON.stringify(serverMsg));
}

const respawn = (player) => {
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        body: {
          playerState: {
            name: player.name,
            health: player.health,
            maxHealth: player.maxHealth,
            position: player.position
          },
          event: {
            name: "Respawn",
            victim: player.name,
            //position: player.position
          }
        }
    };

    app.publish(MESSAGE_ENUM.SERVER_MESSAGE, JSON.stringify(serverMsg));
}

const sendServerMessageToAll = (body) => {
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        "body": body
    };
    app.publish(MESSAGE_ENUM.SERVER_MESSAGE, JSON.stringify(serverMsg));
}

const sendServerMessage = (receiver,body) => {
    var serverMsg = {
        type: MESSAGE_ENUM.SERVER_MESSAGE,
        sender: "SERVER",
        "body": body
    };

    receiver.send(JSON.stringify(serverMsg));
}

module.exports = { init, kill, updatePlayerState, updatePlayerStateForSomeone, respawn, sendServerMessage, sendServerMessageToAll }