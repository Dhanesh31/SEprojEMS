const express = require('express');
const mysql = require('mysql');
const http = require('http');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
//const session = require('express-session');
//const popup=require('popups');
const app = express();
const csv = require("csv-parser");
const fs = require("fs");

const sessiion = require('express-session')
const flush = require('connect-flash')

//Google auth
//check lokesh
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '183043165157-m5ul62le4e9n124kmkaekj7mu29ee1k9.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);


var excel_results = [];
fs.createReadStream('F:\\Sem 6\\Software Engineering\\Elective Data.csv')
.pipe(csv({}))
.on('data', (data) => excel_results.push(data))
.on('end', () => {
	//console.log(excel_results);
});



//middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(sessiion({
	secret: 'secret',
	cookie: {maxage: 60000},
	resave: false,
	saveUninitialized: false
}))
app.use(flush());

//to send mail
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'noreplyems3@gmail.com',
		pass: 'i@am&groot'
	}
});


//connecting to database
const db = mysql.createConnection({
	host: 'se-database.cxhblp2ifoeq.us-east-1.rds.amazonaws.com',
	user: 'admin',
	password: 'noreply123',
	insecureAuth: true,
	database: 'mydb',
	multipleStatements: true
})

db.connect(err => {
	if (err) {
		console.error('Database connection error: ' + err.stack);
		return;
	}
	console.log('Database Connected');
})

app.post('/otp', (req, res) => {
	var mail = req.body.mail;
	var pwd = req.body.pwd;
	var role = req.body.role;
	var inotp = req.body.inotp;
	var otp = req.body.otp;

	if (inotp == otp) {
		console.log('Signup successful');
		if (role == "student") {
			var sql = "INSERT INTO student_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');
				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Student account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})

			});
			res.render('login', {message : ' '});
		}
		else if (role == "faculty") {
			var sql = "INSERT INTO faculty_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');

				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Faculty account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})
			});
			res.render('login' , {message : ''});
		}
		else {
			var sql = "INSERT INTO coord_login VALUES ('" + mail + "','" + pwd + "')";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');

				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Coordinator account created successfully.You can now access your portal"
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})
			});
			res.render('login', {message : ''});
		}
	}
	else {
		console.log('Signup Failed');
		res.render('login', {message : ''});
	}
})

app.post('/googlesignin', (req, res) => {
	let token = req.body.token;
	async function verify() {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID,
		});
		const payload = ticket.getPayload();
		const userid = payload['sub'];
	}
	verify()
		.then(() => {
			res.cookie('session-token', token);
			res.send('success')
		})
		.catch(console.error);

})

app.get('/pwdchange', (request, response) => {
	response.render("forgotpwd", {message : request.flash('message')});
})

let num = 0; //forgotpwd otp
app.post('/fpwd', (request, response) => {
	var mail = request.body.email;
	var pwd = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;
	var role = request.body.role;

	num = Math.floor(
		Math.random() * (9999 - 1000) + 1000
	);

	num = num.toString();

	var mailOptions = {
		from: 'noreplyems1@gmail.com',
		to: mail + '',
		subject: 'OTP for Password change',
		text: num + ''
	}

	if(pwd == pwdrpt)
	{
		transporter.sendMail(mailOptions, function (err, info) {
			if (err) {
				console.log(err);
			}
			else {
				console.log('email sent' + info.response);
			}
		})
	
		response.render('otp_forgot.ejs', {email : mail, pwd : pwd, pwdrpt : pwdrpt, role : role , otp : num})
	}
	else
	{
		request.flash('message', 'Password and Repeat Password Fields should be same');
		response.redirect('/pwdchange');
	}


})

app.post('/otppwd', (request, response) => {
	var otp = request.body.otp;
	console.log(otp);
	console.log(num);
	var email = request.body.email;
	var pwd = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;
	var role = request.body.role;
	var inotp = request.body.inotp;
	
	if (inotp == otp) {
		//response.send('Password changed successfully');

		
		if(role == 'coordinator')
		{
			var sql = "SELECT * FROM coord_login";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in accessing database', err);
					return;
				}
				for (i = 0; i < result.length; i++) {
					if (result[i].coord_email == email) {
						flag = 1;
						break;
					}
				}
	
				if (flag == 1) {
					var sql = "Update coord_login set coord_password = '" + pwd + "' where coord_email = '"+ email + "';";
					db.query(sql, (err, result, field) => {
						if (err) {
							console.log('Error in accessing database', err);

							return;
						}
						else{
							console.log('Password Changed Successfully', err);
							response.render('login',{message : ''});
						}
				
					});
				}
				else 
				{
					response.send('Cannot find email');
				}
		
			});
		}
		else if(role == 'student')
		{
			var sql = "SELECT * FROM student_login";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in accessing database', err);
					return;
				}
				for (i = 0; i < result.length; i++) {
					if (result[i].student_email == email) {
						flag = 1;
						break;
					}
				}
	
				if (flag == 1) {
					var sql = "Update student_login set student_pass = '" + pwd + "' where student_email = '"+ email + "';";
					db.query(sql, (err, result, field) => {
						if (err) {
							console.log('Error in accessing database', err);

							return;
						}
						else{
							console.log('Password Changed Successfully', err);
							response.render('login',{message : ''});
						}
				
					});
				}
				else 
				{
					response.send('Cannot find email');
				}
		
			});

		}
		else
		{
			var sql = "SELECT * FROM faculty_login";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in accessing database', err);
					return;
				}
				for (i = 0; i < result.length; i++) {
					if (result[i].faculty_email == email) {
						flag = 1;
						break;
					}
				}
	
				if (flag == 1) {
					var sql = "Update faculty_login set faculty_password = '" + pwd + "' where faculty_email = '"+ email + "';";
					db.query(sql, (err, result, field) => {
						if (err) {
							console.log('Error in accessing database', err);

							return;
						}
						else{
							console.log('Password Changed Successfully', err);
							response.render('login',{messsage : ''});
						}
					});
				}
				else 
				{
					response.send('Cannot find email');
				}
		
			});


		}
	}
	else {
		response.send('Sorry OTP is Wrong');
	}
})

