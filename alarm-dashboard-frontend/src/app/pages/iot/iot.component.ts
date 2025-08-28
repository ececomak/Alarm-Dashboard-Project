import { Component, OnDestroy } from '@angular/core';

type GlossaryItem = { term: string; def: string; tags?: string[] };
type Checklist = { title: string; steps: string[] };
type FAQ = { q: string; a: string };

@Component({
  selector: 'app-iot',
  standalone: false,
  templateUrl: './iot.html',
  styleUrls: ['./iot.css'],
})
export class IotComponent implements OnDestroy {
  // ---- fun facts ----
  funFacts: string[] = [
    'Kritik alarmın %72’si ilk 10 dakika içinde kapatılır.',
    'Fan arızalarının %60’ı planlı bakımdan sonraki 48 saat içinde görünür.',
    'ACK verilen alarmların yaklaşık %85’i aynı vardiyada “Resolved” olur.',
    'En sık görülen iki alarm: FAN_RPM_LOW ve SENSOR_FAULT.',
    'Snooze pencereleri, yanlış pozitif toastrları yaklaşık %40 azaltır.',
  ];
  factIdx = 0;
  private factTick?: any;

  // ---- glossary ----
  query = '';
  glossary: GlossaryItem[] = [
    {
      term: 'ACK (Onaylandı)',
      def: 'Alarm görüldü ve bir operatör sorumluluğu aldı. Bu, sorunun çözüldüğü anlamına gelmez.',
      tags: ['alarm', 'operasyon'],
    },
    {
      term: 'Resolved / Clear',
      def: 'Kök neden giderildi, alarm kapandı ve durum normale döndü.',
      tags: ['alarm'],
    },
    {
      term: 'Heartbeat',
      def: 'Cihazın/servisin “canlı” olduğunu bildiren periyodik sinyal.',
      tags: ['telemetri'],
    },
    {
      term: 'Fan RPM Low',
      def: 'Fan beklenenden düşük devirde. Isınma/performans riski taşır.',
      tags: ['donanım', 'kritik'],
    },
    {
      term: 'Sensor Fault',
      def: 'Sensörden veri alınamıyor veya değerler tutarsız.',
      tags: ['sensör'],
    },
    {
      term: 'Bakım Penceresi',
      def: 'Planlı bakım aralığı. Bu süre boyunca ilgili alarmlar sessize alınabilir.',
      tags: ['bakım'],
    },
    {
      term: 'SLA',
      def: 'Hizmet seviyesi taahhüdü (ör. %99,9 erişilebilirlik).',
      tags: ['sözleşme'],
    },
    {
      term: 'Ağ Geçidi (Gateway)',
      def: 'Sahadaki sensörler ile merkezi sistem arasındaki köprü.',
      tags: ['altyapı'],
    },
    {
      term: 'Tünel',
      def: 'Bu projede izlenen ana varlık grubu; bir tünel birden çok cihaz içerir.',
      tags: ['envanter'],
    },
  ];
  get filteredGlossary(): GlossaryItem[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.glossary;
    return this.glossary.filter(g =>
      g.term.toLowerCase().includes(q) ||
      g.def.toLowerCase().includes(q) ||
      (g.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // ---- SOP ----
  checklists: Checklist[] = [
    {
      title: 'Kritik alarm geldiğinde',
      steps: [
        'Alarmı ACK ile üzerine al.',
        'İlgili cihazı/point’i doğrula; son 10 dakikalık akışı kontrol et.',
        'Bakım penceresi aktif mi? Aktifse muting notlarını incele.',
        'Kök nedeni sınıfla: güç / fan / ağ / sensör.',
        'Gerekirse ekibe eskale et ve açıklama notu bırak.',
      ],
    },
    {
      title: 'Bakım öncesi',
      steps: [
        'Sihirbazdan bilet oluştur; süreyi belirle (örn. 60 dk).',
        'Oluşan “scheduled mute” kaydını doğrula.',
        'Etkilenecek kapsamı ve geri alma (rollback) planını yaz.',
        'Bakım başlangıç notunu ekle.',
      ],
    },
    {
      title: 'Bakım sonrası',
      steps: [
        '“Muted by ticket” uyarısının kalktığını doğrula.',
        'Açık alarm kaldıysa çöz ve “Resolved” notu ekle.',
        'Bileti “Done” yap ve kısa özet bırak.',
      ],
    },
  ];

  // ---- SSS ----
  faqs: FAQ[] = [
    {
      q: '“Muted by ticket” ne demek?',
      a: 'Sihirbazda açtığın etkin bakım penceresiyle eşleşen alarmlar, pencere bitene kadar yerelde bastırılır. Veri kaybı olmaz; sadece gürültü azaltılır.',
    },
    {
      q: 'ACK ile Resolved arasındaki fark nedir?',
      a: 'ACK görmek/üzerine almak demektir; Resolved ise kök neden giderilip alarmın kapanmasıdır.',
    },
    {
      q: '10 dk canlı akış dışında nasıl arama yaparım?',
      a: 'Forms → Alarm Filter sayfasında “Live” kapatılır, tarih aralığı seçilerek 35 günlük arşivde filtreleme yapılır.',
    },
  ];

  constructor() {
    this.factTick = setInterval(() => {
      this.factIdx = (this.factIdx + 1) % this.funFacts.length;
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.factTick) clearInterval(this.factTick);
  }

  nextFact() {
    this.factIdx = (this.factIdx + 1) % this.funFacts.length;
  }

  copy(term: string, def: string) {
    const txt = `${term}: ${def}`;
    navigator.clipboard?.writeText(txt).catch(() => {});
  }
}