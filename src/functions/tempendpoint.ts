import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function tempendpoint(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const stream = request.body;
  if (!stream) {
    return { body: `Empty body` };
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const data = Buffer.concat(chunks).toString("utf-8");
  return { body: data };
}

app.http("tempendpoint", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: tempendpoint,
});
