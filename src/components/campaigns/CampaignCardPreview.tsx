'use client';

import * as React from 'react';

export interface CardTemplateConfig {
  mode?: 'gradient' | 'custom_image';
  bg_gradient_from?: string;
  bg_gradient_to?: string;
  text_color?: string;
  accent_color?: string;
  layout?: string;
  card_background_url?: string | null;

  coupon_code_x?: number;
  coupon_code_y?: number;
  coupon_code_font_size?: number;
  coupon_code_color?: string;
  coupon_code_bg?: string;

  show_family_name?: boolean;
  family_name_x?: number;
  family_name_y?: number;
  family_name_font_size?: number;
  family_name_color?: string;

  show_issued_date?: boolean;
  issued_date_x?: number;
  issued_date_y?: number;
  issued_date_font_size?: number;
  issued_date_color?: string;
}

export interface CampaignCardPreviewProps {
  familyName: string;
  couponCode: string;
  discountPercentage: number;
  campaignName: string;
  templateConfig: CardTemplateConfig;
  /** Scale factor for large editor preview (default 1) */
  scale?: number;
  /** Ref for capturing as image via html2canvas */
  cardRef?: React.Ref<HTMLDivElement>;
  /** Whether to render dynamic overlays (family name, coupon code, date). Default true. */
  renderOverlays?: boolean;
}

const DEFAULT_CONFIG: CardTemplateConfig = {
  mode: 'gradient',
  bg_gradient_from: '#4f46e5',
  bg_gradient_to: '#7c3aed',
  text_color: '#ffffff',
  accent_color: '#fbbf24',
  layout: 'default',
  card_background_url: null,

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

  show_issued_date: true,
  issued_date_x: 88,
  issued_date_y: 93.5,
  issued_date_font_size: 9,
  issued_date_color: '#ffffff',
};

