'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/shadcn/sheet';
import {
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  FolderIcon,
  DocumentIcon,
  ChartBarIcon,
  CubeIcon,
  CogIcon,
  WrenchIcon,
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
  ExclamationTriangleIcon,
  CheckCircleIcon,
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
  MinusIcon,
  PlusIcon,
  XCircleIcon,
  CubeTransparentIcon,
} from '@heroicons/react/24/outline';
import { useGetUserMenus } from '@/hooks/useMenu';
import { MenuWithPermissions } from '@/services/menuService';
import { SettingsModal } from './modals/SettingsModal';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/features/authSlice';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Icon mapping for dynamic icons
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
  cog: CogIcon,
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
  warning: ExclamationTriangleIcon,
  success: CheckCircleIcon,
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
  phone2: DevicePhoneMobileIcon,
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
  minus: MinusIcon,
  plus: PlusIcon,
  close: XCircleIcon,
  x: XCircleIcon,
};

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Get icon component from icon name
function getIconComponent(iconName: string | undefined): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  if (!iconName) return Squares2X2Icon;

  // Handle both formats: "HomeIcon" and "home"
  // Remove "Icon" suffix if present
  let normalizedName = iconName.replace(/Icon$/i, '');

  // Convert camelCase to kebab-case (e.g., "ShieldCheck" -> "shield-check")
  normalizedName = normalizedName.replace(/([a-z])([A-Z])/g, '$1-$2');

  // Normalize: lowercase, replace spaces/underscores with dashes
  normalizedName = normalizedName.toLowerCase().replace(/[_\s]/g, '-');

  return iconMap[normalizedName] || Squares2X2Icon;
}

interface SidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

interface MenuItemComponentProps {
  menu: MenuWithPermissions;
  pathname: string;
  depth?: number;
  collapsed?: boolean;
  expandedMenus: Set<number>;
  toggleExpanded: (id: number) => void;
  onExpandSidebar?: () => void;
  enableExpandAnimation: boolean;
}

