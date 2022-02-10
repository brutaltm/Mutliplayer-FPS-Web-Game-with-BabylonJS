/// <reference path='../../lib/babylon.d.ts' />
/// <reference path='../../lib/babylon.gui.d.ts' />
import InputController from '../InputController.js';
import Player from '../Player.js';
import Bot from '../Bot.js';
import PlayerFPS from '../PlayerFPS.js';
import GUI from '../GUI.js';

export default class Survival {

  PLAYER_SPEED = 10;
  scene;
  shot = false;
  advancedTexture;
  total = 1;
  players = [];
  bots = [];
  player;
  materials = [];
  msg = {
    type: null,
    body: {}
  };
  inputController;
  maxBullets = 30;
  canvas;
  camRoot;
  sounds = {};
  crowd = {};
  navigationPlugin = {};
  physicsViewer;
  navMeshes = [];
  status = {};

  constructor(stateM, serverIP, authSessionID) {
    this.stateM = stateM;
    this.serverIP = serverIP;
    this.authSessionID = authSessionID;
  }

  createScene(engine, canvas) {
      // var readies = [false, false, false];
      // this.readies = readies;
      //engine.displayLoadingUI();
      //BABYLON.Engine.CollisionsEpsilon = 0.0001;
      canvas.onclick = () => engine.enterPointerlock();

      this.canvas = canvas;

      var scene = new BABYLON.Scene(engine);
      this.scene = scene;
      scene.skipPointerMovePicking = true
      scene.collisionsEnabled = true;

      var assetsManager = new BABYLON.AssetsManager(scene);
      assetsManager.addMeshTask("TrainingArenaTask", "", "./resources/levels/", "firstLevel.babylon")
      // assetsManager.addMeshTask("TrainingArenaTask", "", "./models/", "mapa_projekt_zespolowy_02_baked.glb")
          .onSuccess = task => this.onArenaLoaded(task.loadedMeshes,task.loadedParticleSystems,task.loadedSkeletons);
      assetsManager.addMeshTask("PlayerModelTask", "", "./resources/models/", "yBot.babylon")//"ybotASD.babylon")
          .onSuccess = task => this.onPlayerModelLoaded(task.loadedMeshes,task.loadedParticleSystems,task.loadedSkeletons);
      assetsManager.addMeshTask("AK47ModelTask", "", "./resources/models/", "ak47.babylon")
          .onSuccess = task => this.onAK47ModelLoaded(task.loadedMeshes,task.loadedParticleSystems,task.loadedSkeletons);
      
      assetsManager.onFinish = tasks => {
          //engine.hideLoadingUI();
          this.player = new PlayerFPS(scene,"playerFPS",this.total, this);
          this.player.position = new BABYLON.Vector3(135,0,35);
          // for (var i=0; i<5; i++) {
          //   this.bots.push(new Bot(scene,"Bocik"+i,this.total, this));
          // }
          
          //this.createTextForPlayer("Bocik",this.bots[0].gracz,scene.getCameraByName("UniversalCamera"),this.advancedTexture,scene);
          console.log(this.bots);
          // this.createAndDownloadNavMesh("mapa_projekt_zespolowyv2_NavMesh",this.navigationPlugin,this.navMeshes);
          //this.doTestowaniaRagdolii(scene);
          //this.createConnection(scene, this.serverIP, this.authSessionID);
          // readies[0] = true;
          // if(readies.every(v => v)) {

          //   engine.stopRenderLoop();
          //   engine.runRenderLoop(() => scene.render());
          // }

          //setTimeout(() => this.createConnection(scene),1000);
          
      } 
      assetsManager.loadAsync();

      this.createSoundsForAk47(scene);

      var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
      var physicsPlugin = new BABYLON.OimoJSPlugin(true);
      scene.enablePhysics(gravityVector, physicsPlugin);
      var physicsEngine = scene.getPhysicsEngine();
      
      const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0,0,-5), scene);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas,true);

      camera.ellipsoid = new BABYLON.Vector3(0.8,0.8,0.8);
      camera.ellipsoidOffset = new BABYLON.Vector3(0,0.1,0.1);
      camera.applyGravity = false;
      camera.checkCollisions = true;
      
      var angToCS = (angular) => 90 * 106.2605 * Math.PI / angular / 10 ;
      var angToVal = (angular) => angToCS(angular*3.18352);
      var csToAng = (cs) => 90 * 106.2605 * Math.PI / cs / 10;
      var valToAng = (val) => csToAng(val*3.1835206);
      console.log(csToAng(0.85), "val", valToAng(0.267));
      console.log(angToCS(3534.641), "val", angToVal(3534.641));
      camera.inertia = 0.0;
      camera.angularSensibility = 2800;
      camera.angularSensibility = 3534.64;
      camera.speed = 2;
      camera.minZ = 0.33;
      camera.fov = 0.59;

      camera.inputs.removeByType("FreeCameraKeyboardMoveInput");

      this.camRoot = new BABYLON.TransformNode("camRoot",scene);

      
      // const ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
      // ground.checkCollisions = true;
      // ground.position.y -= 0.95;
      // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 5 }, scene);

      // this.navMeshes.push(ground);

      // const materialGround = new BABYLON.StandardMaterial("groundMaterial",scene);
      // //materialGround.diffuseColor = new BABYLON.Texture("/assets/textures/grass.jpg", scene);
      // materialGround.diffuseColor = new BABYLON.Color3(0.2,0.2,0.2);
      // materialGround.specularColor = new BABYLON.Color3(0,0,0);

      // ground.material = materialGround;

      
      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(5,5,0), scene);
      light.intensity = 0.2;

      var light3 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1,-2, 0), scene);
      light3.autoUpdateExtends = false;
      light3.position = new BABYLON.Vector3(-10,100,0);
      light3.intensity = 2.0;

      // light3.falloffType = BABYLON.Light.FALLOFF_STANDARD;
      this.light = light3;
      
      const light2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0,15,0), scene);
      light2.intensity = 0.2; 

      this.GUI = new GUI("UI",canvas,engine,camera,this);
      var advancedTexture = this.GUI.advancedTexture;
      this.advancedTexture = advancedTexture;

      this.inputController = new InputController(scene, this);

      var navigationPlugin = new BABYLON.RecastJSPlugin();
      this.navigationPlugin = navigationPlugin;
      setTimeout(() => {
        var readAllBytesAsUInt8Array = async function(path) {
            let response = await fetch(path);
            let data = await response.arrayBuffer();

            return new Uint8Array(data);
        }
        readAllBytesAsUInt8Array("resources/levels/firstLevel_NavMesh.bin").then(d => {
            console.log("Array: ",d);
            navigationPlugin.buildFromNavmeshData(d);
            // var navmeshdebug = navigationPlugin.createDebugNavMesh(scene);
            // navmeshdebug.position = new BABYLON.Vector3(0, -0.1, 0);
            // navmeshdebug.isPickable = false;
    
            // var matdebug = new BABYLON.StandardMaterial('matdebug', scene);
            // matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
            // matdebug.alpha = 0.2;
            // navmeshdebug.material = matdebug;
        });
      },100);
      

      return scene;
  }

  createAndDownloadNavMesh(name, navigationPlugin, meshes) {
    var navmeshParameters = {
      cs: 0.5,
      ch: 0.1,
      walkableSlopeAngle: 70,
      walkableHeight: 40.0,
      walkableClimb: 10.0,
      walkableRadius: 0.01,
      maxEdgeLen: 6.,
      maxSimplificationError: 0.01,
      minRegionArea: 1,
      mergeRegionArea: 5, 
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 0.1,
      borderSize: 1,
      tileSize:1
      };

    navigationPlugin.createNavMesh(meshes, navmeshParameters);
    console.log("NavMesh: ",navigationPlugin.navMesh);
    //navigationPlugin.navMesh.position.addInPlaceFromFloats(0,-0.5,0);
    var binaryData = navigationPlugin.getNavmeshData();

    var navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
    navmeshdebug.position = new BABYLON.Vector3(0, -0.1, 0);
    navmeshdebug.isPickable = false;

    var matdebug = new BABYLON.StandardMaterial('matdebug', this.scene);
    matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
    matdebug.alpha = 0.2;
    navmeshdebug.material = matdebug;
    navmeshdebug.isVisible = false;

    

    var downloadBlob, downloadURL;

    downloadBlob = function(data, fileName, mimeType) {
      var blob, url;
      blob = new Blob([data], {
        type: mimeType
      });
      url = window.URL.createObjectURL(blob);
      downloadURL(url, fileName);
      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 1000);
    };

    downloadURL = function(data, fileName) {
      var a;
      a = document.createElement('a');
      a.href = data;
      a.download = fileName;
      document.body.appendChild(a);
      a.style = 'display: none';
      a.click();
      a.remove();
    };

    console.log("Created");

    downloadBlob(binaryData, name+'.bin', 'application/octet-stream');
  }

  onPlayerModelLoaded(newMeshes, particleSystems, skeletons) {
      var skeleton = skeletons[0];
  
      console.log(skeleton);
      console.log("Imported: ",newMeshes);

      //var verticeStart = []
      //var verticeCount = []
      var curVertex = 0
      var bodyparts = [];
      newMeshes.forEach(mesh => {
        //mesh.getIndices();
        //verticeStart.push(curVertex);
        var count = mesh.getTotalVertices();
        //verticeCount.push(count);
        bodyparts.push({ name: mesh.name, verticeStart: curVertex, verticeCount: count });
        curVertex+=count;
      })
  
      var newMesh = BABYLON.Mesh.MergeMeshes(newMeshes,true,true);
      newMesh.name = "PlayerModel";
      console.log("NewMesh: ",newMesh);
      newMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
      newMesh.skeleton = skeleton;
      newMesh.showBoundingBox = false;
      newMesh.bodyparts = bodyparts;
      console.log("Body parts: ",bodyparts);
      newMesh.isVisible = false;
      newMesh.isPickable = false;

      // let config = [{ bones: ["mixamorig:Hips"], size: 0.2, boxOffset: 0.05},
      //   {bones: ["mixamorig:Spine1"], size: 0.2, boxOffset: 0.1, min: -10, max: 10},
      //   // Arms.
      //   { bones: ["mixamorig:RightArm"], size: 0.1, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Z, min: -45, max: 80, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
      //   { bones: ["mixamorig:LeftArm"], size: 0.1, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Z, min: -45, max: 80, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
      //   // Forearms.
      //   { bones: ["mixamorig:RightForeArm"], size: 0.10, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Y, min: -30, max: 30, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
      //   { bones: ["mixamorig:LeftForeArm"], size: 0.10, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Y, min: -30, max: 30, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
      //   // Thighs, shins and feet.
      //   { bones: ["mixamorig:RightUpLeg", "mixamorig:LeftUpLeg"], size: 0.15, height: 0.25, rotationAxis: BABYLON.Axis.Z, min: -40, max: 10, boxOffset: 0.20},
      //   { bones: ["mixamorig:RightLeg", "mixamorig:LeftLeg"], size: 0.15, height: 0.25, min: -80, max: 0, boxOffset: 0.15},
      //   { bones: ["mixamorig:RightFoot", "mixamorig:LeftFoot"], size: 0.15, min: 1, max: 1}, // min = 1 & max = 1 will make the boxes stand still - like a lock joint. 
      //   { bones: ["mixamorig:Head"], size: 0.25, width: 0.20, height: 0.3, depth: 0.3, boxOffset: 0.10, min: -30, max: 10}
      // ];
  
      // const jointCollisions = false;
      // const showBoxes = false;
      // const mainPivotSphereSize = 0;
      // const disableBoxBoneSync = false;
      
      // var ragdoll = new Ragdoll(skeleton, newMesh, config, jointCollisions, showBoxes, mainPivotSphereSize, disableBoxBoneSync);
      // ragdoll.init();
      // ragdoll.boxes.forEach(b => {
      //   b.physicsImpostor.friction = 1;
      //   b.isPickable = false;
      // });
  
      // newMesh.ragdoll = ragdoll;
      // console.log(ragdoll);
  
      BABYLON.Animation.AllowMatricesInterpolation = true;
      skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
      skeleton.animationPropertiesOverride.enableBlending = true;
      skeleton.animationPropertiesOverride.blendingSpeed = 0.05;
      skeleton.animationPropertiesOverride.loopMode = BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;
  }

  onAK47ModelLoaded(newMeshes, particleSystems, skeletons) {
      console.log("AK47Meshes: ", newMeshes);
      var index = newMeshes.findIndex(m => m.name == "bm_magazine_low");
      var magazine = newMeshes[index];
      newMeshes.splice(index,1);
      var index2 = newMeshes.findIndex(m => m.name == "bm_magazineBottom_low");
      var magazineBottom = newMeshes[index2];
      newMeshes.splice(index2,1);

      var magazineMerged = BABYLON.Mesh.MergeMeshes([magazine,magazineBottom]);
      magazineMerged.name = "bm_magazine_low";
      magazineMerged.isPickable = false;
      
      var newMesh = BABYLON.Mesh.MergeMeshes(newMeshes);
      newMesh.name = "AK47";
      newMesh.showBoundingBox = false;

      newMesh.isVisible = false;
      newMesh.isPickable = false;

      magazineMerged.isVisible = false;
      magazineMerged.isPickable = false;

      magazineMerged.setParent(newMesh);
      //newMesh.magazine = magazine;
      console.log("AK47: ",newMesh);
  }

  onArenaLoaded(newMeshes, particleSystems, skeletons) {
    console.log("Arena: ",newMeshes);
    newMeshes.forEach(m =>{
      //console.log("Mesh: ",m.getIndices());
      m.isPickable = true;
      m.checkCollisions = true;
      //m.showBoundingBox = true;
      m.position.addInPlaceFromFloats(0,-3,0);
      if (m.name.startsWith("Ground")) {
        m.showBoundingBox = false;
        // m.physicsImpostor = new BABYLON.PhysicsImpostor(m, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);
      }
    });

    console.log("JebaĆ Disa: ");
    this.createShadowGenerator(this.light,newMeshes);

    // newMeshes.find(m => m.name == "WallWithWindow").material.backFaceCulling = false;
    // newMeshes.find(m => m.name == "WallWithWindow.001").material.backFaceCulling = false;
    var water = newMeshes.find(m => m.name == "Water");
    water.checkCollisions = false;
    water.isPickable = false;

    //var ground = newMeshes.find(m => m.name == "Ground");
    //ground.checkCollisions = false;
    // var arena = newMeshes.find(e => e.name == "Arena");
    // var spawn = newMeshes.find(e => e.name == "Spawn");
    // var ramp = newMeshes.find(e => e.name == "Ramp");
    // var ramps = newMeshes.filter(m => m.name.includes("Ramp"));
    // var spawn_boundary = newMeshes.find(e => e.name == "Spawn Boundary");
    // spawn_boundary.isVisible = false;
    // spawn_boundary.isPickable = false;
    // spawn_boundary.checkCollisions = false;
    //this.navMeshes.push(arena,spawn, ramp);
    //this.navMeshes.push(spawn, spawn_boundary, arena, ...ramps);
    this.navMeshes.push(...newMeshes);
    this.navMeshes.splice(this.navMeshes.findIndex(m => m.name.startsWith("Water")),1);
    //this.createAndDownloadNavMesh("mapa_projekt_zespolowyv4_NavMesh",this.navigationPlugin,this.navMeshes);
    
    console.log("TUTAJ");
    //arena.physicsImpostor = new BABYLON.PhysicsImpostor(arena, BABYLON.PhysicsImpostor.CylinderImpostor , { mass: 0, restitution: 0.9, friction: 5 }, scene);
    //spawn.physicsImpostor = new BABYLON.PhysicsImpostor(spawn, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 5 }, scene);
  }

  createSoundsForAk47(scene) {
      this.sounds.ak47_shot = new BABYLON.Sound("AK47_shot", "./resources/sfx/ak47_shot.mp3", scene, null, {
          loop: false,
          autoplay: false,
          volume: 0.1
      });

      this.sounds.ak47_reload = new BABYLON.Sound("AK47_reload", "./resources/sfx/galil_reload.mp3", scene, null, {
          loop: false,
          autoplay: false,
          volume: 0.1,
          playbackRate: 1
      });
  }

  addBot() {
    
    var respawnPoint = this.navigationPlugin.getClosestPoint(new BABYLON.Vector3(-8,3,-24));
    var randomSpawn = this.navigationPlugin.getRandomPointAround(respawnPoint, 20);

    this.bots.push(new Bot(this.scene, "Bocik"+this.bots.length+1, this.total, this, randomSpawn));
    this.GUI.editTeamScoreControl("Enemies",this.bots.length);

    this.bots[this.bots.length-1].moveRandomlyTowardsPosition(new BABYLON.Vector3(140,0,0), 5, 20);
    //this.bots[this.bots.length-1].moveToPosition(new BABYLON.Vector3(140,0.1,-90+Math.random(60)));

    //this.GUI.pushMessage("TRAINING","Bot added - Total: " + this.bots.length, {color: "red", outlineWidth: 1, fontWeight: "bold"});
  }

  removeBot() {
    this.bots.shift().dispose();
    this.GUI.editTeamScoreControl("Enemies",this.bots.length);
    //this.GUI.pushMessage("TRAINING","Bot removed - Total: " + this.bots.length, {color: "red", outlineWidth: 1, fontWeight: "bold"});
  }

  doTestowaniaRagdolii(scene) {
      this.total++;
      BABYLON.SceneLoader.ImportMesh("", "./models/", "ybotASD.babylon", scene, function (newMeshes, particleSystems, skeletons) {
  
        var skeleton = skeletons[0];
      
        newMeshes.forEach(m => {
          m.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
          //m.skeleton = skeleton;
          //m.position.addInPlaceFromFloats(0,0,-5);
        });
  
        newMeshes.forEach(m => {
          m.scaling = new BABYLON.Vector3(1.0, 1.0, 1.0);
        });
  
        var newMesh = BABYLON.Mesh.MergeMeshes(newMeshes,true,true);
        console.log("NewMesh: ",newMesh);
        newMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        //newMesh.scaling = new BABYLON.Vector3(1.0, 1.0, 1.0);
        newMesh.skeleton = skeleton;
        
        //newMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        newMesh.position.addInPlaceFromFloats(-15,-0.8,-5);
        newMesh.showBoundingBox = true;
  
        var walkRange = skeleton.getAnimationRange("StrafeLeft");
        scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 1, true);
  
        let config = [{ bones: ["mixamorig:Hips"], size: 0.2, boxOffset: 0.05},
          {bones: ["mixamorig:Spine1"], size: 0.2, boxOffset: 0.1, min: -10, max: 10},
          // Arms.
          { bones: ["mixamorig:RightArm"], size: 0.1, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Z, min: -45, max: 80, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
          { bones: ["mixamorig:LeftArm"], size: 0.1, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Z, min: -45, max: 80, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
          // Forearms.
          { bones: ["mixamorig:RightForeArm"], size: 0.10, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Y, min: -30, max: 30, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
          { bones: ["mixamorig:LeftForeArm"], size: 0.10, width: 0.25, depth: 0.2, rotationAxis: BABYLON.Axis.Y, min: -30, max: 30, boxOffset: 0.15, boneOffsetAxis: BABYLON.Axis.Y},
          // Thighs, shins and feet.
          { bones: ["mixamorig:RightUpLeg", "mixamorig:LeftUpLeg"], size: 0.15, height: 0.25, rotationAxis: BABYLON.Axis.Z, min: -40, max: 10, boxOffset: 0.20},
          { bones: ["mixamorig:RightLeg", "mixamorig:LeftLeg"], size: 0.15, height: 0.25, min: -80, max: 0, boxOffset: 0.15},
          { bones: ["mixamorig:RightFoot", "mixamorig:LeftFoot"], size: 0.15, min: 1, max: 1}, // min = 1 & max = 1 will make the boxes stand still - like a lock joint. 
          { bones: ["mixamorig:Head"], size: 0.25, width: 0.20, height: 0.3, depth: 0.3, boxOffset: 0.10, min: -30, max: 10}];
  
        const jointCollisions = false;
        const showBoxes = true;
        const mainPivotSphereSize = 0;
        const disableBoxBoneSync = false;
        
        var ragdoll = new Ragdoll(skeleton, newMesh, config, jointCollisions, showBoxes, mainPivotSphereSize, disableBoxBoneSync);
        ragdoll.init();
        ragdoll.boxes.forEach(b => {
          b.physicsImpostor.friction = 1;
          b.isPickable = false;
        });
  
        //BABYLON.Mesh.CreateBox().locallyTranslate(new BABYLON.Vector3(0,0,0.1));
        newMesh.ragdoll = ragdoll;
        console.log(ragdoll);
  
        setInterval(() => {
          //scene.stopAnimation(skeleton);
          //ragdoll.ragdoll();
          setTimeout(() => {
            ragdoll.ragdollOff();
            newMesh.position.addInPlaceFromFloats(-15,-0.8,-5);
            //scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 1, true);
          },1500);
        }, 5500 + Math.random()*1000);
      });
  }

  onTeamPicked(team) {
    if (this.player.team)
      this.GUI.editTeamScoreControl(this.player.team,this.status.scores[this.player.team],{ /*background: "",*/ isHighlighted: false }, { outlineWidth: 0, color: "white" }, { outlineWidth: 0, color: "white" });
    if (this.player.team != team) 
      this.player._team = team;
    //this.msg.body.action = { name: "TeamPicked", teamName: team };
    this.GUI.editTeamScoreControl(team,this.status.scores[team],{ /*background: "green",*/ isHighlighted: true }, { outlineWidth: 2, color: "gold" }, { outlineWidth: 2, color: "gold" });
  }

  onPlayerChangedTeam(player,team) {
    //if (player.team == team) return;
    var scoreRect = this.GUI.teamScoreRects.find(r => r.name == team);
    if (!scoreRect) {
      setTimeout(() => this.onPlayerChangedTeam(player,team), 100);
      return;
    }
    var color = scoreRect.background;
    console.log("Zmiana teamu: ",player.models[0],color);
    //player.models[0].material.diffuseColor = BABYLON.Color3[color[0].toUpperCase() + color.substring(1)]();
    //player.models[0].material._albedoColor.r = 0;
    var mat = this.materials.find(m => m.name == "Material"+color);
    console.log("Materials: ",this.materials);
    if (mat) {
      player.models[0].material = mat;
    }
    else {
      var material = player.models[0].material.clone("Material" + color);
      material._albedoColor = BABYLON.Color3[color[0].toUpperCase() + color.substring(1)]();
      player.models[0].material = material;
      this.materials.push(material);
    }

    if (player == this.player) {
      console.log("Player == This.Player", player.team, team);
      if (this.onTeamPicked)
        this.onTeamPicked(team);
    } else {
      console.log("Przypisanie teamu " + team + " do " + player.name);
      player._team = team;
    }
    
  }

  createConnection(scene, serverIP, authSessionID) {
    const MESSAGE_ENUM = Object.freeze({
        SELF_CONNECTED: "SELF_CONNECTED",
        CLIENT_CONNECTED: "CLIENT_CONNECTED",
        CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
        CLIENT_MESSAGE: "CLIENT_MESSAGE",
        SERVER_MESSAGE: "SERVER_MESSAGE",
        AUTH_MESSAGE: "AUTH_MESSAGE"
      })
      var username = "";
      var loop;
      //const ws = new WebSocket("ws://127.0.0.1:7777/ws");
      const ws = new WebSocket(`ws://${serverIP}/ws`);
      this.ws = ws;
      ws.onopen = evt => {
        this.msg.type = MESSAGE_ENUM.AUTH_MESSAGE;
        this.msg.body = { sessionID: authSessionID }
        ws.send(JSON.stringify(this.msg));
      };
        ws.onmessage = evt => {
          let msg = JSON.parse(evt.data);
          switch (msg.type) {
            case MESSAGE_ENUM.AUTH_MESSAGE:
              break;
            case MESSAGE_ENUM.CLIENT_MESSAGE:
              if (username != "" && username != msg.sender) {
                  //console.log(username +" vs "+ msg.sender);
                  //console.log(`${msg.sender} says: ${msg.body.message}`);
                  if (scene.getMeshByName(msg.sender) == null) {
                    // var gracz = BABYLON.MeshBuilder.CreateSphere(msg.sender,{
                    //   segments: 32,
                    //   diameter: 1,
                    // },scene);
                    // var gracz = BABYLON.MeshBuilder.CreateBox(msg.sender,{
                    //   size: 3
                    // },scene);

                    // var gracz = this.clonePlayerModel2(scene, msg.sender);
                    var gracz = new Player(scene, msg.sender, this.total, this);
                    this.players.push(gracz);

                    this.GUI.createTextForMesh(msg.sender,1.8,gracz.gracz,scene.getCameraByName("UniversalCamera"),scene);
                  } else {
                    // var gracz = scene.getMeshByName(msg.sender);
                    var gracz = this.players.find((e) => e.name == msg.sender);
                    //var gracz = this.players[0];
                    //console.log(gracz);
                  }
                  //console.log(msg.body.x,msg.body.y,msg.body.z);
                  
                  if (msg.body.rotation) {
                    // console.log("Rotacja Y: ",
                    // BABYLON.Tools.ToDegrees(Math.PI + msg.body.rotation._y));
                    //this.updateRotationOfPlayer(scene.getMeshByName(msg.sender), msg.body.rotation);
                    gracz.updateRotationOfPlayer(msg.body.rotation);
                  }

                    if (gracz != undefined && msg.body.position) 
                      gracz.applyMovement(msg.body.position);
                    //else
                     //console.log("JD");
                  // }

                  if (msg.body.shot) {
                    //gracz.shoot();
                    gracz.playShootingAnim();
                    gracz.placeBulletHole(new BABYLON.Ray(msg.body.shot.position,msg.body.shot.direction,100));
                    gracz.weapon.bullets--;
                  }

                  if (msg.body.reload != null && msg.body.reload == true) {
                    console.log("Reload received");
                    if (!gracz.weapon.reloading) {
                      gracz.reload();
                      msg.body.reload = false;
                    }
                      
                      
                  }

                  if (msg.body.message) {
                    if (!gracz.team) {
                      this.GUI.pushMessage(msg.sender,msg.body.message, {color: "gray"});
                      console.log(gracz.name + " nie ma teamu " + gracz.team);
                    } else {
                      console.log(gracz.name + " ma team " + gracz.team);
                      var color = this.GUI.teamScoreRects.find(r => r.name == gracz.team).background;
                      this.GUI.pushMessage(msg.sender,msg.body.message,{ color: color, outlineWidth: 0 });
                    }
                    
                      //this.GUI.teamScoreRects.find(r => r.childr) gracz.team);
                  }

                  // if (msg.body.playerState) {
                  //   var player = username == msg.body.playerState.name ? this.player : this.players.find(p => p.name == msg.body.playerState.name);
                  //   if (msg.body.playerState.killer) {
                  //     var imposter = player.models[0].ragdoll.boxes.find(b => b.name == msg.body.playerState.imposter).physicsImpostor;
                  //     player.kill(imposter,mgs.body.playerState.direction,msg.body.playerState.point);
                  //   }
                  // }
                    
                  //gracz.position = new BABYLON.Vector3(msg.body.x,msg.body.y-1.5,msg.body.z);
                  
                  // console.log("New: ", gracz.position);
                  
                  //scene.getMeshByName("AK47_2").position = new BABYLON.Vector3(msg.body.x,msg.body.y,msg.body.z);
                  if (msg.body.hitMesh) {
                    console.log("Server: Mesh that got hit: " + msg.body.hitMesh);
                    if (msg.body.hitMesh == username) {
                      const you = scene.getCameraByName("UniversalCamera");
                      you.position = new BABYLON.Vector3(0,2,0);
                    }
                  }
                }
              
              break;
            case MESSAGE_ENUM.SERVER_MESSAGE:
              //console.log("ASDA SDASD ASDASDAS  DADS",msg.body);
              if (msg.body.event) {
                switch(msg.body.event.name) {
                  case "Kill":
                    var player = username == msg.body.event.victim ? this.player : this.players.find(p => p.name == msg.body.event.victim);
                    var imposter = player.models[0].ragdoll.boxes.find(b => b.name == msg.body.event.imposter).physicsImpostor;
                    var direction = new BABYLON.Vector3(msg.body.event.direction._x,msg.body.event.direction._y,msg.body.event.direction._z);
                    var point = new BABYLON.Vector3(msg.body.event.point._x,msg.body.event.point._y,msg.body.event.point._z);
                    player.kill(imposter,direction,point);
                    break;
                  case "Respawn":
                    var player = username == msg.body.event.victim ? this.player : this.players.find(p => p.name == msg.body.event.victim);
                    if (msg.body.event.position) player.respawn(msg.body.event.position);
                    else player.respawn();
                  default:
                    console.log("Unknown event " + msg.body.event.name);
                    break;
                }
              }
              if (msg.body.settings) {
                if (this.settings) {
                  this.settings.teams.forEach(t => {
                      this.GUI.removeTeamScoreControl(t);
                  });
                }
                this.GUI.colors = this.GUI.colorsNoEdit.slice();
                this.settings = msg.body.settings;
                this.settings.teams.forEach(t => {
                  this.GUI.addTeamScoreControl(t,0,{ background: this.GUI.color });
                  if (t == this.player.team)
                    this.GUI.editTeamScoreControl(t,0,{ /*background: "green",*/ isHighlighted: true }, { outlineWidth: 2, color: "gold" }, { outlineWidth: 2, color: "gold" });
                });
              }
              if (msg.body.playerState) {
                console.log("PlayerStateChange: ",msg.body.playerState);
                console.log("Player state change for "+msg.body.playerState.name);
                var player = username == msg.body.playerState.name ? this.player : this.players.find(p => p.name == msg.body.playerState.name);
                if (!player) {
                    console.log("mój nick: ",username,"vs",msg.body.playerState.name);
                    player = new Player(scene, msg.body.playerState.name, this.total, this);
                    this.players.push(player);
                    this.GUI.createTextForMesh(msg.body.playerState.name,1.8,player.gracz,scene.getCameraByName("UniversalCamera"),scene);
                }
                var keys = [];
                for (const property in msg.body.playerState) { // kocham javascripta #2
                  if (typeof(player[property]) == "object" && property != "position") {
                    console.log("Iteruje bo jest objectem: ", property, player[property].constructor.name.toLowerCase());
                    for(const prop in msg.body.playerState[property]) {
                      player[property][prop] = msg.body.playerState[property][prop];
                    }
                  } else {
                    if (property == "team")
                        console.log(player.name + " team na " + msg.body.playerState[property]);
                    player[property] = msg.body.playerState[property];
                  }
                  keys.push(property);
                }
                //player.onUpdate(Object.keys(msg.body.playerState));
                player.onUpdate(keys);
              }
              if (msg.body.status) {
                this.status = msg.body.status;
                console.log("Status update:",msg.body.status);
                this.GUI.updateTime(msg.body.status.timeLeft);
                for(const prop in this.status.scores) {
                  this.GUI.editTeamScoreControl(prop,this.status.scores[prop]);
                }
                
              }
              if (msg.body.action) {
                switch(msg.body.action.name) {
                  case "ChooseTeam":
                    this.GUI.openTeamPickMenu(msg.body.action.teams);
                    break;
                  default:
                    break;
                }
              }
              break;
            case MESSAGE_ENUM.CLIENT_CONNECTED:
              //console.log(`${msg.body.name} has joined the chat.`);
              if (username != msg.body.name)
                this.GUI.pushMessage("SERVER",`${msg.body.name} has connected.`, {color: "red", outlineWidth: 1, fontWeight: "bold"}, {color: "green", outlineWidth: 1});
              //if (username == msg.body.name) break;
              break;
            case MESSAGE_ENUM.CLIENT_DISCONNECTED:
              console.log(`${msg.body.name} has left the chat.`);
              var player = this.players.find(p => p.name == msg.body.name);
              this.players.splice(this.players.indexOf(player),1);
              this.GUI.pushMessage("SERVER",`${player.name} has disconnected.`, {color: "red", outlineWidth: 1, fontWeight: "bold"}, {color: "red", outlineWidth: 1});
              player.dispose();
              // if (scene.getMeshByName(msg.body.name) != null)
              //   scene.getMeshByName(msg.body.name).dispose();
              break;
            case MESSAGE_ENUM.SELF_CONNECTED:
              console.log(`You are connected! Your username is ${msg.body.name}`);
              username = msg.body.name;
              const you = scene.getCameraByName("UniversalCamera");
              
              loop = setInterval(() => {
                  this.msg.type = MESSAGE_ENUM.CLIENT_MESSAGE;
                  //this.msg.body.message =  "wiadomość";
                  if (this.player.isAlive())
                    this.msg.body.position = { x: you.position.x, y: you.position.y - 1.6, z: you.position.z };
                  this.msg.body.rotation = you.rotation;

                ws.send(JSON.stringify(this.msg));
                if (this.msg.body.shot) {
                  //console.log("Strzeliłeś: " + you.getDirection(BABYLON.Vector3.Forward()));
                  //console.log("Strzeliłeś: " + you.rotation);
                  this.msg.body.shot = null;
                }
                this.msg.body.reload = null;
                this.msg.body.message = null;
                this.msg.body = {};     
                
              }, 16);
              break;
            default:
              console.log("Unknown message type.");
          }
        }
      ws.onclose = evt => {
        console.log("Connection closed");
        ws.onopen = null;
        clearInterval(loop);
        this.players.forEach(p => p.dispose());
        this.players.length = 0;
        
      }
      
  }

  setUpTraining() {
    // setTimeout(() => {
    if (this.settings) {
      this.settings.teams.forEach(t => this.GUI.removeTeamScoreControl(t));
      this.settings.teams.length = 0;
    }
    this.bots.forEach(bot => {
      if (bot.health > 0 && bot.tempBox == null) {
        bot.desiredLocations.length = 0;
        bot.kill(bot.models[0].ragdoll.boxes.find(b => b.name == "mixamorig:Head_box"),new BABYLON.Vector3(1,1,1),bot.gracz.position.clone());
      }
        
    });
    for (var i=this.bots.length; i<10; i++) {
      this.addBot();
    }

    this.status.timeLeft = 0;
    this.status.scores = {};
    this.status.scores["You"] = 0;
    // for (var i=0; i<10; i++) {
    //   this.bots.push(new Bot(this.scene,"Bocik"+i,this.total, this));
    // }
    this.GUI.pushMessage("TRAINING","You are playing Survival Mode.", {color: "red", outlineWidth: 1, fontWeight: "bold"});
    this.GUI.pushMessage("TRAINING","K - Add Bot, L - Remove Bot, M - Faster, N - Slower", {color: "red", outlineWidth: 1, fontWeight: "bold"});
    this.timeInterval = setInterval(() => this.GUI.updateTime(this.status.timeLeft++),1000);
    this.GUI.addTeamScoreControl("You",0,{ background: "green", isHighlighted: true }, { outlineWidth: 2, color: "gold" }, { outlineWidth: 2, color: "gold" });
    this.GUI.addTeamScoreControl("Enemies",this.bots.length,{ background: this.GUI.color });
    // },5000);
  }

  createShadowGenerator(light,meshes) {
    var shadowGenerator = new BABYLON.ShadowGenerator(2048, light);
    //var shadowGenerator = new BABYLON.CascadedShadowGenerator(2048, light);
    
    // const shadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light);
    
    // shadowGenerator.usePercentageCloserFiltering = true;
    // shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
    // shadowGenerator.stabilizeCascades = true;
    //shadowGenerator.useExponentialShadowMap = true;
    //shadowGenerator.usePoissonSampling = true;
    shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator = shadowGenerator;
    console.log("TUTAJ JESTEM???SDAS?DAS: ", shadowGenerator);
    // meshes.forEach(m => {
    //   shadowGenerator.addShadowCaster(m);
    //   m.receiveShadows = true;
    //   console.log("M: ",m);
    // });
    meshes.forEach(m => { 
      if (m.name.startsWith("Ground")) {
        m.receiveShadows = true;
      } else if (!m.name.startsWith("Water")) {
        m.receiveShadows = true;
        shadowGenerator.addShadowCaster(m);
      }
    });
	console.log("Player:",this.player);
  }

  spawnTempBox(bot, offsetY, pos) {
    bot.tempBox = BABYLON.MeshBuilder.CreateBox("temp",{ width: 15, height: 0.1, depth: 15}, this.scene);
    bot.tempBox.position = pos ? pos.clone() : bot.gracz.position.clone();
    bot.tempBox.isVisible = false;
	  bot.tempBox.isPickable = false;
    bot.tempBox.position.y -= offsetY;
    bot.tempBox.physicsImpostor = new BABYLON.PhysicsImpostor(bot.tempBox,BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 5 }, this.scene);
  }

  onBotKilled(bot) {
    this.spawnTempBox(bot,0.25);
    this.status.scores["You"] += 1;
    this.GUI.editTeamScoreControl("You",this.status.scores["You"]);
  }

  onPlayerFPSKilled(player) {
    this.spawnTempBox(player,0.2, player.gracz.getAbsolutePosition());
    clearInterval(this.timeInterval);
    this.GUI.showRespawnMenu();
    // this.status.scores["You"] -= 1;
    // this.GUI.editTeamScoreControl("You",this.status.scores["You"]);
  }

  onBotRespawn(bot) {
    var physicsEngine = this.scene.getPhysicsEngine();
    physicsEngine.removeImpostor(bot.tempBox.physicsImpostor);
    bot.tempBox.physicsImpostor.dispose();
    bot.tempBox.physicsImpostor = null;
    bot.tempBox.dispose();
    bot.tempBox = null;
    var respawnPoint = this.navigationPlugin.getClosestPoint(new BABYLON.Vector3(-8,3,-24));
    var randomSpawn = this.navigationPlugin.getRandomPointAround(respawnPoint, 20);
    bot.desiredLocations.length = 0;
    bot.position = randomSpawn.clone();
    //bot.moveToPosition(this.game.navigationPlugin.getRandomPointAround(b.gracz.position, 60));

    // console.log("Closest: ",this.navigationPlugin.getClosestPoint(140,0.1,-90+Math.random(60)));
    // console.log("Move Along: ",this.navigationPlugin.moveAlong(bot.position,this.navigationPlugin.getClosestPoint(140,0.1,-90+Math.random(60))));
    //bot.moveToPosition(new BABYLON.Vector3(140,0.1,-90+Math.random(60)));
    bot.moveRandomlyTowardsPosition(new BABYLON.Vector3(140,0,0), 5, 20);
  }

  onBotNowhereToGo(bot) {
    this.player.dealDamage(10,this.player.models[0].ragdoll.boxes.find(b => b.name == "mixamorig:Head_box"),new BABYLON.Vector3(0,1,0).scale(1),this.player.models[0].getAbsolutePosition().clone());
    bot.kill(bot.models[0].ragdoll.boxes.find(b => b.name == "mixamorig:Head_box"),new BABYLON.Vector3(1,1,1),bot.gracz.position.clone());
    this.status.scores["You"] -= 1;
    this.GUI.editTeamScoreControl("You",this.status.scores["You"]);
    this.player.onUpdate(["health"]);
  }

}