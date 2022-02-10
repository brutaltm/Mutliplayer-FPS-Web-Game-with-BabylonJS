const Player = require("./Player");
const Recast = require("../lib/recast.js");
const fs = require('fs');

class TeamDeathmatch {

    settings = {
        gamemode: "TeamDeathmatch",
        teams: ["TeamA", "TeamB"],
        time: 60*1, // 10 min
        maxScore: -1,
        respawnDelay: 3000
    };
    status = {
        scores: { "TeamA": 0, "TeamB": 0 },
        timeLeft: 0,
        started: false
    };
    started = false; 
    score = {};
    PLAYER_SPEED = 0.07;
    scene;
    players = [];
    playerStates = [];
    bots = [];
    navigationPlugin = {};
    navMeshes = [];
    ws;
    autoSaveEventInterval = -1;

    constructor(load) {
        this.loadSave = load;
        console.log("Load value: ", load);
    }

    createScene(engine) {
        var scene = new BABYLON.Scene(engine);
        this.scene = scene;
        scene.skipPointerMovePicking = true
        scene.collisionsEnabled = true;

        const ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
        ground.checkCollisions = true;
        ground.position.y -= 1;

        //Recast();
        var navigationPlugin = new BABYLON.RecastJSPlugin(Recast);
        var array = new Uint8Array(fs.readFileSync('./maps/training_NavMesh.bin', null).buffer);
        console.log(array);
        navigationPlugin.buildFromNavmeshData(array);
        console.log(navigationPlugin.getClosestPoint(new BABYLON.Vector3(10,1,10)));
        this.navigationPlugin = navigationPlugin;
        const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0,0,-5), scene);

        return scene;
    }


    startGame() {
        if (this.status.started)
            return;
        
        switch(this.loadSave) {
            case true:
                console.log("Loading latest save.");
                this.loadLastSave();
                break;
            case false:
                console.log("Load not needed.");
                this.status.timeLeft = this.settings.time;
                this.status.scores = {};
                this.status.started = true;
                this.settings.teams.forEach(t => this.status.scores[t] = 0);
                break;
            default:
                console.log("Loading save by name: " + this.loadSave);
                this.loadGameStateJSONFile(this.loadSave);
                break;
        }    
        setTimeout(() => {
        
        var autoSaveEvent;
        if (this.autoSaveEventInterval != -1) {
            setTimeout(() => {
                autoSaveEvent = setInterval(() => this.saveGameStateJSONFile(), this.autoSaveEventInterval);
            },this.autoSaveEventInterval);
        }

        console.log("Game started - " + Math.trunc(this.status.timeLeft/60) + ":" + this.status.timeLeft%60);
        var a = setInterval(() => {
            console.log(Math.trunc(this.status.timeLeft/60) + ":" + this.status.timeLeft%60);
            this.status.timeLeft--;
            // this.ws.publish(this.ws.MESSAGE_ENUM.SERVER_MESSAGE, JSON.stringify(this.timeMsg));
            this.onScoresChanged();

            if(this.status.timeLeft <= 0) {
                if (autoSaveEvent)
                    clearInterval(autoSaveEvent);
                clearInterval(a);
                this.endGame();
            }
        }, 1000);

        },4000);
    }

    endGame() {
        if (this.status.started == false)
            return;
        this.status.started = false;
        this.loadSave = false;
        this.status.timeLeft = 0;

        console.log("Game ended - " + "Results: ");
        console.log(this.settings.teams[0] + " " + this.status.scores[this.settings.teams[0]] + " vs " + 
            this.status.scores[this.settings.teams[1]] + " " + this.settings.teams[1]);

        this.onScoresChanged();
        setTimeout(() => this.startGame(),10000);
        
    }

    onPlayerKilled(player, killer) {
        killer.health = killer.maxHealth;
        killer.resetGun();
        
        if (this.status.started) {
            player.game.status.scores[killer.team] += 1;
            this.onScoresChanged();
        }
        setTimeout(() => player.respawn(), player.game.settings.respawnDelay);
    }

    onPlayerRespawning(player) {
        var closestPoint = this.navigationPlugin.getClosestPoint(new BABYLON.Vector3(0,0,15));
        var randomSpot = this.navigationPlugin.getRandomPointAround(closestPoint, 60).addInPlaceFromFloats(0,0,0);
        player.position = randomSpot;
    }

    canDealDamage(attacker,victim) {
        return attacker.team && victim.team && attacker.team != victim.team;
    }

    onPlayerConnected(ws) {
        this.server.sendServerMessage(ws,{ settings: this.settings, status: this.status });
        this.server.sendServerMessage(ws,{ action: { name: "ChooseTeam", teams: this.settings.teams } });
        this.players.forEach(p => {
            if (p.name != ws.username)
                this.server.updatePlayerStateForSomeone(ws, p, ["health","maxHealth","team"]);
        });
        if (this.players.length == 2 && this.status.started == false) {
            this.startGame();
        }
    }

    onPlayerMessage(ws,message) {
        if (message.action) {
            switch(message.action.name) {
                case "TeamPicked":
                    var player = this.players.find(p => p.name == ws.username);
                    if (this.settings.teams.includes(message.action.teamName)) {
                        player.team = message.action.teamName;
                        this.server.updatePlayerState(player, ["team"]);
                        console.log(`${player.name} has chosen team ${player.team}`);
                    } else {
                        console.log("Team doesn't exist - " + message.action.teamName);
                        this.server.sendServerMessage(ws,{ action: { name: "ChooseTeam", teams: this.settings.teams } });
                    }
                    break;
                default:
                    console.log("Unknown Action: " + message.action.name + " - from " + ws.username);
                    break;
            }
        }
    }
    
    onScoresChanged() {
        this.server.sendServerMessageToAll({ status: this.status });
    }

    saveGameStateJSONFile(saveName,fileName) {
        var date = new Date();
        var dateISO = date.toISOString();
        var dateFormatted = `${date.getFullYear()}.${("0"+(date.getMonth()+1)).substr(-2)}.${date.getDate()} - ` 
            + `${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}.${date.getMilliseconds()}`;
        var playersInfo = this.players.map(p => {
            return { "name": p.name, "team": p.team, "score": p.score, "position": { x: p.position.x, y: p.position.y, z: p.position.z }, "health": p.health, "maxHealth": p.maxHealth };
        });

        var save = {
            name: saveName ? saveName : this.settings.gamemode+" "+dateFormatted,
            date: dateFormatted,
            settings: this.settings,
            status: this.status,
            players: playersInfo
        }

        if (!fs.existsSync("./saves")) {
            fs.mkdirSync("./saves");
        }

        if (!fs.existsSync("./saves/"+this.settings.gamemode)) {
            fs.mkdirSync("./saves/"+this.settings.gamemode);
        }

        fileName = fileName ? fileName : save.name;

        fs.writeFile(`./saves/${this.settings.gamemode}/${fileName}.json`, JSON.stringify(save), err => {
            if (err) console.log(err);
            console.log(`Saved file: ${fileName}.`);
        });

        
    }

    loadGameStateJSONFile(fileName) {
        fs.readFile(`./saves/${this.settings.gamemode}/${fileName}`,(err,data) => {
            if (err) {
                console.log("Cant access save file: " + fileName + ". Load aborted.");
                return;
            }
            console.log(data);
            var save = JSON.parse(data);
            this.settings = save.settings;
            this.status = save.status;
            save.players.forEach(p => {
                var pl = this.players.find(pl => pl.name == p.name);
                if (pl) {
                    var keys = [];
                    for (const prop in p) {
                        pl[prop] = p[prop];
                        keys.push(prop);
                    }
                    this.server.updatePlayerState(pl,keys);    
                } else {
                    this.playerStates.push(p);
                }
            });
            console.log("Save loaded successfully.");
        });
    }

    loadLastSave() {
        fs.readdir(`./saves/${this.settings.gamemode}`,(err,files) => {
            //console.log("Files: ",files);
            var newest = files.reduce((prev,curr) => {
                return fs.statSync(`./saves/${this.settings.gamemode}/${curr}`).birthtime > prev.date ? { file: curr, date: fs.statSync(`./saves/${this.settings.gamemode}/${curr}`).birthtime } : prev;
            },
            { file: files[0], date: fs.statSync(`./saves/${this.settings.gamemode}/${files[0]}`).birthtime });
            this.loadGameStateJSONFile(newest.file);
        });
    }

    saveGameState() {

        // let db = new sqlite3.Database('./gameServer.db', (err) => {
        //     if (err) {
        //         console.error(err.message);
        //         return;
        //     }
        //     console.log('Connected to the gameServer database. Beginning saving process...');
        //     db.all(`SELECT * FROM saves`,(err,rows) => {
        //         if(err) {
        //             console.log("No such table - servers");
        //             var createTableString = 
        //                 'CREATE TABLE saves (' +
        //                     'id INTEGER PRIMARY KEY,' +
        //                     'date DATETIME NOT NULL,' + 
        //                     'name TEXT NOT NULL,' +
        //                     'mode TEXT NOT NULL,' +
        //                     'scores TEXT NOT NULL' +
        //                 ')';
        //             var createTableString2 = 
        //                 `CREATE TABLE`
        //             var insertServerString = "INSERT INTO servers (name,address,mode,map) VALUES ('TestowyFFA DM','127.0.0.1:7777','FFA Deathmatch','training')";
        //             db.run(createTableString, err => {
        //                 db.run(insertServerString, err => {
        //                     db.all(`SELECT * FROM servers`,(err,rows2) => {
        //                         console.log("Servers: ",rows2);
        //                         resp.json({ message: "Server list granted.", servers: rows2 });
        //                         resp.end();
        //                     });
        //                 });
        //             });
        //         } else {
        //             console.log("Saves: ",rows);
        //             resp.json({ message: "Server list granted.", servers: rows });
        //             resp.end();
        //         }
                
        //     });
            
        // });
    }
}

module.exports = TeamDeathmatch;