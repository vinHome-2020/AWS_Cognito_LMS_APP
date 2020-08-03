const multer = require("multer");

const middleware = {};

middleware.isLoggedIn = function(req, res, next) 
{
    if(req.session.isAuthenticatedFlg =='y' && req.session.userFlg =='y') 
    {
        res.locals.currentUser = req.session.username;
        return next();
    }
    req.flash("error", "Your Session is not valid, Either timed out or You need login to initiate...");
    res.redirect("/");
};

middleware.isAdmin = function(req, res, next) 
{
    if(req.session.isAuthenticatedFlg =='y' && req.session.adminFlg =='y') 
    {
        res.locals.currentUser = req.session.adminusername;
        return next();
    }
    req.flash("error", "Sorry, this route is allowed for admin onl, Either You are not authorized or Your session timed out..");
    res.redirect("/");
};

middleware.upload = multer({
      limits: {
        fileSize: 4 * 1024 * 1024,
      }
    });

module.exports = middleware;