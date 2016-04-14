//import libraries
var path = require('path'); //path is a built-in node library to handle file system paths
var express = require('express'); //express is a popular Model-View-Controller framework for Node
var compression = require('compression'); //compression library to gzip responses for smaller/faster transfer
var favicon = require('serve-favicon'); //favicon library to handle favicon requests
var cookieParser = require('cookie-parser'); //Library to parse cookies from the requests
var bodyParser = require('body-parser'); //library to handle POST requests any information sent in an HTTP body
var mongoose = require('mongoose'); //Mongoose is one of the most popular MongoDB libraries for node
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var csrf = require('csurf');

// Import Router
var router = require('./router.js');

// Database URL
var dbURL = process.env.MONGODB_URI || "mongodb://localhost/mvcMiniProject";

// Connect to Database
var db = mongoose.connect(dbURL, function(err) {
    if(err) {
        console.log("Could not connect to database");
        throw err;
    }
});

// Port to listen to
var port = process.env.PORT || process.env.NODE_PORT || 3000;

// Redis Stuff for Session
var redisURL = {
  hostname: 'localhost',
  port: 6379
};

var redisPASS;

if(process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(":")[1];
}

var app = express();

app.use('/assets', express.static(path.resolve(__dirname + '/../client/')));

app.use('/gameCode', express.static(path.resolve(__dirname + '/../game/')));

app.use(compression());

// Session Stuff
app.use(session({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS
  }),
  secret: 'Collective Game',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true
  }
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.set('view engine', 'jade');

app.set('views', __dirname + '/../views');

app.use(favicon(__dirname + '/../client/img/favicon.png'));

app.use(cookieParser());

// Security Junk
app.use(csrf());
app.use(function(err, req, res, next) {
  if(err.code !== 'EBADCSRFTOKEN') return next(err)

  return;
});

router(app);

var server = app.listen(port, function(err) {
    // App Failure
    if (err) {
      throw err;
    }
    console.log('Listening on port ' + port);
});
