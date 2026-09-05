'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  fetchCampaignsForRegistrationAction,
  unsubscribeFamilyAction,
} from '@/features/campaigns/actions';
import { sendVoucherEmailAction } from '@/features/email/actions';
import { CampaignForRegistration } from '@/services/campaign.service';
import { SubscribeConfirmDialog } from '@/components/campaigns/SubscribeConfirmDialog';
import {
  CampaignCardPreview,
  CardTemplateConfig,
} from '@/components/campaigns/CampaignCardPreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampaignCardExporter, generateCardPdfBase64 } from '@/components/campaigns/CampaignCardExporter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Megaphone,
  CheckCircle2,
  Plus,
  Hash,
  Percent,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Ticket,
  ArrowRight,
  Trash2,
  Eye,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface FamilyCampaignsTabProps {
  registrationId: string;
  familyName: string;
}

function CampaignVoucherThumbnail({
  campaign,
  familyName,
  couponCode,
  renderOverlays = true,
}: {
  campaign: CampaignForRegistration;
  familyName: string;
  couponCode?: string | null;
  renderOverlays?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState<number>(0.65);

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

  const templateConfig = (campaign.card_template_config as unknown as CardTemplateConfig) || {};

  const displayCode = couponCode || `${campaign.code_slug || 'ASF'}260905001X3`;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[428/270] rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm group-hover:shadow-md transition-all flex items-center justify-center"
    >
      <div className="transition-transform duration-300 group-hover:scale-[1.03]">
        <CampaignCardPreview
          familyName={familyName}
          couponCode={displayCode}
          discountPercentage={campaign.discount_percentage}
          campaignName={campaign.name}
          templateConfig={templateConfig}
          scale={scale}
          renderOverlays={renderOverlays}
        />
      </div>
    </div>
  );
}

