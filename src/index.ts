import { z } from "zod";
import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder } from "@dainprotocol/utils";
import { getLatestDocument } from "./utils";

const getLatestDocumentConfig: ToolConfig = {
  id: "get-latest-document",
  name: "Get Latest Google Drive Document",
  description: "Retrieves the content of the most recently modified Google Doc",
  input: z.object({}),
  output: z.object({
    title: z.string().describe("Title of the document"),
    content: z.string().describe("Content of the document")
  }),
  handler: async (_, agentInfo) => {
    // Implement Google Drive API authentication and retrieval logic here
    const latestDoc = await getLatestDocument();

    const cardUI = new CardUIBuilder()
      .title("Latest Google Drive Document")
      .content(`Retrieved: ${latestDoc.title}`)
      .build();

    return {
      text: `Retrieved latest document: ${latestDoc.title}`,
      data: latestDoc,
      ui: cardUI
    };
  }
};

const googleDriveService = defineDAINService({
  metadata: {
    title: "Google Drive Integration Service",
    description: "A service to interact with Google Drive",
    version: "1.0.0",
    author: "Your Name",
    tags: ["google-drive"]
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getLatestDocumentConfig],
});

googleDriveService.startNode({ port: 2023 }).then(() => {
  console.log("Google Drive Integration Service is running on port 2023");
});