app.get('/signupform', (request, response) => {
	response.render("signup");
})

app.post('/login_student', (request, response) => {
	var mail = request.body.email;
	request.session.mail = mail;
	var pwd = request.body.password;

	var flag = 0;
	var sql = "SELECT * FROM student_login";

	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in accessing database', err);
			return;
		}

		for (i = 0; i < result.length; i++) {
			if (result[i].student_email == mail && result[i].student_pass == pwd) {
				flag = 1;
				break;
			}
		}

		if (flag == 1) {
			response.render("stud_dash", {mailid : request.session.mail});
		}
		else {
			console.log("Login Failed");
			request.flash('message', 'Give your credentials correctly');
			response.redirect('/');
			//response.render("login");
			
			return;
		}

	});
})
app.get('/', (req, res) => {

	res.render('login', {message : req.flash('message')});
	//res.send("Hi");
})


// var req.session.mailcoord_email, req.session.mailfaculty_email;

app.post('/login_others', (request, response) => {
	var mail = request.body.email;
	request.session.mail = mail;
	var pwd = request.body.password;
	var role = request.body.role;

	var flag = 0;

	if (role.toString() == "faculty") {
		var sql = "SELECT * FROM faculty_login";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in accessing database', err);
				return;
			}

			for (i = 0; i < result.length; i++) {
				if (result[i].faculty_email == mail && result[i].faculty_password == pwd) {
					flag = 1;
					break;
				}
			}

			if (flag == 1) {
				response.render("faculty_dash" , {mailid : request.session.mail});
			}
			else {
				console.log("Login Failed");
				request.flash('message', 'Give your credentials correctly');
				response.redirect('/');
				//response.render("login");

			}
		});
	}
	else {
		var sql = "SELECT * FROM coord_login";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in accessing database', err);
				return;
			}

			for (i = 0; i < result.length; i++) {
				if (result[i].coord_email == mail && result[i].coord_password == pwd) {
					flag = 1;
					break;
				}
			}

			if (flag == 1) {
				response.render("coord_dash", {mailid : request.session.mail});
			}
			else {
				console.log("Login Failed");
				request.flash('message', 'Give your credentials correctly');
				response.redirect('/');
			}
		});
	}
})


app.get('/coord_edit', (req, res) => {

	var sql = "SELECT edit_profile FROM coord WHERE coord_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if (results.length==0)
			{
				res.render('profile',{name :'', dob :'', mobile :'', k:'0', Age:' ' , City:' ' , State :'', message : req.flash('message')});
			}
			else if(results[0].edit_profile==0)
			{
				res.render('profile',{name :'', dob :'', mobile :'', k:'0', Age:' ' , City:' ' , State :'', message : req.flash('message')});
			}
			else
			{
				var sql = "SELECT * FROM coord WHERE coord_email = '" + req.session.mail +"';";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						var name = results[0].coord_name;
						var dob = results[0].coord_dob;

						var mobile = results[0].coord_mobileno;
						var k;
						var Age = results[0].coord_age;
						var City = results[0].coord_city;
						var State = results[0].coord_state;
						var mail = results[0].coord_email;
						var gender = results[0].coord_gender;
						var edit_profile=results[0].edit_profile;

						if(gender == 'Male')
						{
							k='1';
						}
						else if(gender=='Female')
						{
							k='2';
						}
						else
						{
							k='3';
						}
						res.render('profile',{name : name, dob : dob, mobile : mobile, k : k, Age : Age, City : City , State : State, message : req.flash('message')});
					}

				});
			}
		}

	});
})

app.post('/coord_save', (req, res) => {
	var name = req.body.name;
	var dob = req.body.dob;
	var mobile = req.body.mobile;
	var k = req.body.Gender;
	var Age = req.body.Age;
	var City = req.body.City;
	var State = req.body.State;
	var mail = req.session.mail;
	var gender;
	var edit_profile=1

	if(k == '1')
	{
		gender = 'Male';
	}
	else if (k == '2')
	{
		gender = 'Female';
	}
	else
	{
		gender = 'Others';
	}

	var sql="Select * from coord where coord_email='"+req.session.mail+"';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length > 0)
			{
				var sql="update coord set coord_name = '"+ name +"',"+"coord_dob = '"+ dob + "'," + "coord_age = '" + Age + "', coord_mobileno = '" + mobile + "'," + "coord_gender = '" + gender + "'," + "coord_city ='"+ City + "'," + "coord_state ='"+ State + "' where coord_email='"+req.session.mail+"';";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Details Updated Successfully');
						req.flash('message', 'Profile Details Updated Successfully');
						res.redirect('/coord_edit');
					}

				});
			}
			else
			{
				var sql="insert into coord values('"+ name +"','"+ dob +"',"+ Age +",'"+ mail +"','"+ mobile +"','"+ gender +"','"+ City +"','"+ State +"'," + edit_profile + ");";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Inserted Successfully');
						//req.flash('name', name);
						req.flash('message', 'Profile Details Saved Successfully');
						res.redirect('/coord_edit');
						//res.redirect('/?valid=' + string)
					}

				});
			}
		}

	});


})

