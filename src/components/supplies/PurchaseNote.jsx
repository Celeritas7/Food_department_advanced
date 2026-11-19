import { safePurchaseUrl } from '../../engines/supplies.js';
export default function PurchaseNote({ purchase = {}, note = '' }) {
  const p = purchase || {};
  let url = ''; try { url = safePurchaseUrl(p.url); } catch { /* Imported unsafe links are not rendered. */ }
  const price = p.priceYen != null && p.priceYen !== '' && Number.isFinite(Number(p.priceYen)) && Number(p.priceYen) >= 0;
  return <div className="text-xs text-warm-gray space-y-1 break-words">
    {(p.shop || price || p.packSize) && <p>{p.shop || 'Shop not recorded'}{price ? ` · Recorded ¥${Number(p.priceYen).toLocaleString('ja-JP')}` : ''}{p.packSize ? ` · ${p.packSize}` : ''}</p>}
    {(price || p.checkedOn) && <p>{p.checkedOn ? `Price date: ${p.checkedOn}` : 'Price date not recorded'} · Not a live price</p>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer" className="underline">Shop / product link</a>}
    {note && <p className="whitespace-pre-wrap">{note}</p>}
  </div>;
}
