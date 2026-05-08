export const REVIEW_AUDIT_REGISTRY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "reviewId", "type": "string" },
      { "internalType": "string", "name": "eventType", "type": "string" },
      { "internalType": "bytes32", "name": "payloadHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "previousEventHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "eventHash", "type": "bytes32" }
    ],
    "name": "addAuditRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "reviewId", "type": "string" }
    ],
    "name": "getAuditTrail",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "reviewId", "type": "string" },
          { "internalType": "string", "name": "eventType", "type": "string" },
          { "internalType": "bytes32", "name": "payloadHash", "type": "bytes32" },
          { "internalType": "bytes32", "name": "previousEventHash", "type": "bytes32" },
          { "internalType": "bytes32", "name": "eventHash", "type": "bytes32" },
          { "internalType": "address", "name": "submittedBy", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct ReviewAuditRegistry.AuditRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "eventHash", "type": "bytes32" }
    ],
    "name": "verifyEventHash",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "reviewId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "eventType", "type": "string" },
      { "indexed": true, "internalType": "bytes32", "name": "eventHash", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "previousEventHash", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "submittedBy", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "AuditRecordCreated",
    "type": "event"
  }
] as const;