//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "OAO/interfaces/IAIOracle.sol";

import "../contracts/Prompt.sol";
import "../contracts/BetFactory.sol";
import "./DeployHelpers.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  error InvalidPrivateKey(string);

  function run() external {
    uint256 deployerPrivateKey = setupLocalhostEnv();
    if (deployerPrivateKey == 0) {
      revert InvalidPrivateKey(
        "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env or use `yarn generate` to generate a new random account"
      );
    }
    vm.startBroadcast(deployerPrivateKey);

    address oracleAddress = address(0x0A0f4321214BB6C7811dD8a71cF587bdaF03f0A0);
    Prompt prompt = new Prompt(IAIOracle(oracleAddress));
    console.logString(
      string.concat(
        "Prompt deployed at: ", vm.toString(address(prompt))
      )
    );

    BetFactory betFactory = new BetFactory(prompt);
    console.logString(
      string.concat(
        "BetFactory deployed at: ", vm.toString(address(betFactory))
      )
    );

    vm.stopBroadcast();

    /**
     * This function generates the file containing the contracts Abi definitions.
     * These definitions are used to derive the types needed in the custom scaffold-eth hooks, for example.
     * This function should be called last.
     */
    exportDeployments();
  }

  function test() public { }
}
