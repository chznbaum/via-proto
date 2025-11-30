import { Logger, AxiomJSTransport } from "@axiomhq/logging";
import { createAxiomRouteHandler } from "@axiomhq/nextjs";
import { axiom, axiomDataset } from "./axiom";

// Create a logger for server-side use
export const logger = new Logger({
  transports: [new AxiomJSTransport({ axiom, dataset: axiomDataset })],
});

// Create route handler wrapper that automatically logs requests and errors
export const withAxiom = createAxiomRouteHandler(logger);
