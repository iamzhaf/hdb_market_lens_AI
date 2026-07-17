import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Terminal, FileText, Sun, Moon, Cpu, Database, Menu, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import KPICards from './components/KPICards';
import DashboardCharts from './components/DashboardCharts';
import AgentChat from './components/AgentChat';
import SQLConsole from './components/SQLConsole';
import ReportGenerator from './components/ReportGenerator';
import { API_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [dbStatus, setDbStatus] = useState('connecting');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Dashboard states
  const [kpis, setKpis] = useState({
    total_transactions: 0,
    avg_price: 0,
    total_volume: 0,
    avg_area: 0
  });
  const [chartData, setChartData] = useState({
    trend: [],
    towns: [],
    flat_types: [],
    flat_models: []
  });

  // Chat states
  const [chatSessionId, setChatSessionId] = useState(`session_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Apply theme on load and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch Dashboard details on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDbStatus('connecting');
        const kpiRes = await fetch(`${API_URL}/api/kpis`);
        const kpiJson = await kpiRes.json();
        
        const chartRes = await fetch(`${API_URL}/api/chart-data`);
        const chartJson = await chartRes.json();
        
        if (kpiRes.ok && chartRes.ok) {
          setKpis(kpiJson);
          setChartData(chartJson);
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
        setDbStatus('error');
      }
    };
    fetchData();
  }, []);

  const handleSendMessage = async (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { author: 'user', text, time };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: 'default_user',
          sessionId: chatSessionId
        })
      });
      const data = await response.json();
      
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (response.ok) {
        const agentMsg = {
          author: 'agent',
          text: data.response,
          steps: data.steps,
          time: agentTime
        };
        setMessages(prev => [...prev, agentMsg]);
      } else {
        const errMsg = {
          author: 'agent',
          text: `Error: ${data.error || 'Failed to process message'}`,
          time: agentTime
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (err) {
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errMsg = {
        author: 'agent',
        text: 'Error: Failed to connect to the HDB analytics server.',
        time: agentTime
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setChatSessionId(`session_${Date.now()}`);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: Home },
    { id: 'chat', label: 'Insights AI Chat', icon: MessageSquare },
    { id: 'sql', label: 'SQL query Sandbox', icon: Terminal },
    { id: 'report', label: 'Compile slide deck', icon: FileText }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans relative">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border backdrop-blur-md flex flex-col p-6 gap-8 select-none z-30 transition-transform duration-300 md:relative md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-primary w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,71,171,0.4)]">
              <Cpu size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">
              HDB Analytics
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left outline-none cursor-pointer ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-600 to-primary shadow-[0_4px_14px_rgba(0,71,171,0.25)] font-semibold border border-transparent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent hover:border-border font-medium'
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-muted-foreground'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border text-xs text-muted-foreground">
            <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-foreground hover:bg-secondary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Panel content workspace */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-[70px] bg-card border-b border-border backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground h-9 w-9 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-sm md:text-lg font-bold tracking-tight truncate">
              {activeTab === 'dashboard' && 'Market Analytics Dashboard'}
              {activeTab === 'chat' && 'HDB Insights AI Agent'}
              {activeTab === 'sql' && 'PostgreSQL Developer Console'}
              {activeTab === 'report' && 'Executive Slides Builder'}
            </h1>
          </div>
          
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] md:text-xs border rounded-full capitalize shrink-0 ${
              dbStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : dbStatus === 'connecting'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : dbStatus === 'connecting' ? 'bg-amber-500' : 'bg-destructive'
            }`} />
            <span className="hidden sm:inline">Postgres</span> {dbStatus}
          </Badge>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">
          {activeTab === 'dashboard' && (
            <>
              <KPICards kpis={kpis} />
              <DashboardCharts chartData={chartData} theme={theme} />
            </>
          )}

          {activeTab === 'chat' && (
            <AgentChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              loading={chatLoading}
              theme={theme}
            />
          )}

          {activeTab === 'sql' && <SQLConsole />}

          {activeTab === 'report' && <ReportGenerator />}
        </div>
      </main>
    </div>
  );
}
