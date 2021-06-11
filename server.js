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
const { RSA_NO_PADDING } = require('constants');
const CLIENT_ID = '183043165157-m5ul62le4e9n124kmkaekj7mu29ee1k9.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);


var excel_results = [];
fs.createReadStream('Elective Data.csv')
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
	host: 'test-database.cxhblp2ifoeq.us-east-1.rds.amazonaws.com',
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
	var feedback_given = 0;

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
				var sql="insert into student values('"+ roll_no + "','" + name +"','"+ dob +"',"+ Age +",'"+ mail +"','" + dept + "'," + sem + ",'" + mobile +"','"+ gender +"','"+ City +"','"+ State +"'," + preference_given + "," + edit_profile +  "," + feedback_given + ");";
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


app.get('/fac_view',(req,res) => {

	var sql = "SELECT faculty_id FROM faculty WHERE faculty_email = '" + req.session.mail + "';";
	db.query(sql, (err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			var fac_id=results[0].faculty_id;
			var sql = "SELECT * FROM facelec_pref WHERE faculty_id = '" + fac_id + "';";
			db.query(sql, (err,result1,field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					if(results.length==0){
						res.render('fac_choosepref_done',{flag : 3});
					}
					var sql = "select  elective_id, (select elective_name from elective B where B.elective_id = A.elective_id) as elective_name, (select credits from elective B where B.elective_id = A.elective_id) as credits,sem from facelec_pref A where faculty_id = '" + fac_id + "';";
					db.query(sql, (err, result2, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							res.render("fac_view_pref.ejs",{elec:result2, elecpref:result1});
						}
					});
				}
			});
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
				res.render("fac_choosepref_done.ejs", {flag : 1});
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
					res.render("fac_choosepref_done.ejs", {flag : 2});
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
										res.render('fac_choosepref.ejs', {message : req.flash('message'), results : JSON.stringify(results), days : day, hours: hours, mins : mins});
									}
									else{
										res.render("fac_choosepref_done.ejs", {flag : 1});
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
	var strength = 0;
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
						var sql = "INSERT INTO facelec_pref VALUES(" + f_id + ",'" + elective_id + "'," + sem + "," +  strength +");";
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
	res.render('coord_add',  {mailid : req.session.mail ,message : req.flash('message'), results : JSON.stringify(excel_results)});
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
	var faculty_limit = capacity/40;
	var feedback_enabled = 0;
	var mailid =request.body.mailid;

	var sql = "Select * from coord_login where coord_email = '" + mailid + "';";
	db.query(sql, (err, results, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else
		{
			if(results.length > 0)
			{
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
							var sql = "INSERT INTO elective VALUES ('" + elective_id + "', '" + elective_name + "'," + elective_sem + ",'" + elective_dept + "'," + credits + "," + capacity + "," + faculty_limit + "," + sent_students + "," + sent_faculties + "," + feedback_enabled + ")";
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
			}
			else
			{
				response.render('404_ejs');
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
			res.render('coord_remove', {message : req.flash('message') , results : JSON.stringify(results), mailid : req.session.mail});
		}
	});

})

app.post('/remelective', (request, response) => {
	var elective_name = request.body.elective_name;
	var elective_sem = request.body.elective_sem;
	var elective_dept = request.body.elective_dept;
	var mailid = request.body.mailid;

	var sql = "select * from coord_login where coord_email = '" + mailid + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log(err);
			return;
		}
		else
		{
			if (result.length > 0)
			{
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
			}
			else
			{
				response.render('404_ejs');
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
											var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept,(select C.student_sem from student C where A.roll_no = C.roll_no) as student_sem, pref from elec_pref A;";
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

	if(sem == 'ALL' && dept != 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept,(select C.student_sem from student C where A.roll_no = C.roll_no) as student_sem, pref from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no  and C.student_dept = '" + dept + "');";
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
	else if(dept == 'ALL' && sem != 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept,(select C.student_sem from student C where A.roll_no = C.roll_no) as student_sem, pref from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no  and C.student_sem = " + sem + ");";
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

	else if(dept == 'ALL' && sem == 'ALL')
	{
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept,(select C.student_sem from student C where A.roll_no = C.roll_no) as student_sem, pref from elec_pref A;";
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
		var sql = "Select A.elective_id, (select B.elective_name from elective B where A.elective_id = B.elective_id ) as elective_name, A.roll_no, (select D.student_name from student D where A.roll_no = D.roll_no ) as student_name, (select C.student_dept from student C where A.roll_no = C.roll_no) as student_dept,(select C.student_sem from student C where A.roll_no = C.roll_no) as student_sem, pref from elec_pref A where exists (select C.student_dept from student C where A.roll_no = C.roll_no  and C.student_dept = '" + dept + "' and C.student_sem = " + sem + ");";
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

app.get('/elective_list',(req,res)=>{


	var sql = "select A.sem as elective_sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as elective_dept, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id,(select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
	db.query(sql,(err,results,field)=>{
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql = "select A.roll_no ,(select B.student_name from student B where B.roll_no=A.roll_no) as student_name,(select B.student_sem from student B where B.roll_no=A.roll_no) as sem,(select B.student_dept from student B where B.roll_no=A.roll_no) as dept,A.elective_id,(select B.elective_name from elective B where A.elective_id=B.elective_id) as elective_name,A.faculty_id,(select B.faculty_name from faculty B where A.faculty_id=B.faculty_id) as faculty_name from assigned_electives A;";
			db.query(sql,(err,results_table,field)=>{
				if(err)
				{
					console.log(err);
					return;
				}
				else
				{
					res.render("elective_list.ejs",{results : JSON.stringify(results),results_table:results_table});
				}
			});
		}
	});
})

app.post('/filter_list',(req,res)=>{
	var sem = req.body.filter_sem;
	var dept = req.body.filter_dept;
	var elective_id = req.body.elective_id;
	var faculty_id = req.body.faculty_id;

	if(elective_id!='ALL')
	{
		var eid = "elective_id='"+elective_id+"'";
	}
	else
	{
		var eid =  'true';
	}

	if(dept!='ALL')
	{
		var d = "B.elective_dept='"+dept+"'";
	}
	else
	{
		var d ='true';
	}

	if(faculty_id!='ALL')
	{
		var fid = "faculty_id="+faculty_id+"";
	}
	else
	{
		var fid = 'true';
	}

	if(sem!='ALL')
	{
		var s = "B.elective_sem="+sem+"";
	}
	else
	{
		var s ='true';
	}

	var sql = "select A.sem as elective_sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as elective_dept, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id,(select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
	db.query(sql,(err,results,field)=>{
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql = "select A.roll_no ,(select B.student_name from student B where B.roll_no=A.roll_no) as student_name,(select B.student_sem from student B where B.roll_no=A.roll_no) as sem,(select B.student_dept from student B where B.roll_no=A.roll_no) as dept,A.elective_id,(select B.elective_name from elective B where A.elective_id=B.elective_id) as elective_name,A.faculty_id,(select B.faculty_name from faculty B where A.faculty_id=B.faculty_id) as faculty_name from assigned_electives A where     "+eid+" and "+fid+" and exists(select B.elective_id from elective B where A.elective_id=B.elective_id and "+s+" and "+d+");";
			db.query(sql,(err,results_table,field)=>{
				if(err)
				{
					console.log(err);
					return;
				}
				else
				{
					res.render("elective_list.ejs",{results : JSON.stringify(results),results_table:results_table});
				}
			});
		}
	});



})

app.get('/coord_assign',(req,res) =>{
	var columns = []
	var results=0;
	var sem=0;
	var dept="NOTHING"
	var sql = "select A.sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as dept_name, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id, (select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns, flag : 1});
		}

	});
})

