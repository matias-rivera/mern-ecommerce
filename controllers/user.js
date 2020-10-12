const { errorHandler } = require('../helpers/dbErrorHandler');
const { Order } = require('../models/order');
const User = require('../models/user');

//middleware to find user by id
exports.userById = (req,res,next,id) => {
    User.findById(id).exec((err,user) =>{
        if(err || !user){
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    })
}

exports.read = (req, res) => {
    //hide password and salt
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

 exports.update = (req, res) => {
    
    User.findOneAndUpdate({_id: req.profile._id}, {$set: req.body}, {new: true},
        (err, user) => {
            if(err) {
                return res.status(400).json({
                    error: 'You are not authorized to perform this action'
                });
            }
            // hide password and salt
            user.hashed_password = undefined;
            user.salt = undefined;
            
            //response with user
            res.json(user);
        }
    );
};
 
//add order to user purchase history
exports.addOrderToUserHistory = (req, res, next) => {
    //declare an array
    let history = [];

    //get from req the data
    req.body.order.products.forEach((item) => {
        //loop the products to push into history array
        history.push({
            _id: item._id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: item.count,
            transaction_id : req.body.order.transaction_id,
            amount: req.body.order.amount
        })
    })

    //find the user and push the history array
    User.findOneAndUpdate(
        {_id: req.profile._id}, 
        {$push:{history: history}},
        {new: true},
        (error, data) => {
            if(error) {
                return res.status(400).json({
                    error: 'Could not update user purchase history'
                });
            }
            next();
        })
}

//return user purchase history
exports.purchaseHistory = (req, res) => {
    Order.find({user: req.profile._id})
        .populate('user',"_id name") //populate with user data
        .sort('-created') //sort by date
        .exec((err, orders) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            res.json(orders);
        })
}