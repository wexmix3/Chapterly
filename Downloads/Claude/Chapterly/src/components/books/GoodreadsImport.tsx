'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseGoodreadsCSV, convertGoodreadsRow } from '@/lib/import';

interface ImportResult {
  imported: number;
  already_on_shelf: number;
  errors: number;
}

export default function GoodreadsImport({ onComplete }: { onComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) return;
    setFile(f);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(0);

    const text = await file.text();
    const rows = parseGoodreadsCSV(text);
    const totals: ImportResult = { imported: 0, already_on_shelf: 0, errors: 0 };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { searchResult, status, rating, review } = convertGoodreadsRow(row);
        const res = await fetch('/api/user-books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchResult, status, rating, review_text: review }),
        });

        if (res.ok) totals.imported++;
        else if (res.status === 409) totals.already_on_shelf++;
        else totals.errors++;
      } catch {
        totals.errors++;
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));

      // Rate limit: pause 100ms every 5 books
      if ((i + 1) % 5 === 0) await new Promise((r) => setTimeout(r, 100));
    }

    setResult(totals);
    setImporting(false);
    if (onComplete) onComplete();
  };

  return (
    <div className="space-y-4">
      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-brand-400 bg-brand-50'
            : file
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-ink-200 hover:border-brand-300 hover:bg-paper-50'
        }`}>
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-500" />
            <p className="font-medium text-emerald-700 text-sm">{file.name}</p>
            <p className="text-xs text-emerald-500">Ready to import</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-ink-300" />
            <p className="font-medium text-ink-600 text-sm">Drop your Goodreads CSV here</p>
            <p className="text-xs text-ink-400">or click to browse</p>
          </div>
        )}
      </div>

      {/* How to export collapsible */}
      <div className="border border-ink-100 rounded-xl overflow-hidden">
        <button onClick={() => setHowOpen(!howOpen)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
          <span>How do I export from Goodreads?</span>
          {howOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {howOpen && (
          <div className="px-4 pb-4 text-xs text-ink-500 space-y-1 border-t border-ink-100 pt-3">
            <p>1. Go to <strong>goodreads.com</strong> → My Books</p>
            <p>2. Click <strong>Import and export</strong> in the left sidebar</p>
            <p>3. Click <strong>Export Library</strong> → wait for the email</p>
            <p>4. Download the CSV and drag it here</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {importing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Importing…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full progress-fill transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <p className="font-medium text-emerald-800">Import complete!</p>
            <p className="text-emerald-600">{result.imported} imported · {result.already_on_shelf} already on shelf · {result.errors} errors</p>
          </div>
        </div>
      )}

      {/* Import button */}
      {file && !importing && !result && (
        <button onClick={handleImport}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-medium transition-colors">
          Import Library
        </button>
      )}
    </div>
  );
}
