import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Majlis - P2P Video Chat',
};

export default function MajlisPage() {
  // Read the HTML file from majlis folder
  const htmlPath = path.join(process.cwd(), 'majlis', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // Extract body content
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
  
  return (
    <>
      <link rel="stylesheet" href="/api/majlis-assets/index-pLXvxeZd.css" />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <script type="module" src="/api/majlis-assets/index-DeWai24A.js" async></script>
    </>
  );
}