app.get('/stud_edit', (req, res) => {

	var sql = "SELECT edit_profile FROM student WHERE student_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if (results.length==0)
			{
				res.render('stud_profile',{roll_no : '', name : '', dob : '', mobile : '', k:'0', Age:'' , City:'' , State : '', sem : 'Select', dept : 'Select', message : req.flash('message')});
			}
			else if(results[0].edit_profile==0)
			{
				res.render('stud_profile',{roll_no : '', name :'', dob :'', mobile :'', k:'0', Age:' ' , City:' ' , State :'', sem : 'Select', dept : 'Select', message : req.flash('message')});
			}
			else
			{
				var sql = "SELECT * FROM student WHERE student_email = '" + req.session.mail +"';";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						var name = results[0].student_name;
						var dob = results[0].student_dob;
						// dob = dob +'';

						// for (var i=0; i<dob.length; i++)
						// {
						// 	console.log(dob.charAt(i));
						// }


						var mobile = results[0].student_mobileno;
						var k;
						var Age = results[0].student_age;
						var City = results[0].student_city;
						var State = results[0].student_state;
						var mail = results[0].student_email;
						var gender = results[0].gender;
						var edit_profile=results[0].edit_profile;
						var sem = results[0].student_sem;
						var dept = results[0].student_dept;
						var roll_no = results[0].roll_no;


						if(gender == 'Male')
						{
							k='1';
						}
						else if(gender=='Female')
						{
							k='2';
						}
						else
						{
							k='3';
						}
						res.render('stud_profile',{roll_no : roll_no, name : name, dob : dob, mobile : mobile, k : k, Age : Age, City : City , State : State, sem : sem, dept : dept, message : req.flash('message')});
					}

				});
			}
		}

	});
})

app.post('/stud_save', (req, res) => {
	var name = req.body.name;
	var dob = req.body.dob;
	var mobile = req.body.mobile;
	var k = req.body.Gender;
	var Age = req.body.Age;
	var City = req.body.City;
	var State = req.body.State;
	var mail = req.session.mail;
	var gender;
	var edit_profile=1
	var sem = req.body.sem;
	var dept = req.body.dept;
	var roll_no = req.body.rollno;
	var preference_given = 0;

	if(k == '1')
	{
		gender = 'Male';
	}
	else if (k == '2')
	{
		gender = 'Female';
	}
	else
	{
		gender = 'Others';
	}

	var sql="Select * from student where student_email='"+req.session.mail+"';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length > 0)
			{
				console.log('update');
				var sql="update student set roll_no = '" + roll_no + "'," + "student_name = '"+ name +"',"+"student_dob = '"+ dob + "'," + "student_age = '" + Age + "', student_mobileno = '" + mobile + "'," + "gender = '" + gender + "'," + "student_city ='"+ City + "'," + "student_state ='"+ State +"' where student_email='"+req.session.mail+"';" ;
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Student details updated successfully');
						req.flash('message', 'Profile Details Updated Successfully');
						res.redirect('/stud_edit');
					}

				});
			}
			else
			{
				var sql="insert into student values('"+ roll_no + "','" + name +"','"+ dob +"',"+ Age +",'"+ mail +"','" + dept + "'," + sem + ",'" + mobile +"','"+ gender +"','"+ City +"','"+ State +"'," + preference_given + "," + edit_profile + ");";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Inserted Successfully');
						//req.flash('name', name);
						req.flash('message', 'Profile Details Saved Successfully');
						res.redirect('/stud_edit');
						//res.redirect('/?valid=' + string)
					}

				});
			}
		}

	});


})


app.get('/faculty_edit', (req, res) => {

	var sql = "SELECT edit_profile FROM faculty WHERE faculty_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{	
			console.log(results.length);
			if (results.length==0)
			{
				res.render('faculty_profile',{name :'', dob :'', mobile :'', k:'0', Age:' ' , City:' ' , State :'', dept : 'Select', message : req.flash('message')});
			}
			else if(results[0].edit_profile==0)
			{
				res.render('faculty_profile',{name :'', dob :'', mobile :'', k:'0', Age:' ' , City:' ' , State :'', dept : 'Select', message : req.flash('message')});
			}
			else
			{
				var sql = "SELECT * FROM faculty WHERE faculty_email = '" + req.session.mail +"';";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						var name = results[0].faculty_name;
						var dob = results[0].faculty_dob;
						console.log(results[0].faculty_name);
						var mobile = results[0].faculty_mobileno;
						var k;
						var Age = results[0].faculty_age;
						var City = results[0].faculty_city;
						var State = results[0].faculty_state;
						var mail = results[0].faculty_email;
						var gender = results[0].gender;
						var edit_profile=results[0].edit_profile;
						var dept = results[0].faculty_dept;

						if(gender == 'Male')
						{
							k='1';
						}
						else if(gender=='Female')
						{
							k='2';
						}
						else
						{
							k='3';
						}
						res.render('faculty_profile',{name : name, dob : dob, mobile : mobile, k : k, Age : Age, City : City , State : State, dept : dept, message : req.flash('message')});
					}

				});
			}
		}

	});
})

