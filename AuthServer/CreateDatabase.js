const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const saltRounds = 10;

let db = new sqlite3.Database('./authServer.db', (err) => {
	if (err) 
		console.error(err.message);
	else
		console.log('Connected to the authServer database.');
});

var createTableString = 
	'CREATE TABLE users (' +
	   'id INTEGER PRIMARY KEY,' +
	   'email TEXT NOT NULL UNIQUE,' + 
	   'username TEXT NOT NULL UNIQUE,' +
	   'password TEXT NOT NULL,' +
	   'admin INTEGER' +
	')';
	
var dropTableString = 'DROP TABLE users';
	
// bcrypt.hash('admin', saltRounds, (err, hash) => {
	// var insertString = 'INSERT INTO users (email,username,password,admin) VALUES (' + 
	// '\'bartosz.ruta8@o2.pl\',\'brutaltm\','+'\''+hash+'\',TRUE)';
	// console.log("Insert",insertString,'\n');
	// db.run(dropTableString);
	// db.run(createTableString, (e) => {
		// db.run(insertString);

		// db.close();
	// });
// });
db.all('SELECT * FROM users',(err, rows ) => {
    console.log(rows);   
});


