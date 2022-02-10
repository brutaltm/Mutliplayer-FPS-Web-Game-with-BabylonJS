const State = Object.freeze({ MENU: 0, GAME: 1, TRAINING: 2 });

import Player from "./Player.js";

export default class GUI {

    crosshair = [];
    health;
    messageBlocksAmount = 5;
    colorsNoEdit = ["red","green","blue","yellow","teal","purple","magenta","black","gray"];
    colors = ["red","green","blue","yellow","teal","purple","magenta","black","gray"];
    get color() {
        var c = this.colors.shift();
        this.colors.push(c);
        return c;
    }

    constructor(name, canvas, engine, camera, game) {
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(name);
        this.canvas = canvas;
        this.camera = camera;
        this.engine = engine;
        this.game = game;
        //this.advancedTexture.idealWidth = 960;
        this.setCrosshair(5,2,2,"black");
        this.advancedTexture.idealWidth = null;
        this.advancedTexture.idealHeight = null;
        //canvas.onresize = () => this.setCrosshair(3,"white");
        window.onresize = () => {
            console.log("Resized");
            engine.resize();
            this.setCrosshair(this.currentSettings.size,this.currentSettings.gap,this.currentSettings.thickness,this.currentSettings.color);
        };

        this.currentSettings = {
            size: 5,
            gap: 2,
            thickness: 2,
            color: "black"
        };

        this.createHUD(100);
        this.createPauseMenu();
        this.updateHealth(100,100);
    }

