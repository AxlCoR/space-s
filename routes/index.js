var express = require('express');
var router = express.Router();
var passport = require('passport');
var Cart = require('../models/cart');
var Order = require('../models/order');
var acl = require('express-acl');

var Product = require('../models/product');




acl.config({
  defaultRole:'invitado'
})

router.use(acl.authorize);

router.use((req,res,next)=>{
  res.locals.user = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  if(req.isAuthenticated()){
      req.session.role = req.user.role;
      next();
  }else{
      next();
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  var successMsg = req.flash('success')[0];
  var products = Product.find(function(err, docs){
    var productChunks = [];
    var chunkSize = 6;
    for (var i = 0; i < docs.length; i += chunkSize){
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    
    res.render('shop/index', { title: 'Express' , products: productChunks, successMsg: successMsg, noMessages: !successMsg, user: req.user});
  });
  
});

router.get('/add-to-cart/:id', function(req, res, next){
  var prouductId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(prouductId, function(err, product){
      if(err){
        return res.edirect('/');
      }
      cart.add(product, product.id);
      req.session.cart = cart;
      console.log(req.session.cart);
      res.redirect('/');
  });
});

router.get('/reduce/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next){
  if(!req.session.cart){
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice, user: req.user});
});

router.get("/add-books",(req,res)=>{
  res.render("shop/add-books", {user: req.user});

});

router.post('/add-books',(req,res,next)=>{
  var imagePath = req.body.imagePath;
  var title = req.body.title;
  var description = req.body.description;
  var price = req.body.price;
  var author = req.body.author;

 
      var product = new Product({
          imagePath:imagePath,
          title:title,
          description:description,
          price:price,
          author: author
      });
      product.save(function(err, result){
        req.flash('success', 'Succesfully added book');
        res.redirect('/');
        
      });
});



router.get('/checkout', isLoggedIn, function(req, res, next){
  if(!req.session.cart){
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/signup', passport.authenticate('local.signup', {
  failureRedirect: '/user/signup',
  failureFlash: true
}), function(req, res, next){
      if(req.session.oldUrl){
          var oldUrl = req.session.oldUrl;
          req.session.oldUrl = null;
          re.redirect(oldUrl);
          
      }else{
          res.redirect('/user/profile');
      }
});
router.post('/checkout', function(req, res, next){
  if(!req.session.cart){
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")("sk_test_5oVI9I6H3vMwBH4tzwMdtX4e");

  stripe.charges.create({
    amount: cart.totalPrice * 100,
    currency: "usd",
    source: req.body.stripeToken, // obtained with Stripe.js
    description: "Test Charge"
  }, function(err, charge) {
      if(err){
        req.flash('error', err.message);
        return res.redirect('/checkout');
      }
      var order = new Order({
        user: req.user,
        cart: cart,
        address: req.body.address,
        name: req.body.name,
        paymentId: charge.id
      });
      order.save(function(err, result){
        req.flash('success', 'Succesfully bought product');
        req.session.cart = null;
        res.redirect('/');
      });
      
  });
});

module.exports = router;

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
      req.session.role = req.user.role;
    
      return next();
  }
  req.session.oldUrl= req.url;
  res.redirect('/user/signin');
}
