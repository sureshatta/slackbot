var request = require('request');
var Slack = require('slack-node');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require("mysql");
var app = express();
var appid= "98255975845.98734423956";
var appsecret= "107fa07540b9bc4ecca5249e5e13fe80";
var redirecturi ="http://80c46324.ngrok.io/slackbutton.html";
var oauthurl= "https://slack.com/api/oauth.access?code=";
var postmessageurl ="https://slack.com/api/chat.postMessage?token=";

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json())


app.get('/slackbutton.html', function(req, res) {
    res.sendFile(path.join(__dirname + '/slackbutton.html'));
    var parts = req.originalUrl.split("?");;
    if (parts.length > 1) {
        var res = parts[1];
        var code = res.split("=")[1];
        var url = oauthurl + code + "&client_id="++appid"&client_secret="+appsecret+"&redirect_uri="+redirecturi;
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var jsonresult = JSON.parse(body);
                console.log(jsonresult.error);
                var post;
                if (jsonresult.ok) {
                    console.log(jsonresult);
                    post = {
                        access_token: jsonresult.access_token,
                        user_id: jsonresult.user_id,
                        hook_url: "no permission",
                        response: body
                    };
                } else {
                    var post = {
                        access_token: 'failed',
                        user_id: 'failed',
                        hook_url: 'failed',
                        response: body
                    };
                }
                var query = con.query('INSERT INTO user SET ?', post, function(err, result) {

                });
              
            }
        })
    }
});

// First you need to create a connection to the db
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "slack"
});

con.connect(function(err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});


app.post('/receiveBotSlackMessages', function(req, res) {
    var reqfired = false;
    console.log("Event triggered");
    console.log(req.body);
    res.setHeader('content-type', ' application/json');
    console.log(req.body.event.subtype);
    res.status(200);
    res.send("");
    console.log("sending response to user");
    con.query('SELECT * FROM user where user_id="' + req.body.event.user + '"', function(err, rows) {
        if (err) throw err;

        if (rows.length > 0) {
            var message = "Hi, this is Niravana  automated bot. Right now I can only say HI :D ?";
            var user = rows[0].user_id;
            var jsonresult = JSON.parse(rows[0].response);
            var botaccesstoken = jsonresult.bot.bot_access_token;
            console.log("access token" + botaccesstoken);
            var url = postmessageurl + botaccesstoken + "&channel=" + user + "&text=" + message + "&as_user=true&pretty=1";
            request(url, function(error, response, body) {

                if (!error && response.statusCode == 200) {

                    console.log("Bot responded..");

                }
            })
        }

    });

});


app.listen(8085);


// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8085/");