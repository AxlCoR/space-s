var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var SALT_FACTOR=10;

var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    role:{type:String}
});

var donothing=()=>{

}

userSchema.pre("save",function(done){
    var user = this;
    if(!user.isModified("password")){
        return done();
    }
    bcrypt.genSalt(SALT_FACTOR,(err,salt)=>{
        if(err){
            return done(err);
        }
        bcrypt.hash(user.password,salt,donothing,(err,hashedpassword)=>{
            if(err){
                return done(err);
            }
            user.password = hashedpassword;
            done();
        });
    });
});

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);  
  };

module.exports = mongoose.model('User', userSchema);