# Real Web3 Integration: Deploying to Polygon Amoy

Phase 8 allows Sapphire to transition from `mock` mode to sending real transactions to the Polygon Amoy testnet. Follow these steps to deploy your contract and wire it up to the application.

### Step 1: Prepare a Test Wallet
1. Create a brand new MetaMask wallet. **Never use your personal wallet.**
2. Copy the wallet address.
3. Visit the [Polygon Faucet](https://faucet.polygon.technology/) and request test MATIC for the Amoy network.

### Step 2: Deploy the Contract via Remix
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file named `ReviewAuditRegistry.sol` and paste the code from this folder.
3. Go to the "Solidity Compiler" tab. Select compiler version `0.8.20` and click **Compile**.
4. Go to the "Deploy & Run Transactions" tab.
5. In the Environment dropdown, select **Injected Provider - MetaMask**.
6. Ensure MetaMask is connected to the Polygon Amoy network, then click **Deploy**.
7. Confirm the transaction in MetaMask.
8. Once deployed, copy the **Contract Address** from the "Deployed Contracts" section.

### Step 3: Configure Your Application
Open your local `.env.local` file and update the following:
1. Set `NEXT_PUBLIC_BLOCKCHAIN_MODE=amoy`
2. Set `NEXT_PUBLIC_REVIEW_AUDIT_CONTRACT_ADDRESS` to the address you copied from Remix.
3. Set `PRIVATE_KEY` to the private key of your test wallet (Export this from MetaMask settings).

### Step 4: Test the Live Connection
1. Restart your Next.js development server (`npm run dev`).
2. Go to the Admin Audit Log in the app. The `BlockchainModePanel` should now display **Live Amoy Anchoring Mode**.
3. Create a new review or click **Anchor Pending Events**. 
4. The backend will sign a transaction and send it to Polygon. The resulting `0x...` transaction hash will now be a *real* transaction verifiable on Polygonscan!