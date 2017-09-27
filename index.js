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

var importantWordsAbsenzenheft = ["wo", "neues", "wer", "unterschreiben", "wie", "viele", "früher", "unterschrift", "holen", "lange", "zeit", "urlaubsgesuch"];
var importantWordsZimmer       = ["darf", "rein", "wo", "wie", "viel", "Zeit", "mehr", "hat", "gehen", "a", "b", "c", "d", "e", "turnhalle", "turnhallen", "sporthalle", "sporthallen"];
var importantWordsStundenplan  = ["wo", "sehe", "zimmer", "wie", "stunde", "ausfällt"];
var importantWordsMensa        = ["wie", "teuer", "essen", "menüplan", "wo", "funktioniert", "rabattkarte"];
var importantWordsLehrer       = ["wo", "sehe", "welcher", "lehrer","unterichtet", "wann", "schule", "hat", "mit", "problem", "was", "in", "welchem", "zimmer", "ist", "jetzt", "klasse"];
var importantWordsOnline       = ["wo", "sehe", "ist", "stundenplan", "studmail", "was", "e-mail", "lehrer"];
var importantWordsSlsUndMatur  = ["wann", "infos"];

// Server frontpage
app.get('/', function (req, res) {
    res.send('Dies ist der Chatbot für die KZO. Wenn du mit mir reden möchtest komm mich doch auf Facebook besuchen. ' +
    ' Bitte folge diesem Link:<a href="https://www.facebook.com/Chatbot-1835882586663460/?ref=aymt_homepage_panel">hier</a>');
});

app.get('/test', function (req, res) {
    res.send('Echo'); // Answer
});

app.get('/Datennutzungsbestimmung', function (req, res) {
    res.send("Datennutzungsbestimmung KZO-Bot vom 25.09.2017 <br /> <br /> "  +
"Diese Seite dient zu ihrer Information über die Datennutzungsbestimmungen des KZO-Bots. <br /> <br /> " +
"Ihre persönlichen Daten und Informationen werden in keiner Form von dem KZO-Chatbot gespeichert. Nur der Name ihres Facebook-Profils ist für den Urheber dieser Seite sichtbar. Dieser wird aber niemanden weitergegeben. " +
"Die Fragen die sie an den KZO-Bot stellen sind für den Betreiber sichtbar und werden eventuell zur Weiterentwicklung des KZO-Bots verwendet.<br /> <br /> " +
"Ansonsten sind sie aber für niemanden sichtbar und werden auch an niemanden weitergegeben. Die Fragen werden auch extern nicht gespeichert, sondern sind nur im Facebook-Verlauf. <br /> <br /> " +
"Es ist dem Urheber vorbehalten diese Datennutzungsbestimmungen bei Bedarf zu ändern."
);
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
app.post('/webhook', function(req, res) {
  var events = req.body.entry[0].messaging;
  for (i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.message && event.message.text) {

      var userInput = event.message.text.toLowerCase();
      userInput = removePunctuation(userInput);

      if (userInput === "random") {
        sendMessage(event.sender.id, {
          text: getRandom()
        });
      } else if (userInput === "fluchen") {
        sendMessage(event.sender.id, {
          text: "https://www.youtube.com/watch?v=LosO2ifzLRE"
        });
      } else if (checkIfTimetable(userInput)) {
        sendMessage(event.sender.id, {
          text: getTimeTableUrl(userInput)
        });
      } else if (userInput === "hallo" || userInput === "hi" || userInput === "hey" || userInput === "hoi" || userInput === "salut" || userInput === "ciao" || userInput === "grüezi") {
        sendMessage(event.sender.id, {
          text: randomAnswerForHello()
        });
      } else if (userInput === "meaning of life") {
        sendMessage(event.sender.id, {
          text: "42"
        });
      } else {
        var estimatedCategory = getCategoryFromInput(userInput);
        var relevantWords = [];
        var answer = "";

        if (estimatedCategory === "absenzenheft") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsAbsenzenheft);
        } else if (estimatedCategory === "zimmer") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsZimmer);
        } else if (estimatedCategory === "stundenplan") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsStundenplan);
        } else if (estimatedCategory === "mensa") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsMensa);
        } else if (estimatedCategory === "lehrer") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsLehrer);
        } else if (estimatedCategory === "online") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsOnline);
        } else if (estimatedCategory === "sls und matur") {
          relevantWords = getRelevantWordsForAnswer(userInput, importantWordsSlsUndMatur);
        }
        //TODO else case

        answer = generateAnswer(relevantWords, estimatedCategory);


        sendMessage(event.sender.id, { text: answer });
        //sendMessage(event.sender.id, {text: "Mirror: " + event.message.text});
      }
      res.sendStatus(200);
    }
  }
});

