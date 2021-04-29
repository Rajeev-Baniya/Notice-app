const sgMail = require("@sendgrid/mail");
const sendgridAPIkey =
  "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";
sgMail.setApiKey(sendgridAPIkey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "rajeevbaniya11@gmail.com",
    subject: "Thanks for joining us",
    text: `welcome to the Notice app, ${name}, Hope you like our app`,
  });
};

module.exports = sendWelcomeEmail;
