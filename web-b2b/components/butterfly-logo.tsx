export function ButterflyLogo({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/asset/logo.jpg"
      alt="Butterfly Fashion Trading logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
