/*
    Initial Git Source : https://github.com/azad71/Library-Management-System.git
	New Git Source : https://github.com/vinHome-2020/AWS_Cognito_LMS_APP
    Redesigned by: Vinoth Adaikalaraj V.
    Created on : 17-Jul-2020
*/

// importing libraries
const passport = require('passport');

// importing models
const User = require('../models/user');
const fs = require('fs');
var AWS = require("aws-sdk");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
var confirmURL="https://<Your Domain Prefix>.auth.ap-south-1.amazoncognito.com/confirmUser?client_id=<Client ID>&";
const logFile=process.cwd()+"/application_log.txt";
const poolData = {    
UserPoolId : "<Pool ID>", // Your user pool id here    
ClientId : "<Client ID>"
}; 
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
global.fetch = require('node-fetch');
var moment = require('moment');

var MongoClient = require('mongodb').MongoClient;
var url = "'mongodb://<User>:<Password>@localhost:<port>/LMS";

exports.getLandingPage = (req, res, next) => {
    res.render('landing');
}

exports.getAdminLoginPage = (req, res, next) => {
    res.render("admin/adminLogin");
}

exports.getAdminLogout = (req, res, next) => {
    req.logout();
    res.redirect("/");
}

exports.getAdminSignUp = (req, res, next) => {
    res.render("signup");
}

exports.postAdminSignUp = async(req, res, next) => 
{
    try 
    {
        if(req.body.adminCode == "Open Sesame") 
        {
            const newAdmin = new User({
                username : req.body.username,
                email : req.body.email,
                isAdmin : true,
            });

            const user = await User.register(newAdmin, req.body.password);
            await passport.authenticate("local")(req, res, () => 
            {
              req.flash("success", "Hello, " + user.username + " Welcome to Admin Dashboard");
                res.redirect("/admin");
            });
        }
    } 
    catch(err) 
    {
        console.log(err);
        req.flash("error", "Given info matches someone registered as User. Please provide different info for registering as Admin");
        return res.render("signup");
    } 
}

exports.getUserLoginPage = (req, res, next) => {
    res.render("user/userLogin");
}

exports.getUserLogout = (req, res, next) => {
    req.logout();
    res.redirect("/");
}

exports.getUserSignUp = (req, res, next) => {
    res.render("user/userSignup");
}

exports.postUserSignUp = async(req, res, next) => 
{
    try 
    {
     
    var email = req.body.email;
	var username = req.body.username;
	var fn = req.body.firstName;
	var ln = req.body.lastName;
	var gender = req.body.gender;
	var address = req.body.address;
	var phone = req.body.ph;
	var dataEmail = {
			Name: 'email',
			Value: email
	};
	var dataPhoneNumber = {
	Name: 'phone_number',
	Value: phone
	};
	var attributeList = [];
	attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail));
	attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber));
	userPool.signUp(username,  req.body.password, attributeList, null, function(err, result)
	{
		if (err) 
		{
				console.log('Sigup failure:',err);	
				var stack = new Error().stack;
				var timestamp = "+++++++++++++++++++"+moment().format('DD-MM-YYYY HH:mm:ss') + "+++++++++++++++++++++";
					var stack = new Error().stack;
					var errMsg = stack+"\n"+JSON.stringify(err)+"\n"+err.message;
					fs.appendFile(logFile, timestamp +"\n"+errMsg+"\n"+timestamp+"\n", function (err1) {
					  if (err1) throw err1;
					  console.log('Saved!');
				});
				req.flash("error", "User Registration Failed, Please Contact administrator");
				return res.render("user/userSignup");
		}
		else
		{
			MongoClient.connect(url, function(err, dbs) 
			{
			  if (err) console.log('Sigup failure at DB store:',err);	
			  var dbo = dbs.db("LMS");
			  var myobj = { "username": username, "password": "dummy","firstname": fn, "lastname": ln, "Email":email ,"gender":gender,"Phone":phone,"Address": address};
			  dbo.collection("users").insertOne(myobj, function(err, res) {
				if (err) console.log('Sigup failure at DB store:',err);	
				console.log("1 document inserted");
				dbs.close();
			  });
			});
			var verifyEmailPromise = new AWS.SES({apiVersion: '2010-12-01'}).verifyEmailIdentity({EmailAddress: email}).promise();
			verifyEmailPromise.then
			(
				function(data) 
				{					
					console.log("Email verification initiated");
					req.flash("success", "Hello, " + username + " Access code has been sent to Email, Please validate to login further");
					return res.redirect("/");
				}
			 ).catch(function(err) 
				 {
					   console.error(err, err.stack);
					   var stack = new Error().stack;		
						var timestamp = "+++++++++++++++++++"+moment().format('DD-MM-YYYY HH:mm:ss') + "+++++++++++++++++++++";					
						var errMsg = stack+"\n"+JSON.stringify(err)+"\n"+err.message;
						fs.appendFile(logFile, timestamp +"\n"+errMsg+"\n"+timestamp+"\n", function (err1) {
						  if (err1) throw err1;
						  console.log('Saved!');
						});	
						req.flash("error", "User Registration Failed, while access code Generation Please Contact administrator");
						return res.render("user/userSignup");
				 });
		}
	});
         
    } 
    catch(err) 
    {
        console.log(err);
        return res.render("user/userSignup");
    }
}

exports.getUserVerify = (req, res, next) => 
{
    res.render("user/userVerify");
}
exports.postUserVerify = async(req, res, next) => 
{
	var uname = req.body.username;
	var code = req.body.acode;	
	var link=confirmURL+'user_name='+uname+'&confirmation_code='+code;	
	res.writeHead(200, {'Set-Cookie': 'curUser='+uname,'Content-Type': 'text/html'});	
	var pageBody ="<html><head><title>Confirm User - Access Code verification</title></head><body> To Confirm your ID and Access code given through Email, click Below Link<br>"+
	"After you seeing Success Message Pop-up, Please Go back to Login Page and Login<br>Now If all is well ,<a href='"+ link +"'>Proceed!!</a></body></html";
	res.write(pageBody);
	res.end();
}