export function RoseLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <>
      <img
        src="/logo/logo-light.png"
        alt="RoseApp"
        className={`${className} dark:hidden`}
      />
      <img
        src="/logo/logo-dark.png"
        alt="RoseApp"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
