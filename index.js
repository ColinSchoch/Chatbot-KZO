var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

var categories = ["absenzenheft", "zimmer", "stundenplan", "mensa", "lehrer", "online", "sls und matur"];
var data = {
  absenzenheft              : [10, 0, 0, 0, 0, 0, 0],
  urlaubsgesuch             : [10, 0, 0, 0, 0, 0, 0],
  absentzenheft             : [10, 0, 0, 0, 0, 0, 0],
  unterschrift              : [10, 0, 0, 0, 0, 0, 0],
  unterschreiben            : [10, 0, 0, 0, 0, 0, 0],
  zimmer                    : [0, 6, 5, 0, 4, 0, 0],
  sportplatz                : [0, 10, 2, 0, 0, 0, 0],
  zeit                      : [2, 5, 5, 2, 5, 2, 1],
  turnhalle                 : [0, 10, 2, 0, 0, 0, 0],
  sporthalle                : [0, 10, 2, 0, 0, 0, 0],
  stundenplan               : [0, 5, 7, 0, 6, 5, 0],
  lektion                   : [0, 0, 8, 0, 5, 0, 0],
  essen                     : [0, 0, 0, 10, 0, 0, 0],
  mensa                     : [0, 0, 0, 10, 0, 0, 0],
  rabattkarte               : [0, 0, 0, 10, 0, 0, 0],
  lehrer                    : [5, 0, 0, 0, 10, 5, 0],
  unterricht                : [0, 0, 5, 0, 6, 0, 0],
  klasse                    : [0, 2, 2, 0, 6, 0, 0],
  problem                   : [0, 0, 0, 0, 5, 5, 0],
  online                    : [0, 0, 0, 0, 0, 10, 0],
  studmail                  : [0, 0, 0, 0, 0, 10, 0],
  email                     : [0, 0, 0, 0, 0, 10, 0],
  sls                       : [0, 0, 0, 0, 0, 0, 10],
  matur                     : [0, 0, 0, 0, 0, 0, 10],
  fragen                    : [0, 0, 0, 0, 0, 9, 0],
  datennutzungsbestimmung   : [0, 0, 0, 0, 0, 10, 0],
  haupttrakt                : [0, 10, 0, 0, 0, 0, 0],
  datennutzungsbestimmungen : [0, 0, 0, 0, 0, 10, 0],
  verloren                  : [5, 10, 0, 0, 0, 0, 0]
};

var importantWordsAbsenzenheft = ["wo", "neues", "wer", "unterschreiben", "wie", "viele", "früher", "unterschrift", "holen", "lange", "zeit", "urlaubsgesuch", "woher", "verloren", "voll", "absenzenheft", "wann"];
var importantWordsZimmer       = ["darf", "rein", "wo", "wie", "viel", "zeit", "mehr", "hat", "gehen", "a", "b", "c", "d", "e", "turnhalle", "turnhallen", "sporthalle", "sporthallen", "lange", "sportplatz", "verloren", "haupttrakt"];
var importantWordsStundenplan  = ["wo", "sehe", "zimmer", "wie", "stunde", "ausfällt", "finden", "finde", "stundenplan"];
var importantWordsMensa        = ["wie", "teuer", "essen", "menüplan", "wo", "funktioniert", "rabattkarte", "rabatkarte", "mensa"];
var importantWordsLehrer       = ["wo", "sehe", "welcher", "lehrer","unterichtet", "wann", "schule", "hat", "mit", "problem", "was", "in", "welchem", "zimmer", "ist", "jetzt", "klasse", "wie"];
var importantWordsOnline       = ["wo", "sehe", "ist", "stundenplan", "studmail", "was", "e-mail", "lehrer", "email", "online", "welche", "fragen", "du", "beantworten", "datennutzungsbestimmung", "datennutzungsbestimmungen", "wie"];
var importantWordsSlsUndMatur  = ["wann", "infos", "sls", "matur"];

// Server(Website) frontpage
app.get('/', function (req, res) {
    res.send('Dies ist der Chatbot für die KZO. Wenn du mit mir reden möchtest komm mich doch auf Facebook besuchen. ' +
    ' Bitte folge diesem Link:<a href="https://www.facebook.com/Chatbot-1835882586663460/?ref=aymt_homepage_panel">hier</a>');
});

app.get('/test', function (req, res) {
    res.send('Echo'); // Answer
});

