import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';

const hostingerUsers = {
  user1: {
    imap: {
      user: 'saloni@wizcoder.com',
      password: 'Saloni@2025',
      host: 'imap.hostinger.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  },
  user2: {
    imap: {
      user: 'mehul@wizcoder.com', 
      password: 'Mehul@2025', 
      host: 'imap.hostinger.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  }
};

const subjectFilters = {
  user1: [
    'UK Master Member List Export',
    'Family Members List Export', 
    'BLS Member List Export',
    'Export Request Completed',
    'Transaction List Export',
    'Credit List Export',
    'Family Members List Export'
  ],
  user2: [
    'Members List Export'
  ]
};


/**
 * Fetch all export emails and save attachments with test case name
 * @param {string} testTitle - Exact test case name
 * @param {string} user - The user to connect as ('user1' or 'user2')
 * @param {string} subject - The subject of the email to search for
 * @returns {string[]} Array of downloaded attachment file paths
 */
export async function fetchAllExportEmails(testTitle, user = 'user2', subject = 'Members List Export') {
  const config = hostingerUsers[user];
  if (!config) {
    throw new Error(`Invalid user specified: ${user}. Available users are: ${Object.keys(hostingerUsers).join(', ')}`);
  }
  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');
  
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  //const searchCriteria = ['UNSEEN', ['SUBJECT', subject]];
  const subjectsToSearch = subjectFilters[user] || [subject];
  
  let subjectCriteria;
  if (subjectsToSearch.length > 1) {
    // Build a nested OR query for multiple subjects, e.g., ['OR', ['SUBJECT', 'A'], ['OR', ['SUBJECT', 'B'], ['SUBJECT', 'C']]]
    const orQuery = subjectsToSearch.map(s => ['SUBJECT', s]);
    subjectCriteria = orQuery.slice(1).reduce((acc, crit) => ['OR', acc, crit], orQuery[0]);
  } else {
    subjectCriteria = ['SUBJECT', subjectsToSearch[0]];
  }
  
  const searchCriteria = ['UNSEEN', subjectCriteria];
  const messages = await connection.search(searchCriteria, { bodies: ['HEADER.FIELDS (SUBJECT)'], struct: true });
  console.log(`Found ${messages.length} unseen email(s) with 'Export' in the subject.`);

  if (messages.length === 0) {
    connection.end();
    throw new Error('No new export email found!');
  }

  const downloadsDir = path.resolve(__dirname, '..', 'tests', 'members', 'export', 'downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const savedFiles = [];
  const safeTestTitle = (testTitle || '')
    .replace(/[^a-z0-9]+/gi, '_')   // replace non-alphanumerics with underscore
    .replace(/^_+|_+$/g, '');        // remove leading/trailing underscores

  for (const msg of messages) {
    const allParts = imaps.getParts(msg.attributes.struct);
    let counter = 1; // To handle multiple attachments in one email
    for (const part of allParts) {
      if (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT') {
        const attachment = await connection.getPartData(msg, part);
        const originalFilename = part.disposition.params.filename;
        const sanitizedTitle = (testTitle || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = Date.now();
        const uniqueFilename = `${sanitizedTitle}_${timestamp}_${originalFilename}`;
        const filePath = path.join(downloadsDir, uniqueFilename);

        fs.writeFileSync(filePath, attachment);
        console.log(`Attachment saved at: ${filePath}`);
        savedFiles.push(filePath);
        await connection.addFlags(msg.attributes.uid, '\Seen');
      }
    }
  }

  connection.end();

  if (savedFiles.length === 0) {
    throw new Error('No attachments found in the export emails.');
  }

  return savedFiles; // returns array of all downloaded attachments
}