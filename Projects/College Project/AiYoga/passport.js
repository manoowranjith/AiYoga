const passport = (app, User) => {
  const passport = require("passport");
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const bcrypt = require("bcrypt");
  const page = require("./render");
  const md5 = require("md5");
  require("dotenv/config");

  app.use(passport.initialize());
  const saltRounds = 10;

  app.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // page.render(res, app);
      // res.sendFile(__dirname + "/home.html");
      // res.render("jumbotron", {
      //   data: { message: "Incorrect Password" },
      // });
      res.redirect("/welcome");

      app.get("/welcome", (req, res) => {
        res.sendFile(__dirname + "/home.html");
      });

      app.get("/", (req, res) => {
        res.sendFile(__dirname + "/index.html");
      });
    }
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK,
      },
      function (accessToken, refreshToken, profile, cb) {
        cb(null, profile);
        // console.log(profile);
        var google_username = profile.emails[0].value;
        var google_id = md5(profile.id);
        // console.log(google_username, google_id);

        User.findOne({ email: google_username }, function (err, foundUser) {
          if (foundUser) {
            console.log("Already Signed in with Google");
            // bcrypt.compare(
            //   google_id,
            //   foundUser.password,
            //   function (err, result) {
            //     if (result === true) {
            //       console.log("Authenticated Via Google");
            //       res.send("Authenticated Via Google");
            //     } else {
            //       console.log("Not authenticated Via Google");
            //       res.send("Not authenticated Via Google");
            //     }
            //   }
            // );
          } else {
            bcrypt.hash(google_id, saltRounds, function (err, hash) {
              const newUser = new User({
                email: google_username,
                password: hash,
                google: true,
              });
              newUser.save((err) => {
                err
                  ? console.log(err)
                  : console.log("Successfully Signed in with Google");
              });
            });
          }
        });
      }
    )
  );
};

module.exports = { passport };
