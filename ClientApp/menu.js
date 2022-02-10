const State = Object.freeze({ MENU: 0, GAME: 1, TRAINING: 2, SURVIVAL: 3 });

export default class Menu {

    createScene(engine, canvas, stateM) {
        const scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        
        window.onresize = () => engine.resize();
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        advancedTexture.idealHeight = 720;
        //advancedTexture.idealWidth = 1280;

        const stackPanel = new BABYLON.GUI.StackPanel();
        stackPanel.isVertical = true;
        stackPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(stackPanel);

        const startBtn = BABYLON.GUI.Button.CreateSimpleButton("start", "MULTIPLAYER");
        startBtn.width = 0.5;
        startBtn.textBlock.fontSize = 30;
        startBtn.textBlock.resizeToFit = true;
        startBtn.textBlock.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        startBtn.textBlock.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        startBtn.height = "50px";
        startBtn.color = "white";
        startBtn.thickness = 1;
        startBtn.background = "#4242a1";
        startBtn.highlightColor = "green";
        startBtn.paddingTop = 5;
        startBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        startBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.addControl(startBtn);
        startBtn.onPointerEnterObservable.add(control => control.textBlock.color = "green");
        startBtn.onPointerOutObservable.add(control => control.textBlock.color = "white");

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => {
            //advancedTexture.dispose();
            //stateM.goToState(State.GAME, address);
            if (document.getElementById('servers')) {
                document.getElementById('servers').style.display = 'block';
                startBtn.textBlock.color = "white";
            } else {
                fetch('http://localhost:8088/servers',{ credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                console.log("Servers:",data);
                document.getElementById("servers")?.remove();
                var div = document.createElement("div");
                var table = document.createElement("table");
                div.id = "servers";
                div.appendChild(table);

                var r = document.createElement("tr");
                for (const prop in data.servers[0]) {
                    var th = document.createElement("th");
                    th.innerHTML = (prop+"").toUpperCase();
                    r.appendChild(th);
                }
                var th = document.createElement("th");
                th.style = "text-align: right";
                th.innerHTML = "OPTIONS";
                r.appendChild(th);
                //table.appendChild(r);
                var th2 = document.createElement("th");
                th2.style = "color: red; text-align: right";
                th2.innerHTML = "X";
                th2.onclick = () => div.style.display = 'none';

                r.appendChild(th2);
                table.appendChild(r);

                data.servers.forEach(s => {
                    var row = document.createElement("tr");
                    for (const prop in s) {
                        var td = document.createElement("td");
                        td.innerHTML = s[prop];
                        row.appendChild(td);
                    }
                    var td = document.createElement("td");
                    td.colSpan = 2;
                    td.style = "text-align: center; font-weight: bold";
                    var a = document.createElement("a");
                    a.innerHTML = "Join";
                    a.onclick = () => { 
                        if (this.authSessionID) {
                            div.style.display = 'none';
                            stateM.goToState(State.GAME,s.address,this.authSessionID); 
                            advancedTexture.dispose();
                        }
                    };
                    a.style = "border: 1px solid black; background: gray; padding: 5px; padding-left: 10px;padding-right: 10px"
                    if(this.authSessionID);
                        a.style.background = "green";
                    
                    td.appendChild(a);
                    row.appendChild(td);
                    table.appendChild(row);
                })
                document.body.appendChild(div);

                div.style.display = 'block';
                });
            }
            
            console.log("Klik");
        });

        const startBtn2 = BABYLON.GUI.Button.CreateSimpleButton("start", "TRAINING");
        startBtn2.width = 0.5;
        startBtn2.textBlock.fontSize = 30;
        startBtn2.textBlock.resizeToFit = true;
        startBtn2.textBlock.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        startBtn2.textBlock.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        startBtn2.height = "50px";
        startBtn2.color = "white";
        startBtn2.thickness = 1;
        startBtn2.background = "#4242a1";
        startBtn2.highlightColor = "green";
        startBtn2.paddingTop = 5;
        startBtn2.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        startBtn2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.addControl(startBtn2);
        startBtn2.onPointerEnterObservable.add(control => control.textBlock.color = "green");
        startBtn2.onPointerOutObservable.add(control => control.textBlock.color = "white");

       
        //this handles interactions with the start button attached to the scene
        startBtn2.onPointerDownObservable.add(() => {
            //div.style.display = 'none';
            stateM.goToState(State.TRAINING); 
            advancedTexture.dispose();
        });
		
