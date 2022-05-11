//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract BuyMeACoffee {
    // Address of contract deployer
    address payable public owner;

    // List of all memos received from friends.
    Memo[] private memos;

    struct Memo {
        address from;
        uint256 timestamp;
        uint256 amount;
        string name;
        string message;
    }

    // Event to emit when a Memo is called
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        uint256 amount,
        string name,
        string message
    );

    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev Buy a coffee for contract owner
     * @param _name Name of the coffee buyer
     * @param _message Message from the coffee buyer
     */
    function buyCoffee(string memory _name, string memory _message)
        public
        payable
    {
        require(msg.value > 0, "You must include some ETH");

        // Add the memo to storage
        memos.push(
            Memo(msg.sender, block.timestamp, msg.value, _name, _message)
        );

        // Emit a log event when a new memo is created
        emit NewMemo(msg.sender, block.timestamp, msg.value, _name, _message);
    }

    /**
     * @dev Send the contract balance to the owner
     */
    function withdrawTips() public {
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to withdraw tips");
    }

    function getMemos() public view returns (Memo[] memory) {
        return memos;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Must be owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = payable(newOwner);
    }
}
