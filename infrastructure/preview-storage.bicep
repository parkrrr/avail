@description('Pull request number for unique naming')
param issueId string

@description('Location for all resources')
param location string = resourceGroup().location

// Generate unique storage account name
// uniqueString returns exactly 13 chars, prefix is 7 chars, total = 20 chars (within 24 limit)
var storageAccountName = 'stavail${uniqueString(issueId)}'

// Common tags for all resources
var commonTags = {
  prNumber: issueId
  environment: 'preview'
  managedBy: 'github-actions'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Enable static website hosting on the blob service
// This automatically creates the $web container
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: []
    }
    deleteRetentionPolicy: {
      enabled: false
    }
  }
}

output storageAccountName string = storageAccount.name
