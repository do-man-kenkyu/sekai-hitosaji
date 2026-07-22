import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Condiment } from '../types';
import { Language } from '../i18n/translations';

// 都道府県庁所在地のおおよその緯度経度
const PREFECTURE_COORDS: Record<string, [number, number]> = {
  '北海道': [43.0642, 141.3469], '青森県': [40.8244, 140.7400], '岩手県': [39.7036, 141.1527],
  '宮城県': [38.2688, 140.8721], '秋田県': [39.7186, 140.1024], '山形県': [38.2404, 140.3633],
  '福島県': [37.7503, 140.4676], '茨城県': [36.3418, 140.4468], '栃木県': [36.5658, 139.8836],
  '群馬県': [36.3911, 139.0608], '埼玉県': [35.8570, 139.6489], '千葉県': [35.6047, 140.1233],
  '東京都': [35.6895, 139.6917], '神奈川県': [35.4478, 139.6425], '新潟県': [37.9026, 139.0236],
  '富山県': [36.6953, 137.2113], '石川県': [36.5947, 136.6256], '福井県': [36.0652, 136.2216],
  '山梨県': [35.6642, 138.5684], '長野県': [36.6513, 138.1810], '岐阜県': [35.3912, 136.7223],
  '静岡県': [34.9769, 138.3831], '愛知県': [35.1802, 136.9066], '三重県': [34.7303, 136.5086],
  '滋賀県': [35.0045, 135.8686], '京都府': [35.0116, 135.7681], '大阪府': [34.6937, 135.5023],
  '兵庫県': [34.6913, 135.1830], '奈良県': [34.6851, 135.8048], '和歌山県': [34.2260, 135.1675],
  '鳥取県': [35.5039, 134.2378], '島根県': [35.4723, 133.0505], '岡山県': [34.6618, 133.9350],
  '広島県': [34.3966, 132.4596], '山口県': [34.1859, 131.4714], '徳島県': [34.0658, 134.5593],
  '香川県': [34.3401, 134.0434], '愛媛県': [33.8416, 132.7657], '高知県': [33.5597, 133.5311],
  '福岡県': [33.6064, 130.4183], '佐賀県': [33.2494, 130.2988], '長崎県': [32.7448, 129.8737],
  '熊本県': [32.7898, 130.7417], '大分県': [33.2382, 131.6126], '宮崎県': [31.9111, 131.4239],
  '鹿児島県': [31.5602, 130.5581], '沖縄県': [26.2124, 127.6809],
};

// 海外の産地（国名など）のおおよその緯度経度。日本を中心にしつつ海外ピンも表示する
const OVERSEAS_COORDS: Record<string, [number, number]> = {
  '海外': [13.7563, 100.5018], // 一括「海外」表記の代表点（バンコク付近）
  '中国': [39.9042, 116.4074], '韓国': [37.5665, 126.9780], '台湾': [25.0330, 121.5654],
  'タイ': [13.7563, 100.5018], 'ベトナム': [21.0278, 105.8342], 'インド': [28.6139, 77.2090],
  'インドネシア': [-6.2088, 106.8456], 'マレーシア': [3.1390, 101.6869],
  'フランス': [48.8566, 2.3522], 'イタリア': [41.9028, 12.4964], 'スペイン': [40.4168, -3.7038],
  'イギリス': [51.5074, -0.1278], 'ドイツ': [52.5200, 13.4050], 'ギリシャ': [37.9838, 23.7275],
  'アメリカ': [38.9072, -77.0369], 'メキシコ': [19.4326, -99.1332], 'ブラジル': [-15.7939, -47.8828],
  'トルコ': [39.9334, 32.8597], 'モロッコ': [33.9716, -6.8498], 'エジプト': [30.0444, 31.2357],
};

const JAPAN_CENTER: [number, number] = [37.2, 137.5];
const JAPAN_ZOOM = 5;

// 「東京都（伊豆大島）」「中国（四川）」のような表記から地名の本体を取り出し、座標を返す
function resolveCoords(origin: string): [number, number] | null {
  const base = origin.replace(/[（(].*?[）)]/g, '').trim();
  return PREFECTURE_COORDS[base] ?? OVERSEAS_COORDS[base] ?? null;
}

interface Props {
  condiments: Condiment[];
  language: Language;
  onSelectCondiment: (condiment: Condiment) => void;
}

export function CondimentMap({ condiments, language, onSelectCondiment }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  // ポップアップのクリックで常に最新のコールバックを呼べるよう ref で保持
  const onSelectRef = useRef(onSelectCondiment);
  onSelectRef.current = onSelectCondiment;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: JAPAN_CENTER,
      zoom: JAPAN_ZOOM,
      minZoom: 3,
      maxZoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // 「日本にズームしている状態」に戻すボタン
    const HomeControl = L.Control.extend({
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar');
        btn.innerHTML = language === 'ja' ? '🇯🇵 日本' : '🇯🇵 Japan';
        btn.style.cssText = 'padding:4px 10px;background:#fff;cursor:pointer;font-size:12px;border:none;';
        btn.onclick = () => map.setView(JAPAN_CENTER, JAPAN_ZOOM);
        return btn;
      },
    });
    new HomeControl({ position: 'topright' }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 地域（産地）ごとに調味料をまとめる
    const byOrigin = new Map<string, Condiment[]>();
    condiments.forEach(c => {
      const list = byOrigin.get(c.origin) ?? [];
      list.push(c);
      byOrigin.set(c.origin, list);
    });

    byOrigin.forEach((list, origin) => {
      const coords = resolveCoords(origin);
      if (!coords) return;

      const marker = L.circleMarker(coords, {
        radius: 6 + Math.min(list.length, 10) * 1.5,
        color: '#7c4a1e',
        fillColor: '#c17f3a',
        fillOpacity: 0.75,
        weight: 2,
      }).addTo(map);

      // 同名の調味料は1件にまとめる（代表として最初の投稿を使う）
      const seen = new Set<string>();
      const uniqueCondiments = list.filter(c => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      });

      // ポップアップの中身を DOM で組み立て、各調味料をクリックで詳細へ
      const container = L.DomUtil.create('div');
      container.style.cssText = 'min-width:170px; max-height:220px; overflow-y:auto;';

      const heading = L.DomUtil.create('div', '', container);
      heading.style.cssText = 'font-weight:bold; color:#3d1f00; margin-bottom:6px;';
      heading.textContent = `${origin}（${uniqueCondiments.length}${language === 'ja' ? '種類' : ''}）`;

      const listEl = L.DomUtil.create('div', '', container);
      listEl.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

      uniqueCondiments.forEach(c => {
        const btn = L.DomUtil.create('button', '', listEl);
        btn.textContent = c.name;
        btn.style.cssText = 'text-align:left; background:#fdf5ea; border:1px solid #e2d5c0; border-radius:6px; padding:5px 8px; cursor:pointer; font-size:12px; color:#3d1f00; line-height:1.3;';
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.stop(e);
          map.closePopup();
          onSelectRef.current(c);
        });
      });

      marker.bindPopup(container);
      markersRef.current.push(marker);
    });
  }, [condiments, language]);

  return <div ref={containerRef} className="w-full h-full" />;
}