var answerForHello = [
  "Hallo!", "Hi", "Hey", "Guten Tag"
];

function randomAnswerForHello() {
var answerForHello1 = answerForHello[Math.floor(Math.random()*answerForHello.length)];
return answerForHello1;
}

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
  var words = userInput.split(" ");
  //todo document this
  var results = [];
  words.forEach(function(word) {
    if (data[word]) {
      results.push(data[word]);
    }
  });

  var sum = new Array(categories.length).fill(0);
  results.forEach(function(result) {
    for (i = 0; i < result.length; i++) {
      sum[i] = sum[i] + result[i];
    }
  });

  var categoryIndex = indexOfMax(sum);
  if (categoryIndex === 0&&sum[0]===0){
    return "";
  }
  return categories[categoryIndex];
}

function getRelevantWordsForAnswer(userInput, importantWords) {
  var words = userInput.split(" ");
  var relevantWords = [];
  words.forEach(function(word) {
    if (importantWords.includes(word) ) {
      relevantWords.push(word);
    }
  });
  return relevantWords;
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

function generateAnswer(relevantWords, estimatedCategory) {
  var answer = "";
  if (estimatedCategory === "absenzenheft"){
    if (relevantWords.includes("wo")&& relevantWords.includes("neues")){
      answer = "Ein neues Absenzenheft kanst du im Sekretariat holen. Dabei musst du aber entweder das volle Absenzenheft mitbringen, oder wenn du es verloren hast muss der Klassenlehrer unterschreiben dass du es verloren hast.";
    }
    else if (relevantWords.includes("unterschreiben")) {
      answer = "Das Absenzenheft muss von deinen Eltern und von jedem Lehrer unterschrieben werden, bei dem du gefehlt hast. Ausserdem muss der Klassenlehrer ganz am Schluss unterschreiben. Sobald du 18 bist darfst dann du anstelle deiner Eltern unterschreiben, vorher jedoch nicht!";
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("lange")&& relevantWords.includes("zeit")) {
      answer = ":O"; // richtige antwort einfügen
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("urlaubsgesuch")&& relevantWords.includes("zeit")) {
      answer = "Um ein Urlaubsgesuch zu bekommen muss man die Unterschrift spätestens eine Woche vor dem Datum des Gesuchs holen.";
    }

    // else noch hinzufügen
  }
  else if (estimatedCategory === "zimmer"){
    if (relevantWords.includes("darf")&& relevantWords.includes("rein")){
      answer = "Ja in freie Zimmer darf man rein.";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("sportplatz")){
      answer = "Den Sportplatz findet man gerade hinter der Eishalle. Um dort hinzukommen muss man bei den Turnhallen der nach rechts folgen und dann rechts über die Wiese gehen, bis man zu Eishalle kommt. Dort muss man dann einfach noch rechts um die Eishalle gehen und dann kommt man zum Sportplatz.";
    }
    else if (relevantWords.includes ("wie")&& relevantWords.includes("viel")&& relevantWords.includes("zeit")&& relevantWords.includes("sportplatz")&& relevantWords.includes("mehr")){
      answer = "Grundsätzlich beginnt eine Sportlektion 2 Minuten später als normale Lektionen, aber wenn man auf dem Sportplatz hat kommen nochmals 3 Minuten hinzu. Das heisst eine Lektion auf dem Sportplatz beginnt 5 Minuten später als eine normale Schullektion.";
    }
    else if (relevantWords.includes ("wo")&& (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("a")){
      answer = "Turnhalle A findet man wenn man von der Freitreppe aus zu den Turnhallen läuft und dann gleich nach der Treppe rechts und dann runter geht. "+
               "Die Umkleidekabinen findet man, wenn man noch eine Treppe runter geht und links den Gang entlang.";
    }
    else if (relevantWords.includes("wo")&& (relevantWords.includes("turnhallen") || relevantWords.includes("sporthallen"))){
      answer = "Die Turnhallen findet man wenn man von der Freitreppe aus links am Brunnen vorbeigeht. Dann geht man bis zur Doppeltüre rechts, für die man keine Treppe runter muss. Dort hinein findet man die Turnhallen.";
    }
    else if (relevantWords.includes ("wo")&& (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("b")){
      answer = "Turnhalle B findet man wenn man von der Freitreppe aus richtung Turnhallen geht und dann durch den Haupteingang läuft. "+
               "Wenn man die Treppe runterläuft und dann nach rechts geht ist die erste Turnhalle die Turnhalle B.";
    }
    else if (relevantWords.includes ("wo")&& (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("c")){
      answer = "Turnhalle C findet man wenn man von der Freitreppe aus richtung Turnhallen geht und dann nach unten geht. Wenn man die Treppe runterläuft und dann nach links geht ist die erste Turnhalle die Turnhalle C.";
    }
    else if (relevantWords.includes ("wo")&& (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("d")){
      answer = "Turnhalle D findet man wenn man von der Freitreppe aus richtung Turnhallen geht und dann durch den Haupteingang läuft. Wenn man die Treppe runterläuft und dann nach rechts geht muss man an einer Turnhalle vorbei gehen und die hintere ist dann die Turnhalle D.";
    }
    else if (relevantWords.includes ("wo")&& (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("e")){
      answer = "Turnhalle E findet man wenn man von der Freitreppe aus richtung Turnhallen geht und dann durch den Haupteingang läuft. Wenn man die Treppe runterläuft und dann nach links geht an der Turnhalle C vorbei kommt man zur Turnhalle E.";
    }
  }
  else if (estimatedCategory === "stundenplan"){
    if (relevantWords.includes("wo")&& relevantWords.includes("sehe")&& relevantWords.includes("zimmer")){
      answer = "Das Zimmer sieht man auf dem Stundenplan jeweils auf der unteren Zeile die Zahl ganz rechts.";
    }
    else if (relevantWords.includes ("stunde")&& relevantWords.includes("sehe")&& relevantWords.includes("ausfällt")){
      answer = "Ob eine Stunde ausfällt sieht man auf dem Stundenplan. Wenn eine Lektion rot durchgestrichen ist heisst dass, das die Stunde ausfällt.";
    }
  }
  else if (estimatedCategory === "mensa"){
    if (relevantWords.includes("wie")&& relevantWords.includes("teuer")&& relevantWords.includes("essen")){
      answer = "?";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("menüplan")){
      answer = "?";
    }
    else if (relevantWords.inludes("wie")&& relevantWords.includes("funktioniert")&& relevantWords.includes("rabattkarte")){
      answer = "?";
    }
  }
  else if (estimatedCategory === "lehrer"){
    if (relevantWords.includes("wo")&& relevantWords.includes("sehe")&& relevantWords.includes("welcher")&& relevantWords.includes("lehrer")&& relevantWords.includes("unterichtet")){
      answer = "Man sieht alle Lehrer und ihre Unterichtszeiten auf einem Plan neben dem Lehrerzimmer. Das Lehrerzimmer findet man wenn man von dem Foyer aus richtung Aula läuft ist es die letze Tür vor dem Seiteneingang zur KZO.";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("sehe")&& relevantWords.includes("wann")&& relevantWords.includes("welcher")&& relevantWords.includes("lehrer")&& relevantWords.includes("schule")&& relevantWords.includes("hat")){
      answer = "Beim Lehrerzimmer hat es einen grossen Plan bei dem man von jedem Lehrer sieht wann er wo Untericht hat.";
    }
    else if (relevantWords.includes("klasse")&& relevantWords.includes("hat")&& relevantWords.includes("mit")&& relevantWords.includes("lehrer")&& relevantWords.includes("problem")&& relevantWords.includes("was")){
      answer = "Am besten Versucht ihr zuerst mit dem Lehrer über euer Problem zu sprechen. Falls das nicht weiter hilf kontaktiert ihr am besten euren Klassenlehrer und besprecht mit ihm was ihr jetzt am besten als nächstes machen solltet.";
    }
  }
  else if (estimatedCategory === "online"){
    if (relevantWords.includes("wo")&& relevantWords.includes("sehe")&& relevantWords.includes("online")&& relevantWords.includes("stundenplan")){
      answer = "Unter https://intranet.tam.ch/kzo/ könnt ihr euch anmelden und dann unter der Leiste Stundenplan seht ihr euren jeweiligen Stundenplan mit allenfalls gestrichenen Stunden." +
              ' Um auf diese Seite zu kommen könnt ihr auch gleich diesem <a href="https://intranet.tam.ch/kzo/">Link</a> folgen.';
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("studmail")){
      answer = 'Die Studmail findest du wenn du dich auf <a href="https://intranet.tam.ch/kzo/">dieser</a> Seite anmeldest. Dort siehst du dann oben rechts einen Briefumschlag. Wenn du den anklickts kommst du zu der Studmail.';
    }
    else if (relevantWords.includes("was")&& relevantWords.includes("email")&& relevantWords.includes("lehrer")){
      answer = "Die E-Mail der Lehere ist immer vorname.nachname@kzo.ch. Dasselbe gilt auch für die Schüler, ausser dass nach dem @ noch ein studmail hinzukommt. Zum Beispiel so: mike.kobelt@studmail.kzo.ch "
    }
  }
  else {
    answer = "Sorry ich habe deine Frage nicht verstanden. Bitte beachte, dass ich nur Hochdeutsch verstehe. Falls du deine Frage in Hochdeutsch gestellt hast und ich deine Frage immernoch nicht verstehe, versuche die Frage anders zu formulieren.";
  }
  return answer;
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
