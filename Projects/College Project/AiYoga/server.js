//REQUIRING PACKAGES
// const PORT = process.env.PORT || 3000;
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv/config");
//DATABASE CONNECTION
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    err ? console.log(err) : console.log("Successfully connected to DB Atlas");
  }
);

//DATABASE SCHEMA & MODEL
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  google: Boolean,
});
const User = new mongoose.model("User", userSchema);

const Tuser = new mongoose.model("Tuser", userSchema);

//REQUEST HANDLING
const app = express();
const saltRounds = 5;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/welcome', function(req, res, next){
  res.links({
      editor: 'https://preview.p5js.org/a.j.manoow/embed/63jcT4COr',
  });
  next();
})
app.set("view engine", "ejs");

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
// app.get("/", (req, res) => res.send("Deployed"));
app.listen(process.env.PORT || 3000, () => console.log("server started @3000"));

app.post("/reg", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findOne({ email: email }, function (err, Exist) {
    if (Exist) {
      // res.send("Already registered in DB");
      res.redirect("/already_Register");
      app.get("/already_Register", (req, res) => {
        res.render("jumbotron", {
          data: { message: "Already Registered in DB" },
        });
      });
    } else {
      bcrypt.hash(password, saltRounds, function (err, hash) {
        const newUser = new User({
          email: email,
          password: hash,
          google: false,
        });
        newUser.save((err) => {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/welcome");
            app.get("/welcome", (req, res) => {
              res.sendFile(__dirname + "/home.html");
              // res.redirect("https://preview.p5js.org/a.j.manoow/embed/63jcT4COr");
            });
          }
        });
      });
    }
  });
});

app.post("/log", (req, res) => {
  const flag = 1;
  let email = req.body.email;
  let password = req.body.password;
  User.findOne({ email: email }, (err, foundUser) => {
    if (err) console.log(err);
    else {
      if (foundUser) {
        console.log("Userfound");
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            console.log("Authenticated");
            res.redirect("/welcome");
            app.get("/welcome", (req, res) => {
              res.sendFile(__dirname + "/home.html");
              // res.redirect("https://preview.p5js.org/a.j.manoow/embed/63jcT4COr");
              // res.send('editor');
            });
          } else {
            // console.log("Incorrect Password");
            res.redirect("/incorrect_Password");
            app.get("/incorrect_Password", (req, res) => {
              res.render("jumbotron", {
                data: { message: "Incorrect Password" },
              });
            });
          }
        });
      } else {
        res.redirect("/no_Regiser");
        app.get("/no_Regiser", (req, res) => {
          res.render("jumbotron", {
            data: { message: "Please Register" },
          });
        });
      }
    }
  });
});

app.get('*', function(req, res){
  res.render("jumbotron", {
    data: { message: "Invalid URL" },
  });
});

//PASSPORT AUTHENTICATION VIA GOOGLE
const oauth = require("./passport");
oauth.passport(app, User);
//FORGET PASSWORD HANDLING
app.get("/forget", (req, res) => {
  res.sendFile(__dirname + "/forget.html");
});
app.post("/forget", (req, res) => {
  var email = req.body.email;
  User.findOne({ email: email }, (err, foundUser) => {
    if (err) console.log(err);
    else {
      if (foundUser) {
        // console.log(foundUser);
        if (!foundUser.google) {
          // console.log(foundUser.google);
          Tuser.findOne({ email: email }, (err, foundTuser) => {
            if (foundTuser) {
              console.log("OTP already sent to mail :)");
              res.render("verification", {
                data: { email: email },
              });
            } else {
              var otp = require("./sendgrid");
              var password = otp.sendGrid(email);
              bcrypt.hash(password, saltRounds, function (err, hash) {
                const newTuser = new Tuser({
                  email: email,
                  password: hash,
                  google: false,
                });
                newTuser.save((err) => {
                  err
                    ? console.log(err)
                    : res.render("verification", {
                        data: { email: email },
                      });
                });
              });
            }
          });
        } else {
          res.render("jumbotron", {
            data: { message: "Please sign in with Google" },
          });
        }
      } else {
        res.render("jumbotron", {
          data: { message: "User Not Found" },
        });
      }
    }
  });
});
app.post("/verification", (req, res) => {
  var email = req.body.email;
  var password = req.body.vcode;
  // res.send(req.body.email + req.body.vcode);
  Tuser.findOne({ email: email }, (err, foundUser) => {
    if (err) console.log(err);
    else {
      if (foundUser) {
        console.log("Userfound");
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            res.render("newpassword", {
              data: { email: email, vcode: password },
            });
          } else {
            console.log("Incorrect verification Code");
            res.render("forgetjumbotron", {
              data: {
                message: "Incorrect Verification Code",
                route: "/forget",
              },
            });
          }
        });
      } else {
        res.send("User not found PLEASE REGISTER!");
      }
    }
  });
});

app.post("/newpassword", (req, res) => {
  var email = req.body.email;
  var vcode = req.body.vcode;
  var password = req.body.pwd1;
  // console.log(email, password);

  Tuser.findOne({ email: email }, (err, foundUser) => {
    if (err) console.log(err);
    else {
      if (foundUser) {
        bcrypt.compare(vcode, foundUser.password, function (err, result) {
          if (result === true) {
            Tuser.deleteOne({ email: email }, (err) => {
              if (err) {
                console.log("Tuser not removed");
              } else {
                console.log("Tuser removed");
              }
            });

            User.deleteOne({ email: email }, (err) => {
              if (err) {
                console.log("user not removed");
              } else {
                console.log("user removed");
              }
            });

            bcrypt.hash(password, saltRounds, function (err, hash) {
              const newUser = new User({
                email: email,
                password: hash,
                google: false,
              });
              newUser.save((err) => {
                err ? console.log(err) : res.redirect("/");
              });
            });
          } else {
            console.log("Oops!");
            res.render("jumbotron", {
              data: { message: "Oops! Something Wrong" },
            });
          }
        });
      }
    }
  });
});
