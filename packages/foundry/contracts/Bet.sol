pragma solidity ^0.8.24;

import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract Bet is Ownable {

  struct BetParams {
    string name;
    string description;
    string prompt;
    uint endTimestamp;
  }

  struct BetInfo {
    string name;
    string description;
    string prompt;
    uint endTimestamp;
    bool resolved;
    bool result;
  }

  BetInfo public Info;
  //minBetAmount???

  uint public totalTrueBetAmount = 0;
  uint public totalFalseBetAmount = 0;

  mapping(address => uint) public trueBettors;
  mapping(address => uint) public falseBettors;
  mapping(address => uint) public claimedWinnings;

  event BetMade(address indexed bettor, bool side, uint amount);
  event BetResolved(bool result, uint totalTrueBetAmount, uint totalFalseBetAmount);
  event WinningsClaimed(address indexed bettor, uint amount);

  constructor(BetParams memory info_) Ownable(msg.sender) {
    Info.description = info_.description;
    Info.name = info_.name;
    Info.prompt = info_.prompt;
    Info.endTimestamp = info_.endTimestamp;
    Info.resolved = false;
    Info.result = false;
  }

  modifier onlyResolved() {
    require(isResolved(), "Bet is not resolved yet");
    _;
    
  }

  modifier closed() {
    require(block.timestamp > getEndTimestamp(), "Bet is not closed yet");
    _;
  }

  modifier opened() {
    require(block.timestamp < getEndTimestamp(), "Bet is closed");
    _;
  }

  function getPrompt() public view returns (string memory) {
    return Info.prompt;
  }

  function getEndTimestamp() public view returns (uint) {
    return Info.endTimestamp;
  }

  function isResolved() public view returns (bool) {
    return Info.resolved;
  }

  function getResult() public view returns (bool) {
    return Info.result;
  }

  function makeBet(bool _side) public payable opened {
    require(msg.value > 0, "Bet amount should be greater than 0");

    //TODO: Could user bet on both sides?

    if (_side) {
      totalTrueBetAmount += msg.value;
      trueBettors[msg.sender] += msg.value;
    } else {
      totalFalseBetAmount += msg.value;
      falseBettors[msg.sender] += msg.value;
    }
    emit BetMade(msg.sender, _side, msg.value);
  }

  function resolve(bool _result) public onlyOwner closed {
    require(!isResolved(), "Bet is already resolved");

    Info.resolved = true;
    Info.result = _result;

    emit BetResolved(_result, totalTrueBetAmount, totalFalseBetAmount);
  }

  function claimWinnings() public onlyResolved  {
    require(claimedWinnings[msg.sender] == 0, "You have already claimed your winnings");

    uint amount = 0;
    // withdraw the users bet amount
    amount = Info.result ? trueBettors[msg.sender] : falseBettors[msg.sender];
    // add the winnings to the amount
    amount += checkWinnings();

    claimedWinnings[msg.sender] = amount;
    payable(msg.sender).transfer(amount);

    emit WinningsClaimed(msg.sender, amount);
  }

  function checkWinnings() public view onlyResolved returns (uint) {
    if (Info.result) {
      return (trueBettors[msg.sender] * totalFalseBetAmount) / totalTrueBetAmount;
    } else {
      return (falseBettors[msg.sender] * totalTrueBetAmount) / totalFalseBetAmount;
    }
  }

  function getTrueBetAmount() public view returns (uint) {
    return trueBettors[msg.sender];
  }

  function getFalseBetAmount() public view returns (uint) {
    return falseBettors[msg.sender];
  }

}
