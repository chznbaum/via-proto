"use client";

import { Logger, AxiomJSTransport } from "@axiomhq/logging";
import { Axiom } from "@axiomhq/js";

// Client-side Axiom instance
const axiom = new Axiom({
  token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
});

const axiomDataset = process.env.NEXT_PUBLIC_AXIOM_DATASET!;

// Create a logger for client-side use
export const logger = new Logger({
  transports: [new AxiomJSTransport({ axiom, dataset: axiomDataset })],
});
