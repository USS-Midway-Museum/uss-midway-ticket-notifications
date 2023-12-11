import { HttpRequest } from "@azure/functions";
import { twilioClient } from "./twilioService";
import { parseString } from "xml2js";
import { inspect } from "util";
import {
  ticketsDataSchema,
  TicketsData,
  TicketData,
  HeaderData,
  EventData,
  eventDataSchema,
  GetEventResponse,
} from "../types";

export const TicketService = (request: HttpRequest) => {
  const parseIncoming = async () => {
    const incomingXMLString = await request.text();
    let tickets: TicketData[];
    let header: HeaderData;
    parseString(incomingXMLString, { explicitArray: false }, function (err: Error, result: TicketsData) {
      ticketsDataSchema.parse(result);
      tickets.push(...result.Envelope.Body.Tickets.Ticket);
      header = result.Envelope.Header;
    });
    return { header, tickets };
  };

  const getEvent = async (data: {
    sourceID: string;
    timeStamp: string;
    eventId: string;
  }): Promise<GetEventResponse> => {
    const { sourceID, timeStamp, eventId } = data;
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
            <EventID>${eventId}</EventID>
          </EventIDs>
        </GetEvents>
      </Body>
    </Envelope>`;

    const res = await fetch("https://tickets.midway.org/eGalaxy/eGalaxy.ashx", {
      method: "POST",
      headers: { "content-type": "text/xml" },
      body: eGalaxyRequest,
    });

    console.log(res);

    const incomingXMLString = await res.text();
    let response: GetEventResponse;
    parseString(incomingXMLString, (err: Error, result: EventData) => {
      eventDataSchema.parse(result);
      const { StartDateTime, EventName } = result.Envelope.Body.Events.Event;
      response = { StartDateTime, EventName };
    });
    return response;
  };

  const sendMessage = async (phoneNumber: string, EventName: string) => {
    return twilioClient.messages.create({
      from: "+447883305646",
      body: `Thank you for purchasing tickets for ${EventName}. We look forward to seeing you!`,
      to: phoneNumber,
    });
  };

  return {
    parseIncoming,
    getEvent,
    sendMessage,
  };
};
