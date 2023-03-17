import * as dotenv from "dotenv";
import { TestBlockEvent, TestRuntime } from "@tenderly/actions-test";
import { mint, redeem } from "../../actions/dseth";

dotenv.config();

const main = async () => {
  const testRuntime = new TestRuntime();

  testRuntime.context.secrets.put(
    "ALCHEMY_MAINET_API",
    process.env.ALCHEMY_MAINET_API || ""
  );
  testRuntime.context.secrets.put(
    "ARB_CONTRACT_ADDRESS",
    process.env.ARB_CONTRACT_ADDRESS || ""
  );
  testRuntime.context.secrets.put(
    "ARB_KEEPER_PRIVATE_KEY",
    process.env.ARB_KEEPER_PRIVATE_KEY || ""
  );
  testRuntime.context.secrets.put(
    "INDEX_0X_API",
    process.env.INDEX_0X_API || ""
  );
  testRuntime.context.secrets.put(
    "INDEX_0X_API_KEY",
    process.env.INDEX_0X_API_KEY || ""
  );

  const blockEvent = new TestBlockEvent();
  blockEvent.network = "1";
  blockEvent.blockHash =
    "0x202a6b407606dd1e214273deeba8b6db0aa55cdca7584b934657609b11c6b02c";
  blockEvent.blockNumber = 16784427;
  blockEvent.blockDifficulty = "0";
  blockEvent.totalDifficulty = "58750003716598352816469";

  await testRuntime.execute(mint, blockEvent);
  await testRuntime.execute(redeem, blockEvent);
};

(async () => await main())();
