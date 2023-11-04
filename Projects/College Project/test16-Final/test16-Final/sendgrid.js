const sendGrid = (email) => {
  const otp = require("./otp");
  const sgMail = require("@sendgrid/mail");
  var pwd = String(otp.otp());
  var content = `<h1>Your verification code:${pwd}`;
  const API_KEY =
    "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";
  sgMail.setApiKey(API_KEY);

  const message = {
    to: email,
    from: "a.j.manoow@gmail.com",
    subject: "One Time Password",
    text: pwd,
    html: content,
  };

  sgMail
    .send(message)
    .then((response) => console.log("Email sent..."))
    .catch((error) => console.log(error.message));

  return pwd;
};
module.exports = { sendGrid };
