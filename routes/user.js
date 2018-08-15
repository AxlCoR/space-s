var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');
var User = require('../models/user');
var acl = require('express-acl');

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

var csrfProtecion = csrf();
router.use(csrfProtecion);


router.get('/profile', isLoggedIn, function(req, res, next){
    Order.find({user: req.user}, function(err, orders){
        if(err){
            return res.write('Error');
        }
        var cart;
        orders.forEach(function(order){
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('user/profile', { orders: orders});
    });
  });

  router.get('/orders', isLoggedIn, function(req, res, next){
    Order.find({}, function(err, orders){
        if(err){
            return res.write('Error');
        }
        var cart;
        orders.forEach(function(order){
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('user/orders', { orders: orders});
    });
  });



router.get('/logout', isLoggedIn, function(req, res, next){
    req.logout();
    res.redirect('/');
});

router.use('/', noLoggedIn, function(req, res, next){
    next();
});

router.get('/signup', function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signup',{csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
  });
  
/*
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
*/
  
  router.get('/signin', function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signin',{csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
  });
  
  router.post('/signin', passport.authenticate('local.signin', {
    failureRedirect: '/user/signin',
    failureFlash: true
  }), function(req, res, next){
        if(req.session.oldUrl){
            var oldUrl = req.session.oldUrl;
            req.session.oldUrl = null;
            res.redirect(oldUrl);
        }else{
            res.redirect('/');
        }
  });

  
router.post("/signup",function(req,res,next){
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.role;
    

    User.findOne({email: email},(err, user)=>{
        if(err){
            return next(err);
        }
        if(user){
            req.flash("error","El nombre del usuario ya lo ha tomado otro usuario");
            return res.redirect("/signup");
        }
        var newUser = new User({
            email: email,
            password: password,
            role: role
        });
        newUser.save(function(err, result){
            req.flash('success', 'Succesfully created account');
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
    res.redirect('/');
}

function noLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}