function otp() {
  var otpGenerator = require("otp-generator");
  var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
  return otp;
}
module.exports = { otp };
