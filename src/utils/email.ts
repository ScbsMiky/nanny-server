import nodemailer from "nodemailer";
import dotenv from "../../../../libraries/dotenv";

export const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: dotenv.Required("mail_user").ToString( ),
    pass: dotenv.Required("mail_password").ToString( )
  }
});

export const sendEmail = (to: string, subject: string, text: string) => {
  return emailTransporter.sendMail({
    to,
    text,
    subject,
    
    from: dotenv.Required("mail_email").ToString( ),
  });
};