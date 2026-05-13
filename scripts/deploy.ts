import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("Deploying ReviewAuditRegistry to Polygon Amoy...");

  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!rpcUrl) {
    throw new Error("Missing POLYGON_AMOY_RPC_URL in .env.local or .env");
  }

  if (!privateKey) {
    throw new Error(
      "Missing DEPLOYER_PRIVATE_KEY or PRIVATE_KEY in .env.local or .env"
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "POL");

  if (balance === BigInt(0)) {
    throw new Error(
      "Your deployer wallet has 0 POL on Amoy. Get test POL from the Polygon faucet first."
    );
  }

  const artifactPath = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    "ReviewAuditRegistry.sol",
    "ReviewAuditRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "ReviewAuditRegistry artifact not found. Run `npx hardhat compile` first."
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contractFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await contractFactory.deploy();

  console.log("Waiting for deployment confirmation...");

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("-----------------------------------------------");
  console.log("ReviewAuditRegistry deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log(
    "Polygonscan:",
    `https://amoy.polygonscan.com/address/${contractAddress}`
  );
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});