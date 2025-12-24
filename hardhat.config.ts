import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [
    hardhatVerify,
    hardhatEthers,
    hardhatTypechain,
    hardhatMocha,
    hardhatEthersChaiMatchers,
    hardhatNetworkHelpers,
    hardhatToolboxMochaEthersPlugin
  ],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          remappings: [
            "@openzeppelin/=node_modules/@openzeppelin/",
          ]
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: "https://eth-sepolia.g.alchemy.com/v2/ZDGlY22i6LQtgteuZYMV7",
      accounts: ["INSERT_YOUR_PRIVATE_KEY_HERE"],
    },
  },
  verify: {
    etherscan: {
      apiKey: "CCIRPJ1D269JQKNVXDHPWS6PFQU5NTKS5I",
    },
  },
});
