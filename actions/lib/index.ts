import {
  getFlashMintZeroExQuote,
  QuoteToken,
  ZeroExApi,
} from "@indexcoop/flash-mint-sdk";
import { Context } from "@tenderly/actions";

import {
  BigNumber,
  Contract,
  ethers,
  PopulatedTransaction,
  Wallet,
} from "ethers";

import { ARB_BOT_ABI } from "./abis/Arb";
import {
  getBuySetTokenCalldata,
  getIssueCalldata,
  getRedeemCalldata,
  getSellSetTokenCalldata,
} from "./calldata";

const eiAddress = "0x9d648E5564B794B918d99C84B0fbf4b0bf36ce45";
const lendingPoolAddress = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
const uniRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const SET_TOKEN_UNITS = [
  ethers.utils.parseEther("0.05"),
  ethers.utils.parseEther("0.1"),
  ethers.utils.parseEther("0.2"),
  ethers.utils.parseEther("0.3"),
  ethers.utils.parseEther("0.4"),
  ethers.utils.parseEther("0.5"),
  ethers.utils.parseEther("1"),
  ethers.utils.parseEther("1.5"),
  ethers.utils.parseEther("2"),
  ethers.utils.parseEther("10"),
];

type QuoteRequest = {
  isMinting: boolean;
  inputToken: QuoteToken;
  outputToken: QuoteToken;
  slippage: number;
};

type QuoteResult = {
  isMinting: boolean;
  indexTokenAmount: BigNumber;
  inputOutputTokenAmount: BigNumber;
  componentQuotes: string[];
};

function erc20Contract(
  address: string,
  providerOrSigner: ethers.providers.JsonRpcProvider | Wallet
): Contract {
  const abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
  ];
  return new Contract(address, abi, providerOrSigner);
}

async function arbTransaction(
  arbBot: Contract,
  isBuySetAndRedeem: boolean,
  minProfit: BigNumber,
  exchangeIssuanceCalldata: string,
  tradeCallData: string,
  totalWethAmount: BigNumber
): Promise<PopulatedTransaction> {
  try {
    const flashloanCalldata = await arbBot.callStatic.generateFlashloanCalldata(
      wethAddress,
      totalWethAmount,
      uniRouterAddress,
      tradeCallData,
      eiAddress,
      exchangeIssuanceCalldata,
      isBuySetAndRedeem
    );
    const tx = await arbBot.populateTransaction.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata
    );
    return tx;
  } catch (error: any) {
    console.log("Error creating arb transaction");
    return {};
  }
}

async function calculateProfit(
  provider: ethers.providers.JsonRpcProvider,
  arbBot: Contract,
  isBuySetAndRedeem: boolean,
  minProfit: BigNumber,
  exchangeIssuanceCalldata: string,
  tradeCallData: string,
  totalWethAmount: BigNumber
): Promise<BigNumber> {
  try {
    const flashloanCalldata = await arbBot.generateFlashloanCalldata(
      wethAddress,
      totalWethAmount,
      uniRouterAddress,
      tradeCallData,
      eiAddress,
      exchangeIssuanceCalldata,
      isBuySetAndRedeem
    );
    const predictedBalanceAfter = await arbBot.callStatic.executeArbTrade(
      minProfit,
      wethAddress,
      lendingPoolAddress,
      flashloanCalldata
    );
    const wethContract = erc20Contract(wethAddress, provider);
    const wethBalance: BigNumber = await wethContract.balanceOf(arbBot.address);
    const profit = predictedBalanceAfter.sub(wethBalance);
    return profit;
  } catch (error: any) {
    const ethersError: { reason: string } = error;
    console.log("Error calc profit:", ethersError.reason);
    return BigNumber.from(0);
  }
}

