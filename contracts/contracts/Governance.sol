// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Governance {
    uint256 public immutable required;
    uint256 public immutable ownersCount;
    mapping(address => bool) public owners;

    struct Proposal {
        address target;
        uint256 value;
        bytes data;
        uint256 approvals;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public approved;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, address indexed target, uint256 value);
    event Approval(uint256 indexed id, address indexed owner);
    event Executed(uint256 indexed id);

    modifier onlyOwner() { require(owners[msg.sender], "NOT_OWNER"); _; }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length == 5 || _owners.length == 3, "OWNER_SET");
        require(_required > 0 && _required <= _owners.length, "THRESHOLD");
        for (uint256 i; i < _owners.length; i++) {
            require(_owners[i] != address(0) && !owners[_owners[i]], "INVALID_OWNER");
            owners[_owners[i]] = true;
        }
        ownersCount = _owners.length;
        required = _required;
    }

    function propose(address target, uint256 value, bytes calldata data) external onlyOwner returns (uint256 id) {
        id = proposalCount++;
        proposals[id] = Proposal(target, value, data, 0, false);
        emit ProposalCreated(id, target, value);
    }

    function approve(uint256 id) external onlyOwner {
        Proposal storage p = proposals[id];
        require(!p.executed, "EXECUTED");
        require(!approved[id][msg.sender], "ALREADY_APPROVED");
        approved[id][msg.sender] = true;
        p.approvals++;
        emit Approval(id, msg.sender);
    }

    function execute(uint256 id) external onlyOwner {
        Proposal storage p = proposals[id];
        require(!p.executed, "EXECUTED");
        require(p.approvals >= required, "THRESHOLD_NOT_MET");
        p.executed = true;
        (bool ok,) = p.target.call{value:p.value}(p.data);
        require(ok, "CALL_FAILED");
        emit Executed(id);
    }
}
