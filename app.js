const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const expressValidator = require('express-validator');
require('dotenv').config();

//routes required
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const categoryRoutes = require('./routes/category')
const productRoutes = require('./routes/product')
const braintreeRoutes = require('./routes/braintree');

//app
const app = express();

//db
mongoose.connect(process.env.DATABASE,{
    useFindAndModify: false,
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    
}).then(()=> console.log('DB Connected'));

//middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

//routes middleware
app.use('/api',authRoutes);
app.use('/api',userRoutes);
app.use('/api',categoryRoutes);
app.use('/api',productRoutes);
app.use('/api',braintreeRoutes);

//port
const port = process.env.PORT || 5050;

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
