const express = require('express');
const router = express.Router();

const {requireSignin, isAuth, isAdmin} = require('../controllers/auth');
const {userById, read, update, purchaseHistory} = require('../controllers/user');

//test
router.get('/secret/:userId',requireSignin, isAuth, isAdmin, (req,res) =>{
    res.json({
        user: req.profile
    });
});

//routes
//get user profile
router.get('/user/:userId',requireSignin, isAuth, read );
//update user profile
router.put('/user/:userId',requireSignin, isAuth, update );
//get user purchase history
router.get('/orders/by/user/:userId',requireSignin, isAuth, purchaseHistory );

//find user by id
router.param('userId', userById);



module.exports = router;