import { useRef, useState } from 'react';
import { DataIcon, DownloadIcon, UploadIcon } from '../ui/Icons';

export default function DataPage({ counts, onExport, onImport, onClearAll }) {
  const [importState, setImportState] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setImportState({ step: 'preview', text, fileName: file.name, size: file.size });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const doImport = async () => {
    setImportState(s => ({ ...s, step: 'importing' }));
    try {
      await onImport(importState.text);
      setImportState({ step: 'done' });
    } catch (err) {
      setImportState(s => ({ ...s, step: 'preview', error: err.message }));
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal/10 flex items-center justify-center text-charcoal"><DataIcon /></div>
          <div><h1 className="font-semibold text-xl">Data</h1><p className="text-sm text-warm-gray">Import, export & backup</p></div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Current Data Summary */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-lg mb-1">Current Data</h3>
          <p className="text-sm text-warm-gray mb-4">Connected to Supabase</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: 'Ingredients', c: counts.ingredients, cl: 'text-terracotta' },
              { n: 'Preparations', c: counts.intermediates, cl: 'text-purple' },
              { n: 'Dishes', c: counts.dishes, cl: 'text-sage' },
            ].map(x => (
              <div key={x.n} className="text-center p-3 bg-cream rounded-xl">
                <div className={`text-2xl font-bold ${x.cl}`}>{x.c}</div>
                <div className="text-xs text-warm-gray mt-1">{x.n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-lg mb-1">Export</h3>
          <p className="text-sm text-warm-gray mb-4">Download a full backup as JSON</p>
          <button onClick={onExport} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sage text-white font-medium hover:bg-sage/90">
            <DownloadIcon />Export Data
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-lg mb-1">Import</h3>
          <p className="text-sm text-warm-gray mb-4">Load data from a JSON backup</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          {(!importState || importState.step === 'done') ? (
            <button onClick={() => { setImportState(null); fileRef.current?.click(); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta/90">
              <UploadIcon />Choose JSON File
            </button>
          ) : importState.step === 'preview' ? (
            <div className="space-y-4">
              <div className="bg-cream rounded-xl p-4">
                <p className="text-sm font-medium">{importState.fileName}</p>
                <p className="text-xs text-warm-gray">{(importState.size / 1024).toFixed(1)} KB</p>
              </div>
              {importState.error && <p className="text-sm text-tomato">{importState.error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setImportState(null)} className="flex-1 py-2 rounded-lg border">Cancel</button>
                <button onClick={doImport} className="flex-1 py-2 rounded-lg bg-tomato text-white font-medium">Import</button>
              </div>
            </div>
          ) : importState.step === 'importing' ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-warm-gray mt-2">Importing...</p>
            </div>
          ) : importState.step === 'done' ? (
            <div className="bg-sage/10 rounded-xl p-4 text-center">
              <p className="text-sage font-medium">✓ Import complete</p>
            </div>
          ) : null}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-tomato/30 p-5">
          <h3 className="font-semibold text-lg mb-1 text-tomato">Danger Zone</h3>
          <p className="text-sm text-warm-gray mb-4">Clear all local state and reload from database</p>
          <button onClick={onClearAll} className="w-full py-3 rounded-xl border-2 border-tomato text-tomato font-medium hover:bg-tomato/10">
            Reload All Data
          </button>
        </div>
      </main>
    </div>
  );
}
