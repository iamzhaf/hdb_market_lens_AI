import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Cpu, Send, Sparkles, Terminal, Trash2, BarChart2, Table as TableIcon, Code, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_URL } from '../config';

// Helper to parse markdown tables from message text
function parseMarkdownTablesAndText(text) {
  if (!text) return [];
  
  const lines = text.split('\n');
  const blocks = [];
  let currentTable = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // A table row must start with | and end with |
    const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;

    if (isTableLine) {
      const isSeparator = trimmed.includes('---') || trimmed.includes('-:-') || trimmed.includes(':---');
      
      if (currentTable) {
        if (isSeparator) {
          continue;
        }
        // Extract cell values
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        currentTable.rows.push(cells);
      } else {
        // Look ahead to check if the next line is a separator line
        const nextLine = lines[i + 1];
        const nextTrimmed = nextLine ? nextLine.trim() : '';
        const nextIsSeparator = nextTrimmed.startsWith('|') && (nextTrimmed.includes('---') || nextTrimmed.includes('-:-') || nextTrimmed.includes(':---'));
        
        if (nextIsSeparator) {
          const headers = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          currentTable = {
            headers: headers,
            rows: []
          };
        } else {
          blocks.push({ type: 'text', content: line });
        }
      }
    } else {
      if (currentTable) {
        blocks.push({ type: 'table', content: currentTable });
        currentTable = null;
      }
      blocks.push({ type: 'text', content: line });
    }
  }

  if (currentTable) {
    blocks.push({ type: 'table', content: currentTable });
  }

  // Combine consecutive text blocks to maintain paragraphs
  const optimizedBlocks = [];
  let currentTextGroup = [];

  blocks.forEach(block => {
    if (block.type === 'text') {
      currentTextGroup.push(block.content);
    } else {
      if (currentTextGroup.length > 0) {
        optimizedBlocks.push({ type: 'text', content: currentTextGroup.join('\n') });
        currentTextGroup = [];
      }
      optimizedBlocks.push(block);
    }
  });

  if (currentTextGroup.length > 0) {
    optimizedBlocks.push({ type: 'text', content: currentTextGroup.join('\n') });
  }

  return optimizedBlocks;
}

// Helper to format table cells with appropriate units
function formatTableCell(headerName, value) {
  if (value === null || value === undefined) return '';
  const strVal = String(value).trim();
  const lowerHeader = headerName.toLowerCase();
  
  // If the cell value is already formatted or contains letters, return as is
  if (/[S$]/i.test(strVal) || /sqm/i.test(strVal) || isNaN(Number(strVal.replace(/[^0-9.-]/g, '')))) {
    return strVal;
  }
  
  const num = Number(strVal.replace(/[^0-9.-]/g, ''));
  
  // Price / Amount formatting
  if (lowerHeader.includes('price') || lowerHeader.includes('amount') || lowerHeader.includes('volume') || lowerHeader.includes('cost') || lowerHeader.includes('value')) {
    return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(num);
  }
  
  // Area / Sqm formatting
  if (lowerHeader.includes('area') || lowerHeader.includes('sqm') || lowerHeader.includes('size')) {
    return `${new Intl.NumberFormat('en-SG').format(num)} sqm`;
  }
  
  // Default numeric formatting
  return new Intl.NumberFormat('en-SG').format(num);
}

