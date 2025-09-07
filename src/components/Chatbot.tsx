import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { chatbotResponses, chatbotSettings } from '@/config/chatbot-responses';
import { clinicInfo } from '@/config/clinic-info';
import { chatbotAppearance, chatbotBehavior } from '@/config/chatbot-settings';
import { TREATMENT_COSTS, getTreatmentCost, getTreatmentDetails } from '@/config/treatment-costs';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  followUpQuestions?: string[];
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to clean phone number for WhatsApp links
  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/[\s\-\(\)]/g, '');
  };

  // Function to render markdown-style links
  const renderMessageText = (text: string) => {
    // Replace {phone} placeholder with clean phone number for WhatsApp links
    const cleanPhone = cleanPhoneNumber(clinicInfo.phone);
    const processedText = text.replace(/\{phone\}/g, cleanPhone);
    
    // Split text by markdown links and render them as clickable links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = processedText.split(linkRegex);
    
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        // Regular text
        return <span key={index}>{part}</span>;
      } else if (index % 3 === 1) {
        // Link text
        const url = parts[index + 1];
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return null;
    });
  };

  // Auto-scroll to bottom when new messages arrive (only if chatbot is open)
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      // Use a small delay to ensure the message is rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [messages, isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: chatbotSettings.welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
        followUpQuestions: [
          'I want to book an appointment',
          'What services do you offer?',
          'What are your office hours?',
          'How much does a consultation cost?',
          'What are your payment options?'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Auto-open chatbot when first user message is sent
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    if (userMessages.length === 1 && !isOpen) {
      setIsOpen(true);
    }
  }, [messages, isOpen]);

  // Find matching response based on user input
  const findMatchingResponse = (userInput: string): ChatbotResponse | null => {
    const input = userInput.toLowerCase().trim();
    
    // First check for specific treatment cost queries
    const treatmentCostResponse = findTreatmentCostResponse(input);
    if (treatmentCostResponse) {
      return treatmentCostResponse;
    }
    
    for (const response of chatbotResponses) {
      // Check if any keyword matches
      const keywordMatch = response.keywords.some(keyword => 
        input.includes(keyword.toLowerCase())
      );
      
      // Check if question pattern matches
      const patternMatch = response.question.split('|').some(pattern => 
        input.includes(pattern.toLowerCase())
      );
      
      if (keywordMatch || patternMatch) {
        return response;
      }
    }
    
    return null;
  };

  // Find treatment cost response dynamically
  const findTreatmentCostResponse = (input: string): ChatbotResponse | null => {
    // Check if user is asking about a specific treatment cost
    for (const [treatmentName, treatmentData] of Object.entries(TREATMENT_COSTS)) {
      const treatmentKeywords = treatmentName.toLowerCase().split(' ');
      const costKeywords = ['cost', 'price', 'how much', 'pricing'];
      
      // Check if input contains treatment name and cost-related words
      const hasTreatmentName = treatmentKeywords.some(keyword => 
        input.includes(keyword)
      );
      const hasCostKeyword = costKeywords.some(keyword => 
        input.includes(keyword)
      );
      
      if (hasTreatmentName && hasCostKeyword && treatmentData.defaultCost) {
        const cost = treatmentData.defaultCost;
        const formattedCost = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(cost);
        
        return {
          id: `cost_${treatmentName.toLowerCase().replace(/\s+/g, '_')}`,
          question: '',
          answer: `${treatmentName} typically costs around ${formattedCost}. ${treatmentData.description || ''} Would you like to schedule a consultation or learn about the treatment process?`,
          keywords: [],
          followUpQuestions: [
            'Schedule consultation',
            'Treatment process',
            'Payment plans',
            'Other treatments'
          ]
        };
      }
    }
    
    return null;
  };

  // Replace placeholders in response text
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/{clinicName}/g, clinicInfo.name)
      .replace(/{phone}/g, clinicInfo.phone)
      .replace(/{email}/g, clinicInfo.email)
      .replace(/{address}/g, `${clinicInfo.address.street}, ${clinicInfo.address.city}, ${clinicInfo.address.state} ${clinicInfo.address.zipCode}`)
      .replace(/{emergencyPhone}/g, clinicInfo.emergencyPhone);
  };

  // Handle user message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, chatbotSettings.typingDelay));

    // Find matching response
    const response = findMatchingResponse(inputValue);
    
    let botResponse: Message;
    
    if (response) {
      botResponse = {
        id: Date.now().toString() + '_bot',
        text: replacePlaceholders(response.answer),
        sender: 'bot',
        timestamp: new Date(),
        followUpQuestions: response.followUpQuestions
      };
    } else {
      botResponse = {
        id: Date.now().toString() + '_bot',
        text: chatbotSettings.fallbackMessage,
        sender: 'bot',
        timestamp: new Date(),
        followUpQuestions: [
          'Book an appointment',
          'View our services',
          'Contact us',
          'Emergency care'
        ]
      };
    }

    setIsTyping(false);
    setMessages(prev => [...prev, botResponse]);
  };

  // Handle follow-up question click
  const handleFollowUpClick = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Handle action buttons
  const handleAction = (action: string) => {
    switch (action) {
      case 'book_appointment':
        window.location.href = '/appointment';
        break;
      case 'call_clinic':
        window.location.href = `tel:${clinicInfo.phone}`;
        break;
      case 'view_services':
        window.location.href = '/services';
        break;
      case 'emergency':
        window.location.href = `tel:${clinicInfo.emergencyPhone}`;
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Chatbot Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Ask Our Dental Assistant</h3>
              <p className="text-blue-100 text-sm">Get instant answers to your questions</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Click to {isOpen ? 'minimize' : 'expand'}</div>
          </div>
        </div>
      </div>

      {/* Chatbot Content */}
      {isOpen && (
        <div className="h-96 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`p-2 rounded-full ${message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="text-sm whitespace-pre-line">{renderMessageText(message.text)}</div>
                    {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.followUpQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleFollowUpClick(question)}
                            className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="p-2 rounded-full bg-gray-200">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about appointments, services, or anything else..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