app.get('/Datennutzungsbestimmung', function (req, res) {
    res.send("Datennutzungsbestimmung KZO-Bot vom 25.09.2017 <br /> <br /> "  +
"Diese Seite dient zu ihrer Information über die Datennutzungsbestimmungen des KZO-Bots.<br /> <br /> " +
"Ihre persönlichen Daten und Informationen werden in keiner Form vom KZO-Chatbot gespeichert. Nur der Name ihres Facebook-Profils ist für den Urheber dieser Seite sichtbar. Dieser wird aber niemanden weitergegeben." +
"Die Fragen die sie an den KZO-Bot stellen sind für den Betreiber sichtbar und werden eventuell zur Weiterentwicklung des KZO-Bots verwendet.<br /><br />" +
"Ansonsten sind sie aber für niemanden sichtbar und werden auch an niemanden weitergegeben oder gespeichert, abgesehen vom Facebook-Verlauf.<br /><br />" +
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

        answer = generateAnswer(relevantWords, estimatedCategory);


        sendMessage(event.sender.id, { text: answer });
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
  var classString = userInput.slice(-3).trim();
  var classes = ["ac6", "an6", "c6a", "c6b", "c6c", "m6a", "m6b", "n6a", "n6b", "w6b", "wn6", "a5", "c5a", "c5b", "c5c", "c5d", "cw5", "m5a", "m5b", "n5a", "n5b", "n5c", "w5", "a4", "c4a", "c4b", "c4c", "m4a", "m4b", "n4a", "n4b", "n4c", "n4d", "w4", "a3", "c3a", "c3b", "c3c", "m3a", "m3b", "n3a", "n3b", "n3c", "w3a", "w3b", "u2a", "u2b", "u2c", "u2d", "u2e", "u2f", "u1a", "u1b", "u1c", "u1d", "u1e", "u1f"];
  var exists = classes.indexOf(classString) >= 0 ;

  return userInput.search("stundenplan") >= 0 || userInput.search("sp") >= 0 && exists === true ;

}
function getTimeTableUrl(userInput) {
  var classString = userInput.slice(-3).trim();
  var classes = ["ac6", "an6", "c6a", "c6b", "c6c", "m6a", "m6b", "n6a", "n6b", "w6b", "wn6", "a5", "c5a", "c5b", "c5c", "c5d", "cw5", "m5a", "m5b", "n5a", "n5b", "n5c", "w5", "a4", "c4a", "c4b", "c4c", "m4a", "m4b", "n4a", "n4b", "n4c", "n4d", "w4", "a3", "c3a", "c3b", "c3c", "m3a", "m3b", "n3a", "n3b", "n3c", "w3a", "w3b", "u2a", "u2b", "u2c", "u2d", "u2e", "u2f", "u1a", "u1b", "u1c", "u1d", "u1e", "u1f"];
  var keys    = [2087 , 2088 , 2091 , 2094 , 2097 , 2090 , 2093 , 2092 , 2095 , 2096 , 2089 , 2075 , 2079 , 2082 , 2084 , 2086 , 2076 , 2078 , 2081 , 2080 , 2083 , 2085 , 2077 , 2064 , 2067 , 2070 , 2072 , 2066 , 2069 , 2068 , 2071 , 2073 , 2074 , 2065 , 2053 , 2056 , 2057 , 2058 , 2054 , 2055 , 2059 , 2060 , 2061 , 2062 , 2063 , 2041 , 2042 , 2043 , 2044 , 2045 , 2046 , 2047 , 2048 , 2049 , 2050 , 2051 , 2052];
  var classindex = classes.indexOf(classString);
  var key = keys[classindex];
  var date = new Date() ;
  var today = date.getFullYear().toString() + "-" + (date.getMonth()+1).toString() + "-" + date.getDate().toString();
  return "https://intranet.tam.ch/kzo/public/public-schedule?onlyTable=0&returnEntity=class&entityId=" + key + "&date=" + today + "&showBasicTimetable=0";
}

function getCategoryFromInput(userInput) {
  var words = userInput.split(" ");
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
    if (relevantWords.includes("wo") || relevantWords.includes("woher") || relevantWords.includes("wie") && relevantWords.includes("neues")){
      answer = "Ein neues Absenzenheft kannst du im Sekretariat holen. Dabei musst du aber entweder das volle Absenzenheft mitbringen, oder wenn du es verloren hast, muss der Klassenlehrer unterschreiben, dass du es verloren hast.";
    }
    else if (relevantWords.includes("unterschreiben")) {
      answer = "Das Absenzenheft muss von deinen Eltern und von jeder Lehrperson unterschrieben werden, bei welcher du gefehlt hast. Ausserdem muss der Klassenlehrer ganz am Schluss unterschreiben. Sobald du 18 bist darfst dann du anstelle deiner Eltern unterschreiben, vorher jedoch nicht!";
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("lange")&& relevantWords.includes("zeit")) {
      answer = "Um alle seine Absenzen unterschreiben zu lassen hat man 2 Wochen Zeit.";
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("urlaubsgesuch")&& relevantWords.includes("zeit")) {
      answer = "Um ein Urlaubsgesuch zu bekommen muss man die Unterschrift spätestens eine Woche vor dem Datum des Gesuchs holen.";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("urlaubsgesuch")) {
      answer = "Für ein Urlaubsgesuch muss man vom Rektor eine Bewilligung erhalten.";
    }
    else if (relevantWords.includes("verloren")&& relevantWords.includes("absenzenheft")) {
      answer = "Wenn man sein Absenzenheft verloren hat, kann man im Fundbüro danach fragen. Ansonsten muss man auf dem Sekretariat ein neues holen. Dafür braucht man jedoch die Unterschrift der Klassenlehrperson.";
    }
    else if (relevantWords.includes("wann")&& relevantWords.includes("urlaubsgesuch")) {
    answer = "Um ein Urlaubsgesuch zu bekommen muss man die Unterschrift spätestens eine Woche vor dem Datum des Gesuchs holen.";
    }
    else if (relevantWords.includes("absenzenheft")&& relevantWords.includes("voll")) {
      answer = "Wenn man ein volles Absenzenheft hat kann man auf dem Sekretariat ein neues holen. Man muss aber das volle Absenzenheft mitnehmen um ein neues zu bekommen.";
    }
  }
  else if (estimatedCategory === "zimmer"){
    if (relevantWords.includes("darf")&& relevantWords.includes("rein")){
      answer = "Freie Zimmer darf man jederzeit betreten.";
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("lange")&& relevantWords.includes("sportplatz")){
      answer = "Um zum Sportplatz zu kommen braucht man etwa 5 Minuten.";
    }
    else if (relevantWords.includes("wo") || relevantWords.includes("wie")&& relevantWords.includes("sportplatz")){
      answer = "Den Sportplatz findet man gerade hinter der Eishalle. Um dort hinzukommen muss man bei den Turnhallen der Strasse nach rechts folgen und dann links über den Platz gehen, bis man zu Eishalle kommt. Dort muss man dann einfach noch rechts um die Eishalle gehen und dann kommt man zum Sportplatz.";
    }
    else if (relevantWords.includes ("wie")&& relevantWords.includes("viel")&& relevantWords.includes("zeit")&& relevantWords.includes("sportplatz")&& relevantWords.includes("mehr")){
      answer = "Grundsätzlich beginnt eine Sportlektion 2 Minuten später als normale Lektionen, aber wenn man auf dem Sportplatz Sport hat, kommen nochmals 3 Minuten hinzu. Das bedeutet, eine Lektion auf dem Sportplatz beginnt 5 Minuten später als eine normale Schullektion.";
    }
    else if (relevantWords.includes ("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("a")){
      answer = "Turnhalle A findet man wenn man von der Freitreppe aus zu den Turnhallen läuft und dann gleich nach der Treppe rechts und dann hinunter geht. "+
               "Die Umkleidekabinen findet man wenn man noch eine Treppe hinunter geht und danach links den Gang entlang geht.";
    }
    else if (relevantWords.includes("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhallen") || relevantWords.includes("sporthallen"))){
      answer = "Die Turnhallen findet man wenn man von der Freitreppe aus links am Brunnen vorbeigeht. Dann geht man bis zur Doppeltüre rechts, für die man keine Treppe runter muss. Dort befinden sich die Turnhallen.";
    }
    else if (relevantWords.includes ("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("b")){
      answer = "Turnhalle B findet man wenn man von der Freitreppe aus in Richtung Turnhallen geht und dann durch den Haupteingang läuft. "+
               "Wenn man die Treppe hinuntergeht und dann nach rechts geht, ist die erste Turnhalle die Turnhalle B.";
    }
    else if (relevantWords.includes ("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("c")){
      answer = "Turnhalle C findet man wenn man von der Freitreppe aus richtung Turnhallen geht und dann nach unten geht. Wenn man die Treppe hinuntergeht und dann nach links geht, ist die erste Turnhalle die Turnhalle C.";
    }
    else if (relevantWords.includes ("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("d")){
      answer = "Turnhalle D findet man wenn man von der Freitreppe aus in Richtung Turnhallen geht und dann durch den Haupteingang läuft. Wenn man die Treppe hinuntergeht und dann nach rechts geht, muss man an einer Turnhalle vorbei gehen und die hintere ist dann die Turnhalle D.";
    }
    else if (relevantWords.includes ("wo") || relevantWords.includes("wie") && (relevantWords.includes("turnhalle") || relevantWords.includes("sporthalle"))&& relevantWords.includes("e")){
      answer = "Turnhalle E findet man wenn man von der Freitreppe aus in Richtung Turnhallen geht und dann durch den Haupteingang läuft. Wenn man die Treppe hinuntergeht und dann nach links an der Turnhalle C vorbeigeht, kommt man zur Turnhalle E.";
    }
    else if (relevantWords.includes("verloren")){
      answer = "Wenn man etwas verloren hat und es eine andere Person gefunden hat kann man den verlorenen Gegenstand im Fundbüro abholen. Etwas aus dem Fundbüro zu entnehmen kostet 2 Franken. Das Fundbüro ist gleich beim Foyer.";
    }
    else if (relevantWords.includes("wo") && relevantWords.includes("haupttrakt")){
      answer = "Der Haupttrakt ist das grosse Gebäude in das man kommt, wenn man die KZO über die Freitreppe betritt.";
    }
  }
  else if (estimatedCategory === "stundenplan"){
    if (relevantWords.includes("wo")&& relevantWords.includes("sehe")&& relevantWords.includes("zimmer")){
      answer = "Das Zimmer sieht man auf dem Stundenplan. Es ist jeweils auf der unteren Zeile die Zahl ganz rechts.";
    }
    else if (relevantWords.includes ("stunde")&& relevantWords.includes("sehe")&& relevantWords.includes("ausfällt")){
      answer = "Ob eine Stunde ausfällt, sieht man auf dem Stundenplan. Wenn eine Lektion rot durchgestrichen ist, fällt diei Stunde aus.";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("finde") || relevantWords.includes("sehe") || relevantWords.includes("finden")&& relevantWords.includes("stundenplan")){
      answer = "Wenn du hier Stundenplan, gefolgt von deiner Klasse eingibst schicke ich dir einen Link welcher dir deinen Stundenplan zeigen wird. An der Schule hat es sonst auch zwei Bildschirme mit einem Stundenplan drauf. Der eine ist beim Foyer bei der Treppe und der andere findet man gegenüber dem Lehrerzimmer.";
    }
  }
  else if (estimatedCategory === "mensa"){
    if (relevantWords.includes("wie")&& relevantWords.includes("teuer")&& relevantWords.includes("essen")){
      answer = "Ein warmes Menü mit Salat kostet in der Mensa 9 Fr.; ohne Salat kostet es 8 Fr.";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("menüplan")){
      answer = "Den Menüplan sieht man bei der Mensa unten, wenn man die Treppe zur Mensa hinuntergeht, auf der linken Seite bei der grossen Tafel.";
    }
    else if (relevantWords.includes("wie")&& relevantWords.includes("funktioniert")&& relevantWords.includes("rabattkarte") || relevantWords.includes("rabatkarte")){
      answer = "Die Mensakarte funktioniert so, dass man zuerst für die volle Karte, also 12 Menüs bezahlt. Dann streicht man jedes mal wenn man ein Menü kauft einen Punkt ab. Wenn man seine 12 Menüs gekauft hat erhält man dann noch ein 13. Menü gratis!!!";
    }
    else if (relevantWords.includes("wo")&& relevantWords.includes("rabattkarte") || relevantWords.includes("rabatkarte")){
      answer = "Eine Rabattkarte kann man in der Mensa an der Kasse holen.";
    }
    else if (relevantWords.includes("mensa")){
      answer = "Die Mensa ist die Kantine der KZO. Man kann täglich dort etwas zu Mittag essen. Die Mensa findet man wenn man beim Foyer die Treppe hinunter geht.";
    }
  }
  else if (estimatedCategory === "lehrer"){
    if (relevantWords.includes("wo") || relevantWords.includes("wie")&& relevantWords.includes("sehe")&& relevantWords.includes("welcher")&& relevantWords.includes("lehrer")&& relevantWords.includes("unterichtet")){
      answer = "Man sieht alle Lehrer und ihre Unterichtszeiten auf dem Plan neben dem Lehrerzimmer. Das Lehrerzimmer findet man wenn man von dem Foyer aus in Richtung Aula läuft. Es ist es die letze Tür vor dem Seiteneingang zur KZO.";
    }
    else if (relevantWords.includes("wo") || relevantWords.includes("wie") && relevantWords.includes("sehe")&& relevantWords.includes("wann")&& relevantWords.includes("welcher")&& relevantWords.includes("lehrer")&& relevantWords.includes("schule")&& relevantWords.includes("hat")){
      answer = "Beim Lehrerzimmer hat es einen grossen Plan wo man von jeder Lehrperson sieht wann diese wo unterrichtet.";
    }
    else if (relevantWords.includes("klasse")&& relevantWords.includes("hat")&& relevantWords.includes("mit")&& relevantWords.includes("lehrer")&& relevantWords.includes("problem")){
      answer = "Am besten sprecht ihr zuerst mit der betroffenen Lehrperson über das Problem. Falls das nicht hilft, den Klassenlehrer kontaktieren und mit ihm/ihr die nächsten Schritte besprechen.";
    }
  }
  else if (estimatedCategory === "online"){
    if (relevantWords.includes("wo") || relevantWords.includes("wie") && relevantWords.includes("online")&& relevantWords.includes("stundenplan")){
      answer = "Unter https://intranet.tam.ch/kzo/ kann man sich anmelden und dann unter der Leiste 'Stundenplan' den jeweiligen Stundenplan mit allenfalls gestrichenen Stunden einsehen.";
    }
    else if (relevantWords.includes("wo") || relevantWords.includes("wie")&& relevantWords.includes("studmail")){
      answer = 'Die Studmail findest du wenn du dich im Intranet, "https://intranet.tam.ch/kzo/", anmeldest. Über den Briefumschlag oben rechts kommst du zu der Studmail.';
    }
    else if (relevantWords.includes("was")&& relevantWords.includes("e-mail") || relevantWords.includes("email")&& relevantWords.includes("lehrer")){
      answer = "Die E-Mail der Lehrpersonen ist immer vorname.nachname@kzo.ch. Dasselbe gilt auch für die Schüler, ausser dass nach dem @ noch ein studmail hinzukommt. Zum Beispiel so: mike.kobelt@studmail.kzo.ch ";
    }
    else if (relevantWords.includes("welche")&& relevantWords.includes("fragen")&& relevantWords.includes("du")&& relevantWords.includes("beantworten")){
      answer = "Ich kann dir Fragen zum Absenzenheft, den Zimmern, dem Stundenplan, der Mensa, den Lehrpersonen, zu Onlinethemen und zum SLS und der Matur beantworten.";
    }
    else if (relevantWords.includes("wo") || relevantWords.includes("wie")&& relevantWords.includes("datennutzungsbestimmung") || relevantWords.includes("datennutzungsbestimmungen")){
      answer = "Die Datennutzungsbestimmungen kannst du unter https://kzo-chatbot.herokuapp.com/Datennutzungsbestimmung einsehen.";
    }
  }
  else if (estimatedCategory === "sls und matur"){
    if (relevantWords.includes("wann")&& relevantWords.includes("infos")&& relevantWords.includes("sls")){
      answer = "Infos zum SLS erhält man im Verlauf der vierten Klasse.";
    }
    else if (relevantWords.includes("wann")&& relevantWords.includes("infos")&& relevantWords.includes("matur")){
      answer = "Infos zur Maturarbeit erhält man in Verlauf der fünften Klasse. Für die Maturaprüfungen selber erhält man dann erst relativ kurz vor den Prüfungen.";
    }
  }
  if (answer === "") {
    answer = "Sorry, ich habe deine Frage nicht verstanden. Bitte beachte, dass ich nur Hochdeutsch verstehe. Falls du deine Frage in Hochdeutsch gestellt hast, versuche die Frage anders zu formulieren. Achte bitte auch auf eine korrekte Rechtschreibung. Wenn auch das nichts nützt kann es sein, dass ich auf deine Frage keine Antwort weiss. Ich bitte um Entschuldigung.";
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
