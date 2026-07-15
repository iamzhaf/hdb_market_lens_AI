import React, { useState } from 'react';
import { Download, FileText, Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from '../config';

export default function ReportGenerator() {
  const [filename, setFilename] = useState('HDB_Resale_Insights_Report.pptx');
  const [slides, setSlides] = useState([
    {
      type: 'title',
      title: 'HDB Resale Flat Market Report',
      subtitle: 'Data-driven analysis of HDB Resale Prices'
    },
    {
      type: 'content',
      title: 'Tampines Market Highlights',
      bullets: [
        'Tampines average resale prices grew by 1.8% over the last quarter.',
        '4-Room flats remain the most popular model in the estate.',
        'Average price for 4-Room flats in 2025 stood at approximately S$685,290.'
      ]
    }
  ]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [title, setTitle] = useState(slides[0]?.title || '');
  const [subtitle, setSubtitle] = useState(slides[0]?.subtitle || '');
  const [bullets, setBullets] = useState(slides[1]?.bullets?.join('\n') || '');
  const [slideType, setSlideType] = useState('title');
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);

  const handleSelectSlide = (idx) => {
    setActiveSlide(idx);
    const s = slides[idx];
    setSlideType(s.type);
    setTitle(s.title || '');
    if (s.type === 'title') {
      setSubtitle(s.subtitle || '');
      setBullets('');
    } else {
      setSubtitle('');
      setBullets(s.bullets?.join('\n') || '');
    }
  };

  const handleUpdateSlide = () => {
    const updated = [...slides];
    const s = { type: slideType, title };
    if (slideType === 'title') {
      s.subtitle = subtitle;
    } else {
      s.bullets = bullets.split('\n').filter(b => b.trim() !== '');
    }
    updated[activeSlide] = s;
    setSlides(updated);
  };

  const handleAddSlide = () => {
    const newSlide = {
      type: 'content',
      title: 'New Slide Title',
      bullets: ['Bullet point 1']
    };
    setSlides([...slides, newSlide]);
    setActiveSlide(slides.length);
    setSlideType('content');
    setTitle('New Slide Title');
    setSubtitle('');
    setBullets('Bullet point 1');
  };

  const handleDeleteSlide = (idx) => {
    if (slides.length <= 1) return;
    const filtered = slides.filter((_, i) => i !== idx);
    setSlides(filtered);
    const nextActive = Math.max(0, idx - 1);
    setActiveSlide(nextActive);
    handleSelectSlide(nextActive);
  };

  const moveSlide = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === slides.length - 1) return;
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...slides];
    const temp = updated[idx];
    updated[idx] = updated[nextIdx];
    updated[nextIdx] = temp;
    setSlides(updated);
    setActiveSlide(nextIdx);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setReportUrl(null);
    try {
      const response = await fetch(`${API_URL}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, filename })
      });
      const data = await response.json();
      if (response.ok) {
        setReportUrl(`${API_URL}/api/reports/${filename}`);
      } else {
        alert(data.error || 'Failed to generate report');
      }
    } catch (err) {
      alert('Error connecting to presentation server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex-1 flex flex-col bg-card/60 border-border backdrop-blur-md overflow-hidden rounded-xl shadow-lg p-5 min-h-[calc(100vh-170px)]">
      <CardHeader className="border-b border-border pb-3 mb-4 p-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <FileText size={16} className="text-muted-foreground" />
          <span>Executive Slide Deck Report Generator</span>
        </CardTitle>
      </CardHeader>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden pb-4">
        {/* Left Panel: Slide List & Form Editor */}
        <div className="flex flex-col gap-5 overflow-y-auto pr-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Report Filename</label>
            <Input
              type="text"
              className="bg-secondary/30 border-border text-foreground h-9"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. report.pptx"
            />
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-border pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slides Outline ({slides.length})</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-secondary/30 hover:bg-secondary border-border text-xs cursor-pointer"
              onClick={handleAddSlide}
            >
              <Plus size={14} />
              <span>Add Slide</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {slides.map((slide, i) => {
              const isActive = activeSlide === i;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all border cursor-pointer select-none ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.2)]'
                      : 'text-muted-foreground bg-secondary/15 hover:bg-secondary/30 border-border/40 hover:text-foreground'
                  }`}
                  onClick={() => handleSelectSlide(i)}
                >
                  <div className="flex gap-2.5 items-center overflow-hidden mr-4">
                    <span className="text-[10px] font-bold opacity-60">#{i + 1}</span>
                    <span className="font-medium truncate">{slide.title || '(Untitled Slide)'}</span>
                  </div>
                  <div className="flex gap-1 items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 rounded hover:bg-black/10 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                      onClick={() => moveSlide(i, 'up')}
                      disabled={i === 0}
                    >
                      <ArrowUp size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 rounded hover:bg-black/10 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                      onClick={() => moveSlide(i, 'down')}
                      disabled={i === slides.length - 1}
                    >
                      <ArrowDown size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 rounded hover:bg-black/10 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                      onClick={() => handleDeleteSlide(i)}
                      disabled={slides.length <= 1}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 p-4 bg-secondary/10 border border-border/50 rounded-xl mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Slide Layout Type</label>
              <select
                className="w-full bg-[#0b0f19] border border-border text-foreground rounded-lg h-9 px-3 text-xs outline-none focus:border-indigo-500 transition-colors"
                value={slideType}
                onChange={(e) => {
                  setSlideType(e.target.value);
                  handleUpdateSlide();
                }}
              >
                <option value="title">Title Slide</option>
                <option value="content">Content (Bullet Points)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Slide Title</label>
              <Input
                type="text"
                className="bg-[#0b0f19] border-border text-foreground h-9 text-xs"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  const updated = [...slides];
                  updated[activeSlide].title = e.target.value;
                  setSlides(updated);
                }}
                placeholder="Enter slide heading"
              />
            </div>

            {slideType === 'title' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Slide Subtitle</label>
                <Input
                  type="text"
                  className="bg-[#0b0f19] border-border text-foreground h-9 text-xs"
                  value={subtitle}
                  onChange={(e) => {
                    setSubtitle(e.target.value);
                    const updated = [...slides];
                    updated[activeSlide].subtitle = e.target.value;
                    setSlides(updated);
                  }}
                  placeholder="Enter slide subheading"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bullet Points (One per line)</label>
                <textarea
                  className="w-full h-24 bg-[#0b0f19] border border-border text-foreground rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors resize-y font-sans"
                  value={bullets}
                  onChange={(e) => {
                    setBullets(e.target.value);
                    const updated = [...slides];
                    updated[activeSlide].bullets = e.target.value.split('\n').filter(b => b.trim() !== '');
                    setSlides(updated);
                  }}
                  placeholder="Bullet point 1&#10;Bullet point 2&#10;Bullet point 3"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 hover:shadow-lg transition-all font-semibold gap-2 h-10 cursor-pointer"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <div className="spinner h-4 w-4" /> : <Sparkles size={15} />}
              <span>Compile PPTX</span>
            </Button>
            {reportUrl && (
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 h-10 shadow-md cursor-pointer"
              >
                <a href={reportUrl} download>
                  <Download size={15} />
                  <span>Download Report</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel: Widescreen Slide Preview Mockup */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slide Preview (16:9 Mockup)</span>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
            {slides[activeSlide] && (
              <div className={`w-full aspect-[16/9] relative flex flex-col justify-start p-6 rounded-xl border border-border/80 shadow-2xl overflow-hidden ${
                slides[activeSlide].type === 'title'
                  ? 'justify-center items-center text-center bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] text-white'
                  : 'bg-[#0f172a] text-white border-l-4 border-l-indigo-500'
              }`}>
                <div className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  {slides[activeSlide].type === 'title' ? 'Title Slide' : 'Content Slide'}
                </div>
                
                <h2 className={`font-bold tracking-tight text-white ${
                  slides[activeSlide].type === 'title' ? 'text-xl md:text-2xl mb-2' : 'text-base md:text-lg border-b border-white/10 pb-2 mb-3'
                }`}>
                  {slides[activeSlide].title || 'Untitled Slide'}
                </h2>
                
                {slides[activeSlide].type === 'title' ? (
                  <p className="text-xs md:text-sm text-indigo-200/90 max-w-md leading-relaxed">{slides[activeSlide].subtitle || ''}</p>
                ) : (
                  <div className="flex flex-col gap-2 text-xs md:text-sm text-slate-300/90 leading-relaxed font-sans text-left">
                    {slides[activeSlide].bullets?.map((bullet, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
