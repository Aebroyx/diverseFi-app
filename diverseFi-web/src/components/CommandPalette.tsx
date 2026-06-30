'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/shadcn/command';
import {
  UserIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ArrowRightIcon,
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  FolderIcon,
  DocumentIcon,
  ChartBarIcon,
  CubeIcon,
  BellIcon,
  CalendarIcon,
  InboxIcon,
  TagIcon,
  BookmarkIcon,
  GlobeAltIcon,
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  CommandLineIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  AdjustmentsHorizontalIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ArchiveBoxIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  KeyIcon,
  FingerPrintIcon,
  EyeIcon,
  LinkIcon,
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
  CloudIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  HeartIcon,
  StarIcon,
  FlagIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  GiftIcon,
  CakeIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  TrophyIcon,
  AcademicCapIcon,
  BeakerIcon,
  BriefcaseIcon,
  CalculatorIcon,
  NewspaperIcon,
  IdentificationIcon,
  QrCodeIcon,
  ScissorsIcon,
  PaintBrushIcon,
  SwatchIcon,
  CursorArrowRaysIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  ListBulletIcon,
  QueueListIcon,
  RectangleStackIcon,
  WindowIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useGetUserMenus } from '@/hooks/useMenu';
import { MenuWithPermissions } from '@/services/menuService';

// Icon mapping (same as Sidebar)
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  home: HomeIcon,
  dashboard: HomeIcon,
  users: UsersIcon,
  'users-management': UsersIcon,
  'user-group': UserGroupIcon,
  shield: ShieldCheckIcon,
  'shield-check': ShieldCheckIcon,
  roles: ShieldCheckIcon,
  'roles-management': ShieldCheckIcon,
  squares: Squares2X2Icon,
  'squares-2-x-2': Squares2X2Icon,
  'squares2x2': Squares2X2Icon,
  menu: Squares2X2Icon,
  'menus-management': Squares2X2Icon,
  cog: Cog6ToothIcon,
  settings: Cog6ToothIcon,
  configurations: Cog6ToothIcon,
  config: Cog6ToothIcon,
  wrench: WrenchIcon,
  folder: FolderIcon,
  document: DocumentIcon,
  chart: ChartBarIcon,
  'chart-bar': ChartBarIcon,
  analytics: PresentationChartLineIcon,
  cube: CubeIcon,
  bell: BellIcon,
  notifications: BellIcon,
  calendar: CalendarIcon,
  inbox: InboxIcon,
  tag: TagIcon,
  bookmark: BookmarkIcon,
  globe: GlobeAltIcon,
  server: ServerIcon,
  database: CircleStackIcon,
  cpu: CpuChipIcon,
  terminal: CommandLineIcon,
  code: CodeBracketIcon,
  puzzle: PuzzlePieceIcon,
  adjustments: AdjustmentsHorizontalIcon,
  building: BuildingOfficeIcon,
  office: BuildingOfficeIcon,
  clipboard: ClipboardDocumentListIcon,
  presentation: PresentationChartLineIcon,
  cart: ShoppingCartIcon,
  'shopping-cart': ShoppingCartIcon,
  credit: CreditCardIcon,
  'credit-card': CreditCardIcon,
  money: BanknotesIcon,
  receipt: ReceiptPercentIcon,
  archive: ArchiveBoxIcon,
  truck: TruckIcon,
  delivery: TruckIcon,
  location: MapPinIcon,
  pin: MapPinIcon,
  phone: PhoneIcon,
  email: EnvelopeIcon,
  envelope: EnvelopeIcon,
  chat: ChatBubbleLeftRightIcon,
  message: ChatBubbleLeftRightIcon,
  help: QuestionMarkCircleIcon,
  question: QuestionMarkCircleIcon,
  info: InformationCircleIcon,
  lock: LockClosedIcon,
  security: LockClosedIcon,
  key: KeyIcon,
  fingerprint: FingerPrintIcon,
  eye: EyeIcon,
  view: EyeIcon,
  link: LinkIcon,
  attachment: PaperClipIcon,
  photo: PhotoIcon,
  image: PhotoIcon,
  video: VideoCameraIcon,
  music: MusicalNoteIcon,
  microphone: MicrophoneIcon,
  speaker: SpeakerWaveIcon,
  audio: SpeakerWaveIcon,
  print: PrinterIcon,
  printer: PrinterIcon,
  computer: ComputerDesktopIcon,
  desktop: ComputerDesktopIcon,
  mobile: DevicePhoneMobileIcon,
  wifi: WifiIcon,
  signal: SignalIcon,
  cloud: CloudIcon,
  download: ArrowDownTrayIcon,
  upload: ArrowUpTrayIcon,
  refresh: ArrowPathIcon,
  sync: ArrowPathIcon,
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  forward: ForwardIcon,
  backward: BackwardIcon,
  heart: HeartIcon,
  favorite: HeartIcon,
  star: StarIcon,
  rating: StarIcon,
  flag: FlagIcon,
  fire: FireIcon,
  hot: FireIcon,
  bolt: BoltIcon,
  lightning: BoltIcon,
  sparkles: SparklesIcon,
  magic: SparklesIcon,
  sun: SunIcon,
  light: SunIcon,
  moon: MoonIcon,
  dark: MoonIcon,
  bulb: LightBulbIcon,
  idea: LightBulbIcon,
  rocket: RocketLaunchIcon,
  launch: RocketLaunchIcon,
  gift: GiftIcon,
  cake: CakeIcon,
  smile: FaceSmileIcon,
  emoji: FaceSmileIcon,
  like: HandThumbUpIcon,
  thumbup: HandThumbUpIcon,
  trophy: TrophyIcon,
  award: TrophyIcon,
  academic: AcademicCapIcon,
  education: AcademicCapIcon,
  graduation: AcademicCapIcon,
  beaker: BeakerIcon,
  science: BeakerIcon,
  lab: BeakerIcon,
  briefcase: BriefcaseIcon,
  work: BriefcaseIcon,
  job: BriefcaseIcon,
  calculator: CalculatorIcon,
  math: CalculatorIcon,
  news: NewspaperIcon,
  newspaper: NewspaperIcon,
  article: NewspaperIcon,
  id: IdentificationIcon,
  identification: IdentificationIcon,
  qr: QrCodeIcon,
  qrcode: QrCodeIcon,
  scissors: ScissorsIcon,
  cut: ScissorsIcon,
  brush: PaintBrushIcon,
  paint: PaintBrushIcon,
  swatch: SwatchIcon,
  color: SwatchIcon,
  cursor: CursorArrowRaysIcon,
  pointer: CursorArrowRaysIcon,
  columns: ViewColumnsIcon,
  table: TableCellsIcon,
  list: ListBulletIcon,
  queue: QueueListIcon,
  stack: RectangleStackIcon,
  layers: RectangleStackIcon,
  window: WindowIcon,
};

