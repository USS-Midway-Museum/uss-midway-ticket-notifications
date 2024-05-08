import { Twilio } from "twilio";

let _twilioClient: Twilio;

export const twilioClient = () => {
  if (_twilioClient) {
    return _twilioClient;
  }

  const apiKey = process.env["TWILIO_API_KEY"];
  const apiSecret = process.env["TWILIO_API_SECRET"];
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];

  _twilioClient = new Twilio(apiKey, apiSecret, {
    accountSid,
  });

  return _twilioClient;
};
