var express = require("express"),
    morgan = require("morgan"),
    repos = require('./routes/repos'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    flash = require('connect-flash');
    
// express will help us build the routes
var app = express();

app.set('views', __dirname + '/views');
// Define the view (templating) engine
app.set('view engine', 'ejs'); //ejs will be the default viewing template

app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({    // to support URL-encoded bodies
  extended: true
}));

app.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}));

app.use(cookieParser('your secret here'));
app.use(session({
    secret: "cookie_secret",
    //store: sessionStore, // relace default store with connect-mongo session store
    resave: true,
    saveUninitialized: true
}));

// Flash mesages, done after setting up session and cookie parser
app.use(flash());
app.use(function(req, res, next){
  res.locals.success_msgs = req.flash('success');
  res.locals.error_msgs = req.flash('error');
  next();
});

app.use(morgan('tiny'));  // Log requests

//it will looks for all html files in path /public
app.use('/', express.static(__dirname + '/public'));

//the default route will link to home.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/home', function(req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

/* Could be used for login functionality
app.get('/signup', function(req, res) {
    res.sendFile(__dirname + '/public/signup.html');
});
*/

app.use('/repos', repos);

// app.get('/search', routes.getUserRepo);


var port = 50000;
app.listen(port);
console.log("Server listening at http://localhost:50000/");

module.exports = app;
