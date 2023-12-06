import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function tempendpoint(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    console.log(request);

    return { body: `OK!` };
};

app.http('tempendpoint', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: tempendpoint
});
