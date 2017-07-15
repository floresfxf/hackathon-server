var express = require('express');
var app = express();

['MONGODB_URI'].map(k => {
  if (! process.env[k]) {
    console.error('Missing environment variable', k, 'Did your source env.sh');
    process.exit(1);
  }
});

var hbs = require('express-handlebars')({
  defaultLayout: 'main',
  extname: '.hbs'
});
app.engine('hbs', hbs);
app.set('view engine', 'hbs');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
var Item = mongoose.model('Item', {
  type: {
    type: String,
  },
  color: String,
  imageurl: {
    type: String,
  },
  upc: Number,
  description: String,
});
var User = mongoose.model('User', {
  username: String,
  password: String,
  closet: {
    type:Array,
    default: [],
  },
  designs: {
    type: Array,
    default: [],
  },
});
var Design = mongoose.model('Design', {
  user: String,
  style: {
    type:Array,
    default: [],
  },
  rating: Number,
  items: {
    type:Array,
    default: [],
  },
});

app.post('/users/register', function(req,res){ //For user Registration
  var newUser = new User({
    username:req.body.username,
    password:req.body.password,
  });
  newUser.save(function(err){
    if (err){
      res.json({error:err});
    }
    else{
      res.json({success:true});
    }
  });
});

app.post('/users/login', function(req,res){ //Checking to see if user is logged in
  User.findOne({email:req.body.username},function(err,obj){
    if (err){
      res.json({error:err});
    }else{
      if (req.body.password  === obj.password){
        res.json({success:true});
      }else{
        res.json({error:"Incorrect Password"});
      }
    }
  });
});

app.get('/all/items/:username', function(req, res) { //Return users closet
  User.findOne({username:req.params.username},function(err,user){
    res.json(user.closet);
  });
});

app.get('/all/:username', function(req, res) { //returns user model
  User.findOne({username:req.params.username},function(err,user){
    res.json(user);
  });
});

app.get('/all/designs', function(req, res) { //returns all designs (Newsfeed)
  Design.find(function(err,designs){
    res.json(designs);
  });
});
app.get('/all/designs/:username', function(req, res) { //returns designs for a specific user
  User.findOne({username:req.params.username},function(err,user){
    res.json(user.designs);
  });
});


app.post('/new/items/:username', function(req, res) { //Adds new item to a users closet
  //TODO: Add links from item to user
  User.findOne({username:req.params.username},function(err,user){
    var body = req.body;
    var newItem = new Item({
      type: body.type,
      color: body.color,
      imageurl: body.imageurl,
      upc: body.upc,
      description: body.description
    });
    newItem.save(function(err, item){
      if (err){
        res.json({error:err});
      }
      else{
        console.log(user);
        user.closet.push(item);
        user.save(function(err){
          if (err){
            res.json({error:err});
          }
          else{
            res.json({success:true});
          }
        });
      }
    });
  });
});

app.post('/new/designs/:username', function(req, res) { //adds new design
  User.findOne({username:req.params.username},function(err,user){
    var body = req.body;
    var newDesign = new Design({
      user: req.params.username,
      style: body.styles,
      rating: body.rating,
      items: body.items,
    });
    newDesign.save(function(err, design){
      if (err){
        res.json({error:err});
      }
      else{
        user.designs.push(design);
        user.save(function(err){
          if (err){
            res.json({error:err});
          }
          else{
            res.json({success:true});
          }
        });
      }
    });
  });
});

app.post('/designs/voteup/:designId', function(req,res){ //upvote a design
  Design.findOne({_id:req.params.designId},function(err,design){
    design.rating = design.rating + 1;
    design.save(function(err){
      if (err){
        res.json({error:err});
      }
      else{
        res.json({success:true});
      }
    });
  });
});

app.post('/designs/votedown/:designId', function(req,res){ //downvote a design
  Design.findOne({_id:req.params.designId},function(err,design){
    design.rating = design.rating - 1;
    design.save(function(err){
      if (err){
        res.json({error:err});
      }
      else{
        res.json({success:true});
      }
    });
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Express started, listening to port: ', port);
});
