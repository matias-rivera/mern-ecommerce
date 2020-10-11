const {Order, CartItem} = require('../models/order');
const {errorHandler} = require('../helpers/dbErrorHandler');

//create order
exports.create = (req, res) => {
    //get user information
    req.body.order.user = req.profile;
    //create order
    const order = new Order(req.body.order);
    //save order on database
    order.save((error, data) => {
        if(error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }
        res.json(data)
    })

};