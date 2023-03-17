// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/Test.sol";
import "solmate/tokens/WETH.sol";
import "../Arb.sol";
import "../interfaces/IExchangeIssuanceZeroEx.sol";
import "../interfaces/uniswap/IUniV3Quoter.sol";

/* TODO: fix */
contract DsEthQuoter is Script {
    IUniV3Quoter private constant uniV3Quoter = IUniV3Quoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    address arbKeeperWallet = vm.envAddress("ARB_KEEPER_ADDRESS");
    WETH weth = WETH(payable(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2));

    function run() public {
        console.log("Keeper balance is: ", weth.balanceOf(arbKeeperWallet));
        vm.prank(arbKeeperWallet);
        uint256 quoteAmountOut = uniV3Quoter.quoteExactInputSingle(
            address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2),
            address(0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE),
            500,
            1 ether,
            0
        );
        console.log("Quote amount out is: ", quoteAmountOut);
    }
}