		const startBtn3 = BABYLON.GUI.Button.CreateSimpleButton("start", "SURVIVAL");
        startBtn3.width = 0.5;
        startBtn3.textBlock.fontSize = 30;
        startBtn3.textBlock.resizeToFit = true;
        startBtn3.textBlock.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        startBtn3.textBlock.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        startBtn3.height = "50px";
        startBtn3.color = "white";
        startBtn3.thickness = 1;
        startBtn3.background = "#4242a1";
        startBtn3.highlightColor = "green";
        startBtn3.paddingTop = 5;
        startBtn3.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        startBtn3.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.addControl(startBtn3);
        startBtn3.onPointerEnterObservable.add(control => control.textBlock.color = "green");
        startBtn3.onPointerOutObservable.add(control => control.textBlock.color = "white");

       
        //this handles interactions with the start button attached to the scene
        startBtn3.onPointerDownObservable.add(() => {
            //div.style.display = 'none';
            stateM.goToState(State.SURVIVAL); 
            advancedTexture.dispose();
        });

        const loginStackPanel = new BABYLON.GUI.StackPanel();
        loginStackPanel.isVertical = false;
        loginStackPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        loginStackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        //loginStackPanel.width = "200px";
        loginStackPanel.height = "80px";
        advancedTexture.addControl(loginStackPanel);

        const loginButton = BABYLON.GUI.Button.CreateSimpleButton("login", "Log In");
        this.loginButton = loginButton;
        loginButton.textBlock.fontSize = 20;
        loginButton.textBlock.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT;
        loginButton.textBlock.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        loginButton.height = "40px";
        loginButton.width = "300px";
        loginButton.paddingRight = 10;
        loginButton.color = "white";
        loginButton.thickness = 0;
        loginButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        loginButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        loginButton.onPointerEnterObservable.add(control => control.color = "green");
        loginButton.onPointerOutObservable.add(control => control.color = "white");
        var popout = this.createLoginPopout(advancedTexture,engine)
        loginButton.onPointerDownObservable.add(() => {
            popout.isVisible = true;
        });
        loginStackPanel.addControl(loginButton);
        console.log(document.cookie);

        // fetch('http://localhost:8088/servers',{ credentials: 'include' })
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log("Servers:",data);
        //         // HTML way
        //         document.getElementById("servers")?.remove();
        //         var div = document.createElement("div");
        //         var table = document.createElement("table");
        //         div.id = "servers";
        //         div.appendChild(table);

        //         var r = document.createElement("tr");
        //         for (const prop in data.servers[0]) {
        //             var th = document.createElement("th");
        //             th.innerHTML = (prop+"").toUpperCase();
        //             r.appendChild(th);
        //         }
        //         var th = document.createElement("th");
        //         th.style = "text-align: right";
        //         th.innerHTML = "OPTIONS";
        //         r.appendChild(th);
        //         //table.appendChild(r);
        //         var th2 = document.createElement("th");
        //         th2.style = "color: red; text-align: right";
        //         th2.innerHTML = "X";
        //         th2.onclick = () => div.style.display = 'none';

        //         r.appendChild(th2);
        //         table.appendChild(r);

        //         data.servers.forEach(s => {
        //             var row = document.createElement("tr");
        //             for (const prop in s) {
        //                 var td = document.createElement("td");
        //                 td.innerHTML = s[prop];
        //                 row.appendChild(td);
        //             }
        //             var td = document.createElement("td");
        //             td.colSpan = 2;
        //             td.style = "text-align: center; font-weight: bold";
        //             var a = document.createElement("a");
        //             a.innerHTML = "Join";
        //             a.onclick = () => { 
        //                 if (this.authSessionID) {
        //                     stateM.goToState(State.GAME,s.address,this.authSessionID); 
        //                     advancedTexture.dispose();
        //                 }
                            
                        
        //             };
        //             a.style = "border: 1px solid black; background: green; padding: 5px; padding-left: 10px;padding-right: 10px"
        //             if(!this.authSessionID);
        //                 a.style.background = "gray";
                    
        //             td.appendChild(a);
        //             row.appendChild(td);
        //             table.appendChild(row);
        //         })
        //         document.body.appendChild(div);

        //         div.style.display = 'none';
        //     });

        fetch('http://localhost:8088/amILoggedIn',{ credentials: 'include' })
            .then(response => response.json())
            .then(data => console.log("AmILoggedIn:",data));

