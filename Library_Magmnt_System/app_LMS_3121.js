/*
    Initial Git Source : https://github.com/azad71/Library-Management-System.git
	New Git Source : https://github.com/vinHome-2020/AWS_Cognito_LMS_APP
    Redesigned by: Vinoth Adaikalaraj V.
    Created on : 17-Jul-2020
    Modified on : 22-Jul-2020 (For Mongo Session store)
*/
const express = require("express"),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require("body-parser"),
    passport = require("passport"),
    multer = require('multer'),
    uid = require('uid'),
    path = require("path"),
    sanitizer = require("express-sanitizer"),
    methodOverride = require("method-override"),
    localStrategy = require("passport-local"),
    fs = require("fs"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    Activity = require("./models/activity"),
    Issue = require("./models/issue"),
    Comment = require("./models/comment"),
    userRoutes = require("./routes/users"),
    adminRoutes = require("./routes/admin"),
    bookRoutes = require("./routes/books"),
    authRoutes = require("./routes/auth"),
    middleware = require("./middleware");
var AWS = require("aws-sdk");
const session = require('express-session'); // Manages session variables
var MongoStore = require('connect-mongo')(session);
 //Seed(1000);

var conf = {
  db: {
    db: 'LMS',
    host: <Host>,
    port: <Port>,
    username: '', // optional
    password: '', // optional
    collection: 'LMS_Sessions',// optional, default: sessions
    url: 'mongodb://<User>:<Password>@localhost:<port>/LMS'
  },
  secret: '076ee61d63aa10a125ea872411e433b9_Vin'
};
app.use(session({
				store: new MongoStore(conf.db),
				secret: conf.secret,
				saveUninitialized: false,
				resave: false,
				maxAge: Date.now() + (60000*2) 
}));
 
// app config
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended : true}));
app.use(sanitizer());

// db config
const url = process.env.db_url || 'mongodb://<User>:<Password>@localhost:<port>/LMS';
mongoose.connect(url, {useNewUrlParser : true, useUnifiedTopology: true,});

mongoose.set('useFindAndModify', false);


//PASSPORT CONFIGURATION

app.use(require("express-session") ({ //must be declared before passport session and initialize method
    secret : "Wubba lubba dub dub",
    saveUninitialized : false,
    resave : false
}));
app.use(flash());

app.use(passport.initialize()); //must declared before passport.session()
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// configure image file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, `${uid()}-${file.originalname}`);
    }
});

const filefilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(multer({ storage: fileStorage, fileFilter: filefilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
   res.locals.currentUser   = req.user;
   res.locals.error         = req.flash("error");
   res.locals.success       = req.flash("success");
   res.locals.warning       = req.flash("warning"); 
   next();
});


//Routes
app.use(userRoutes);
app.use(adminRoutes);
app.use(bookRoutes);
app.use(authRoutes);

function deleteImage(imagePath, next) {
    fs.unlink(imagePath, (err) => {
      if (err) {
         console.log("Failed to delete image at delete profile");
         return next(err);
      }
  });
}

var listener = app.listen(3121, function(){
  console.log("Started at http:localhost:" + listener.address().port + " port");
});