app.post('/faculty_save', (req, res) => {
	var name = req.body.name;
	var dob = req.body.dob;
	var mobile = req.body.mobile;
	var k = req.body.Gender;
	var Age = req.body.Age;
	var City = req.body.City;
	var State = req.body.State;
	var mail = req.session.mail;
	var gender;
	var edit_profile=1
	var dept = req.body.dept;
	// var preference_given = 0;

	if(k == '1')
	{
		gender = 'Male';
	}
	else if (k == '2')
	{
		gender = 'Female';
	}
	else
	{
		gender = 'Others';
	}

	var sql="Select * from faculty where faculty_email='"+req.session.mail+"';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length > 0)
			{
				console.log('update');
				var sql="update faculty set faculty_name = '"+ name +"',"+"faculty_dob = '"+ dob + "'," + "faculty_age = '" + Age + "', faculty_mobileno = '" + mobile + "'," + "gender = '" + gender + "'," + "faculty_city ='"+ City + "'," + "faculty_state ='"+ State +"' where faculty_email='" + req.session.mail + "';";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Faculty Details updated successfully');
						req.flash('message', 'Profile Details Updated Successfully');
						res.redirect('/faculty_edit');
					}

				});
			}
			else
			{
				console.log('INSERT');
				var sql="insert into faculty (faculty_name,faculty_dob,faculty_age,faculty_email,faculty_dept,faculty_mobileno,gender,faculty_city,faculty_state, edit_profile) values('" + name +"','"+ dob +"',"+ Age +",'"+ mail + "','" + dept + "','" + mobile +"','"+ gender +"','"+ City +"','"+ State +"'," + edit_profile + ");";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						console.log('Inserted Successfully');
						//req.flash('name', name);
						req.flash('message', 'Profile Details Saved Successfully');
						res.redirect('/faculty_edit');
						//res.redirect('/?valid=' + string)
					}
				});
			}
		}
	});
})

app.get('/fac_choose', (req, res) => {

	var sql = "Select * from timer where role = 'faculty';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length == 0)
			{
				res.render("choosepref_done.ejs", {flag : 1});
			}
			else
			{
				
				var day = results[0].day;
				var month = results[0].month;
				var year = results[0].year;
				var hours = results[0].hours;
				var mins = results[0].mins;

				var date1 = new Date(year, month, day, hours, mins);
				date1.setMonth(date1.getMonth() - 1);
				date1.setMinutes( date1.getMinutes() + 30 );
				date1.setHours( date1.getHours() + 5 );
				var date2 = new Date();
				date2.setMinutes( date2.getMinutes() + 30 );
				date2.setHours( date2.getHours() + 5 );
				console.log(date1);
				console.log(date2);
				var diffTime = (date1 - date2);
				console.log(diffTime);

				if(diffTime < 0)
				{
					res.render("choosepref_done.ejs", {flag : 2});
				}
				
				else
				{
					day = Math.floor(diffTime / (1000 * 60 * 60 * 24));
					diffTime = diffTime % (1000 * 60 * 60 * 24);
					hours = Math.floor(diffTime / (1000 * 60 * 60));
					diffTime = diffTime % (1000 * 60 * 60);
					mins = Math.floor(diffTime / (1000 * 60));

					if(hours < 10)
					{
						hours = '0' + hours + '   :';
					}
					if(mins < 10)
					{
						mins = '0' + mins;
					}

					// var rem_time = "" + day + " days" + hours + " hours" + mins + " mins left" ;
					// console.log(rem_time);
					

					var sql = "SELECT faculty_dept FROM faculty WHERE faculty_email = '"+req.session.mail+"';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{	
							var dept=results[0].faculty_dept;
							var sql = "SELECT elective_id,elective_name, elective_sem, sent_faculties FROM elective WHERE elective_dept='" + dept + "' AND sent_faculties=" +1+ ";";
							db.query(sql, (err, results, field) => {
								if (err)
								{
									console.log(err);
									return;
								}
								else
								{	
									if(results.length>0){
										res.render('fac_choosepref', {message : req.flash('message'), results : JSON.stringify(results), days : day, hours: hours, mins : mins});
									}
									else{
										res.render("choosepref_done.ejs", {flag : 1});
									}
								}
							});
						}
					});
				}
			}
		}
	});
})

