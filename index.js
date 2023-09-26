const express = require("express");
const port = process.env.PORT || 5000;
const cors = require("cors");
const app = express("app");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

// mongodb

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.hi7rjxl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const taskCollection = client.db("task-server").collection("allTask");
    const usersCollection = client.db("task-server").collection("users");

    //  task getting api
    app.get("/tasks", async (req, res) => {
      const result = await taskCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      // const sortedResult = result.sort((a, b) => new Date(b.date) - new Date(a.date))
      res.send(result);
    });

    //    task add api
    app.post("/addTask", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await taskCollection.insertOne(data);
      res.send(result);
    }),
      // update task Api
      app.patch("/tasks/:id", async (req, res) => {
        const taskId = req.params.id;
        const updateTaskData = req.body;
        try {
          const result = await taskCollection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: updateTaskData }
          );
          if (result.matchedCount === 0) {
            res.status(404).json({ error: "Task not Found" });
          } else {
            res.json({ message: "Task update Successfully" });
          }
        } catch (error) {
          console.error("Error Updating Task", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });

    // user api data create
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // update task data
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const {
        status,
        title,
        description,
        date,
        assignTo,
        priority,
        assignEmail,
      } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
          title: title,
          description: description,
          date: date,
          assignTo: assignTo,
          priority: priority,
          assignEmail: assignEmail,
        },
      };
      const options = { upsert: true };
      const result = await taskCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // comment api
    app.patch("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const commentData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          commentData,
        },
      };
      const result = await taskCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // user data get
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // admin get api
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.roll === "admin" };
      res.send(result);
    });
    // make admin api
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          roll: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // make admin api
    app.patch("/users/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          roll: "user",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("task server is running");
});

app.listen(port, () => {
  console.log(`task is running port ${port}`);
});
