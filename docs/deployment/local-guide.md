# Local Set up

## Variables

Duplicate `local.settings.example.json` and rename to `local.settings.json` and populate the variables with the corresponding values from the table below.

| Variable | Value | Is secret
|---|---|
| DEVELOP_TWILIO_ACCOUNT_SID | Get from the [console](https://console.twilio.com/) | No | 
| DEVELOP_TWILIO_API_KEY | Get from the [console](https://console.twilio.com/) in Account > API keys & tokens > Create API key| No |
| DEVELOP_TWILIO_API_SECRET | Get from the api key creation stage | Yes |
| DEVELOP_USE_TEST_PHONE_NUMBER | 1 to use the test phone number, 0 to not use the test phone number | No |
| DEVELOP_TEST_PHONE_NUMBER | Any valid E.164 phone number | No |
| DEVELOP_RUN_FROM_PACKAGE | Set to 1 to run from `/home/data/SitePackages` instead of `/home/site/wwwroot` | No |
| DEVELOP_E_GALAXY_URL | URL/IP address for querying egalaxy on event ids | No |
| DEVELOP_MESSAGING_SERVICE_SID | Get from the [console](https://console.twilio.com/) in **Messaging** | No |
| DEVELOP_OPENING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour | No |
| DEVELOP_CLOSING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour | No |

## Scripts

Run  `yarn && yarn start` to install and start the server locally