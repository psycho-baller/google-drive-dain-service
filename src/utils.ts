import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/documents.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Load OAuth2 client credentials from credentials.json.
 */
function loadCredentials(): any {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Error: ${CREDENTIALS_PATH} not found.`);
  }
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  return JSON.parse(content);
}
/**
 * Store token to disk for later program executions.
 */
function storeToken(token: any): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log('Token stored to', TOKEN_PATH);
}

/**
 * Get and authorize an OAuth2 client.
 */
async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const credentials = loadCredentials();
  // Use "installed" or "web" depending on your credentials file.
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if token already exists.
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Generate a new token if one doesn't exist.
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);

  const code = await new Promise<string>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      resolve(code);
    });
  });

  const tokenResponse = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokenResponse.tokens);
  storeToken(tokenResponse.tokens);
  return oAuth2Client;
}
export const getLatestDocument = async (): Promise<{ title: string, content: string, id: string }> => {
  const auth = await getAuthenticatedClient();

  console.log("auth", auth);
  const drive = google.drive({ version: 'v3', auth });
  const driveRes = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.document'",
    orderBy: 'createdTime desc',
    pageSize: 1,
    fields: 'files(id, name, createdTime)',
  });

  const files = driveRes.data.files;
  if (!files || files.length === 0) {
    throw new Error('No Google Docs files found.');
  }

  const latestFile = files[0];
  console.log(`Latest doc: ${latestFile.name} (ID: ${latestFile.id})`);

  // Initialize the Docs API client
  const docs = google.docs({ version: 'v1', auth });
  const docRes = await docs.documents.get({
    documentId: latestFile.id!,
  });

  const docData = docRes.data;
  const title = docData.title;

  // Extract plain text from the document body.
  // The document body is structured as a series of elements (paragraphs, tables, etc.).
  // Here we loop through paragraph elements and join the text runs.
  let content = '';
  const contentElements = docData.body?.content;
  if (contentElements) {
    for (const element of contentElements) {
      if (element.paragraph && element.paragraph.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            content += el.textRun.content;
          }
        }
      }
    }
  }

  console.log('Title:', title);
  console.log('Content:', content);
  return {
    title: title,
    content: content,
    id: latestFile.id
  };
}