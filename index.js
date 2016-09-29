// Get options
var prefs = {
  host : "http://ss.fishioon.com:8000",
  ws_host : "ws://ss.fishioon.com:8000",
  defaultfontSize : 48,
  showAllMessages : false,
  showMyMessages : false,
  showUsername : true,
  pinWeixinTab : false,
  showNotifications : false,
  danmuDebug : true,
  authKey : "fishioon",
  authValue : "123456",
};

// Global Variables
var activated = false;
var isOnline = false;
var isLogin = false;
var sock = null;
var myTabs = [];
var last_tabid = 0;
var uid = 0;
var userName = "";

login("fish", "123456");
// Toolbar Button
chrome.browserAction.onClicked.addListener(function(tab) {
  broadcast(myTabs[last_tabid].groupid, 'hello');
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (!isLogin) {
    login(prefs.authKey, prefs.authValue);
    return;
  }
  last_tabid = tabId;
  if (!isOnline) {
    connect();
  }
  if (myTabs[tabId] === undefined || myTabs[tabId].url !== tab.url) {
    myTabs[tabId] = {url : tab.url, groupid : 0};
    joinGroup(tab.url, tabId);
  }
});

chrome.commands.onCommand.addListener(function(command) {
  console.log('Command:', command);
  showmsg('command:' + cmd);
});

function login(auth_key, auth_value) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", prefs.host + "/v1/chat/auth", true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.send(JSON.stringify({"auth_key" : auth_key, "auth_value" : auth_value}));
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      isLogin = true;
      var res = JSON.parse(xhr.responseText);
      session_id = res.session_id;
      uid = res.uid;
      userName = res.name;
      showmsg(last_tabid, "session_id:" + session_id);
    }
  };
}

function connect() {
  var wsuri = prefs.ws_host + "/v1/chat/connect" +
              "?session_id=" + session_id;

  sock = new WebSocket(wsuri);
  sock.onopen = function() { isOnline = true };

  sock.onclose = function(e) { isOnline = false; };
  sock.onmessage = function(e) {
    var msg = JSON.parse(e.data).result;
    showmsg(last_tabid, msg.content);
  };
}

function joinGroup(url, tabid) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", prefs.host + "/v1/chat/join", true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.send(JSON.stringify({"session_id" : session_id, "url" : url}));

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var group_id = JSON.parse(xhr.responseText).group_id;
      showmsg(last_tabid, "groupid:" + group_id);
      myTabs[tabid].groupid = group_id;
    }
  };
}

function leaveGroup(group_id) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", prefs.host + "/v1/chat/join", true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.send(JSON.stringify({"session_id" : session_id, "url" : url}));

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var group_id = JSON.parse(xhr.responseText).group_id;
      showmsg(last_tabid, "group_id:" + group_id);
    }
  };
}

function broadcast(group_id, content) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", prefs.host + "/v1/chat/broadcast", true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.send(JSON.stringify({"dest_id" : group_id, "content" : content}));

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // var group_id = JSON.parse(xhr.responseText).group_id;
      // showmsg(last_tabid, "group_id:" + group_id);
    }
  };
}

function showmsg(tabid, msg) {
  chrome.tabs.sendMessage(tabid, {
    type : 'danmu',
    message : {user : {name : 'fish'}, content : {text : msg, image : ''}}
  });
}
