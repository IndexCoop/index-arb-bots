import { BigNumber, Contract, ethers } from "ethers";

import { EIZEROEX_ABI, UNIV3_ABI } from "./abis";

const eiAddress = "0x9d648E5564B794B918d99C84B0fbf4b0bf36ce45";
const issuanceModuleAddress = "0xa0a98EB7Af028BE00d04e46e1316808A62a8fd59";
const uniRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export function getBuySetTokenCalldata(
  arbBotAddress: string,
  setToken: string,
  setTokenAmount: ethers.BigNumberish,
  totalWethAmount: ethers.BigNumberish,
  fee: number,
  provider: ethers.providers.JsonRpcProvider
) {
  const uniV3Router = new Contract(uniRouterAddress, UNIV3_ABI, provider);
  const callData = uniV3Router.interface.encodeFunctionData(
    "exactOutputSingle",
    [
      {
        tokenIn: wethAddress,
        tokenOut: setToken,
        fee: fee,
        recipient: arbBotAddress,
        deadline: ethers.constants.MaxUint256,
        amountOut: setTokenAmount,
        amountInMaximum: totalWethAmount,
        sqrtPriceLimitX96: 0,
      },
    ]
  );
  return callData;
}

export async function getIssueCalldata(
  setToken: string,
  setTokenAmount: ethers.BigNumberish,
  componentQuotes: string[],
  inputOutputTokenAmount: BigNumber,
  provider: ethers.providers.JsonRpcProvider
) {
  const isDebtIssuance = true;
  const exchangeIssuanceZeroEx = new Contract(
    eiAddress,
    EIZEROEX_ABI,
    provider
  );
  const exchangeIssuanceCalldata =
    exchangeIssuanceZeroEx.interface.encodeFunctionData(
      "issueExactSetFromToken",
      [
        setToken,
        wethAddress,
        setTokenAmount,
        inputOutputTokenAmount,
        componentQuotes,
        issuanceModuleAddress,
        isDebtIssuance,
      ]
    );
  return { exchangeIssuanceCalldata };
}

export async function getRedeemCalldata(
  setToken: string,
  setTokenAmount: ethers.BigNumberish,
  componentQuotes: string[],
  provider: ethers.providers.JsonRpcProvider
) {
  const isDebtIssuance = true;
  const exchangeIssuanceZeroEx = new Contract(
    eiAddress,
    EIZEROEX_ABI,
    provider
  );
  const exchangeIssuanceCalldata =
    exchangeIssuanceZeroEx.interface.encodeFunctionData(
      "redeemExactSetForToken",
      [
        setToken,
        wethAddress,
        setTokenAmount,
        0,
        componentQuotes,
        issuanceModuleAddress,
        isDebtIssuance,
      ]
    );
  return { exchangeIssuanceCalldata };
}

export function getSellSetTokenCalldata(
  arbBotAddress: string,
  setToken: string,
  setTokenAmount: ethers.BigNumberish,
  totalWethAmount: ethers.BigNumberish,
  fee: number,
  provider: ethers.providers.JsonRpcProvider
) {
  const uniV3Router = new Contract(uniRouterAddress, UNIV3_ABI, provider);
  return uniV3Router.interface.encodeFunctionData("exactInputSingle", [
    {
      tokenIn: setToken,
      tokenOut: wethAddress,
      fee: fee,
      recipient: arbBotAddress,
      deadline: ethers.constants.MaxUint256,
      amountIn: setTokenAmount,
      amountOutMinimum: totalWethAmount,
      sqrtPriceLimitX96: 0,
    },
  ]);
}