    createHUD(h) {
        this.health?.dispose();
        var leftSidePanel = new BABYLON.GUI.StackPanel();
        leftSidePanel.isVertical = true;
        leftSidePanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftSidePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        leftSidePanel.color = "black";
        leftSidePanel.width = "40%";
        leftSidePanel.ignoreLayoutWarnings = true;


        var chatMessages = new BABYLON.GUI.StackPanel();
        this.chatMessages = chatMessages;
        //chatMessages.background = "white";
        chatMessages.isVertical = true;
        chatMessages.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        //chatMessages.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        
        this.messageBlocks = [];
        for (var i=0; i<this.messageBlocksAmount; i++) {
            var mb = this.createMessageBlock("","");
            this.messageBlocks.push(mb);
            chatMessages.addControl(mb);
        }
        console.log("MessageBlocks: ", this.messageBlocks);

        var input = new BABYLON.GUI.InputText();
        input.width = "100%";
        input.maxWidth = "100%";
        input.height = "30px";
        input.autoStretchWidth = false;
        //input.text = "Write message...";
        input.background = "";
        input.color = "black";
        input.placeholderText = "Write message...";
        input.placeholderColor = "black";
        input.focusedBackground = "white";
        input.alpha = 0.7;
        input.textHighlightColor = "green";
        input.fontSize = 16;
        //input.focusedColor = "white";
        //input.background = "white";
        input.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        input.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.msgInput = input;
        input.onKeyboardEventProcessedObservable.add((eventData,eventState) => {
            switch(eventData.key) {
                case "Enter":
                    this.game.msg.body.message = input.text;
                    if (input.text) 
                        this.pushMessage("You",input.text,{ color: "gold", outlineWidth: 1, fontSize: 16, fontWeight: "bold", underline: false });
                    input.text = "";
                    break;
                default:
                    break;
            }
        })
        
        var rect1 = new BABYLON.GUI.Rectangle();
        rect1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        rect1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        rect1.color = "Orange";
        rect1.thickness = 0;
        rect1.height = "40px";
        rect1.width = "150px";

        this.advancedTexture.addControl(leftSidePanel);
        leftSidePanel.addControl(chatMessages);
        leftSidePanel.addControl(input);  
        leftSidePanel.addControl(rect1);


        

        var health = new BABYLON.GUI.TextBlock();
        health.text = ("__"+h).substr(-3) + " HP";
        health.color = "green";
        health.outlineColor = "black";
        health.fontSize = 30;
        health.outlineWidth = "1px";
        //health.top = this.canvas.height/2 + health.fontSizeInPixels;
        //health.left = 100;
        health.resizeToFit = true;
        health.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        health.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        health.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
        //health.paddingLeft = "2%";
        health.paddingRight = "30%";
        console.log("health: ",health);
        this.health = health;

        //this.advancedTexture.addControl(rect1);
        rect1.addControl(health);

        var uppperContainer = new BABYLON.GUI.Rectangle();
        uppperContainer.width = 1.0;
        uppperContainer.height = "100px";
        uppperContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        uppperContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        uppperContainer.thickness = 0;
        this.advancedTexture.addControl(uppperContainer);

        var scoresContainer = new BABYLON.GUI.Rectangle();
        scoresContainer.width = 0.4;
        scoresContainer.height = "85px";
        scoresContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        scoresContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoresContainer.thickness = 0;

        var scoresPanel = new BABYLON.GUI.StackPanel();
        scoresPanel.isVertical = false;
        scoresPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scoresPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoresPanel.height = "85px";

        scoresContainer.addControl(scoresPanel);

        this.teamScoreRects = [];

        uppperContainer.addControl(scoresContainer);

        var scoresContainer2 = new BABYLON.GUI.Rectangle();
        scoresContainer2.width = 0.4;
        scoresContainer2.height = "85px";
        scoresContainer2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scoresContainer2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoresContainer2.thickness = 0;
        this.scoresContainers = [scoresContainer,scoresContainer2];

        var scoresPanel2 = new BABYLON.GUI.StackPanel("ScoresPanel2");
        scoresPanel2.isVertical = false;
        scoresPanel2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        scoresPanel2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoresPanel2.height = "85px";
        this.scoresPanels = [scoresPanel,scoresPanel2];

        scoresContainer2.addControl(scoresPanel2);
        //this.teamScoreRects = [scoreRect];

        //this.addTeamScoreControl("Example Team 1",5,{ background: "green", isHighlighted: true }, { outlineWidth: 2, color: "gold" }, { outlineWidth: 2, color: "gold" });
        //this.addTeamScoreControl("Team Team 2",69, { background: "red" });

        uppperContainer.addControl(scoresContainer2);


        var rect2 = new BABYLON.GUI.Rectangle();
        rect2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        rect2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        rect2.color = "Black";
        rect2.background = "black";
        rect2.alpha = 0.5;
        
        rect2.height = "80px";
        rect2.width = 0.2;
        
        var time = new BABYLON.GUI.TextBlock();
        time.text = "1:00";
        time.color = "white";
        time.outlineColor = "black";
        time.outlineWidth = "1px";
        //time.outlineWidth = 1;
        time.fontSize = 60;
        rect2.addControl(time);
        this.time = time;


        uppperContainer.addControl(rect2);
        
        //this.advancedTexture.addControl(rect2);



        var panel = new BABYLON.GUI.StackPanel();
        panel.isVertical = false;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.color = "black";

        var rect3 = new BABYLON.GUI.Rectangle();
        rect3.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rect3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        //rect3.color = "Black";
        rect3.thickness = 0;
        rect3.height = "40px";
        rect3.width = "160px";
        rect3.addControl(panel);

        var ammo = new BABYLON.GUI.TextBlock();
        ammo.text = 30+"";
        ammo.color = "lightblue";
        ammo.outlineColor = "black";
        ammo.outlineWidth = 1;
        ammo.fontSize = 30;
        ammo.height = "40px";
        ammo.width = "60px";
        //ammo.resizeToFit = true;
        ammo.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        ammo.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
        this.ammo = ammo;
        panel.addControl(ammo);

        var by = new BABYLON.GUI.TextBlock();
        by.text = " / ";
        by.color = "black";
        by.fontSize = 60;
        by.height = "40px";
        by.width = "20px";
        panel.addControl(by);

        var reserve = new BABYLON.GUI.TextBlock();
        reserve.text = 9000+"";
        reserve.color = "lightblue";
        reserve.outlineColor = "black";
        reserve.outlineWidth = 1;
        reserve.fontSize = 30;
        reserve.height = "40px";
        reserve.width = "80px";
        reserve.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        //reserve.resizeToFit = true;
        this.reserve = reserve;
        panel.addControl(reserve);
        
        this.advancedTexture.addControl(rect3);

    }

