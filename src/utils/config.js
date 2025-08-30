import pkg from "@story-protocol/core-sdk";
const { StoryClient } = pkg;
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Story Protocol Setup
const privateKey = `0x${process.env.WALLET_PRIVATE_KEY}`;
export const account = privateKeyToAccount(privateKey);

const storyConfig = {
  account: account,
  transport: http(process.env.RPC_PROVIDER_URL),
  chainId: "aeneid", // gunakan string "aeneid" bukan variable
};

export const storyClient = StoryClient.newClient(storyConfig);

// OpenAI Setup
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  port: process.env.PORT || 3000,
  storyRpcUrl: process.env.RPC_PROVIDER_URL,
  chainId: "aeneid",
};