app.post('/coord_assign_mail',(req,res)=>{

	var day = req.body.day;
	var hours = req.body.hours;
	var mins = req.body.mins;
	var arr = day.split("-");
	var role = 'elective';

	console.log(arr);
	console.log(hours);
	console.log(mins);

	var sql = "Delete from timer where role = 'elective';";
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
					req.flash('message', 'Timer for changing elective has been set and mail has been sent to the students.');
					res.redirect('/coord_assign');
				}

			});

		}

	});

	var sql = "select roll_no, (Select student_email from student B where A.roll_no = B.roll_no) as student_email from assigned_electives A;";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			for(var i = 0; i<results.length; i++)
			{
				var mailOptions = {
					from: 'noreplyems1@gmail.com',
					to: results[i].student_email + '',
					subject: 'Check your portal',
					text: 'Elective has been assigned to you for this semester and timer for changing elective has beeen set.  Please check your portal for finding the details'
				}

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					}
					else {
						console.log('email sent' + info.response);
					}
				})
			}


		}

	});

})

app.post('/coord_view_pref', (req, res) => {
	var columns = []
	var sem = req.body.elective_sem;
	var dept = req.body.elective_dept;


	//var sql = "select count(elective_id) as count from elective where elective_sem = (select student_sem from student where roll_no = (select roll_no from student where student_email = '" + req.session.mail + "')) and elective_dept = (select student_dept from student where roll_no = (select roll_no from student where student_email = '" + req.session.mail + "'));";
	var sql = "select count(elective_id) as count from elective where elective_sem = " + sem + " and elective_dept = '" + dept + "';";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql = '';
			var count = 0;
			if (results.length > 0)
			{
				count = results[0].count;
			}

			var columns = []
			console.log(count);

			for(var i = 1; i <= count; i++)
			{
				sql = sql + '(select count(B.pref) from elec_pref B where assigned = 0 and B.pref = ' + i +' and A.elective_id = B.elective_id) as Preference_' + i;
				if (i != count)
				{

					sql = sql + ', ';
				}
				columns.push('Preference_' + i);
			}

			console.log(columns);
			if(results.length > 0)
			{
				sql = "select A.elective_id, (select B.elective_sem from elective B where A.elective_id = B.elective_id) as elective_sem, (select B.elective_dept from elective B where A.elective_id = B.elective_id) as elective_dept,  (select B.elective_name from elective B where A.elective_id = B.elective_id) as elective_name," + sql + " from elec_pref A  where assigned = 0 and exists(select B.elective_dept from elective B where B.elective_id = A.elective_id and B.elective_dept = '" + dept +"' and B.elective_sem = " + sem + ") group by elective_id;";
			}
			else
			{
				sql = "select A.elective_id, (select B.elective_sem from elective B where A.elective_id = B.elective_id) as elective_sem, (select B.elective_dept from elective B where A.elective_id = B.elective_id) as elective_dept,  (select B.elective_name from elective B where A.elective_id = B.elective_id) as elective_name" + sql + " from elec_pref A  where assigned = 0 and exists(select B.elective_dept from elective B where B.elective_id = A.elective_id and B.elective_dept = '" + dept +"' and B.elective_sem = " + sem + ") group by elective_id;";
			}
			console.log(sql);
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					var sql1 = "select A.sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as dept_name, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id, (select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
					db.query(sql1, (err, results1, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							res.render("coord_assign.ejs",{results : JSON.stringify(results1), results_table : results, sem : sem, dept : dept, message : req.flash('message'), table_flag : 1, columns : columns, flag : 1});
						}

					});
					//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : results, sem : sem, dept : dept, message : req.flash('message'), table_flag : 1, columns : columns});
				}

			});
		}

	});
})

