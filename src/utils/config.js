import pkg from "@story-protocol/core-sdk";
const { StoryClient } = pkg;
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

function isHex64(str) {
  return typeof str === 'string' && /^[a-fA-F0-9]{64}$/.test(str);
}

// Story Protocol Setup (safe)
let account = null;
const rawPk = process.env.WALLET_PRIVATE_KEY;
if (isHex64(rawPk)) {
  try {
    account = privateKeyToAccount(`0x${rawPk}`);
  } catch (e) {
    console.warn("WALLET_PRIVATE_KEY invalid, StoryClient will be disabled:", e.message);
  }
} else if (rawPk) {
  console.warn("WALLET_PRIVATE_KEY format invalid. Expected 64 hex chars without 0x.");
}

let storyClient = null;
const rpcUrl = process.env.RPC_PROVIDER_URL;
try {
  if (account && rpcUrl) {
    storyClient = StoryClient.newClient({
      account,
      transport: http(rpcUrl),
      chainId: "aeneid",
    });
  } else {
    console.warn("StoryClient not initialized: missing account or RPC_PROVIDER_URL");
  }
} catch (e) {
  console.warn("Failed to initialize StoryClient:", e.message);
  storyClient = null;
}

// OpenAI Setup (safe)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn("Failed to initialize OpenAI client:", e.message);
  }
} else {
  console.warn("OPENAI_API_KEY not set. Falling back to local parsing/summaries.");
}

export { account, storyClient, openai };

export const config = {
  port: process.env.PORT || 3000,
  storyRpcUrl: rpcUrl,
  chainId: "aeneid",
};
