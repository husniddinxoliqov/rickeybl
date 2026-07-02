import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopItem } from '../../types';

export default function AdminShopPage() {
  const { t, localize } = useI18n();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coinCost, setCoinCost] = useState(0);
  const [stock, setStock] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<ShopItem[]>('/api/shop/items');
      setItems(data);
    } catch { setError(t('common.error')); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => {
    setName(''); setDescription(''); setImageUrl('');
    setCoinCost(0); setStock(0); setIsActive(true);
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (item: ShopItem) => {
    setName(item.name); setDescription(item.description);
    setImageUrl(item.imageUrl || ''); setCoinCost(item.coinCost);
    setStock(item.stock); setIsActive(item.isActive);
    setEditingId(item.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(), description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        coinCost, stock, isActive,
      };
      if (editingId) await apiClient.put(`/api/shop/items/${editingId}`, body);
      else await apiClient.post('/api/shop/items', body);
      setSuccess(t('admin.shop.createSuccess'));
      resetForm(); await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally { setIsSubmitting(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm(t('admin.shop.deleteConfirm'))) return;
    try { await apiClient.delete(`/api/shop/items/${id}`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('common.error')); }
  };

  if (isLoading) return <section><h1>{t('admin.shop.title')}</h1><p>{t('common.loading')}</p></section>;

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };

  return (
    <section>
      <h1>{t('admin.shop.title')}</h1>
      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
      <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ marginTop: 12, padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
        {showForm ? t('common.cancel') : t('admin.shop.create')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.shop.name')} required style={inputStyle} />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('admin.shop.description')} required style={inputStyle} />
          <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t('admin.shop.imageUrl')} style={inputStyle} />
          <div><label style={{ fontSize: 13, color: '#6b7280' }}>{t('admin.shop.coinCost')}</label><input type="number" value={coinCost} onChange={(e) => setCoinCost(Number(e.target.value))} min={1} required style={inputStyle} /></div>
          <div><label style={{ fontSize: 13, color: '#6b7280' }}>{t('admin.shop.stock')}</label><input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} min={-1} style={inputStyle} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />{t('admin.shop.isActive')}</label>
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? t('common.loading') : editingId ? t('common.save') : t('admin.shop.create')}
          </button>
        </form>
      )}
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {items.map((item) => (
          <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, opacity: item.isActive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{localize(item.nameI18n, item.name)}</strong>
                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>{localize(item.descriptionI18n, item.description)}</p>
                <small>{t('admin.shop.coinCost')}: {item.coinCost} | {t('admin.shop.stock')}: {item.stock}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(item)} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{t('admin.shop.edit')}</button>
                <button onClick={() => void deleteItem(item.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{t('admin.shop.delete')}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
