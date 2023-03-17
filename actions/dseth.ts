import { ActionFn, Context, Event, BlockEvent } from "@tenderly/actions";

import { ArbPayload, tryArb } from "./lib";
import { WETH } from "./lib/tokens";
import { parseEther } from "./lib/utils";

const indexToken = {
  symbol: "dsETH",
  decimals: 18,
  address: "0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE",
};

const payload: ArbPayload = {
  isMinting: true,
  indexToken,
  inputOutputToken: WETH,
  slippage: 0.0001,
  minProfit: parseEther("0.05"),
};

// Function name in `tenderly.yaml` will be `dseth:mint` [fileName:functionName]
export const mint: ActionFn = async (context: Context, event: Event) => {
  let blockEvent = event as BlockEvent;
  console.log("Block number is: ", blockEvent.blockNumber);
  await tryArb(context, payload);
};

// Function name in `tenderly.yaml` will be `dseth:redeem` [fileName:functionName]
export const redeem: ActionFn = async (context: Context, event: Event) => {
  let blockEvent = event as BlockEvent;
  payload.isMinting = false;
  console.log("Block number is: ", blockEvent.blockNumber, payload.isMinting);
  await tryArb(context, payload);
};
