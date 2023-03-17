// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../Arb.sol";
import "../interfaces/IExchangeIssuanceZeroEx.sol";

contract ApproveTokens is Script {
    IERC20 dsEth = IERC20(0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE);
    IERC20 gtcEth = IERC20(0x36c833Eed0D376f75D1ff9dFDeE260191336065e);
    IERC20 weth = IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address uniRouterAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address aaveV2Pool = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    IExchangeIssuanceZeroEx exchangeIssuance = IExchangeIssuanceZeroEx(0x9d648E5564B794B918d99C84B0fbf4b0bf36ce45);
    Arb arbContract = Arb(0x83DFc282de2f17ef7cD365f485Ae549097D9aa5C);

    function run() external {

        uint256 deployerPrivateKey = vm.envUint("ARB_KEEPER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        IERC20[] memory setTokens = new IERC20[](2);
        setTokens[0] = dsEth;
        setTokens[1] = gtcEth;
        _approveTokens(arbContract, setTokens, true);
        vm.stopBroadcast();
    }

    function _approveTokens(Arb arbContract, IERC20[] memory setTokens, bool includeWeth) internal {
        uint256 numApprovals = setTokens.length * 2;
        if (includeWeth) {
            numApprovals += 3;
        }
        Arb.TokenApproval[] memory approvals = new Arb.TokenApproval[](numApprovals);
        for(uint256 i = 0; i < setTokens.length; i++) {
            approvals[i*2] = Arb.TokenApproval({
                token: setTokens[i],
                spender: uniRouterAddress,
                amount: type(uint256).max
            });
            approvals[i*2 + 1] = Arb.TokenApproval({
                token: setTokens[i],
                spender: address(exchangeIssuance),
                amount: type(uint256).max
            });
        }
        if (includeWeth) {
            approvals[numApprovals - 3] = Arb.TokenApproval({
                token: weth,
                spender: uniRouterAddress,
                amount: type(uint256).max
            });
            approvals[numApprovals - 2] = Arb.TokenApproval({
                token: weth,
                spender: address(exchangeIssuance),
                amount: type(uint256).max
            });
            approvals[numApprovals - 1] = Arb.TokenApproval({
                token: weth,
                spender: aaveV2Pool,
                amount: type(uint256).max
            });
        }
        arbContract.approveTokens(approvals);
    }
}