    removeTeamScoreControl(team) {
        var rect = this.teamScoreRects.find(r => r.name == team);
        var color = rect.background;
        // this.colors.splice(this.colors.findIndex(color),1);
        // this.colors.unshift(color);
        if (!rect) {
            console.log("Brak takiego teamu: " + team);
            return;
        }
        rect.children.forEach(textBlock => {
            rect.removeControl(textBlock);
            textBlock.dispose();
        })
        rect.parent.removeControl(rect);
        this.teamScoreRects.splice(this.teamScoreRects.indexOf(rect),1);
        rect.dispose();
    }

    editTeamScoreControl(team,score,rectOptions,nameOptions,scoreOptions) {
        var teamRect = this.teamScoreRects.find(r => r.name == team);
        if (!teamRect)  {
            console.log("Team o tej nazwie nie istnieje");
            return;
        }
        var teamName = teamRect.children[0];
        var teamScore = teamRect.children[1];

        if (rectOptions) {
            for(const prop in rectOptions)
                teamRect[prop] = rectOptions[prop];
        }
        if (nameOptions) {
            for(const prop in nameOptions)
                teamName[prop] = nameOptions[prop];
        }
        if (scoreOptions) {
            for(const prop in scoreOptions)
                teamScore[prop] = scoreOptions[prop];
        }
        //console.log("Zmiana scora na GUI:",team,score,teamScore.text);
        if (score != null && score != undefined) //XDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD if (score) jak score był 0 to go nie zmieniało xddddd
            teamScore.text = ""+score;
        //console.log("Po zmianie:",teamScore.text);
    }

    addTeamScoreControl(team,score,rectOptions,nameOptions,scoreOptions) {
        var panel = this.scoresPanels.reduce((p,c) => c.children.length < p.children.length ? c : p, this.scoresPanels[0]);
        if (this.teamScoreRects.find(r => r.name == team))  {
            console.log("Team o tej nazwie już istnieje");
            return;
        }

        //console.log('Panele',panel,this.scoresPanels);
            
        var scoreRect2 = new BABYLON.GUI.StackPanel(team);
        scoreRect2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoreRect2.isVertical = true;
        scoreRect2.adaptWidthToChildren = true;
        scoreRect2.top = "1px";
        scoreRect2.height = "80px";
        scoreRect2.background = "";
        scoreRect2.color = "red";
        scoreRect2.shadowColor = "red";
        scoreRect2.highlightLineWidth = 3;
        

        if (rectOptions) {
            for(const prop in rectOptions)
                scoreRect2[prop] = rectOptions[prop];
        }

        this.teamScoreRects.push(scoreRect2);
        
        var teamScore1r = new BABYLON.GUI.TextBlock("",team);
        teamScore1r.color = "white";
        teamScore1r.fontSize = 16;
        //teamScore1r.top = "10px";
        //tbName.height = "20px";
        teamScore1r.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamScore1r.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        teamScore1r.textWrapping = false;
        teamScore1r.resizeToFit = true;
        teamScore1r.setPaddingInPixels(5,5,0,5);
        teamScore1r.outlineColor = "black";

        if (nameOptions) {
            for(const prop in nameOptions)
                teamScore1r[prop] = nameOptions[prop];
        }
        
        var teamScore2r = new BABYLON.GUI.TextBlock("",score+"");
        teamScore2r.color = "white";
        teamScore2r.fontSize = 50;
        //tbName.height = "20px";
        teamScore2r.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamScore2r.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        teamScore2r.textWrapping = false;
        teamScore2r.resizeToFit = true;
        teamScore2r.setPaddingInPixels(0,5,0,5);
        teamScore2r.outlineColor = "black";

        if (scoreOptions) {
            for(const prop in scoreOptions)
                teamScore2r[prop] = scoreOptions[prop];
        }

        scoreRect2.addControl(teamScore1r);
        scoreRect2.addControl(teamScore2r);
        panel.addControl(scoreRect2);

        if (panel == this.scoresPanels[0]) { // reverse order - From center(right) to left
            panel.children.unshift(panel.children.pop());
            scoreRect2.paddingLeft = "0px";
        }
        else
            scoreRect2.paddingRight = "0px";

        return scoreRect2;
    }

