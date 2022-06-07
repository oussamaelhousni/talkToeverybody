const { TextEncoder, TextDecoder } = require('util') ;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { MongoClient,ServerApiVersion } = require("mongodb");
const express = require("express");
const socket = require("socket.io");
const cors = require('cors')
const app = express();
app.use(cors({
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}))
app.use(express.static(__dirname + "/public"));
const expressServer = app.listen(4001);
const io = socket(expressServer,{cors: {
  origin: "*",
  methods: ["GET", "POST"]
}});
// connect to mongoDB
const uri = "mongodb+srv://oussama:oussama@cluster0.lkejb.mongodb.net/?retryWrites=true&w=majority";



MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 },function (err, client) {
  const db = client.db("mongochat");
  io.on("connect", (socket) => {
    let chat = db.collection("chats");

    // send the chat to the connected client
    chat
      .find({})
      .limit(100)
      .toArray((err, res) => {
        if (err) throw err;
        // emit message from db to client
        socket.emit("output", res);
      });

    // handle input Event
    socket.on("input", (data) => {
      let name = data.name;
      let message = data.message;
      // check for name and message
      if (!name || !message) {
        return sendStatus("please enter a name and message");
      }
      // insertMessage to database
      chat.insertOne({ name, message });
      io.emit("output", [data]);
      sendStatus({
        message: "Message sent",
        clear: true,
      });
    });

    socket.on("clear", () => {
      chat.deleteMany({}, () => {
        // emit cleared
        socket.emit("cleared");
      });
    });
    // create a function to send status
    const sendStatus = (status) => {
      socket.emit("status", status);
    };
  });
});
