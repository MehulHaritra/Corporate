//Note: for now yopmail helper is in used, for vfs-uklp-team-member-flow.spec.js file, so this is not required for now.//


/*export async function connectImap({ user, password, host = 'mail.hostinger.com', port = 993, tls = true }) {
  const imaps = await import('imap-simple');
  const { simpleParser } = await import('mailparser');

  const config = {
    imap: {
      user,
      password,
      host,
      port,
      tls,
      authTimeout: 30000,
    },
  };

  try {
    const connection = await imaps.default.connect(config);
    return { connection, simpleParser };
  } catch (error) {
    console.error('IMAP connection error:', error);
    throw new Error('Failed to connect to IMAP server. Please check your credentials and connection settings.');
  }
}

export async function findLatestEmail(connection, { mailbox = 'INBOX', subjectContains = '', from = '', timeout = 30000 }) {
  await connection.openBox(mailbox);
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], markSeen: false };

    try {
      const messages = await connection.search(searchCriteria, fetchOptions);
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const headerPart = msg.parts.find(p => p.which && p.which.includes('HEADER'));
        if (!headerPart) continue;

        const header = headerPart.body;
        const subject = header.subject?.[0] || '';
        const fromHeader = header.from?.[0] || '';

        const matchesSubject = subjectContains ? subject.includes(subjectContains) : true;
        const matchesFrom = from ? fromHeader.includes(from) : true;

        if (matchesSubject && matchesFrom) {
          const textPart = msg.parts.find(p => p.which === 'TEXT');
          if (textPart) {
            const partData = await connection.getPartData(msg, textPart);
            return { subject, from: fromHeader, body: partData };
          }
        }
      }
    } catch (err) {
      console.error('Error searching for email:', err);
    }

    await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds before retrying
  }

  throw new Error(`No matching email found within the timeout period for subject: "${subjectContains}"`);
}*/