const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME || 'your_mailtrap_username',
      pass: process.env.EMAIL_PASSWORD || 'your_mailtrap_password'
    }
  });
  const mailOptions = {
    from: 'Auth System <auth@example.com>',
    to: options.to,
    subject: options.subject,
    html: options.text
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;