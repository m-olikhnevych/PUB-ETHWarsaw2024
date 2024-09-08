pragma solidity ^0.8.24;

import "./Bet.sol";
import "./Prompt.sol";

contract BetFactory {

  struct Bets {
    uint256 id;
    address betAddress;
    uint256 requestId;
    SolveStatus status;
  }

  enum SolveStatus {
    NOT_SOLVED,
    SOLVING,
    SOLVED
  }
  mapping(uint256 => Bets) public bets;
  mapping(uint256 => uint256) public requestsToBets;
  uint256 public betCounter = 0;

  Prompt public prompt;

  constructor(Prompt _prompt) {
    prompt = _prompt;
  }

  event BetCreated(address betAddress, uint256 betId, Bet.BetParams params);

  function createBet(Bet.BetParams memory params) public returns (uint256 id, address betAddress) {
    address newBet = address(new Bet(params));
    uint256 betId = betCounter;
    bets[betId].id = betId;
    bets[betId].betAddress = address(newBet);
    bets[betId].status = SolveStatus.NOT_SOLVED;
    emit BetCreated(newBet, betId, params);
    betCounter++;
    return (betId, newBet);
  }

  function solveBet(uint256 betId) public {
    Bet bet = Bet(bets[betId].betAddress);
    require(block.timestamp > bet.getEndTimestamp(), "Bet is not closed yet");
    uint requestId = prompt.calculateAIResult(11, bet.getPrompt());
    bets[betId].requestId = requestId;
    bets[betId].status = SolveStatus.SOLVING;
    requestsToBets[requestId] = betId;
  }

  function resolveBet(uint requestId, bool _result) public {
    require(msg.sender == address(prompt), "Only Prompt can resolve bets");
    uint betId = requestsToBets[requestId];
    Bet(bets[betId].betAddress).resolve(_result);
    bets[betId].status = SolveStatus.SOLVED;
  }

  function getBet(uint betId) public view returns (address) {
    return bets[betId].betAddress;
  }
}
