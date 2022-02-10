import Player from "./Player.js";

export default class PlayerFPS extends Player {

    camera;
    firstperson = false;
    forward= 0;
    right=0;
    actualSpeed = 0;
    gravity = -9.81;
    grounded = false;
    jumping = false;
    jumpForce = 0;
    alive = true;
    deltaBefore = 0.1;
    xdx = 0;
    xdy = 0;
    xdz = 0;
    
    constructor(scene, name, total, game) {
        super(scene,name,total, game);
        this.camera = scene.getCameraByName("UniversalCamera");
        this.setCamera(true);
        // this.gracz.position.addInPlaceFromFloats(0,0,3);
        // this.models.forEach(m => {
        //     m.parent = null;
        //     m.position = new BABYLON.Vector3(0,0.5,-3);
        // });
        

        //this.lookAtCtl = new BABYLON.BoneLookController(mesh, skeleton.bones[7], sphere.position, {adjustYaw:Math.PI*.5, adjustRoll:Math.PI*.5});
        scene.registerBeforeRender(() => {
            this.doEveryFrame();
            // this.lookAtCtrls[0].bone.rotation = rotation;
        });
        this.models[0].renderingGroupId = 1;
        this.ak47.renderingGroupId = 1;
        this.ak47.getChildren().forEach(c => c.renderingGroupId = 1);
        this.particleSystem.renderingGroupId = 1;
		this.models[0].receiveShadows = true;
		this.game.shadowGenerator.addShadowCaster(this.models[0]);
        
    }

