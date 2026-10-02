import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { parseMpesa } from "../api/parseMpesa";
import { api } from "../api/endpoints";

const STEPS = { idle: "idle", ocr: "ocr", done: "done", error: "error" };

export default function ScreenshotImport({ categoryOptions, onSaved }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);   // object URL
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(STEPS.idle);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [catId, setCatId] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef();
  const dropRef = useRef();

  const reset = () => {
    setPreview(null); setFile(null); setStep(STEPS.idle);
    setProgress(0); setRawText(""); setParsed(null);
    setCatId(""); setStatus(null);
  };

  const handleFile = f => {
    if (!f || !f.type.startsWith("image/")) {
      setStatus({ ok: false, msg: "Please upload an image file (PNG, JPG, etc.)." });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep(STEPS.idle);
    setParsed(null); setRawText(""); setStatus(null);
  };

  const runOcr = async () => {
    if (!file) return;
    setStep(STEPS.ocr); setProgress(0); setStatus(null);
    try {
      const worker = await createWorker("eng", 1, {
        logger: m => { if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100)); },
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setRawText(text);
      const result = parseMpesa(text);
      setParsed(result);
      setStep(STEPS.done);
      if (!result) setStatus({ ok: false, msg: "Text was extracted but no M-PESA transaction was detected. You can read the raw text below and enter details manually." });
    } catch (e) {
      setStep(STEPS.error);
      setStatus({ ok: false, msg: "OCR failed. Make sure the image is clear and try again." });
    }
  };

  const save = async () => {
    if (!parsed) return;
    if (!catId) { setStatus({ ok: false, msg: "Please select a category." }); return; }
    setSaving(true);
    try {
      // 1. Create the transaction
      const { data: tx } = await api.transactions.create({
        category: Number(catId),
        transaction_type: parsed.transaction_type,
        amount: parsed.amount,
        transaction_date: parsed.transaction_date,
        payment_method: "mpesa",
        description: parsed.description,
      });
      // 2. Upload the screenshot linked to the transaction
      if (file) await api.attachments.upload(file, tx.id);
      setStatus({ ok: true, msg: "Transaction saved and screenshot stored!" });
      onSaved();
      setTimeout(reset, 1500);
    } catch (x) {
      const d = x?.response?.data;
      setStatus({ ok: false, msg: d ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" | ") : "Could not save." });
    } finally { setSaving(false); }
  };

  // Drag and drop
  const onDrop = e => {
    e.preventDefault();
    dropRef.current?.classList.remove("border-emerald-400");
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="card mb-4 overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => { setOpen(o => !o); if (open) reset(); }}
      >
        <span className="flex items-center gap-2 font-bold">
          <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <i className="bi bi-image text-purple-600" />
          </span>
          Import from Screenshot
        </span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} text-slate-400`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500 mb-4">
            Upload a screenshot of an M-PESA message. We'll read the text automatically and fill in the transaction details.
          </p>

          {/* Drop zone */}
          {!preview && (
            <div
              ref={dropRef}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add("border-emerald-400"); }}
              onDragLeave={() => dropRef.current?.classList.remove("border-emerald-400")}
              onDrop={onDrop}
            >
              <i className="bi bi-cloud-upload text-4xl text-slate-300 block mb-2" />
              <p className="font-semibold text-slate-500">Drop screenshot here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP supported</p>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Preview + actions */}
          {preview && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Image preview */}
              <div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={preview} alt="Screenshot preview" className="w-full object-contain max-h-64" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-slate-500 hover:text-red-500"
                    onClick={reset}
                  >
                    <i className="bi bi-x" />
                  </button>
                </div>
                {step === STEPS.idle && (
                  <button className="btn primary w-full mt-3" onClick={runOcr}>
                    <i className="bi bi-search mr-1" />Read text from image
                  </button>
                )}
              </div>

              {/* OCR result */}
              <div>
                {step === STEPS.ocr && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="spinner" />
                    <p className="text-sm text-slate-500">Reading image… {progress}%</p>
                    <div className="progress-bar w-full">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {step === STEPS.done && parsed && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1">
                      <i className="bi bi-check-circle" /> Transaction detected
                    </p>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type</span>
                        <span className={`badge ${parsed.transaction_type === "income" ? "badge-green" : "badge-red"}`}>{parsed.transaction_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-bold">Ksh {parsed.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="font-bold">{parsed.transaction_date}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 shrink-0">Description</span>
                        <span className="font-bold text-right">{parsed.description}</span>
                      </div>
                    </div>
                    <label className="label">Category <span className="text-red-500">*</span>
                      <select className="input mt-1" value={catId} onChange={e => setCatId(e.target.value)}>
                        <option value="">— Select category —</option>
                        {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </label>
                    <button className="btn primary w-full mt-3" onClick={save} disabled={saving}>
                      {saving
                        ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle" />Saving…</>
                        : <><i className="bi bi-check-lg mr-1" />Save transaction + screenshot</>}
                    </button>
                  </div>
                )}

                {/* Raw OCR text fallback */}
                {step === STEPS.done && !parsed && rawText && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Extracted text</p>
                    <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">{rawText}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {status && (
            <p className={`mt-3 text-sm p-3 rounded-xl flex items-start gap-2 ${status.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <i className={`bi ${status.ok ? "bi-check-circle" : "bi-exclamation-circle"} mt-0.5 shrink-0`} />
              {status.msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
