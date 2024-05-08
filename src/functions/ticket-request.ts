import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TicketService } from "../services/ticketService";
import { Events } from "../types";
import { isBefore, addDays } from "date-fns";

export async function ticketRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.info("Starting ticket event handler");
  const ticketService = new TicketService(request, context);
  const { header, tickets } = await ticketService.parseIncoming();
  const { SourceID, TimeStamp } = header;

  // A record of events with event IDs as keys and event info and contacts as values
  const events: Record<string, Events> = {};

  context.info(`Parsed inbound event. Processing ${tickets.length} ticket(s)`);

  context.info(`Loading event list`);
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

  context.info(`Fetching ${Object.keys(events).length} event(s) from eGalaxy`);
  // Get event times for the events
  const eventTimes = await ticketService.getEvents({
    sourceID: SourceID,
    timeStamp: TimeStamp,
    events: Object.keys(events),
  });

  context.info(`Recieved ${eventTimes.length} event time record(s)`);

  context.info("Running message sends");
  // Push event details on to events records
  for (const event of eventTimes) {
    const { EventID, EventName, StartDateTime } = event;
    const today = new Date();
    const todayPlus24Hours = addDays(today, 1);

    context.info(`Checking send time for event`);
    const startDate = new Date(StartDateTime);

    // If the event start time is less than 24 hours away, skip the send message step
    if (isBefore(startDate, todayPlus24Hours)) {
      context.info(`Event info: ${EventID}, ${EventName}, ${StartDateTime}, as date: ${new Date(StartDateTime).getTime()}, today + 24: ${todayPlus24Hours.getTime()}`)
      context.info("Event was within 24 hours, canceling send");
      continue;
    }

    // Remove duplicate contact phonenumbers in an even contact list
    const filteredContacts = events[EventID].contacts.filter(
      (contact, index) => events[EventID].contacts.findIndex((obj) => contact.phoneNumber === obj.phoneNumber) === index
    );
    context.log(filteredContacts);
    events[EventID].contacts = filteredContacts;

    context.info(`Identified ${filteredContacts.length} contact(s) to send to`);
    // Loop through contacts for the EventID and send messages
    for (const contact of events[EventID].contacts) {
      const message = await ticketService.sendMessage(contact, EventName, StartDateTime);
      context.log(message);
    }
  }

  context.info("Handler completed");

  return { body: "Done" };
}

app.http("ticket-request", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: ticketRequest,
});
