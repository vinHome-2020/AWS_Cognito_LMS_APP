# Library-Management-System
A simple online library management system built with MongodDB, Express.js and Node.js. [Click here](ec2-52-66-199-191.ap-south-1.compute.amazonaws.com:3121) to see the application

Initail Version was cloned from https://github.com/azad71/Library-Management-System
And Additional features added as below:

1. MongoDB Session stores using Express Session, to store the user session History.
2. AWS Cognito module for Authentication & New User Registration
   Nowhere password stored in Local, all are managed internally with AWS.

## Techonologies used in this application

## Appliaction Physical Server:
AWS EC2 Virtual Host

### Front-end

1. HTML5
2. CSS3
3. BOOTSTRAP 4
4. jQuery

### Back-end

1. MongoDB
2. Express.js
3. Node.js
4. AWS Cognito

## Install dependencies

1. Create EC2 Instance.
2. Install Mongo DB server 3.6.3. And Configure the LMS Database with user account.
3. Create User Pool and Application client with Domain URL. (Be ready with the the Pool ID & App Client ID to update code)
   DB & Pool IDs to be updated in the below four file
   Library_Magmnt_System\routes\auth.js
   Library_Magmnt_System\controllers\auth.js
   Library_Magmnt_System\controllers\user.js
   Library_Magmnt_System\app_LMS_3121.js
4. Start the Node server

## Functionalitites

Whole app is divided into three modules.

* Admin
* User
* Browse books

### Admin module functionalities
* Sign up (This route is hidden. only accessible by typing the route manually and when admin log in)
* Login
* Logout
* Track all users activities
* Add books
* Update books
* Delete books
* Search books by category, title, author, ISBN
* Find users by firstname, lastname, email and username
* Delete user acount
* Restrict individual user if violate any terms and conditions
* Send notification to all/individual/filtered user (not ready yet, will be added as soon as I learn socket.io)
* Browse books showcase
* Update admin profile and password
* Add new admin
* Delete currently logged in admin profile

### User module functionalities
* Sign up
* Login
* Logout
* Track own activities
* Issue books
* Renew books
* Return books
* Pay fines (not ready yet, will be added asap)
* Browse books showcase 
* Add, edit and delete comment on any books comment section
* Upload/Update profile picture
* Update profile and password
* Delete account 

### Browse books module functionalities
This module can be accessed by anyone
* Show all books
* Find books on filtered search








