import { z } from "zod";
import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder, DainResponse, paramSchema } from "@dainprotocol/utils";
import { getLatestDocument } from "./utils";
import * as dotenv from 'dotenv';
import * as path from 'path';

const getLatestDocumentConfig: ToolConfig = {
  id: "get-latest-document",
  name: "Get Latest Google Drive Document",
  description: "Retrieves the content of the most recently modified Google Doc",
  input: z.object({}).describe("No input required"),
  output: z.object({
    title: z.string().describe("Title of the document"),
    content: z.string().describe("Content of the document"),
    id: z.string().describe("ID of the document")
  }),
  handler: async (_, agentInfo) => {
    try {
      console.log("agentInfo", agentInfo);
      // Implement Google Drive API authentication and retrieval logic here
      const latestDoc = await getLatestDocument();

      const cardUI = new CardUIBuilder()
        .title("Latest Google Drive Document")
        .content(`Retrieved: ${latestDoc.title}
          content: ${latestDoc.content}
          id: ${latestDoc.id}`)
        .onConfirm({
          tool: "openDocument",
          paramSchema: {
            url: { type: "string", description: "URL of the document" }
          },
          params: {
            url: `https://docs.google.com/document/d/${latestDoc.id}`
          }
        })
        .build();

      return new DainResponse({
        text: `Retrieved latest document: ${latestDoc.title}`,
        data: latestDoc,
        ui: cardUI
      });
    } catch (error) {
      console.error("Error retrieving latest document:", error);
      return new DainResponse({
        text: "Failed to retrieve the latest document",
        data: { error: error.message },
        ui: new CardUIBuilder()
          .title("Error")
          .content("Failed to retrieve the latest document. Please try again later.")
          .build()
      });
    }
  }
};

const googleDriveService = defineDAINService({
  metadata: {
    title: "Google Drive Integration Service",
    description: "A service to interact with Google Drive",
    version: "1.0.0",
    author: "Your Name",
    tags: ["google-drive", "document-retrieval"]
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getLatestDocumentConfig],
});

googleDriveService.startNode({ port: 2022 }).then(() => {
  console.log("Google Drive Integration Service is running on port 2022");
});
