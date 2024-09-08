// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "OAO/interfaces/IAIOracle.sol";
import "OAO/AIOracleCallbackReceiver.sol";

interface IBetFactory {
    function resolveBet(uint requestId, bool _result) external;
}

contract Prompt is AIOracleCallbackReceiver {

    event promptsUpdated(
        uint256 requestId,
        uint256 modelId,
        string input,
        string output,
        bytes callbackData
    );

    event promptRequest(
        uint256 requestId,
        address sender,
        uint256 modelId,
        string prompt
    );

    struct AIOracleRequest {
        address sender;
        uint256 modelId;
        bytes input;
        bytes output;
    }

    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    mapping(uint256 => AIOracleRequest) public requests;

    mapping(uint256 => uint64) public callbackGasLimit;

    constructor(IAIOracle _aiOracle) AIOracleCallbackReceiver(_aiOracle) {
        owner = msg.sender;
        callbackGasLimit[11] = 5_000_000;
    }

    function setCallbackGasLimit(uint256 modelId, uint64 gasLimit) external onlyOwner {
        callbackGasLimit[modelId] = gasLimit;
    }

    mapping(uint256 => mapping(string => string)) public prompts;

    function getAIResult(uint256 modelId, string calldata prompt) external view returns (string memory) {
        string memory prefixedPrompt = string.concat(
            "Answer \"T\" when statement true,\"F\" if not.Statement:",
            prompt
        );

        return prompts[modelId][prefixedPrompt];
    }

    function aiOracleCallback(uint256 requestId, bytes calldata output, bytes calldata callbackData) external override onlyAIOracleCallback() {
        AIOracleRequest storage request = requests[requestId];
        require(request.sender != address(0), "request does not exist");
        request.output = output;
        prompts[request.modelId][string(request.input)] = string(output);
        emit promptsUpdated(requestId, request.modelId, string(request.input), string(output), callbackData);
        {
            IBetFactory(request.sender).resolveBet(requestId, keccak256(output) == keccak256(bytes("T")));
        }
    }

    function estimateFee(uint256 modelId) public view returns (uint256) {
        return aiOracle.estimateFee(modelId, callbackGasLimit[modelId]);
    }

    function calculateAIResult(uint256 modelId, string calldata prompt) payable external returns (uint256 requestId) {
        string memory prefixedPrompt = string.concat(
            "Answer \"T\" when statement true,\"F\" if not.Statement:",
            prompt
        );
        bytes memory input = bytes(prefixedPrompt);
        bytes memory callbackData = bytes("");
        requestId = aiOracle.requestCallback{value: msg.value}(
            modelId, input, address(this), callbackGasLimit[modelId], callbackData
        );
        AIOracleRequest storage request = requests[requestId];
        request.input = input;
        request.sender = msg.sender;
        request.modelId = modelId;
        emit promptRequest(requestId, msg.sender, modelId, prefixedPrompt);
    }
}
