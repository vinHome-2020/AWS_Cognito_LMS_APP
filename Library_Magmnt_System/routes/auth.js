/*
    Initial Git Source : https://github.com/azad71/Library-Management-System.git
	New Git Source : https://github.com/vinHome-2020/AWS_Cognito_LMS_APP
    Redesigned by: Vinoth Adaikalaraj V.
    Created on : 17-Jul-2020
*/

const express = require("express"),
      router = express.Router(),
      passport = require('passport');
const User = require('../models/user');
var AWS = require("aws-sdk");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const logFile=process.cwd()+"/application_log.txt";
const poolData = {    
UserPoolId : "<Pool ID>", // Your user pool id here    
ClientId : "<ClientId>"

}; 
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
global.fetch = require('node-fetch');
var moment = require('moment');
// Import index controller
const authController = require('../controllers/auth');
var MongoClient = require('mongodb').MongoClient;
global.fetch = require('node-fetch');
var mongoose = require('mongoose');
var config = {
    'secret': 'OvoJeNajjaciSecretKojiSamSmislio##1337##',
    'database': 'mongodb://<User>:<Password>@localhost:<port>/LMS',   
};
mongoose.connect(config.database); // Connect to db
var url = 'mongodb://<User>:<Password>@localhost:<port>/LMS';

//landing page
router.get('/', authController.getLandingPage);

//admin login handler
router.get("/auth/admin-login", authController.getAdminLoginPage);


router.post("/auth/admin-login", function(req, res)
{
	var uname = req.body.username;
	var passwd = req.body.password;
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
		Username : uname,
		Password : passwd,
		});
	var userData = {
		Username : uname,
		Pool : userPool
	};
	var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);	
	cognitoUser.authenticateUser(authenticationDetails, 
	{
		onSuccess: function (result) 
		{			
    		 MongoClient.connect(url,(err,database) =>
    		 {
				if(err)console.log(JSON.stringify(err));
		        else
		         console.log("Db Connected...");
    		    const vinDb = database.db('LMS');
        		vinDb.collection("users").findOne({username: uname},function(err, users)
        		{
        			//console.log("users DB Result"+JSON.stringify(users));
        			if (err || users == null || users == undefined)
					{						
						console.log(JSON.stringify(err || users) + " - Mongo DB User Fetch result  has issue ..count is ");
						console.log("Please verify Mongo DB Store, User should be registered with Both Manager Table and AWS Cloud store");
				        req.flash("error", "Hello, " + uname + "User details is not present in the Model, please contact Administrator");
						res.redirect("/auth/admin-login");
					}
					else 
					{
						console.log("User model accessed...");
						if(users.admin)
						{
							req.session.userObj = users;
							req.session.uid = users._id.toString();
					    	req.session.adminusername = users.username;
							req.session.adminfirstname = users.firstname;
							req.session.adminlastname = users.lastname;
                        	req.session.adminFlg = 'y';
                        	req.session.isAdmin = true;
							req.session.save(function(err1) 
							{
								//console.log("Session Save to Store "+JSON.stringify(req.session));
								if(err1)
								{
									console.log("Session Save Error "+JSON.stringify(err1));
									req.flash("error", "Hello, " + req.session.adminusername + "Your Session is not saved, Please contact Administrator");
									res.redirect("/auth/admin-login");
								}
								else
								{	
								    req.session.isAuthenticatedFlg = 'y';
								    req.flash("success", "Hello, " + req.session.adminusername + " Welcome to Admin Dashboard");
									res.redirect("/admin");	 // This will go to routes/admin.js	  
								}
							});				
							console.log("Admin Session Name:"+ req.session.adminusername);	
						}
						else
						{
							console.log("Admin is not logged in");
							req.flash("warning", "You are not Admin, and so you are not autorized to go this route");
							res.redirect("/auth/admin-login");
						}
					}
        		});
			});										
		},
		onFailure: function(err) 
		{
			var stack = new Error().stack;
			console.log(JSON.stringify(err.message));
		    req.flash("error", "Login Failed-"+JSON.stringify(err.message));
			res.redirect("/auth/admin-login");
		},
		newPasswordRequired: function(userAttributes, requiredAttributes) {									
		res({userAttributes, requiredAttributes});
		},
	});
});

//admin logout handler
router.get("/auth/admin-logout", authController.getAdminLogout);


// admin sign up handler
router.get("/auth/admin-signup", authController.getAdminSignUp);

router.post("/auth/admin-signup", authController.postAdminSignUp);

//user login handler
router.get("/auth/user-login", authController.getUserLoginPage);

/*router.post("/auth/user-login", passport.authenticate("local",
{
        successRedirect : "/user/1",
        failureRedirect : "/auth/user-login",
    }), (req, res)=> {
});*/
router.post("/auth/user-login", function(req, res)
{
	var uname = req.body.username;
	var passwd = req.body.password;
	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
		Username : uname,
		Password : passwd,
		});
	var userData = {
		Username : uname,
		Pool : userPool
	};
	var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);	
	cognitoUser.authenticateUser(authenticationDetails, 
	{
		onSuccess: function (result) 
		{			
			 
    		 MongoClient.connect(url,(err,database) =>
    		 {
				if(err)console.log(JSON.stringify(err));
		        else
		         console.log("Db Connected...");
    		    const vinDb = database.db('LMS');
				
        		vinDb.collection("users").findOne({username: uname},function(err, users)
        		{
        			
        			if (err || users == null || users == undefined)
					{						
						console.log(JSON.stringify(err || users) + " - Mongo DB User Fetch result  has issue ..count is ");
						console.log("Please verify Mongo DB Store, User should be registered with Both Manager Table and AWS Cloud store");
						//res.redirect("/managersigninerror");
				        req.flash("error", "Hello, " + uname + "User details is not present in the Model, please contact Administrator");
						res.redirect("/auth/user-login");
					}
					else 
					{
						console.log("User model accessed...with user ID"+users._id);
						req.session.userObj = users;
						req.session.uid = users._id.toString();
					    req.session.username = users.username;
						req.session.firstname = users.firstname;
						req.session.lastname = users.lastname;
                        req.session.userFlg = 'y';
                        req.session.isAdmin = false;
						req.session.save(function(err1) 
						{							
							if(err1)
							{
								console.log("Session Save Error "+JSON.stringify(err1));
								req.flash("error", "Hello, " + req.session.username + "Your Session is not saved, Please contact Administrator");
								res.redirect("/auth/user-login");
							}
							else
							{	
							    req.session.isAuthenticatedFlg = 'y';
							    req.flash("success", "Hello, " + req.session.username + " Welcome to User Dashboard");
								res.redirect("/user/1");	 // This will go to routes/user.js	  
							}
						});				
					}
        		});
			});										
		},
		onFailure: function(err) 
		{
			var stack = new Error().stack;
			console.log(JSON.stringify(err.message));
		    req.flash("Failure","Cognito Authentication Failed, plaese contact Admin");
			res.redirect("/auth/user-login");
		},
		newPasswordRequired: function(userAttributes, requiredAttributes) {									
		res({userAttributes, requiredAttributes});
		},
	});
});

//user -> user logout handler
router.get("/auth/user-logout", authController.getUserLogout);

//user sign up handler
router.get("/auth/user-signUp", authController.getUserSignUp);

router.post("/auth/user-signup", authController.postUserSignUp);

//user sign up handler
router.get("/auth/user-verifiy", authController.getUserVerify);

router.post("/auth/user-verifiy", authController.postUserVerify);

module.exports = router;