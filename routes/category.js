const express = require('express');
const router = express.Router();

const {create, categoryById, read, update, remove, list} = require('../controllers/category');
const {requireSignin, isAuth, isAdmin} = require('../controllers/auth');
const {userById} = require('../controllers/user');


//read a specific category
router.get('/category/:categoryId',read);
//create
router.post('/category/create/:userId', requireSignin,isAuth,isAdmin, create);
//update
router.put('/category/:categoryId/:userId', requireSignin,isAuth,isAdmin, update);
//delete
router.delete('/category/:categoryId/:userId', requireSignin,isAuth,isAdmin, remove);
//return all categories
router.get('/categories' ,list);


router.param('categoryId', categoryById);
router.param('userId', userById);


module.exports = router;