function MenuItemComponent({
  menu,
  pathname,
  depth = 0,
  collapsed = false,
  expandedMenus,
  toggleExpanded,
  onExpandSidebar,
  enableExpandAnimation,
}: MenuItemComponentProps) {
  const hasChildren = menu.children && menu.children.length > 0;
  const isExpanded = expandedMenus.has(menu.id);
  const IconComponent = getIconComponent(menu.icon);

  // Check if current path matches this menu or any of its children
  const isActive = pathname === menu.path || (menu.path && pathname.startsWith(menu.path + '/'));
  const isChildActive = hasChildren && menu.children?.some(child =>
    pathname === child.path || (child.path && pathname.startsWith(child.path + '/'))
  );

  const handleClick = () => {
    if (hasChildren) {
      // If sidebar is collapsed (desktop), expand it so children can be shown.
      if (collapsed && depth === 0) {
        onExpandSidebar?.();
        if (!isExpanded) toggleExpanded(menu.id);
        return;
      }
      toggleExpanded(menu.id);
    }
  };

  // Don't render if user doesn't have read permission
  if (!menu.permissions.can_read) {
    return null;
  }

  const itemClassName = classNames(
    isActive || isChildActive
      ? 'bg-gray-100 dark:bg-hover-bg text-primary border-l-4 border-transparent'
      : 'text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-primary border-l-4 border-transparent',
    'group flex w-full items-center gap-x-3 rounded-lg p-2.5 text-sm font-medium transition-all duration-200',
    depth > 0 ? 'pl-10' : '',
    collapsed && depth === 0 ? 'justify-center' : ''
  );

  const itemContent = (
    <>
      <IconComponent
        aria-hidden="true"
        className={classNames(
          isActive || isChildActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
          'size-5 shrink-0 transition-colors duration-200',
        )}
      />
      <div
        className={classNames(
          'flex min-w-0 flex-1 items-center gap-x-2 overflow-hidden transition-[max-width,opacity] ease-in-out',
          // Animate both expand + collapse (width + fade) for smoother feel.
          collapsed ? 'max-w-0 opacity-0 duration-200' : 'max-w-[40rem] opacity-100 duration-200'
        )}
        aria-hidden={collapsed}
      >
        <span className="flex-1 text-left truncate font-semibold">{menu.name}</span>
        {hasChildren && (
          <ChevronRightIcon
            aria-hidden="true"
            className={classNames(
              'size-4 shrink-0 text-gray-400 transition-transform duration-200',
              isExpanded ? 'rotate-90' : ''
            )}
          />
        )}
      </div>
    </>
  );

  return (
    <li>
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={itemClassName}
          title={collapsed ? menu.name : undefined}
        >
          {itemContent}
        </button>
      ) : menu.path ? (
        <Link
          href={menu.path}
          className={itemClassName}
          title={collapsed ? menu.name : undefined}
        >
          {itemContent}
        </Link>
      ) : (
        <button
          disabled
          className={itemClassName}
          title={collapsed ? menu.name : undefined}
        >
          {itemContent}
        </button>
      )}

      {/* Children */}
      {hasChildren && !collapsed && (
        enableExpandAnimation ? (
          <div
            className={classNames(
              'grid overflow-hidden transition-all duration-300 ease-out',
              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <ul className="mt-1 min-h-0 space-y-1">
              {menu.children?.map((child) => (
                <MenuItemComponent
                  key={child.id}
                  menu={child}
                  pathname={pathname}
                  depth={depth + 1}
                  collapsed={collapsed}
                  expandedMenus={expandedMenus}
                  toggleExpanded={toggleExpanded}
                  onExpandSidebar={onExpandSidebar}
                  enableExpandAnimation={enableExpandAnimation}
                />
              ))}
            </ul>
          </div>
        ) : isExpanded ? (
          <div className="overflow-hidden">
            <ul className="mt-1 space-y-1">
              {menu.children?.map((child) => (
                <MenuItemComponent
                  key={child.id}
                  menu={child}
                  pathname={pathname}
                  depth={depth + 1}
                  collapsed={collapsed}
                  expandedMenus={expandedMenus}
                  toggleExpanded={toggleExpanded}
                  onExpandSidebar={onExpandSidebar}
                  enableExpandAnimation={enableExpandAnimation}
                />
              ))}
            </ul>
          </div>
        ) : null
      )}
    </li>
  );
}

// Build menu tree from flat list
function buildMenuTree(menus: MenuWithPermissions[]): MenuWithPermissions[] {
  // If menus already have children populated, return as-is
  if (menus.some(m => m.children && m.children.length > 0)) {
    return menus.filter(m => !m.parent_id);
  }

  // Build tree from flat list
  const menuMap = new Map<number, MenuWithPermissions>();
  const roots: MenuWithPermissions[] = [];

  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  menus.forEach(menu => {
    const menuItem = menuMap.get(menu.id)!;
    if (menu.parent_id) {
      const parent = menuMap.get(menu.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(menuItem);
      }
    } else {
      roots.push(menuItem);
    }
  });

  return roots;
}

// Filter menus based on search query
function filterMenus(menus: MenuWithPermissions[], query: string): MenuWithPermissions[] {
  if (!query.trim()) return menus;

  const lowerQuery = query.toLowerCase();

  return menus.reduce<MenuWithPermissions[]>((acc, menu) => {
    const matchesName = menu.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = menu.children ? filterMenus(menu.children, query) : [];

    if (matchesName || filteredChildren.length > 0) {
      acc.push({
        ...menu,
        children: filteredChildren.length > 0 ? filteredChildren : menu.children,
      });
    }

    return acc;
  }, []);
}