    setCamera(firstPerson) {
        this.firstperson = firstPerson;
        if (firstPerson) {
            this.gracz.getChildren().forEach(m => m.isPickable = false);
            this.gracz.parent = this.camera;
            //this.gracz.translate(BABYLON.Axis.Z,0.16);
            this.gracz.translate(BABYLON.Axis.Z,0.16);

            // this.gracz.translate(BABYLON.Axis.Z,2.16);
            // this.gracz.rotate(BABYLON.Axis.Y,-1.5);

            this.gracz.translate(BABYLON.Axis.Y,-1.55);
            //this.gracz.translate(BABYLON.Axis.Y,-1.6);
            this.gracz.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(180));
        }
        else {
            
        }
        
    }

    initializeCamera() {
        const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0,0,-5), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas,true);

        camera.applyGravity = true;
        camera.checkCollisions = true;
        //camera.inputs.removeByType("FreeCameraKeyboardMoveInput");

        // Remap keys to move with WASD
        camera.keysUp = [87, 38]; // W or UP Arrow
        camera.keysDown = [83, 40]; // S or DOWN ARROW
        camera.keysLeft = [65, 37]; // A or LEFT ARROW
        camera.keysRight = [68, 39]; // D or RIGHT ARROW
        
        camera.inertia = 0.0;
        camera.angularSensibility = 800;
        camera.speed = 2;

        // this.scene.registerBeforeRender(() => {
        //     this._updateFromControls();
        // })

        return camera;
    }

    stareAtModel = () => {
        var forward = this.vecToLocal(BABYLON.Vector3.Forward(),this.camera);
        var direction = forward.subtract(this.camera.position).add(new BABYLON.Vector3(0,-2,0)).normalize();
        this.camera.position.addInPlace(direction.scale(-0.02));
        this.camera.target = this.models[0].ragdoll.boxes[0].position;
    };

    kill(imposter,direction,point) {
        this.alive = false;
        if (this.game.onPlayerFPSKilled) {
            this.game.onPlayerFPSKilled(this);
        }
        super.kill(imposter,direction,point);
        this.savedRotation = this.camera.rotation.clone();
        this.savedPosition = this.camera.position.clone();

        var forward = this.vecToLocal(BABYLON.Vector3.Forward(),this.camera);
        var direction = forward.subtract(this.camera.position).normalize();
        //this.camera.position.addInPlaceFromFloats(0,2,0);
        this.camera.position.addInPlace(direction.scale((direction.y < 0 ? -1 : 1) * 5));
        //console.log("DIRECTION: ",direction);
    
        this.scene.registerBeforeRender(this.stareAtModel);
    }

    respawn() {
        this.scene.unregisterBeforeRender(this.stareAtModel);
        this.alive = true;
        this.camera.rotation = this.savedRotation;
        this.camera.position = this.savedPosition;
        super.respawn();
        this.onUpdate(["health"]);
    }

    updateFromKeyboard = (inputForward,inputRight) => {
        var delta = this.scene.getEngine().getDeltaTime()/1000.0;
        var moveDirection = this.updateFromKeyboardCalc(inputForward,inputRight,delta);
        
        var stepSize = 0.2;
        var maybePosition = this.camera.position.add(new BABYLON.Vector3(moveDirection.x, stepSize, moveDirection.z));
        var ray = new BABYLON.Ray(maybePosition, BABYLON.Vector3.Up().scale(-1), 5);//this.gravity * delta/1000);
        var hit = this.scene.pickWithRay(ray);

        if (this.jumping) {
            if (this.jumpForce > 0) {
                moveDirection.addInPlaceFromFloats(0,this.jumpForce * delta,0);
                this.jumpForce += this.gravity * delta;
            } else {
                this.jumpForce = 0;
                this.jumping = false;
            }
        }

        moveDirection.addInPlaceFromFloats(0,this.gravity * delta,0); 

        if (hit.pickedMesh == null) {
            this.grounded = false;
        } else {
            var heightDiff = maybePosition.y - hit.pickedPoint.y - 1.72;//1.72;

            if (heightDiff > 2*stepSize) {
                this.grounded = false;
            } else {
                heightDiff -= stepSize;
                if (moveDirection.y <= 0) {
                    moveDirection.y = -heightDiff;
                    this.grounded = true;
                    this.jumping = false;
                }
            }
        }
        this.previousCamera = this.camera.position.clone();
        this.camera.cameraDirection.addInPlace(moveDirection);
    }

    updateFromKeyboardCalc(inputForward,inputRight,delta) {
        if (inputForward == 0 && inputRight == 0 && this.forward == 0 && this.right == 0) {
            return new BABYLON.Vector3.Zero();
        } else {
            var diffFW = inputForward - this.forward; 
            var diffRT = inputRight - this.right;
            var absFW = Math.abs(diffFW);
            var absRT = Math.abs(diffRT);

            var speedPerFrame = this.grounded ? delta * 3.5 : delta * 1.0; 
            var speedFW = absFW > 1.0 ? 2*speedPerFrame : (absFW < speedPerFrame ? absFW : speedPerFrame);
            var speedRT = absRT > 1.0 ? 2*speedPerFrame : (absRT < speedPerFrame ? absRT : speedPerFrame);
            speedFW = speedFW * (diffFW < 0 ? -1 : 1); // znaki
            speedRT = speedRT * (diffRT < 0 ? -1 : 1);

            this.forward += speedFW;
            this.right += speedRT;
            
            this.game.camRoot.rotation.x = 0;
            this.game.camRoot.rotation.y = this.camera.rotation.y;
            this.game.camRoot.rotation.z = this.camera.rotation.z;
            var fwd = this.game.camRoot.forward;
            var right = this.game.camRoot.right;

            let correctedFwd = fwd.scaleInPlace(this.forward);
            let correctedRight = right.scaleInPlace(this.right);

            let move = correctedRight.addInPlace(correctedFwd);
            var moveDirection = new BABYLON.Vector3((move).normalize().x, 0, (move).normalize().z);
            
            var inputMag = Math.abs(this.forward) + Math.abs(this.right*0.9);
            var inputAmt = inputMag > 1 ? 0.8 /*Spowolnienie jak po skosie*/ : inputMag;

            this.deltaBefore = delta;
            moveDirection = moveDirection.scaleInPlace(inputAmt * this.game.PLAYER_SPEED * delta);
            return moveDirection;
        }
    }

    // updateFromKeyboard = () => {
    //     var delta = this.scene.getEngine().getDeltaTime()/1000.0;

    //     var diffFW = this.forward - this.game.inputController.forward;
    //     var diffRT = this.right - this.game.inputController.right;
    //     var speedRT = delta * (Math.abs(diffRT) <= 1.0 ? 5.0 : 10.0);//0.1 * diff;
    //     var speedFW = delta * (Math.abs(diffFW) <= 1.0 ? 5.0 : 10.0);

    //     if (Math.abs(diffRT) > speedRT) {
    //         this.right += ((this.game.inputController.right > this.right) ? speedRT : -speedRT);
    //     }
    //     else {
    //         this.right = this.game.inputController.right;
    //     }

    //     if (Math.abs(diffFW) > speedFW) {
    //         this.forward += ((this.game.inputController.forward > this.forward) ? speedFW : -speedFW);
    //     }
    //     else {
    //         this.forward = this.game.inputController.forward;
    //     }
        
    //     //this.right += speed
    //     //console.log(this.right);
    //     // this.right = BABYLON.Scalar.MoveTowards(this.right, this.game.inputController.right, speed);
    //     // console.log("F: ",this.forward,"R: ",this.right);
    //     // console.log("Key F: ",this.game.inputController.forward,"Key R: ",this.game.inputController.right);
        
    //     //console.log("CamRoot: ",this.game.camRoot);
    //     this.game.camRoot.rotation = this.camera.rotation.clone();
    //     this.game.camRoot.rotation.x = 0;
    //     var fwd = this.game.camRoot.forward;
    //     var right = this.game.camRoot.right;

    //     // var fwd = this.gracz.forward;
    //     // var right = this.gracz.right;

    //     // console.log(fwd, right);

    //     // var fwd = this.vecToLocal(BABYLON.Vector3.Forward(),this.camera);
    //     // var right = this.vecToLocal(BABYLON.Vector3.Right(),this.camera);

    //     let correctedFwd = fwd.scaleInPlace(this.forward);
    //     let correctedRight = right.scaleInPlace(this.right);

    //     // console.log(correctedFwd,correctedRight);
    //     // console.log(fwd);
    //     // console.log(right);


    //     let move = correctedRight.addInPlace(correctedFwd);
    //     var moveDirection = new BABYLON.Vector3((move).normalize().x, 0, (move).normalize().z);
    //     var inputMag = Math.abs(this.forward) + Math.abs(this.right);
    //     var inputAmt = 0;
    //     if (inputMag < 0) {
    //         inputAmt = 0;
    //     } else if (inputMag > 1) {
    //         inputAmt = 0.8;
    //     } else {
    //         inputAmt = inputMag;
    //     }

    //     moveDirection = moveDirection.scaleInPlace(inputAmt * this.game.PLAYER_SPEED);

    //     //this.game.camRoot.position = this.camera.position;
    //     //var availableDistance = this.game.camRoot.calcMovePov(0,this.gravity * delta/1000,0);
    //     var ray = new BABYLON.Ray(this.camera.position, BABYLON.Vector3.Up().scale(-1), 5);//this.gravity * delta/1000);
    //     var hit = this.scene.pickWithRay(ray);
    //     //console.log(hit);
        
    //     if (this.jumping) {
    //         if (this.jumpForce > 0) {
    //             moveDirection.addInPlaceFromFloats(0,this.jumpForce * delta,0);
    //             console.log(moveDirection);
    //             this.jumpForce += this.gravity * delta;
    //         } else {
    //             this.jumpForce = 0;
    //         }
    //     }

    //     if (hit.pickedMesh == null || hit.pickedPoint.subtract(this.camera.position).length() > 1.72/*1.72*/) {
    //         this.grounded = false;
    //         //console.log("Spadam...");
    //         //console.log(hit.pickedPoint?.subtract(this.camera.position).length());
    //         moveDirection.addInPlaceFromFloats(0,this.gravity * delta,0); 
            
    //     } else {
    //         //console.log("Grounded...");
    //         this.grounded = true;
    //         //console.log(hit.pickedPoint?.subtract(this.camera.position).length());
    //         if (this.jumping && this.jumpForce + this.gravity < 0) {
    //             this.jumping = false;
    //             this.jumpForce = 0;
    //         }
    //         //moveDirection.addInPlaceFromFloats(0,-0.1,0);
    //         //moveDirection.addInPlaceFromFloats(0,-0.1,0);
            
    //     }

        
    //     //console.log("Moving: ", moveDirection);
    //     //this.camera.position.addInPlace(moveDirection);

    //     this.camera.cameraDirection.addInPlace(moveDirection);

    //     // if (this.camera.position.y < 1) {
    //     //     this.camera.position.y = 1;
    //     // }
    // }

    doEveryFrame() {
        //console.log("ASDASD");
        if (this.alive) {
            this.updateFromKeyboard(this.game.inputController.forward,this.game.inputController.right);
        }
        

        if (this.weapon.bullets > 0) {
            if (this.shootingInfo.firing && !this.weapon.reloading) {
                var nowMillis = new Date().getTime();
                if (nowMillis - this.shootingInfo.lastBulletFired > this.weapon.betweenShots) {
                    this.shootingInfo.lastBulletFired = nowMillis;
                    this.shoot();
                    this.playShootingAnim();
                    console.log("Strzał JD", this.weapon.bullets);
                }
                else {
                    //console.log("Jeszcze nie: ", nowMillis, this.shootingInfo.lastBulletFired);
                }
            }
            else {

            }
        }
        else if (!this.weapon.reloading) {
            this.shootingInfo.firing = false;
            this.reload();
        }

        if (!this.firstperson) {
            this.gracz.position = this.camera.position;
            //this.gracz.rotation.y = Math.PI + this.camera.rotation._y;
            this.gracz.translate(BABYLON.Axis.Z, -2);
            this.gracz.translate(BABYLON.Axis.Y, -1.5);
            this.gracz.translate(BABYLON.Axis.X, -1);
            


            var you = this.camera;
                    
            var forward = this.vecToLocal(BABYLON.Vector3.Forward(),you);
            var direction = forward.subtract(you.position);
            direction = BABYLON.Vector3.Normalize(direction);
            //direction.y = 0;

            this.gracz.setDirection(direction);
            this.gracz.rotate(BABYLON.Axis.Y,Math.PI);
            //this.gracz.lookAt(BABYLON.Vector3.Zero());
            var sphere = this.scene.getMeshByName("sphere");

            //this.boneAxesViewer.update();
            this.lookAtCtl.update();
            //this.lookAtCtrls[0].update();
            this.lookAtCtrls[0].bone.rotate(BABYLON.Axis.X, -1.0 + -1*this.gracz.position.subtract(sphere.position).y, BABYLON.Space.WORLD);
            this.lookAtCtrls[1].bone.rotate(BABYLON.Axis.X, -0.5 + -0.5*this.gracz.position.subtract(sphere.position).y, BABYLON.Space.WORLD);
            //this.boneLeftForeArm.rotate(BABYLON.Axis.Y, 3);
            //console.log(this.boneLeftForeArm.getTransformNode().rotation);
            //this.lookAtCtrls[0].update();
            // this.lookAtCtrls[1].update();


            // var ray = new BABYLON.Ray(you.position, direction, 100);
            // let rayHelper = new BABYLON.RayHelper(ray);		
            // rayHelper.show(this.scene, new BABYLON.Color3(1,0,0));
            // var hit = this.scene.pickWithRay(ray);
        }
        else {
            //this.gracz.isVisible = false;
            //this.gracz.getChildren().forEach(n => n.isVisible = false);
        }
    }

    shootDown() {
        if (this.shootingInfo.firing) 
            return;

        this.shootingInfo.firing = true;
        //this.shoot();
    }

    shoot() {
        var you = this.camera;
                    
        var forward = this.vecToLocal(BABYLON.Vector3.Forward(),you);
        var direction = forward.subtract(you.position);
        direction = BABYLON.Vector3.Normalize(direction);

        if (Math.abs(this.forward) + Math.abs(this.right) > 0.2 || !this.grounded) {
            console.log("Ruszałeś się: ",Math.abs(this.forward + this.right));
            
            direction.addInPlaceFromFloats(-0.05+Math.random()*0.1,Math.random()*0.05,-0.05+Math.random()*0.1);
        }
        console.log("FW/RGT: ",this.forward,this.right);

        var ray = new BABYLON.Ray(you.position, direction, 2000);

        var candidateMeshes = [];
        var candidateBots = [];
        this.game.players.forEach(p => {
                var m = p.models[0];
                if (this.scene.isActiveMesh(m)) {
                    if (!m.parent)
                        var nadajeSie = ray.intersectsBoxMinMax(m.getBoundingInfo().boundingBox.minimumWorld,m.getBoundingInfo().boundingBox.maximumWorld,0.5);
                    else
                        var nadajeSie = ray.intersectsBoxMinMax(m.getBoundingInfo().boundingBox.minimumWorld,m.getBoundingInfo().boundingBox.maximumWorld,0.2);

                    if (nadajeSie)
                        candidateMeshes.push(m);
                }
        });
        console.log("CandidateMeshes: ",candidateMeshes.length);
        candidateMeshes.forEach(m => {
            m.parent?.owner.updateXRot();
            m.refreshBoundingInfo(true);
            m.parent?.owner.updateXRot(true);
        })
        this.game.bots.forEach(b => {
            var m = b.models[0];
            if (this.scene.isActiveMesh(m)) {
                if (!m.parent)
                    var nadajeSie = ray.intersectsBoxMinMax(m.getBoundingInfo().boundingBox.minimumWorld,m.getBoundingInfo().boundingBox.maximumWorld,0.5);
                else 
                    var nadajeSie = ray.intersectsBoxMinMax(m.getBoundingInfo().boundingBox.minimumWorld,m.getBoundingInfo().boundingBox.maximumWorld,0.2);

                if (nadajeSie)
                    candidateBots.push(m);
            }
        });

        candidateBots.forEach(m => {
            m.refreshBoundingInfo(true);
        })

        var hit = this.scene.pickWithRay(ray);

        var endpoint = hit.pickedPoint ? hit.pickedPoint : you.position.add(direction.scale(200));
        this.particleSystem2.emitter = this.particleSystem.emitter.getAbsolutePosition();//.clone();
        this.particleSystem2.direction1 = endpoint.subtract(this.particleSystem2.emitter).normalize();
        this.particleSystem2.direction2 = this.particleSystem2.direction1;
        this.particleSystem2.manualEmitCount = 1;

        if (hit.pickedMesh) {
            this.x++;
            var pickedMesh = hit.pickedMesh;
            var pickedPoint = hit.pickedPoint;

            if (!pickedMesh.skeleton) {
                var norm = pickedMesh.getFacetNormal(hit.faceId);
                var bullet = BABYLON.MeshBuilder.CreatePlane("xd"+this.x, { size: 0.3, depth: 0.01, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this.scene);
                
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

            var strength = 1;

            var ragdoll = pickedMesh.ragdoll;
            var player = pickedMesh.parent?.owner;
            
            if (ragdoll) {
                
                console.log(pickedMesh.ragdoll);
                strength = 10;
                
                if (pickedMesh.ragdoll.ragdollMode == false) {
                    console.log("Body Parts: ",hit.pickedMesh.bodyparts);
                    var head = hit.pickedMesh.bodyparts[2];
                    var v = hit.pickedMesh.getIndices()[hit.faceId*3];
                    if (v >= head.verticeStart && v < head.verticeStart+head.verticeCount) {
                        pickedMesh = pickedMesh.ragdoll.boxes.find(b => b.name == "mixamorig:Head_box");
                    } else {
                        pickedMesh = pickedMesh.ragdoll.boxes.reduce(function(previousValue, currentValue) {
                            return currentValue.name != "mixamorig:Head_box" && BABYLON.Vector3.DistanceSquared(pickedPoint,previousValue.getAbsolutePosition()) > BABYLON.Vector3.DistanceSquared(pickedPoint,currentValue.getAbsolutePosition()) ?
                                currentValue : previousValue;
                        },pickedMesh.ragdoll.boxes[0]);
                    }

                } else {
                    console.log("Body Parts: ",hit.pickedMesh.bodyparts);
                    var head = hit.pickedMesh.bodyparts[2];
                    var v = hit.pickedMesh.getIndices()[hit.faceId*3];
                    if (v >= head.verticeStart && v < head.verticeStart+head.verticeCount) {
                        pickedMesh = pickedMesh.ragdoll.boxes.find(b => b.name == "mixamorig:Head_box");
                    } else {
                        pickedMesh = pickedMesh.ragdoll.boxes.reduce(function(previousValue, currentValue) {
                            return BABYLON.Vector3.DistanceSquared(pickedPoint,previousValue.getAbsolutePosition()) > BABYLON.Vector3.DistanceSquared(pickedPoint,currentValue.getAbsolutePosition()) ?
                                currentValue : previousValue;
                        },pickedMesh.ragdoll.boxes[0]);
                    }
                }
            }

            if (ragdoll) {
                var imposter = pickedMesh.physicsImpostor;
                if (player != null) {
                    if (imposter != null) {
                        if (player.constructor.name == "Bot") {
                            switch(pickedMesh.name) {
                                case "mixamorig:Head_box":
                                    player.dealDamage(4*this.weapon.damage, imposter, direction, pickedPoint);
                                    break;
                                default:
                                    player.dealDamage(this.weapon.damage, imposter, direction, pickedPoint);
                                    break;
                            }
                        } 
                    }
                } else {
                    if (ragdoll.ragdollMode == false)
                        ragdoll.ragdoll();
                    imposter.applyImpulse(direction.scale(strength), pickedPoint);
                }
            } 
        }

        this.game.msg.body.shot = {
            player: player?.name,
            head: pickedMesh?.name == "mixamorig:Head_box",
            imposter: pickedMesh?.name,
            point: pickedPoint,
            position: you.position,
            direction: direction,
            rotation: you.rotation,
        };

        this.weapon.bullets--;
        this.game.GUI.updateAmmo(this.weapon.bullets,this.weapon.bulletsReserve);
    }

    jump() {
        console.log(this.grounded,this.jumping);
        if (this.grounded){// && !this.jumping) {
            console.log("Jumping");
            this.jumping = true;
            this.jumpForce = -this.gravity * 1.5//1.6;
        }
            
    }

    shootUp() {
        this.shootingInfo.firing = false;
    }

    reload() {
        
        if (!this.weapon.reloading && !this.shootingInfo.firing /*&& !this.shootingInfo.animPlaying*/ && this.weapon.bullets != this.weapon.bulletsMagazine && this.weapon.bulletsReserve > 0) {
            var diff = Math.min(this.weapon.bulletsMagazine, this.weapon.bullets + this.weapon.bulletsReserve) - this.weapon.bullets;
            if (diff > 0) {
                this.weapon.reloading = true;
                var ReloadRange = this.skeleton.getAnimationRange("Reloading");

                
                this.animIdle.weight = 0;
                this.game.msg.body.reload = true;
                //console.log("Wysłanie komunikatu reload");
                
                this.particleSystem.stop();
                this.animShoot.weight = 0;
                this.ak47_reload_sound.play();

                this.animReload = this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from, ReloadRange.from+17, 1.0, false, 1.0, () => {
                    this.game.inputController.magazine = this.ak47.getChildren().find(m => m.name.includes("magazine"));
                    var magazine = this.ak47.getChildren().find(m => m.name.includes("magazine"));
                    // var b = BABYLON.Mesh.CreateBox("ASD",0.01,this.scene);
                    // b.scaling.scaleInPlace(50);
                    // b.attachToBone(this.skeleton.bones.find(b => b.name == "mixamorig:LeftHand"),this.models[0]);
                    //magazine.attachToBone(this.skeleton.bones.find(b => b.name == "mixamorig:LeftHandThumb4"),this.models[0]);
                    //magazine.scaling.scaleInPlace(50);
                    magazine.setParent(this.boxInHand);
                    //magazine.rotation.z += 0.5;
                    //magazine.rotation.addInPlaceFromFloats(0,0,BABYLON.Tools.ToRadians(-90));
                    //magazine.rotation.addInPlaceFromFloats(this.xdx,this.xdy,this.xdz);
                    //magazine.rotation = new BABYLON.Vector3(BABYLON.Tools.ToRadians(-90),0,90);
                    this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from+17, ReloadRange.from + 52, 1.0, false, 1.0, () => {
                        magazine.position = new BABYLON.Vector3(0,0,0);
                        magazine.rotation = new BABYLON.Vector3(0,0,0);
                        //magazine.detachFromBone(false);
                        //magazine.rotation.addInPlaceFromFloats(0,0,BABYLON.Tools.ToRadians(90));
                        //magazine.rotation.addInPlaceFromFloats(-this.xdx,-this.xdy,-this.xdz);
                        //magazine.scaling.scaleInPlace(0.02);

                        magazine.scaling = new BABYLON.Vector3(1,1,1);
                        magazine.parent = this.ak47; // działa xd
                        this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from + 52, ReloadRange.to, 1.0, false, 1.0, () => {
                            this.weapon.bullets += diff;
                            this.weapon.bulletsReserve -= diff;
                            this.weapon.reloading = false;
                            //console.log("Reloaded", this.weapon.bullets, "/",this.weapon.bulletsReserve);
                            this.game.GUI.updateAmmo(this.weapon.bullets,this.weapon.bulletsReserve);
                            this.animIdle.weight = 1;
                        });
                    });
                });

                // this.animReload = this.scene.beginWeightedAnimation(this.skeleton, ReloadRange.from, ReloadRange.to, 1.0, false, 1.0, () => {
                //     this.weapon.bullets += diff;
                //     this.weapon.bulletsReserve -= diff;
                //     this.weapon.reloading = false;
                //     console.log("Reloaded", this.weapon.bullets, "/",this.weapon.bulletsReserve);
                //     this.game.GUI.updateAmmo(this.weapon.bullets,this.weapon.bulletsReserve);
                //     this.animIdle.weight = 1;
                // });
            }
        } else {
            //console.log("Cant Reload", this.weapon.bullets, "/",this.weapon.bulletsReserve);
        }
    }

    vecToLocal(vector, mesh){
        var m = mesh.getWorldMatrix();
        var v = BABYLON.Vector3.TransformCoordinates(vector, m);
        return v;		 
    }

    moveTo(position) {
        //this.camera.position = new BABYLON.Vector3(position._x,position._y+1.6,position._z);
        this.camera.position.x = position._x;
        this.camera.position.y = position._y+1.6;
        this.camera.position.z = position._z;
    }

    dealDamage(damage, imposter, direction, point) {
        if (this.health > 0)
            super.dealDamage(damage, imposter, direction, point);
    }
    
    onUpdate(keys) {
        //console.log("Updating GUI" + keys);
        
        keys.forEach(k => {
            var funcName = "update"+k[0].toUpperCase() + k.substring(1);
            
            if (this.game.GUI[funcName]) { 
                this.game.GUI[funcName](this[k]); // kocham javascripta #3
            }
        });
    }

}