    createMessageBlock(name,content) {
        var mb = new BABYLON.GUI.StackPanel();
        mb.isVertical = false;
        mb.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        //mb.background = "gray";
        mb.width = "100%";
        mb.ignoreLayoutWarnings = true;
        mb.adaptHeightToChildren = true;

        var tbName = new BABYLON.GUI.TextBlock();
        tbName.color = "blue";
        tbName.text = name + ": ";
        tbName.fontSize = 16;
        //tbName.height = "20px";
        tbName.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        tbName.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        tbName.textWrapping = false;
        tbName.outlineColor = "black";
        tbName.resizeToFit = true;
        //tbName.fontWeight = "bold";

        var tbContent = new BABYLON.GUI.TextBlock();
        tbContent.color = "black";
        tbContent.text = content;
        tbContent.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        tbContent.fontSize = 16;
        tbContent.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        mb.addControl(tbName); mb.addControl(tbContent);
        //tbContent.textWrapping = true;
        tbContent.resizeToFit = true;
        tbContent.textWrapping = true;
        tbContent.outlineColor = "black";
        tbContent.width = "80%";
        //tbContent.widthInPixels = mb.widthInPixels - tbName.widthInPixels - 10;
        console.log(tbContent);
        //tbContent.widthInPixels = 200;//(mb.widthInPixels - tbName.widthInPixels);
        
        
        //mb.adaptWidthToChildren = true; 
        
        
        return mb;
    }

    updateHealth(h,hMax) {
        //this.health.text = ("__"+h).substr(-3) + " HP";
        this.health.text = h + " HP";
        hMax = hMax ? hMax : 100;

        this.health.color = h <= hMax/2 ? 
            "#FF"+ ("0"+Math.trunc((255*h/(hMax/2))).toString(16)).substr(-2)+"00" :
            "#"+ ("0"+Math.trunc((255*(hMax-h)/(hMax/2))).toString(16)).substr(-2) +"FF00";

            console.log("KOLOR: ",this.health.color);
    }

    updateTime(t) {
        this.time.text = Math.trunc(t/60)+":"+("0"+t%60).substr(-2);
    }

    updateWeapon(weapon) {
        this.updateAmmo(weapon.bullets,weapon.bulletsReserve);
    }

    updateAmmo(ammo,reserve) {
        this.ammo.text = ammo+"";
        if (reserve) 
            this.reserve.text = reserve+"";
    }

    pushMessage(name, content, options, optionsContent) {
        var oldMessage = this.messageBlocks.shift();
        this.chatMessages.removeControl(oldMessage);
        oldMessage.dispose();
        var mb = this.createMessageBlock(name,content);
        if (options) {
            for (const prop in options)
                mb.children[0][prop] = options[prop];
        }
        if (optionsContent) {
            for (const prop in optionsContent)
                mb.children[1][prop] = optionsContent[prop];
        }
        this.messageBlocks.push(mb);
        this.chatMessages.addControl(mb)
        console.log("New Message");
    }

