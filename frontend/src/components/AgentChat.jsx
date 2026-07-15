import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Cpu, Send, Sparkles, Terminal, Trash2, BarChart2, Table as TableIcon, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Sub-component to manage tab state for each tool execution trace individually
function ToolExecutionTrace({ call, resp, theme }) {
  const isDark = theme === 'dark';
  const sql = call ? call.args.sql : '';
  const rawData = resp ? resp.response : null;
  
  let data = null;
  if (Array.isArray(rawData)) {
    data = rawData;
  } else if (rawData && typeof rawData === 'object') {
    const arrayKey = Object.keys(rawData).find(k => Array.isArray(rawData[k]));
    if (arrayKey) {
      data = rawData[arrayKey];
    }
  }

  // Check if response data is an array of records and can be charted
  const isQueryResponse = Array.isArray(data) && data.length > 1;
  let labelKey = null;
  let valueKeys = [];

  if (isQueryResponse) {
    const keys = Object.keys(data[0] || {});
    keys.forEach(k => {
      const val = data[0][k];
      if (typeof val === 'number') {
        valueKeys.push(k);
      } else if (typeof val === 'string' || val === null) {
        if (!labelKey) labelKey = k;
      }
    });

    if (!labelKey && keys.length > 1) {
      labelKey = keys.find(k => !valueKeys.includes(k));
    }
    if (!labelKey) labelKey = keys[0];
  }

  const isChartable = isQueryResponse && valueKeys.length > 0;
  
  // Default to chart view if chartable, otherwise default to SQL
  const [activeTab, setActiveTab] = useState(isChartable ? 'chart' : 'sql');

  // Handle case where properties change
  useEffect(() => {
    setActiveTab(isChartable ? 'chart' : 'sql');
  }, [isChartable]);

  const getChartOption = () => {
    if (!isChartable) return null;
    const textColor = isDark ? '#9ca3af' : '#475569';
    const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(148, 163, 184, 0.2)';
    const colors = ['#6366f1', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

    const isTime = labelKey.toLowerCase().includes('month') ||
                   labelKey.toLowerCase().includes('year') ||
                   labelKey.toLowerCase().includes('date');

    const xAxisData = data.map(d => d[labelKey]);
    const series = valueKeys.map((vk) => ({
      name: vk.replace(/_/g, ' ').toUpperCase(),
      type: isTime ? 'line' : 'bar',
      data: data.map(d => d[vk]),
      smooth: true,
      itemStyle: {
        borderRadius: isTime ? 0 : [4, 4, 0, 0]
      }
    }));

    return {
      backgroundColor: 'transparent',
      color: colors,
      tooltip: {
        trigger: 'axis',
        textStyle: { fontFamily: 'Outfit' }
      },
      legend: {
        data: valueKeys.map(vk => vk.replace(/_/g, ' ').toUpperCase()),
        textStyle: { color: textColor, fontFamily: 'Outfit', fontSize: 10 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          color: textColor,
          fontFamily: 'Outfit',
          fontSize: 9,
          rotate: data.length > 8 ? 30 : 0
        },
        axisLine: { lineStyle: { color: gridColor } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textColor, fontFamily: 'Outfit', fontSize: 9 },
        splitLine: { lineStyle: { color: gridColor } }
      },
      series: series
    };
  };

  return (
    <div className="mt-3 bg-secondary/20 border border-border rounded-lg p-3 flex flex-col gap-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
            <Terminal size={14} />
            <span>Query Execution Trace</span>
          </div>
          <TabsList className="bg-secondary/40 p-1 h-7">
            {isChartable && (
              <TabsTrigger value="chart" className="text-[10px] px-2 py-0.5 flex items-center gap-1 cursor-pointer">
                <BarChart2 size={10} />
                <span>Chart</span>
              </TabsTrigger>
            )}
            {isQueryResponse && (
              <TabsTrigger value="table" className="text-[10px] px-2 py-0.5 flex items-center gap-1 cursor-pointer">
                <TableIcon size={10} />
                <span>Table</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="sql" className="text-[10px] px-2 py-0.5 flex items-center gap-1 cursor-pointer">
              <Code size={10} />
              <span>SQL</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chart" className="mt-0">
          {isChartable && (
            <div className="h-60 w-full py-1">
              <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          {isQueryResponse && (
            <div className="max-h-[180px] overflow-auto border border-border rounded-md bg-card/40">
              <Table className="text-[11px]">
                <TableHeader className="bg-secondary/30 sticky top-0">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    {Object.keys(data[0] || {}).map((col, idx) => (
                      <TableHead key={idx} className="h-7 px-2 py-1 font-semibold text-muted-foreground">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, rIdx) => (
                    <TableRow key={rIdx} className="hover:bg-secondary/20 border-b border-border/50">
                      {Object.keys(data[0] || {}).map((col, cIdx) => (
                        <TableCell key={cIdx} className="px-2 py-1 h-7 text-foreground">
                          {row[col] !== null ? String(row[col]) : 'NULL'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 10 && (
                <div className="text-[10px] text-muted-foreground text-center py-1.5 border-t border-border bg-secondary/10">
                  Showing top 10 of {data.length} records.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sql" className="mt-0">
          <pre className="m-0 p-2.5 bg-[#070a13] rounded-md overflow-x-auto border border-border/30">
            <code className="text-xs font-mono text-blue-400">{sql}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AgentChat({ messages, onSendMessage, onClearChat, loading, theme }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    "What is the average resale price in Tampines for 4-Room flats in 2025?",
    "Show the average resale price by flat type in Bedok.",
    "Which town has the highest average floor area size?",
    "Generate a slide deck report comparing Tampines and Pasir Ris markets."
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const groupToolSteps = (steps) => {
    if (!steps) return [];
    const stepsCopy = JSON.parse(JSON.stringify(steps));
    const groups = [];

    while (stepsCopy.length > 0) {
      const step = stepsCopy.shift();
      if (step.type === 'tool_call' && step.name === 'query_postgres') {
        const respIdx = stepsCopy.findIndex(s => s.type === 'tool_response' && s.name === 'query_postgres');
        let responseStep = null;
        if (respIdx !== -1) {
          responseStep = stepsCopy.splice(respIdx, 1)[0];
        }
        groups.push({
          type: 'query',
          call: step,
          response: responseStep
        });
      } else if (step.type === 'tool_call' && step.name === 'generate_powerpoint_report') {
        groups.push({
          type: 'report',
          call: step
        });
      } else {
        groups.push({
          type: 'other',
          raw: step
        });
      }
    }
    return groups;
  };

  const renderMessageContent = (text) => {
    if (!text) return null;

    const parts = text.split('```');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const lines = part.split('\n');
        const code = lines.slice(1).join('\n').trim();
        return (
          <pre key={index} className="bg-[#070a13] border border-border/30 rounded-lg p-3 my-2 overflow-x-auto">
            <code className="font-mono text-xs text-blue-300">{code}</code>
          </pre>
        );
      } else {
        const paragraphs = part.split('\n');
        return paragraphs.map((para, paraIdx) => {
          if (!para.trim()) return null;

          const boldParts = para.split('**');
          const inlineRender = boldParts.map((bp, bpIdx) => {
            if (bpIdx % 2 === 1) {
              return <strong key={bpIdx} className="font-bold text-foreground">{bp}</strong>;
            }
            return bp;
          });

          if (para.trim().startsWith('- ')) {
            return (
              <ul key={`${paraIdx}`} className="pl-5 my-1 list-disc">
                <li className="text-sm">{inlineRender.slice(1)}</li>
              </ul>
            );
          }

          if (para.trim().startsWith('### ')) {
            return <h4 key={paraIdx} className="text-sm font-semibold mt-4 mb-2 text-indigo-500">{para.replace('### ', '')}</h4>;
          }
          if (para.trim().startsWith('## ')) {
            return <h3 key={paraIdx} className="text-base font-bold mt-5 mb-2 text-indigo-500">{para.replace('## ', '')}</h3>;
          }

          return <p key={paraIdx} className="mb-2 text-sm leading-relaxed">{inlineRender}</p>;
        });
      }
    });
  };

  return (
    <Card className="flex-1 flex flex-col bg-card/60 border-border backdrop-blur-md overflow-hidden rounded-xl shadow-lg h-[calc(100vh-170px)]">
      <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Sparkles size={16} />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">HDB Market Insights Assistant</CardTitle>
            <div className="text-xs text-muted-foreground mt-0.5">Powered by HDB_Insights_Agent</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-2 bg-secondary/30 hover:bg-secondary border-border" onClick={onClearChat}>
          <Trash2 size={14} className="text-muted-foreground" />
          <span>Clear Chat</span>
        </Button>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <Cpu size={40} className="text-indigo-500 mb-4 opacity-80" />
            <h3 className="text-base font-bold text-foreground mb-1">Ask the Market Analytics Agent</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Ask questions in plain English. The agent will formulate PostgreSQL queries, extract insights, and format tables or request PowerPoint reports.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-lg text-left">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase px-2">Suggested Queries</div>
              {samplePrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left font-medium px-4 py-3 bg-secondary/20 hover:bg-secondary/40 hover:border-indigo-500/50 border-border h-auto text-sm transition-all"
                  onClick={() => onSendMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] gap-1.5 ${msg.author === 'user' ? 'self-end' : 'self-start'}`}>
              <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.author === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none shadow-md'
                  : 'bg-secondary/30 border border-border text-foreground rounded-bl-none'
              }`}>
                {renderMessageContent(msg.text)}

                {/* Steps and dynamic tool execution trace charts */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="mt-3 bg-secondary/10 border border-dashed border-indigo-500/30 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-400 border-b border-border pb-1.5 mb-1 text-xs">
                      <Terminal size={14} />
                      <span>SQL Tool Execution Trace</span>
                    </div>
                    {groupToolSteps(msg.steps).map((group, idx) => {
                      if (group.type === 'query') {
                        return (
                          <ToolExecutionTrace
                            key={idx}
                            call={group.call}
                            resp={group.response}
                            theme={theme}
                          />
                        );
                      }
                      if (group.type === 'report') {
                        return (
                          <div key={idx} className="text-xs text-purple-400 mt-2 font-medium pl-1">
                            Generating Slide Deck Report: {group.call.args.filename}
                          </div>
                        );
                      }
                      if (group.type === 'other') {
                        return (
                          <div key={idx} className="text-[10px] text-muted-foreground mt-1 pl-1">
                            Execution Step: {group.raw.name || 'API Call'}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
              <div className={`flex gap-2 text-[10px] text-muted-foreground px-1 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span>{msg.author === 'user' ? 'You' : 'HDB Agent'}</span>
                <span>•</span>
                <span>{msg.time}</span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex flex-col max-w-[85%] gap-1.5 self-start">
            <div className="p-4 rounded-xl text-sm bg-secondary/30 border border-border text-foreground rounded-bl-none flex items-center gap-3">
              <div className="spinner border-t-indigo-500"></div>
              <span className="text-sm text-muted-foreground">Agent is analyzing database insights...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="p-4 px-6 border-t border-border bg-secondary/10 flex gap-3" onSubmit={handleSubmit}>
        <Input
          type="text"
          className="flex-1 bg-secondary/30 border-border text-foreground focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-lg h-11"
          placeholder="Ask a question about HDB prices (e.g. 'Compare resale price of Bukit Merah vs Queenstown')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 hover:shadow-lg transition-all font-semibold gap-2 h-11 px-5" disabled={loading || !input.trim()}>
          <Send size={14} />
          <span>Send</span>
        </Button>
      </form>
    </Card>
  );
}