export function CampaignCardPreview({
  familyName,
  couponCode,
  discountPercentage,
  campaignName,
  templateConfig,
  scale = 1,
  cardRef,
  renderOverlays = true,
}: CampaignCardPreviewProps) {
  const config = { ...DEFAULT_CONFIG, ...templateConfig };
  const width = Math.round(428 * scale);
  const height = Math.round(270 * scale);
  const borderRadius = Math.round(16 * scale);

  const hasCouponBg =
    config.coupon_code_bg &&
    config.coupon_code_bg !== 'transparent' &&
    config.coupon_code_bg !== 'none';

  const isCouponCentered = Math.abs((config.coupon_code_x ?? 50) - 50) < 3;
  const isFamilyCentered = Math.abs((config.family_name_x ?? 50) - 50) < 3;

  if (config.mode === 'custom_image' && config.card_background_url) {
    return (
      <div
        ref={cardRef}
        data-card-export="true"
        className="relative overflow-hidden select-none shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${borderRadius}px`,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          backgroundImage: `url("${config.card_background_url}")`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dynamic Overlays (Only rendered when subscribed or renderOverlays is true) */}
        {renderOverlays && (() => {
          const couponFontSizePx = (config.coupon_code_font_size || 15) * scale;
          const couponPaddingY = hasCouponBg ? 3 * scale : 0;
          const couponTotalHeightPx = couponFontSizePx * 1.2 + couponPaddingY * 2;
          const couponHalfHeightPx = couponTotalHeightPx / 2;

          const familyFontSizePx = (config.family_name_font_size || 11) * scale;
          const familyTotalHeightPx = familyFontSizePx * 1.2;
          const familyHalfHeightPx = familyTotalHeightPx / 2;

          return (
            <>
              {/* Dynamic Coupon Code Overlay */}
              <div
                className="absolute z-10 text-center pointer-events-none flex justify-center items-center"
                style={
                  isCouponCentered
                    ? {
                        left: 0,
                        right: 0,
                        width: '100%',
                        top: `${config.coupon_code_y ?? 70.0}%`,
                        marginTop: `-${couponHalfHeightPx}px`,
                      }
                    : {
                        left: `${config.coupon_code_x ?? 49.5}%`,
                        top: `${config.coupon_code_y ?? 70.0}%`,
                        marginTop: `-${couponHalfHeightPx}px`,
                        transform: 'translateX(-50%)',
                      }
                }
              >
                <div
                  className={`inline-block font-black tracking-wider ${hasCouponBg ? 'shadow-sm' : ''}`}
                  style={{
                    backgroundColor: hasCouponBg ? config.coupon_code_bg : 'transparent',
                    color: config.coupon_code_color || '#ffffff',
                    fontSize: `${couponFontSizePx}px`,
                    paddingLeft: hasCouponBg ? `${14 * scale}px` : '0px',
                    paddingRight: hasCouponBg ? `${14 * scale}px` : '0px',
                    paddingTop: hasCouponBg ? `${3 * scale}px` : '0px',
                    paddingBottom: hasCouponBg ? `${3 * scale}px` : '0px',
                    borderRadius: hasCouponBg ? `${6 * scale}px` : '0px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    lineHeight: '1.2',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}
                >
                  {couponCode}
                </div>
              </div>

              {/* Dynamic Family Name Overlay */}
              {config.show_family_name !== false && (
                <div
                  className="absolute z-10 text-center font-bold tracking-wide pointer-events-none whitespace-nowrap"
                  style={
                    isFamilyCentered
                      ? {
                          left: 0,
                          right: 0,
                          width: '100%',
                          top: `${config.family_name_y ?? 76.5}%`,
                          marginTop: `-${familyHalfHeightPx}px`,
                          fontSize: `${familyFontSizePx}px`,
                          color: config.family_name_color || '#ffffff',
                          lineHeight: '1.2',
                          margin: 0,
                        }
                      : {
                          left: `${config.family_name_x ?? 50}%`,
                          top: `${config.family_name_y ?? 76.5}%`,
                          marginTop: `-${familyHalfHeightPx}px`,
                          transform: 'translateX(-50%)',
                          fontSize: `${familyFontSizePx}px`,
                          color: config.family_name_color || '#ffffff',
                          lineHeight: '1.2',
                          margin: 0,
                        }
                  }
                >
                  {familyName}
                </div>
              )}
            </>
          );
        })()}
      </div>
    );
  }

  // Fallback: Gradient Procedural Card
  return (
    <div
      ref={cardRef}
      data-card-export="true"
      className="relative overflow-hidden select-none shadow-xl transition-all"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: `linear-gradient(135deg, ${config.bg_gradient_from} 0%, ${config.bg_gradient_to} 100%)`,
        borderRadius: `${borderRadius}px`,
        color: config.text_color,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
        style={{ background: config.accent_color }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
        style={{ background: config.accent_color }}
      />
      <div
        className="absolute top-1/2 right-8 w-24 h-24 rounded-full opacity-[0.07]"
        style={{ background: config.text_color }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Top section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                style={{
                  background: `${config.text_color}20`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                A
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-80">
                ASFANU Card
              </span>
            </div>
            <p className="text-[10px] opacity-60 mt-1 max-w-[200px] truncate">
              {campaignName}
            </p>
          </div>

          {/* Discount badge */}
          <div
            className="rounded-xl px-3 py-1.5 font-black text-xl leading-none shadow-sm"
            style={{
              background: config.accent_color,
              color: config.bg_gradient_from,
            }}
          >
            -{discountPercentage}%
          </div>
        </div>

        {/* Middle — Coupon code */}
        {renderOverlays ? (
          <div className="text-center -mt-1">
            <div
              className="inline-block rounded-xl px-5 py-2.5 shadow-sm"
              style={{
                background: `${config.text_color}12`,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${config.text_color}20`,
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 mb-1">
                Cod Cupon
              </p>
              <p
                className="text-2xl font-black tracking-wider"
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: '0.12em',
                }}
              >
                {couponCode}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center opacity-40 italic text-xs">
            Voucher Necalibrat
          </div>
        )}

        {/* Bottom section */}
        <div className="flex items-end justify-between">
          {renderOverlays ? (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] opacity-50">
                Titular
              </p>
              <p className="text-sm font-bold mt-0.5">
                {familyName}
              </p>
            </div>
          ) : (
            <div className="text-xs font-semibold opacity-60">
              Înscrieți familia pentru activare
            </div>
          )}
        </div>
      </div>

      {/* Subtle watermark */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-[0.3em] opacity-20 pointer-events-none"
      >
        Card de Reducere ASFANU
      </div>
    </div>
  );
}
