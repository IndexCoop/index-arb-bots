export const EIZEROEX_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_inputToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amountInputToken",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amountSetIssued",
        type: "uint256",
      },
    ],
    name: "ExchangeIssue",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_outputToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amountSetRedeemed",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amountOutputToken",
        type: "uint256",
      },
    ],
    name: "ExchangeRedeem",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "ETH_ADDRESS",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
    ],
    name: "approveSetToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
    ],
    name: "approveToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_tokens",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
    ],
    name: "approveTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
    ],
    name: "getRequiredIssuanceComponents",
    outputs: [
      {
        internalType: "address[]",
        name: "components",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "positions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
    ],
    name: "getRequiredRedemptionComponents",
    outputs: [
      {
        internalType: "address[]",
        name: "components",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "positions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "_componentQuotes",
        type: "bytes[]",
      },
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
    ],
    name: "issueExactSetFromETH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_inputToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxAmountInputToken",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "_componentQuotes",
        type: "bytes[]",
      },
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
    ],
    name: "issueExactSetFromToken",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minEthReceive",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "_componentQuotes",
        type: "bytes[]",
      },
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
    ],
    name: "redeemExactSetForETH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_setToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_outputToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountSetToken",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_minOutputReceive",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "_componentQuotes",
        type: "bytes[]",
      },
      {
        internalType: "address",
        name: "_issuanceModule",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isDebtIssuance",
        type: "bool",
      },
    ],
    name: "redeemExactSetForToken",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "setController",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "swapTarget",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_tokens",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
    ],
    name: "withdrawTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
