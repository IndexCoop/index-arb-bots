import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { reset } from "@nomicfoundation/hardhat-network-helpers";

import {
  getBuySetTokenCalldata,
  getIssueCalldata,
  getRedeemCalldata,
  getSellSetTokenCalldata,
} from "../actions/lib/calldata";
import {
  Arb,
  Arb__factory,
  IZeroEx,
  IZeroEx__factory,
  IERC20,
  IERC20__factory,
  IExchangeIssuanceZeroEx,
  IExchangeIssuanceZeroEx__factory,
  IUniV3SwapRouter,
  IUniV3SwapRouter__factory,
  IUniV3Quoter,
  IUniV3Quoter__factory,
} from "../typechain-types";

describe("Arb Contract", function () {
  let signer: ethers.Signer;
  const forkUrl = process.env.MAINNET_RPC_URL;
  let exchangeIssuanceZeroEx: IExchangeIssuanceZeroEx;
  let arbBot: Arb;
  let zeroEx: IZeroEx;
  let uniV3Quoter: IUniV3Quoter;
  let uniV3Router: IUniV3SwapRouter;
  let weth: IERC20;
  const eiAddress = "0x9d648E5564B794B918d99C84B0fbf4b0bf36ce45";
  const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const dsEthAddress = "0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE";
  const issuanceModuleAddress = "0xa0a98EB7Af028BE00d04e46e1316808A62a8fd59";
  const zeroExAddress = "0xDef1C0ded9bec7F1a1670819833240f027b25EfF";
  const uniQuoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
  const uniRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const lendingPoolAddress = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
  const isDebtIssuance = true;
  const fee = 500;
  before(async function () {
    signer = (await ethers.getSigners())[0];
    exchangeIssuanceZeroEx = IExchangeIssuanceZeroEx__factory.connect(
      eiAddress,
      signer
    );
    zeroEx = IZeroEx__factory.connect(zeroExAddress, signer);
    uniV3Quoter = IUniV3Quoter__factory.connect(uniQuoterAddress, signer);
    uniV3Router = IUniV3SwapRouter__factory.connect(uniRouterAddress, signer);
    weth = IERC20__factory.connect(wethAddress, signer);
  });

  it("buy and redeem dseth", async function () {
    const blockNumber = 16599776;
    await reset(forkUrl, blockNumber);
    arbBot = await new Arb__factory(signer).deploy();

    await approveTokens(arbBot, dsEthAddress);
    expect(arbBot.address).to.not.be.undefined;
    const dsEthAmount = ethers.utils.parseEther("10");
    const minProfit = ethers.utils.parseEther("0.003");

    // Static quote data (will be fetched from 0x by bot)
    const componentQuotes = [
      "0x6af479b20000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000254b7fd98c97760000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b7f39c581f595b53c5cb19bd0b3f8da6c935e2ca00001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000",
      "0x6af479b2000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000039d434b4402d000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bae78736cd615f374d3085123a210448e74fc63930001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000",
      "0x6af479b2000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000024b09d631d89f2b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bfe2e637202056d30016725477c5da089ab0a043a0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000",
    ];
    const totalWethAmount = BigNumber.from("10080007497764118153");

    const { exchangeIssuanceCalldata } = await getRedeemCalldata(
      dsEthAddress,
      dsEthAmount,
      componentQuotes,
      signer
    );
    const tradeCallData = getBuySetTokenCalldata(
      arbBot.address,
      dsEthAddress,
      dsEthAmount,
      totalWethAmount,
      fee,
      signer
    );
    const wethBalanceBefore = await weth.balanceOf(arbBot.address);
    const flashloanCalldata = await arbBot.generateFlashloanCalldata(
      wethAddress,
      totalWethAmount,
      uniRouterAddress,
      tradeCallData,
      eiAddress,
      exchangeIssuanceCalldata,
      true
    );
    const predictedBalanceAfter = await arbBot.callStatic.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata,
      { gasLimit: 10000000 }
    );
    const tx = await arbBot.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata,
      { gasLimit: 10000000 }
    );
    await tx.wait();
    expect(await weth.balanceOf(arbBot.address)).to.eq(predictedBalanceAfter);
    const profit = predictedBalanceAfter.sub(wethBalanceBefore);
    expect(profit).to.be.gt(minProfit);
  });

  it("issue and sell dseth", async function () {
    const blockNumber = 16631557;
    await reset(forkUrl, blockNumber);
    arbBot = await new Arb__factory(signer).deploy();

    await approveTokens(arbBot, dsEthAddress);
    expect(arbBot.address).to.not.be.undefined;
    const dsEthAmount = ethers.utils.parseEther("16");
    const minProfit = ethers.utils.parseEther("0.017");

    // Static quote data (will be fetched from 0x by bot)
    const componentQuotes = [
      "0x6af479b2000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000042399dc0cfe7b61500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f47f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000",
      "0x6af479b20000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000636b66cf95daeeaf00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4ae78736cd615f374d3085123a210448e74fc6393000000000000000000000000000000000000000000",
      "0x6af479b200000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000003a72789d65d9a08e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4fe2e637202056d30016725477c5da089ab0a043a000000000000000000000000000000000000000000",
    ];
    const totalWethAmount = BigNumber.from("16147512624603219282");

    const { exchangeIssuanceCalldata } = await getIssueCalldata(
      dsEthAddress,
      dsEthAmount,
      componentQuotes,
      totalWethAmount,
      signer
    );
    const tradeCallData = getSellSetTokenCalldata(
      arbBot.address,
      dsEthAddress,
      dsEthAmount,
      totalWethAmount,
      fee,
      signer
    );

    const wethBalanceBefore = await weth.balanceOf(arbBot.address);
    const flashloanCalldata = await arbBot.generateFlashloanCalldata(
      wethAddress,
      totalWethAmount,
      uniRouterAddress,
      tradeCallData,
      eiAddress,
      exchangeIssuanceCalldata,
      false
    );
    const predictedBalanceAfter = await arbBot.callStatic.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata,
      { gasLimit: 10000000 }
    );
    const tx = await arbBot.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata,
      { gasLimit: 10000000 }
    );
    await tx.wait();
    expect(await weth.balanceOf(arbBot.address)).to.eq(predictedBalanceAfter);
    const profit = predictedBalanceAfter.sub(wethBalanceBefore);
    expect(profit).to.be.gt(minProfit);
  });

  function approveTokens(arbBot: Arb, setToken: string) {
    const approvals = [
      {
        token: setToken,
        spender: exchangeIssuanceZeroEx.address,
        amount: ethers.constants.MaxUint256,
      },
      {
        token: setToken,
        spender: uniRouterAddress,
        amount: ethers.constants.MaxUint256,
      },
      {
        token: wethAddress,
        spender: exchangeIssuanceZeroEx.address,
        amount: ethers.constants.MaxUint256,
      },
      {
        token: wethAddress,
        spender: uniRouterAddress,
        amount: ethers.constants.MaxUint256,
      },
      {
        token: wethAddress,
        spender: lendingPoolAddress,
        amount: ethers.constants.MaxUint256,
      },
    ];
    return arbBot.approveTokens(approvals);
  }
});