app.post('/fac_chooseelective', (req, res) => {
	
	var elective_id=req.body.elective_id;
	var sem=req.body.elective_sem;
	var f_id;
	var sql = "SELECT faculty_id FROM faculty WHERE faculty_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			f_id=results[0].faculty_id;
			var sql = "SELECT fac_limit FROM elective WHERE elective_id='" + elective_id +"';"; 
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					fac_limit=results[0].fac_limit;
					if(fac_limit>0)
					{
						var sql = "INSERT INTO facelec_pref VALUES(" + f_id + ",'" + elective_id + "'," + sem + ");";
						db.query(sql, (err, results, field) => {
							if (err)
							{
								console.log(err);
								console.log('Preference added successfully');
								req.flash('message', 'This preference has already been collected');
								res.redirect('/fac_choose');
								return;
							}
							else
							{
								var sql = "UPDATE elective SET fac_limit=fac_limit-1 WHERE elective_id='" + elective_id +"';"; 
								db.query(sql, (err, results, field) => {
									if (err)
									{
										console.log(err);
										return;
									}
									else
									{
										console.log('Preference added successfully');
										req.flash('message', 'Saved succesfully');
										res.redirect('/fac_choose');
									}
								});
							}
						});	
					}
					else
					{
						req.flash('message', 'This elective has already been chosen, please try another one');
						res.redirect('/fac_choose');
					}
				}
			});
		}
	});	
})

app.get('/coord_add', (req, res) => {
	res.render('coord_add', {message : req.flash('message'), results : JSON.stringify(excel_results)});
})

app.post('/addelective', (request, response) => {
	var elective_id = request.body.elective_id;
	var elective_name = request.body.elective_name;
	var elective_sem = request.body.elective_sem;
	var elective_dept = request.body.elective_dept;
	var credits = request.body.credits;
	var capacity = request.body.capacity;
	var sent_students=0;
	var sent_faculties=0;
	var faculty_limit = capacity/70;

	var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else {
			if (result.length != 0) {
				console.log('Elective already inserted cannot insert');
				request.flash('message', 'Elective already inserted, try adding a new one');
				response.redirect('/coord_add');
			}
			else {
				var sql = "INSERT INTO elective VALUES ('" + elective_id + "', '" + elective_name + "'," + elective_sem + ",'" + elective_dept + "'," + credits + "," + capacity + "," + faculty_limit + "," + sent_students + "," + sent_faculties + ")";
				db.query(sql, (err, result, field) => {
					if (err) {
						console.log(err);
						return;
					}
					console.log('Elective added successfully');
					request.flash('message', 'Saved succesfully');
					response.redirect('/coord_add');
				});

			}
		}
	});


})

app.get('/coord_remove', (req, res) => {

	var sql = "Select * from elective;";
	db.query(sql, (err, results, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else {
			res.render('coord_remove', {message : req.flash('message') , results : JSON.stringify(results)});
		}
	});
	
})

app.post('/remelective', (request, response) => {
	var elective_name = request.body.elective_name;
	var elective_sem = request.body.elective_sem;
	var elective_dept = request.body.elective_dept;

	var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else {
			if (result.length == 0) {
				console.log('No such elective exists');
				request.flash('message', 'No such elective exists');
				response.redirect('/coord_remove');
			}
			else {
				var sql = "SELECT elective_id FROM elective WHERE elective_name='" + elective_name + "' AND elective_sem=" + elective_sem + " AND elective_dept='" + elective_dept + "';";
				db.query(sql, (err, result, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						var sql = "delete from elective where elective_id='" + result[0].elective_id + "';";
						db.query(sql, (err, result, field) => {
							if (err) {
								console.log(err);
								return;
							}
							console.log('Elective removed successfully');
							request.flash('message', 'Elective removed successfully');
							response.redirect('/coord_remove');
						});
					}

				});

			}
		}
	});


});

app.get('/coord_stuents_send', (req, res) => {
	var results=0;
	var sem=0;
	var dept="NOTHING"

	var sql = "Select * from timer where role = 'faculty';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length == 0)
			{
				res.render("coord_group_students.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 3});
			}
			else
			{
				var currentTime = new Date();
				currentTime = currentTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
				var arr =  currentTime.split(",");
				var arr1 = arr[0].split("/");
				var arr2 = arr[1].split(":");
				var day = results[0].day;
				var month = results[0].month;
				var year = results[0].year;
				var hours = results[0].hours;
				var mins = results[0].mins;

				var date1 = new Date(year, month, day, hours, mins);
				date1.setMonth(date1.getMonth() - 1);
				date1.setMinutes( date1.getMinutes() + 30 );
				date1.setHours( date1.getHours() + 5 );
				var date2 = new Date();
				date2.setMinutes( date2.getMinutes() + 30 );
				date2.setHours( date2.getHours() + 5 );
				console.log(date1);
				console.log(date2);
				var diffTime = (date1 - date2);
				console.log(diffTime);

				if(diffTime < 0)
				{
					var sql = "delete from elective where elective_id not in(select elective_id from facelec_pref);";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							var sql = "Select * from timer where role = 'student';";
							db.query(sql, (err, results, field) => {
								if (err)
								{
									console.log(err);
									return;
								}
								else
								{
									if(results.length == 0)
									{
										res.render("coord_group_students.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 0});
									}
									else
									{
										var currentTime = new Date();
										currentTime = currentTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
										var arr =  currentTime.split(",");
										var arr1 = arr[0].split("/");
										var arr2 = arr[1].split(":");
										var day = results[0].day;
										var month = results[0].month;
										var year = results[0].year;
										var hours = results[0].hours;
										var mins = results[0].mins;
						
										var date1 = new Date(year, month, day, hours, mins);
										date1.setMonth(date1.getMonth() - 1);
										date1.setMinutes( date1.getMinutes() + 30 );
										date1.setHours( date1.getHours() + 5 );
										var date2 = new Date();
										date2.setMinutes( date2.getMinutes() + 30 );
										date2.setHours( date2.getHours() + 5 );
										console.log(date1);
										console.log(date2);
										var diffTime = (date1 - date2);
										console.log(diffTime);
						
										if(diffTime < 0)
										{
											var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept, sem from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no);";					
											db.query(sql, (err, results, field) => {
												if (err)
												{
													console.log(err);
													return;
												}
												else
												{
													res.render("coord_group.ejs",{flag : 2, results : results});
												}
						
											});
										}
										
										else
										{
											day = Math.floor(diffTime / (1000 * 60 * 60 * 24));
											diffTime = diffTime % (1000 * 60 * 60 * 24);
											hours = Math.floor(diffTime / (1000 * 60 * 60));
											diffTime = diffTime % (1000 * 60 * 60);
											mins = Math.floor(diffTime / (1000 * 60));
						
											if(hours < 10)
											{
												hours = '0' + hours + '   :';
											}
											if(mins < 10)
											{
												mins = '0' + mins;
											}
						
											var rem_time = "" + day + " days" + hours + " hours" + mins + " mins left" ;
											console.log(rem_time);
							
											res.render("coord_group_students.ejs",{message : req.flash('message'), flag : 1, currentTime : currentTime, rem_time : rem_time, days : day, hours: hours, mins : mins});
						
										}
						
									}
									
								}
						
							});
						}
				
					});
				}
				
				else
				{
					res.render("coord_group_students.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 3});
				}

			}
			
		}

	});



	


	
})

