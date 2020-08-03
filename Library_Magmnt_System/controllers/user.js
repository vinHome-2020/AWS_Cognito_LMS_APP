/*
    Initial Git Source : https://github.com/azad71/Library-Management-System.git
	New Git Source : https://github.com/vinHome-2020/AWS_Cognito_LMS_APP
    Redesigned by: Vinoth Adaikalaraj V.
    Created on : 18-Jul-2020
*/

// importing dependencies
const sharp = require('sharp');
const uid = require('uid');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectId; 
// importing models
const User = require("../models/user"),
      Activity = require("../models/activity"),
      Book = require("../models/book"),
      Issue = require("../models/issue"),
      Comment = require("../models/comment");

// importing utilities
const deleteImage = require('../utils/delete_image');
var url = 'mongodb://<User>:<Password>@localhost:<port>/LMS';
var MongoClient = require('mongodb').MongoClient;
// GLOBAL_VARIABLES
const PER_PAGE = 5;

exports.getUserDashboard = async(req, res, next) => {
    var page = req.params.page || 1;
    //const user_id = req. user._id;
    const user_id = new ObjectId(req.session.uid);
    //console.log("User ID Object "+user_id);
    try {
        // fetch user info from db and populate it with related book issue
        var user = await User.findById(user_id);
        //console.log("User Result "+user);
        while(user == undefined || user == null)  // This is due to avoid timeouts
        {
            user = await User.findById(user_id);
        }
        //console.log("User Result "+user);
        if(user.bookIssueInfo && user.bookIssueInfo.length > 0) {
            const issues = await Issue.find({"user_id.id" : user._id});

            for(let issue of issues) {
                if(issue.book_info.returnDate < Date.now()) {
                    user.violatonFlag = true;
                    user.save();
                    req.flash("warning", "You are flagged for not returning " + issue.book_info.title + " in time");
                    break;
                }
            }
        }
        const activities = await Activity
            .find({"user_id.id": user_id})
            .sort('-entryTime')
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE);

        const activity_count = await Activity
            .find({"user_id.id": user_id})
            .countDocuments();

        res.render("user/index", {
            user : user,
            current : page,
            pages: Math.ceil(activity_count / PER_PAGE),
            activities : activities,
        });
    } 
    catch(err) 
    {
        console.log(err);
        return res.redirect('back');
    }
}

// user -> profile
exports.getUserProfile = (req, res, next) => {
    res.render("user/profile");
}

