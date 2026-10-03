import Svg, { Circle, Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Circle cx="46" cy="44" r="26" stroke="#C64C32" strokeWidth="3" opacity={0.45} strokeDasharray="7 8" strokeLinecap="round" />
      <Circle cx="46" cy="44" r="38" stroke="#C64C32" strokeWidth="2.5" opacity={0.25} />
      <Circle cx="72" cy="44" r="4.5" fill="#C64C32" opacity={0.75} />
      <Circle cx="46" cy="6" r="3.5" fill="#C64C32" opacity={0.5} />
      <Circle cx="20" cy="70" r="3" fill="#C64C32" opacity={0.4} />
      <Circle cx="46" cy="44" r="15" stroke="#C64C32" strokeWidth="7" />
      <Path d="M57 55 L74 72" stroke="#C64C32" strokeWidth="8" strokeLinecap="round" />
      <Path d="M39 44 L44 49 L53 38" stroke="#C64C32" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
