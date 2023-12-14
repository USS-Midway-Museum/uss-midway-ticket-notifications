import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseString } from "xml2js";

export async function tempEndpoint(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const incomingXMLString = await request.text();
  parseString(incomingXMLString, { explicitArray: false }, function (err: Error, result: unknown) {
    console.log(result);
  });
  return { body: "Done" };
}

app.http("tempendpoint", {
  methods: ["POST"],
  authLevel: "function",
  handler: tempEndpoint,
});