app.post('/groupelective_students', (req, res) => {

	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT * FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render("coord_group_students.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 0});
		}

	});
})

app.post('/student_setTime', (req, res) => {

	var day = req.body.day;
	var hours = req.body.hours;
	var mins = req.body.mins;
	var arr = day.split("-");
	var role = 'student';

	console.log(arr);
	console.log(hours);
	console.log(mins);

	var sql = "Delete from timer where role = 'student';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql = "Insert into timer values(" + arr[2] + "," + arr[1] + "," + arr[0] + "," + hours + "," + mins + ",'" + role + "');";
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					req.flash('message', 'Timer has been set and once it is over, you can view the preferences given by the students.');
					res.redirect('/coord_stuents_send');
				}
		
			});
			
		}

	});


	
})

app.post('/filter_student',(req, res) => {
	var sem = req.body.filter_sem;
	var dept = req.body.filter_dept;

	if(sem == 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept, sem from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no  and C.student_dept = '" + dept +"');";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group_students.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}
	else if(dept == 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept, sem from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no) and sem = " + sem + ";";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group_students.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}
	else
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id) as faculty_dept, sem from facelec_pref A where A.sem =" + sem + " and exists (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id  and C.faculty_dept = '" + dept +"');";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group_students.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}



})

app.post('/filter_faculty',(req, res) => {
	var sem = req.body.filter_sem;
	var dept = req.body.filter_dept;

	if(sem == 'ALL' &&  dept != 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id) as faculty_dept, sem from facelec_pref A where exists (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id  and C.faculty_dept = '" + dept +"');";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}
	else if(dept == 'ALL' && sem != 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id) as faculty_dept, sem from facelec_pref A where A.sem =" + sem + ";";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}

	else if(dept == 'ALL' && sem == 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id) as faculty_dept, sem from facelec_pref A;";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}

	else
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id) as faculty_dept, sem from facelec_pref A where A.sem =" + sem + " and exists (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id  and C.faculty_dept = '" + dept +"');";					
		db.query(sql, (err, results, field) => {
			if (err)
			{
				console.log(err);
				return;
			}
			else
			{
				res.render("coord_group.ejs",{flag : 2, results : results, filter_sem : sem, filter_dept : dept});
			}
	
		});
	}



})


app.get('/coord_group', (req, res) => {
	var results=0;
	var sem=0;
	var dept="NOTHING"
	console.log(dept);

	var sql = "Select * from timer where role = 'faculty';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length == 0)
			{
				res.render("coord_group.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 0});
			}
			else
			{
				var currentTime = new Date();
				currentTime = currentTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
				var arr =  currentTime.split(",");
				var arr1 = arr[0].split("/");
				var arr2 = arr[1].split(":");
				var day = results[0].day;
				var month = results[0].month;
				var year = results[0].year;
				var hours = results[0].hours;
				var mins = results[0].mins;

				var date1 = new Date(year, month, day, hours, mins);
				date1.setMonth(date1.getMonth() - 1);
				date1.setMinutes( date1.getMinutes() + 30 );
				date1.setHours( date1.getHours() + 5 );
				var date2 = new Date();
				date2.setMinutes( date2.getMinutes() + 30 );
				date2.setHours( date2.getHours() + 5 );
				console.log(date1);
				console.log(date2);
				var diffTime = (date1 - date2);
				console.log(diffTime);

				if(diffTime < 0)
				{
					var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.faculty_id, (select D.faculty_name from faculty D where A.faculty_id = D.faculty_id ) as faculty_name, (select C.faculty_dept from faculty C where A.faculty_id = C.faculty_id ) as faculty_dept, sem from facelec_pref A;";					
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							res.render("coord_group.ejs",{flag : 2, results : results, filter_sem : 'ALL', filter_dept : 'ALL'});
						}

					});
				}
				
				else
				{
					day = Math.floor(diffTime / (1000 * 60 * 60 * 24));
					diffTime = diffTime % (1000 * 60 * 60 * 24);
					hours = Math.floor(diffTime / (1000 * 60 * 60));
					diffTime = diffTime % (1000 * 60 * 60);
					mins = Math.floor(diffTime / (1000 * 60));

					if(hours < 10)
					{
						hours = '0' + hours + '   :';
					}
					if(mins < 10)
					{
						mins = '0' + mins;
					}

					var rem_time = "" + day + " days" + hours + " hours" + mins + " mins left" ;
					console.log(rem_time);
	
					res.render("coord_group.ejs",{message : req.flash('message'), flag : 1, currentTime : currentTime, rem_time : rem_time, days : day, hours: hours, mins : mins});

				}

			}
			
		}

	});

	
})