export function FamilyCampaignsTab({ registrationId, familyName }: FamilyCampaignsTabProps) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<CampaignForRegistration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = React.useState<string | null>(null);

  // Subscribe dialog state
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<CampaignForRegistration | null>(null);

  // Voucher view modal state
  const [voucherModalCampaign, setVoucherModalCampaign] = React.useState<CampaignForRegistration | null>(null);
  const modalCardRef = React.useRef<HTMLDivElement>(null);
  const [sendingModalEmail, setSendingModalEmail] = React.useState(false);

  const loadCampaigns = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCampaignsForRegistrationAction(registrationId);
      setCampaigns(data);
    } catch {
      // Quiet fallback
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  React.useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleModalSendEmail() {
    if (!voucherModalCampaign?.subscription_id || !modalCardRef.current) return;
    setSendingModalEmail(true);
    try {
      const pdfBase64 = await generateCardPdfBase64(modalCardRef.current);
      const res = await sendVoucherEmailAction({
        subscriptionId: voucherModalCampaign.subscription_id,
        pdfBase64,
      });

      if (res.error) {
        toast.error(res.error, 'Eroare Trimitere Email');
      } else {
        toast.success(
          `Voucherul a fost trimis cu succes pe email către ${res.data?.sentTo || familyName}!`,
          'Voucher Expediat'
        );
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Eroare la trimiterea emailului.', 'Eroare Trimitere Email');
    } finally {
      setSendingModalEmail(false);
    }
  }

  function handleSubscribeClick(campaign: CampaignForRegistration) {
    setSelectedCampaign(campaign);
    setSubscribeOpen(true);
  }

  function handleSubscribed() {
    setSubscribeOpen(false);
    loadCampaigns();
  }

  async function handleUnsubscribe(campaignId: string) {
    if (!confirm('Sigur doriți să ștergeți această înscriere? Codul de cupon generat va fi eliminat.')) {
      return;
    }
    setUnsubscribingId(campaignId);
    try {
      const res = await unsubscribeFamilyAction(campaignId, registrationId);
      if (res.error) {
        alert(res.error);
      } else {
        loadCampaigns();
      }
    } catch {
      alert('Eroare la ștergerea înscrierii.');
    } finally {
      setUnsubscribingId(null);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (loading) {
    return (
      <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span>Se încarcă campaniile de reducere...</span>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="h-64 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3 text-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Nu există campanii active</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            În prezent nu au fost configurate campanii de reducere pentru această familie.
          </p>
        </div>
      </div>
    );
  }

  // Separate subscribed and unsubscribed
  const subscribed = campaigns.filter((c) => c.is_subscribed);
  const available = campaigns.filter((c) => !c.is_subscribed);

  return (
    <div className="space-y-6">
      {/* Overview Stat Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 dark:border-indigo-950 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Campanii & Vouchere de Reducere
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Înscrieți familia în campaniile disponibile pentru a genera coduri unice de reducere.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-1.5">{subscribed.length}</span> Înscrise
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1.5">{available.length}</span> Disponibile
          </Badge>
        </div>
      </div>

      {/* Subscribed campaigns */}
      {subscribed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Campanii Înscrise ({subscribed.length})
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {subscribed.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-50/80 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 space-y-4 shadow-sm hover:shadow-md transition-all"
              >
                {/* Status bar header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        Înscris
                      </Badge>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <Percent className="w-3 h-3" />
                        -{campaign.discount_percentage}% Reducere
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {campaign.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={unsubscribingId === campaign.id}
                      onClick={() => handleUnsubscribe(campaign.id)}
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Șterge înscrierea din această campanie"
                    >
                      {unsubscribingId === campaign.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Voucher Template Thumbnail (Render Overlays enabled) */}
                <div
                  onClick={() => setVoucherModalCampaign(campaign)}
                  className="cursor-pointer group/thumb relative"
                  title="Apasă pentru a deschide voucherul compilat"
                >
                  <CampaignVoucherThumbnail
                    campaign={campaign}
                    familyName={familyName}
                    couponCode={campaign.coupon_code}
                    renderOverlays={true}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none">
                    <Eye className="w-4 h-4" />
                    <span>Vezi Voucher</span>
                  </div>
                </div>

                {/* Coupon Code Display Box */}
                <div className="relative overflow-hidden rounded-xl bg-slate-900 dark:bg-slate-950 text-white p-3.5 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Cod Voucher Generat</p>
                      <p className="text-base sm:text-lg font-black font-mono tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-amber-400/70" />
                        {campaign.coupon_code}
                      </p>
                    </div>

                    {campaign.coupon_code && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setVoucherModalCampaign(campaign)}
                          className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 flex items-center justify-center"
                          title="Vezi Voucher"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(campaign.coupon_code!)}
                          className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0 flex items-center justify-center"
                          title={copiedCode === campaign.coupon_code ? 'Cod copiat' : 'Copiază codul'}
                        >
                          {copiedCode === campaign.coupon_code ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available campaigns */}
      {available.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Campanii Disponibile ({available.length})
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            {available.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-400/50 dark:hover:border-indigo-600/50"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-2.5 py-0.5">
                        <Percent className="w-3 h-3 mr-1" />
                        -{campaign.discount_percentage}% Reducere
                      </Badge>

                      {campaign.status === 'draft' && (
                        <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold px-2 py-0.5">
                          Ciornă
                        </Badge>
                      )}
                    </div>

                    {campaign.code_slug && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {campaign.code_slug}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {campaign.name}
                  </h4>

                  {campaign.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Clean Voucher Template Thumbnail (No overlays rendered for unsubscribed) */}
                  <CampaignVoucherThumbnail
                    campaign={campaign}
                    familyName={familyName}
                    couponCode={null}
                    renderOverlays={false}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    disabled={campaign.status === 'draft'}
                    onClick={() => handleSubscribeClick(campaign)}
                    className={`w-full font-bold text-xs gap-2 py-2.5 group/btn ${
                      campaign.status === 'draft'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white dark:text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>
                      {campaign.status === 'draft'
                        ? 'Ciornă (Înscrieri Dezactivate)'
                        : 'Înscrie Familia în Campanie'}
                    </span>
                    {campaign.status !== 'draft' && (
                      <ArrowRight className="w-3.5 h-3.5 text-white opacity-0 group-hover/btn:opacity-100 transition-opacity -ml-1 shrink-0" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribe confirmation dialog */}
      {selectedCampaign && (
        <SubscribeConfirmDialog
          open={subscribeOpen}
          onOpenChange={setSubscribeOpen}
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
          discountPercentage={selectedCampaign.discount_percentage}
          registrationId={registrationId}
          familyName={familyName}
          onSubscribed={handleSubscribed}
        />
      )}

      {/* Voucher Detail Modal for Subscribed Campaign */}
      <Dialog
        open={!!voucherModalCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setVoucherModalCampaign(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
          <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-base font-extrabold flex items-center justify-between gap-2">
              <span className="text-slate-900 dark:text-slate-100">
                Voucher — {familyName}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Voucherul generat pe baza șablonului campaniei cu datele acestei familii.
            </DialogDescription>
          </DialogHeader>

          {voucherModalCampaign && (
            <div className="py-2 space-y-3 flex flex-col items-center">
              {/* Voucher Card Container */}
              <div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center w-full overflow-x-auto">
                <CampaignCardPreview
                  cardRef={modalCardRef}
                  campaignName={voucherModalCampaign.name}
                  discountPercentage={voucherModalCampaign.discount_percentage}
                  couponCode={voucherModalCampaign.coupon_code || ''}
                  familyName={familyName}
                  templateConfig={(voucherModalCampaign.card_template_config as unknown as CardTemplateConfig) || {}}
                  scale={1.05}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between w-full pt-1 gap-2">
                <CampaignCardExporter
                  cardRef={modalCardRef}
                  fileName={`voucher-${voucherModalCampaign.coupon_code || 'asfanu'}`}
                />

                {voucherModalCampaign.subscription_id && (
                  <Button
                    size="sm"
                    disabled={sendingModalEmail}
                    onClick={handleModalSendEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-9 px-4 shadow-sm"
                  >
                    {sendingModalEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{sendingModalEmail ? 'Se trimite...' : 'Trimite pe Email'}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