// user -> update/change password
exports.putUpdatePassword = async(req, res, next) => {
    const username = req.session.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.password;

    try {
        const user = await User.findByUsername(username);
        await user.changePassword(oldPassword, newPassword);
        await user.save();

        // logging activity
        const activity = new Activity({
            category: "Update Password",
            user_id : {
                id : new ObjectId(req.session.uid),
                username : req.session.username,
            },
        });
        await activity.save();

        req.flash("success", "Your password is recently updated. Please log in again to confirm");
        res.redirect("/auth/user-login");
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

// user -> update profile
exports.putUpdateUserProfile = async(req, res, next) => {
    try{
        const userUpdateInfo = {
            "firstName": req.body.firstName,
            "lastName": req.body.lastName,
            "email": req.body.email,
            "gender": req.body.gender,
            "address": req.body.address,
        }
        await User.findByIdAndUpdate(new ObjectId(req.session.uid), userUpdateInfo);

        // logging activity
        const activity = new Activity({
            category: "Update Profile",
            user_id: {
                id: new ObjectId(req.session.uid),
                username: req.session.username,
            }
        });
        await activity.save();

        res.redirect('back');
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

// upload image
exports.postUploadUserImage = async (req, res, next) => {
    try {
        const user_id = new ObjectId(req.session.uid);
        const user = await User.findById(user_id);

        let imageUrl;
        if(req.file) {
            imageUrl = `${uid()}__${req.file.originalname}`;
            let filename = `images/${imageUrl}`;
            let previousImagePath = `images/${user.image}`;

            const imageExist = fs.existsSync(previousImagePath);
            if(imageExist) {
                deleteImage(previousImagePath);
            }
            await sharp(req.file.path)
                .rotate()
                .resize(500, 500)
                .toFile(filename);
            
            fs.unlink(req.file.path, err => {
                if(err) {
                    console.log(err);
                }
            })
        } else {
            imageUrl = 'profile.png';
        }
        
        user.image = imageUrl;
        await user.save();
        
        const activity = new Activity({
            category : "Upload Photo",
            user_id : {
              id : new ObjectId(req.session.uid),
              username: user.username,
             }
        });
        await activity.save();
        
        res.redirect("/user/1/profile");
    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};

//user -> notification
exports.getNotification = async(req, res, next) => {
    res.render("user/notification");
}

//user -> issue a book
exports.postIssueBook = async(req, res, next) => 
{
    //console.log(JSON.stringify(req.session.userObj));
    if(req.session.userObj.violationFlag) 
    {
        req.flash("error", "You are flagged for violating rules/delay on returning books/paying fines. Untill the flag is lifted, You can't issue any books");
        return res.redirect("back");
    }

    if(req.session.userObj.bookIssueInfo && req.session.userObj.bookIssueInfo.length >= 5) {
        req.flash("warning", "You can't issue more than 5 books at a time");
        return res.redirect("back");
    }

    try {
        //console.log(JSON.stringify(req.params));
        const book = await Book.findById(req.params.book_id);
        //const user = await User.findById(req.params.user_id);
        const user = await User.findByUsername(req.params.user_id);

        // registering issue
        book.stock -= 1;
        const issue =  new Issue({
            book_info: {
                id: book._id,
                title: book.title,
                author: book.author,
                ISBN: book.ISBN,
                category: book.category,
                stock: book.stock,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // putting issue record on individual user document
        user.bookIssueInfo.push(book._id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
            },
            category: "Issue",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        // await ensure to synchronously save all database alteration
        await issue.save();
        await user.save();
        await book.save();
        await activity.save();
        req.flash("Success", "Book Issued");
        res.redirect("/books/all/all/1");
    } 
    catch(err) 
    {
        console.log(JSON.stringify(err));
        return res.redirect("back");
    }
}

// user -> show return-renew page
exports.getShowRenewReturn = async(req, res, next) => {
    const user_id = new ObjectId(req.session.uid);
    try {
        const issue = await Issue.find({"user_id.id": user_id});
        res.render("user/return-renew", {user: issue});
    } 
    catch (err) 
    {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> renew book working procedure
/*
    1. construct the search object
    2. fetch issues based on search object
    3. increament return date by 7 days set isRenewed = true
    4. Log the activity
    5. save all db alteration
    6. redirect to /books/return-renew
*/
exports.postRenewBook = async(req, res, next) => 
{
    try 
    {
        const searchObj = {
            "user_id.id": new ObjectId(req.session.uid),
            "book_info.id": req.params.book_id,
        }
        const issue = await Issue.findOne(searchObj);
        // adding extra 7 days to that issue
        let time = issue.book_info.returnDate.getTime();
        issue.book_info.returnDate = time + 7*24*60*60*1000;
        issue.book_info.isRenewed = true;

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue._id,
                title: issue.book_info.title,
            },
            category: "Renew",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: new ObjectId(req.session.uid),
                username: req.session.username,
            }
        });

        await activity.save();
        await issue.save();

        res.redirect("/books/return-renew");
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

// user -> return book working procedure
/*
    1. Find the position of the book to be returned from user.bookIssueInfo
    2. Fetch the book from db and increament its stock by 1
    3. Remove issue record from db
    4. Pop bookIssueInfo from user by position
    5. Log the activity
    6. refirect to /books/return-renew
*/
exports.postReturnBook = async(req, res, next) => {
    try {
        // finding the position
        const book_id = req.params.book_id;
        const userRes = await User.findById(new ObjectId(req.session.uid));
        const pos = userRes.bookIssueInfo.indexOf(req.params.book_id);
        
        // fetching book from db and increament
        const book = await Book.findById(book_id);
        book.stock += 1;
        await book.save();

        // removing issue 
        const issue =  await Issue.findOne({"user_id.id": new ObjectId(req.session.uid)});
        await issue.remove();

        // popping book issue info from user
        userRes.bookIssueInfo.splice(pos, 1);
        await userRes.save();

        // logging the activity
        const activity = new Activity({
            info: {
                id: issue.book_info.id,
                title: issue.book_info.title,
            },
            category: "Return",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: new ObjectId(req.session.uid),
                username: req.session.username,
            }
        });
        await activity.save();

        // redirecting
        res.redirect("/books/return-renew");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> create new comment working procedure
/* 
    1. Find the book to be commented by id
    2. Create new Comment instance and fill information inside it
    3. Log the activity
    4. Redirect to /books/details/:book_id
*/
exports.postNewComment = async(req, res, next) => {
    try {
        const comment_text = req.body.comment;
        const user_id = new ObjectId(req.session.uid);
        const username = req.session.username;

        // fetching the book to be commented by id
        const book_id = req.params.book_id;
        const book = await Book.findById(book_id);

        // creating new comment instance
        const comment = new Comment({
            text: comment_text,
            author: {
                id: user_id,
                username: username,
            },
            book: {
                id: book._id,
                title: book.title,
            }
        });
        await comment.save();
        
        // pushing the comment id to book
        book.comments.push(comment._id);
        await book.save();

        // logging the activity
        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
            },
            category: "Comment",
            user_id: {
                id: user_id,
                username: username,
            }
        });
        await activity.save();

        res.redirect("/books/details/"+book_id);
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

// user -> update existing comment working procedure
/*
    1. Fetch the comment to be updated from db and update
    2. Fetch the book to be commented for logging book id, title in activity
    3. Log the activity
    4. Redirect to /books/details/"+book_id
*/
exports.postUpdateComment = async(req, res, next) => {
    const comment_id = req.params.comment_id;
    const comment_text = req.body.comment;
    const book_id = req.params.book_id;
    const username = req.session.username;
    const user_id = new ObjectId(req.session.uid);

    try {
        // fetching the comment by id
        await Comment.findByIdAndUpdate(comment_id, comment_text);

        // fetching the book
        const book = await Book.findById(book_id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
             },
             category: "Update Comment",
             user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        // redirecting
        res.redirect("/books/details/"+book_id);
        
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }

}

// user -> delete existing comment working procedure
/* 
    1. Fetch the book info for logging info
    2. Find the position of comment id in book.comments array in Book model
    3. Pop the comment id by position from Book
    4. Find the comment and remove it from Comment
    5. Log the activity
    6. Redirect to /books/details/" + book_id
*/
exports.deleteComment = async(req, res, next) => {
    const book_id = req.params.book_id;
    const comment_id = req.params.comment_id;
    const user_id = new ObjectId(req.session.uid);
    const username = req.session.username;
    try {
        // fetching the book
        const book = await Book.findById(book_id);

        // finding the position and popping comment_id
        const pos = book.comments.indexOf(comment_id);
        book.comments.splice(pos, 1);
        await book.save();

        // removing comment from Comment
        await Comment.findByIdAndRemove(comment_id);

        // logging the activity
        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
             },
            category: "Delete Comment",
            user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        // redirecting
        res.redirect("/books/details/" + book_id);
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

// user -> delete user account
exports.deleteUserAccount = async (req, res, next) => {
    try {
        const user_id = new ObjectId(req.session.uid);

        const user = await User.findById(user_id);
        await user.remove();

        let imagePath = `images/${user.image}`;
        if(fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

        await Issue.deleteMany({"user_id.id": user_id});
        await Comment.deleteMany({"author.id":user_id});
        await Activity.deleteMany({"user_id.id": user_id});

        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.redirect('back');
    }
}