    setCrosshair(size,gap,thickness,color) {
        console.log("CANVAS",this.canvas.width,this.canvas.height);
        this.crosshair.forEach(line => this.advancedTexture.removeControl(line));
        this.crosshair.length = 0;
        var center = {};

        if (this.canvas.width % 2 == 0) {
            center.Left = this.canvas.width/2 - 1;
            center.Right = this.canvas.width/2;
        } else {
            center.Left = Math.floor(this.canvas.width/2)+1-1;
            center.Right = Math.floor(this.canvas.width/2)+1;
        }

        if (this.canvas.height % 2 == 0) {
            center.Up = this.canvas.height/2 - 1;
            center.Down = this.canvas.height/2;
        } else {
            center.Up = Math.floor(this.canvas.height/2)+1;
            center.Down = Math.floor(this.canvas.height/2)+1;
        }

        console.log("Center",center);

        var crossLineW = new BABYLON.GUI.Line();
        crossLineW.x1 = center.Left - gap; 
        crossLineW.y1 = center.Up + 1;
        crossLineW.x2 = center.Left - gap - size;
        crossLineW.y2 = center.Up + 1;
        crossLineW.lineWidth = thickness;
        crossLineW.color = color;

        var crossLineE = new BABYLON.GUI.Line();
        crossLineE.x1 = center.Right + gap + 1;
        crossLineE.y1 = center.Up + 1;
        crossLineE.x2 = center.Right + gap + 1 + size;
        crossLineE.y2 = center.Up + 1;
        crossLineE.lineWidth = thickness;
        crossLineE.color = color;

        var crossLineN = new BABYLON.GUI.Line();
        crossLineN.x1 = center.Right;
        crossLineN.y1 = center.Up - gap;
        crossLineN.x2 = center.Right;
        crossLineN.y2 = center.Up - gap - size;
        crossLineN.lineWidth = thickness;
        crossLineN.color = color;

        var crossLineS = new BABYLON.GUI.Line();
        crossLineS.x1 = center.Right;
        crossLineS.y1 = center.Down + 1 + gap;
        crossLineS.x2 = center.Right;
        crossLineS.y2 = center.Down + 1 + gap + size;
        crossLineS.lineWidth = thickness;
        crossLineS.color = color;

        this.crosshair.push(crossLineW, crossLineE, crossLineN, crossLineS);
        this.currentSettings = {size: size, gap: gap, thickness: thickness, color: color};
        this.crosshair.forEach(line => this.advancedTexture.addControl(line));
    }

    createTextForMesh(text,offset,gracz,camera,scene) {
        var rect1 = new BABYLON.GUI.Rectangle();
        rect1.width = 0.3;
        rect1.height = "30px";
        rect1.cornerRadius = 20;
        rect1.color = "DarkGreen";
        rect1.isPointerBlocker = false;
        rect1.thickness = 0;
        this.advancedTexture.addControl(rect1);
    
        var label = new BABYLON.GUI.TextBlock();
        label.text = text;
        label.fontSize = 30;
        label.isPointerBlocker = false;
        rect1.addControl(label);
    
        //rect1.linkWithMesh(sphere);   
        //rect1.linkOffsetY = sphere.diameter;
        //console.log(gracz);
        var g = gracz.owner;
        g.nameplate = rect1;
        
        var tn = new BABYLON.TransformNode("nameplateTN",scene);
        tn.parent = gracz.owner.models[0];
        tn.position.y += 180;
        rect1.linkWithMesh(tn);
        gracz.owner.models[0].onBeforeRenderObservable.add(function () {
          var dist = gracz.position.subtract(camera.position).length();
          if (dist > 30) {
            rect1.scaleX = 0.0;
            //rect1.isVisible = false;
          }
          else {
            //rect1.scaleX = 0.0;
            //label.fontSize = 18 + 8.0/dist;
            //rect1.isVisible = false;
            rect1.scaleX = 8 * 1.0/dist;
            rect1.scaleY = 8 * 1.0/dist;
            //rect1.moveToVector3(gracz.position.add(new BABYLON.Vector3(0,offset,0)), scene);
        }
          //console.log(dist);
        })
        gracz.owner.nameplate = rect1;
    }

