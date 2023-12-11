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

    let response: GetEventResponse;
    parseString(incomingXMLString, { explicitArray: false }, (err: Error, result: EventData) => {
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
