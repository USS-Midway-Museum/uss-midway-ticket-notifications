import { z } from "zod";

// ZOD SCHEMAS

export const headerDataSchema = z.object({
  MessageID: z.string(),
  MessageType: z.string(),
  SourceID: z.string(),
  TimeStamp: z.string(),
  EchoData: z.string(),
  SiteID: z.string(),
  SystemFields: z.string(),
});

export const ticketDataSchema = z.object({
  VisualID: z.string(),
  DateSold: z.string(),
  PLU: z.string(),
  EventID: z.string(),
  TransactionContact: z.object({
    FirstName: z.string(),
    LastName: z.string(),
    Phone: z.string(),
    Cell: z.string(),
    Email: z.string(),
    ContactGUID: z.string(),
    GalaxyContactID: z.string(),
  }),
});

export const ticketsDataSchema = z.object({
  Envelope: z.object({
    Header: headerDataSchema,
    Body: z.object({
      Tickets: z.object({
        Ticket: z.array(ticketDataSchema).min(1),
      }),
    }),
  }),
});

export const eventDataSchema = z.object({
  Envelope: z.object({
    Header: headerDataSchema.omit({ SiteID: true }),
    Body: z.object({
      Events: z.object({
        Event: z
          .array(
            z.object({
              ResponseCode: z.string(),
              EventID: z.string(),
              StartDateTime: z.string(),
              EndDateTime: z.string(),
              EventTypeID: z.string(),
              OnSaleDateTime: z.string(),
              OffSaleDateTime: z.string(),
              ResourceID: z.string(),
              UserEventNumber: z.string(),
              Available: z.string(),
              TotalCapacity: z.string(),
              Status: z.string(),
              HasRoster: z.string(),
              RSEventSeatMap: z.string(),
              PrivateEvent: z.string(),
              HasHolds: z.string(),
              EventName: z.string(),
            })
          )
          .min(1),
      }),
    }),
  }),
});

// INFERRED ZOD TYPES

// The header information including time stamp and source id
export type HeaderData = z.infer<typeof headerDataSchema>;
// An individual ticket on TicketsData event type
export type TicketData = z.infer<typeof ticketDataSchema>;
// The incoming request type containing the header and tickets array
export type TicketsData = z.infer<typeof ticketsDataSchema>;
// The event type for the egalaxy response on GetEvents
export type EventData = z.infer<typeof eventDataSchema>;

// STATIC TYPES

// The type used for the contact map, includes contact information and the events to contact about
export type Contact = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type Events = {
  contacts: Contact[];
};

export type GetEventResponse = { EventID: string; StartDateTime: string; EventName: string };
