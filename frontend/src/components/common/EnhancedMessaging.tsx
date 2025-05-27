import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import {
  UserCircleIcon,
  PaperAirplaneIcon,
  SearchIcon,
  EmojiHappyIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';
import { showToast } from './Toast';
import { useWebSocket } from '@/lib/websocket';

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  participant1_name?: string;
  participant2_name?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: string[];
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

const sendMessage = async ({
  conversationId,
  content,
  attachments,
}: {
  conversationId: string;
  content: string;
  attachments?: File[];
}): Promise<Message> => {
  const formData = new FormData();
  formData.append('content', content);
  if (attachments) {
    attachments.forEach(file => formData.append('attachments', file));
  }

  const response = await fetch(`/api/messages/conversations/${conversationId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};

export const EnhancedMessaging: React.FC = () => {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize WebSocket connection
  useWebSocket(session?.user?.id);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: !!session,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => fetchMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      setNewMessage('');
      setAttachments([]);
      showToast('Message sent successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredConversations = React.useMemo(() => {
    if (!searchTerm.trim() || !conversations) return conversations;
    return conversations.filter(conv => {
      const participantName = session?.user?.id === conv.participant1_id
        ? conv.participant2_name
        : conv.participant1_name;
      return participantName?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [conversations, searchTerm, session]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!session) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please sign in to use messaging
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[600px] bg-white rounded-lg shadow">
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-4">Conversations</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {conversationsLoading ? (
              <LoadingSpinner className="p-4" />
            ) : (
              filteredConversations?.map(conv => (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conv.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {session.user?.id === conv.participant1_id
                          ? conv.participant2_name
                          : conv.participant1_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(conv.last_message_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {conv.unread_count ? (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {conv.unread_count}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <LoadingSpinner className="p-4" />
                ) : (
                  messages?.map(message => (
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
                        {message.attachments?.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 text-xs underline"
                          >
                            Attachment {index + 1}
                          </a>
                        ))}
                        <div className="text-xs mt-1 opacity-75">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-t flex gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="bg-gray-100 rounded p-2 text-sm">
                        {file.name}
                        <button
                          onClick={() => removeAttachment(index)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (newMessage.trim() || attachments.length > 0) {
                      sendMessageMutation.mutate({
                        conversationId: selectedConversation,
                        content: newMessage.trim(),
                        attachments,
                      });
                    }
                  }}
                  className="flex items-end space-x-2"
                >
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <EmojiHappyIcon className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <PaperClipIcon className="h-6 w-6" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() && attachments.length === 0}
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
    </ErrorBoundary>
  );
}; 