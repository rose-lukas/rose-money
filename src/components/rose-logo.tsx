export function RoseLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <>
      <img
        src="/logo/logo-light-new.png"
        alt="RoseHome"
        className={`${className} dark:hidden`}
      />
      <img
        src="/logo/logo-dark-new.png"
        alt="RoseHome"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
