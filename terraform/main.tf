terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.77.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.5.1"
    }
  }
  backend "azurerm" {
    use_oidc = true
  }
}

provider "azurerm" {
  skip_provider_registration = true
  use_oidc                   = true
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "rg" {
  name = var.resource_group
}

resource "random_id" "resource_postfix" {
  byte_length = 4
}

locals {
  postfix = random_id.resource_postfix.hex
  common_tags = {
    source             = "terraform"
    postfix            = "${random_id.resource_postfix.hex}"
    instanceIdentifier = "${var.environment}"
  }
  solution_short_name = "ussmtk"
}

# Key Vault Configuration
resource "azurerm_key_vault" "main" {
  name                      = "kv-${local.solution_short_name}-${local.postfix}"
  resource_group_name       = data.azurerm_resource_group.rg.name
  location                  = data.azurerm_resource_group.rg.location
  tenant_id                 = data.azurerm_client_config.current.tenant_id

  enable_rbac_authorization = true
  sku_name                  = "standard"
  tags                      = local.common_tags

  lifecycle {
    ignore_changes          = [tags]
  }
}

resource "azurerm_role_assignment" "tf_kv_access" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "twilio-api-secret" {
  key_vault_id = azurerm_key_vault.main.id
  name         = "twilio-api-secret"
  value        = var.twilio_api_secret

  depends_on = [
    azurerm_role_assignment.tf_kv_access
  ]
}

resource "azurerm_role_assignment" "keyvault_access" {
  scope                 = azurerm_key_vault.main.id
  role_definition_name  = "Key Vault Secrets User"
  principal_id          = azurerm_linux_function_app.function_app.identity.0.principal_id
}

# App Service Plan and Storage

resource "azurerm_service_plan" "asp" {
  name                = "ASP-${local.solution_short_name}-${var.environment}-${local.postfix}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = var.plan_sku
  tags                = local.common_tags
}

resource "azurerm_storage_account" "function_app_storage_account" {
  name                     = "st${local.solution_short_name}${var.environment}${local.postfix}"
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = data.azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.common_tags
}

# Analytics Workspace and Insights

resource "azurerm_log_analytics_workspace" "log-analytics" {
  name                = "workspace-${local.postfix}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_application_insights" "app_insights" {
  name                = "ai-${local.solution_short_name}-${local.postfix}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.log-analytics.id
  application_type    = "Node.JS"
  tags                = local.common_tags
}

# Function App

resource "azurerm_linux_function_app" "function_app" {
  name                        = "${local.solution_short_name}-${var.environment}-${local.postfix}"
  resource_group_name         = data.azurerm_resource_group.rg.name
  location                    = data.azurerm_resource_group.rg.location
  storage_account_name        = azurerm_storage_account.function_app_storage_account.name
  storage_account_access_key  = azurerm_storage_account.function_app_storage_account.primary_access_key
  service_plan_id             = azurerm_service_plan.asp.id
  functions_extension_version = "~4"

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                              = true
    application_insights_connection_string = azurerm_application_insights.app_insights.connection_string
    application_stack {
      node_version = 18
    }
  }

  lifecycle {
    ignore_changes = [
      tags,
      app_settings,
      sticky_settings
    ]
  }

  tags = local.common_tags
}
