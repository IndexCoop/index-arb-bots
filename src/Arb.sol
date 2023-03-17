// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/aave/ILendingPool.sol";

contract Arb is Ownable {
    // Address that is checked to avoid malicious calls to executeOperation
    address aaveV2Pool;

    struct TokenApproval {
        IERC20 token;
        address spender;
        uint256 amount;
    }

    function approveTokens(TokenApproval[] memory _approvals) external onlyOwner {
        for (uint256 i = 0; i < _approvals.length; i++) {
            TokenApproval memory approval = _approvals[i];
            approval.token.approve(approval.spender, approval.amount);
        }
    }

    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        token.transfer(msg.sender, amount);
    }

    /**
     * @dev Sends flashloan calldata to aave pool
     */
    function executeArbTrade(
        uint256 minBalanceAfter,
        IERC20 paymentToken,
        address flashloanTarget,
        bytes calldata flashloanCalldata
    ) external onlyOwner returns(uint256 balanceAfter) {
        aaveV2Pool = flashloanTarget;
        _call(flashloanTarget, flashloanCalldata);
        balanceAfter = paymentToken.balanceOf(address(this));
        require(balanceAfter >= minBalanceAfter, "Arb: balance too low");
    }

    /**
     * @dev Generates calldata for flashloan call to the lending pool
     */
    function generateFlashloanCalldata(
        address paymentToken,
        uint256 flashloanAmount,
        address tradeTarget,
        bytes calldata tradeCalldata,
        address exchangeIssuance,
        bytes calldata exchangeIssuanceCalldata,
        bool isBuySetAndRedeem
    ) external view returns (bytes memory) {
        address[] memory assets = new address[](1);
        assets[0] = paymentToken;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = flashloanAmount;
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;
        bytes memory flashloanParams =
            abi.encode(tradeTarget, tradeCalldata, exchangeIssuance, exchangeIssuanceCalldata, isBuySetAndRedeem);

        return abi.encodeWithSelector(
            ILendingPool.flashLoan.selector, address(this), assets, amounts, modes, address(this), flashloanParams, 0
        );
    }

    /**
     * @dev Callback function called from the lending pool after the flashloaned assets have been transfered
     * @dev After this function returns the lending pool will attempt to transfer back the loaned tokens and reverts the transaction if that fails
     */
    function executeOperation(
        address[] memory assets,
        uint256[] memory amounts,
        uint256[] memory premiums,
        address initiator,
        bytes memory params
    ) public returns (bool) {
        require(msg.sender == aaveV2Pool && initiator == address(this), "invalid flashloan from");

        (
            address tradeTarget,
            bytes memory tradeCalldata,
            address exchangeIssuance,
            bytes memory exchangeIssuanceCalldata,
            bool isBuySetAndRedeem
        ) = abi.decode(params, (address, bytes, address, bytes, bool));

        if (isBuySetAndRedeem) {
            _call(tradeTarget, tradeCalldata);
            _call(exchangeIssuance, exchangeIssuanceCalldata);
        } else {
            _call(exchangeIssuance, exchangeIssuanceCalldata);
            _call(tradeTarget, tradeCalldata);
        }

        return true;
    }

    /**
     * @dev Calls target with given calldata and bubbles up revertion if not successfull
     * @dev Source: https://ethereum.stackexchange.com/questions/109457/how-to-bubble-up-a-custom-error-when-using-delegatecall
     */
    function _call(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.call(data);
        if (!success) {
            if (returndata.length == 0) revert();
            assembly {
                revert(add(32, returndata), mload(returndata))
            }
        }
        return returndata;
    }
}