// Returns working quotes for set token units.
async function getQuotes(
  request: QuoteRequest,
  zeroExApi: ZeroExApi,
  provider: ethers.providers.JsonRpcProvider
): Promise<QuoteResult[]> {
  const { inputToken, isMinting, outputToken, slippage } = request;
  let quotes: QuoteResult[] = [];
  for (let i = 0; i < SET_TOKEN_UNITS.length; i++) {
    const indexTokenAmount = SET_TOKEN_UNITS[i];
    const quote = await getFlashMintZeroExQuote(
      inputToken,
      outputToken,
      indexTokenAmount,
      isMinting,
      slippage,
      zeroExApi,
      provider,
      1
    );
    const componentQuotes = quote?.componentQuotes;
    const inputOutputTokenAmount = quote?.inputOutputTokenAmount;
    if (!componentQuotes || !inputOutputTokenAmount) {
      console.log(
        `indexTokenAmount = ${indexTokenAmount.toString()} cannot get swaps`
      );
      continue;
    }
    quotes.push({
      isMinting,
      indexTokenAmount,
      inputOutputTokenAmount,
      componentQuotes,
    });
  }
  return quotes;
}

export const tryBuyAndRedeem = async (
  inputToken: QuoteToken,
  outputToken: QuoteToken,
  minProfit: BigNumber,
  slippage: number,
  arbitrageBot: Contract,
  provider: ethers.providers.JsonRpcProvider,
  zeroExApi: ZeroExApi
) => {
  console.log("### Calculate Arbitrage Profit for buyAndRedeem ###");

  let highestProfit = BigNumber.from(0);
  let transaction: PopulatedTransaction | null = null;

  const quoteRequest: QuoteRequest = {
    isMinting: false,
    inputToken: inputToken,
    outputToken: outputToken,
    slippage,
  };
  const quotes = await getQuotes(quoteRequest, zeroExApi, provider);

  for (let quote of quotes) {
    const { componentQuotes, indexTokenAmount, inputOutputTokenAmount } = quote;
    try {
      const { exchangeIssuanceCalldata } = await getRedeemCalldata(
        inputToken.address, // SetToken
        indexTokenAmount,
        componentQuotes,
        provider
      );
      const tradeCallData = getBuySetTokenCalldata(
        arbitrageBot.address,
        inputToken.address, // SetToken
        indexTokenAmount,
        inputOutputTokenAmount,
        inputToken.fee,
        provider
      );
      const profit = await calculateProfit(
        provider,
        arbitrageBot,
        true,
        minProfit,
        exchangeIssuanceCalldata,
        tradeCallData,
        inputOutputTokenAmount
      );
      console.log(
        `inputOutputTokenAmount = ${inputOutputTokenAmount.toString()} indexTokenAmount = ${indexTokenAmount.toString()} profit = ${profit.toString()}`
      );
      if (highestProfit.lt(profit)) {
        highestProfit = profit;
        transaction = await arbTransaction(
          arbitrageBot,
          true,
          minProfit,
          exchangeIssuanceCalldata,
          tradeCallData,
          inputOutputTokenAmount
        );
      }
    } catch (e) {
      console.log(
        `inputOutputTokenAmount = ${inputOutputTokenAmount.toString()} indexTokenAmount = ${indexTokenAmount.toString()} cannot calculate profit`
      );
    }
  }

  console.log("HIGHESTPROFIT", highestProfit.toString(), transaction == null);
  console.log("###");
  if (highestProfit <= BigNumber.from(0) || transaction == null) return null;

  return {
    profit: highestProfit,
    isBuy: true,
    transaction,
  };
};

