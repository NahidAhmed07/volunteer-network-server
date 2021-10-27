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

    app.get("/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await eventCollection.findOne(query);
      res.send(result);
    });

    app.post("/event/register", async (req, res) => {
      const newEvent = req.body;
      const result = await userEventCollection.insertOne(newEvent);
      res.json(result);
    });

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
