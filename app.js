const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const mongoose = require("mongoose");
const app = express();

//env
const dotenv = require("dotenv");
dotenv.config();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.sendFile(process.cwd() + '/signup.html');
    })
    .post((req, res) => {
        userModel.create({
            username: req.body.username,
            password: req.body.password
        })
            .then(user => {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            })
            .catch(error => {
                res.redirect('/signup');
            });
    });

// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(process.cwd() + '/login.html');
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;

        userModel.findOne({ username: username }).then(function (user) {
            if (!user) {
                res.redirect('/login');
            } else if (user.password != password) {
                res.redirect('/login');
            } else {
                req.session.user = user;
                res.redirect('/dashboard');
            }
        });
    });

// route for user's dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile(process.cwd() + '/dashboard.html');
    } else {
        res.redirect('/login');
    }
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});



let Schema = mongoose.Schema;

//Defining Schema
let userSchema = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
});

//creatation of model
let userModel = mongoose.model("user", userSchema);


//connect to database
connectDB();
function connectDB() {
    mongoose.connect(process.env.db_url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
    });
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection'));
    db.once('open', function callback() {
        console.log("database connected");
    });
}

//connect to node at port
const port = process.argv[2] || process.env.port;
if (!port) {
    throw new Error("port is missing");
}
connectNode();
function connectNode() {
    app.listen(port, (req, res) => console.log("connect at " + port));
}