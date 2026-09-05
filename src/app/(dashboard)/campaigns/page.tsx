'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  fetchCampaignsAction,
  createCampaignAction,
} from '@/features/campaigns/actions';
import { CampaignWithStats } from '@/services/campaign.service';
import {
  CampaignCardPreview,
  CardTemplateConfig,
} from '@/components/campaigns/CampaignCardPreview';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Percent,
  Users,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CampaignCardThumbnail({ campaign }: { campaign: CampaignWithStats }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState<number>(0.7);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      if (el.clientWidth > 0) {
        setScale(el.clientWidth / 428);
      }
    };

    updateScale();

    const ro = new ResizeObserver(() => {
      updateScale();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const templateConfig =
    (campaign.card_template_config as unknown as CardTemplateConfig) || {};

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[428/270] rounded-xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-sm group-hover:border-indigo-400/50 dark:group-hover:border-indigo-600/50 transition-all flex items-center justify-center"
    >
      <div className="transition-transform duration-300 group-hover:scale-105">
        <CampaignCardPreview
          familyName="POPESCU Gabriel"
          couponCode={`${campaign.code_slug || 'ASF'}260905001X3`}
          discountPercentage={campaign.discount_percentage}
          campaignName={campaign.name}
          templateConfig={templateConfig}
          scale={scale}
        />
      </div>
    </div>
  );
}

const statusLabels: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  active: { label: 'Activă', variant: 'success' },
  draft: { label: 'Ciornă', variant: 'secondary' },
  archived: { label: 'Arhivată', variant: 'destructive' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<CampaignWithStats[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');

  // Create dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formSlug, setFormSlug] = React.useState('');
  const [formCodeSlug, setFormCodeSlug] = React.useState('ASF');
  const [formDiscount, setFormDiscount] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formStatus, setFormStatus] = React.useState<'draft' | 'active'>('draft');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCampaignsAction({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setCampaigns(res.campaigns);
      setTotalCount(res.totalCount);
    } catch {
      // Quiet fallback
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNameChange(name: string) {
    setFormName(name);
    setFormSlug(slugify(name));
    const autoCode = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    if (autoCode.length === 3) {
      setFormCodeSlug(autoCode);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);

    const res = await createCampaignAction({
      name: formName,
      slug: formSlug,
      code_slug: formCodeSlug || 'ASF',
      discount_percentage: parseInt(formDiscount, 10) || 0,
      description: formDescription || null,
      status: formStatus,
    });

    if (res.error) {
      setCreateError(res.error);
      setCreating(false);
      return;
    }

    setCreateOpen(false);
    setFormName('');
    setFormSlug('');
    setFormCodeSlug('ASF');
    setFormDiscount('');
    setFormDescription('');
    setFormStatus('draft');
    setCreating(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Campanii de Reducere
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestionați campaniile de reducere și vizualizați familiile înscrise.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reîmprospătează
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adaugă Campanie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Campanie Nouă</DialogTitle>
                <DialogDescription>
                  Creați o nouă campanie de reducere pentru familii.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Denumire campanie *
                  </label>
                  <Input
                    placeholder="ex: Reducere Park Aventura 2026"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Slug (URL)
                  </label>
                  <Input
                    placeholder="reducere-park-aventura"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Prefix Cod Cupon (3 caractere) *
                  </label>
                  <Input
                    placeholder="ex: EDU, CHR, ASF"
                    maxLength={3}
                    value={formCodeSlug}
                    onChange={(e) => setFormCodeSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="font-mono text-xs uppercase font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format cod generat: <code className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formCodeSlug || 'ASF'}260905001042A7</code>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Procent reducere (%) *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="20"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Descriere / Detalii
                  </label>
                  <Textarea
                    placeholder="Detalii despre campania de reducere, termene și condiții..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={formStatus === 'draft' ? 'default' : 'outline'}
                      onClick={() => setFormStatus('draft')}
                      className="text-xs"
                    >
                      Ciornă
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={formStatus === 'active' ? 'default' : 'outline'}
                      onClick={() => setFormStatus('active')}
                      className="text-xs"
                    >
                      Activă
                    </Button>
                  </div>
                </div>

                {createError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
                    {createError}
                  </p>
                )}
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button variant="outline" size="sm" className="text-xs">
                    Anulează
                  </Button>
                </DialogClose>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !formName.trim() || !formDiscount}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {creating ? 'Se creează...' : 'Creează Campanie'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Caută campanie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="flex gap-1.5">
          {['', 'active', 'draft', 'archived'].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter(st)}
            >
              {st === '' ? 'Toate' : statusLabels[st]?.label || st}
            </Button>
          ))}
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {loading ? (
        <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Se încarcă campaniile...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="h-64 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">Nu există campanii{statusFilter ? ` cu status „${statusLabels[statusFilter]?.label}"` : ''}.</p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Creează prima campanie
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {totalCount} {totalCount === 1 ? 'campanie' : 'campanii'} găsite
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
              const statusInfo = statusLabels[campaign.status] || statusLabels.draft;
              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer flex flex-col justify-between h-full">
                    {/* Gradient accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Edge-to-Edge Cover Card Thumbnail */}
                      <CampaignCardThumbnail campaign={campaign} />

                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {campaign.name}
                        </h3>
                        <Badge variant={statusInfo.variant} className="shrink-0 text-[10px]">
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {campaign.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Percent className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            -{campaign.discount_percentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          <span>{campaign.subscription_count} familii</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
