const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const express = require('express');
const bodyParser= require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors(
	{
		origin: ['http://127.0.0.1:5500', 'http://127.0.0.1:5501'], 
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		preflightContinue: true,
		credentials: true
	}
));

const session = require('express-session');
app.use(session(
	{
		secret: 'ssshhhhh',
		saveUninitialized: true, 
		cookie: { 
			path: '', 
			maxAge: 1000 * 60 * 60 * 24, 
			sameSite: 'none', 
			secure: false, 
			httpOnly: true 
		}, 
		resave: true
	}
));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let db = new sqlite3.Database('./authServer.db', (err) => {
	if (err) 
		console.error(err.message);
	else
		console.log('Connected to the authServer database.');
});

app.result = [];
app.listen(8088, function() { console.log('nasluchujemy na 8088'); });

app.get('/amILoggedIn', (req, resp) => {
	console.log(req.query);
	// if (req.body.sessionID && req.sessionStore.sessions[req.body.sessionID]) {
	// 	console.log("Autentykacja przez sztuczny cookie.");
	// }
	if (req.query.sessionID && req.sessionStore.sessions[req.query.sessionID]) {
		console.log("Autentykacja przez sztuczny cookie.");
	}
	//console.log(req.cookies);
	//resp.header('Access-Control-Allow-Credentials', true);
	//resp.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // only_one_url_here');
	// resp.header('Access-Control-Allow-Headers', 'Content-Type, POST, GET, OPTIONS, DELETE');

	if (req.session.email)
		resp.json({ message: "You are logged in.", loggedIn: true, email: req.session.email, username: req.session.username, admin: req.session.admin });
	else
		resp.json({ message: "You are not logged in.", loggedIn: false });
	resp.end();
});

app.post('/authenticateUser', (req, resp) => {
	if (req.body.sessionID && req.sessionStore.sessions[req.body.sessionID]) {
		var sessionA = req.sessionStore.sessions[req.body.sessionID];
		sessionA = JSON.parse(sessionA);
		resp.json({ message: "Authentication successful.", loggedIn: true, username: sessionA.username } );
		resp.end();
	} else {
		resp.json({ message: "Authentication not successful.", loggedIn: false });
		resp.end();
	}
});

app.get('/servers', (req, resp) => {
	// var insertServerString2 = "INSERT INTO servers (name,address,mode,map) VALUES ('TestowyTeam DM','127.0.0.1:7778','Team Deathmatch','training')";
	// db.run(insertServerString2);
	
	db.all(`SELECT * FROM servers`,(err,rows) => {
		if(err) {
			console.log("No such table - servers");
			var createTableString = 
				'CREATE TABLE servers (' +
					'id INTEGER PRIMARY KEY,' +
					'name TEXT NOT NULL UNIQUE,' + 
					'address TEXT NOT NULL UNIQUE,' +
					'mode TEXT NOT NULL,' +
					'map TEXT NOT NULL' +
				')';
			var insertServerString = "INSERT INTO servers (name,address,mode,map) VALUES ('TestowyFFA DM','127.0.0.1:7777','FFA Deathmatch','training')";
			db.run(createTableString, err => {
				db.run(insertServerString, err => {
					db.all(`SELECT * FROM servers`,(err,rows2) => {
						console.log("Servers: ",rows2);
						resp.json({ message: "Server list granted.", servers: rows2 });
						resp.end();
					});
				});
			});
		} else {
			console.log("Servers: ",rows);
			resp.json({ message: "Server list granted.", servers: rows });
			resp.end();
		}
		
	});
});

app.post('/login', (req, resp) => {
	db.all(`SELECT * FROM users WHERE email="${req.body.login}" LIMIT 1`,(err, rows) => {
		if (rows.length == 0) {
			resp.json({ message: "Bad login.", loggedIn: false });
			resp.end();
		} else {
			bcrypt.compare(req.body.password, rows[0].password, function(err, res) {
				if (res == true) {
					//req.session.regenerate((err) => {
						req.session.email = rows[0].email;
						req.session.username = rows[0].username;
						req.session.admin = rows[0].admin == true;
						resp.json({ message: "Login successful.", loggedIn: true, email: req.session.email, username: req.session.username, admin: req.session.admin, sessionID: req.sessionID });
						resp.end();
					//});
				} else {
					resp.json({ message: "Bad login.", loggedIn: false });
					resp.end();
				}
			});
		}
	});

});

app.get('/register', (req, resp) => {
	resp.setHeader('Content-Type', 'text/html');
	var html = `
		<form method="post">
			<ul>
			<li>
				<label for="username">Name:</label>
				<input type="text" id="username" username="user_name">
			</li>
			<li>
				<label for="email">E-mail:</label>
				<input type="email" id="email" name="email">
			</li>
			<li>
				<label for="password">Password:</label>
				<input type="password" id="password" name="password">
			</li>
			<li class="button">
				<button type="submit">Register</button>
			</li>
			</ul>
		</form>`;
	resp.send(html);
});

app.post('/register', (req, resp) => {
	var email = (req.body.email+"").toLowerCase();
	var username = (req.body.username+"").toLowerCase();
	db.all(`SELECT email,username FROM users WHERE lower(email)="${email}" OR lower(username)="${username}" LIMIT 1`,(err,rows) => {
		if (rows.length > 0) {
			resp.json({ message: "Username or email taken.", loggedIn: false, username: (rows[0].username+"").toLowerCase() == username, email: (rows[0].email+"").toLowerCase() == email });
			resp.end();
		} else {
			bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
				db.run(`INSERT INTO users (email,username,password,admin) VALUES ("${req.body.email}","${req.body.username}","${hash}",FALSE)`,(res,err) => {
					req.session.regenerate((err) => {
						req.session.email = email;
						req.session.username = username;
						req.session.admin = false;
						resp.json({ message: "Registration successful.", loggedIn: true, email: req.session.email, username: req.session.username, admin: false, sessionID: req.sessionID });
						resp.end();
					});
				});
			});
		}
	});
});

app.get('/logout', (req, resp) => {
	req.session.destroy((err) => {
		resp.json( { message: "Logged out.", loggedIn: false });
		resp.end();
	});
});