app.post('/coord_check_availability', (req, res) => {
	var columns = []
	var sem = req.body.elective_sem;
	var dept = req.body.elective_dept;

	var sql = "select A.sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as dept_name, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id, (select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A where exists(select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id and B.faculty_dept ='"+ dept + "') and sem = " + sem + ";";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			var sql1 = "select A.sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as dept_name, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id, (select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
			db.query(sql1, (err, results1, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					res.render("coord_assign.ejs",{results : JSON.stringify(results1), results_table : results, sem : sem, dept : dept, message : req.flash('message') ,table_flag : 0, columns : columns, flag : 1});
				}

			});
			//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : results, sem : sem, dept : dept, message : req.flash('message') ,table_flag : 0, columns : columns});
		}

	});
})

app.post('/coord_final_assign', (req, res) =>{
	var columns = []
	var sem = req.body.elective_sem;
	var dept = req.body.elective_dept;

	var elective_id = req.body.elective_id;
	var preference = req.body.preference;
	var strength = req.body.strength;
	var faculty_id = req.body.faculty_id;

	var sql = "select roll_no from elec_pref where elective_id = '" + elective_id + "' and pref = " + preference + " and assigned = 0 ORDER BY pref_time ASC Limit " + strength + ";";
	db.query(sql, (err, results, field) => {
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns});

			for(var i = 0; i < results.length; i++)
			{
				var sql = "insert into assigned_electives values('" + results[i].roll_no + "','" + elective_id + "'," + faculty_id + ");";
				db.query(sql, (err, results, field) => {
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{
						//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns});
					}

				});

			}
			var sql = "select * from elec_pref where elective_id = '" + elective_id + "' and pref = "+ preference + " and assigned = 0 ORDER BY pref_time ASC Limit " + strength + ";";
			console.log(sql);
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns});
					var sql = "update facelec_pref set strength = strength + " + results.length + " where faculty_id = " + faculty_id + " and elective_id = '" + elective_id + "';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns});
						}

					});
				}

			});

			var sql = "update elec_pref A set assigned = 1 where A.roll_no = (select roll_no from assigned_electives B where A.roll_no = B.roll_no)";
			db.query(sql, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					//res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : [], sem : sem, dept : dept, message : req.flash('message'), table_flag : 0, columns : columns});
				}

			});

			var sql1 = "select A.sem, (select B.faculty_dept from faculty B where A.faculty_id = B.faculty_id) as dept_name, A.elective_id, (select B.elective_name from elective B where B.elective_id = A.elective_id) as elective_name, A.faculty_id, (select B.faculty_name from faculty B where A.faculty_id = B.faculty_id) as faculty_name, A.strength  from facelec_pref A ;";
			db.query(sql1, (err, results, field) => {
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					res.render("coord_assign.ejs",{results : JSON.stringify(results), results_table : results, sem : sem, dept : dept, message : req.flash('message'), table_flag : 1, columns : columns, flag : 0});
				}

			});


		}

	});
})