// Component to render parsed markdown tables interactively
function InteractiveMarkdownTable({ tableData, theme }) {
  const isDark = theme === 'dark';
  const headers = tableData.headers;
  const rows = tableData.rows;

  // Convert array-of-arrays representation to array of objects to identify label/numeric fields
  const data = rows.map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      const valStr = row[idx] || '';
      // Try to parse clean float number for charting: remove $, %, sqm, commas
      const cleanVal = valStr.replace(/[$,]/g, '').replace(/sqm/i, '').replace(/%/g, '').trim();
      const num = Number(cleanVal);
      obj[header] = !isNaN(num) && cleanVal !== '' ? num : valStr;
    });
    return obj;
  });

  const isQueryResponse = data.length > 0;
  let labelKey = null;
  let valueKeys = [];

  if (isQueryResponse) {
    headers.forEach(h => {
      const val = data[0][h];
      if (typeof val === 'number') {
        valueKeys.push(h);
      } else if (typeof val === 'string' || val === null) {
        if (!labelKey) labelKey = h;
      }
    });

    if (!labelKey && headers.length > 1) {
      labelKey = headers.find(h => !valueKeys.includes(h));
    }
    if (!labelKey) labelKey = headers[0];
  }

  const isChartable = isQueryResponse && valueKeys.length > 0;
  const [activeTab, setActiveTab] = useState(isChartable ? 'chart' : 'table');

  useEffect(() => {
    setActiveTab(isChartable ? 'chart' : 'table');
  }, [isChartable]);

  const getChartOption = () => {
    if (!isChartable) return null;
    const textColor = isDark ? '#9ca3af' : '#475569';
    const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(148, 163, 184, 0.2)';
    const colors = ['#0047AB', '#1e60c4', '#3b82f6', '#0077b6', '#10b981'];

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
    <div className="my-3 bg-secondary/10 border border-border rounded-lg p-3 flex flex-col gap-2 max-w-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <TableIcon size={14} />
            <span>Interactive Table View</span>
          </div>
          <TabsList className="bg-secondary/40 p-1 h-7">
            {isChartable && (
              <TabsTrigger value="chart" className="text-[10px] px-2 py-0.5 flex items-center gap-1 cursor-pointer">
                <BarChart2 size={10} />
                <span>Chart</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="table" className="text-[10px] px-2 py-0.5 flex items-center gap-1 cursor-pointer">
              <TableIcon size={10} />
              <span>Table</span>
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
          <div className="max-h-[250px] overflow-auto border border-border rounded-md bg-card/40">
            <Table className="text-[11px]">
              <TableHeader className="bg-secondary/30 sticky top-0">
                <TableRow className="hover:bg-transparent border-b border-border">
                  {headers.map((col, idx) => (
                    <TableHead key={idx} className="h-7 px-2 py-1 font-semibold text-muted-foreground">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rIdx) => (
                  <TableRow key={rIdx} className="hover:bg-secondary/20 border-b border-border/50">
                    {headers.map((col, cIdx) => (
                      <TableCell key={cIdx} className="px-2 py-1 h-7 text-foreground">
                        {formatTableCell(col, row[cIdx])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
    const colors = ['#0047AB', '#1e60c4', '#3b82f6', '#0077b6', '#10b981'];

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
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
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
    "Generate a slide deck report comparing Tampines and Bedok markets."
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

  const handleDownload = async (filename) => {
    try {
      const url = `${API_URL}/api/reports/${filename}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading report. Please try again.');
    }
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
        const blocks = parseMarkdownTablesAndText(part);
        return blocks.map((block, bIdx) => {
          if (block.type === 'table') {
            return (
              <InteractiveMarkdownTable
                key={bIdx}
                tableData={block.content}
                theme={theme}
              />
            );
          }

          const paragraphs = block.content.split('\n');
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
                <ul key={`${bIdx}-${paraIdx}`} className="pl-5 my-1 list-disc">
                  <li className="text-sm">{inlineRender.slice(1)}</li>
                </ul>
              );
            }

            if (para.trim().startsWith('### ')) {
              return <h4 key={`${bIdx}-${paraIdx}`} className="text-sm font-semibold mt-4 mb-2 text-primary">{para.replace('### ', '')}</h4>;
            }
            if (para.trim().startsWith('## ')) {
              return <h3 key={`${bIdx}-${paraIdx}`} className="text-base font-bold mt-5 mb-2 text-primary">{para.replace('## ', '')}</h3>;
            }

            return <p key={`${bIdx}-${paraIdx}`} className="mb-2 text-sm leading-relaxed">{inlineRender}</p>;
          });
        });
      }
    });
  };

  return (
    <Card className="flex-1 flex flex-col bg-card/60 border-border backdrop-blur-md overflow-hidden rounded-xl shadow-lg h-[calc(100vh-140px)] md:h-[calc(100vh-170px)]">
      <CardHeader className="border-b border-border py-3 md:py-4 px-4 md:px-6 flex flex-row items-center justify-between space-y-0 text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-primary flex items-center justify-center text-white shadow-md">
            <Sparkles size={16} />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">HDB Market Insights Assistant</CardTitle>
            <div className="text-xs text-muted-foreground mt-0.5">Powered by HDB_Insights_Agent</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-2 bg-secondary/30 hover:bg-secondary border-border cursor-pointer" onClick={onClearChat}>
          <Trash2 size={14} className="text-muted-foreground" />
          <span>Clear Chat</span>
        </Button>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 max-w-2xl mx-auto w-full">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-primary to-blue-400 bg-clip-text text-transparent mb-3">
              Hello! I'm HDB Market Lens AI
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mb-8">
              I can help you analyze resale trends, run SQL queries, or compile PowerPoint reports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[100px] outline-none"
                >
                  <span className="text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors leading-relaxed">
                    {prompt}
                  </span>
                  <span className="self-end text-xs text-muted-foreground bg-secondary/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Send size={12} className="text-primary" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            {messages.map((msg, i) => {
              const isUser = msg.author === 'user';
              if (isUser) {
                return (
                  <div key={i} className="flex flex-col max-w-[85%] self-end gap-1 text-left">
                    <div className="px-5 py-3 rounded-2xl text-sm bg-secondary/80 border border-border/40 text-foreground shadow-sm">
                      {renderMessageContent(msg.text)}
                    </div>
                    <div className="text-[10px] text-muted-foreground px-1 self-end">
                      {msg.time}
                    </div>
                  </div>
                );
              }

              // Assistant message layout (Gemini avatar + text style)
              return (
                <div key={i} className="flex gap-4 items-start w-full mt-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-primary flex items-center justify-center text-white shrink-0 shadow-md">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span>HDB Analyst Agent</span>
                      <span>•</span>
                      <span className="font-normal text-[10px]">{msg.time}</span>
                    </div>
                    
                    <div className="text-sm leading-relaxed text-foreground/90 pr-2">
                      {renderMessageContent(msg.text)}
                    </div>

                    {/* Steps and dynamic tool execution trace charts */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="mt-3 bg-secondary/10 border border-dashed border-primary/20 rounded-lg p-3 flex flex-col gap-2 max-w-full overflow-hidden">
                        <div className="flex items-center gap-1.5 font-semibold text-primary border-b border-border pb-1.5 mb-1 text-xs">
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
                            const filename = group.call.args.filename || 'business_insights_report.pptx';
                            const downloadUrl = `${API_URL}/api/reports/${filename}`;
                            return (
                              <div key={idx} className="mt-2 pl-1 flex flex-col gap-2">
                                <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
                                  <span>Generated Slide Deck:</span>
                                  <span className="font-mono text-muted-foreground text-[11px] truncate max-w-xs">{filename}</span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(filename)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 self-start h-8 px-3 text-xs shadow-sm cursor-pointer"
                                >
                                  <Download size={13} />
                                  <span>Download Report</span>
                                </Button>
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
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-4 items-start w-full mt-2 text-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-primary flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground">HDB Analyst Agent</div>
                  <div className="flex items-center gap-3 bg-secondary/20 border border-border/40 p-4 rounded-xl max-w-sm">
                    <div className="spinner border-t-primary animate-spin"></div>
                    <span className="text-xs text-muted-foreground">Agent is analyzing database insights...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background/30 backdrop-blur-md flex justify-center">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-3xl w-full">
          <Input
            type="text"
            className="w-full bg-secondary/40 border-border text-sm h-12 pr-24 pl-5 rounded-full focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
            placeholder="Ask about HDB prices, resale trends, or generate a slide deck..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <div className="absolute right-2.5 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-full cursor-pointer"
              onClick={onClearChat}
              title="Clear chat history"
            >
              <Trash2 size={14} />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 bg-primary hover:bg-primary/95 text-white rounded-full cursor-pointer shadow-sm"
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