const tryIssueAndSell = async (
  inputToken: QuoteToken,
  outputToken: QuoteToken,
  minProfit: BigNumber,
  slippage: number,
  arbitrageBot: Contract,
  provider: ethers.providers.JsonRpcProvider,
  zeroExApi: ZeroExApi
) => {
  console.log("### Calculate Arbitrage Profit for issueAndSell ###");

  let highestProfit = BigNumber.from(0);
  let transaction: PopulatedTransaction | null = null;

  const quoteRequest: QuoteRequest = {
    isMinting: true,
    inputToken: inputToken,
    outputToken: outputToken,
    slippage,
  };
  const quotes = await getQuotes(quoteRequest, zeroExApi, provider);
  console.log(quotes.length, "quotes");

  for (let quote of quotes) {
    const { componentQuotes, indexTokenAmount, inputOutputTokenAmount } = quote;
    try {
      const { exchangeIssuanceCalldata } = await getIssueCalldata(
        outputToken.address, // SetToken
        indexTokenAmount,
        componentQuotes,
        inputOutputTokenAmount,
        provider
      );
      const tradeCallData = getSellSetTokenCalldata(
        arbitrageBot.address,
        outputToken.address, // SetToken
        indexTokenAmount,
        inputOutputTokenAmount,
        outputToken.fee,
        provider
      );
      const profit = await calculateProfit(
        provider,
        arbitrageBot,
        false,
        minProfit,
        exchangeIssuanceCalldata,
        tradeCallData,
        inputOutputTokenAmount
      );
      console.log(
        `inputTokenAmount = ${inputOutputTokenAmount.toString()} indexTokenAmount = ${indexTokenAmount.toString()} profit = ${profit.toString()}`
      );
      if (highestProfit.lt(profit)) {
        console.log("higher profit");
        highestProfit = profit;
        transaction = await arbTransaction(
          arbitrageBot,
          false,
          minProfit,
          exchangeIssuanceCalldata,
          tradeCallData,
          inputOutputTokenAmount
        );
      }
    } catch (e) {
      console.log(
        `inputTokenAmount = ${inputOutputTokenAmount.toString()} indexTokenAmount = ${indexTokenAmount.toString()} cannot calculate profit`
      );
    }
  }

  console.log("HIGHESTPROFIT", highestProfit.toString(), transaction == null);
  console.log("###");
  if (highestProfit <= BigNumber.from(0) || transaction == null) return null;

  return {
    profit: highestProfit,
    isBuy: false,
    transaction,
  };
};

export type ArbPayload = {
  isMinting: boolean;
  indexToken: QuoteToken;
  inputOutputToken: QuoteToken;
  slippage: number;
  minProfit: BigNumber;
};

export async function tryArb(context: Context, payload: ArbPayload) {
  const { indexToken, inputOutputToken, isMinting, minProfit, slippage } =
    payload;
  // Get secrets
  const alchemyApi = await context.secrets.get("ALCHEMY_MAINET_API");
  const arbKeeperPrivateKey = await context.secrets.get(
    "ARB_KEEPER_PRIVATE_KEY"
  );
  const arbContractAddress = await context.secrets.get("ARB_CONTRACT_ADDRESS");
  const index0xApiBaseUrl = await context.secrets.get("INDEX_0X_API");
  const indexApiKey = await context.secrets.get("INDEX_0X_API_KEY");

  const provider = new ethers.providers.JsonRpcProvider(alchemyApi, 1);

  const arbitrageSigningWallet = new Wallet(arbKeeperPrivateKey, provider);
  const arbitrageContract = new Contract(
    arbContractAddress,
    ARB_BOT_ABI,
    arbitrageSigningWallet
  );

  const zeroExApi = new ZeroExApi(
    index0xApiBaseUrl,
    "",
    { "X-INDEXCOOP-API-KEY": indexApiKey },
    "/mainnet/swap/v1/quote"
  );

  const arbitrageResult = isMinting
    ? await tryIssueAndSell(
        inputOutputToken,
        indexToken,
        minProfit,
        slippage,
        arbitrageContract,
        provider,
        zeroExApi
      )
    : await tryBuyAndRedeem(
        indexToken,
        inputOutputToken,
        minProfit,
        slippage,
        arbitrageContract,
        provider,
        zeroExApi
      );

  // If no result, just return
  if (!arbitrageResult) return;

  const { profit, transaction, isBuy } = arbitrageResult;
  console.log(
    `Found arbitrage, profit=${profit}, ${
      isBuy ? "Buy And Redeem" : "Issue And Sell"
    }`
  );

  if (profit.lt(minProfit)) {
    console.log("Found arbitrage but the profit is too small");
    return;
  }

  try {
    const estimateGas = await arbitrageSigningWallet.estimateGas({
      ...transaction,
      from: arbitrageSigningWallet.address,
    });
    transaction.gasLimit = estimateGas.mul(15).div(10);
  } catch (e) {
    console.log("Error estimating gas");
    // console.warn(`Error estimating gas for ${JSON.stringify(transaction)}`);
    return;
  }

  try {
    const result = await (
      await arbitrageSigningWallet.sendTransaction(transaction)
    ).wait();
    console.log("sent tx", result.transactionHash);
  } catch (e) {
    console.log("Error sending transaction");
  }
}
