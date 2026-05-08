// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReviewAuditRegistry
 * @notice Stores tamper-evident audit records for review lifecycle events.
 * @dev This contract does not store full review text, customer names, emails,
 * addresses, or private order details. It stores only hashes and metadata
 * references needed to verify that an audit event existed at a certain time.
 */
contract ReviewAuditRegistry {
    struct AuditRecord {
        string reviewId;
        string eventType;
        bytes32 payloadHash;
        bytes32 previousEventHash;
        bytes32 eventHash;
        address submittedBy;
        uint256 timestamp;
    }

    mapping(string => AuditRecord[]) private reviewAuditTrail;
    mapping(bytes32 => bool) public eventHashExists;

    event AuditRecordCreated(
        string indexed reviewId,
        string eventType,
        bytes32 indexed eventHash,
        bytes32 previousEventHash,
        address indexed submittedBy,
        uint256 timestamp
    );

    function addAuditRecord(
        string memory reviewId,
        string memory eventType,
        bytes32 payloadHash,
        bytes32 previousEventHash,
        bytes32 eventHash
    ) public {
        require(eventHash != bytes32(0), "Invalid event hash");
        require(!eventHashExists[eventHash], "Event hash already exists");

        AuditRecord memory record = AuditRecord({
            reviewId: reviewId,
            eventType: eventType,
            payloadHash: payloadHash,
            previousEventHash: previousEventHash,
            eventHash: eventHash,
            submittedBy: msg.sender,
            timestamp: block.timestamp
        });

        reviewAuditTrail[reviewId].push(record);
        eventHashExists[eventHash] = true;

        emit AuditRecordCreated(
            reviewId,
            eventType,
            eventHash,
            previousEventHash,
            msg.sender,
            block.timestamp
        );
    }

    function getAuditTrail(string memory reviewId) public view returns (AuditRecord[] memory) {
        return reviewAuditTrail[reviewId];
    }

    function getAuditRecordCount(string memory reviewId) public view returns (uint256) {
        return reviewAuditTrail[reviewId].length;
    }

    function verifyEventHash(bytes32 eventHash) public view returns (bool) {
        return eventHashExists[eventHash];
    }
}