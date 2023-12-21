# Azure Deployment

## Azure Pre-Setup

In Azure you will need the following resources:

### Deployment Resource Group

A **Resource Group** that will contain the Azure resources that are automatically created by deployment and used by the solution.

### Terraform State Storage Account

You will need a **Storage Account** (existing or new) to store Terraform state files for the projects that use it.
You can use a Storage Account in a separate resource group.

Under this Storage Account you will also need to create a **Storage Container** which will store the Terraform state files.

Convention for this naming is azure-$ENVIRONMENT_NAME.tfstate i.e (azure-dev.tfstate)

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

| Variable | Value |
|---|---|
| DEV_AZ_TENANT_ID | The Microsoft Entra ID(formerly Azure Active Directory) [Tenant ID](https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id) | No |
| DEV_AZ_CLIENT_ID | The Client ID of the [Managed Identity](#user-assigned-managed-identity) you created. Found by navigating into the Managed Identity resource under the `Overview` tab | No |
| DEV_AZ_SUBSCRIPTION_ID | The Azure [Subscription ID](https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id) used to host the resources | No |
| DEV_STORAGE_ACCOUNT_RESOURCEGROUP | The name of the **Resource Group** containing the [Terraform State Storage Account](#terraform-state-storage-account) | No |
| DEV_STORAGE_ACCOUNT_NAME | The name of the [Terraform State Storage Account](#terraform-state-storage-account) | No |
| DEV_STORAGE_ACCOUNT_CONTAINER | The name of the Container that you created under the [Terraform State Storage Account](#terraform-state-storage-account) | No |
| DEV_RESOURCE_GROUP | The name of the [Deployment Resource Group](#deployment-resource-group) | No |
| DEV_TWILIO_ACCOUNT_SID | Get from the [console](https://console.twilio.com/) |
| DEV_TWILIO_API_KEY | Get from the [console](https://console.twilio.com/) in Account > API keys & tokens > Create API key|
| DEV_TWILIO_API_SECRET | Get from the api key creation stage |
| DEV_USE_TEST_PHONE_NUMBER | true to use the test phone number, false to not use the test phone number |
| DEV_TEST_PHONE_NUMBER | Any valid E.164 phone number |
| DEV_RUN_FROM_PACKAGE | Set to 1 to run from `/home/data/SitePackages` instead of `/home/site/wwwroot` |
| DEV_E_GALAXY_URL | URL/IP address for querying egalaxy on event ids |
| DEV_MESSAGING_SERVICE_SID | Get from the [console](https://console.twilio.com/) in **Messaging** |
| DEV_OPENING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour |
| DEV_CLOSING_HOUR | Handle the conversion from PST to UTC manually, then use the UTC Hour | 
| DEV_PLAN_SKU | Azure app service plan code, e.g B1, S1, P0v3 |

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
