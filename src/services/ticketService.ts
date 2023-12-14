import { HttpRequest } from "@azure/functions";
import { twilioClient } from "./twilioService";
import { parseString, processors } from "xml2js";
import {
  ticketsDataSchema,
  TicketsData,
  TicketData,
  HeaderData,
  EventData,
  eventDataSchema,
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
        resolve({ header, tickets });
      });
    });
  };

  getEvents = async (data: { sourceID: string; timeStamp: string; events: string[] }): Promise<GetEventResponse[]> => {
    const { sourceID, timeStamp, events } = data;

    const eGalaxyRequest = `<?xml version="1.0"?>
    <Envelope>
      <Header>
        <MessageID>0</MessageID>
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

    const res = await fetch("https://tickets.midway.org/eGalaxy/eGalaxy.ashx", {
      method: "POST",
      headers: { "content-type": "text/xml" },
      body: eGalaxyRequest,
    });

    // if (!res.ok) {
    //   throw Error(await res.text());
    // }

    const incomingXMLString = `<?xml version="1.0" encoding="UTF-8"?>
    <Envelope>
      <Header>
        <MessageID>0</MessageID>
        <MessageType>GetEventsResponse</MessageType>
        <SourceID>1</SourceID>
        <TimeStamp>2023-12-06 12:48:48</TimeStamp>
        <EchoData></EchoData>
        <SystemFields></SystemFields>
      </Header>
      <Body>
        <Events>
          <Event>
            <ResponseCode>0</ResponseCode>
            <EventID>243</EventID>
            <StartDateTime>${new Date(new Date().getDate() + 3)}</StartDateTime>
            <EndDateTime>2017-08-27 15:30:00</EndDateTime>
            <EventTypeID>1</EventTypeID>
            <OnSaleDateTime>2017-07-23 10:00:00</OnSaleDateTime>
            <OffSaleDateTime>2017-08-27 14:50:00</OffSaleDateTime>
            <ResourceID>1</ResourceID>
            <UserEventNumber>0</UserEventNumber>
            <Available>300</Available>
            <TotalCapacity>300</TotalCapacity>
            <Status>1</Status>
            <HasRoster>NO</HasRoster>
            <RSEventSeatMap>0</RSEventSeatMap>
            <PrivateEvent>NO</PrivateEvent>
            <HasHolds>NO</HasHolds>
            <EventName>Dinosaurs 3-D</EventName>
          </Event>
        </Events>
      </Body>
    </Envelope>`;

    const parsedResponse = await new Promise<GetEventResponse[]>((resolve, reject) => {
      parseString(incomingXMLString, { explicitArray: false }, (err: Error, result: EventData) => {
        if (err) {
          reject(err);
        }
        eventDataSchema.parse(result);
        const eventResponses = result.Envelope.Body.Events.Event.map((event) => ({
          StartDateTime: event.StartDateTime,
          EventName: event.EventName,
          EventID: event.EventID,
        }));
        resolve(eventResponses);
      });
    });

    return parsedResponse;
  };

  sendMessage = async (contact: Contact, EventName: string, EventTime: string) => {
    // Explicity check for non falsy and truthy values
    if (process.env["USE_TEST_PHONE_NUMBER"] === "1") {
      // Send any twilio messages to a test phone number
      return twilioClient.messages.create({
        from: "+447883305646",
        body: `Hi ${contact.firstName} ${contact.lastName}. This is confirmation of your booking for ${EventName} at ${EventTime}.`,
        to: process.env["TEST_PHONE_NUMBER"],
      });
    } else {
      return twilioClient.messages.create({
        from: "+447883305646",
        body: `Hi ${contact.firstName} ${contact.lastName}. This is confirmation of your booking for ${EventName} at ${EventTime}.`,
        to: contact.phoneNumber,
      });
    }
  };
}
