class Player {

    scene;
    game;
    name;
    shootingInfo;
    weapon;
    bullets = [];
    rightSpeed = 0;
    forwardSpeed = 0;
    health = 100;
    maxHealth = 100;
    get position() { return this.gracz.position; }
    set position(pos) { this.applyMovement(pos); }

    gravity = -9.81;
    jumping = false;
    grounded = false;
    jumpForce = 0;

    team;

    constructor(scene, name, total, game) {
      this.name = name;
      this.scene = scene;
      this.game = game;

      this.shootingInfo = {
        lastBulletFired: 0,
        firing: false,
      };

      var gracz = BABYLON.MeshBuilder.CreateBox(name, { size: 0.1 }, scene);
      gracz.isVisible = true; gracz.isPickable = true;
      gracz.owner = this;
      gracz.checkCollisions = false;
      this.gracz = gracz;

      this.capsule = BABYLON.MeshBuilder.CreateCapsule(name, { height: 1.6, radius: 0.25 }, scene);
      this.capsule.setParent(gracz);
      this.capsule.checkCollisions = true;

      var fireRatePerMin = 600;

      this.weapon = {
        name: "Kałaszek",
        bulletsReserve: 900,//90,
        bulletsMagazine: 30,
        bullets: 30,
        fireRatePerMin: 600,
        betweenShots: 60 * 1000 / fireRatePerMin,
        damage: 30,
        reloading: false,
        reloadTime: 3000
      }

    }

    applyMovement(pos) {
      this.gracz.position = new BABYLON.Vector3(pos.x,pos.y,pos.z);
    }

    updateRotationOfPlayer(rotation) {
      this.gracz.rotation.y = Math.PI + rotation._y;
      this.xRot = rotation._x;
    }

    reload() {
      console.log(this.name + " zaczął przeładowywanie.");
      var diff = Math.min(this.weapon.bulletsMagazine, this.weapon.bullets + this.weapon.bulletsReserve) - this.weapon.bullets;
      if (diff > 0) {
        this.weapon.reloading = true;
        setTimeout(() => {
          this.weapon.bullets += diff;
          this.weapon.bulletsReserve -= diff;
          this.weapon.reloading = false;
        }, this.weapon.reloadTime);
      }
    }

    canShoot = () => this.weapon.bullets > 0 && !this.weapon.reloading;
    
    isAlive = () => this.health > 0;

    dealDamage(attacker,damage,imposter,direction,point) {
      if (!this.isAlive() || !this.game.canDealDamage(attacker,this)) return;
      this.health -= damage;
      console.log(this.name + " otrzymał " + damage + " obrażeń od " + attacker.name);
      if (this.health <= 0) {
          this.kill(attacker,imposter,direction,point);
      } else {
        this.game.server.updatePlayerState(this, ["health"]);
      }
      
    }

    kill(killer,imposter,direction,point) {
      this.health = 0;
      console.log(this.name + " umiera od " + killer.name);
      console.log(this.game.onPlayerKilled);
      if (this.game.onPlayerKilled) {
        this.game.onPlayerKilled(this,killer);
      }

      this.game.server.kill(this,killer,imposter,direction,point);
    }

    respawn() {
      console.log(this.name + " odradza się.");
      this.health = this.maxHealth;
      this.resetGun();
      if (this.game.onPlayerRespawning)
        this.game.onPlayerRespawning(this);
      this.game.server.respawn(this);
    }

    resetGun() {
      this.weapon.bulletsReserve = 900,
      this.weapon.bulletsMagazine = 30,
      this.weapon.bullets = 30,
      this.weapon.reloading = false;
    }

}

module.exports = Player;