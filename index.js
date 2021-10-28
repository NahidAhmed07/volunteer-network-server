const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4v0cg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("volunteer_network");
    const eventCollection = database.collection("events");
    const userEventCollection = database.collection("user_events");

    app.get("/events", async (req, res) => {
      const cursor = eventCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // add a new event
    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventCollection.insertOne(newEvent);
      res.json(newEvent);
    });
    // single event delete
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await eventCollection.deleteOne(query);
      res.send(result);
    });

    // get single event
    app.get("/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await eventCollection.findOne(query);
      res.send(result);
    });

    // register user event
    app.post("/event/register", async (req, res) => {
      const newEvent = req.body;
      const userId = newEvent.userId;
      const eventId = newEvent.eventId;
      const query = { userId: { $in: [userId] }, eventId: { $in: [eventId] } };
      let result;
      const findEvents = await userEventCollection.find(query).toArray();
      if (findEvents.length > 0) {
        result = { eventAdded: true };
      } else {
        result = await userEventCollection.insertOne(newEvent);
      }
      res.json(result);
    });

    // get user register all event
    app.get("/user/events", async (req, res) => {
      const userID = req.query.userID;
      const query = { userId: { $in: [userID] } };
      const result = await userEventCollection.find(query).toArray();
      const eventIdArr = [];
      result.forEach((item) => eventIdArr.push(item.eventId));
      const eventQuery = { eventId: { $in: eventIdArr } };
      const userEvents = await eventCollection.find(eventQuery).toArray();
      res.send(userEvents);
    });

    // delete event form
    app.delete("/user/events/:eventId/:userId", async (req, res) => {
      const eventId = req.params.eventId;
      const userId = req.params.userId;
      const query = { userId: { $in: [userId] }, eventId: { $in: [eventId] } };
      const result = await userEventCollection.deleteOne(query);
      console.log(result);
      res.json(result);
    });

    // get all user event list for admin
    app.get("/event_list", async (req, res) => {
      const cursor = userEventCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volunteer Server Running");
});

app.listen(port, () => {
  console.log("volunteer server running on port", port);
});
