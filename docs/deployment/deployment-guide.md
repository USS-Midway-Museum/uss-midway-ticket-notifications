# Deployment Guide

## Azure Pre-Setup

In Azure you will need the following resources:

### Deployment Resource Group

A **Resource Group** that will contain the Azure resources that are automatically created by deployment and used by the solution.

### Terraform State Storage Account

You will need a **Storage Account** (existing or new) to store Terraform state files for the projects that use it.
You can use a Storage Account in a separate resource group.

Under this Storage Account you will also need to create a **Storage Container** which will store the Terraform state files.

While the name for this container can be set to anything, we'd recommend naming it `azure-tfstates` without a specific environment postfix, as this can then be used for multiple Terraform deployments.

### User Assigned Managed Identity

You will need to create a [User Assigned Managed Identity](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/how-manage-user-assigned-managed-identities)
in order to grant the GitHub deployment pipelines access to Azure.

#### Github Access

Once created you need to add a [Federated Credential](https://learn.microsoft.com/en-us/azure/active-directory/workload-identities/workload-identity-federation-create-trust-user-assigned-managed-identity).
Navigate to the Managed Identity resource and click **Federated credentials** on the left side menu.

Add a new Credential with the following steps:

1. Scenario: `Github Actions deploying Azure resources`
2. Enter your Organization and Repository name
3. Entity: `Environment` or `Branch` depending on preference
4. Set a descriptive name for the credential

Finally, you will need to add role assignments to the Managed Identity.

#### How to Add Role Assignments

1. Navigate to the resource and click **Access control (IAM) > Add > Add role assignment**
2. Choose the required role
3. Click **Next**
4. Set **Assign access to** to `Managed identity`
5. Click **+ Select members**
6. Select `User-assigned managed identity` and find the Managed Identity you created
7. Click **Review + assign**

#### Required Role Assignments

Please set up all of the following role assignments:

| Resource                                                            | Role                        | Notes                                                      |
| ------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| [Terraform State Storage Account](#terraform-state-storage-account) | Storage Account Contributor | Allow pipeline to update Terraform state files             |
| [Deployment Resource Group](#deployment-resource-group)             | Owner                       | Allow pipeline to deploy resources and modify access roles |

## GitHub Variable/Secret Setup

> This step requires admin permissions on the GitHub repository.

### How to Add Variables/Secrets

1. From the GitHub repository page, navigate to **Settings > Secrets and variables > Actions**.
2. Select the **Secrets** or **Variables** tab based on the type of value you are adding. Note that values added to **Variables** are not secured.
3. Click **New repository secret/variable**
4. Enter the **Name** and **Value** fields for your [required variable/secret](#required-variablessecrets).
5. Click **Add secret/variable**

### Required Variables/Secrets

Please ensure you prefix each variable with the targeted environment. One of `develop`, `uat` or `production`.  
Please set up all of the following variables/secrets:

| Variable                          | Is Secret | Value                                                                                                                                                                                                                                |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEVELOP_AZ_TENANT_ID                  | No        | The Microsoft Entra ID (formerly Azure Active Directory) [Tenant ID](https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id)                                                                                |
| DEVELOP_AZ_CLIENT_ID                  | No        | The Client ID of the [Managed Identity](#user-assigned-managed-identity) you created. Found by navigating into the Managed Identity resource under the `Overview` tab                                                                |
| DEVELOP_AZ_SUBSCRIPTION_ID            | No        | The Azure [Subscription ID](https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id) used to host the resources                                                                                              |
| DEVELOP_STORAGE_ACCOUNT_RESOURCEGROUP | No        | The name of the **Resource Group** containing the [Terraform State Storage Account](#terraform-state-storage-account)                                                                                                                |
| DEVELOP_STORAGE_ACCOUNT_NAME          | No        | The name of the [Terraform State Storage Account](#terraform-state-storage-account)                                                                                                                                                  |
| DEVELOP_STORAGE_ACCOUNT_CONTAINER     | No        | The name of the Container that you created under the [Terraform State Storage Account](#terraform-state-storage-account)                                                                                                             |
| DEVELOP_RESOURCE_GROUP                | No        | The name of the [Deployment Resource Group](#deployment-resource-group)                                                                                                                                                              |
| DEVELOP_TWILIO_ACCOUNT_SID            | No        | Found on the main dashboard of the [Twilio console](https://console.twilio.com/)                                                                                                                                                     |
| DEVELOP_TWILIO_API_KEY                | No        | Created from the [Twilio console](https://console.twilio.com/) in Account > API keys & tokens > Create API key                                                                                                                       |
| DEVELOP_TWILIO_API_SECRET             | **Yes**   | Created from the [Twilio console](https://console.twilio.com/) in Account > API keys & tokens > Create API key                                                                                                                       |
| DEVELOP_E_GALAXY_URL                  | No        | URL/IP address for querying the eGalaxy service to find events. The URL should be the complete path to the API endpoint.                                                                                                             |
| DEVELOP_MESSAGING_SERVICE_SID         | No        | Find this from the [Twilio console](https://console.twilio.com/us1/develop/sms/services) in **Messaging**. The ID starts with `MG`. You may need to create a service if you don't have one already.                                  |
| DEVELOP_OPENING_HOUR                  | No        | The standard opening hour for the service. We'll schedule messages so they do not send outside of these hours. **The time must be for UTC**. To set a 9AM PST opening, you'd enter `17:00`.                                          |
| DEVELOP_CLOSING_HOUR                  | No        | The standard closing hour for the service. We'll schedule messages so they do not send outside of these hours. **The time must be for UTC**. To set a 5PM PST closing, you'd enter `01:00`.                                          |
| DEVELOP_PLAN_SKU                      | No        | The app service plan SKU code to use. We'd recommend using `P0V3` to start for production use cases. A list of pricing plans can be found here: [ASP Pricing](https://azure.microsoft.com/en-gb/pricing/details/app-service/linux/). |

### Optional Testing Configuration

The following variables can be configured in the same way as the required items, but are only utilized to enable a testing mode for the solution.  
These can be ignored if you do not need to run the system in test mode, but will be useful for testing in UAT.

| Variable                  | Is Secret | Value                                                                                                                                                                |
| ------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEVELOP_USE_TEST_PHONE_NUMBER | No        | Set this to true to use the test phone number. This will replace all customer phone numbers with the configured test number if set. Useful for testing in Dev / UAT. |
| DEVELOP_TEST_PHONE_NUMBER     | No        | Any valid E.164 phone number to send the messages too.                                                                                                               |

## Triggering Deployment

From the GitHub repository page, navigate to the **Actions** page. On the left you will see a list of **workflows**. For a first-time deployment, trigger the workflows in the following order:

### 1. Azure Resources

Set up Azure Resources for this stack via Terraform

> Resources will be created with basic pricing tiers, so ensure you increase these according to your requirements

1. Select the **[Infra] Azure Resources via Terraform** workflow
2. Click run workflow
3. Run and wait for completion
4. Confirm the resources were created in Azure.

### 2. Build & Deploy Functions

Build the backend server code and deploy it to the App Service

1. Select the **[BUILD & DEPLOY] Build and Deploy Azure Functions** workflow
2. Click run workflow
3. Run and wait for completion
