const express = require('express');
const mysql = require('mysql');
const http = require('http');
const url = require('url');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const app = express();
const csv = require("csv-parser");
const fs = require("fs");

const sessiion = require('express-session')
const flush = require('connect-flash')


app.set('view engine', 'ejs');

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
		user: 'noreplyems5@gmail.com',
		pass: 'i@am&groot'
	}
});

const db = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'root',
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

app.get('/', (req, res) => {
	res.render('Parking_login', {message : req.flash('message')});
})

app.get('/signupform', (request, response) => {
	response.render("Parking_signup", {message : request.flash('message')});
})

function Person(email, password, pwdrpt, role, phone){
    this.email = email
    this.password = password
    this.pwdrpt = pwdrpt
    this.role = role
    this.phone = phone

    this.check_email = function()
    {
        var i = 0
        n = this.email.length

        if (n < 16)
        {
            return false
        }
        str = ""
        for(i = n - 10; i < n; i++)
        {
            str = str + this.email[i]
        }
        if (str != "@gmail.com")
        {
            return false
        }
        return true
    }

    this.check_password = function()
    {
        if (this.password.length >= 8 && this.password == this.pwdrpt)
        {
            return true
        }
        return false
    }

    this.check_phone = function()
    {
        if (this.phone.length == 10)
        {
            return true
        }
        return false
    }
}

app.post('/signup', (request, response) => {
	var mail = request.body.email;
	var pwd = request.body.pwd;
	var pwdrpt = request.body.pwdrpt;
	var role = request.body.role;
    var phone = request.body.phone;

    const customer_or_admin = new Person(mail, pwd, pwdrpt, role, phone);

    if (customer_or_admin.check_email() == false)
    {
        console.log("email")
        request.flash('message', 'Please give correct email id');
        response.redirect('/signupform' )
    }
    else if (customer_or_admin.check_password() == false)
    {
        console.log("pwd")
        request.flash('message', 'Please give correct password');
        response.redirect('/signupform' )
    }
    else if(customer_or_admin.check_phone() == false)
    {
        console.log("phone")
        request.flash('message', 'Please give correct phone no.');
        response.redirect('/signupform')
    }
    else
    {
        var num = Math.floor(
            Math.random() * (9999 - 1000) + 1000
        );
        var num = num.toString();
    
        var mailOptions = {
            from: 'noreplyems5@gmail.com',
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
        response.render('Parking_otp', { role: role, otp: num, mail: mail, pwd: pwd, phone: phone});
    }
})

app.post('/otp', (req, res) => {
	var mail = req.body.mail;
	var pwd = req.body.pwd;
	var role = req.body.role;
	var inotp = req.body.inotp;
	var otp = req.body.otp;
	var phone = req.body.phone;

	if (inotp == otp) {
		console.log('Signup successful');
		if (role == "coordinator") {
			var sql = "INSERT INTO coord_login VALUES ('" + mail + "','" + pwd + "','" + phone + "');";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');
				var mailOptions = {
					from: 'noreplyems5@gmail.com',
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
			res.render('login', {message : ' '});
		}
		else if (role == "customer") {
			var sql = "INSERT INTO cust_login VALUES ('" + mail + "','" + pwd + "','" + phone + "');";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				console.log('User inserted successfully');

				var mailOptions = {
					from: 'noreplyems5@gmail.com',
					to: mail + '',
					subject: 'Account Creation Status',
					text: "Customer account created successfully.You can now access your portal"
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

	}
	else {
		console.log('Signup Failed');
		res.render('Parking_login', {message : ''});
	}
})

app.post('/login_cust', (request, response) => {
	var mail = request.body.email;
	request.session.mail = mail;
	var pwd = request.body.password;

	var flag = 0;
	var sql = "SELECT * FROM cust_login";

	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in accessing database', err);
			return;
		}

		for (i = 0; i < result.length; i++) {
			if (result[i].cust_email == mail && result[i].cust_password == pwd) {
				flag = 1;
				break;
			}
		}

		if (flag == 1) {
			response.render("customer_check_in", {mailid : request.session.mail, message : request.flash('message')});
		}
		else {
			console.log("Login Failed");
			request.flash('message', 'Give your credentials correctly');
			response.redirect('/');
			return;
		}

	});
})

app.post('/login_coord', (request, response) => {
	var mail = request.body.email;
	request.session.mail = mail;
	var pwd = request.body.password;

	var flag = 0;

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
			response.redirect('/coord_check_in');
			//response.render("customer_check_in", {mailid : request.session.mail, message : request.flash('message')});
		}
		else {
			console.log("Login Failed");
			request.flash('message', 'Give your credentials correctly');
			response.redirect('/');
			return;
		}

	});
})

app.get('/cust_check_in', (request, response) => {
	response.render("customer_check_in", {mailid : request.session.mail, message : request.flash('message')});
})


