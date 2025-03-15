const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");

const sendEmail = asyncHandler(async (data, req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 2525, // alternate port 587
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MP
    }
  });

  // async..await is not allowed in global scope, must use a wrapper
  async function main() {
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: {
        name: "Model National Assembly",
        address: process.env.MAIL_ID
      }, // sender address
      to: data.to, // list of receivers
      subject: data.subject, // Subject line
      text: data.text, // plain text body
      html: data.html // html body
    });
  }

  main().catch(console.error);
});

const SendMail = async (context, email, subject, templateName) => {
    try {
      const templatePath = path.join(
        __dirname,
        `../emailTemplates/${templateName}.hbs`
      );
      const source = fs.readFileSync(templatePath, "utf8");
      const template = handlebars.compile(source);
      const html = template(context);
      const data = {
        to: email,
        text: "Hey User",
        subject: subject,
        html
      };
      sendEmail(data);
    } catch (error) {
      throw new Error(error);
    }
  };


  module.exports = SendMail;