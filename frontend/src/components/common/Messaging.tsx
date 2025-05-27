import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { UserCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  participant1_name?: string;
  participant2_name?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await fetch('/api/messages/conversations');
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
};

const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`/api/messages/conversations/${conversationId}`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

const sendMessage = async ({ conversationId, content }: { conversationId: string; content: string }): Promise<Message> => {
  const response = await fetch(`/api/messages/conversations/${conversationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};

export const Messaging: React.FC = () => {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: !!session,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => fetchMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      setNewMessage('');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please sign in to use messaging
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Conversations</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {conversations?.map(conv => (
            <div
              key={conv.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conv.id ? 'bg-gray-100' : ''
              }`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <div className="font-medium">
                    {session.user?.id === conv.participant1_id
                      ? conv.participant2_name
                      : conv.participant1_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(conv.last_message_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === session.user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === session.user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    sendMessageMutation.mutate({
                      conversationId: selectedConversation,
                      content: newMessage.trim(),
                    });
                  }
                }}
                className="flex space-x-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}; 