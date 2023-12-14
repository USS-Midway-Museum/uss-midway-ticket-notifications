import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TicketService } from "../services/ticketService";
import { Contact } from "../types";

export async function ticketRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const ticketService = new TicketService(request);
  const { header, tickets } = await ticketService.parseIncoming();
  const { SourceID, TimeStamp } = header;

  // A map of phone numbers to contacts
  const contacts: Record<string, Contact> = {};
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
    if (contacts[contact.Phone]) {
      if (!contacts[contact.Phone].events.find((e) => e.EventID === ticket.EventID)) {
        contacts[contact.Phone].events.push({ EventID, EventName });
      }
    } else {
      // Create the contact with the new event
      contacts[contact.Phone] = {
        firstName: contact.FirstName,
        lastName: contact.LastName,
        events: [{ EventID, EventName }],
      };
    }
  }

  for (const [number, contact] of Object.entries(contacts)) {
    for (const event of contact.events) {
      const message = await ticketService.sendMessage(number, event.EventName);
      console.log(message.status);
    }
  }

  return { body: "Done" };
}

app.http("ticket-request", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: ticketRequest,
});
