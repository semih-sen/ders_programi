import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'Majlis - P2P Video Chat',
};

export default function MajlisPage() {
  // Read the HTML file from majlis folder
  const htmlPath = path.join(process.cwd(), 'majlis', 'index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // Update asset paths to point to the correct location
  htmlContent = htmlContent.replace('/assets/', '/majlis-assets/');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Majlis - P2P Video Chat</title>
      </head>
      <body suppressHydrationWarning>
        <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/<\/?html[^>]*>|<\/?head[^>]*>|<\/?body[^>]*>/g, '') }} />
      </body>
    </html>
  );
}
