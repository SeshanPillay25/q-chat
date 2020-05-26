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

//Initiate connection to socket.io
io.on("connection", function (socket) {
  //Handle logon
  socket.on("username", function (username) {
    socket.broadcast.emit("logon", {
      socketID: socket.id,
      username: username,
    });
  });

  //Handle logoff
  socket.on("disconnect", function () {
    socket.broadcast.emit("logoff", socket.id);
  });

  // Handle chat input
  socket.on("input", function (data) {
    io.emit("output", data);
  });

  // Handle 2nd user trigger
  socket.on("secondUserTrigger", function (data) {
    socket.to(data.secondUserID).emit("secondUserChatWindow", data);
  });
});
