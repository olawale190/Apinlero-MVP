import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Clock,
  X,
  ChevronRight
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface AskApinleroProps {
  orders: Order[];
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_quantity?: number;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  { icon: TrendingUp, text: "What sold best this week?", query: "best sellers" },
  { icon: Users, text: "Who are my top customers?", query: "top customers" },
  { icon: Package, text: "What's running low?", query: "low stock" },
  { icon: Clock, text: "How was today?", query: "today summary" },
];

export default function AskApinlero({ orders, products }: AskApinleroProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const generateResponse = (userQuery: string): string => {
    const lowerQuery = userQuery.toLowerCase();
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);

    // Best sellers
    if (lowerQuery.includes('best') || lowerQuery.includes('top seller') || lowerQuery.includes('popular')) {
      const productSales = orders
        .flatMap(order => Array.isArray(order.items) ? order.items : [])
        .reduce((acc, item) => {
          acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
          return acc;
        }, {} as Record<string, number>);

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (topProducts.length === 0) {
        return "No sales data yet. Once you start getting orders, I'll show you the best sellers!";
      }

      const total = topProducts.reduce((sum, [, qty]) => sum + qty, 0);
      let response = `📊 **Your Top Sellers This Week:**\n\n`;
      topProducts.forEach(([name, qty], idx) => {
        response += `${idx + 1}. **${name}** - ${qty} units sold\n`;
      });
      response += `\n💡 *Tip: ${topProducts[0][0]} is your star product! Consider promoting it more.*`;
      return response;
    }

    // Top customers
    if (lowerQuery.includes('customer') || lowerQuery.includes('buyer') || lowerQuery.includes('who')) {
      const customerOrders = orders.reduce((acc, order) => {
        const key = order.customer_name;
        if (!acc[key]) {
          acc[key] = { count: 0, total: 0, phone: order.phone_number };
        }
        acc[key].count += 1;
        acc[key].total += order.total;
        return acc;
      }, {} as Record<string, { count: number; total: number; phone: string }>);

      const topCustomers = Object.entries(customerOrders)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5);

      if (topCustomers.length === 0) {
        return "No customer data yet. Your loyal customers will show up here!";
      }

      let response = `👑 **Your Top Customers:**\n\n`;
      topCustomers.forEach(([name, data], idx) => {
        response += `${idx + 1}. **${name}** - ${data.count} orders, £${data.total.toFixed(2)} total\n`;
      });
      response += `\n💡 *Consider sending a VIP promotion to thank your top customers!*`;
      return response;
    }

    // Low stock
    if (lowerQuery.includes('low') || lowerQuery.includes('stock') || lowerQuery.includes('running out') || lowerQuery.includes('reorder')) {
      const lowStock = products.filter(p => (p.stock_quantity || 0) < 10);

      if (lowStock.length === 0) {
        return "✅ Great news! All your products are well-stocked. No immediate reorder needed.";
      }

      let response = `⚠️ **Products Running Low:**\n\n`;
      lowStock.forEach(p => {
        const urgency = (p.stock_quantity || 0) < 5 ? '🔴' : '🟡';
        response += `${urgency} **${p.name}** - ${p.stock_quantity} left\n`;
      });
      response += `\n💡 *${lowStock.filter(p => (p.stock_quantity || 0) < 5).length} items need urgent restocking!*`;
      return response;
    }

    // Today summary
    if (lowerQuery.includes('today') || lowerQuery.includes('summary') || lowerQuery.includes('how was') || lowerQuery.includes('report')) {
      const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
      const pending = todayOrders.filter(o => o.status === 'Pending').length;
      const delivered = todayOrders.filter(o => o.status === 'Delivered').length;

      const channelBreakdown = todayOrders.reduce((acc, o) => {
        acc[o.channel] = (acc[o.channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topChannel = Object.entries(channelBreakdown).sort(([, a], [, b]) => b - a)[0];

      let response = `📈 **Today's Summary** (${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}):\n\n`;
      response += `• **Orders:** ${todayOrders.length}\n`;
      response += `• **Revenue:** £${revenue.toFixed(2)}\n`;
      response += `• **Avg Order:** £${todayOrders.length > 0 ? (revenue / todayOrders.length).toFixed(2) : '0.00'}\n`;
      response += `• **Pending:** ${pending} | **Delivered:** ${delivered}\n`;

      if (topChannel) {
        response += `• **Top Channel:** ${topChannel[0]} (${topChannel[1]} orders)\n`;
      }

      response += `\n💡 *${pending > 0 ? `You have ${pending} orders to process!` : 'All orders are processed! Great job!'}*`;
      return response;
    }

    // Revenue / money
    if (lowerQuery.includes('revenue') || lowerQuery.includes('money') || lowerQuery.includes('earned') || lowerQuery.includes('sales')) {
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const weekOrders = orders.filter(o => new Date(o.created_at) > thisWeek);
      const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);

      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      const lastWeekOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d > lastWeekStart && d <= lastWeekEnd;
      });
      const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0);

      const change = lastWeekRevenue > 0
        ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(0)
        : 100;

      let response = `💰 **Revenue Overview:**\n\n`;
      response += `• **This Week:** £${weekRevenue.toFixed(2)} (${weekOrders.length} orders)\n`;
      response += `• **Last Week:** £${lastWeekRevenue.toFixed(2)} (${lastWeekOrders.length} orders)\n`;
      response += `• **Change:** ${Number(change) >= 0 ? '📈' : '📉'} ${change}%\n`;

      if (Number(change) >= 0) {
        response += `\n💡 *Great progress! Keep it up!*`;
      } else {
        response += `\n💡 *Consider running a promotion to boost sales.*`;
      }
      return response;
    }

    // Orders by channel
    if (lowerQuery.includes('channel') || lowerQuery.includes('whatsapp') || lowerQuery.includes('web') || lowerQuery.includes('phone')) {
      const channelStats = orders.reduce((acc, o) => {
        if (!acc[o.channel]) {
          acc[o.channel] = { count: 0, revenue: 0 };
        }
        acc[o.channel].count += 1;
        acc[o.channel].revenue += o.total;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const sortedChannels = Object.entries(channelStats).sort(([, a], [, b]) => b.revenue - a.revenue);

      let response = `📱 **Channel Performance:**\n\n`;
      sortedChannels.forEach(([channel, data]) => {
        const emoji = channel === 'WhatsApp' ? '📱' : channel === 'Web' ? '🌐' : channel === 'Phone' ? '📞' : '🚶';
        response += `${emoji} **${channel}:** ${data.count} orders, £${data.revenue.toFixed(2)}\n`;
      });

      const topChannel = sortedChannels[0];
      if (topChannel) {
        response += `\n💡 *${topChannel[0]} is your strongest channel! Focus your marketing there.*`;
      }
      return response;
    }

    // Default response
    return `I'm not sure I understand that question. Try asking me:\n\n• "What sold best this week?"\n• "Who are my top customers?"\n• "What's running low?"\n• "How was today?"\n• "Show me revenue"\n• "Which channel performs best?"`;
  };

  const handleSend = (userQuery: string = query) => {
    if (!userQuery.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateResponse(userQuery);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickQuestion = (questionQuery: string) => {
    handleSend(questionQuery);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50"
        >
          <div className="relative">
            <MessageSquare size={24} />
            <Sparkles className="absolute -top-1 -right-1 text-yellow-300" size={12} />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Sparkles className="text-white" size={18} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Ask Àpínlẹ̀rọ</h3>
                <p className="text-teal-100 text-xs">Your AI Business Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[350px]">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="text-teal-500 mx-auto mb-3" size={32} />
                <h4 className="font-semibold text-gray-800 mb-1">How can I help?</h4>
                <p className="text-gray-500 text-sm mb-4">Ask me anything about your business</p>

                {/* Quick Questions */}
                <div className="space-y-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(q.query)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-sm flex items-center gap-2"
                    >
                      <q.icon size={16} className="text-teal-600" />
                      <span className="text-gray-700">{q.text}</span>
                      <ChevronRight size={14} className="text-gray-400 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.type === 'user'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your business..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!query.trim()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
