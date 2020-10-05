const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');


// middleware find product by id
exports.productById = (req, res, next, id) =>{
    Product.findById(id).exec((err,product) => {
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
