export function RoseLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <>
      <img
        src="/logo/logo-light.png"
        alt="Rose Money"
        className={`${className} dark:hidden`}
      />
      <img
        src="/logo/logo-dark.png"
        alt="Rose Money"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
