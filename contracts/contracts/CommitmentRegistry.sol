// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CommitmentRegistry {
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => address) public submitter;
    event CommitmentCreated(bytes32 indexed organizationId, bytes32 indexed commitment, address indexed sender);

    function createCommitment(bytes32 organizationId, bytes32 commitment) external {
        require(!commitments[commitment], "DUPLICATE");
        commitments[commitment] = true;
        submitter[commitment] = msg.sender;
        emit CommitmentCreated(organizationId, commitment, msg.sender);
    }

    function exists(bytes32 commitment) external view returns (bool) {
        return commitments[commitment];
    }
}