        var style = document.createElement('style');
        style.innerHTML = `
            #servers {
                background-color: #4242a1;
                bottom: 0;
                height: 50%;
                left: 0;
                margin: auto;
                position: absolute;
                top: 0;
                right: 0;
                border: 1px solid white;
                width: 70%;
                min-width: 600px;
            }
            
            table {
                border: 1px solid black;
                border-collapse: collapse;
                width: 100%;
            }
            
            th, td {
                color: white;
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #DDD;
            }

            th {
                background: blue;
            }

            th:hover, a:hover {
                cursor: pointer;
            }
            
            tr:hover {background-color: #4a4a5c;}`;
        document.head.appendChild(style);

        return scene;
    }

    createLoginPopout(advancedTexture,engine) {
        this.authSessionID = this.getCookie('AuthServerSessionID');
        if (this.authSessionID) {
            console.log("Jest sesja ", this.authSessionID);
            fetch('http://localhost:8088/authenticateUser',{ 
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionID: this.authSessionID }) 
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Authentication: ",data);
                    if(data.loggedIn == true) {
                        this.username = data.username;
                        this.loginButton.onPointerDownObservable.clear();
                        this.loginButton.textBlock.text = "Welcome "+this.username+" !";
                    } else {
                        this.authSessionID = null;
                    }
                });
        }

        const loginMenuRect = new BABYLON.GUI.Rectangle();
        this.loginMenuRect = loginMenuRect;
        loginMenuRect.top = "50px";
        loginMenuRect.background = "#4242a1"; 
        loginMenuRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        loginMenuRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        loginMenuRect.thickness = 1;
        loginMenuRect.color = "white";
        loginMenuRect.width = 0.4;
        //loginMenuRect.adaptHeightToChildren = true;
        loginMenuRect.height = "165px";
        loginMenuRect.isVisible = false;
        advancedTexture.addControl(loginMenuRect);

        const buttonClose = BABYLON.GUI.Button.CreateSimpleButton("X","x");
        buttonClose.width = "25px";
        buttonClose.height = "25px";
        buttonClose.setPadding(5,5,5,5);
        buttonClose.color = "white";
        //buttonClose.textBlock.
        buttonClose.thickness = 1;
        buttonClose.background = "red";
        buttonClose.textBlock.textHorizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        buttonClose.textBlock.textVerticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        buttonClose.fontSize = 16;
        buttonClose.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        buttonClose.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        buttonClose.onPointerDownObservable.add(() => {
            console.log("ASDASD");
            loginMenuRect.isVisible = false;
        });
        loginMenuRect.addControl(buttonClose);


        const loginMenu = new BABYLON.GUI.StackPanel();
        loginMenu.isVertical = true;
        loginMenu.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        loginMenu.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        loginMenu.isHitTestVisible = false;
        loginMenu.isPointerBlocker = false;
        //loginMenu.height = "400px";
        loginMenu.adaptWidthToChildren = true;
        loginMenu.isVisible = true;
        //loginMenu.background = "#4242a1"; 
        loginMenu.color = "white";

        //loginMenu.adaptHeightToChildren = true;
        loginMenuRect.addControl(loginMenu);

        const textBlock = new BABYLON.GUI.TextBlock("","Login Form");
        this.loginFormTextBlock = textBlock;
        textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock.width = 0.8;
        textBlock.height = "40px";
        textBlock.color = "white";
        loginMenu.addControl(textBlock);
        
        const inputEmail = new BABYLON.GUI.InputText();
        inputEmail.width = "80%";
        inputEmail.maxWidth = "80%";
        inputEmail.height = "40px";
        inputEmail.autoStretchWidth = false;
        //input.text = "Write message...";
        inputEmail.background = "#4a4a5c";
        inputEmail.color = "black";
        inputEmail.placeholderText = "Email";
        inputEmail.placeholderColor = "gray";
        inputEmail.focusedBackground = "#4a4a5c";
        inputEmail.focusedColor = "white";
        //inputLogin.alpha = 0.7;
        inputEmail.textHighlightColor = "green";
        inputEmail.fontSize = 16;
        inputEmail.paddingBottom = 5;
        inputEmail.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        inputEmail.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        loginMenu.addControl(inputEmail);

        const inputLogin = new BABYLON.GUI.InputText();
        inputLogin.width = "80%";
        inputLogin.maxWidth = "80%";
        inputLogin.height = "40px";
        inputLogin.autoStretchWidth = false;
        //input.text = "Write message...";
        inputLogin.background = "#4a4a5c";
        inputLogin.color = "black";
        inputLogin.placeholderText = "Login";
        inputLogin.placeholderColor = "gray";
        inputLogin.focusedBackground = "#4a4a5c";
        inputLogin.focusedColor = "white";
        //inputLogin.alpha = 0.7;
        inputLogin.textHighlightColor = "green";
        inputLogin.fontSize = 16;
        inputLogin.paddingBottom = 5;
        inputLogin.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        inputLogin.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        inputLogin.isVisible = false;
        loginMenu.addControl(inputLogin); 

        const inputPassword = new BABYLON.GUI.InputPassword();
        inputPassword.width = "80%";
        inputPassword.maxWidth = "80%";
        inputPassword.height = "40px";
        inputPassword.autoStretchWidth = false;
        //input.text = "Write message...";
        inputPassword.background = "#4a4a5c";
        inputPassword.color = "black";
        inputPassword.placeholderText = "Password";
        inputPassword.placeholderColor = "gray";
        inputPassword.focusedBackground = "#4a4a5c";
        //inputLogin.alpha = 0.7;
        inputPassword.textHighlightColor = "green";
        inputPassword.fontSize = 16;
        //input.focusedColor = "white";
        //input.background = "white";
        inputPassword.paddingBottom = 5;
        inputPassword.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        inputPassword.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        loginMenu.addControl(inputPassword);

        const loginRect = new BABYLON.GUI.Rectangle();
        loginRect.width = 0.8;
        loginRect.height = "45px";
        loginRect.paddingBottom = 5;
        loginRect.thickness = 0;
        loginMenu.addControl(loginRect);
        
        const login = BABYLON.GUI.Button.CreateSimpleButton("loginConfirm","Login");
        login.adaptWidthToChildren = true;
        login.adaptHeightToChildren = true;
        login.textBlock.width = "55px";
        login.textBlock.height = "25px";
        login.color = "black";
        login.thickness = 1;
        login.background = "green";
        login.textBlock.color = "white";
        login.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        login.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        login.onPointerDownObservable.add(() => {
            //console.log({ login: inputLogin.text, password: inputPassword.text });
            (login.textBlock.text == "Login" ? 
            fetch('http://localhost:8088/login', {
                method: 'POST', // or 'PUT'
                //mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login: inputEmail.text, password: inputPassword.text }),
            }) : 
            fetch('http://localhost:8088/register', {
                method: 'POST', // or 'PUT'
                //mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: inputEmail.text, username: inputLogin.text, password: inputPassword.text }),
            }))
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                
                if(data.loggedIn == true) {
                    var d = new Date();
                    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
                    document.cookie = `AuthServerSessionID=${data.sessionID}; expires=${d.toUTCString()}; path=/`;
                    this.authSessionID = data.sessionID;
                    this.username = data.username;
                    this.loginButton.onPointerDownObservable.clear();
                    this.loginButton.textBlock.text = "Welcome "+this.username;
                    this.loginMenuRect.isVisible = false;
                } else {
                    this.loginFormTextBlock.color = "red";
                    this.loginFormTextBlock.text = "Please enter correct data.";
                    if (data.username) {
                        inputLogin.color == "red";
                        console.log("Username taken.");
                    }

                    if (data.email) {
                        inputEmail.color == "red";
                        console.log("Email taken.");
                    }
                        
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        })
        loginRect.addControl(login);

        const noAccount = new BABYLON.GUI.TextBlock("","No Account?");
        noAccount.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        noAccount.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        noAccount.height = "20px";
        noAccount.resizeToFit = true;
        noAccount.color = "white";
        noAccount.onPointerEnterObservable.add(control => control.color = "green");
        noAccount.onPointerOutObservable.add(control => control.color = "white");
        noAccount.onPointerDownObservable.add(() => {
        
            console.log(noAccount.text);
            if (noAccount.text == "No Account?") {
                // loginMenu.addControl(inputLogin);
                // loginMenu.children.splice(loginMenu.children.indexOf(inputPassword),0,loginMenu.children.pop());
                inputLogin.isVisible = true;
                login.textBlock.text = "Register";
                noAccount.text = "Have an Account?";
                textBlock.text = "Register Form";
                loginMenuRect.height = "215px";
            } else {
                console.log("Tutaj");
                inputLogin.isVisible = false;
                login.textBlock.text = "Login";
                noAccount.text = "No Account?";
                textBlock.text = "Login Form";
                loginMenuRect.height = "165px";
            }
            noAccount._forcePointerUp();
        });
        loginRect.addControl(noAccount);

        return loginMenuRect;
    }

    getCookie(cname) {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return null;
      }
} 