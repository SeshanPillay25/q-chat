$(function () {
  // Connect to socket.io
  let socket = io.connect("http://localhost:3000");

  let domSelectors = {
    usernameField: $("#username"),
    usernameInputField: $("input#username"),
    enterChatBtn: $("#enterChat"),
    enterUsernameDiv: $("#enterUsername"),
    mainChatDiv: $("#chatMain"),
    userListLi: $("#userList li"),
    userListUl: $("#userList ul"),
    activeChatroom: $(".chatroom.active"),
    chatText: $("#chatText"),
    activeChatWindow: $("#chatWindows div.active"),
    publicChat: $("#publicChat"),
  };

  function enterChat(e) {
    e.preventDefault();

    let username = domSelectors.usernameField.val();

    localStorage.setItem("username", username);

    if (username.length > 0) {
      socket.emit("username", username);

      domSelectors.enterUsernameDiv.addClass("hidden");
      domSelectors.mainChatDiv.removeClass("hidden");

      socket.on("users", function (data) {
        data.forEach((element) => {
          if (
            !$("li#" + element.socketID).length &&
            domSelectors.userListLi.text() !== element.username
          ) {
            domSelectors.userListUl.append(
              '<li id="' + element.socketID + '">' + element.username + "</li>"
            );
          }
        });
      });

      domSelectors.activeChatroom.animate(
        { scrollTop: domSelectors.activeChatroom.prop("scrollHeight") },
        1000
      );
    } else {
      alert("Please enter a username 😃");
    }
  }

  domSelectors.enterChatBtn.click(function (e) {
    enterChat(e);
  });

  domSelectors.usernameInputField.keypress(function (e) {
    let username = domSelectors.usernameField.val();

    if (e.which === 13) {
      if (username.length > 0) {
        enterChat(e);
      } else {
        alert("Please enter a username 😃");
      }
    }
  });

  // User logon
  socket.on("logon", function (data) {
    domSelectors.userListUl.append(
      '<li id="' + data.socketID + '">' + data.username + "</li>"
    );
  });

  //User logoff
  socket.on("logoff", function (id) {
    $("li#" + id).remove();
    localStorage.removeItem("username");
  });

  // Handle chat input
  domSelectors.chatText.keypress(function (e) {
    if (e.which === 13) {
      let message = domSelectors.chatText.val();
      let windowID = domSelectors.activeChatWindow.attr("id");
      let publicChat = true;
      let secondUsername = false;
      let secondUserID;
      let data;

      if (message !== "") {
        if (!domSelectors.publicChat.hasClass("active")) {
          publicChat = false;
          let usersDiv = domSelectors.activeChatroom.attr("id");
          let userArray = usersDiv.split("-");

          secondUsername = userArray[1];
          secondUserID = $("li:contains(" + secondUsername + ")").attr("id");
          if (!secondUserID) {
            secondUsername = userArray[0];
            secondUserID = $("li:contains(" + secondUsername + ")").attr("id");
          }

          data = {
            from: localStorage.getItem("username"),
            message: message,
            date: moment().format("DD/MM/YYYY HH:mm"),
            secondUserID: secondUserID,
            secondUsername: secondUsername,
          };

          socket.emit("secondUserTrigger", data);
        }

        socket.emit("input", {
          username: localStorage.getItem("username"),
          message: message,
          date: moment().format("DD/MM/YYYY HH:mm"),
          windowID: windowID,
          publicChat: publicChat,
        });

        domSelectors.chatText.val("");
        e.preventDefault();
      } else {
        alert("Please enter a message to send");
      }
    }
  });

  // Handle output
  socket.on("output", function (data) {
    let windowID;

    if (!$("div#chatWindows div#" + data.windowID).length) {
      let userArray = data.windowID.split("-");
      windowID = userArray[1] + "-" + userArray[0];
    } else {
      windowID = data.windowID;
    }

    if (data.publicChat && !$("div#mainroom").hasClass("active")) {
      $("div#mainroom").addClass("new");
    } else {
      if (!$("div#" + windowID).hasClass("active")) {
        $("div#rooms div#" + data.username).addClass("new");
      }
    }

    $("div#chatWindows div#" + windowID).append(
      "<p>[" +
        data.date +
        "] <b>" +
        data.username +
        "</b>: " +
        data.message +
        "</p>"
    );

    $("div.chatroom.active").animate(
      { scrollTop: $("div.chatroom.active").prop("scrollHeight") },
      1000
    );
  });

  //Load chat messages
  socket.on("messages", function (data) {
    data.forEach((element) => {
      $("div#publicChat").append(
        "<p>[" +
          element.date +
          "] <b>" +
          element.username +
          "</b>: " +
          element.message +
          "</p>"
      );
    });
  });
});
