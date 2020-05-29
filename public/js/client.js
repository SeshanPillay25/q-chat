$(function () {
  // Connect to socket.io
  let socket = io.connect("https://q-chat-app.herokuapp.com/");

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
    activeChatWindow: $("div#chatWindows div.active"),
    publicChat: $("#publicChat"),
    rooms: $("div#rooms"),
    chatWindows: $("div#chatWindows"),
    mainRoom: $("div#mainroom"),
  };

  const colors= ['#4285F4','#DB4437','#F4B400','#0F9D58'];

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
    let color = colors[Math.floor(Math.random() * colors.length)];
    domSelectors.userListUl.append(
      '<li id="' + data.socketID + '">' + data.username + "</li>"
    );
    $("#" + data.socketID).css('background-color', color);
  });

  //User logoff
  socket.on("logoff", function (id) {
    let disconnectedUser = $("li#" + id).text();
    if (disconnectedUser.length !== 0) {
      $("li#" + id).remove();
      $("#publicChat").append(
        "<p class='disconnected-message'>" +
          disconnectedUser +
          " has left the chat" +
          "</p>"
      );
    }
  });

  // Handle chat input
  domSelectors.chatText.keypress(function (e) {
    if (e.which === 13) {
      let message = domSelectors.chatText.val();
      let windowID = $("div#chatWindows div.active").attr("id");
      let publicChat = true;
      let secondUsername = false;
      let secondUserID;
      let data;

      if (message !== "") {
        if (!domSelectors.publicChat.hasClass("active")) {
          publicChat = false;
          let usersDiv = $("div.chatroom.active").attr("id");
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
        "] <b class='user-chat-name'>" +
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

  // Handle private chat
  $(document).on("dblclick", "div#userList li", function () {
    let senderUsername = localStorage.getItem("username");
    let receiverUsername = $(this).text();

    domSelectors.chatText.focus();

    if ($("div#rooms div#" + receiverUsername).length) {
      $("div#rooms div#" + receiverUsername).click();
      return;
    }

    $("div#rooms > div").removeClass("active");
    $("div#chatWindows > div").removeClass("active");

    domSelectors.rooms.append(
      "<div id=" +
        receiverUsername +
        " class='active'>" +
        "<span>x</span>" +
        receiverUsername +
        "</div>"
    );
    domSelectors.chatWindows.append(
      "<div id=" +
        senderUsername +
        "-" +
        receiverUsername +
        " class='chatroom active'></div>"
    );
  });

  //Handle second user chat window
  socket.on("secondUserChatWindow", function (data) {
    if ($("div#" + data.from).length){
      return;
    } 

    $("div#rooms > div").removeClass("active");
    $("div#chatWindows > div").removeClass("active");

    domSelectors.rooms.append(
      "<div id=" +
        data.from +
        " class='active'>" +
        "<span>x</span>" +
        data.from +
        "</div>"
    );
    
    domSelectors.chatWindows.append(
      "<div id=" +
        data.from +
        "-" +
        data.secondUsername +
        " class='chatroom active'></div>"
    );
  });

  // Choose room
  domSelectors.rooms.on("click", "div", function () {
    $("div#rooms > div").removeClass("active");
    $("div#chatWindows > div").removeClass("active");

    $(this).addClass("active");
    $(this).removeClass("new");

    if (domSelectors.mainRoom.hasClass("active")) {
      domSelectors.publicChat.addClass("active");
    } else {
      let firstUsername = localStorage.getItem("username");
      let secondUsername = $(this).attr("id");

      $("div#chatWindows div#" + firstUsername + "-" + secondUsername).addClass(
        "active"
      );
      $("div#chatWindows div#" + secondUsername + "-" + firstUsername).addClass(
        "active"
      );
    }
  });

  //Close private chat
  domSelectors.rooms.on("click", "span", function (e) {
    e.stopPropagation();

    let firstUsername = localStorage.getItem("username");
    let secondUsername = $(this).parent().attr("id");

    $("div#chatWindows div#" + firstUsername + "-" + secondUsername).remove();
    $("div#chatWindows div#" + secondUsername + "-" + firstUsername).remove();

    $(this).parent().remove();

    if ($("div#rooms > div").length == 1) {
      domSelectors.mainRoom.addClass("active");
      domSelectors.publicChat.addClass("active");
    }
  });
});