// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";
import {ISetToken} from "../src/interfaces/ISetToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IDebtIssuanceModuleV2} from "../src/interfaces/IDebtIssuanceModuleV2.sol";
import {Arb} from "../src/Arb.sol";
import {IZeroEx} from "../src/interfaces/IZeroEx.sol";
import {IWETH} from "../src/interfaces/IWETH.sol";
import "../src/interfaces/uniswap/IUniV3Quoter.sol";
import "../src/interfaces/IExchangeIssuanceZeroEx.sol";
import "../src/interfaces/uniswap/IUniV3SwapRouter.sol";

contract TestArb is Test {
    // Compare: https://etherscan.io/tx/0x6bfac521069cf5f49f3c9ffbd97db84469d9b21d68bda190b2684be984da8227
    uint256 gtcEthIssueAndSellBlockNumber = 16698773;
    // Compare: https://etherscan.io/tx/0x8aeda4928891b9e737098962a71d4e8f0d960ad49b2e35a9140b6389161f1401
    uint256 dsEthIssueAndSellBlockNumber = 16631557;
    // Compare: https://etherscan.io/tx/0x7edc93ca18dfe5f974be76a49b1bd2a3cd7a105bbe21334af879e376c6a333a2
    uint256 dsEthBuyAndRedeemBlockNumber = 16599776;
    address dsEthAddress = 0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE;
    address gtcEthAddress = 0x36c833Eed0D376f75D1ff9dFDeE260191336065e;
    address zeroExAddress = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF;
    address wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address stEth2Address = 0xFe2e637202056d30016725477c5da089Ab0A043A;
    address rEthAddress = 0xae78736Cd615f374D3085123A210448E74Fc6393;
    address wstEthAddress = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;
    address uniRouterAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address aaveV2Pool = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address arbBotOwner = 0xDeA58CC4a6B82CaADaF1abEf2af10fEf7E8bfCCB;
    address arbBotAddress = 0x83DFc282de2f17ef7cD365f485Ae549097D9aa5C;

    uint24 fee = 500;
    bool isDebtIssuance = true;

    Arb arbContract;

    ISetToken dsETH = ISetToken(dsEthAddress);
    IWETH weth = IWETH(wethAddress);
    IERC20 stEth2 = IERC20(stEth2Address);
    IERC20 rEth = IERC20(rEthAddress);
    IERC20 wstEth = IERC20(wstEthAddress);
    IUniV3Quoter private constant uniV3Quoter = IUniV3Quoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    IExchangeIssuanceZeroEx private constant exchangeIssuance =
        IExchangeIssuanceZeroEx(0x9d648E5564B794B918d99C84B0fbf4b0bf36ce45);
    address constant issuanceModule = 0xa0a98EB7Af028BE00d04e46e1316808A62a8fd59;

    function testBuyAndRedeemDSETH() public {
        vm.createSelectFork("mainnet", dsEthBuyAndRedeemBlockNumber);
        arbContract = new Arb();

        _approveTokens(arbContract, IERC20(dsEthAddress));

        uint256 dsEthAmount = 10 ether;
        uint256 minProfit = 0.003 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) = _getRedeemCalldata(dsEthAddress, dsEthAmount);
        bytes memory tradeCallData = _getBuySetTokenCalldata(dsEthAddress, dsEthAmount, totalWethAmount);

        uint256 balanceBefore = weth.balanceOf(address(arbContract));
        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            true
        );
        uint256 balanceAfter = arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
        assert(balanceAfter == weth.balanceOf(address(arbContract)));
        uint256 profit = balanceAfter - balanceBefore;
        console.log("buy and redeem profit:", profit);
        assert(profit > minProfit);
    }

    function testIssueAndSellDSETH() public {
        vm.createSelectFork("mainnet", dsEthIssueAndSellBlockNumber);
        arbContract = new Arb();
        _approveTokens(arbContract, IERC20(dsEthAddress));
        uint256 dsEthAmount = 16 ether;
        uint256 minProfit = 0.017 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) = _getIssueCalldata(dsEthAddress, dsEthAmount);
        bytes memory tradeCallData = _getSellSetTokenCalldata(dsEthAddress, dsEthAmount, totalWethAmount);

        uint256 balanceBefore = weth.balanceOf(address(arbContract));
        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            false
        );
        uint256 balanceAfter = arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
        assert(balanceAfter == weth.balanceOf(address(arbContract)));
        uint256 profit = balanceAfter - balanceBefore;
        console.log("issue and sell profit:", profit);
        assert(profit > minProfit);
    }

    function testIssueAndSellDSETHMinProfitTooHigh() public {
        vm.createSelectFork("mainnet", dsEthIssueAndSellBlockNumber);
        arbContract = new Arb();
        _approveTokens(arbContract, IERC20(dsEthAddress));
        uint256 dsEthAmount = 16 ether;
        uint256 minProfit = 0.17 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) = _getIssueCalldata(dsEthAddress, dsEthAmount);
        bytes memory tradeCallData = _getSellSetTokenCalldata(dsEthAddress, dsEthAmount, totalWethAmount);

        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            false
        );

        vm.expectRevert("Arb: balance too low");
        arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
    }

    function testIssueAndSellGTCEth() public {
        vm.createSelectFork("mainnet", gtcEthIssueAndSellBlockNumber);
        arbContract = new Arb();
        _approveTokens(arbContract, IERC20(gtcEthAddress));
        uint256 gtcEthAmount = 1 ether;
        uint256 minProfit = 0.07 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) =
            _getIssueCalldata(gtcEthAddress, gtcEthAmount);
        bytes memory tradeCallData = _getSellSetTokenCalldata(gtcEthAddress, gtcEthAmount, totalWethAmount);

        uint256 balanceBefore = weth.balanceOf(address(arbContract));
        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            false
        );
        uint256 balanceAfter = arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
        assert(balanceAfter == weth.balanceOf(address(arbContract)));
        uint256 profit = balanceAfter - balanceBefore;
        console.log("issue and sell profit:", profit);
        assert(profit > minProfit);
    }

    function testIssueAndSellGTCEthMainnetDeployment() public {
        uint256 blockNumber = 16784427;
        vm.createSelectFork("mainnet", blockNumber);
        arbContract = Arb(arbBotAddress);
        
        uint256 gtcEthAmount = 16 ether;
        uint256 minProfit = 0.01 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) =
            _getIssueCalldata(gtcEthAddress, gtcEthAmount);
        bytes memory tradeCallData = _getSellSetTokenCalldata(gtcEthAddress, gtcEthAmount, totalWethAmount);

        uint256 balanceBefore = weth.balanceOf(address(arbContract));
        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            false
        );
        vm.startPrank(arbBotOwner);
        uint256 balanceAfter = arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
        assert(balanceAfter == weth.balanceOf(address(arbContract)));
        uint256 profit = balanceAfter - balanceBefore;
        console.log("issue and sell profit:", profit);
        assert(profit > minProfit);
    }

    function testRedeemAndBuyGTCEthMainnetDeploymentFailsForNoProfit() public {
        uint256 blockNumber = 16784427;
        vm.createSelectFork("mainnet", blockNumber);
        arbContract = Arb(arbBotAddress);

        uint256 gtcEthAmount = 1 ether;
        uint256 minProfit = 0.001 ether;

        (bytes memory exchangeIssuanceCalldata, uint256 totalWethAmount) =
            _getRedeemCalldata(gtcEthAddress, gtcEthAmount);
        bytes memory tradeCallData = _getBuySetTokenCalldata(gtcEthAddress, gtcEthAmount, totalWethAmount);

        uint256 balanceBefore = weth.balanceOf(address(arbContract));
        bytes memory flashloanCalldata = arbContract.generateFlashloanCalldata(
            wethAddress,
            totalWethAmount,
            uniRouterAddress,
            tradeCallData,
            address(exchangeIssuance),
            exchangeIssuanceCalldata,
            true
        );
        vm.startPrank(arbBotOwner);
        // Should fail - as there is no profit to be made
        vm.expectRevert(bytes("SafeERC20: low-level call failed"));
        arbContract.executeArbTrade(minProfit, IERC20(wethAddress), aaveV2Pool, flashloanCalldata);
    }

    function _approveTokens(Arb arbContract, IERC20 setToken) internal {
        Arb.TokenApproval[] memory approvals = new Arb.TokenApproval[](5);
        approvals[0] =
            Arb.TokenApproval({token: setToken, spender: address(exchangeIssuance), amount: type(uint256).max});
        approvals[1] = Arb.TokenApproval({token: setToken, spender: uniRouterAddress, amount: type(uint256).max});
        approvals[2] = Arb.TokenApproval({token: weth, spender: address(exchangeIssuance), amount: type(uint256).max});
        approvals[3] = Arb.TokenApproval({token: weth, spender: uniRouterAddress, amount: type(uint256).max});
        approvals[4] = Arb.TokenApproval({token: weth, spender: aaveV2Pool, amount: type(uint256).max});
        arbContract.approveTokens(approvals);
    }

    function _getBuySetTokenCalldata(address setToken, uint256 setTokenAmount, uint256 totalWethAmount)
        internal
        returns (bytes memory)
    {
        // Buy setToken from UniswapV3
        return abi.encodeWithSelector(
            IUniV3SwapRouter.exactOutputSingle.selector,
            IUniV3SwapRouter.ExactOutputSingleParams({
                tokenIn: address(weth),
                tokenOut: setToken,
                fee: fee,
                recipient: address(arbContract),
                deadline: type(uint256).max,
                amountOut: setTokenAmount,
                amountInMaximum: totalWethAmount,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function _getSellSetTokenCalldata(address setToken, uint256 setTokenAmount, uint256 totalWethAmount)
        internal
        returns (bytes memory)
    {
        // Buy setToken from UniswapV3
        return abi.encodeWithSelector(
            IUniV3SwapRouter.exactInputSingle.selector,
            IUniV3SwapRouter.ExactInputSingleParams({
                tokenIn: setToken,
                tokenOut: address(weth),
                fee: fee,
                recipient: address(arbContract),
                deadline: type(uint256).max,
                amountIn: setTokenAmount,
                amountOutMinimum: totalWethAmount,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function _generateZeroExCallDataUniswapV3(
        address _from,
        address _to,
        uint24 _fee,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) private pure returns (bytes memory encodedPath) {
        uint24[] memory fees = new uint24[](1);
        fees[0] = _fee;
        address[] memory path = new address[](2);
        path[0] = _from;
        path[1] = _to;
        address receiver = address(0);

        bytes memory encodedPath = _encodePathV3(path, fees, false);

        return abi.encodeWithSelector(
            IZeroEx.sellTokenForTokenToUniswapV3.selector, encodedPath, _amountIn, _minAmountOut, receiver
        );
    }

    // Copied from DEXAdapter
    /**
     * Encode path / fees to bytes in the format expected by UniV3 router
     *
     * @param _path          List of token address to swap via (starting with input token)
     * @param _fees          List of fee levels identifying the pools to swap via.
     *                       (_fees[0] refers to pool between _path[0] and _path[1])
     * @param _reverseOrder  Boolean indicating if path needs to be reversed to start with output token.
     *                       (which is the case for exact output swap)
     *
     * @return encodedPath   Encoded path to be forwared to uniV3 router
     */
    function _encodePathV3(address[] memory _path, uint24[] memory _fees, bool _reverseOrder)
        private
        pure
        returns (bytes memory encodedPath)
    {
        if (_reverseOrder) {
            encodedPath = abi.encodePacked(_path[_path.length - 1]);
            for (uint256 i = 0; i < _fees.length; i++) {
                uint256 index = _fees.length - i - 1;
                encodedPath = abi.encodePacked(encodedPath, _fees[index], _path[index]);
            }
        } else {
            encodedPath = abi.encodePacked(_path[0]);
            for (uint256 i = 0; i < _fees.length; i++) {
                encodedPath = abi.encodePacked(encodedPath, _fees[i], _path[i + 1]);
            }
        }
    }

    function _getRedeemCalldata(address setToken, uint256 setTokenAmount) private returns (bytes memory, uint256) {
        (uint256[] memory amountsIn, address[] memory components, uint256 totalWethAmount) =
            _getBuyAndRedeemAmounts(setToken, setTokenAmount);
        bytes[] memory swaps = new bytes[](components.length);
        for (uint256 i = 0; i < components.length; i++) {
            swaps[i] = _generateZeroExCallDataUniswapV3(components[i], wethAddress, 500, amountsIn[i], 1);
        }
        bytes memory exchangeIssuanceCalldata = abi.encodeWithSelector(
            exchangeIssuance.redeemExactSetForToken.selector,
            setToken,
            address(weth),
            setTokenAmount,
            0,
            swaps,
            issuanceModule,
            isDebtIssuance
        );
        return (exchangeIssuanceCalldata, totalWethAmount);
    }

    function _getIssueCalldata(address setToken, uint256 setTokenAmount) private returns (bytes memory, uint256) {
        (uint256[] memory amountsIn, address[] memory components, uint256 totalWethAmount) =
            _getIssueAndSellAmounts(setToken, setTokenAmount);
        bytes[] memory swaps = new bytes[](components.length);
        for (uint256 i = 0; i < components.length; i++) {
            swaps[i] = _generateZeroExCallDataUniswapV3(wethAddress, components[i], 500, amountsIn[i], 1);
        }

        bytes memory exchangeIssuanceCalldata = abi.encodeWithSelector(
            exchangeIssuance.issueExactSetFromToken.selector,
            setToken,
            address(weth),
            setTokenAmount,
            totalWethAmount,
            swaps,
            issuanceModule,
            isDebtIssuance
        );
        return (exchangeIssuanceCalldata, totalWethAmount);
    }

    function _getIssueAndSellAmounts(address setToken, uint256 setTokenAmount)
        internal
        returns (uint256[] memory, address[] memory, uint256)
    {
        (address[] memory components, uint256[] memory positions) =
            exchangeIssuance.getRequiredIssuanceComponents(issuanceModule, true, setToken, setTokenAmount);

        uint256 totalWethAmount;
        uint256[] memory amountsIn = new uint256[](components.length);
        for (uint256 i = 0; i < components.length; i++) {
            console2.log("component:", components[i]);
            console2.log("position:", positions[i]);
            uint256 wethAmount = uniV3Quoter.quoteExactOutputSingle(address(weth), components[i], fee, positions[i], 0);
            amountsIn[i] = wethAmount;
            totalWethAmount += wethAmount;
        }
        console.log("totalWethAmount:", totalWethAmount);
        return (amountsIn, components, totalWethAmount);
    }

    function _getBuyAndRedeemAmounts(address setToken, uint256 setTokenAmount)
        internal
        returns (uint256[] memory, address[] memory, uint256)
    {
        uint256 totalWethAmount = uniV3Quoter.quoteExactOutputSingle(address(weth), setToken, fee, setTokenAmount, 0);
        console.log("totalWethAmount:", totalWethAmount);

        (address[] memory components, uint256[] memory positions) =
            exchangeIssuance.getRequiredRedemptionComponents(issuanceModule, true, setToken, setTokenAmount);

        return (positions, components, totalWethAmount);
    }
}
