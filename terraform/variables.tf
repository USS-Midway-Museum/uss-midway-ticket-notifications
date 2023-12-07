# Inputs

variable "central_resource_group" {
  type     = string
  nullable = false
}

variable "environment" {
  type     = string
  nullable = false
}

# Outputs
output "STORAGE_ACCOUNT_NAME" {
  value = azurerm_storage_account.function_app_storage_account.name
  sensitive =  true
}
output "STORAGE_ACCOUNT_KEY" {
  value = azurerm_storage_account.function_app_storage_account.primary_access_key 
  sensitive = true
}


output "APPINSIGHTS_INSTRUMENTATIONKEY" {
  value     = azurerm_application_insights.app_insights.instrumentation_key
  sensitive = true
}
output "APPLICATIONINSIGHTS_CONNECTION_STRING" {
  value       = azurerm_application_insights.app_insights.connection_string
  sensitive   = true
}

output "AZURE_FUNCTIONS_NAME" {
  value = azurerm_linux_function_app.function_app.name
}