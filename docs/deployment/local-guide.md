# Local Set up

## Variables

Duplicate `local.settings.example.json` and rename to `local.settings.json` and populate the variables with the corresponding values from the table below.

| Variable | Value | Is secret |
|---|---|---|
| TWILIO_ACCOUNT_SID | Get from the [console](https://console.twilio.com/) | No | 
| TWILIO_API_KEY | Get from the [console](https://console.twilio.com/) in Account > API keys & tokens > Create API key| No |
| TWILIO_API_SECRET | Get from the api key creation stage | Yes |
| USE_TEST_PHONE_NUMBER | true to use the test phone number, false to not use the test phone number | No |
| TEST_PHONE_NUMBER | Any valid E.164 phone number | No |
| RUN_FROM_PACKAGE | Set to 1 to run from `/home/data/SitePackages` instead of `/home/site/wwwroot` | No |
| E_GALAXY_URL | URL/IP address for querying egalaxy on event ids | No |
| MESSAGING_SERVICE_SID | Get from the [console](https://console.twilio.com/) in **Messaging** | No |
| OPENING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour | No |
| CLOSING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour | No |

## Scripts

Run  `yarn && yarn start` to install and start the server locally
