var Product =require('../models/product');
var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/shopping");

var products =[
    new Product({
        imagePath: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Gothiccover.png',
        title: 'Gothic Video Game',
        description: 'Awesome game',
        price: 10
    }),
    new Product({
        imagePath: 'https://i.pinimg.com/736x/d2/11/b3/d211b32207b87652e7a9848653ce2eb7--modern-warfare-videogames.jpg',
        title: 'Call od duty MW',
        description: 'Best game',
        price: 20
    }),
    new Product({
        imagePath: 'http://www.mobygames.com/images/covers/l/196739-supreme-commander-2-xbox-360-front-cover.jpg',
        title: 'Supreme Commander',
        description: 'Robots',
        price: 30
    })
];
var done = 0;
for (var i =0; i < products.length; i++){
    products[i].save(function(err, result){
        done++;
        if(done === products.length){
            exit();
        }
    });
}

function exit(){
    mongoose.disconnect();
}
