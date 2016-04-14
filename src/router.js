var controllers = require('./controllers');
var mid = require('./middleware');

var router = function(app) {

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.login);
  app.get('/signup', mid.requiresSecure, mid.requiresLogout, controllers.signupPage);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.signup);
  app.get('/logout', mid.requiresLogin, controllers.logout);

  // High Score Page Stuff
  app.get('/scorePage', mid.requiresLogin, controllers.scorePage);
  app.post('/scorePage', mid.requiresLogin, controllers.makeScore);

  // Page 1
  app.get('/page1', mid.requiresLogin, controllers.page1);

  // Index
  app.get('/', mid.requiresLogin, controllers.index);

  // All other GETs, 404
  app.get('/*', controllers.notFound);
};

//export the router
module.exports = router;