// Get all menu IDs that match the search or have matching children
function getExpandedMenuIds(menus: MenuWithPermissions[], query: string): Set<number> {
  const ids = new Set<number>();
  if (!query.trim()) return ids;

  const lowerQuery = query.toLowerCase();

  function traverse(menu: MenuWithPermissions, parents: number[]) {
    const matchesName = menu.name.toLowerCase().includes(lowerQuery);
    let hasMatchingChild = false;

    if (menu.children) {
      menu.children.forEach(child => {
        if (traverse(child, [...parents, menu.id])) {
          hasMatchingChild = true;
        }
      });
    }

    if (matchesName || hasMatchingChild) {
      parents.forEach(id => ids.add(id));
      if (hasMatchingChild) {
        ids.add(menu.id);
      }
      return true;
    }

    return false;
  }

  menus.forEach(menu => traverse(menu, []));
  return ids;
}

export function Sidebar({
  sidebarOpen = false,
  setSidebarOpen,
  collapsed = false,
  setCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  const [enableExpandAnimation, setEnableExpandAnimation] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { data: userMenus, isLoading } = useGetUserMenus();

  // Use external collapsed state if provided, otherwise use internal
  const isCollapsed = setCollapsed ? collapsed : internalCollapsed;
  const handleSetCollapsed = setCollapsed || setInternalCollapsed;

  const handleSignOut = async () => {
    try {
      // Call the logout API endpoint to clear HTTP-only cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      // Clear all React Query cache to prevent showing old user's data
      queryClient.clear();

      // After cookies are cleared, update Redux state
      dispatch(logout());
      // Toast success message
      toast.success('Logged out successfully');

      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if the API call fails, we should still clear the local state
      queryClient.clear();
      dispatch(logout());
      router.push('/auth/login');
    }
  };

  // Build menu tree
  const menuTree = useMemo(() => {
    if (!userMenus) return [];
    return buildMenuTree(userMenus);
  }, [userMenus]);

  // Filter menus based on search
  const filteredMenus = useMemo(() => {
    return filterMenus(menuTree, searchQuery);
  }, [menuTree, searchQuery]);

  // Initialize with all parent menus expanded by default
  useEffect(() => {
    if (!userMenus || searchQuery.trim()) return;

    // Get all menu IDs that have children
    const getAllParentIds = (menus: MenuWithPermissions[]): Set<number> => {
      const ids = new Set<number>();

      const traverse = (menu: MenuWithPermissions) => {
        if (menu.children && menu.children.length > 0) {
          ids.add(menu.id);
          menu.children.forEach(child => traverse(child));
        }
      };

      menus.forEach(menu => traverse(menu));
      return ids;
    };

    // Only set on initial load, don't override user's manual toggle state
    setExpandedMenus(prev => {
      if (prev.size === 0) {
        // Avoid "expanding" animation on initial auto-expand (and any remount).
        // We'll enable animations right after the initial state is applied.
        setEnableExpandAnimation(false);
        return getAllParentIds(menuTree);
      }
      return prev;
    });
  }, [userMenus, menuTree, searchQuery]);

  useEffect(() => {
    // Once we have any expanded state (either auto-expanded or user-expanded),
    // allow animations for subsequent manual toggles.
    if (expandedMenus.size > 0) {
      const id = requestAnimationFrame(() => setEnableExpandAnimation(true));
      return () => cancelAnimationFrame(id);
    }
  }, [expandedMenus.size]);

  // Auto-expand menus when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const idsToExpand = getExpandedMenuIds(menuTree, searchQuery);
      setExpandedMenus(idsToExpand);
    }
  }, [searchQuery, menuTree]);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderSidebarContent = (isMobile = false) => (
    <div className={classNames(
      'flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-border-dark bg-background',
      isCollapsed && !isMobile ? 'px-3' : 'px-4',
      'pb-4'
    )}>
      {/* Logo */}
      <div className={classNames(
        'flex h-16 shrink-0 items-center',
        isCollapsed && !isMobile ? 'justify-center' : ''
      )}>
        {isCollapsed && !isMobile ? (
          <div className="relative h-9 w-9">
            <CubeTransparentIcon className="size-9 text-primary" />
          </div>
        ) : (
          <div className="relative h-10 w-auto">
            <span className="text-xl font-bold tracking-tight text-primary">DiverseFi</span>
          </div>
        )}
      </div>

      {/* Search */}
      {(!isCollapsed || isMobile) && (
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-input-bg py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-x-3 p-2">
                    <div className="size-5 rounded bg-gray-200 dark:bg-hover-bg animate-pulse" />
                    {!isCollapsed && <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-hover-bg animate-pulse" />}
                  </div>
                ))}
              </div>
            ) : filteredMenus.length > 0 ? (
              <ul role="list" className="-mx-2 space-y-1">
                {filteredMenus.map((menu) => (
                  <MenuItemComponent
                    key={menu.id}
                    menu={menu}
                    pathname={pathname}
                    collapsed={isCollapsed && !isMobile}
                    expandedMenus={expandedMenus}
                    toggleExpanded={toggleExpanded}
                    onExpandSidebar={() => handleSetCollapsed(false)}
                    enableExpandAnimation={enableExpandAnimation}
                  />
                ))}
              </ul>
            ) : searchQuery ? (
              <div className={classNames(
                'text-center py-8',
                isCollapsed && !isMobile ? 'px-1' : 'px-4'
              )}>
                <MagnifyingGlassIcon className="mx-auto size-8 text-gray-300" />
                {!isCollapsed && (
                  <p className="mt-2 text-sm text-gray-500">No menus found</p>
                )}
              </div>
            ) : (
              <div className={classNames(
                'text-center py-8',
                isCollapsed && !isMobile ? 'px-1' : 'px-4'
              )}>
                <Squares2X2Icon className="mx-auto size-8 text-gray-300" />
                {!isCollapsed && (
                  <p className="mt-2 text-sm text-gray-500">No menus available</p>
                )}
              </div>
            )}
          </li>

          {/* Settings */}
          <li className="mt-auto">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={classNames(
                'group -mx-2 flex w-full items-center rounded-lg p-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-primary transition-colors',
                isCollapsed && !isMobile ? 'justify-center' : 'justify-between'
              )}
              title={isCollapsed && !isMobile ? 'Settings' : undefined}
            >
              <div className={classNames(
                'flex items-center gap-x-3',
                isCollapsed && !isMobile ? '' : ''
              )}>
                <Cog6ToothIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray-400 group-hover:text-primary transition-colors"
                />
                {(!isCollapsed || isMobile) && <span>Settings</span>}
              </div>
            </button>

            {/* Collapse Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => handleSetCollapsed(!isCollapsed)}
                className={classNames(
                  'mt-2 -mx-2 flex w-full items-center rounded-lg p-2.5 text-sm font-medium text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-primary transition-colors',
                  isCollapsed ? 'justify-center' : 'justify-between'
                )}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <div className="flex items-center gap-x-3">
                  {isCollapsed ? (
                    <ChevronDoubleRightIcon className="size-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <>
                      <ChevronDoubleLeftIcon className="size-5 shrink-0" aria-hidden="true" />
                      <span>Minimize</span>
                    </>
                  )}
                </div>
              </button>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet
        open={sidebarOpen}
        onOpenChange={(open) => setSidebarOpen?.(open)}
      >
        <SheetContent
          side="left"
          className="w-full max-w-xs p-0 lg:hidden sm:max-w-xs"
        >
          {renderSidebarContent(true)}
        </SheetContent>
      </Sheet>

      {/* Static sidebar for desktop */}
      <div className={classNames(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300',
        isCollapsed ? 'lg:w-20' : 'lg:w-72'
      )}>
        {renderSidebarContent(false)}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        setOpen={setIsSettingsModalOpen}
        onLogout={handleSignOut}
      />
    </>
  );
}
