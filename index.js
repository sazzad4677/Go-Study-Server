const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());
app.use(express.static("images"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vwiqv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const courseCollection = client.db(process.env.DB_NAME).collection("Courses");
  const orderCollection = client.db(process.env.DB_NAME).collection("Orders");
  const reviewCollection = client.db(process.env.DB_NAME).collection("Review");
  const teachersCollection = client.db(process.env.DB_NAME).collection("Teachers");
  const adminCollection = client.db(process.env.DB_NAME).collection("Admin");

  app.post("/addCourse", (req, res) => {
    const courses = req.body;
    courseCollection.insertOne(courses).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).json({
          msg: "Course added successfully",
        });
      }
    });
  });
  app.get("/courses", (req, res) => {
    courseCollection.find().toArray((err, result) => {
      res.send(result);
    });
  });
  app.get("/course/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    courseCollection.find({ _id: id }).toArray((err, result) => {
      res.send(result);
    });
  });
  app.delete("/deleteCourse/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    courseCollection
      .findOneAndDelete({ _id: id })
      .then((deleteResult) => res.send(deleteResult))
      .catch((err) => console.error(err));
  });

  app.post("/addTeacher", (req, res) => {
    const file = req.files.file;
    const teacherName = req.body.teacherName;
    const teacherEmail = req.body.teacherEmail;
    const newImage = file.data;
    const encodeImage = newImage.toString("base64");

    let image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encodeImage, "base64"),
    };

    if (image.contentType === ("image/jpeg" || "image/png " || "image/jpg")) {
      teachersCollection
        .insertOne({ teacherName, teacherEmail, image })
        .then((result) => {
          if (result.insertedCount > 0) {
            res.status(200).json({
              msg: `Teacher added successfully`,
            });
          } else {
            res
              .status(404)
              .json({ msg: "Something went wrong, Please try again later" });
          }
        });
    } else {
      res.status(415).json({
        msg: "Unsupported media type",
      });
    }
  });

  app.post("/addOrder", (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).json({
          msg: "Review added successfully",
        });
      }
    });
  });
  
  app.get("/review", (req, res) => {
    reviewCollection.find().toArray((err, result) => {
      res.send(result);
    });
  });
  app.get("/orders", (req, res) => {
    const checkEmail = req.query.email;
    teachersCollection.find({teacherEmail: checkEmail}).toArray((err, result) => {
      if(result > 0){
        orderCollection.find({email: checkEmail}).toArray((err, documents) => {
          res.send(documents)
        })
      }
      else{
        orderCollection.find({userEmail: checkEmail}).toArray((err, documents) => {
          res.send(documents)
        })
      }
    })
  });
  app.get("/checkTeacher", (req, res) => {
    const email = req.query.email;
    teachersCollection.find({teacherEmail: email}).toArray((err, result) => {
      res.send(result.length>0)
    });
  });
  app.post("/addAdmin", (req, res) => {
    const admin = req.body;
    adminCollection.insertOne(admin).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).json({
          msg: "Admin added successfully",
        });
      }
    });
  });
  app.get("/checkAdmin", (req, res) => {
    const email = req.query.email;
    adminCollection.find({adminEmail: email}).toArray((err, result) => {
      res.send(result.length>0)
    });
  });

});


app.get("/", (req, res) => {
  res.send("hello server");
});

app.listen(process.env.PORT || 5000);
