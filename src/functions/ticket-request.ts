import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TicketService } from "../services/ticketService";
import { Events } from "../types";

export async function ticketRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const ticketService = new TicketService(request);
  const { header, tickets } = await ticketService.parseIncoming();
  const { SourceID, TimeStamp } = header;

  // A record of events with event IDs as keys and event info and contacts as values
  const events: Record<string, Events> = {};

  // Loop through tickets and populate events record
  for (const ticket of tickets) {
    const { EventID } = ticket;
    // Initialize empty contact array on creation of eventID property
    if (events[EventID] === undefined) {
      events[EventID] = { contacts: [] };
    }

    // Push contact onto record
    const contact = ticket.TransactionContact;
    events[EventID].contacts.push({
      firstName: contact.FirstName,
      lastName: contact.LastName,
      phoneNumber: contact.Phone,
    });
  }

  // Get event times for the events
  const eventTimes = await ticketService.getEvents({
    sourceID: SourceID,
    timeStamp: TimeStamp,
    events: Object.keys(events),
  });

  // Push event details on to events records
  for (const event of eventTimes) {
    const { EventID, EventName, StartDateTime } = event;
    const today = new Date();
    const todayPlus24Hours = new Date(today.getDate() + 1);

    // If the event start time is less than 24 hours away, skip the send message step
    if (new Date(StartDateTime).getTime() > todayPlus24Hours.getTime()) {
      continue;
    }

    // Remove duplicate contact phonenumbers in an even contact list
    const filteredContacts = events[EventID].contacts.filter(
      (contact, index) => events[EventID].contacts.findIndex((obj) => contact.phoneNumber === obj.phoneNumber) === index
    );
    console.log(filteredContacts);
    events[EventID].contacts = filteredContacts;

    // Loop through contacts for the EventID and send messages
    for (const contact of events[EventID].contacts) {
      const message = await ticketService.sendMessage(contact, EventName, StartDateTime);
      console.log(message);
    }
  }

  return { body: "Done" };
}

app.http("ticket-request", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: ticketRequest,
});
