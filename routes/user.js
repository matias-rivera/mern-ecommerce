const express = require('express');
const router = express.Router();

const {requireSignin, isAuth, isAdmin} = require('../controllers/auth');
const {userById, read, update} = require('../controllers/user');

//test
router.get('/secret/:userId',requireSignin, isAuth, isAdmin, (req,res) =>{
    res.json({
        user: req.profile
    });
});

//routes
router.get('/user/:userId',requireSignin, isAuth, read );
router.put('/user/:userId',requireSignin, isAuth, update );

//find user by id
router.param('userId', userById);



module.exports = router;