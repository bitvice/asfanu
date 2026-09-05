'use client';

import * as React from 'react';
import {
  fetchCampaignByIdAction,
  fetchCampaignSubscriptionsAction,
  updateCampaignTemplateAction,
  updateCampaignAction,
} from '@/features/campaigns/actions';
import { CampaignWithStats } from '@/services/campaign.service';
import { CampaignCardPreview, CardTemplateConfig } from '@/components/campaigns/CampaignCardPreview';
import { CampaignCardExporter } from '@/components/campaigns/CampaignCardExporter';
import { formatVoucherName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Palette,
  Save,
  Percent,
  Calendar,
  Hash,
  Pencil,
  Tag,
  Loader2,
  CheckCircle,
  Archive,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

const statusLabels: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  active: { label: 'Activă', variant: 'success' },
  draft: { label: 'Ciornă', variant: 'secondary' },
  archived: { label: 'Arhivată', variant: 'destructive' },
};

interface SubscriptionWithFamily {
  id: string;
  coupon_code: string;
  coupon_number: number;
  subscribed_at: string;
  registrations: {
    id: string;
    parent_first_name: string;
    parent_last_name: string;
    primary_email: string;
    phone: string;
    county: string;
    city: string;
  };
}

export default function CampaignDetailPage() {
  const [campaign, setCampaign] = React.useState<CampaignWithStats | null>(null);
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionWithFamily[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [id, setId] = React.useState<string | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editSlug, setEditSlug] = React.useState('');
  const [editCodeSlug, setEditCodeSlug] = React.useState('ASF');
  const [editDiscount, setEditDiscount] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<'draft' | 'active' | 'archived'>('draft');
  const [editStartDate, setEditStartDate] = React.useState('');
  const [editEndDate, setEditEndDate] = React.useState('');

  // Template editor state
  const [templateConfig, setTemplateConfig] = React.useState<CardTemplateConfig>({
    bg_gradient_from: '#4f46e5',
    bg_gradient_to: '#7c3aed',
    text_color: '#ffffff',
    accent_color: '#fbbf24',
    layout: 'default',
  });
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [statusChanging, setStatusChanging] = React.useState(false);

  const [previewScale, setPreviewScale] = React.useState<number>(1.5);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const voucherCardRef = React.useRef<HTMLDivElement>(null);

  const [selectedSubForVoucher, setSelectedSubForVoucher] = React.useState<SubscriptionWithFamily | null>(null);

  React.useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 1];
    if (campaignId) setId(campaignId);
  }, []);

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [campaignData, subsData] = await Promise.all([
        fetchCampaignByIdAction(id),
        fetchCampaignSubscriptionsAction(id),
      ]);
      setCampaign(campaignData);
      setSubscriptions(subsData as unknown as SubscriptionWithFamily[]);

      // Load template config directly from campaign DB row
      if (campaignData.card_template_config && typeof campaignData.card_template_config === 'object') {
        setTemplateConfig(campaignData.card_template_config as unknown as CardTemplateConfig);
      }
    } catch {
      setError('Nu s-a putut încărca campania solicitată.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  function handleOpenEdit() {
    if (!campaign) return;
    setEditName(campaign.name);
    setEditSlug(campaign.slug);
    setEditCodeSlug(campaign.code_slug || 'ASF');
    setEditDiscount(String(campaign.discount_percentage));
    setEditDescription(campaign.description || '');
    setEditStatus(campaign.status);
    setEditStartDate(campaign.start_date || '');
    setEditEndDate(campaign.end_date || '');
    setEditError(null);
    setEditOpen(true);
  }

  async function handleQuickStatusChange(newStatus: 'active' | 'archived') {
    if (!id || !campaign || statusChanging) return;
    setStatusChanging(true);
    const res = await updateCampaignAction(id, {
      name: campaign.name,
      slug: campaign.slug,
      code_slug: campaign.code_slug || 'ASF',
      discount_percentage: campaign.discount_percentage,
      description: campaign.description || '',
      status: newStatus,
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
    });
    if (!res.error) {
      await loadDetail();
    }
    setStatusChanging(false);
  }

  async function handleUpdateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setUpdating(true);
    setEditError(null);

    const res = await updateCampaignAction(id, {
      name: editName,
      slug: editSlug,
      code_slug: editCodeSlug,
      discount_percentage: Number(editDiscount),
      description: editDescription || undefined,
      status: editStatus,
      start_date: editStartDate || undefined,
      end_date: editEndDate || undefined,
    });

    if (res.error) {
      setEditError(res.error);
      setUpdating(false);
    } else {
      setUpdating(false);
      setEditOpen(false);
      loadDetail();
    }
  }

  async function handleSaveTemplate() {
    if (!id) return;
    setSaving(true);
    setSaveMessage(null);

    const res = await updateCampaignTemplateAction(id, templateConfig as unknown as Record<string, unknown>);

    if (res.error) {
      setSaveMessage(res.error);
    } else {
      setSaveMessage('Template-ul a fost salvat cu succes!');
      setTimeout(() => setSaveMessage(null), 3000);
      await loadDetail();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Se încarcă detaliile campaniei...
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-8 text-center">
        <p className="text-sm text-red-500">{error || 'Campania nu există.'}</p>
        <Link href="/campaigns">
          <Button variant="outline" size="sm">Înapoi la campanii</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusLabels[campaign.status] || statusLabels.draft;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href="/campaigns">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 dark:text-slate-400 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Înapoi la campanii
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <Button
                size="sm"
                disabled={statusChanging}
                onClick={() => handleQuickStatusChange('active')}
                className="h-8 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm"
              >
                {statusChanging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Activează</span>
              </Button>
            )}

            {campaign.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                disabled={statusChanging}
                onClick={() => handleQuickStatusChange('archived')}
                className="h-8 gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {statusChanging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>Arhivează</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="h-8 gap-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Editează Campania</span>
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {campaign.name}
              </h1>
              <Badge
                variant={statusInfo.variant}
                onClick={handleOpenEdit}
                title="Apasă pentru a schimba statusul campaniei"
                className="text-xs px-2.5 py-0.5 font-bold shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
              >
                {statusInfo.label}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {campaign.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats & Slugs bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              -{campaign.discount_percentage}% Reducere
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Slug URL:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{campaign.slug}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-[11px] text-slate-500 font-medium">Cod Slug:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">{campaign.code_slug || 'ASF'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{campaign.subscription_count} familii înscrise</span>
          </div>

          {campaign.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(campaign.start_date + 'T00:00:00').toLocaleDateString('ro-RO')}</span>
              {campaign.end_date && (
                <span>— {new Date(campaign.end_date + 'T00:00:00').toLocaleDateString('ro-RO')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Campaign Modal Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Editează Detaliile Campaniei
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modificați informațiile, slug-urile sau activați/dezactivați campania.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCampaign} className="space-y-4 py-2">
            {editError && (
              <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nume Campanie *</label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Slug URL *</label>
                <Input
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cod Slug (3 Litere) *</label>
                <Input
                  required
                  maxLength={3}
                  value={editCodeSlug}
                  onChange={(e) => setEditCodeSlug(e.target.value.toUpperCase().slice(0, 3))}
                  className="text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Procent Reducere (%) *</label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status Campanie *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'draft' | 'active' | 'archived')}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950 dark:focus:ring-slate-300"
                >
                  <option value="draft">Ciornă (Înscrieri Dezactivate)</option>
                  <option value="active">Activă (Înscrieri Permise)</option>
                  <option value="archived">Arhivată</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descriere</label>
              <Textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dată Început</label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dată Sfârșit</label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" className="text-xs">
                  Anulează
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={updating}
                size="sm"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Se salvează...</span>
                  </>
                ) : (
                  <span>Salvează Modificările</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Voucher Modal for Participating Family */}
      <Dialog
        open={!!selectedSubForVoucher}
        onOpenChange={(open) => {
          if (!open) setSelectedSubForVoucher(null);
        }}
      >
        <DialogContent className="max-w-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-base font-extrabold flex items-center justify-between gap-2">
              <span className="text-slate-900 dark:text-slate-100">
                Voucher — {selectedSubForVoucher ? formatVoucherName(selectedSubForVoucher.registrations.parent_last_name, selectedSubForVoucher.registrations.parent_first_name) : ''}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Voucherul generat pe baza șablonului campaniei cu datele familiei înscrise.
            </DialogDescription>
          </DialogHeader>

          {selectedSubForVoucher && (
            <div className="py-3 space-y-4 flex flex-col items-center">
              {/* Voucher Card Container */}
              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center w-full overflow-x-auto">
                <CampaignCardPreview
                  cardRef={voucherCardRef}
                  campaignName={campaign.name}
                  discountPercentage={campaign.discount_percentage}
                  couponCode={selectedSubForVoucher.coupon_code}
                  familyName={formatVoucherName(
                    selectedSubForVoucher.registrations.parent_last_name,
                    selectedSubForVoucher.registrations.parent_first_name
                  )}
                  templateConfig={templateConfig}
                  scale={1.35}
                />
              </div>

              <div className="flex items-center justify-between w-full pt-2">
                <CampaignCardExporter
                  cardRef={voucherCardRef}
                  fileName={`voucher-${selectedSubForVoucher.coupon_code}`}
                />
                <DialogClose asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    Închide
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">
            <Users className="w-3.5 h-3.5" />
            Familii Înscrise ({campaign.subscription_count})
          </TabsTrigger>
          <TabsTrigger value="template">
            <Palette className="w-3.5 h-3.5" />
            Template Card
          </TabsTrigger>
        </TabsList>

        {/* Tab: Subscriptions */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" /> Familii Participante
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {subscriptions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Nu există familii înscrise în această campanie.
                </p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <Link
                            href={`/registrations/${sub.registrations.id}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {sub.registrations.parent_last_name} {sub.registrations.parent_first_name}
                          </Link>
                          <p className="text-slate-500 text-[11px]">
                            {sub.registrations.primary_email} · {sub.registrations.county}, {sub.registrations.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSubForVoucher(sub)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/80 transition-all group/code text-left cursor-pointer"
                            title="Apasă pentru a deschide voucherul compilat"
                          >
                            <Hash className="w-3 h-3 text-indigo-400 group-hover/code:text-indigo-600 transition-colors" />
                            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                              {sub.coupon_code}
                            </span>
                            <Eye className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover/code:opacity-100 ml-1 transition-opacity" />
                          </button>
                          <p className="text-[10px] text-slate-400 mt-0.5 text-right pr-1">
                            {new Date(sub.subscribed_at).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Template Editor */}
        <TabsContent value="template" className="space-y-6">
          {/* Prominent Large Card Preview Section */}
          <Card className="overflow-hidden border-2 border-indigo-500/20 dark:border-indigo-500/30 bg-gradient-to-b from-indigo-50/30 via-slate-50/50 to-white dark:from-indigo-950/20 dark:via-slate-900/50 dark:to-slate-950 shadow-lg">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Palette className="w-4 h-4" /> Previzualizare Șablon Card (CR80 Standard)
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Dimensiune Previzualizare:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setPreviewScale(1)}
                    className={`px-2 py-0.5 rounded transition-all ${previewScale === 1 ? 'bg-white dark:bg-slate-700 font-bold text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    1.0x
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(1.5)}
                    className={`px-2 py-0.5 rounded transition-all ${previewScale === 1.5 ? 'bg-white dark:bg-slate-700 font-bold text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    1.5x
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(2)}
                    className={`px-2 py-0.5 rounded transition-all ${previewScale === 2 ? 'bg-white dark:bg-slate-700 font-bold text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    2.0x
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(3)}
                    className={`px-2 py-0.5 rounded transition-all ${previewScale === 3 ? 'bg-white dark:bg-slate-700 font-bold text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    3.0x
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center space-y-4">
              {/* Centered Large Card Preview */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200/60 dark:border-slate-800/60 shadow-inner flex items-center justify-center min-h-[320px] w-full overflow-x-auto">
                <CampaignCardPreview
                  cardRef={cardRef}
                  familyName="POPESCU Gabriel"
                  couponCode="ASFANU1001"
                  discountPercentage={campaign.discount_percentage}
                  campaignName={campaign.name}
                  templateConfig={templateConfig}
                  scale={previewScale}
                />
              </div>

              {/* Exporter Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <CampaignCardExporter
                  cardRef={cardRef}
                  fileName={`cupon-${campaign.slug || 'asfanu'}-demo`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls Card */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Opțiuni & Slidere de Ajustare Fină
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {templateConfig.mode === 'custom_image' ? 'Imagine Custom' : 'Gradient Procedural'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Mod Șablon Vizual
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTemplateConfig({ ...templateConfig, mode: 'gradient' })}
                    className={`py-2 px-3 text-xs font-medium rounded-md transition-all ${
                      templateConfig.mode !== 'custom_image'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Gradient Procedural
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTemplateConfig({
                        ...templateConfig,
                        mode: 'custom_image',
                        card_background_url: templateConfig.card_background_url || '/templates/asfanu-imprim-template.png',
                      })
                    }
                    className={`py-2 px-3 text-xs font-medium rounded-md transition-all ${
                      templateConfig.mode === 'custom_image'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Imagine Custom / Template Client
                  </button>
                </div>
              </div>

              {templateConfig.mode === 'custom_image' ? (
                /* Custom Image Mode Settings */
                <div className="space-y-5">
                  {/* Quick Presets & Upload */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        Resursă Fundal Card
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
                        onClick={() =>
                          setTemplateConfig({
                            ...templateConfig,
                            mode: 'custom_image',
                            card_background_url: '/templates/asfanu-imprim-template.png',
                            coupon_code_x: 49.5,
                            coupon_code_y: 70.0,
                            coupon_code_font_size: 15,
                            coupon_code_color: '#ffffff',
                            coupon_code_bg: 'transparent',
                            show_family_name: true,
                            family_name_x: 50,
                            family_name_y: 76.5,
                            family_name_font_size: 11,
                            family_name_color: '#ffffff',
                          })
                        }
                      >
                        Încarcă Preset ASFANU - IMPRIM
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                        Încarcă o imagine nouă (PNG / JPG)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setTemplateConfig({
                                ...templateConfig,
                                card_background_url: evt.target?.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section: Cod Cupon Overlay */}
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
                      <span>1. Poziționare & Stil Cod Cupon</span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        ASFANU1001
                      </span>
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block">
                          Poziție X (Orizontal %): {templateConfig.coupon_code_x ?? 49.5}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={templateConfig.coupon_code_x ?? 49.5}
                          onChange={(e) =>
                            setTemplateConfig({ ...templateConfig, coupon_code_x: parseFloat(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block">
                          Poziție Y (Vertical %): {templateConfig.coupon_code_y ?? 70.0}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={templateConfig.coupon_code_y ?? 70.0}
                          onChange={(e) =>
                            setTemplateConfig({ ...templateConfig, coupon_code_y: parseFloat(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                          Mărime Font: {templateConfig.coupon_code_font_size ?? 15}px
                        </label>
                        <Input
                          type="number"
                          min="10"
                          max="48"
                          value={templateConfig.coupon_code_font_size ?? 15}
                          onChange={(e) =>
                            setTemplateConfig({
                              ...templateConfig,
                              coupon_code_font_size: parseInt(e.target.value) || 15,
                            })
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                          Culoare Text Cod
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={templateConfig.coupon_code_color || '#ffffff'}
                            onChange={(e) =>
                              setTemplateConfig({ ...templateConfig, coupon_code_color: e.target.value })
                            }
                            className="w-8 h-8 rounded border cursor-pointer"
                          />
                          <Input
                            value={templateConfig.coupon_code_color || '#ffffff'}
                            onChange={(e) =>
                              setTemplateConfig({ ...templateConfig, coupon_code_color: e.target.value })
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                !templateConfig.coupon_code_bg ||
                                templateConfig.coupon_code_bg === 'transparent' ||
                                templateConfig.coupon_code_bg === 'none'
                              }
                              onChange={(e) =>
                                setTemplateConfig({
                                  ...templateConfig,
                                  coupon_code_bg: e.target.checked ? 'transparent' : '#0d2149',
                                })
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Fundal transparent (fără casetă de fundal în jurul codului)</span>
                          </label>

                          {templateConfig.coupon_code_bg &&
                            templateConfig.coupon_code_bg !== 'transparent' &&
                            templateConfig.coupon_code_bg !== 'none' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Culoare casetă:</span>
                                <input
                                  type="color"
                                  value={templateConfig.coupon_code_bg}
                                  onChange={(e) =>
                                    setTemplateConfig({ ...templateConfig, coupon_code_bg: e.target.value })
                                  }
                                  className="w-6 h-6 rounded border cursor-pointer"
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Nume Familie Overlay */}
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        2. Afișare & Poziționare Nume Familie
                      </h4>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={templateConfig.show_family_name !== false}
                          onChange={(e) =>
                            setTemplateConfig({ ...templateConfig, show_family_name: e.target.checked })
                          }
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Afișează</span>
                      </label>
                    </div>

                    {templateConfig.show_family_name !== false && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 block">
                            Poziție X (Orizontal %): {templateConfig.family_name_x ?? 50}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={templateConfig.family_name_x ?? 50}
                            onChange={(e) =>
                              setTemplateConfig({ ...templateConfig, family_name_x: parseFloat(e.target.value) })
                            }
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 block">
                            Poziție Y (Vertical %): {templateConfig.family_name_y ?? 76.5}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.5"
                            value={templateConfig.family_name_y ?? 76.5}
                            onChange={(e) =>
                              setTemplateConfig({ ...templateConfig, family_name_y: parseFloat(e.target.value) })
                            }
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                            Mărime Font Nume: {templateConfig.family_name_font_size ?? 11}px
                          </label>
                          <Input
                            type="number"
                            min="8"
                            max="36"
                            value={templateConfig.family_name_font_size ?? 11}
                            onChange={(e) =>
                              setTemplateConfig({
                                ...templateConfig,
                                family_name_font_size: parseInt(e.target.value) || 11,
                              })
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                            Culoare Text Nume
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={templateConfig.family_name_color || '#ffffff'}
                              onChange={(e) =>
                                setTemplateConfig({ ...templateConfig, family_name_color: e.target.value })
                              }
                              className="w-8 h-8 rounded border cursor-pointer"
                            />
                            <Input
                              value={templateConfig.family_name_color || '#ffffff'}
                              onChange={(e) =>
                                setTemplateConfig({ ...templateConfig, family_name_color: e.target.value })
                              }
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Gradient Mode Settings */
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Culoare gradient (start)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={templateConfig.bg_gradient_from || '#4f46e5'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, bg_gradient_from: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.bg_gradient_from || '#4f46e5'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, bg_gradient_from: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Culoare gradient (final)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={templateConfig.bg_gradient_to || '#7c3aed'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, bg_gradient_to: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.bg_gradient_to || '#7c3aed'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, bg_gradient_to: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Culoare text
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={templateConfig.text_color || '#ffffff'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, text_color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.text_color || '#ffffff'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Culoare accent (reducere)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={templateConfig.accent_color || '#fbbf24'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, accent_color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <Input
                        value={templateConfig.accent_color || '#fbbf24'}
                        onChange={(e) => setTemplateConfig({ ...templateConfig, accent_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Se salvează...' : 'Salvează Template'}
                </Button>
                {saveMessage && (
                  <span className={`text-xs font-medium ${saveMessage.includes('succes') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