app.get('/coord_elecchange',(req,res)=>{

	var sql = "Select * from timer where role = 'elective';";
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
				res.render('coord_change.ejs',{results : results, flag : 0, display_flag : 0});
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
					var flag=0;
					console.log(req.session.mail);
					var sql="SELECT * FROM elec_change;";
					db.query(sql,(err,results,field) => {
						if(err)
						{
							console.log(err);
							return;
						}
						else if(results.length>0)
						{
							flag=1;
							res.render('coord_change.ejs',{results : results, flag : flag, display_flag : 1 });
						}
						else
						{
							res.render('coord_change.ejs',{results: results, flag : flag, display_flag : 1 });
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

					res.render('coord_change.ejs',{results : results, flag : 0, display_flag : 2, currentTime : currentTime, rem_time : rem_time, days : day, hours: hours, mins : mins});

				}

			}
		}
	})

})

app.post('/coord_reassign',(req,res) =>{

	var sql="SELECT * FROM elec_change;";
	db.query(sql,(err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			for(var i=0;i<results.length;i++){
				if(results[i].new_facid==0){
					for(var j=0;j<results.length;j++){
						if(results[j].new_facid==0 && (results[i].new_elective == results[j].current_elective)){
							var sql="UPDATE elec_change SET new_facid='" + results[j].curr_facid + "' WHERE roll_no='" + results[i].roll_no + "';";
							db.query(sql,(err,results,field) => {
								if(err)
								{
									console.log(err);
									return;
								}
								else
								{
									// console.log("Change 1 for" + i);
								}
							});
							var sql="UPDATE elec_change SET new_facid='" + results[i].curr_facid + "' WHERE roll_no='" + results[j].roll_no + "';";
							db.query(sql,(err,results,field) => {
								if(err)
								{
									console.log(err);
									return;
								}
								else
								{
									// console.log("Change 2 for" + i);
								}
							});
						}
					}
				}
			}
			var sql="SELECT * FROM elec_change;";
			db.query(sql,(err,results,field) => {
				if(err)
				{
					console.log(err);
					return;
				}
				else
				{
					var f=0;
					for(var i=0;i<results.length;i++){
						if(results[i].new_facid!=0){
							console.log(results[i].new_elective);
							var sql="UPDATE assigned_electives SET elective_id='" + results[i].new_elective + "', faculty_id=" + results[i].new_facid + " WHERE roll_no='" + results[i].roll_no + "';";
							db.query(sql,(err,results,field) => {
								if(err)
								{
									console.log(err);
									return;
								}
								else
								{
									// console.log("Changed assigned");
									f=1;
								}
							});
						}
					}
					res.render("choosepref_done.ejs", {flag : 0});
				}
			});
		}
	});
})

app.get('/assigned_elective',(req,res)=>{
	var flag=0;
	console.log(req.session.mail);
	var sql="select B.elective_id,(select C.elective_name from elective C where C.elective_id=B.elective_id) as elective_name,B.faculty_id,(select D.faculty_name from faculty D where D.faculty_id=B.faculty_id) as faculty_name from assigned_electives B where exists(select A.roll_no from student A where A.roll_no = B.roll_no and A.student_email='"+req.session.mail+"');";
	db.query(sql,(err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else if(results.length>0)
		{
			flag=1;
			res.render('assigned_elective',{results : results,mailid : req.session.mail,flag : flag });
		}
		else
		{
			res.render('assigned_elective',{results: results,mailid : req.session.mail,flag : flag });
		}
	});
})

