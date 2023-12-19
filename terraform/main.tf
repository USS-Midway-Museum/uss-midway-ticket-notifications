terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.77.0"
    }
     random = {
      source = "hashicorp/random"
      version = "3.5.1"
    }
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
  postfix = "${random_id.resource_postfix.hex}"
  common_tags = {
    source = "terraform"
    postfix = "${random_id.resource_postfix.hex}"
    instanceIdentifier = "${var.environment}"
  }
}

resource "azurerm_service_plan" "asp" {
  name                = "ASP-uss-midway-ticket-notifications-${var.environment}-${local.postfix}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = var.plan_sku
  tags                = local.common_tags
}

//needs sorting

resource "azurerm_storage_account" "function_app_storage_account" {
  name                     = "ussmidwaytk${var.environment}${local.postfix}"
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = data.azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                = local.common_tags
}

resource "azurerm_role_assignment" "tf_table_access" {
  scope                = azurerm_storage_account.function_app_storage_account.id
  role_definition_name = "Storage Table Data Contributor"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_log_analytics_workspace" "log-analytics" {
  name                = "workspace-${local.postfix}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

//create workspace
//dynamic plan

resource "azurerm_application_insights" "app_insights" {
  name                = "uss-midway-ticket-notifications-insights-${local.postfix}"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.log-analytics.id
  application_type    = "web"
  tags                = local.common_tags
}


resource "azurerm_linux_function_app" "function_app" {
  name                = "uss-midway-ticket-notifications-${var.environment}-${local.postfix}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  storage_account_name       = azurerm_storage_account.function_app_storage_account.name
  storage_account_access_key = azurerm_storage_account.function_app_storage_account.primary_access_key
  service_plan_id            = azurerm_service_plan.asp.id
  tags                = local.common_tags
  site_config {}
}
