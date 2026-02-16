/**
 * Dexter VS Code Webview - Main App Component
 */

import { ChatContainer } from './components/ChatContainer';
import './styles.css';

function App() {
  return (
    <div className="vscode-webview h-screen flex flex-col">
      <ChatContainer />
    </div>
  );
}

export default App;
