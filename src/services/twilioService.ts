import { Twilio } from "twilio";
export const twilioClient = new Twilio(process.env["TWILIO_API_KEY"], process.env["TWILIO_API_SECRET"], {
  accountSid: process.env["TWILIO_ACCOUNT_SID"],
});
