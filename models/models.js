var mongoose = require('mongoose');

['MONGODB_URI'].map(k => {
  if (! process.env[k]) {
    console.error('Missing environment variable', k, 'Did your source env.sh');
    process.exit(1);
  }
});
mongoose.connect(process.env.MONGODB_URI);

var itemSchema = mongoose.Schema({
  type: {
    type: String,
  },
  color: String,
  imageurl: {
    type: String,
  },
  upc: String,
  description: String,
});

var userSchema = mongoose.Schema({
  username: String,
  password: String,
  closet: {
    type:Array,
    default: [],
  }
}, {
  toJSON:{
    virtuals:true
  }
});

//RETRIEVE ALL DESIGNS BY A GIVEN USER
//FIND ALL DESIGNS THAT HAVE A MATCHING USERID
userSchema.methods.getDesigns = function (callback){
  var self=this;
  Design.find({userId: self._id}).exec(function(err,designs){
    callback(err, designs);
  });
};

userSchema.virtual("rating").get(function(){
  self.getDesigns(this._id, function(err, designs) {
    if(designs && designs.length > 0) {
      var totalDesigns = designs.length;
      var totalRatings = 0;
      designs.forEach( (design) => {
        totalRatings += design.rating;
      });
      return Math.round(totalRatings / totalDesigns);
    } else {
      return 0;
    }
  });

});

var designSchema = mongoose.Schema({
  user: String,
  userId:{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  title: String,
  style: {
    type:Array,
    default: [],
  },
  gender: {
    type: String,
    default: 'Unisex'
  },
  rating: Number,
  items: {
    type:Array,
    default: [],
  },
});

// var User = mongoose.model('User', userSchema);
// var Design = mongoose.model('Design', designSchema);
// var Item = mongoose.model('User', itemSchema);
module.exports = {
  User: mongoose.model('User', userSchema),
  Design: mongoose.model('Design', designSchema),
  Item: mongoose.model('Item', itemSchema),
};
