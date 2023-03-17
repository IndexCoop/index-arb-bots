// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "./UniswapV3SwapExamples.sol";

address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant dsETH = 0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE;
ISwapRouter constant router = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

/* TODO: fix */
contract BuyDSETH is Script {
    // uint256 private constant MAX_UINT256 = type(uint256).max;
    // uint24 private constant fee = 500; // 0.05% fee
    IWETH private weth = IWETH(WETH);
    IERC20 private dai = IERC20(DAI);
    IERC20 private usdc = IERC20(USDC);
    IERC20 private dseth = IERC20(dsETH);
    uint256 arbKeeperPK = vm.envUint("ARB_KEEPER_PRIVATE_KEY");

    function run() external {
        vm.startBroadcast(arbKeeperPK);

        // IWETH(WETH).deposit{value: 100 ether}();
        // IERC20(WETH).approve(address(router), 100 ether);

        uint256 laterTimestamp = block.timestamp + 60 days;
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: dsETH,
            fee: 500,
            recipient: 0x7e94F737c01305dB6d35D0e08A87788D2cbD5Fad,
            deadline: laterTimestamp,
            amountIn: 90 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        router.exactInputSingle(params);
        vm.stopBroadcast();
    }
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swaps amountIn of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as ExactInputSingleParams in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    /// @notice Swaps amountIn of one token for as much as possible of another along the specified path
    /// @param params The parameters necessary for the multi-hop swap, encoded as ExactInputParams in calldata
    /// @return amountOut The amount of the received token
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

interface IWETH is IERC20 {
    function deposit() external payable;

    function withdraw(uint256 amount) external;
}
