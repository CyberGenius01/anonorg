// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CollaborationRegistry {
    enum Status { NONE, PROPOSED, ACTIVE, SUSPENDED, REVOKED }

    struct Collaboration {
        bytes32 orgA;
        bytes32 orgB;
        Status status;
        uint256 permissions;
    }

    mapping(bytes32 => Collaboration) public collaborations;
    event CollaborationCreated(bytes32 indexed id, bytes32 indexed orgA, bytes32 indexed orgB);
    event CollaborationActivated(bytes32 indexed id);

    function create(bytes32 id, bytes32 orgA, bytes32 orgB, uint256 permissions) external {
        require(collaborations[id].status == Status.NONE, "EXISTS");
        require(orgA != orgB, "SAME_ORG");
        collaborations[id] = Collaboration(orgA, orgB, Status.PROPOSED, permissions);
        emit CollaborationCreated(id, orgA, orgB);
    }

    function activate(bytes32 id) external {
        require(collaborations[id].status == Status.PROPOSED, "INVALID_STATUS");
        collaborations[id].status = Status.ACTIVE;
        emit CollaborationActivated(id);
    }
}
