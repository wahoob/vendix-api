import nodemailer from "nodemailer";
import { convert } from "html-to-text";
import ejs from "ejs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.fullName.firstName;
    this.url = url;
    this.from = `"Vendix" <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.NODE_ENV === "development") {
      return nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 465,
        secure: false,
        auth: {
          user: process.env.MAILTRAP_USERNAME,
          pass: process.env.MAILTRAP_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    const html = await ejs.renderFile(
      join(__dirname, `../views/${template}.ejs`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, {
        wordwrap: 130,
      }),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Vendix!");
  }
  async sendVerify() {
    await this.send(
      "verify",
      "Verify your account (valid for only 10 minutes)"
    );
  }
  async sendNotifyPasswordChange() {
    await this.send("notifyPasswordChange", "Your password has changed!");
  }
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset link (valid for only 10 minutes)"
    );
  }
}

export default Email;