    createPauseMenu() {
        var pauseMenu = new BABYLON.GUI.Rectangle("Pause");
        pauseMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        pauseMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        pauseMenu.height = 0.6;
        pauseMenu.width = 0.3;
        pauseMenu.thickness = 0;
        pauseMenu.isVisible = false;
        pauseMenu.background = "black"; 
        pauseMenu.alpha = 0.5;
        this.pauseMenu = pauseMenu;

        const stackPanel = new BABYLON.GUI.StackPanel();
        stackPanel.width = .83;
        pauseMenu.addControl(stackPanel);

        const resumeBtn = BABYLON.GUI.Button.CreateSimpleButton("resume", "RESUME");
        resumeBtn.width = 0.6;
        resumeBtn.height = "44px";
        resumeBtn.color = "white";
        resumeBtn.fontFamily = "Viga";
        resumeBtn.paddingBottom = "14px";
        resumeBtn.cornerRadius = 14;
        resumeBtn.fontSize = "12px";
        resumeBtn.textBlock.resizeToFit = true;
        resumeBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        resumeBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        stackPanel.addControl(resumeBtn);

        resumeBtn.onPointerDownObservable.add(() => {
            this.pauseMenu.isVisible = false;
            this.advancedTexture.removeControl(pauseMenu);
            this.pauseMenu.isPointerBlocker = false;
            this.canvas.onclick = () => this.engine.enterPointerlock();
            //this.pauseBtn.isHitTestVisible = true;
        });

        var picker = new BABYLON.GUI.ColorPicker();
        picker.alpha = 1.0;
        picker.value = this.crosshair[0].color;
        picker.height = "100px";
        //picker.width = 0.2;
        picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        picker.onValueChangedObservable.add(color => {
            this.currentSettings.color = color.toHexString();
            this.crosshair.forEach(line => line.color = color.toHexString());
        });

        stackPanel.addControl(picker);

        var header = new BABYLON.GUI.TextBlock();
        header.text = "Sensitivity: " + this.camera.angularSensibility;
        header.height = "30px";
        header.color = "white";
        stackPanel.addControl(header); 

        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 1;
        slider.maximum = 10000;
        slider.step = 1;
        slider.value = this.camera.angularSensibility;
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add(value => {
            this.camera.angularSensibility = value;
            header.text = "Sensitivity: " + Math.trunc(this.camera.angularSensibility);
        });
        stackPanel.addControl(slider);    

        var headerSize = new BABYLON.GUI.TextBlock();
        headerSize.text = "Size: " + parseFloat(this.currentSettings.size).toPrecision(3);
        headerSize.height = "30px";
        headerSize.color = "white";
        stackPanel.addControl(headerSize); 

        var sliderSize = new BABYLON.GUI.Slider("crosshairSize");
        sliderSize.minimum = 0;
        sliderSize.maximum = 20;
        sliderSize.value = this.currentSettings.size;
        sliderSize.height = "20px";
        sliderSize.width = "200px";
        sliderSize.step = 0.1;
        sliderSize.onValueChangedObservable.add(value => {
            this.currentSettings.size = value;
            this.setCrosshair(value,this.currentSettings.gap,this.currentSettings.thickness,this.currentSettings.color);
            headerSize.text = "Size: " + parseFloat(value).toPrecision(3);//Math.trunc(value);
        });
        stackPanel.addControl(sliderSize);    

        var headerGap = new BABYLON.GUI.TextBlock();
        headerGap.text = "Gap: " + this.currentSettings.gap;
        headerGap.height = "30px";
        headerGap.color = "white";
        stackPanel.addControl(headerGap); 

        var sliderGap = new BABYLON.GUI.Slider("crosshairGap");
        sliderGap.minimum = 0;
        sliderGap.maximum = 10;
        sliderGap.value = this.currentSettings.gap;
        sliderGap.height = "20px";
        sliderGap.width = "200px";
        sliderGap.step = 0.1;
        sliderGap.onValueChangedObservable.add(value => {
            this.currentSettings.gap = value;
            this.setCrosshair(this.currentSettings.size,value,this.currentSettings.thickness,this.currentSettings.color);
            headerGap.text = "Gap: " + parseFloat(value).toPrecision(3);//Math.trunc(value);
        });
        stackPanel.addControl(sliderGap); 

        var headerThickness = new BABYLON.GUI.TextBlock();
        headerThickness.text = "Thickness: " + this.currentSettings.thickness;
        headerThickness.height = "30px";
        headerThickness.color = "white";
        stackPanel.addControl(headerThickness); 

        var sliderThickness = new BABYLON.GUI.Slider("crosshairThickness");
        sliderThickness.minimum = 0;
        sliderThickness.maximum = 10;
        sliderThickness.value = this.currentSettings.thickness;
        sliderThickness.height = "20px";
        sliderThickness.width = "200px";
        sliderThickness.step = 1;
        sliderThickness.onValueChangedObservable.add(value => {
            this.currentSettings.thickness = value;
            this.setCrosshair(this.currentSettings.size,this.currentSettings.gap,value,this.currentSettings.color);
            headerThickness.text = "Thickness: " + value;//Math.trunc(value);
        });
        stackPanel.addControl(sliderThickness); 

        const MainMenuBtn = BABYLON.GUI.Button.CreateSimpleButton("mainMenu", "QUIT TO MENU");
        MainMenuBtn.width = 0.6;
        MainMenuBtn.height = "58px";
        MainMenuBtn.color = "white";
        MainMenuBtn.fontFamily = "Viga";
        MainMenuBtn.paddingTop = "14px";
        MainMenuBtn.paddingBottom = "14px";
        MainMenuBtn.cornerRadius = 14;
        MainMenuBtn.fontSize = "12px";
        MainMenuBtn.textBlock.resizeToFit = true;
        MainMenuBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        MainMenuBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        stackPanel.addControl(MainMenuBtn);

        MainMenuBtn.onPointerDownObservable.add(() => {
            if (this.game.ws)
                this.game.ws.close();
            this.game.stateM.goToState(State.MENU);
            this.pauseMenu.isVisible = false;
            this.advancedTexture.removeControl(pauseMenu);
            this.pauseMenu.isPointerBlocker = false;
            //this.canvas.onclick = () => this.engine.enterPointerlock();
            //this.pauseBtn.isHitTestVisible = true;
        });
    }

