const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv")

dotenv.config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

MONGODB_URL = process.env.MONGODB_URL

// CONNECT TO MONGO DB 
mongoose.connect(MONGODB_URL)

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('item', itemsSchema)

const task1 = new Item({
  name: "Welcome to TODO app!"
})

const task2 = new Item({
  name: "To add new task click +"
})

const task3 = new Item({
  name: "To delete click the checkbox"
})

const defaultTasks = [task1, task2, task3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}


const List = mongoose.model('list', listSchema)

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultTasks, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("success");
        }
      })
      res.redirect("/")
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  })
});

app.get("/:listName", function(req, res) {
  let listName = _.capitalize(req.params.listName)

  List.findOne({
    name: listName
  }, function(err, result) {
    if (!err) {
      if (!result) {

        const list = new List({
          name: listName,
          items: defaultTasks
        })

        list.save()

        res.redirect("/" + listName)
      } else {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items
        })
      }
    }
  })

})

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({
      name: listName
    }, function(err, result) {
      result.items.push(item)
      result.save()
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      console.log("deleted succesfully");
    })

    res.redirect("/")
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, result){
      if(!err){
        res.redirect("/"+listName)
      }
    })
  }

})

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port ==""){
  port = 3000
}


app.listen(port, function() {
  console.log("Server started succesfully on port 3000");
});
