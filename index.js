var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false})); // TODO: lookup
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is the Chatbot for the KZO, if you want to talk to me come visit me on Facebook. ' +
    ' Please follow this link:<a href="https://www.facebook.com/Chatbot-1835882586663460/?ref=aymt_homepage_panel">hier</a>'); // Answer
});

app.get('/test', function (req, res) {
    res.send('Echo'); // Answer
});

app.get('/privacy-policy', function (req, res) {
    res.send('DA'); // Text der PP noch einfügen
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
          if (event.message.text === "random") {
            sendMessage(event.sender.id, {text: getRandom()});
          } else {
            sendMessage(event.sender.id, {text: "Mirror: " + event.message.text});
          }
        }
    }
    res.sendStatus(200);
});
function getRandom() {
  var num = Math.random() *100;
  return Math.floor(num);
}
// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};
