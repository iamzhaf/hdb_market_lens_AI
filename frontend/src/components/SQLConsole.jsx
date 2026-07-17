import React, { useState } from 'react';
import { Database, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_URL } from '../config';

export default function SQLConsole() {
  const [sql, setSql] = useState('SELECT month, town, flat_type, resale_price, floor_area_sqm \nFROM hdb.hdb_resale_prices \nWHERE town = \'TAMPINES\' \nORDER BY month DESC \nLIMIT 50;');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const templates = [
    {
      name: 'Sample Tampines Transactions',
      sql: 'SELECT month, town, flat_type, resale_price, floor_area_sqm \nFROM hdb.hdb_resale_prices \nWHERE town = \'TAMPINES\' \nORDER BY month DESC \nLIMIT 50;'
    },
    {
      name: 'Avg Price by Town (2025)',
      sql: 'SELECT town, ROUND(AVG(resale_price)) as avg_price, COUNT(*) as transactions \nFROM hdb.hdb_resale_prices \nWHERE EXTRACT(YEAR FROM month) = 2025 \nGROUP BY town \nORDER BY avg_price DESC;'
    },
    {
      name: 'Price per SQM by Flat Type',
      sql: 'SELECT flat_type, ROUND(AVG(resale_price / floor_area_sqm)) as avg_price_per_sqm \nFROM hdb.hdb_resale_prices \nGROUP BY flat_type \nORDER BY avg_price_per_sqm DESC;'
    }
  ];

  const handleRun = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to execute query');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to database server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-auto md:h-[calc(100vh-170px)] md:overflow-hidden">
      <Card className="bg-card/60 border-border backdrop-blur-md flex flex-col gap-4 p-4 md:p-5 shrink-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2 border-b border-border pb-2 text-foreground">
          <Database size={16} className="text-muted-foreground" />
          <span>PostgreSQL Query Sandbox</span>
        </CardTitle>
        
        <div className="flex gap-2 flex-wrap">
          {templates.map((tpl, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-3 py-1 bg-secondary/30 hover:bg-secondary/60 border-border"
              onClick={() => setSql(tpl.sql)}
            >
              {tpl.name}
            </Button>
          ))}
        </div>

        <textarea
          className="w-full h-32 font-mono bg-[#070a13] text-blue-400 border border-border/60 rounded-lg p-4 text-xs outline-none focus:border-primary transition-colors resize-none"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter a SELECT SQL query here..."
        />

        <div className="flex justify-between items-center mt-1 flex-wrap gap-2">
          <span className="text-[11px] text-muted-foreground max-w-full sm:max-w-[70%]">
            Note: Only SELECT queries against hdb.hdb_resale_prices are allowed.
          </span>
          <Button
            className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm hover:shadow transition-all font-semibold gap-2 h-9 px-4 cursor-pointer ml-auto"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? <div className="spinner h-4 w-4" /> : <Play size={14} />}
            <span>Execute SQL</span>
          </Button>
        </div>
      </Card>

      <Card className="bg-card/60 border-border backdrop-blur-md flex-1 flex flex-col md:overflow-hidden p-4 md:p-5 min-h-[300px] md:min-h-0">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <span className="text-sm font-bold text-foreground">Query Output</span>
          {results && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
              <CheckCircle size={14} />
              <span>{results.rows.length} rows returned</span>
            </div>
          )}
        </div>

        <div className="flex-1 md:overflow-auto w-full flex flex-col justify-center items-center">
          {error && (
            <div className="w-full max-w-2xl flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm self-start my-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1">Database Query Error</strong>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="spinner border-t-indigo-500 h-8 w-8" />
              <p className="text-sm text-muted-foreground">Running query against 1,000,000+ records...</p>
            </div>
          )}

          {!results && !error && !loading && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Database size={36} className="opacity-60" />
              <p className="text-sm">Execute a SQL SELECT statement above to view results.</p>
            </div>
          )}

          {results && results.rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Database size={36} className="opacity-60" />
              <p className="text-sm">Query executed successfully, but returned 0 rows.</p>
            </div>
          )}

          {results && results.rows.length > 0 && (
            <div className="w-full h-full overflow-auto border border-border rounded-lg bg-card/20">
              <Table className="text-xs">
                <TableHeader className="bg-secondary/40 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    {results.columns.map((col, i) => (
                      <TableHead key={i} className="font-semibold text-muted-foreground">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.rows.map((row, rIdx) => (
                    <TableRow key={rIdx} className="hover:bg-secondary/15 border-b border-border/50">
                      {results.columns.map((col, cIdx) => (
                        <TableCell key={cIdx} className="text-foreground whitespace-nowrap">
                          {row[col] !== null ? String(row[col]) : 'NULL'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
