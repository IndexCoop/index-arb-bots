import { BigNumber, ethers } from "ethers";

export function parseEther(ether: string): BigNumber {
  return ethers.utils.parseEther(ether);
}
