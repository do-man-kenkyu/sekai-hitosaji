import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { TasteProfile } from '../types';
import { Language, t } from '../i18n/translations';

interface TasteRadarChartProps {
  tasteProfile: TasteProfile;
  size?: 'small' | 'medium' | 'large';
  language?: Language;
}

export function TasteRadarChart({ tasteProfile, size = 'medium', language = 'ja' }: TasteRadarChartProps) {
  const data = [
    { id: 'sweetness', taste: t(language, 'sweetness'), value: tasteProfile.sweetness },
    { id: 'sourness', taste: t(language, 'sourness'), value: tasteProfile.sourness },
    { id: 'bitterness', taste: t(language, 'bitterness'), value: tasteProfile.bitterness },
    { id: 'umami', taste: t(language, 'umami'), value: tasteProfile.umami },
    { id: 'saltiness', taste: t(language, 'saltiness'), value: tasteProfile.saltiness },
    { id: 'richness', taste: t(language, 'richness'), value: tasteProfile.richness },
    { id: 'aroma', taste: t(language, 'aroma'), value: tasteProfile.aroma }
  ];

  const sizeMap = {
    small: 150,
    medium: 250,
    large: 350
  };

  return (
    <ResponsiveContainer width="100%" height={sizeMap[size]}>
      <RadarChart data={data}>
        <PolarGrid key="polar-grid" />
        <PolarAngleAxis key="polar-angle" dataKey="taste" />
        <PolarRadiusAxis key="polar-radius" angle={90} domain={[0, 5]} />
        <Radar
          key="radar-data"
          name="味覚プロファイル"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
