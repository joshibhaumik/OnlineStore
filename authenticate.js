const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("./models/Users");
const passport = require("passport");

exports.validateGoogle = passport => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google"
      },
      async (accessToken, refreshToken, profile, next) => {
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value
        };
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user === null) {
            let user_ = await User.create(newUser);
            next(null, user_);
          } else {
            next(null, user);
          }
        } catch (error) {
          console.log(error);
          next(error);
        }
      }
    )
  );

  passport.serializeUser((user, next) => next(null, user.id));

  passport.deserializeUser((id, next) =>
    User.findById(id, (err, user) => next(err, user))
  );
};

exports.validateAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(404).json({
      status: false,
      payload:[],
      error:"Path does not exists"
    });
  }
};

exports.verifyUser = (req, res, next)=> {
  if(req.isAuthenticated()) {
    next();
  } else {
    res.status(403).json({
      status: false,
      payload:[],
      error:"You are not authorized to perform this operation"
    });
  }
};