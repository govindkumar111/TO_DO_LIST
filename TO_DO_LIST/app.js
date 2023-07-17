

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongoUrl = "";
const dbName = 'todolistdb';
mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: dbName,
      });




const ItemSchema = new mongoose.Schema({
    name:String, 
  });
  
  const Item = mongoose.model("Item", ItemSchema);
  
  const ListSchema = new mongoose.Schema({
    name: String,
    items:[ItemSchema] 
});
const List = mongoose.model("List",ListSchema);


const item1 = new Item({
   name:"Welcome to your todo_list !"
});
const item2 = new Item({
  name:"Hit + to add new items."
});
const item3 = new Item({
  name:"<-- hit this to delete an item."
}); 

const defaultitems = [item1,item2,item3];

 
async function insertDefaultItems() {
    try {
      await Item.insertMany(defaultitems);
      console.log("success");
    } catch (err) {
      console.error(err);
    }
  }
  



app.get("/", function(req, res) {

    Item.find({})
      .then(foundItems => {
        if(foundItems.length === 0 ){
            insertDefaultItems();
        }
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      })
      .catch(err => {
       
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  });
  

app.post("/", function(req, res){

  const itemname = req.body.newItem;
  const ListName = req.body.list;

  const item = new Item({name: itemname});

  if(ListName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({ name: ListName })
        .then(foundList => {
           foundList.items.push(item);
           foundList.save();
           res.redirect("/" + ListName);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
  }

});

app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName==="Today"){
        try {
            await Item.findByIdAndDelete(checkedItemId);
            console.log("Successfully deleted checked item.");
            res.redirect("/");
          } catch (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
          }
    }
    else {
        try {
            const foundList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } }
            );
            if (foundList) {
                res.redirect("/" +listName);
            }
        } catch (err) {
           
            console.error(err);
            res.status(500).send("Internal Server Error");
        }
    }
    
    
  });

  app.get("/:CustomListName", function(req, res) {
    const CustomListName = _.capitalize(req.params.CustomListName);

    List.findOne({ name: CustomListName })
        .then(foundList => {
            if (!foundList) {
                // console.log(CustomListName);
                const list = new List({
                    name: CustomListName,
                    items: defaultitems, 
                });
                list.save();
                res.redirect("/" + CustomListName);
            } else {
                res.render("List", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});


const PORT = 3000;

app.listen(PORT, function() {
  console.log("Server started on 3000");
});
