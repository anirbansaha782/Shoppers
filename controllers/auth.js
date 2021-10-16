const User = require('../models/user');


exports.getLogin = (req, res, next) => {
  //   const isLoggedIn = req
  //     .get('Cookie')
  //     .split(';')[1]
  //     .trim()
  //     .split('=')[1] === 'true';
  console.log(req.session.isLoggedIn);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {
  User.findById('6154ab250223706d2c8f8f96').then(user=>{
    req.session.user=user;
    req.session.isLoggedIn = true;
    res.redirect('/');
  }).catch(err=>console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(function(err) {
    console.log(err);
    res.redirect('/');
  })
};
