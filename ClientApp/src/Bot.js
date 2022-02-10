import Player from "./Player.js";

export default class Bot extends Player {

    desiredLocations = [];
    index;
    pathLine;

    constructor(scene, name, total, game, pos) {
        super(scene,name,total,game);

        //this.gracz.position = new BABYLON.Vector3(20+Math.random()*5,0,5+Math.random*15)
            //.multiplyByFloats(Math.random() > 0.5 ? 1 : -1, 1, Math.random() > 0.5 ? 1 : -1));
            //.multiplyByFloats(Math.random() > 0.5 ? 1 : -1, 1, Math.random() > 0.5 ? 1 : -1);
        var vector = this.game.navigationPlugin.getClosestPoint(new BABYLON.Vector3(20,-0.5,5));

       //this.gracz.position = new BABYLON.Vector3(20,0,5);
        if (pos)
            this.gracz.position = pos.clone();
        else
            this.gracz.position = this.game.navigationPlugin.getRandomPointAround(vector, 60);
        //this.gracz.isVisible = true;
        //this.game.GUI.pushMessage()
        scene.registerBeforeRender(this.doEveryFrame);
    }

    moveToPosition(position) {
        // this.desiredLocations.push(position);
        //this.game.crowd.
        //console.log(this.game);
        //this.game.crowd.agentGoto(this.index, new BABYLON.Vector3(10,1,10));
        //navigationPlugin.getRandomPointAround(startingPoint, 1.0);
        //var closestPoint = this.game.navigationPlugin.getClosestPoint(this.gracz.position);
        var closestPoint;
        
        if (this.desiredLocations.length == 0) {
            closestPoint = this.game.navigationPlugin.getClosestPoint(this.gracz.position);
            this.gracz.position = closestPoint;
        } else {
            closestPoint = this.desiredLocations[this.desiredLocations.length-1];
        }
            

        console.log("Pozycja: ", this.gracz.position);
        //var pathPoints = this.game.navigationPlugin.computePath(this.game.navigationPlugin.getClosestPoint(this.gracz.position), this.game.navigationPlugin.getClosestPoint(position));
        var pathPoints = this.game.navigationPlugin.computePath(closestPoint, this.game.navigationPlugin.getClosestPoint(position));
        console.log(position,"vs",this.game.navigationPlugin.getClosestPoint(position));
        console.log(pathPoints);
        this.pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", {points: pathPoints, updatable: true, instance: this.pathLine}, this.scene);
        this.desiredLocations.push(...(pathPoints));//.slice(1)));
        //this.desiredLocations.push(...pathPoints);
        this.pathLine.isPickable = false;

        //this.game.crowd.agentGoto(this.index, this.game.navigationPlugin.getClosestPoint(position));
        
    }

    moveRandomlyTowardsPosition(position, minIncrement, range) {
        if (!minIncrement)
            minIncrement = 5;
        var farthestPoint = this.desiredLocations.length == 0 ? this.gracz.position : this.desiredLocations[this.desiredLocations.length-1];
        var randomPointAround = this.game.navigationPlugin.getRandomPointAround(farthestPoint, range);
        while(farthestPoint.x < position.x) {
            while (randomPointAround.x < farthestPoint.x + minIncrement && farthestPoint.x < position.x)
                randomPointAround = this.game.navigationPlugin.getRandomPointAround(farthestPoint, range);
            this.moveToPosition(randomPointAround);
            farthestPoint = this.desiredLocations[this.desiredLocations.length-1];
        }
    }

    doEveryFrame = () => {
        if (this.desiredLocations.length > 0) {
            var delta = this.scene.getEngine().getDeltaTime()/1000.0;
            var diff = this.desiredLocations[0].subtract(this.gracz.position).normalize().multiplyByFloats(this.game.PLAYER_SPEED * 0.5 * delta,this.game.PLAYER_SPEED * 0.5 * delta,this.game.PLAYER_SPEED * 0.5 * delta);
            
            var xd = this.game.navigationPlugin.getClosestPoint(this.gracz.position.add(diff));
            this.applyMovement(xd);

            let direction = diff, alpha = Math.atan2(-1 * direction.x, -1 * direction.z);

            this.gracz.rotation.y = BABYLON.Scalar.LerpAngle(this.gracz.rotation.y,alpha,2*delta);
            if (xd.subtract(this.desiredLocations[0]).length() < 0.1) {
                this.forwardSpeed = 0;
                this.rightSpeed = 0;
                this.desiredLocations.splice(0, 1);
                if (this.game.onBotNowhereToGo) {
                    if (this.desiredLocations.length == 0) {
                        this.game.onBotNowhereToGo(this);
                    }
                }  
            }
        }
    }

    kill(imposter,direction,point) {
        if (this.game.onBotKilled) {
            this.game.onBotKilled(this);
        }
        super.kill(imposter,direction,point);
        setTimeout(() => this.respawn(), 3000);
    }

    respawn() {
        super.respawn();
        if (this.game.onBotRespawn) {
            this.game.onBotRespawn(this);
        }
    }

    dispose() {
        this.scene.unregisterBeforeRender(this.doEveryFrame);
        super.dispose();
    }

}