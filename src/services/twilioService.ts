import { InvocationContext } from "@azure/functions";
import { Twilio } from "twilio";

let _twilioClient: Twilio;

export const twilioClient = (context: InvocationContext) => {
  if (_twilioClient) {
    return _twilioClient;
  }

  const apiKey = process.env["TWILIO_API_KEY"];
  const apiSecret = process.env["TWILIO_API_SECRET"];
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];

  context.info(`Connecting to Twilio account using Account ${accountSid} and API key ${apiKey}`);

  _twilioClient = new Twilio(apiKey, apiSecret, {
    accountSid,
  });

  return _twilioClient;
};
