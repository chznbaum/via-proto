import { Axiom } from "@axiomhq/js";

// Initialize Axiom client with public token for browser/server use
export const axiom = new Axiom({
  token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
});

export const axiomDataset = process.env.NEXT_PUBLIC_AXIOM_DATASET!;