app.post('/groupelective', (req, res) => {

	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT * FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render("coord_group.ejs",{results : results, sem : sem, dept : dept, message : req.flash('message'), flag : 0});
		}

	});
})

app.post('/faculty_setTime', (req, res) => {

	var day = req.body.day;
	var hours = req.body.hours;
	var mins = req.body.mins;
	var arr = day.split("-");
	var role = 'faculty';

	console.log(arr);
	console.log(hours);
	console.log(mins);

	var sql = "Delete from timer where role = 'faculty';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql = "Insert into timer values(" + arr[2] + "," + arr[1] + "," + arr[0] + "," + hours + "," + mins + ",'" + role + "');";
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					req.flash('message', 'Timer has been set and once it is over, you can send the electives to the students');
					res.redirect('/coord_group');
				}
		
			});
			
		}

	});


	
})


app.post('/sendstudents' , (req, res) => {


	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT sent_students FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var i;
			for (i = 0; i < results.length; i++)
			{
			  	if (results[i].sent_students==0)
			  	{
					var sql = "UPDATE elective SET sent_students = 1 WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							console.log('Updated Successfully');
							req.flash('message', 'Electives are displayed in Student Portal');
							req.flash('sem', sem)
							req.flash('dept', dept)
							res.redirect(307, '/groupelective_students');
						}

					});
					break;
			  	}
			}
			if (i==results.length)
			{
				req.flash('message', 'Electives are already displayed in Student Portal');
				req.flash('sem', sem)
				req.flash('dept', dept)
				res.redirect(307, '/groupelective_students');
			}
		}

	});

})


app.post('/sendfaculties' , (req, res) => {


	var sem=req.body.sem;
	var dept=req.body.dept;

	var sql = "SELECT sent_faculties FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var i;
			for (i = 0; i < results.length; i++)
			{
			  	if (results[i].sent_faculties==0)
			  	{
					var sql = "UPDATE elective SET sent_faculties = 1 WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							console.log('Updated Successfully');
							req.flash('message', 'Electives are displayed in Faculty Portal');
							req.flash('sem', sem)
							req.flash('dept', dept)
							res.redirect(307, '/groupelective');
						}

					});
					break;
			  	}
			}
			if (i==results.length)
			{
				req.flash('message', 'Electives are already displayed in Faculty Portal');
				req.flash('sem', sem)
				req.flash('dept', dept)
				res.redirect(307, '/groupelective');
			}
		}

	});

})

app.get('/stud_view', (req, res) => {

	var sql = "SELECT roll_no FROM student WHERE student_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var roll_no=results[0].roll_no;
			var sql = "SELECT * FROM elec_pref WHERE roll_no = '" + roll_no + "';";
			db.query(sql, (err, result1, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					if(results.length==0){
						res.render('choosepref_done',{flag : 3});
					}
					
					var sql = "SELECT * FROM elective WHERE elective_id IN (SELECT elective_id FROM elec_pref WHERE roll_no = '" + roll_no + "');";
					db.query(sql, (err, result2, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							res.render("view_pref.ejs",{elec:result2, elecpref:result1});
						}
					});	
				}
			});	
			
			
		}
	});
})

