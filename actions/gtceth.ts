import { ActionFn, Context, Event, BlockEvent } from "@tenderly/actions";

import { ArbPayload, tryArb } from "./lib";
import { WETH } from "./lib/tokens";
import { parseEther } from "./lib/utils";

const indexToken = {
  symbol: "gtcETH",
  decimals: 18,
  address: "0x36c833Eed0D376f75D1ff9dFDeE260191336065e",
};

const payload: ArbPayload = {
  isMinting: true,
  indexToken,
  inputOutputToken: WETH,
  slippage: 0.0001,
  minProfit: parseEther("0.05"),
};

export const mint: ActionFn = async (context: Context, event: Event) => {
  let blockEvent = event as BlockEvent;
  console.log("Block number is: ", blockEvent.blockNumber);
  await tryArb(context, payload);
};

export const redeem: ActionFn = async (context: Context, event: Event) => {
  let blockEvent = event as BlockEvent;
  payload.isMinting = false;
  console.log("Block number is: ", blockEvent.blockNumber, payload.isMinting);
  await tryArb(context, payload);
};
