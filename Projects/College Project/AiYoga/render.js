const render = (res, app) => {
  res.redirect("/home");
  app.get("/home", (req, res) => {
    res.sendFile(__dirname + "/home.html");
  });
};
module.exports = { render };