app.post('/cust_insert_check_in', (request, response) => {

	var vehicle_no = request.body.vehicle_no;
	var vehicle_model = request.body.vehicle_model;
	var vehicle_type = request.body.vehicle_type;
	var day = request.body.day;
	var status = 0;

	var sql = "Insert into check_in(cust_email, vehicle_no, vehicle_model, vehicle_type, vehicle_day, vehicle_status) values('" + request.session.mail + "','" + vehicle_no + "','" + vehicle_model + "','" + vehicle_type + "','" + day + "'," + status + ");" ;
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		console.log('Check_in details inserted successfully');
		request.flash('message', 'Request Successfully Submitted');
		response.redirect('/cust_check_in');
	});

})


app.get('/cust_view_requests', (request, response) => {
	var sql = "select * from check_in where cust_email = '" + request.session.mail + "';" ;
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			response.render("customer_view_requests", {mailid : request.session.mail, message : request.flash('message'), results : result});
		}
		
	});
})

app.get('/cust_bill', (request, response) => {
	response.render("customer_bill", {mailid : request.session.mail, message : request.flash('message'), results : ''})
})

app.post('/cust_view_bill', (request, response) => {

	var check_in_id = request.body.check_in_id;

	var sql = "select vehicle_day, vehicle_type from check_in where Not vehicle_status = 0 and Not vehicle_status = 2 and cust_email = '" + request.session.mail + "' and check_in_id = '" + check_in_id + "';" ;
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			if (result.length == 0)
			{
				response.redirect('/cust_bill')
			}
			else
			{
				var curr_date = new Date();
				var check_in_date = new Date(result[0].vehicle_day);

				var Difference_In_Time = curr_date.getTime() - check_in_date.getTime();
				var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

				var amount = Math.ceil(Difference_In_Days) * result[0].vehicle_type * 30;
				console.log(Math.ceil(amount));

				var sql = "update check_in set vehicle_status = " + amount + " where cust_email = '" + request.session.mail + "' and check_in_id = '" + check_in_id + "';" ;
				db.query(sql, (err, result, field) => {
					if (err) {
						console.log('Error in changing database', err);
						return;
					}
					else
					{
						var sql = "select * from check_in where check_in_id = '" + check_in_id + "';" ;
						db.query(sql, (err, result, field) => {
							if (err) {
								console.log('Error in changing database', err);
								return;
							}
							else
							{
								response.render("customer_bill", {mailid : request.session.mail, message : request.flash('message'), results : result})
							}
							
						});
					}
					
				});
			}
		}
	});

})

app.post('/cust_pay_bill', (request, response) => {

	var check_in_id = request.body.check_in_id;
	var amount;

	var sql = "select vehicle_status from check_in where check_in_id = '" + check_in_id + "';";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			amount = result[0].vehicle_status;
			var sql = "insert into bill values('" + request.session.mail + "'," + check_in_id + "," + amount + ");";
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
			});
			
			var sql = "Update check_in set vehicle_status = 2 where check_in_id = '" + check_in_id + "';" ;
			db.query(sql, (err, result, field) => {
				if (err) {
					console.log('Error in changing database', err);
					return;
				}
				else
				{
					request.flash('message', 'Payment Successful');
					response.redirect("cust_bill");
				}
				
			});
		}
	});
	
	


})



app.get('/coord_check_in', (request, response) => {
	var sql = "select * from check_in" ;
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			response.render("coordinator_check_in", {mailid : request.session.mail, message : request.flash('message'), results : result});
		}
		
	});
})

app.post('/coord_allot_slots', (request, response) => {
	var sql = "select count(*) as count from check_in where NOT vehicle_status = 0 and NOT vehicle_status = 2;";
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			var n = result[0].count;
			if (10 - n > 0)
			{
				var limit = 10 - n

				var sql = "update check_in set vehicle_status = 1 where vehicle_status = 0 order by vehicle_day asc Limit " + limit + ";" ;
				db.query(sql, (err, result, field) => {
					if (err) {
						console.log('Error in changing database', err);
						return;
					}
					else
					{
						request.flash('message', 'Alloted Successfully');
						response.redirect('/coord_check_in');
					}
					
				});
			}
			else
			{
				request.flash('message', 'Sorry no slot available');
				response.redirect('/coord_check_in');
			}
		}
		
	});

})

app.get('/coord_receipt', (request, response) => {

	var sql = "select * from bill;" ;
	db.query(sql, (err, result, field) => {
		if (err) {
			console.log('Error in changing database', err);
			return;
		}
		else
		{
			response.render("coordinator_reciept", {mailid : request.session.mail, message : request.flash('message'), results : result});
		}
		
	});
})







app.get('/logout', (req, res) => {
	res.clearCookie('session-token');
	res.render('Parking_login', {message : ''});
})

app.listen(5051, () => {
	console.log("Server listening");
})