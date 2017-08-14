var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false})); // TODO: lookup
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

var categories = ["absenzenheft", "zimmer", "stundenplan", "mensa", "lehrer", "online", "sls und matur"];
var data = {
  absenzenheft   : [10, 0, 0, 0, 0, 0, 0],
  unterschrift   : [10, 0, 0, 0, 0, 0, 0],
  unterschreiben : [10, 0, 0, 0, 0, 0, 0],
  zimmer         : [0, 6, 5, 0, 4, 0, 0],
  sportplatz     : [0, 10, 2, 0, 0, 0, 0],
  zeit           : [2, 5, 5, 2, 5, 2, 1],
  turnhalle      : [0, 10, 2, 0, 0, 0, 0],
  stundenplan    : [0, 5, 7, 0, 6, 5, 0],
  lektion        : [0, 0, 8, 0, 5, 0, 0],
  essen          : [0, 0, 0, 10, 0, 0, 0],
  mensa          : [0, 0, 0, 10, 0, 0, 0],
  rabattkarte    : [0, 0, 0, 10, 0, 0, 0],
  lehrer         : [5, 0, 0, 0, 10, 5, 0],
  unterricht     : [0, 0, 5, 0, 6, 0, 0],
  klasse         : [0, 2, 2, 0, 6, 0, 0],
  problem        : [0, 0, 0, 0, 5, 5, 0],
  online         : [0, 0, 0, 0, 0, 10, 0],
  studmail       : [0, 0, 0, 0, 0, 10, 0],
  email          : [0, 0, 0, 0, 0, 10, 0],
  sls            : [0, 0, 0, 0, 0, 0, 10],
  matur          : [0, 0, 0, 0, 0, 0, 10]
};

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

          var userInput = event.message.text.toLowerCase();


          if (userInput === "random") {
            sendMessage(event.sender.id, {text: getRandom()});
          } else if (userInput === "fluchen") {
            sendMessage(event.sender.id, {text: "https://www.youtube.com/watch?v=LosO2ifzLRE"});
          } else if ( checkIfTimetable(userInput) ) {
            sendMessage(event.sender.id, {text: getTimeTableUrl(userInput) });
          } else if (userInput === "hilfe") {
            sendMessage(event.sender.id, {text: "Bisher Bekannte Befehle sind: random, fluchen und Stundenplan gefolgt von einer Klasse"});
          } else if (userInput === "meaning of life") {
            sendMessage(event.sender.id, {text: "42"});
          }

           else {
            sendMessage(event.sender.id, {text: "Kategorie: " + getCategoryFromInput(userInput)});
            //sendMessage(event.sender.id, {text: "Mirror: " + event.message.text});
          }




        }
    }
    res.sendStatus(200);
});
function getRandom() {
  var num = Math.random() *100;
  return Math.floor(num);
}

function checkIfTimetable(userInput) {
  var classString = userInput.slice(-3);
  var classes = ["a6" , "an6", "c6a", "c6b", "c6c", "m6a", "m6b", "n6a", "n6b", "nm6", "w6a", "w6b", "ac5", "an5", "c5a", "c5b", "c5c", "m5a", "m5b", "n5a", "n5b", "w5b", "wn5", "a4" , "c4a", "c4b", "c4c", "c4d", "cw4", "m4a", "m4b", "n4a", "n4b", "n4c", "w4" , "a3" , "c3a", "c3b", "c3c", "m3a", "m3b", "n3a", "n3b", "n3c", "n3d", "w3", "u2a", "u2b", "u2c", "u2d", "u2e", "u2f", "u2g", "u1a", "u1b", "u1c", "u1d", "u1e", "u1f"];
  var exists = classes.indexOf(classString) >= 0 ;

  return userInput.search("stundenplan") >= 0 && exists === true ;

}
function getTimeTableUrl(userInput) {
  var classString = userInput.slice(-3);
  var classes = ["a6" , "an6", "c6a", "c6b", "c6c", "m6a", "m6b", "n6a", "n6b", "nm6", "w6a", "w6b", "ac5", "an5", "c5a", "c5b", "c5c", "m5a", "m5b", "n5a", "n5b", "w5b", "wn5", "a4" , "c4a", "c4b", "c4c", "c4d", "cw4", "m4a", "m4b", "n4a", "n4b", "n4c", "w4" , "a3" , "c3a", "c3b", "c3c", "m3a", "m3b", "n3a", "n3b", "n3c", "n3d", "w3", "u2a", "u2b", "u2c", "u2d", "u2e", "u2f", "u2g", "u1a", "u1b", "u1c", "u1d", "u1e", "u1f"];
  var keys    = [2020 , 2021 , 2017 , 2018 , 2019 , 2023 , 2026 , 2024 , 2027 , 2022 , 2025 , 2028 , 2006 , 2007 , 2010 , 2013 , 2016 , 2009 , 2012 , 2011 , 2014 , 2015 , 2008 , 1994 , 1998 , 2001 , 2003 , 2005 , 1995 , 1997 , 2000 , 1999 , 2002 , 2004 , 1996 , 1987 , 1988 , 1990 , 2034 , 2031 , 2033 , 1989 , 1991 , 1992 , 1993 , 2032 , 1979 , 1980 , 1981 , 1982 , 1983 , 1984 , 1985 , 1974 , 1975 , 1976 , 1977 , 1978 , 1986];
  var classindex = classes.indexOf(classString);
  var key = keys[classindex];
  var date = new Date() ;
  var today = date.getFullYear().toString() + "-" + (date.getMonth()+1).toString() + "-" + date.getDate().toString();
  return "https://intranet.tam.ch/kzo/public/public-schedule?onlyTable=0&returnEntity=class&entityId=" + key + "&date=" + today + "&showBasicTimetable=0&width=99.99%25";
}

function getCategoryFromInput(userInput) {
  userInput = removePunctuation(userInput);
 var words = userInput.split(" ");
 var results = [];
words.forEach( function(word) {
  if (data[word]){
    results.push(data[word]);
  }
} );

  var sum = new Array(categories.length).fill(0);
  results.forEach( function(result){
    for (i = 0; i < result.length; i++) {
      sum[i] = sum[i]+result[i];
    }
  });

  var categoryIndex = indexOfMax(sum);
return categories[categoryIndex];


}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}

function removePunctuation(userInput) {
  return userInput.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
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