app.get('/change_elective',(req,res)=>{
	var sql = "select * from timer where role = 'elective';";
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

					var sql = "SELECT student_dept, student_sem FROM student WHERE student_email = '"+req.session.mail+"';";
					db.query(sql, (err, results, field) => {
						if (err)
						{
							console.log(err);
							return;
						}
						else
						{
							var dept=results[0].student_dept;
							var sem=results[0].student_sem;
							var sql = "SELECT elective_id,elective_name, elective_sem, sent_students FROM elective WHERE elective_dept='" + dept + "' AND elective_sem=" + sem + " AND sent_students=" +1+ ";";
							db.query(sql, (err, results, field) => {
								if (err)
								{
									console.log(err);
									return;
								}
								else
								{
									var elective_id;
									var elective_name;
									var sql = "select B.elective_id,(select C.elective_name from elective C where C.elective_id=B.elective_id) as elective_name from assigned_electives B where exists(select A.roll_no from student A where A.roll_no = B.roll_no and A.student_email='" + req.session.mail + "');";
									db.query(sql, (err, result2, field) => {
										if (err)
										{
											console.log(err);
											return;
										}
										else
										{
											elective_id=result2[0].elective_id;
											elective_name=result2[0].elective_name;
											if(results.length>0){
												res.render('stud_elecchange.ejs', {message : req.flash('message'), results : results, elective_id : elective_id, elective_name : elective_name, days : day, hours: hours, mins : mins});
											}
											else{
												res.render("choosepref_done.ejs", {flag : 1});
											}
										}
									});
								}
							});
						}
					});
				}
			}
		}
	});
})

app.post('/stud_changeelec',(req,res) =>{
	var curr_elec = req.body.curr_elective;
	var change_elec = req.body.elective_change;

	var sql="SELECT roll_no FROM student WHERE student_email='" + req.session.mail + "';";
	db.query(sql,(err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			roll_no=results[0].roll_no;

			var sql="SELECT faculty_id FROM assigned_electives WHERE roll_no='" + roll_no + "';";
			db.query(sql,(err,results,field) => {
				if(err)
				{
					console.log(err);
					return;
				}
				else
				{
					curr_facid=results[0].faculty_id;
					var sql="INSERT INTO elec_change VALUES ('" + roll_no + "', '" + curr_elec + "', '" + change_elec + "', " + curr_facid + ", " + 0 + ");";
					db.query(sql,(err,results,field) => {
						if(err)
						{
							console.log(err);
							return;
						}
						else
						{
							res.render('choosepref_done',{flag : 0});
						}
					});
				}
			});
		}
	});


})

app.get('/faculty_elective',(req,res) =>{
	res.render('faculty_elective',{flag : 2 , sem : 0});
})

app.post('/fac_student',(req,res) =>{
	var sem = req.body.faculty_sem;
	var flag = 0;

	var sql="select B.elective_id,(select C.elective_name from elective C where C.elective_id=B.elective_id) as elective_name,(select C.elective_sem from elective C where C.elective_id=B.elective_id) as sem,(select C.elective_dept from elective C where C.elective_id=B.elective_id) as dept from assigned_electives B where exists(select A.faculty_id from faculty A where A.faculty_id=B.faculty_id and A.faculty_email='"+req.session.mail+"') and exists(select C.elective_sem from elective C where C.elective_id=B.elective_id and C.elective_sem = "+sem+") group by elective_id;";

	db.query(sql,(err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render('faculty_elective',{results: results,flag : flag, sem : sem});
		}
	});
})

app.post('/fac_elective',(req,res) =>{
	var sem = req.body.faculty_sem;
	var flag = 1;

	var sql="select B.roll_no,(select C.student_name from student C where C.roll_no=B.roll_no) as student_name,(select C.student_sem from student C where C.roll_no=B.roll_no) as sem,(select C.student_dept from student C where C.roll_no=B.roll_no) as dept from assigned_electives B where exists(select A.faculty_id from faculty A where A.faculty_id=B.faculty_id and A.faculty_email='"+req.session.mail+"') and exists(select C.elective_sem from elective C where C.elective_id=B.elective_id and C.elective_sem = "+sem+");";

	db.query(sql,(err,results,field) => {
		if(err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render('faculty_elective',{results: results,flag : flag, sem : sem});
		}
	});
})

