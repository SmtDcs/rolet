"use client";

import React from "react";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

export function EconomySection() {
  return (
    <section id="economy" className="py-20 md:py-28 border-b border-[#2b2016] bg-[#090705] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ParchmentSeal label="Sürdürülebilir Ekonomi" sublabel="90 / 5 / 5 Modeli" variant="gold" />
          <h2 className="font-['Cinzel_Decorative',serif] text-3xl sm:text-4xl font-bold tracking-tight text-[#f5ecd8] mt-4 mb-4">
            KASANIN MATEMATİĞİ & ŞEFFAFLIK
          </h2>
          <p className="font-['Cinzel',serif] text-sm sm:text-base text-[#b8a68f] leading-relaxed">
            Enflasyonist sahte tokenlar yok. Her kuruş doğrudan Solana Devnet üzerinde SOL cinsinden döner. 
            Masanın geliri kazanan oyunculara maksimum ödül sağlayacak şekilde paylaştırılmıştır.
          </p>
        </div>

        {/* 90 / 5 / 5 Split Visual Bar & Cards */}
        <div className="rounded-sm border border-[#3b2b1d] bg-gradient-to-b from-[#140e0a] to-[#0a0705] p-8 md:p-10 mb-12 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <span className="font-['Cinzel',serif] text-base uppercase tracking-widest text-[#f5ecd8] font-bold">
              Giriş Ücreti & Karakter Geliri Dağılımı
            </span>
            <span className="text-xs font-['Space_Mono',monospace] text-[#52c41a]">
              ● Akıllı Sözleşme Garantisi (Smart Contract Verified)
            </span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="w-full h-8 rounded-sm overflow-hidden flex border border-[#4d3827] mb-8 shadow-inner">
            <div
              style={{ width: "90%" }}
              className="bg-gradient-to-r from-[#2a683e] to-[#389e58] flex items-center justify-center text-xs font-bold text-white font-['Space_Mono',monospace] tracking-wider"
              title="90% Kazanan Hazine Kasası"
            >
              %90 Hazine Kasası (Ödül Havuzu)
            </div>
            <div
              style={{ width: "5%" }}
              className="bg-gradient-to-r from-[#8c6d31] to-[#c6a15b] flex items-center justify-center text-[10px] font-bold text-black font-['Space_Mono',monospace]"
              title="5% Sigorta Fonu"
            >
              %5
            </div>
            <div
              style={{ width: "5%" }}
              className="bg-gradient-to-r from-[#4d2118] to-[#7a2e20] flex items-center justify-center text-[10px] font-bold text-white font-['Space_Mono',monospace]"
              title="5% Operasyon / Ekip"
            >
              %5
            </div>
          </div>

          {/* 3 Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-sm border border-[#2e5e3a]/60 bg-[#0d1c12]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel',serif] text-sm font-bold text-[#73d13d]">
                  %90 Hazine Kasası
                </span>
                <span className="text-xs font-['Space_Mono',monospace] text-[#52c41a]">GameVault PDA</span>
              </div>
              <p className="font-['Cinzel',serif] text-xs text-[#a3bfa9] leading-relaxed">
                Her karakter alımının ve lobi bahsinin tam %90'ı doğrudan Solana Hazine Kasası'nda birikir. Kazanan oyuncu masadan <strong>neredeyse iki katı (+%80 net getiri)</strong> ödülle ayrılır.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#c6a15b]/40 bg-[#1f1910]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel',serif] text-sm font-bold text-[#e5c378]">
                  %5 Sigorta Fonu
                </span>
                <span className="text-xs font-['Space_Mono',monospace] text-[#c6a15b]">Safety Reserve</span>
              </div>
              <p className="font-['Cinzel',serif] text-xs text-[#c4b59d] leading-relaxed">
                Beklenmedik ağ kesintileri, anlaşmazlık tazminatları ve ilerideki yüksek bahisli turnuva jackpot'ları için kilitlenen protokol güvencesi rezervidir.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#7a2e20]/40 bg-[#1c0f0c]/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel',serif] text-sm font-bold text-[#ff7875]">
                  %5 Operasyon & Ekip
                </span>
                <span className="text-xs font-['Space_Mono',monospace] text-[#ff4d4f]">Ops Wallet</span>
              </div>
              <p className="font-['Cinzel',serif] text-xs text-[#cfa8a2] leading-relaxed">
                Yüksek hızlı RPC sunucuları, MagicBlock ER entegrasyonu ve projenin sürekli bakımı için ayrılan adil platform komisyonudur.
              </p>
            </div>
          </div>
        </div>

        {/* ───── Provably Fair Commit-Reveal Explainer ───── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="p-8 rounded-sm border border-[#3b2b1d] bg-[#110c08]">
            <span className="text-[11px] font-['Space_Mono',monospace] text-[#52c41a] uppercase tracking-wider">
              ● Kriptografik Rastgelelik
            </span>
            <h3 className="font-['Cinzel_Decorative',serif] text-2xl font-bold text-[#f5ecd8] mt-2 mb-4">
              COMMIT-REVEAL HİLESİZLİK GARANTİSİ
            </h3>
            <p className="font-['Cinzel',serif] text-xs sm:text-sm text-[#a68e72] leading-relaxed mb-4">
              Kumarhanelerin "arka kapı" hileleri ROLET'te teknik olarak imkânsızdır. Ne ev sahibi (Host), ne misafir (Guest), ne de geliştirici ekip mermilerin sırasını önceden bilemez veya değiştiremez.
            </p>
            <ul className="space-y-2 text-xs font-['Space_Mono',monospace] text-[#d6c4ad]">
              <li className="flex items-center gap-2">
                <span className="text-[#c6a15b]">1.</span> Host kendi gizli tohumunu kilitler (`host_commit`).
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#c6a15b]">2.</span> Guest kendi bağımsız tohumunu kilitler (`guest_commit`).
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#c6a15b]">3.</span> Maç başında iki tohum + `slot_hashes` harmanlanarak revolver doldurulur.
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-sm border border-[#3b2b1d] bg-[#110c08]">
            <span className="text-[11px] font-['Space_Mono',monospace] text-[#c6a15b] uppercase tracking-wider">
              ● FOCG (Fully On-Chain Gaming)
            </span>
            <h3 className="font-['Cinzel_Decorative',serif] text-2xl font-bold text-[#f5ecd8] mt-2 mb-4">
              MERKEZİ SUNUCU VE VERİTABANI YOK
            </h3>
            <p className="font-['Cinzel',serif] text-xs sm:text-sm text-[#a68e72] leading-relaxed mb-4">
              Web sitesi kapansa bile oyun Solana üzerinde yaşamaya devam eder. Her lobi, her kart hamlesi ve her tetik çekimi Solana Program Türetilmiş Hesaplarında (PDA) kayıt altındadır.
            </p>
            <div className="bg-[#090705] p-3 rounded-sm border border-[#2b2016] text-[11px] font-['Space_Mono',monospace] text-[#73d13d] break-all">
              Program ID: Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
