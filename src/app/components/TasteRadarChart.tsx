import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { TasteProfile } from '../types';

interface TasteRadarChartProps {
  tasteProfile: TasteProfile;
  size?: 'small' | 'medium' | 'large';
}

export function TasteRadarChart({ tasteProfile, size = 'medium' }: TasteRadarChartProps) {
  const data = [
    { id: 'sweetness', taste: '甘味', value: tasteProfile.sweetness },
    { id: 'sourness', taste: '酸味', value: tasteProfile.sourness },
    { id: 'bitterness', taste: '苦味', value: tasteProfile.bitterness },
    { id: 'umami', taste: '旨味', value: tasteProfile.umami },
    { id: 'saltiness', taste: '塩味', value: tasteProfile.saltiness },
    { id: 'richness', taste: '濃厚さ', value: tasteProfile.richness },
    { id: 'aroma', taste: '香り', value: tasteProfile.aroma }
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
