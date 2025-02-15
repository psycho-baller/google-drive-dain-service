import { google } from 'googleapis';

export const getLatestDocument = async (): Promise<{ title: string, content: string }> => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/drive'
  });
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    pageSize: 1,
    orderBy: 'modifiedTime desc',
    q: 'mimeType = "application/vnd.google-apps.document"'
  });

  if (response.data.files && response.data.files.length > 0) {
    const file = response.data.files[0];
    const doc = await drive.files.get({
      fileId: file.id!
    });

    return {
      title: doc.data!.name, content: doc.data!.description
    };
  } else {
    throw new Error('No Google Drive document found');
  }
};