import Training from './src/gamemodes/training.js';
import Survival from './src/gamemodes/survival.js';
import Game from './src/gamemodes/game.js';
import Menu from './menu.js';

const State = Object.freeze({ MENU: 0, GAME: 1, TRAINING: 2, SURVIVAL: 3 });

var state, scene;
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas,true);

//engine.runRenderLoop(() => engine.displayLoadingUI());

class StateM {
  goToState(st, serverIP, authSessionID) {
    if (st == state) return;
    engine.stopRenderLoop();
    engine.runRenderLoop(() => engine.displayLoadingUI());
    state = st;

    if (scene != null) {
      scene.detachControl();
      scene.dispose();
    }
    
    switch(st) {
      case State.MENU:
        var menu = new Menu();
        scene = menu.createScene(engine, canvas, stateM);
        scene.executeWhenReady(() => {
          engine.stopRenderLoop();
          engine.runRenderLoop(() => scene.render());
          engine.hideLoadingUI();
        });
        break;
      case State.GAME:
        var game = new Game(stateM, serverIP, authSessionID);
        scene = game.createScene(engine, canvas);
        scene.executeWhenReady(() => {
          console.log("Ready");
          engine.stopRenderLoop();
          engine.runRenderLoop(() => scene.render());
          engine.hideLoadingUI();
        });
        break;
      case State.TRAINING:
        var training = new Training(stateM);
        scene = training.createScene(engine, canvas);
        scene.executeWhenReady(() => {
          console.log("Ready");
          engine.stopRenderLoop();
          engine.runRenderLoop(() => scene.render());
          engine.hideLoadingUI();
          training.setUpTraining();
        });
        break;
      case State.SURVIVAL:
          var survival = new Survival(stateM);
          scene = survival.createScene(engine, canvas);
          scene.executeWhenReady(() => {
            console.log("Ready");
            engine.stopRenderLoop();
            engine.runRenderLoop(() => scene.render());
            engine.hideLoadingUI();
            survival.setUpTraining();
          });
          break;
      default:
        console.log("Unknown State");
        break;
    }
  }
}

var stateM = new StateM();
stateM.goToState(State.MENU);
