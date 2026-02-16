import { useAgentStream } from '../hooks/useAgentStream';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';

export function ChatContainer() {
  const { messages, isProcessing, error, sendMessage, cancelMessage, clearMessages } = useAgentStream();

  const handleSend = async (query: string) => {
    console.log('[ChatContainer] ═══════════════════════════════════════');
    console.log('[ChatContainer] handleSend called');
    console.log('[ChatContainer]    Query:', query);
    console.log('[ChatContainer]    Query length:', query.length);
    console.log('[ChatContainer]    Query trimmed:', query.trim());
    console.log('[ChatContainer] ═══════════════════════════════════════');

    try {
      await sendMessage(query);
      console.log('[ChatContainer] ✅ sendMessage completed successfully');
    } catch (err) {
      console.error('[ChatContainer] ❌ Failed to send message:', err);
      console.error('[ChatContainer]    Error details:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agentflow AI Assistant</h1>
            <p className="text-sm text-blue-100 mt-1">
              Powered by Agentflow
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isProcessing && (
              <button
                onClick={cancelMessage}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isProcessing}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isProcessing ? 'Processing...' : 'Ready'}</span>
          </div>
          <div className="text-gray-500">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <InputBox
        onSend={handleSend}
        disabled={isProcessing}
        placeholder={isProcessing ? 'Processing...' : 'Ask me anything...'}
      />
    </div>
  );
}
