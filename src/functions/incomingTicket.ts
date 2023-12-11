import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TicketService } from "../services/ticketService";
import { Contact } from "../types";

export async function incomingTicket(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const ticketService = TicketService(request);
  const { header, tickets } = await ticketService.parseIncoming();
  const { SourceID, TimeStamp } = header;

  // A map of phone numbers to contacts
  const contacts = new Map<string, Contact>();
  for (const ticket of tickets) {
    const { EventID } = ticket;
    const { StartDateTime, EventName } = await ticketService.getEvent({
      sourceID: SourceID,
      timeStamp: TimeStamp,
      eventId: EventID,
    });

    const today = new Date();
    const todayPlus24Hours = new Date(today.getDate() + 1);

    // If the event start time is less than 24 hours away
    if (new Date(StartDateTime).getTime() > todayPlus24Hours.getTime()) {
      continue; // skip loop
    }

    const contact = ticket.TransactionContact;
    // Check if contact exists and doesn't have the event associated already
    if (contacts[contact.Phone] && !contacts[contact.Phone].events.includes({ EventID, EventName })) {
      contacts[contact.Phone].events.push({ EventID, EventName });
    } else {
      // Create the contact with the new event
      contacts[contact.Phone] = {
        firstName: contact.FirstName,
        lastName: contact.LastName,
        events: { EventID, EventName },
      };
    }
  }

  for (const contact of contacts) {
    for (const event of contact[1].events) {
      ticketService.sendMessage(contact[0], event.EventName);
    }
  }

  return { body: "Done" };
}

app.http("ticket-request", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: incomingTicket,
});
