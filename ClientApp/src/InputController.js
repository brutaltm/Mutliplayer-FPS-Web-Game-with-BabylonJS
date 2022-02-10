export default class InputController extends BABYLON.DeviceSourceManager {
    devices = [];
    game;
    forward = 0;
    right = 0;
    fwd = 0;
    rgt = 0;
    left = 0;
    back = 0;

    constructor(scene, game) {
        super(scene.getEngine());
        this.game = game;
        this.onDeviceConnectedObservable.add((device) => {
            switch(device.deviceType) {
                case BABYLON.DeviceType.Mouse:
                    console.log("Connected Mouse");
                    break;
                case BABYLON.DeviceType.Keyboard:
                    scene.onKeyboardObservable.add(this.onKeyboardInput);
                    console.log("Connected Keyboard");
                    break;
                case BABYLON.DeviceType.Touch:
                    // this.devices.push("Touch");
                    this.devices.push(BABYLON.DeviceType.Touch);

                    console.log("Connected Touch");
                //     break;
            }
            //console.log("Connected ", device.deviceType.toString());
            //console.log("Devices: ", this.getDevices());
        });

        this.onDeviceDisconnectedObservable.add((device) => {
            switch(device.deviceType) {
                case BABYLON.DeviceType.Keyboard:
                    scene.onKeyboardObservable.removeCallback(this.onKeyboardInput);
                    break;
            }
            console.log("Disconnected ", device.deviceType.toString());
        });
        
        // scene.onKeyboardObservable.add((kbInfo) => {
            
        //     switch (kbInfo.type) {
        //     case BABYLON.KeyboardEventTypes.KEYDOWN:
        //         console.log(kbInfo.event.key);
        //         switch (kbInfo.event.key) {  
        //           case "Enter":
        //             var you = scene.getCameraByName("UniversalCamera");
                    
        //             var forward = game.vecToLocal(BABYLON.Vector3.Forward(),you);
        //             var direction = forward.subtract(you.position);
        //             direction = BABYLON.Vector3.Normalize(direction);
      
        //             var ray = new BABYLON.Ray(you.position, direction, 100);
        //             let rayHelper = new BABYLON.RayHelper(ray);		
        //             rayHelper.show(scene, new BABYLON.Color3(1,0,0));
        //             var hit = scene.pickWithRay(ray);
        //             console.log(hit.pickedMesh);

        //             game.msg.body.shot = {
        //                 position = you.position,
        //                 direction = direction,
        //                 rotation = you.rotation
        //             };

        //             break;
        //         case "Shift":
        //             shiftPressed = true;
        //             var ak47 = scene.getMeshByName("AK47");
        //             var skeleton = scene.getSkeletonByName("Character");
        //             var ranges = skeleton.getAnimationRanges();
        //             var walkRange = ranges[Math.floor(Math.random()*ranges.length)];
        //             // var walkRange = skeleton.getAnimationRange("Reloading");
        //             scene.beginAnimation(skeleton, walkRange.from, walkRange.to, false);
        //             break;
      
        //         case "Control":
        //             var ak47 = scene.getMeshByName("AK47");
        //             var character = scene.getSkeletonByName("Character");
        //             var mesz = scene.getMeshByName("Beta_Joints")
      
        //             mesz.skeleton = character;
        //             console.log(ak47);
        //             console.log(character);
        //             console.log(mesz);
      
        //             ak47.scaling = new BABYLON.Vector3(50,50,50);
        //             ak47.attachToBone(scene.getSkeletonByName("Character").bones[36], mesz);
        //             ak47.rotate(BABYLON.Axis.Z,BABYLON.Tools.ToRadians(-90),BABYLON.Space.LOCAL);
        //             ak47.rotate(BABYLON.Axis.X,BABYLON.Tools.ToRadians(-90),BABYLON.Space.LOCAL);
        //             ak47.translate(BABYLON.Axis.X, 0.3);
        //             ak47.rotate(BABYLON.Axis.Y,BABYLON.Tools.ToRadians(10),BABYLON.Space.LOCAL);
        //             ak47.translate(BABYLON.Axis.Y, 0.1);
        //             ak47.translate(BABYLON.Axis.X, 0.1);
      
        //             index++;
        //             break;  
        //         case "j":
        //           if (!scene.getMeshByName("fpsPlayer")) {
        //             var player = new Player(scene, "fpsPlayer", game.total);
        //             game.player = player;
        //             player.gracz.getChildren().forEach(c => c.translate(BABYLON.Axis.Z,80));
      
        //             player.ak47.translate(BABYLON.Axis.X,3);
        //             scene.onBeforeCameraRenderObservable.add(() => {
        //               player.applyMovement(camera.position);
        //               game.updateRotationOfPlayer(player.gracz,camera.rotation);
        //               //player.gracz.translate(BABYLON.Axis.Z,-1);
        //               //player.gracz.getChildren().forEach(c => c.translate(BABYLON.Axis.Z,-1));
        //             });
      
        //           }
        //           else {
        //             var player = scene.getMeshByName("fpsPlayer");
        //             player.ak47.translate(BABYLON.Axis.Z,100);
        //           }
      
        //           // console.log(player.position.x,player.position.y,player.position.z);
        //           break;
        //         }                
        //         break;

        //     case BABYLON.KeyboardEventTypes.KEYUP:
        //         switch (kbInfo.event.key) {   
        //         case "Shift":
        //             shiftPressed = false;
                    
        //             break;
        //         }       
        //     }
        // });
        


        scene.onPointerObservable.add((prInfo) => {
            switch (prInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN: 
                    console.log("PrInfo: ",prInfo);
                    switch (prInfo.event.button) {
                        case 0:
                            console.log("KeyDown: ","Strzał");
                            if (prInfo.event.pointerType == "mouse") {
                                game.player.shootDown();
                            } else if (prInfo.event.pointerType == "touch") {
                                console.log("Target: ",game.player.camera.target);
                                game.player.camera.target = prInfo.pickInfo.pickedPoint;
                                //game.player.camera.target = BABYLON.Vector3.Lerp(game.player.camera.target, prInfo.pickInfo.pickedPoint, 0.1);
                                game.player.shootDown();
                            }
                            
                            break;
                        default:
                            console.log("KeyDown: ",prInfo.event.button);
                    }
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    switch (prInfo.event.button) {
                        case 0:
                            console.log("KeyUp: ","Puszczenie Strzału");
                            game.player.shootUp();
                            break;
                        default:
                            console.log("KeyUp: ",prInfo.event.button);
                    }
                    break;
                default:
                    //console.log(prInfo.type);
            }

        });
    }

    onKeyboardInput = (kbInfo) => {
        var walkKeys = ["Shift"];
        var reloadKeys = ["r","R"];
        var fwdKeys = ["w","W"], leftKeys = ["a", "A"], rightKeys = ["d","D"], backKeys = ["s","S"]; 
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:

                switch (kbInfo.event.key) { 
                    case walkKeys[0]:
                        this.game.player.walking = true;
                        //console.log("Walking");
                        break;
                    case reloadKeys[0]: case reloadKeys[1]:
                        this.game.player.shootingInfo.firing = false;
                        this.game.player.reload();
                        // this.game.player.models[0].parent = null;
                        // this.game.player.models[1].parent = null;
                        // this.game.player.ragdoll.ragdoll();
                        // this.game.player.ragdoll2.ragdoll();
                        break;
                    case "e":
                        // this.game.player.models[0].parent = this.game.player.gracz;
                        // this.game.player.models[1].parent = this.game.player.gracz;
                        // this.game.player.ragdoll.ragdollOff();
                        this.game.scene.getCameraByName("UniversalCamera").position.addInPlaceFromFloats(0,10,0);
                        break;
                    case "n":
                        this.game.PLAYER_SPEED /= 2;
                        break;
                    case "m":
                        this.game.PLAYER_SPEED *= 2;
                        break;
                    case "y": case "Y":
                        this.game.GUI.msgInput.focus();
                        break;
                    case "m": case "M":
                        this.game.GUI.openTeamPickMenu(this.game.settings.teams);
                        break;
                    case fwdKeys[0]: case fwdKeys[1]:
                        this.fwd = 1;
                        break;
                    case backKeys[0]: case backKeys[1]:
                        this.back = 1;
                        break;
                    case leftKeys[0]: case leftKeys[1]:
                        this.left = 1; 
                        break;
                    case rightKeys[0]: case rightKeys[1]:
                        this.rgt = 1;
                        break;
                    case "j":
                        //this.game.bots[0].gracz.position = new BABYLON.Vector3(5,2,5);
                        this.game.bots.forEach(b => {
                            var randomPointAround = this.game.navigationPlugin.getRandomPointAround(b.gracz.position, 60);
                            //console.log("Random2: ", randomPointAround);
                            // var randomPointAround = this.game.navigationPlugin.getRandomPointAround(BABYLON.Vector3.Zero(), 60);
                            var closestPoint = this.game.navigationPlugin.getClosestPoint(new BABYLON.Vector3(0,0,15));
                            //console.log("Closest Point: ", closestPoint);
                            //console.log("Random: ",this.game.navigationPlugin.getRandomPointAround(closestPoint, 60));
                            b.moveToPosition(randomPointAround);
                        })

                        // this.game.GUI.updateHealth(Math.trunc(Math.random()*100),100);
                        // this.game.GUI.updateTime(Math.trunc(Math.random()*600));
                        
                        // var randomPointAround = this.game.navigationPlugin.getRandomPointAround(new BABYLON.Vector3(0,0,0), 30).addInPlaceFromFloats(10,0,10);
                        //this.game.bots[0].moveToPosition(new BABYLON.Vector3(-20 + Math.random()*20, 1.0, -10 + Math.random()*20));
                        
                        break;
                    case "k": case "K":
                        this.game.addBot();
                        break;
                    case "l": case "L":
                        this.game.removeBot();
                        break;
                    case "p":
                        this.game.bots.forEach(b => {
                            var randomPointAround = this.game.navigationPlugin.getRandomPointAround(b.gracz.position, 60);
                            while (randomPointAround.x < b.position.x && b.position.x < 140)
                                randomPointAround = this.game.navigationPlugin.getRandomPointAround(b.gracz.position, 60);
                            b.moveToPosition(randomPointAround);
                        });
                        break;
                    case " ":
                        this.game.player.jump();
                        //console.log("space");
                    default:
                        //console.log(kbInfo.event.key);
                        break;
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                switch (kbInfo.event.key) {  
                    case walkKeys[0]:
                        this.game.player.walking = false;
                        console.log("Running");
                        break;
                    case fwdKeys[0]: case fwdKeys[1]: 
                        this.fwd = 0;
                        break;
                    case backKeys[0]: case backKeys[1]:
                        this.back = 0;
                        break;
                    case leftKeys[0]: case leftKeys[1]: 
                        this.left = 0;
                        break;
                    case rightKeys[0]: case rightKeys[1]:
                        this.rgt = 0;
                        break;
                    case "Escape":
                        this.game.GUI.pause();
                        this.game.canvas.onclick = () => {};
                        break;
                    default:
                        break;
                }
                break;
        }
        this.forward = this.fwd - this.back;
        this.right = this.rgt - this.left;
    }

}