# Index Arb Bot

![Github Actions](https://github.com/IndexCoop/dseth-arb/workflows/test/badge.svg)

### Getting Started

To set up your local dev environment you need to:

- Use Foundry to install dependencies as submodules:

```bash
forge install
forge test
```

- Get other dependencies and make sure the typescript compiles:

```bash
yarn install
npx hardhat test
npx hardhat node
```

You will also need to set up a .env file to store private keys etc.

```bash
cp .env.default .env
```

Lastly, you will need to install [tenderly-cli](https://github.com/Tenderly/tenderly-cli) and use it to add your tenderly credentials to tenderly.yaml

```bash
cp tenderly.yaml.default tenderly.yaml
tenderly login
tenderly whoami
```

The last command should give you all the fields to fill `tenderly.yaml`

### Deploying Contracts using Foundry

```bash
forge create src/Arb.sol:Arb --network <network> --private-key <deployer-private-key>
```

## Web3 Actions on Tenderly

To test locally if the actions are building (e.g. Tenderly doesn't like unused imports or unused vars):

```bash
tenderly actions build
```

To deploy all actions via CLI, run the following command from the _root_ :warning: of the project.

```bash
tenderly actions deploy
```

For all commands, check the [docs](https://docs.tenderly.co/web3-actions/references/cli-cheatsheet).

### Testing + Local Development

To run actions locally for testing, use:

```bash
yarn bot-test
```

The test file can be found under [/test/actions/index.ts](/test/actions/index.ts).

### Deploying a new bot

- Go to the [/actions](/actions) folder
- Duplicate an existing bot file e.g. [dseth](/actions/dseth.ts)
- Update the index token, config the payload (no other changes should be necessary)
- Open [tenderly.yaml](/tenderly.yaml)
- Add two new triggers (mint/redeem) in the same format as the other actions/bots
- Run `yarn bot-deploy` (incudes a build step to make sure everything builds before deploying)
- The dashboard should now show two new actions/bots (check that they are activated)
