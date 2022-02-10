export default class Player {

    scene;
    game;
    gracz;
    ak47;
    skeleton;
    models = [];
    animIdle;
    animRight;
    animLeft;
    animForward;
    animBack;
    animShoot;
    animReload;
    shootingInfo;
    weapon;
    bullets = [];
    x = 0;
    bulletMat;
    boneAxesViewer;
    boneLeftForeArm;
    boneRightForeArm;
    lookAtCtl;
    lookAtCtrls = [];
    lookAtTarget = new BABYLON.TransformNode("ASD");
    particleSystem;
    xRot = 0;
    walking = false;
    ak47_shot_sound;
    ak47_reload_sound;
    get position() { return this.gracz.position; }
    set position(pos) { this.moveTo(pos); }

    rightSpeed = 0;
    forwardSpeed = 0;

    health = 100;
    maxHealth = 100;
    impulseStrength = 10;

    _team;
    get team() { return this._team; }
    set team(t) {
      //this._team = t;
      if (this.game.onPlayerChangedTeam) {
        this.game.onPlayerChangedTeam(this,t);
      } else {
        this._team = t;
      }
    }
    nameplate;

    movement = { forward: 0, fAxis: 0, right: 0, rAxis: 0 };

    constructor(scene, name, total, game) {
      this.scene = scene;
      this.game = game;
      this.gracz = this.clonePlayerModel(scene, name, total);
      var skeleton = this.gracz.getChildren()[0].skeleton;
      this.skeleton = skeleton;
      this.name = name;

      var strafeLeftRange = this.skeleton.getAnimationRange("StrafeLeft");
      var strafeRightRange = this.skeleton.getAnimationRange("StrafeRight");
      var RunRange = this.skeleton.getAnimationRange("Run");
      var RunBackRange = this.skeleton.getAnimationRange("RunBack");
      var IdleAimRange = this.skeleton.getAnimationRange("AimingIdle");
      console.log(this.skeleton.getAnimationRanges());
      var shootRange = this.skeleton.getAnimationRange("Fire");
      //BABYLON.Skeleton.MakeAnimationAdditive(skeleton,IdleAimRange.from,"Fire");
      var ReloadRange = this.skeleton.getAnimationRange("Reloading");
      // scene.beginAnimation(skeleton, IdleAimRange.from, IdleAimRange.to, false, 1.0, () => {
      //   this.skeleton.setCurrentPoseAsRest();
      // });

      this.animIdle = scene.beginWeightedAnimation(skeleton, IdleAimRange.from, IdleAimRange.to, 1, true, 1);
      //this.animIdle.isAdditive = true;
      this.animLeft = scene.beginWeightedAnimation(skeleton, strafeLeftRange.from, strafeLeftRange.to, 0, true, 1.0);
      this.animRight = scene.beginWeightedAnimation(skeleton, strafeRightRange.from, strafeRightRange.to, 0, true, 1.0);
      this.animForward = scene.beginWeightedAnimation(skeleton, RunRange.from, RunRange.to, 0, true, 1.0);
      this.animBack = scene.beginWeightedAnimation(skeleton, RunBackRange.from, RunBackRange.to, 0, true, 1.0);
      this.animShoot = scene.beginWeightedAnimation(skeleton, shootRange.from, shootRange.to, 0, true, 3.0);
      this.animShoot.onAnimationLoopObservable.add(() => {
        //this.animShoot.pause();
        //this.skeleton.returnToRest();
        //console.log("asdJD");
        this.animShoot.pause();
        this.animIdle.weight = 1;
        //this.animShoot.weight = 0;
        this.particleSystem.stop();
        this.shootingInfo.animPlaying = false;
        //this.animShoot.weight = 0;

      });
      //skeleton.setCurrentPoseAsRest();
      //this.animReload = scene.beginWeightedAnimation(skeleton, ReloadRange.from, ReloadRange.to, 0, true, 1.0);
      this.shootingInfo = {
        lastBulletFired: 0,
        firing: false,
        animPlaying: false,
      };

      this.anims = [];
      this.anims.push(this.animIdle,
        this.animRight,
        this.animLeft,
        this.animForward,
        this.animBack,
        this.animShoot,
        //this.animReload
        );

      var fireRatePerMin = 600;

      this.weapon = {
        name: "Kałaszek",
        bulletsReserve: 900,//90,
        bulletsMagazine: 30,
        bullets: 30,
        fireRatePerMin: 600,
        betweenShots: 60 * 1000 / fireRatePerMin,
        damage: 30,
        reloading: false
      }

      this.bulletMat = new BABYLON.StandardMaterial("bulletMat",scene);
      // this.bulletMat.diffuseColor = new BABYLON.Color3(1,0,0);
      this.bulletMat.diffuseTexture = new BABYLON.Texture("resources/textures/bulletHole.png",scene);
      this.bulletMat.diffuseTexture.hasAlpha = true;

      scene.registerBeforeRender(this.beforeRender);
	  this.models[0].receiveShadows = true;
	  this.game.shadowGenerator.addShadowCaster(this.models[0]);
    }

    beforeRender = () => {
      this.updateXRot();
        
      if (this.models[0].ragdoll.ragdollMode == false)
        this.applyAnimation(this.rightSpeed,this.forwardSpeed);
    }

    clonePlayerModel(scene, name, total) {
      total++;
      var newMesh = scene.getMeshByName("PlayerModel").clone("PlayerModel" + total);
      // newMesh.simplify([{ quality: 0.9, distance: 5 }, 
      //   { quality: 0.5, distance: 10 }], true, BABYLON.SimplificationType.QUADRATIC,
      //   function () {
      //     alert("LOD finisehd, let's have a beer!");
      // });
      newMesh.bodyparts = scene.getMeshByName("PlayerModel").bodyparts;
      var gracz = BABYLON.MeshBuilder.CreateBox(name, { size: 0.1 }, scene);
      gracz.isVisible = false; gracz.isPickable = false;
      gracz.position = newMesh.position;
      gracz.owner = this;
      gracz.checkCollisions = false;

      var skeleton = scene.getSkeletonByName("Character").clone("Character" + total);

      newMesh.skeleton = skeleton;
  
      newMesh.showBoundingBox = false;

      newMesh.isPickable = true;
      newMesh.isVisible = true;
      
      //newMesh.refreshBoundingInfo(true);

      this.models.push(newMesh);
      
      var newAK = scene.getMeshByName("AK47").clone("AK47_"+total);
      // newAK.physicsImpostor = new BABYLON.PhysicsImpostor(newAK, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 5, restitution: 0.5, friction: 1 }, scene);
      // newAK.physicsImpostor.sleep();
      newAK.isPickable = false;
      newAK.isVisible = true;
      newAK.getChildren().forEach(c => c.isVisible = true);

      console.log("JotDeAkCloned",newAK);

      this.ak47 = newAK;

      this.ak47_shot_sound = scene.getSoundByName("AK47_shot").clone("AK47_shot_"+total);
      this.ak47_shot_sound.attachToMesh(newAK);

      this.ak47_reload_sound = scene.getSoundByName("AK47_reload").clone("AK47_reload_"+total);
      this.ak47_reload_sound.attachToMesh(newAK);
      
      if (newAK.scaling.x == 50)
        newAK.attachToBone(newMesh.skeleton.bones[36], newMesh);
      else
        this.attachAK47toCharacter(newAK,newMesh.skeleton,newMesh);

      

      //newAK.rotate(BABYLON.Axis.Z,BABYLON.Tools.ToRadians(180),BABYLON.Space.LOCAL);
      //this.ak47.detachFromBone();
      //this.attachAK47toCharacter2(newAK,newModel1.skeleton,newModel1);
      // this.ak47.detachFromBone();
      //this.ak47.attachToBone(newModel1.skeleton.bones[12], newModel1);
      //this.attachAK47toCharacter(newAK,newModel1.skeleton,newModel1);
  
      newMesh.parent = gracz;
      console.log(newMesh.skeleton.getAnimationRanges());
      // newMesh.skeleton.bones.forEach(bone => {
      //   console.log(bone.name);
      // });
      //this.boneAxesViewer = new BABYLON.Debug.BoneAxesViewer(scene, newModel1.skeleton.bones[5], newModel1);
      this.lookAtCtl = new BABYLON.BoneLookController(newMesh, newMesh.skeleton.bones[5], this.lookAtTarget.position, { adjustYaw:Math.PI*.0, adjustRoll:Math.PI*.0});
      // this.lookAtCtl = new BABYLON.BoneLookController(newModel1, newModel1.skeleton.bones[5], this.lookAtTarget.position, { adjustYaw:Math.PI*.0, adjustRoll:Math.PI*.0});

      var boneSpine2 = newMesh.skeleton.bones[newMesh.skeleton.getBoneIndexByName("mixamorig:Spine2")];
      var boneLeftForeArm = newMesh.skeleton.bones[newMesh.skeleton.getBoneIndexByName("mixamorig:LeftForeArm")];
      var boneRightForeArm = newMesh.skeleton.bones[newMesh.skeleton.getBoneIndexByName("mixamorig:RightForeArm")];
      this.boneLeftForeArm = boneLeftForeArm;
      this.boneRightForeArm = boneRightForeArm;
      var boneLeftHand = newMesh.skeleton.bones[newMesh.skeleton.getBoneIndexByName("mixamorig:LeftHand")];
      var boneRightHand = newMesh.skeleton.bones[newMesh.skeleton.getBoneIndexByName("mixamorig:RightHand")];

      
      this.lookAtCtrls.push(new BABYLON.BoneLookController(newMesh, boneLeftForeArm, this.lookAtTarget.position, { adjustYaw:Math.PI*.5, adjustRoll:Math.PI*0.5, adjustPitch: Math.PI*0.5 }));
      this.lookAtCtrls.push(new BABYLON.BoneLookController(newMesh, boneRightForeArm, this.lookAtTarget.position, { adjustYaw:Math.PI*.0, adjustRoll:Math.PI*0.0, adjustPitch: Math.PI*0.5 }));
      this.lookAtCtrls.push(new BABYLON.BoneLookController(newMesh, boneSpine2, this.lookAtTarget.position, { adjustYaw:Math.PI*.0, adjustRoll:Math.PI*0.0, adjustPitch: Math.PI*0.5 }));


      // var target = this.ak47;
      // var poleTarget = BABYLON.MeshBuilder.CreateSphere('', {diameter: 2.5}, scene);

      // var ikCtl = new BABYLON.BoneIKController(mesh, skeleton.bones[14], {targetMesh:target, poleTargetMesh:poleTarget, poleAngle: Math.PI});

      // poleTarget.parent = gracz;

      //gracz.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(90));
      // var walkRange = newModel1.skeleton.getAnimationRange("AimingIdle");
      // scene.beginWeightedAnimation(newModel1.skeleton, walkRange.from, walkRange.to, 1, true);

      var particleSystem = new BABYLON.ParticleSystem("particles", 100, scene, null, true);
      this.particleSystem = particleSystem;
//this.particleSystem.particleTexture = new BABYLON.Texture("models/FireFlame.png");
      particleSystem.particleTexture = new BABYLON.Texture("resources/textures/fireExplosion.webp", scene, false, false);

      particleSystem.startSpriteCellID = 0;
      particleSystem.endSpriteCellID = 35;
      particleSystem.spriteCellHeight = 300;
      particleSystem.spriteCellWidth = 300;
      particleSystem.spriteCellLoop = false;

      particleSystem.minSize = 0.01;
      particleSystem.maxSize = 0.04;

      particleSystem.updateSpeed = 0.06;

      particleSystem.minEmitPower = 0.1;
      particleSystem.maxEmitPower = 0.1;

      console.log("Min life: ",particleSystem.minLifeTime);
      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 1.0;


      var particleSource = new BABYLON.TransformNode("gunFireSource", this.scene);
      // particleSource.position = new BABYLON.Vector3(-2.8,2,0);
      // particleSource.position = new BABYLON.Vector3(this.ak47.position.x,this.ak47.position.y,this.ak47.position.z);
      particleSource.position = this.ak47.getBoundingInfo().boundingBox.centerWorld;//.clone();
      particleSource.setParent(this.ak47);
      particleSource.translate(BABYLON.Axis.X,-0.55);
      particleSource.translate(BABYLON.Axis.Z,-0.00);
      particleSource.translate(BABYLON.Axis.Y,0.08);
      particleSource.translate(BABYLON.Axis.Y,-0.06);
      this.particleSystem.emitter = particleSource;
      particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
      particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
      particleSystem.isLocal = true;

      var particleSystem2 = new BABYLON.ParticleSystem("bulletTracers", 100, scene, null, false);
      this.particleSystem2 = particleSystem2;
      particleSystem2.particleTexture = new BABYLON.Texture("resources/textures/flare.png");
      particleSystem2.minSize = 0.05;
      particleSystem2.maxSize = 0.05;
      particleSystem2.color1 = new BABYLON.Color4(0.62, 0.3, 0, 1);
      particleSystem2.color2 = new BABYLON.Color4(0.29, 0.14, 0, 1);
      

      particleSystem2.updateSpeed = 0.01;

      particleSystem2.minEmitPower = 300;
      particleSystem2.maxEmitPower = 400;

      particleSystem2.minLifeTime = 1.0;
      particleSystem2.maxLifeTime = 1.0;

      particleSystem2.emitRate = 0;

      particleSystem2.direction1 = new BABYLON.Vector3(-1.0, 0, 0.08);
      particleSystem2.direction2 = new BABYLON.Vector3(-1.0, 0, 0.08);

      particleSystem2.emitter = particleSource.position;
      particleSystem2.minEmitBox = new BABYLON.Vector3(0, 0, 0);
      particleSystem2.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

      particleSystem2.isLocal = false;
      particleSystem2.start();

      
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
      const showBoxes = false;
      const mainPivotSphereSize = 0;
      const disableBoxBoneSync = false;
      
      var ragdoll = new Ragdoll(skeleton, newMesh, config, jointCollisions, showBoxes, mainPivotSphereSize, disableBoxBoneSync);
      ragdoll.init();
      ragdoll.boxes.forEach(b => {
        b.physicsImpostor.friction = 1;
        //b.physicsImpostor.sleep();
        b.isPickable = false;
      });

      newMesh.ragdoll = ragdoll;
      console.log(ragdoll);

      var b = BABYLON.Mesh.CreateBox("handBox"+total,0.01,this.scene);
      b.scaling.scaleInPlace(50);
      b.attachToBone(skeleton.bones.find(b => b.name == "mixamorig:LeftHand"),newMesh);
      this.boxInHand = b;

      newMesh.onAfterRenderObservable.addOnce(() => {
        this.models[0].position.x = 0;
        this.models[0].position.y = 0;
        this.models[0].position.z = 0;
      })

      return gracz;
    }

    applyMovement(pos) {
      //var posDiff = this.gracz.position.subtract(new BABYLON.Vector3(pos.x,pos.y-1.5,pos.z));
      
      var posDiff = this.gracz.position.subtract(new BABYLON.Vector3(pos.x,pos.y,pos.z));
      this.posDiff = posDiff.scale(-1);//.normalize();
      var m = new BABYLON.Matrix(); 
      this.gracz.getWorldMatrix().invertToRef(m); 
      var v = BABYLON.Vector3.TransformCoordinates(posDiff, m);
      var v2 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0,0,0), m);
      var vec = v.subtract(v2)

      //console.log("V2: ", vec);

      // this.animRight.syncWith(this.animForward);
      // this.animRight.syncWith(this.animBack);
      // this.animLeft.syncWith(this.animForward);
      // this.animLeft.syncWith(this.animBack);

      // if (pos.x != this.gracz.position.x) {
      //   console.log("Applying movement", pos.x, this.gracz.name);
      // }
        
      //this.applyAnimation(vec.x, vec.z);
      this.rightSpeed = vec.x;
      this.forwardSpeed = vec.z;
      //console.log(vec.x,vec.y,"XD");
      // this.gracz.lookAt(pos);
      this.gracz.position = new BABYLON.Vector3(pos.x,pos.y,pos.z);
      
      // var xdd = pos.subtract(this.gracz.position);
      // xdd.y = -1;
      // this.gracz.moveWithCollisions(xdd);
      //this.gracz.setDirection(pos);

    }

    adjustAnimWeights() {

    }

    applyAnimation(right,forward) {
      var absRight = Math.abs(right);
      var absForward = Math.abs(forward);

      var delta = this.scene.getEngine().getDeltaTime();

      if (absRight <= 0.01 && absForward <= 0.01) {

        this.animLeft.weight = BABYLON.Scalar.Clamp(this.animLeft.weight - delta/1000 * 1 * 4,0,1);
        this.animRight.weight = BABYLON.Scalar.Clamp(this.animRight.weight - delta/1000 * 1 * 4,0,1);
        this.animForward.weight = BABYLON.Scalar.Clamp(this.animForward.weight - delta/1000 * 1 * 4,0,1);
        this.animBack.weight = BABYLON.Scalar.Clamp(this.animBack.weight - delta/1000 * 1 * 4,0,1);

        if (!this.shootingInfo.animPlaying && !this.weapon.reloading) {
          this.animIdle.weight = 1 - this.animLeft.weight - this.animRight.weight - this.animForward.weight - this.animBack.weight;
        }
          
      }
      else {

        var rightMax = absRight/(absRight+absForward);
        var forwardMax = absForward/(absRight+absForward);

        if (right > 0.01) {

          if (this.animRight.weight == 0)
            this.animRight.restart();
          
          this.animLeft.weight = BABYLON.Scalar.Clamp(this.animLeft.weight - delta/1000 * 1 * 4,0,1);
          this.animRight.weight = BABYLON.Scalar.Clamp(this.animRight.weight + delta/1000 * 1 * 4,0,rightMax);

          if (this.animLeft.weight == 0) {
            this.animLeft.pause();
          }
        } else {
          
          if (this.animLeft.weight == 0)
            this.animLeft.restart();
          
          this.animLeft.weight = BABYLON.Scalar.Clamp(this.animLeft.weight + delta/1000 * 1 * 4,0,rightMax);
          this.animRight.weight = BABYLON.Scalar.Clamp(this.animRight.weight - delta/1000 * 1 * 4,0,1);

          if (this.animRight.weight == 0) {
            this.animRight.pause();
          }

        }

        if (forward > 0.01) {
          
          if (this.animForward.weight == 0)
            this.animForward.restart();
          
          this.animForward.weight = BABYLON.Scalar.Clamp(this.animForward.weight + delta/1000 * 1 * 4,0,forwardMax);
          this.animBack.weight = BABYLON.Scalar.Clamp(this.animBack.weight - delta/1000 * 1 * 4,0,1);

          if (this.animBack.weight == 0) {
            this.animBack.pause();
          }

        } else {

          if (this.animBack.weight == 0)
            this.animBack.restart();
          
          this.animForward.weight = BABYLON.Scalar.Clamp(this.animForward.weight - delta/1000 * 1 * 4,0,1);
          this.animBack.weight = BABYLON.Scalar.Clamp(this.animBack.weight + delta/1000 * 1 * 4,0,forwardMax);

          if (this.animForward.weight == 0) {
            this.animForward.pause();
          }
        }

        if (!this.shootingInfo.animPlaying && !this.weapon.reloading) {
          this.animIdle.weight = 1 - this.animLeft.weight - this.animRight.weight - this.animForward.weight - this.animBack.weight;
        }
        
      }

    }

    updateRotationOfPlayer(rotation) {
      this.gracz.rotation.y = Math.PI + rotation._y;
      this.xRot = rotation._x;
      //this.lookAtTarget.position = 
    }

    updateXRot(undo) {
      //return;
      if (this.models[0].ragdoll.ragdollMode == false) {
        this.lookAtCtrls[2].bone.rotate(BABYLON.Axis.X, (undo ? -1 : 1) * (-0.0 + -0.5*this.xRot-this.gracz.rotation.x), BABYLON.Space.WORLD);
        //var rotation = this.lookAtCtrls[2].bone.rotation;
        //rotation.x = 0.5*this.xRot;
        //this.lookAtCtrls[2].bone.setRotation(rotation);//-this.gracz.rotation.x;
        // if (this.name.includes("user") && this.name != this.game.player.name) {
        //   console.log("Rotacja: ",this.lookAtCtrls[2].bone.rotation);
        //   console.log("XRot: ",this.xRot);
        // }
          
        //this.lookAtCtrls[2].bone.rotation.x = 
        //this.lookAtCtrls[2].bone.setCurrentPoseAsRest();
      }
        
      // this.lookAtCtrls[0].bone.rotate(BABYLON.Axis.X, -1.0 + -1*this.xRot, BABYLON.Space.WORLD);
      //this.lookAtCtrls[1].bone.rotate(this.gracz.right, -0.5 + -0.5*this.xRot, BABYLON.Space.WORLD);
    }

    attachAK47toCharacter(ak47,character,mesz) {
      ak47.scaling = new BABYLON.Vector3(50,50,50);
      ak47.attachToBone(character.bones[36], mesz);
      ak47.rotate(BABYLON.Axis.Z,BABYLON.Tools.ToRadians(-90),BABYLON.Space.LOCAL);
      ak47.rotate(BABYLON.Axis.X,BABYLON.Tools.ToRadians(-90),BABYLON.Space.LOCAL);
      ak47.translate(BABYLON.Axis.X, 0.3);
      ak47.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(10),BABYLON.Space.LOCAL);
      ak47.translate(BABYLON.Axis.Y, 0.1);
      ak47.translate(BABYLON.Axis.X, 0.1);
      ak47.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(-8),BABYLON.Space.LOCAL);
      ak47.translate(BABYLON.Axis.Z, -0.04);
      ak47.rotate(BABYLON.Axis.Z,BABYLON.Tools.ToRadians(-5),BABYLON.Space.LOCAL);
    }

    attachAK47toCharacter2(ak47,character,mesz) {
      ak47.scaling = new BABYLON.Vector3(50,50,50);
      ak47.rotation = new BABYLON.Vector3(0,0,0);
      ak47.attachToBone(character.bones[12], mesz);
      ak47.rotate(BABYLON.Axis.Z,BABYLON.Tools.ToRadians(-90),BABYLON.Space.LOCAL);
      ak47.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(-40),BABYLON.Space.LOCAL);
      ak47.translate(BABYLON.Axis.Z, -0.15);
      ak47.translate(BABYLON.Axis.X, -0.4);
      ak47.translate(BABYLON.Axis.Z, 0.3);
      ak47.translate(BABYLON.Axis.Y, 0.05);
    }
     

    // doEveryFrame() {
    //   //console.log("ASDASD");
    //   if (this.shootingInfo.firing) {
    //     if (this.weapon.bullets > 0) {
    //       var nowMillis = new Date().getTime();
    //       if (nowMillis - this.shootingInfo.lastBulletFired > this.weapon.betweenShots) {
    //         this.shootingInfo.lastBulletFired = nowMillis;
    //         this.playShootingAnim();
    //         this.weapon.bullets--;
    //         console.log("Strzał JD", this.weapon.bullets);
    //       }
    //       else {
    //         //console.log("Jeszcze nie: ", nowMillis, this.shootingInfo.lastBulletFired);
    //       }
    //     } else {
    //       this.shootingInfo.firing = false;
    //       this.reload();
    //     }
    //   }
    // }

    // shootDown() {
    //   this.shootingInfo.firing = true;
    // }

    // shootUp() {
    //   this.shootingInfo.firing = false;
    // }

    playShootingAnim() {
      //console.log("Shooting anim: ",this.animShoot);
      //this.animShoot.restart();

      this.particleSystem.start();
      this.shootingInfo.animPlaying = true;
      this.animIdle.weight = 0;
      this.animShoot.weight = 1;
      
      //this.animShoot.reset();
      //this.animShoot.goToFrame(100);
      
      this.animShoot.restart();
      this.ak47_shot_sound.play();

      // this.animShoot.weight = 1;

      // this.animShoot.reset();
     // this.animIdle.weight = 0;

      //this.animIdle.weight = 0.5;
      //this.animIdle.pause();
      
      // var shootRange = this.skeleton.getAnimationRange("Fire");
      // //this.animShoot = this.scene.beginWeightedAnimation(this.skeleton, shootRange.from, shootRange.to, 1, false, 1.0);
      // this.animShoot = this.scene.beginAnimation(this.skeleton,shootRange.from, shootRange.to, true, 1.0);
      // //this.animIdle.pause();
      // this.animShoot.weight = 1.0;
      // // this.animShoot.reset();
      // // this.animShoot.restart();
      // this.animShoot.toFrame(100);
    }


    // reload() {
    //   if (!this.weapon.reloading && !this.shootingInfo.firing && this.weapon.bullets != this.weapon.bulletsMagazine && this.weapon.bulletsReserve > 0) {
    //     var diff = Math.min(this.weapon.bulletsMagazine, this.weapon.bullets + this.weapon.bulletsReserve) - this.weapon.bullets;
    //     if (diff > 0) {
    //       this.weapon.reloading = true;
    //       var ReloadRange = this.skeleton.getAnimationRange("Reloading");
    //       this.animReload = this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from, ReloadRange.to, 1.0, false, 1.0, () => {
    //         this.weapon.bullets += diff;
    //         this.weapon.bulletsReserve -= diff;
    //         this.weapon.reloading = false;
    //         console.log("Reloaded", this.weapon.bullets, "/",this.weapon.bulletsReserve);
    //       });
    //     }
    //   } else {
    //     console.log("Cant Reload", this.weapon.bullets, "/",this.weapon.bulletsReserve);
    //   }
    // }

    placeBulletHole(ray) {
      this.models.forEach(m => m.isPickable = false);
      var hit = this.scene.pickWithRay(ray);
      this.models.forEach(m => m.isPickable = true);
      console.log(hit);

      if (hit.pickedMesh) {
          this.x++;
          var pickedMesh = hit.pickedMesh;
          var norm = pickedMesh.getFacetNormal(hit.faceId);
          var pos = pickedMesh.getFacetPosition(hit.faceId);

          var bullet = BABYLON.MeshBuilder.CreatePlane("xd"+this.x, { size: 0.3, depth: 0.01, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene);
          
          console.log("Point: ", hit.pickedPoint);
          bullet.position = hit.pickedPoint;
          bullet.alignWithNormal(norm);
          bullet.rotate(BABYLON.Axis.X,BABYLON.Tools.ToRadians(-90));
          bullet.material = this.bulletMat;
          bullet.setParent(pickedMesh);
          bullet.isPickable = false;
          bullet.translate(BABYLON.Axis.Z,0.001);

          this.bullets.push(bullet);

          if (this.bullets.length > this.game.maxBullets) {
              this.bullets.shift().dispose();
          }
      }
    }

    reload() {
      console.log("Wywołano reload()");
      this.weapon.reloading = true;
      var ReloadRange = this.skeleton.getAnimationRange("Reloading");
      this.animShoot.weight = 0;
      this.particleSystem.stop();
      this.shootingInfo.animPlaying = false;
      this.animIdle.weight = 0;
      
      var animReload = this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from, ReloadRange.from+17, 1.0, false, 1.0, () => {
        var magazine = this.ak47.getChildren().find(m => m.name.includes("magazine"));
        if (magazine)
          magazine.setParent(this.boxInHand);
        this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from+17, ReloadRange.from + 52, 1.0, false, 1.0, () => {
          magazine.position = new BABYLON.Vector3(0,0,0);
          magazine.rotation = new BABYLON.Vector3(0,0,0);
          magazine.parent = this.ak47; // działa xd
          magazine.scaling = new BABYLON.Vector3(1,1,1);
          this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from + 52, ReloadRange.to, 1.0, false, 1.0, () => {
            magazine.scaling = new BABYLON.Vector3(1,1,1);
            console.log("Magazine: ",magazine);
            this.weapon.reloading = false;
            this.animIdle.weight = 1;
            console.log("Reloaded", this.weapon.bullets, "/",this.weapon.bulletsReserve);
          });
        });
      });
      // var animReload = this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from, ReloadRange.to, 1.0, false, 1.0, () => {
      //   // this.weapon.bullets += diff;
      //   // this.weapon.bulletsReserve -= diff;
      //   this.weapon.reloading = false;
      //   this.animIdle.weight = 1;
      //   console.log("Reloaded", this.weapon.bullets, "/",this.weapon.bulletsReserve);
      // });
    }

    isAlive = () => this.health > 0;

    dealDamage(damage,imposter,direction,point) {
      console.log("Deal damaage");
      console.log("Ragdoll mode: ",this.models[0].ragdoll.ragdollMode);
      if (this.models[0].ragdoll.ragdollMode == false) {
          this.health -= damage;
          if (this.health <= 0) {
              this.kill(imposter,direction,point);
          }
      } else {
        console.log("!!!!!!!!!!!!!!!!!!!Strzelam w martwego");
        imposter.applyImpulse(direction.scale(this.impulseStrength), point);
      }
    }

    kill(imposter,direction,point) {
      this.health = 0;
      this.models[0].parent = null;
      // for (var i=0; i<this.anims.length; i++) {
      //   this.anims[i].pause();
      // }
      //b.physicsImpostor.sleep();
      // this.models[0].ragdoll.boxes.forEach(b => {
      //   b.physicsImpostor.wakeUp();
      // });
      this.models[0].ragdoll.ragdoll();
      
      //this.ak47.scaling = new BABYLON.Vector3(1,1,1);
      //this.ak47.bakeCurrentTransformIntoVertices();
      //this.ak47.freezeWorldMatrix();
      // this.wm = this.ak47.getWorldMatrix().clone();
      // this.ak47.freezeWorldMatrix();
      // //this.ak47.detachFromBone(true);
      // this.wm2 = this.ak47.getWorldMatrix().clone();
      //this.ak47.freezeWorldMatrix();
      //this.ak47.scaling = new BABYLON.Vector3(1,1,1);
      //this.ak47.scaling = new BABYLON.Vector3(0.1,0.1,0.1);

      //this.ak47.physicsImpostor = new BABYLON.PhysicsImpostor(this.ak47, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 5, restitution: 0.5, friction: 1 }, this.scene);
      
      

      // if (this.posDiff) {
      //   imposter.applyImpulse(direction.scale(this.impulseStrength/2), point);
      //   imposter.applyImpulse(this.posDiff.scale(this.impulseStrength*20), point);
      // } else {
        imposter.applyImpulse(direction.scale(this.impulseStrength), point);
      // }
        
      this.anims.forEach(a => a.pause());
      //this.ak47.physicsImpostor = new BABYLON.PhysicsImpostor(this.ak47, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100, restitution: 0.0, friction: 1 }, this.scene);
      //newAK.physicsImpostor.sleep();
      //this.scene.stopAnimation(this.skeleton);
      //this.animIdle.weight = 0;
      

      console.log("Twój stary: ",this.position); // działa

      // console.log("Nameplate: ", this.nameplate);
      if (this.nameplate) {
        this.nameplate.isVisible = false;
        this.nameplate.scaleX = 0.0;
      }
        

      //setTimeout(() => this.respawn(),1000);
    }

    respawn(pos) {
      this.health = this.maxHealth;
      if (pos) {
        this.moveTo(pos);
      }
      // this.anims.forEach(a => {
      //   console.log(a);
      // });
      //this.animIdle.weight = 1;
      this.models[0].parent = this.gracz;
      this.models[0].ragdoll.ragdollOff();
      // this.models[0].ragdoll.boxes.forEach(b => {
      //   b.physicsImpostor.sleep();
      // })
      //this.ak47.scaling = new BABYLON.Vector3(1,1,1);
      console.log(this.ak47);
      //this.ak47.physicsImpostor.setMass(0);
      // this.ak47.physicsImpostor.setAngularVelocity(new BABYLON.Vector3());
      // this.ak47.physicsImpostor.setLinearVelocity(new BABYLON.Vector3());
      //this.ak47.physicsImpostor.sleep();

      // this.ak47.unfreezeWorldMatrix();
      //this.ak47.attachToBone(this.skeleton.bones[36], this.models[0]);
      
      //this.ak47.unfreezeWorldMatrix();
      //this.ak47.freezeWorldMatrix(this.wm);
      //this.ak47.freezeWorldMatrix(this.wm2);

      this.anims.forEach(a => a.restart());
      this.animIdle.weight = 1;
      this.anims.forEach(a => a.weight = 1.0);

      //this.position = this.position.add(new BABYLON.Vector3(0,5,0)); // działa

      
      if (this.nameplate) {
        this.nameplate.scaleX = 0.0;
        this.nameplate.isVisible = true;
      }
      //this.scene.onAfterRenderObservable.addOnce(() => this.models[0].refreshBoundingInfo(true)); 
      this.models[0].onAfterRenderObservable.addOnce(() => this.models[0].refreshBoundingInfo(true)); 
    }

    moveTo(position) {
      console.log("MoveTo: ", position);
      this.gracz.position = new BABYLON.Vector3(position._x,position._y,position._z);
      console.log(this.gracz.position);
    }

    onUpdate(keys) {
      console.log("Updating GUI or something", keys);
    }

    dispose() {
      this.scene.unregisterBeforeRender(this.beforeRender);
      var physicsEngine = this.scene.getPhysicsEngine();
      this.models.forEach(m => {
        if(m.ragdoll.ragdollMode == true)
          m.ragdoll.ragdollOff();
        m.ragdoll.boxes.forEach(b => {
          physicsEngine.removeImpostor(b.physicsImpostor);
          b.physicsImpostor.dispose();
          b.physicsImpostor = null;
          b.dispose();
        });
        m.getChildren().forEach(c => c.dispose());
        m.dispose();
      });
      this.ak47.dispose();
      this.nameplate?.dispose();
      this.gracz.dispose();
      console.log("Ile: ",physicsEngine.getImpostors().length);
    }

}