app.get('/student_feedback', (req, res) => {

	var sql = "select * from assigned_electives where roll_no = (select roll_no from student where student_email = '" + req.session.mail +"');";
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
				res.render("student_feedback.ejs", {flag : 0});
			}
			else
			{
				var sql="select elective_id from assigned_electives A where roll_no = (select roll_no from student where student_email = '" + req.session.mail + "') and exists(select elective_id from elective B where A.elective_id = B.elective_id and B.feedback_given = 1);";
				db.query(sql,(err,results,field) => {
					if(err)
					{
						console.log(err);
						return;
					}
					else
					{
						if(results.length == 0)
						{
							res.render("student_feedback.ejs", {flag : 3});
						}
						else
						{
							var sql = "select roll_no from student where student_email = '" + req.session.mail +"' and feedback_given = 1;"
							db.query(sql, (err, results, field) =>
							{
								if (err)
								{
									console.log(err);
									return;
								}
								else
								{
									if (results.length > 0)
									{
										res.render("student_feedback.ejs", {flag : 1});
									}
									else
									{
										res.render("student_feedback.ejs", {flag : 2});
									}
								}

							});
						}
					}
				});



			}
		}

	});


})

app.post('/student_response', (req, res) => {

	var q = []

	q.push(req.body.q1);
	q.push(req.body.q2);
	q.push(req.body.q3);
	q.push(req.body.q4);
	q.push(req.body.q5);
	q.push(req.body.q6);
	q.push(req.body.q7);
	q.push(req.body.q8);
	q.push(req.body.q9);

	var sql = "select * from assigned_electives where roll_no = (select roll_no from student where student_email = '" + req.session.mail +"');";
	db.query(sql, (err, results, field) =>
	{
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			for(var i = 0; i < 9; i++)
			{
				var sql = "insert into feedback_response values('" + results[0].roll_no + "'," + results[0].faculty_id + ",'" + results[0].elective_id + "'," + (200 + i + 1) + "," + q[i] + ")";
				db.query(sql, (err, results, field) =>
				{
					if (err)
					{
						console.log(err);
						return;
					}
					else
					{

					}

				});
			}

			var sql = "update student set feedback_given = 1 where roll_no = '" + results[0].roll_no +"';";
			db.query(sql, (err, results, field) =>
			{
				if (err)
				{
					console.log(err);
					return;
				}
				else
				{
					res.redirect('/student_feedback');
				}

			});


		}

	});

})

app.get('/coord_feedback',(req,res) => {
	var results = []
	res.render('coord_feedback', {sem : 0, dept : 'Nothing', results : results});
})

app.post('/coord_feedback_points', (req, res) => {

	var sem = req.body.sem;
	var dept = req.body.dept;

	var sql = "select faculty_id, (select faculty_name from faculty C where C.faculty_id = A.faculty_id) as faculty_name, (select elective_id from feedback_response B where A.faculty_id = B.faculty_id and A.elective_id = B.elective_id group by faculty_id) as elective_id, (select elective_name from elective B where A.elective_id = B.elective_id) as elective_name,(select sum(B.points)/(select strength from facelec_pref B where A.faculty_id = B.faculty_id and A.elective_id = B.elective_id) from feedback_response B  where A.faculty_id = B.faculty_id and elective_id In(select elective_id from elective where elective_sem = " + sem + " and elective_dept = '" + dept + "')) as points from assigned_electives A where exists(select elective_id from elective B where elective_sem = " + sem + " and elective_dept = '" + dept + "' and A.elective_id = B.elective_id) group by faculty_id;";
	db.query(sql, (err, results, field) =>
	{
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.render('coord_feedback', {sem : sem, dept : dept, results : results});
		}

	});

})

app.post('/coord_enable_feedback', (req, res) => {

	var sem = req.body.sem;
	var dept = req.body.dept;

	var sql = "update elective set feedback_given = 1 where elective_sem = " + sem + " and elective_dept = '" + dept + "';";
	db.query(sql, (err, results, field) =>
	{
		if (err)
		{
			console.log(err);
			return;
		}
		else
		{
			res.redirect('/coord_feedback');
		}

	});

})


app.get('/coord_group', (req, res) => {
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

						var current_time= new Date().getTime();
						var assigned = 0;

						var sql = "INSERT INTO elec_pref VALUES('" + roll_no + "','" + elec + "'," + pref[i] + ",current_time()" +  "," + assigned +");";
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
