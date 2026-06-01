import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { REVIEW_AUDIT_REGISTRY_ABI } from "@/lib/contractAbi";
import { toBytes32Hash } from "@/lib/chainUtils";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "Unknown error");
}

function isEventHashAlreadyExistsError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes("Event hash already exists") ||
    message.includes("event hash already exists")
  );
}

export async function POST(req: Request) {
  try {
    // 1. Validate Environment Mode
    if (process.env.NEXT_PUBLIC_BLOCKCHAIN_MODE !== "amoy") {
      return NextResponse.json(
        {
          success: false,
          error: "Server is not configured for Amoy mode.",
        },
        { status: 400 }
      );
    }

    // 2. Extract Event Payload
    const body = await req.json();
    const event = body.event;

    if (!event || !event.eventHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid audit event payload provided.",
        },
        { status: 400 }
      );
    }

    // 3. Load Secure Web3 Configuration
    const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
    const privateKey =
      process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const contractAddress =
      process.env.NEXT_PUBLIC_REVIEW_AUDIT_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      console.error("Missing critical Web3 environment variables.");

      return NextResponse.json(
        {
          success: false,
          error: "Server misconfiguration. Missing Web3 variables.",
        },
        { status: 500 }
      );
    }

    // 4. Initialize Ethers.js
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      contractAddress,
      REVIEW_AUDIT_REGISTRY_ABI,
      wallet
    );

    // 5. Format Data for Solidity
    const formattedReviewId = event.reviewId || "NO_REVIEW_ID";
    const formattedEventType = event.eventType;
    const formattedPayloadHash = toBytes32Hash(event.payloadHash);
    const formattedPrevHash = event.previousEventHash
      ? toBytes32Hash(event.previousEventHash)
      : ethers.ZeroHash;
    const formattedEventHash = toBytes32Hash(event.eventHash);

    try {
      // 6. Execute Smart Contract Transaction
      const tx = await contract.addAuditRecord(
        formattedReviewId,
        formattedEventType,
        formattedPayloadHash,
        formattedPrevHash,
        formattedEventHash
      );

      // 7. Wait for Block Confirmation
      const receipt = await tx.wait();

      // 8. Return Metadata to Client
      return NextResponse.json({
        success: true,
        data: {
          blockchainStatus: "CONFIRMED",
          blockchainTxHash: tx.hash,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          networkName: "Polygon Amoy Testnet",
          chainId: 80002,
          explorerUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`,
          anchoredAt: new Date().toISOString(),
          anchorMode: "amoy",
          blockchainError: "",
        },
      });
    } catch (error: unknown) {
      console.error("Polygon Amoy anchoring error:", error);

      if (isEventHashAlreadyExistsError(error)) {
        return NextResponse.json({
          success: true,
          data: {
            blockchainStatus: "ALREADY_EXISTS",
            blockchainTxHash: "",
            transactionHash: "",
            blockNumber: 0,
            networkName: "Polygon Amoy Testnet",
            chainId: 80002,
            explorerUrl: "",
            anchoredAt: event.anchoredAt || new Date().toISOString(),
            anchorMode: "amoy",
            blockchainError:
              "Event hash already exists on-chain, but the original transaction hash is unavailable.",
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error:
            getErrorMessage(error) ||
            "Failed to anchor transaction to blockchain.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Fatal API Anchoring Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          getErrorMessage(error) ||
          "Failed to anchor transaction to blockchain.",
      },
      { status: 500 }
    );
  }
}