function getIconComponent(iconName: string | undefined): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  if (!iconName) return Squares2X2Icon;
  let normalizedName = iconName.replace(/Icon$/i, '');
  normalizedName = normalizedName.replace(/([a-z])([A-Z])/g, '$1-$2');
  normalizedName = normalizedName.toLowerCase().replace(/[_\s]/g, '-');
  return iconMap[normalizedName] || Squares2X2Icon;
}

// Flatten menu tree to get all menus with paths
function flattenMenus(menus: MenuWithPermissions[], parentPath: string[] = []): { menu: MenuWithPermissions; breadcrumb: string[] }[] {
  const result: { menu: MenuWithPermissions; breadcrumb: string[] }[] = [];

  for (const menu of menus) {
    const currentPath = [...parentPath, menu.name];

    // Only add if user has read permission and menu has a valid, non-empty path
    if (menu.permissions.can_read && menu.path && menu.path.trim() !== '') {
      result.push({ menu, breadcrumb: currentPath });
    }

    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children, currentPath));
    }
  }

  return result;
}

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: userMenus } = useGetUserMenus();
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(debouncedSearch);

  // Flatten menus for navigation
  const flatMenus = useMemo(() => {
    if (!userMenus) return [];
    return flattenMenus(userMenus);
  }, [userMenus]);

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!search.trim()) return flatMenus;
    const lowerSearch = search.toLowerCase();
    return flatMenus.filter(
      ({ menu, breadcrumb }) =>
        menu.name.toLowerCase().includes(lowerSearch) ||
        menu.path.toLowerCase().includes(lowerSearch) ||
        breadcrumb.join(' ').toLowerCase().includes(lowerSearch)
    );
  }, [flatMenus, search]);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setSearch('');
    router.push(path);
  }, [router, setOpen]);

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const hasApiResults = searchResults && (
    searchResults.users.length > 0 ||
    searchResults.roles.length > 0 ||
    searchResults.menus.length > 0
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      showCloseButton={false}
      className="max-w-2xl"
      title="Search"
      description="Search navigation and records"
    >
      <Command shouldFilter={false} loop className="rounded-xl">
        <CommandInput
          placeholder="Search..."
          value={search}
          onValueChange={setSearch}
          autoFocus
        />

        <CommandList className="max-h-96">
          {isSearching && debouncedSearch.length >= 3 && (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          )}

          {search && filteredNavItems.length === 0 && !hasApiResults && !isSearching && (
            <CommandEmpty>No results found for &quot;{search}&quot;</CommandEmpty>
          )}

          {filteredNavItems.length > 0 && (
            <CommandGroup heading="Navigation">
              {filteredNavItems.map(({ menu, breadcrumb }) => {
                const IconComponent = getIconComponent(menu.icon);
                return (
                  <CommandItem
                    key={`nav-${menu.id}`}
                    value={`nav-${menu.path}`}
                    onSelect={() => handleSelect(menu.path)}
                  >
                    <IconComponent className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1">{menu.name}</span>
                    {breadcrumb.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {breadcrumb.slice(0, -1).join(' / ')}
                      </span>
                    )}
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {searchResults && searchResults.users.length > 0 && (
            <CommandGroup heading="Users">
              {searchResults.users.map((user) => (
                <CommandItem
                  key={`user-${user.id}`}
                  value={`user-${user.id}`}
                  onSelect={() => handleSelect(`/users-management/${user.id}`)}
                >
                  <UserIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults && searchResults.roles.length > 0 && (
            <CommandGroup heading="Roles">
              {searchResults.roles.map((role) => (
                <CommandItem
                  key={`role-${role.id}`}
                  value={`role-${role.id}`}
                  onSelect={() => handleSelect(`/roles-management/${role.id}`)}
                >
                  <ShieldCheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{role.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{role.name}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults && searchResults.menus.length > 0 && (
            <CommandGroup heading="Menus">
              {searchResults.menus.map((menu) => (
                <CommandItem
                  key={`menu-${menu.id}`}
                  value={`menu-${menu.id}`}
                  onSelect={() => handleSelect(`/menus-management/${menu.id}`)}
                >
                  <Squares2X2Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{menu.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{menu.path}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">K</kbd>
            <span className="ml-1">to toggle</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">↑↓</kbd>
            <span>to navigate</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">↵</kbd>
            <span>to select</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
