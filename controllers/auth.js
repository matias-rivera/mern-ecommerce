const User = require('../models/user');
const jwt = require('jsonwebtoken'); // signed token
const expressJwt = require('express-jwt'); //auth check
const {errorHandler} = require('../helpers/dbErrorHandler')

//singup function
exports.signup = (req,res) =>{
    console.log('req.body',req.body);
    const user = new User(req.body);
    user.save((err,user) => {
        if(err){
            return res.status(400).json({
                err: errorHandler(err)
            })
        }
        //ignore fields salt and password
        user.salt = undefined;
        user.hashed_password = undefined;
        res.json({
            user
        });
    });
};

//signin function
exports.signin = (req,res) =>{
    //find user by email
    const {email,password} = req.body;
    User.findOne({email},(err,user) => {
        if(err || !user){
            return res.status(400).json({
                err: 'User with that email does not exist. Please sign up'
            });
        }
        //if user is found check email and password
        // create auth method in user model
        if(!user.authenticate(password)){
            return res.status(401).json({
                error: 'email and password dont match'
            });
        }

        //generate a signed token with user id and secret
        const token = jwt.sign({_id:user._id},process.env.JWT_SECRET);
        // persist the token in cookie with expiry date
        res.cookie('t',token,{expire:new Date() + 9999});
        //return responde with user and token to frontend client
        const {_id, name, email, role} = user

        return res.json({token, user:{_id, email, name, role}});
    });
};

//signout function - clear cookie
exports.signout = (req,res) => {
    res.clearCookie('t');
    res.json({message: "Signout success"});
};

//middleware check if user is signed
exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms:["HS256"], 
    userProperty: 'auth'
});


//middleware check if auth user is user required
exports.isAuth = (req, res, next) => {
    let user = req.profile && req.auth && req.profile._id == req.auth._id;

    if(!user){
        return res.status(403).json({
            error:'Access denied'
        });
    }
    next();
};

//middleware check if user is admin
exports.isAdmin = (req, res, next) => {
    if(req.profile.role === 0){
        return res.status(403).json({
            error: 'Admin resource! Access denied!'
        });
    }
    next();
};