app.get('/stud_choose', (req, res) => {

	var sql = "Select * from timer where role = 'student';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			if(results.length == 0)
			{
				res.render("choosepref_done.ejs", {flag : 1});
			}
			else
			{		
				var day = results[0].day;
				var month = results[0].month;
				var year = results[0].year;
				var hours = results[0].hours;
				var mins = results[0].mins;

				var date1 = new Date(year, month, day, hours, mins);
				date1.setMonth(date1.getMonth() - 1);
				date1.setMinutes( date1.getMinutes() + 30 );
				date1.setHours( date1.getHours() + 5 );
				var date2 = new Date();
				date2.setMinutes( date2.getMinutes() + 30 );
				date2.setHours( date2.getHours() + 5 );
				console.log(date1);
				console.log(date2);
				var diffTime = (date1 - date2);
				console.log(diffTime);

				if(diffTime < 0)
				{
					res.render("choosepref_done.ejs", {flag : 2});
				}
				
				else
				{
					day = Math.floor(diffTime / (1000 * 60 * 60 * 24));
					diffTime = diffTime % (1000 * 60 * 60 * 24);
					hours = Math.floor(diffTime / (1000 * 60 * 60));
					diffTime = diffTime % (1000 * 60 * 60);
					mins = Math.floor(diffTime / (1000 * 60));

					if(hours < 10)
					{
						hours = '0' + hours + '   :';
					}
					if(mins < 10)
					{
						mins = '0' + mins;
					}

					// var rem_time = "" + day + " days" + hours + " hours" + mins + " mins left" ;
					// console.log(rem_time);
					

					var sql = "SELECT preference_given FROM student WHERE student_email = '" + req.session.mail + "';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							if(results[0].preference_given==1){
								res.render("choosepref_done.ejs", {flag : 0});
							}
							else{
								var sql = "SELECT student_sem,student_dept FROM student WHERE student_email = '" + req.session.mail + "';";
								db.query(sql, (err, results, field) => {
									if (err)
									{
										console.log(err);
										return;
									}
									else
									{
										var sem=results[0].student_sem;
										var dept=results[0].student_dept;
										var sql = "SELECT elective_id,elective_name,sent_students FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
										db.query(sql, (err, results, field) => {
											if (err)
											{
												console.log(err);
												return;
											}
											else
											{
												var flag=0;
												for(var i=0;i<results.length;i++){
													if(results[i].sent_students==1){
														flag=1;
														break;
													}
												}
												if(flag==1){
													res.render("choose_pref.ejs",{results:results, message : req.flash('message'), days : day, hours: hours, mins : mins});
												}
												else{
													res.render("choosepref_done.ejs", {flag : 1});
												}
												
											}
										});
									}
								});
							}
						}
					});
				}
			}
		}
	});
})

app.post('/chooseelective', (req, res) => {
	
	var sql = "SELECT roll_no FROM student WHERE student_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			roll_no=results[0].roll_no;
		}
	});

	var sql = "SELECT student_sem,student_dept FROM student WHERE student_email = '" + req.session.mail + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sem=results[0].student_sem;
			var dept=results[0].student_dept;
			var sql = "SELECT elective_id,elective_name FROM elective WHERE elective_sem = " + sem + " AND elective_dept='" + dept + "';";
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					var i;
					let pref=[]
					for (i = 0; i < results.length; i++) {
						var elec=results[i].elective_id;
						pref[i]=req.body[elec];

						var sql = "INSERT INTO elec_pref VALUES('" + roll_no + "','" + elec + "'," + pref[i] + ");";
						db.query(sql, (err, results, field) => {
							if (err)
							{
								console.log(err);
								return;
							}
							// else
							// {
							// 	console.log("inserted successfully");
							// }
						});

					}

					var sql = "Select pref from elec_pref where roll_no = '"+ roll_no + "';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							var flag=0;
							var i;
							var j;
							for (i=0;i<results.length;i++)
							{
								for(j=i+1;j<results.length;j++)
								{
									if(results[i].pref==results[j].pref)
									{
										flag=1;
										break;
									}
								}
								if(flag==1)
								{
									break;
								}
							}

							if(flag==1)
							{
								var sql = "DELETE FROM elec_pref where roll_no = '"+roll_no+"';";
								db.query(sql, (err, results, field) => {
									if (err)
									{
										console.log(err);
										return;
									}
									else
									{
										req.flash('message', 'Same preference given for more than one elective');
										res.redirect('/stud_choose');
									}
								});
							}
							else
							{
								var sql = "UPDATE student SET preference_given=1 where roll_no = '"+roll_no+"';";
								db.query(sql, (err, results, field) => {
									if (err)
									{
										console.log(err);
										return;
									}
									else
									{
										res.render("choosepref_done.ejs", {flag : 0});
									}
								});
							}
						}
					});

				}
			});
		}
	});
})

app.get('/stud_profile', (req, res) => {
	res.send("GET method");
})


app.get('/gdash', checkAuthenticated, (req, res) => {
	let user = req.user;
	req.session.mail = user.email;
	res.render('stud_dash', {mailid : user.email});
})

app.get('/logout', (req, res) => {
	res.clearCookie('session-token');
	res.render('login', {message : ''});
})

function checkAuthenticated(req, res, next) {

	let token = req.cookies['session-token'];

	let user = {};
	async function verify() {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
		});
		const payload = ticket.getPayload();
		user.name = payload.name;
		user.email = payload.email;
		user.picture = payload.picture;
		var sql = "SELECT * FROM student_login WHERE student_email='" + user.email + "' AND student_pass='" + payload.sub + "';";
		db.query(sql, (err, result, field) => {
			if (err) {
				console.log('Error in changing database', err);
				return;
			}
			if(result.length == 0){
				var sql = "INSERT INTO student_login VALUES ('" + user.email + "','" + payload.sub + "')";
				db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				});
			}
		});

	}
	verify()
		.then(() => {
			req.user = user;
			next();
		})
		.catch(err => {
			res.redirect('/login')
		})
}

app.post('/signup', (request, response) => {
	var mail = request.body.email;
	var pwd = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;
	var role = request.body.role;


	var num = Math.floor(
		Math.random() * (9999 - 1000) + 1000
	);
	var num = num.toString();

	var mailOptions = {
		from: 'noreplyems1@gmail.com',
		to: mail + '',
		subject: 'OTP for Signup',
		text: num + ''
	}

	transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log(err);
		}
		else {
			console.log('email sent' + info.response);
		}
	})

	response.render('otp', { role: role, otp: num, mail: mail, pwd: pwd });
})


app.listen(5050, () => {
	console.log("Server listening");
})
