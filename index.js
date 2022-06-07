const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//jwt token
const jwt = require('jsonwebtoken');

//MiddleWare
app.use(express.json());
const cors = require("cors");
app.use(cors());
const port = process.env.PORT || 5000;
require("dotenv").config();

//payment 
const stripe = require('stripe')(process.env.PAYMENT_KEY);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ypqd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const toolCollection = client.db("toolsProduct").collection("allTools");
  const bookingCollection = client.db("booking").collection("order");
  const reviewCollection = client.db("reviewData").collection("review");
  const userCollection = client.db("allUser").collection("user");
  console.log('database connected successfully');


  //JWT Implement

  const varifyJWT = (req, res, next) => {
    const author = req.headers.authorization;

    if (!author) {
      return res.status(401).send({ message: 'UnAuthorization' })
    }
    const token = author.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_ACCESS_KEY, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      req.decoded = decoded;
      next();
    });

  }




  /*======================================
      All API Caling Start From Here
  ======================================*/

  //Get All Tools from MongoDB 
  app.get('/allTools', (req, res) => {
    toolCollection.find({}).toArray()
      .then(result => {
        res.send(result)
      })
  })

  //Load Single Data From MongoDB
  app.get('/tools/:id', (req, res) => {
    const id = req.params.id;
    const qurey = { _id: ObjectId(id) }
    toolCollection.findOne(qurey)
      .then(result => {
        res.send(result)
      })

  })

  //Booking Order 
  app.post('/booking', (req, res) => {
    const order = req.body;
    bookingCollection.insertOne(order)
      .then(result => {
        res.send(result)
      })
  })

  //Update booking payment system 
  app.patch('/booking/:id', (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) }
    const payment = req.body;
    const updateBook = {
      $set: {
        paid: true,
        transitionId: payment.transitionId
      }
    }
    const updateBooking = bookingCollection.updateOne(filter, updateBook);
    res.send(updateBooking);
  })

  //User Booking Order 
  app.get('/myOrder', async (req, res) => {
    const email = req.query.email;
    const query = { email: email }
    const book = await bookingCollection.find(query).toArray();
    return res.send(book)

  })

  //Delete Booking Order 
  app.delete('/orderDelete/:id', (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) }
    bookingCollection.deleteOne(filter)
      .then(result => {
        res.send(result)
      })
  })


  //All Users SignUp or Social Media SignUp
  app.put('/user/:email', async (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const user = req.body;
    const options = { upsert: true };
    const update = {
      $set: user
    }
    const result = await userCollection.updateOne(filter, update, options);
    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });
    res.send({ result, token })

  })



  //Get All User 
  app.get('/allUser', (req, res) => {
    userCollection.find({}).toArray()
      .then(result => {
        res.send(result)
      })
  })


  app.get('/admin/:email', (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const user = userCollection.findOne(filter);
    const isAdmin = user.role === 'admin';
    res.send({ admin: isAdmin });
  })

  //Get All Booking Orders
  app.get('/bookingOrder', (req, res) => {
    bookingCollection.find({}).toArray()
      .then(result => {
        res.send(result)
      })
  })


  //Product Add Post in Server

  app.post('/allTools', (req, res) => {
    const data = req.body;
    toolCollection.insertOne(data)
      .then(result => {
        res.send(result)
      })

  })



  //  ==================Review Data=====================

  //Get All Review 
  app.get('/review', (req, res) => {
    reviewCollection.find({}).toArray()
      .then(result => {
        res.send(result)
      })
  })

  //Post User Review
  app.post('/review', (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review)
      .then(result => {
        res.send(result);
      })
  })


  //  ==================Payment Data=====================

  //Get Single Data find in Booking
  app.get('/getPayment/:id', (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    bookingCollection.findOne(filter)
      .then(result => {
        res.send(result)
      })
  })



});



app.get("/", (req, res) => {
  res.send("Server is Working");
});

app.listen(port, () => {
  console.log("server start success done");
});
