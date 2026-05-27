
import Logout from '@/components/ui/logout';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NavLinks } from './nav-links';

export default function Header() {
  return (
    <header className="absolute top-0 right-0 flex justify-end items-center p-4 w-full">
      <div className="flex items-center gap-2">
        <NavLinks />
        <Logout />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
