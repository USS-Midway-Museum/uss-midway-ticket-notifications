# Operation guide

This doc details how to use this repo locally and on azure

## Enable testing

Testing can be enabled by configuring either the local settings or azure configuration. When testing is enabled, all messages for tickets coming in to the system will be sent to the test phone number, rather than the tickets associated contact details.

Below are the variables you will need to adjust

| Variable | Value |
|---|---|
| USE_TEST_PHONE_NUMBER | Set to **1** to use the test phone number |
| TEST_PHONE_NUMBER | Any valid E.164 phone number |

### Locally

The azure function can be run on localhost using the Azure Function Core Tools. In order to get set up, follow the deployment steps [here](../deployment/local-guide.md). During the set up step, set the variables in the table to above to their respective values

### Azure

If the azure functions are not deployed already, follow the steps [here](../deployment/azure-guide.md)

To adjust the deployed functions operation, navigate to the [azure portal](https://portal.azure.com/) and locate your function app that is hosting your function code. Navigate to the **Configuration** section under **Settings** in the left panel, and find the **USE_TEST_PHONE_NUMBER** and **TEST_PHONE_NUMBER** values. Change these variables to their respective values in the table above.

## Disable testing

To disable testing, follow the steps [above](#enable-testing), using the value in the table below

| Variable | Value |
|---|---|
| USE_TEST_PHONE_NUMBER | Set to **0** to use the test phone number |