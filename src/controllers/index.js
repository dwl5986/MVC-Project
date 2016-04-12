var models = require('../models');

var Account = models.Account;
var HighScore = models.HighScore;
var path = require('path');

var loginPage = function(req, res) {
  res.render('login', { csrfToken: req.csrfToken() });
};

var signupPage = function(req, res) {
  res.render('signup', { csrfToken: req.csrfToken() });
};

var logout = function(req, res) {
  req.session.destroy();
  res.redirect('/');
};

var login = function(req, res) {
  if(!req.body.username || !req.body.pass) {
    return res.status(400).json({error: 'All fields are required.'});
  }

  Account.AccountModel.authenticate(req.body.username, req.body.pass, function(err, account) {
    if(err || !account) {
      return res.status(401).json({error: 'Invalid username or password'});
    }
    req.session.account = account.toAPI();

    res.json({redirect: '/'});
  });
};

var signup = function(req, res) {
  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({error: 'All fields are required.'});
  }
  if(req.body.pass !== req.body.pass2) {
    return res.status(400).json({error: 'Error! Passwords do not match.'});
  }

  Account.AccountModel.generateHash(req.body.pass, function(salt, hash) {
    var accountData = {
      username: req.body.username,
      salt: salt,
      password: hash
    };

    var newAccount = new Account.AccountModel(accountData);

    newAccount.save(function(err) {
      if(err) {
        console.log(err);
        return res.status(400).json({error: 'An error occurred'});
      }
      req.session.account = newAccount.toAPI();

      res.json({redirect: '/'});
    });
  });
};


var hostIndex = function(req, res){
  res.render('index', {
    title: 'Home',
    pageName: 'Home Page'
  });
};

// Function for page requests for page 1 (Game Page)
var hostPage1 = function(req, res) {
  res.render('page1');
};

// Handles all requests that have an error
var notFound = function(req, res) {
  res.status(404).render('notFound', {
    page: req.url
  });
};

var scorePage = function(req, res) {
  HighScore.ScoreModel.findByOwner(req.session.account._id, function(err, docs) {
    if(err) {
      console.log(err);
      return res.status(400).json({error: 'An error occurred'});
    }
    console.log(docs);
    res.render('page2', {csrfToken: req.csrfToken(), scores: docs});
  });
};

var makeScore = function(req, res) {
  console.log('making new score');
  if(!req.body.name || !req.body.score) {
    return res.status(400).json({error: 'Both name and score are required'});
  }

  var scoreData = {
    name: req.body.name,
    score: req.body.score,
    owner: req.session.account._id
  };

  var newScore = new HighScore.ScoreModel(scoreData);

  newScore.save(function(err) {
    if(err) {
      console.log(err);
      return res.status(400).json({error: 'An error occurred'});
    }
    res.json({redirect: '/scorePage'});
  });
};

//export the relevant public controller functions
module.exports = {
    loginPage: loginPage,
    login: login,
    logout: logout,
    signupPage: signupPage,
    signup: signup,
    index: hostIndex,
    page1: hostPage1,
    notFound: notFound,
    scorePage: scorePage,
    makeScore: makeScore
};