    openTeamPickMenu(teams) {

        var teamsMenuBackground = new BABYLON.GUI.Rectangle();
        teamsMenuBackground.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamsMenuBackground.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamsMenuBackground.height = 0.8;
        teamsMenuBackground.width = 0.8;
        teamsMenuBackground.background = "black";
        teamsMenuBackground.thickness = 0;
        teamsMenuBackground.alpha = 0.8;

        var teamsMenu = new BABYLON.GUI.Rectangle();
        teamsMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamsMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamsMenu.height = 0.8;
        teamsMenu.width = 0.8;
        teamsMenu.thickness = 1;
        teamsMenu.color = "blue";
        teamsMenu.background = ""; 
        teamsMenu.alpha = 1.0;

        var teamList = new BABYLON.GUI.StackPanel("TeamList");
        teamList.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamList.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamList.isVertical = false;
        //teamList.adaptHeightToChildren = true;
        teamList.height = "100px";
        teamList.color = "red";

        teamsMenu.addControl(teamList);

        teams.forEach((t, i) => {
            var rect = new BABYLON.GUI.Rectangle();
            rect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            rect.width = "200px";
            rect.height = "100px";
            rect.color = this.teamScoreRects.find(r => r.name == t).background;//this.colors[i];

            var button = BABYLON.GUI.Button.CreateSimpleButton(t,t);
            button.width = "100px";
            button.height = "40px";
            button.color = "white";
            button.background = this.teamScoreRects.find(r => r.name == t).background;//this.colors[i];
            button.onPointerDownObservable.add(() => {
                
                teamsMenu.isVisible = false;
                this.advancedTexture.removeControl(teamsMenu);
                this.advancedTexture.removeControl(teamsMenuBackground);
                teamsMenu.isPointerBlocker = false;
                this.canvas.onclick = () => this.engine.enterPointerlock();
                //this.game.onTeamPicked(t);
                this.game.msg.body.action = { name: "TeamPicked", teamName: t };
                //this.game.player.team = t;
            });
            rect.addControl(button);
            teamList.addControl(rect);
        });

        this.advancedTexture.addControl(teamsMenuBackground);
        this.advancedTexture.addControl(teamsMenu);
    }

