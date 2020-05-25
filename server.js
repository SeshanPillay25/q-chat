const MongoClient = require("mongodb").MongoClient;
let express = require("express");
let app = express();

// process.env.PORT is related to deploying on heroku
let server = app.listen(process.env.PORT || 3000, listen);

function listen() {
  let host = server.address().address;
  let port = server.address().port;
}

app.use(express.static("public"));

let io = require("socket.io")(server);

let url = "mongodb://127.0.0.1/q-chat";

MongoClient.connect(url, function (err, db) {
  if (err) {
    throw err;
  }

  // Set db constants
  const qchat = db.db("q-chat");
  const users = qchat.collection("users");
  const messages = qchat.collection("messages");

  //Initiate connection to socket.io
  io.on("connection", function (socket) {
    //Handle logon
    socket.on("username", function (username) {
      users.find().toArray(function (err, res) {
        if (err) throw err;
        socket.emit("users", res);
      });

      messages.find().toArray(function (err, res) {
        if (err) throw err;
        socket.emit("messages", res);
      });

      users.insertOne({ socketID: socket.id, username: username });

      socket.broadcast.emit("logon", {
        socketID: socket.id,
        username: username,
      });
    });

    //Handle logoff
    socket.on("disconnect", function () {
      users.deleteOne({ socketID: socket.id }, function () {
        socket.broadcast.emit("logoff", socket.id);
      });
    });

    // Handle chat input
    socket.on("input", function (data) {
      if (data.publicChat) {
        messages.insertOne({
          username: data.username,
          message: data.message,
          date: data.date,
        });
      }

      io.emit("output", data);
    });

    // Handle 2nd user trigger
    socket.on("secondUserTrigger", function (data) {
      socket.to(data.secondUserID).emit("secondUserChatWindow", data);
    });
  });
});
