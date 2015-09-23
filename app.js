var express = require("express");
var GitHubApi = require("github"); // require git API
var morgan = require("morgan");
    
// express will help us build the routes
var app = express();

app.set('views', __dirname + '/views');
// Define the view (templating) engine
app.set('view engine', 'ejs'); //ejs will be the default viewing template
app.use(morgan('tiny'));  // Log requests

//it will looks for all html files in path /public
app.use('/', express.static(__dirname + '/public'));

//the default route will link to home.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

/* Could be used for login functionality
app.get('/signup', function(req, res) {
    res.sendFile(__dirname + '/public/signup.html');
});
*/

var port = 50000;
app.listen(port);
console.log("Server listening at http://localhost:50000/");

module.exports = app;
