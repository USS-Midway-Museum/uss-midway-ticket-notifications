import { HttpRequest } from "@azure/functions";
import { twilioClient } from "./twilioService";
import { parseString } from "xml2js";
import { randomUUID } from "crypto";
import {
  ticketsDataSchema,
  TicketsData,
  TicketData,
  HeaderData,
  EventData,
  eventsDataSchema,
  GetEventResponse,
  Contact,
} from "../types";

export class TicketService {
  private request: HttpRequest;

  constructor(request: HttpRequest) {
    this.request = request;
  }

  parseIncoming = async () => {
    const incomingXMLString = await this.request.text();
    return new Promise<{ header: HeaderData; tickets: TicketData[] }>((resolve, reject) => {
      parseString(incomingXMLString, { explicitArray: false }, function (err: Error, result: TicketsData) {
        if (err) {
          reject(err);
        }
        ticketsDataSchema.parse(result);
        const tickets = result.Envelope.Body.Tickets.Ticket;
        const header = result.Envelope.Header;
        if (Array.isArray(tickets)) {
          resolve({ header, tickets });
        } else {
          resolve({ header, tickets: [tickets] });
        }
      });
    });
  };

  getEvents = async (data: { sourceID: string; timeStamp: string; events: string[] }): Promise<GetEventResponse[]> => {
    const { sourceID, timeStamp, events } = data;

    const eGalaxyRequest = `<?xml version="1.0"?>
    <Envelope>
      <Header>
        <MessageID>${randomUUID()}</MessageID>
        <MessageType>GetEvents</MessageType>
        <SourceID>${sourceID}</SourceID>
        <TimeStamp>${timeStamp}</TimeStamp>
      </Header>
      <Body>
        <GetEvents>
          <EventIDs>
            ${events.map((id) => "<EventID>" + id + "</EventID>")}
          </EventIDs>
        </GetEvents>
      </Body>
    </Envelope>`;

    const res = await fetch(process.env["E_GALAXY_URL"], {
      method: "POST",
      headers: { "content-type": "text/xml" },
      body: eGalaxyRequest,
    });

    if (!res.ok) {
      throw Error(await res.text());
    }

    const incomingXMLString = await res.text();

    const parsedResponse = await new Promise<GetEventResponse[]>((resolve, reject) => {
      parseString(incomingXMLString, { explicitArray: false }, (err: Error, result: EventData) => {
        if (err) {
          reject(err);
        }
        eventsDataSchema.parse(result);
        if (Array.isArray(result.Envelope.Body.Events.Event)) {
          const eventResponses = result.Envelope.Body.Events.Event.map((event) => ({
            StartDateTime: event.StartDateTime,
            EventName: event.EventName,
            EventID: event.EventID,
          }));
          resolve(eventResponses);
        } else {
          const { StartDateTime, EventName, EventID } = result.Envelope.Body.Events.Event;
          resolve([{ StartDateTime, EventName, EventID }]);
        }
      });
    });

    return parsedResponse;
  };

  sendMessage = async (contact: Contact, EventName: string, EventTime: string) => {
    // Explicity check for non falsy and truthy values
    if (process.env["USE_TEST_PHONE_NUMBER"] === "true") {
      // Send any twilio messages to a test phone number
      return twilioClient.messages.create({
        messagingServiceSid: process.env["MESSAGING_SERVICE_SID"],
        body: `Hi ${contact.firstName} ${contact.lastName}. This is confirmation of your booking for ${EventName} at ${EventTime}.`,
        to: process.env["TEST_PHONE_NUMBER"],
      });
    } else {
      return twilioClient.messages.create({
        messagingServiceSid: process.env["MESSAGING_SERVICE_SID"],
        body: `Hi ${contact.firstName} ${contact.lastName}. This is confirmation of your booking for ${EventName} at ${EventTime}.`,
        to: contact.phoneNumber,
      });
    }
  };
}
