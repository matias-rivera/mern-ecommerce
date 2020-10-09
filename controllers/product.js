const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');


// middleware find product by id
exports.productById = (req, res, next, id) =>{
    Product.findById(id)
    .populate('category')
    .exec((err,product) => {
        if(err||!product){
            return res.status(400).json({
                error: 'Product not found'
            });
        }

        req.product = product;
        next();
    });
};

//return product
exports.read = (req,res) =>{
    req.product.photo = undefined;
    return res.json(req.product);
};

//create product
exports.create = (req,res) => {

    let form = new formidable.IncomingForm();

    //include extensions
    form.keepExtensions = true;

    //parse form data
    form.parse(req,(err,fields,files) => {
        if(err){
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        //check for all fields
        const {name,description,price,category,quantity,shipping,photo} = fields;
        
        if(!name || !description || !price || !category || !quantity || !shipping ){
            return res.status(400).json({
                error: 'All fields are required'
            })
        }
        

        let product = new Product(fields)

        if(files.photo){
            //Check if uploaded file is less than 1MB
            if(files.photo.size > 1000000){
                return res.status(400).json({
                    error: 'Image should be lees than 1MB in size'
                })
            }
            // image
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        //save product
        product.save((err,result) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }

            res.json(result);
        });
    });
};

//delete product
exports.remove = (req,res) =>{
    let product = req.product;
    product.remove((err, deletedProduct) =>{
        if(err){
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            "message" : "Product deleted successfully"
        });
    });
}

//update product
exports.update = (req,res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req,(err,fields,files) => {
        if(err){
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        //check for all fields
        const {name,description,price,category,quantity,shipping,photo} = fields;
        
        if(!name || !description || !price || !category || !quantity || !shipping ){
            return res.status(400).json({
                error: 'All fields are required'
            })
        }
        

        let product = req.product;
        product = _.extend(product, fields);

        if(files.photo){
            //Check if uploaded file is less than 1MB
            if(files.photo.size > 1000000){
                return res.status(400).json({
                    error: 'Image should be lees than 1MB in size'
                })
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        product.save((err,result) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }

            res.json(result);
        });
    });
};




/**
 * sell / arrival
 * http://localhost:5050/api/products?sortBy=sold&order=desc&limit=4
 * http://localhost:5050/api/products?sortBy=createdAt&order=desc&limit=4
 */

 //list products sort by asc/desc, column and also limit items returned
exports.list = (req,res) => {
    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Product.find()
        .select("-photo")
        .populate('category')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, products) => {
            if(err){
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json(products)
        });


};

/**
 * get products based on product category 
 */

exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Product.find({_id: {$ne: req.product}, category: req.product.category})
        .limit(limit)
        .populate('category', '_id name')
        .exec((err,products) => {
            if(err){
                return res.status(400).json({
                    error: "Product not found"
                });
            }
            res.json(products);
        });
};


//list categories
exports.listCategories = (req, res) => {
    Product.distinct("category", {}, (err, categories) => {
        if(err){
            return res.status(400).json({
                error: "Categories not found"
            });
        }
        res.json(categories);
    });
};


/**
 * list products by search
 */
exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Product.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

// return photo of product, middleware
exports.photo = (req, res, next) => {
    if(req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }

    next();
};

//search products by product name and category
exports.listSearch = (req, res) => {
    //create query object to hold search value and category value
    const query = {};
    //assign search value to query.name
    if(req.query.search){
        query.name = {$regex: req.query.search, $options: 'i'}
        //assign category value to query.category
        if(req.query.category && req.query.category != 'All'){
            query.category = req.query.category;
        }
        //find the product based on query object witch 2 props: search and category
        Product.find(query,(err,products) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            res.json(products)
        }).select('-photo');

    }
}