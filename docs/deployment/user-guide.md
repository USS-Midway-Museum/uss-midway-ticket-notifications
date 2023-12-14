# Deployment guide

This doc details how to run the azure functions locally and on azure. Below is a table of the necessary variables required to run the functions

| Variable | Value |
|---|---|
| TWILIO_ACCOUNT_SID | Get from the [console](https://console.twilio.com/) |
| TWILIO_API_KEY | Get from the [console](https://console.twilio.com/) in Account > API keys & tokens > Create API key|
| TWILIO_API_SECRET | Get from the api key creation stage |
| USE_TEST_PHONE_NUMBER | 1 to use the test phone number, 0 to not use the test phone number |
| TEST_PHONE_NUMBER | Any valid E.164 phone number |
| RUN_FROM_PACKAGE | Set to 1 to run from `/home/data/SitePackages` instead of `/home/site/wwwroot` |

## Locally

To run the functions locally:

1. Open this repo in a dev container
2. Run `yarn` 
3. Duplicate `local.settings.example.json` and rename to `local.settings.json`
4. Add the values from the table above to the file
5. Run `yarn start`
  

## Azure

To deploy to azure:

1. Ensure you have the azure cli and are authenticated
2. Zip `dist, node_modules, host.json, package.json and yarn.lock`
3. Navigate to the azure portal and create a function app for 
   1. Linux
   2. Node 18 run time
4. Once created, click in to the function app and go to the Configuration tab
5. Create your configuration variables (see the table above)
6. Run `az functionapp deployment source config-zip -g {resourceGroupName} -n {functionAppName} --src {zipFilePathLocation}` (replacing the placeholders with the correct names/paths)