    showRespawnMenu() {

        var teamsMenuBackground = new BABYLON.GUI.Rectangle();
        teamsMenuBackground.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamsMenuBackground.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamsMenuBackground.height = "200px";
        teamsMenuBackground.width = "200px";
        teamsMenuBackground.background = "black";
        teamsMenuBackground.thickness = 0;
        teamsMenuBackground.alpha = 0.8;

        var teamsMenu = new BABYLON.GUI.Rectangle();
        teamsMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamsMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamsMenu.height = "200px";
        teamsMenu.width = "200px";
        teamsMenu.thickness = 1;
        teamsMenu.color = "blue";
        teamsMenu.background = ""; 
        teamsMenu.alpha = 1.0;

        var teamList = new BABYLON.GUI.StackPanel("TeamList");
        teamList.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        teamList.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        teamList.isVertical = true;
        //teamList.adaptHeightToChildren = true;
        //teamList.width = "100px";
        teamList.color = "red";

        teamsMenu.addControl(teamList);

        var button = BABYLON.GUI.Button.CreateSimpleButton("Respawn","Respawn");
        button.width = "150px";
        button.height = "40px";
        button.color = "white";
        button.background = "blue";
        button.onPointerDownObservable.add(() => {
            teamsMenu.isVisible = false;
            teamsMenuBackground.isVisible = false;
            teamsMenu.isPointerBlocker = false;
            teamsMenuBackground.isPointerBlocker = false;

            this.game.setUpTraining();
            this.game.player.respawn();
            var physicsEngine = this.game.scene.getPhysicsEngine();
            physicsEngine.removeImpostor(this.player.tempBox.physicsImpostor);
            this.player.tempBox.physicsImpostor.dispose();
            this.player.tempBox.physicsImpostor = null;
            this.player.tempBox.dispose();
            this.player.tempBox = null;
            
            this.advancedTexture.removeControl(teamsMenuBackground);
            this.advancedTexture.removeControl(teamsMenu);
            teamsMenu.dispose();
            teamsMenuBackground.dispose();
        });
        teamList.addControl(button);

        var button2 = BABYLON.GUI.Button.CreateSimpleButton("Quit","Quit to menu");
        button2.width = "150px";
        button2.height = "40px";
        button2.color = "white";
        button2.background = "red";
        button2.onPointerDownObservable.add(() => {
            this.advancedTexture.removeControl(teamsMenuBackground);
            this.advancedTexture.removeControl(teamsMenu);
            teamsMenu.dispose();
            teamsMenuBackground.dispose();
            this.game.stateM.goToState(State.MENU);
        });
        teamList.addControl(button2);
            

        this.advancedTexture.addControl(teamsMenuBackground);
        this.advancedTexture.addControl(teamsMenu);
    }

    pause() {
        this.pauseMenu.isVisible = true;
        this.advancedTexture.addControl(this.pauseMenu);
        this.pauseMenu.isPointerBlocker = true;
        //engine.enterPointerlock();
        //this.pauseBtn.isHitTestVisible = false;
    }
}
