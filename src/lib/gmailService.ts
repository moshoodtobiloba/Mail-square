export const parseEmailContent = (content: string, variables: Record<string, string>) => {
  let parsedContent = content;
  
  // Replace dynamic variables like {FirstName} or {Company}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'gi');
    parsedContent = parsedContent.replace(regex, value);
  }
  
  return parsedContent;
};

export const fetchGmailMessages = async (accessToken: string, maxResults: number = 10) => {
  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Failed to fetch Gmail messages:", error);
    return [];
  }
};

export const getGmailMessageDetails = async (accessToken: string, messageId: string) => {
  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract headers
    const headers = data.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('subject');
    const sender = getHeader('from');
    const recipient = getHeader('to');
    const date = getHeader('date');

    // Extract body snippet
    const snippet = data.snippet;

    return {
      id: messageId,
      subject,
      sender,
      recipient,
      date,
      snippet
    };
  } catch (error) {
    console.error(`Failed to fetch details for message ${messageId}:`, error);
    return null;
  }
};
