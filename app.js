var express = require('express');
var app = express();
var models = require('./models/models');
var Item = models.Item;
var User = models.User;
var Design = models.Design;

var hbs = require('express-handlebars')({
  defaultLayout: 'main',
  extname: '.hbs'
});
app.engine('hbs', hbs);
app.set('view engine', 'hbs');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



app.post('/users/register', function(req,res){ //For user Registration
  var newUser = new User({
    username:req.body.username,
    password:req.body.password
  });
  newUser.save(function(err){
    if (err){
      res.status(400).json({error:err});
    }
    else{
      res.status(200).json({success:true});
    }
  });
});

app.post('/users/login', function(req,res){ //Checking to see if user is logged in
  User.findOne({username:req.body.username},function(err,obj){
    if (err || !obj){
      res.status(400).json({error:err});
    }else{
      if (req.body.password  === obj.password){
        res.status(200).json({success:true});
      }else{
        res.status(401).json({error:"Incorrect Password"});
      }
    }
  });
});

//TODO: make the items field of a user also be a reference but deal with that later
app.get('/all/items/:username', function(req, res) { //Return users closet
  User.findOne({username:req.params.username},function(err,user){
    if(err || !user){
      res.status(400).json({error:err});
    }else{
      res.status(200).json(user.closet);
    }

  });
});

app.get('/all/designs', function(req, res) { //returns all designs (Newsfeed)
  console.log('here');
  Design.find({}, function(err,designs){
    if (err || !designs){
      res.status(400).json({error:err});
    }else{
      res.status(200).json(designs);
    }
  });
});

app.get('/all/designs/:username', function(req, res) { //returns designs for a specific user
  User.findOne({username:req.params.username},function(err,user){
    if (err || !user){
      res.status(400).json({error:err});
    }else{
      user.getDesigns(function(err, designs){
        if(err){
          // return next(err);
          res.status(400).json({error:err});
        } else{
          if(designs){
            res.status(200).json(user.designs);
          } else {
            res.status(400).json({error:err});
          }
        }
      });

    }
  });
});

app.get('/all/:username', function(req, res) { //returns user model
  User.findOne({username:req.params.username},function(err,user){
    if (err || !user){
      res.status(400).json({error:err});
    }else{
      res.status(200).json(user);
    }
  });
});


app.post('/new/items/:username', function(req, res) { //Adds new item to a users closet
  //TODO: Add links from item to user
  User.findOne({username:req.params.username},function(err,user){
    if (user){
      var body = req.body;
      var newItem = new Item({
        articleType: body.articleType,
        color: body.color,
        imageurl: body.imageurl,
        upc: body.upc,
        description: body.description
      });
      newItem.save(function(err, item){
        if (err){
          res.status(400).json({error:err});
        }
        else{
          console.log(user);
          user.closet.push(item);
          user.save(function(err){
            if (err){
              res.status(400).json({error:err});
            }
            else{
              res.status(200).json({success:true});
            }
          });
        }
      });
    }else{
      res.status(400).json({error:err});
    }
  });
});

app.post('/new/designs/:username', function(req, res) { //adds new design
  User.findOne({username:req.params.username},function(err,user){
    if (user){
      var body = req.body;
      var newDesign = new Design({
        user: req.params.username,
        userId: user._id,
        style: body.styles,
        rating: body.rating,
        items: body.items,
        title: body.title,
        gender: body.gender
      });
      newDesign.save(function(err, design){
        if (err){
          res.status(400).json({error:err});
        }
        else{
          res.status(200).json({success:true, design: design});
        }
      });
    }else{
      res.status(400).json({error:err});
    }
  });
});

app.post('/designs/voteup/:designId', function(req,res){ //upvote a design
  //SEND THE USERNAME INSIDE THE BODY OF THE REQUEST SO THAT YOU CAN UPDATE THE USERS OVERALL rating
  // req.body.usernamedesignerRating

  Design.findOne({_id:req.params.designId},function(err,design){
    if(err){
      res.status(400).json({error:err});
    } else {
      if (design){
        design.rating = design.rating + 1;
        design.save(function(err){
          if (err){
            res.status(400).json({error:err});
          }
          else{
            res.status(200).json({success:true, rating: design.rating});
          }
        });
      }
    }
  });
});

app.post('/designs/votedown/:designId', function(req,res){ //downvote a design
  Design.findOne({_id:req.params.designId},function(err,design){
    if (design){
      design.rating = design.rating - 1;
      design.save(function(err){
        if (err){
          res.status(400).json({error:err});
        }
        else{
          res.status(200).json({success:true, rating: design.rating});
        }
      });
    }else{
      res.status(400).json({error:err});
    }
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Express started, listening to port: ', port);
});
