import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
}

export function HeroIllustration({ width = 132, height = 104 }: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 132 104" fill="none">
      <Ellipse cx="66" cy="96" rx="52" ry="7" fill="#D8E2D6" />
      <Path d="M18 34 L28 14 H104 L114 34 Z" fill="#C64C32" />
      <Path d="M28 14 L24 34 H38 L41 14 Z" fill="#E88A73" />
      <Path d="M52 14 L51 34 H65 L65 14 Z" fill="#E88A73" />
      <Path d="M78 14 L79 34 H93 L90 14 Z" fill="#E88A73" />
      <Rect x="18" y="34" width="96" height="5" rx="2.5" fill="#A83B25" />
      <Rect x="26" y="39" width="80" height="47" rx="5" fill="#FFFFFF" />
      <Rect x="26" y="39" width="80" height="47" rx="5" stroke="#DDE1D9" strokeWidth="2" />
      <Rect x="36" y="52" width="26" height="20" rx="3" fill="#B47F32" />
      <Path d="M36 55 L49 62 L62 55" stroke="#8A6224" strokeWidth="2.5" fill="none" />
      <Rect x="68" y="58" width="26" height="14" rx="3" fill="#39765F" />
      <Rect x="73" y="54" width="16" height="6" rx="3" fill="#2C5C4A" />
      <Circle cx="97" cy="55" r="17" fill="#E9EFE7" opacity={0.92} />
      <Circle cx="97" cy="55" r="17" stroke="#39765F" strokeWidth="5" />
      <Rect x="108" y="66" width="16" height="6" rx="3" fill="#39765F" transform="rotate(45 108 66)" />
      <Circle cx="97" cy="55" r="6" fill="#FFFFFF" />
    </Svg>
  );
}

export function EmptySearchIllustration({ width = 120, height = 100 }: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 100" fill="none">
      <Ellipse cx="60" cy="90" rx="40" ry="6" fill="#E8EAE4" />
      <Rect x="28" y="22" width="46" height="56" rx="5" fill="#FFFFFF" stroke="#DDE1D9" strokeWidth="2" strokeDasharray="6 5" />
      <Path d="M36 36 H66 M36 46 H60 M36 56 H62" stroke="#E0E4DC" strokeWidth="4" strokeLinecap="round" />
      <G>
        <Circle cx="76" cy="52" r="20" fill="#EFF3EC" />
        <Circle cx="76" cy="52" r="20" stroke="#39765F" strokeWidth="5" />
        <Rect x="90" y="66" width="20" height="7" rx="3.5" fill="#39765F" transform="rotate(45 90 66)" />
        <Path d="M70 52 L74 56 L82 48" stroke="#C64C32" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

export function EmptyBoxIllustration({ width = 120, height = 100 }: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 100" fill="none">
      <Ellipse cx="60" cy="90" rx="42" ry="6" fill="#E8EAE4" />
      <Path d="M28 48 L60 34 L92 48 L60 62 Z" fill="#C98A5A" />
      <Path d="M28 48 V74 L60 88 V62 Z" fill="#B47F32" />
      <Path d="M92 48 V74 L60 88 V62 Z" fill="#8A6224" />
      <Path d="M28 48 L12 38 L44 26 L60 34 Z" fill="#E0A877" />
      <Path d="M92 48 L108 38 L76 26 L60 34 Z" fill="#D69C6B" />
      <Circle cx="60" cy="18" r="4" fill="#C64C32" />
      <Circle cx="86" cy="12" r="3" fill="#39765F" />
      <Circle cx="34" cy="10" r="2.5" fill="#B47F32" />
    </Svg>
  );
}
