import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Preparing Tokens...");
  const TokenFactory = await ethers.getContractFactory("myToken");
  
  const token = await TokenFactory.deploy(); 
  await token.waitForDeployment(); 
  
  const tokenAddress = await token.getAddress();
  console.log(`✅ Token Successfully Deployed in: ${tokenAddress}`);

  console.log("Preparing Vault...");
  const VaultFactory = await ethers.getContractFactory("SingleVaultBase");
  
  const vault = await VaultFactory.deploy(tokenAddress); 
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log(`✅ Vault Successfully Deployed in: ${vaultAddress}`);

  console.log("Network: Sepolia");
  console.log("Token:", tokenAddress);
  console.log("Vault:", vaultAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});