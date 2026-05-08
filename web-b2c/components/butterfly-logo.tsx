interface Props {
  size?: number;
  className?: string;
}

export function ButterflyLogo({ size = 20, className = "" }: Props) {
  return (
    <img
      src="/asset/logo.jpg"
      alt="Butterfly Fashion Trading logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
