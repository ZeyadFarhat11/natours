const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

class Email {
  constructor(user, url) {
    this.url = url;
    this.user = user;
    this.from = `Natours <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      user: this.user,
      url: this.url,
      subject,
    });

    const text = htmlToText.fromString(html);

    // 2) Defined email options
    const mailOptions = {
      from: this.from,
      to: this.user.email,
      subject,
      html,
      text,
    };

    // 3) Create transport and send email
    try {
      await this.createTransport().sendMail(mailOptions);
      console.log(`Email sent ✔`);
    } catch (err) {
      console.log(`Email Sent Error 💥`);
      console.error(err);
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordResetToken() {
    await this.send('passwordReset', 'Reset your password (valid for only 10 minutes)');
  }
}

module.exports = Email;
