// import { ReactNode } from 'react'
// import {
//   AppShell as MantineAppShell,
//   Burger,
//   Group,
//   NavLink,
//   Text,
//   Avatar,
//   Menu,
//   UnstyledButton,
//   Loader,
//   Center,
//   Box,
//   Stack,
//   ThemeIcon,
//   ScrollArea
// } from '@mantine/core'
// import { useDisclosure } from '@mantine/hooks'
// import {
//   LayoutDashboard,
//   Package,
//   Banknote,
//   Receipt,
//   ArrowLeftRight,
//   Wrench,
//   Users,
//   BarChart3,
//   LogOut,
//   ChevronDown,
//   Building2,
//   Menu as MenuIcon,
//   FileText,
//   ChevronRight,
//   Layers,
//   Wine,
//   CheckCircle2
// } from 'lucide-react'
// import {
//   Link,
//   Outlet,
//   useNavigate,
//   useRouterState
// } from '@tanstack/react-router'
// import { useAuth } from '@/lib/auth/useAuth'
import { RefreshButton } from '@/components/RefreshButton'

// interface NavLeaf {
//   type: 'leaf'
//   label: string
//   to: string
//   icon?: ReactNode
//   roles?: string[]
// }

// interface NavGroup {
//   type: 'group'
//   label: string
//   icon: ReactNode
//   roles?: string[]
//   children: NavLeaf[]
// }

// type NavEntry = NavLeaf | NavGroup

// const navSections: { title: string; items: NavEntry[] }[] = [
//   {
//     title: 'Overview',
//     items: [
//       {
//         type: 'leaf',
//         label: 'Dashboard',
//         to: '/dashboard',
//         icon: <LayoutDashboard size={18} />
//       }
//     ]
//   },
//   {
//     title: 'Bar',
//     items: [
//       {
//         type: 'leaf',
//         label: 'Bar Dashboard',
//         to: '/bar',
//         icon: <Wine size={18} />,
//         roles: ['bar_attendant', 'manager', 'md']
//       },
//       {
//         type: 'leaf',
//         label: 'Bar Stock',
//         to: '/bar/stock',
//         icon: <Package size={18} />,
//         roles: ['bar_attendant', 'manager', 'md']
//       },
//       {
//         type: 'leaf',
//         label: 'Bar Orders',
//         to: '/bar/orders',
//         icon: <Receipt size={18} />,
//         roles: ['bar_attendant']
//       },
//       {
//         type: 'leaf',
//         label: 'Bar Handover',
//         to: '/bar/handover',
//         icon: <Banknote size={18} />,
//         roles: ['bar_attendant']
//       },
//       {
//         type: 'leaf',
//         label: 'Bar Reports',
//         to: '/bar/reports',
//         icon: <BarChart3 size={18} />,
//         roles: ['bar_attendant']
//       }
//     ]
//   },
//   {
//     title: 'Sales',
//     items: [
//       {
//         type: 'leaf',
//         label: 'Orders',
//         to: '/orders',
//         icon: <Receipt size={18} />,
//         roles: ['waiter', 'supervisor', 'manager', 'bar_attendant']
//       },
//       {
//         type: 'leaf',
//         label: 'Bills',
//         to: '/bills',
//         icon: <FileText size={18} />,
//         roles: ['waiter', 'supervisor', 'manager', 'bar_attendant']
//       },
//       {
//         type: 'group',
//         label: 'Payments',
//         icon: <Banknote size={18} />,
//         roles: ['cashier', 'supervisor', 'manager', 'waiter', 'bar_attendant'],
//         children: [
//           { type: 'leaf', label: 'All Payments', to: '/payments' },
//           {
//             type: 'leaf',
//             label: 'Pending Verification',
//             to: '/payments/pending'
//           },
//           { type: 'leaf', label: 'Cash Drops', to: '/cash-drops' },
//           { type: 'leaf', label: 'Float', to: '/float' },
//           { type: 'leaf', label: 'My Handover', to: '/handover' }
//         ]
//       }
//     ]
//   },

//   {
//     title: 'Store',
//     items: [
//       {
//         type: 'leaf',
//         label: 'Dispatch Queue',
//         to: '/store/queue',
//         icon: <Package size={18} />,
//         roles: ['store_manager', 'manager', 'md', 'admin']
//       },
//       {
//         type: 'leaf',
//         label: 'Issue Slips',
//         to: '/store/slips',
//         icon: <FileText size={18} />,
//         roles: ['store_manager', 'manager', 'md', 'admin']
//       }
//     ]
//   },

//   {
//     title: 'Operations',
//     items: [
//       {
//         type: 'group',
//         label: 'Stock',
//         icon: <Package size={18} />,
//         roles: ['store_manager', 'bar_attendant', 'supervisor', 'manager'],
//         children: [
//           { type: 'leaf', label: 'Batches', to: '/stock/batches' },
//           {
//             type: 'leaf',
//             label: 'Portion Inventory',
//             to: '/stock/portion-inventory'
//           },
//           { type: 'leaf', label: 'Ledger', to: '/stock/ledger' },
//           { type: 'leaf', label: 'Balance', to: '/stock/balance' },
//           { type: 'leaf', label: 'Bulk Issues', to: '/stock/bulk-issues' },
//           { type: 'leaf', label: 'Stock Items', to: '/stock/items' }
//         ]
//       },
//       {
//         type: 'leaf',
//         label: 'Bar Approvals',
//         to: '/bar-approvals',
//         icon: <CheckCircle2 size={18} />,
//         roles: ['manager', 'admin']
//       },
//       {
//         type: 'group',
//         label: 'Transfers',
//         icon: <ArrowLeftRight size={18} />,
//         roles: ['store_manager', 'supervisor', 'manager', 'md'],
//         children: [{ type: 'leaf', label: 'All Transfers', to: '/transfers' }]
//       },
//       {
//         type: 'group',
//         label: 'Production',
//         icon: <Wrench size={18} />,
//         roles: ['store_manager', 'manager'],
//         children: [
//           { type: 'leaf', label: 'Batches', to: '/production' },
//           { type: 'leaf', label: 'Variances', to: '/production/variances' },
//           { type: 'leaf', label: 'Thresholds', to: '/variance-thresholds' }
//         ]
//       },
//       {
//         type: 'group',
//         label: 'Staff Meals',
//         icon: <Users size={18} />,
//         roles: ['store_manager', 'supervisor', 'manager'],
//         children: [
//           { type: 'leaf', label: 'All Meals', to: '/staff-meals' },
//           { type: 'leaf', label: 'Daily View', to: '/staff-meals/daily' }
//         ]
//       },
//       {
//         type: 'group',
//         label: 'Operations',
//         icon: <Layers size={18} />,
//         roles: ['store_manager', 'supervisor', 'manager'],
//         children: [
//           { type: 'leaf', label: 'Waste', to: '/waste' },
//           { type: 'leaf', label: 'Returns', to: '/returns' },
//           { type: 'leaf', label: 'Disputes', to: '/disputes' }
//         ]
//       }
//     ]
//   },
//   {
//     title: 'Management',
//     items: [
//       // {
//       //   type: 'group',
//       //   label: 'Menu',
//       //   icon: <MenuIcon size={18} />,
//       //   roles: ['manager', 'md', 'admin', 'supervisor'],
//       //   children: [
//       //     { type: 'leaf', label: 'Menu Items', to: '/menu' },
//       //     {
//       //       type: 'leaf',
//       //       label: 'Portion Definitions',
//       //       to: '/portion-definitions',
//       //     },
//       //     { type: 'leaf', label: 'Recipes', to: '/recipes' },
//       //     { type: 'leaf', label: 'Staff Menu', to: '/staff-menu' },
//       //   ],
//       // },

//       {
//         type: 'group',
//         label: 'Menu',
//         icon: <MenuIcon size={18} />,
//         roles: ['manager', 'md', 'admin', 'supervisor', 'store_manager'],
//         children: [
//           { type: 'leaf', label: 'Master Items', to: '/menu/master-items' },
//           { type: 'leaf', label: 'Menu Items', to: '/menu' },
//           {
//             type: 'leaf',
//             label: 'Portion Definitions',
//             to: '/portion-definitions'
//           },
//           { type: 'leaf', label: 'Recipes', to: '/recipes' },
//           { type: 'leaf', label: 'Staff Menu', to: '/staff-menu' }
//         ]
//       },
//       {
//         type: 'leaf',
//         label: 'Properties',
//         to: '/properties',
//         icon: <Building2 size={18} />,
//         roles: ['manager', 'md', 'admin']
//       },
//       {
//         type: 'leaf',
//         label: 'Users',
//         to: '/users',
//         icon: <Users size={18} />,
//         roles: ['manager', 'md', 'admin']
//       },
//       {
//         type: 'leaf',
//         label: 'Reports',
//         to: '/reports',
//         icon: <BarChart3 size={18} />,
//         roles: ['manager', 'md']
//       },
//       {
//         type: 'group',
//         label: 'System',
//         icon: <BarChart3 size={18} />,
//         roles: ['manager', 'md', 'admin'],
//         children: [
//           { type: 'leaf', label: 'Adjustments', to: '/adjustments' },
//           { type: 'leaf', label: 'Reconciliation', to: '/reconciliation' },
//           { type: 'leaf', label: 'Exceptions', to: '/exceptions' },
//           { type: 'leaf', label: 'Audit Log', to: '/audit' }
//         ]
//       }
//     ]
//   }
// ]

// export function AppShell ({ children }: { children?: ReactNode }) {
//   const [opened, { toggle }] = useDisclosure()
//   const auth = useAuth()
//   const navigate = useNavigate()
//   const routerState = useRouterState()
//   const currentPath = routerState.location.pathname

//   if (!auth.isReady || !auth.user) {
//     return (
//       <Center h='100vh'>
//         <Loader />
//       </Center>
//     )
//   }

//   const canSee = (roles?: string[]) => {
//     if (!roles) return true
//     return roles.some(r => auth.hasRole(r))
//   }

//   const allLeafPaths = sections.flatMap(section =>
//     section.items.flatMap(item =>
//       item.type === 'leaf' ? [item.to] : item.children.map(c => c.to)
//     )
//   )

//   const activePath = allLeafPaths
//     .filter(path => currentPath === path || currentPath.startsWith(path + '/'))
//     .sort((a, b) => b.length - a.length)[0]

//   const initial = auth.user.full_name?.[0] ?? '?'
//   const primaryRole = auth.user.roles[0]?.code

//   return (
//     <MantineAppShell
//       header={{ height: 60 }}
//       navbar={{
//         width: 260,
//         breakpoint: 'sm',
//         collapsed: { mobile: !opened }
//       }}
//       padding='md'
//     >
//       <MantineAppShell.Header
//         style={{
//           borderBottom: '1px solid var(--mantine-color-gray-2)',
//           background: 'white'
//         }}
//       >
//         <Group h='100%' px='md' justify='space-between'>
//           <Group gap='sm'>
//             <Burger
//               opened={opened}
//               onClick={toggle}
//               hiddenFrom='sm'
//               size='sm'
//             />
//             <Group gap={10}>
//               <ThemeIcon
//                 size={32}
//                 radius='md'
//                 variant='gradient'
//                 gradient={{ from: 'blue', to: 'cyan', deg: 135 }}
//               >
//                 <Package size={18} />
//               </ThemeIcon>
//               <Text fw={700} size='md' style={{ letterSpacing: '-0.01em' }}>
//                 Straight Inventory
//               </Text>
//             </Group>
//           </Group>

//           <Menu shadow='md' width={220} position='bottom-end' radius='md'>
//             <Menu.Target>
//               <UnstyledButton
//                 style={{
//                   padding: '6px 10px',
//                   borderRadius: 10,
//                   transition: 'background 120ms ease'
//                 }}
//               >
//                 <Group gap='xs'>
//                   <Avatar size={30} radius='xl' color='blue'>
//                     {initial}
//                   </Avatar>
//                   <Box visibleFrom='sm'>
//                     <Text size='sm' fw={600} lh={1.1}>
//                       {auth.user.full_name}
//                     </Text>
//                     {primaryRole && (
//                       <Text size='xs' c='dimmed' lh={1.2}>
//                         {primaryRole}
//                       </Text>
//                     )}
//                   </Box>
//                   <ChevronDown size={14} opacity={0.5} />
//                 </Group>
//               </UnstyledButton>
//             </Menu.Target>
//             <Menu.Dropdown>
//               <Menu.Label>{auth.user.username}</Menu.Label>
//               <Menu.Divider />
//               <Menu.Item
//                 color='red'
//                 leftSection={<LogOut size={14} />}
//                 onClick={() => {
//                   auth.logout()
//                   window.location.replace('/login')
//                 }}
//               >
//                 Logout
//               </Menu.Item>
//             </Menu.Dropdown>
//           </Menu>
//         </Group>
//       </MantineAppShell.Header>

//       <MantineAppShell.Navbar
//         p={0}
//         style={{
//           background: '#0f172a',
//           borderRight: '1px solid #1e293b'
//         }}
//       >
//         <ScrollArea style={{ flex: 1 }} scrollbarSize={6} type='hover'>
//           <Stack gap={0} p='sm'>
//             {sections.map((section, sIdx) => {
//               const visibleItems = section.items.filter(item =>
//                 canSee(item.roles)
//               )
//               if (visibleItems.length === 0) return null

//               return (
//                 <Box
//                   key={section.title}
//                   mb={sIdx === sections.length - 1 ? 0 : 4}
//                 >
//                   <Text
//                     size='xs'
//                     fw={600}
//                     tt='uppercase'
//                     px='sm'
//                     pt={sIdx === 0 ? 4 : 16}
//                     pb={6}
//                     style={{
//                       letterSpacing: 1,
//                       color: 'rgba(255,255,255,0.4)'
//                     }}
//                   >
//                     {section.title}
//                   </Text>

//                   <Stack gap={2}>
//                     {visibleItems.map(item => {
//                       if (item.type === 'leaf') {
//                         const active = activePath === item.to
//                         return (
//                           <NavLink
//                             key={item.to}
//                             component={Link}
//                             to={item.to}
//                             label={item.label}
//                             leftSection={item.icon}
//                             active={active}
//                             onClick={() => opened && toggle()}
//                             className='app-nav-link'
//                            styles={navLinkStyles(active)}
//                           />
//                         )
//                       }

//                       const childVisible = item.children.filter(c =>
//                         canSee(c.roles)
//                       )
//                       if (childVisible.length === 0) return null

//                       const groupActive = childVisible.some(
//                         c => activePath === c.to
//                       )

//                       return (
//                         <NavLink
//                           key={item.label}
//                           label={item.label}
//                           leftSection={item.icon}
//                           defaultOpened={groupActive}
//                           active={groupActive}
//                           className='app-nav-link'
//                            styles={navLinkStyles(groupActive)}
//                           rightSection={
//                             <ChevronRight
//                               size={14}
//                               style={{
//                                 transition: 'transform 150ms ease',
//                                 opacity: 0.5
//                               }}
//                             />
//                           }
//                         >
//                           {childVisible.map(child => {
//                             const active = activePath === child.to
//                             return (
//                               <NavLink
//                                 key={child.to}
//                                 component={Link}
//                                 to={child.to}
//                                 label={child.label}
//                                 active={active}
//                                 onClick={() => opened && toggle()}
//                                 className='app-nav-link'
//                                styles={subNavLinkStyles(active)}
//                               />
//                             )
//                           })}
//                         </NavLink>
//                       )
//                     })}
//                   </Stack>
//                 </Box>
//               )
//             })}
//           </Stack>
//         </ScrollArea>

//         <Box
//           p='sm'
//           style={{
//             borderTop: '1px solid rgba(255,255,255,0.08)',
//             background: 'rgba(0,0,0,0.2)'
//           }}
//         >
//           <Group gap='xs' wrap='nowrap'>
//             <Avatar size={32} radius='xl' color='blue'>
//               {initial}
//             </Avatar>
//             <Box style={{ flex: 1, minWidth: 0 }}>
//               <Text size='xs' fw={600} c='white' truncate>
//                 {auth.user.full_name}
//               </Text>
//               <Text
//                 size='xs'
//                 truncate
//                 style={{ color: 'rgba(255,255,255,0.5)' }}
//               >
//                 @{auth.user.username}
//               </Text>
//             </Box>
//             <UnstyledButton
//               onClick={() => {
//                 auth.logout()
//                 window.location.replace('/login')
//               }}
//               style={{
//                 padding: 6,
//                 borderRadius: 8,
//                 color: 'rgba(255,255,255,0.6)'
//               }}
//               title='Logout'
//             >
//               <LogOut size={16} />
//             </UnstyledButton>
//           </Group>
//         </Box>
//       </MantineAppShell.Navbar>

//       <MantineAppShell.Main
//         style={{ background: 'var(--mantine-color-gray-0)' }}
//       >
//         {children ?? <Outlet />}
//       </MantineAppShell.Main>
//     </MantineAppShell>
//   )
// }

// function navLinkStyles (active: boolean) {
//   return {
//     root: {
//       borderRadius: 8,
//       padding: '8px 12px',
//       color: active ? 'white' : 'rgba(255,255,255,0.72)',
//       background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
//       fontWeight: active ? 600 : 500,
//       transition: 'background 120ms ease, color 120ms ease',
//       '&:hover': {
//         background: active ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.06)',
//         color: 'white'
//       },
//       '&[data-active]': {
//         background: 'rgba(59,130,246,0.18)',
//         color: 'white'
//       }
//     },
//     label: { fontSize: 13.5 },
//     section: {
//       color: active ? 'var(--mantine-color-blue-4)' : 'inherit'
//     }
//   } as const
// }

// function subNavLinkStyles (active: boolean) {
//   return {
//     root: {
//       borderRadius: 6,
//       padding: '6px 12px 6px 40px',
//       color: active ? 'white' : 'rgba(255,255,255,0.6)',
//       background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
//       fontWeight: active ? 600 : 400,
//       transition: 'background 120ms ease, color 120ms ease',
//       '&:hover': {
//         background: 'rgba(255,255,255,0.06)',
//         color: 'white'
//       },
//       '&[data-active]': {
//         background: 'rgba(59,130,246,0.15)',
//         color: 'white'
//       }
//     },
//     label: { fontSize: 13 }
//   } as const
// }

import { ReactNode, useState } from 'react'
import {
  TextInput,
  AppShell as MantineAppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  Loader,
  Center,
  Box,
  Stack,
  ThemeIcon,
  ScrollArea
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  BookOpen,
  BookOpenCheck,
  HandCoins,
  Wallet,
  LayoutDashboard,
  Package,
  Banknote,
  Ban,
  Receipt,
  ArrowLeftRight,
  Wrench,
  Users,
  BarChart3,
  LogOut,
  ChevronDown,
  Building2,
  Menu as MenuIcon,
  FileText,
  ChevronRight,
  Layers,
  Wine,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  Bell,
  ClipboardList,
  ListChecks,
  ShoppingCart,
  Truck,
  ChefHat,
  GlassWater,
  CalendarDays,
  Landmark,
  Calculator,
  BadgeCheck,
  TrendingUp,
  Tags,
  BedDouble,
  Scale,
  Search,
  Printer,
  ClipboardCheck
} from 'lucide-react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState
} from '@tanstack/react-router'
import { useAuth } from '@/lib/auth/useAuth'
import { COUNTED, useNavCounts } from '@/hooks/useNavCounts'
import { ToDropBanner } from '@/components/ToDropBanner'
import { ToCountBanner } from '@/components/ToCountBanner'
import { WaitingBanner } from '@/components/WaitingBanner'
import { CashHeldBanner } from '@/components/CashHeldBanner'
import { ActingProperty } from '@/components/ActingProperty'
import { useApprovals, useUnreadCount } from '@/hooks/useNotifications'
import { useBarPending } from '@/hooks/useOrders'
import { useRemittances } from '@/hooks/useCashier'
import { usePendingCashDrops } from '@/hooks/usePayments'
import { useStoreQueue } from '@/hooks/useStore'
import { appPath, pagePath } from '@/lib/utils/basePath'

// roles: which jobs the entry is for (MD and admin see all of them).
// perm:  hide unless the user has one of these permissions - use the code the
//        page's API checks, so nobody is shown a page that answers 403.
interface NavLeaf {
  type: 'leaf'
  label: string
  to: string
  icon?: ReactNode
  roles?: string[]
  perm?: string[]
  /** Roles that never see it even at group level (the read-only auditor) */
  hideFor?: string[]
}

interface NavGroup {
  type: 'group'
  label: string
  icon: ReactNode
  roles?: string[]
  perm?: string[]
  hideFor?: string[]
  children: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

/** Red count for one menu path, or the total of a group's paths. Fetches only what it shows. */
function NavPill ({ tos }: { tos: string[] }) {
  const counts = useNavCounts(tos.filter(t => COUNTED.includes(t)))
  const n = tos.reduce((a, t) => a + (counts[t] ?? 0), 0)
  if (!n) return null
  return (
    <Box
      component='span'
      style={{
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 10,
        background: '#FF3040',
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: '20px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}
    >
      {n > 99 ? '99+' : n}
    </Box>
  )
}

const navSections: { title: string; items: NavEntry[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        type: 'leaf',
        label: 'Dashboard',
        to: '/dashboard',
        icon: <LayoutDashboard size={18} />
      },
      {
        type: 'leaf',
        label: 'Other Income',
        to: '/income',
        icon: <Banknote size={18} />,
        roles: ['manager', 'supervisor', 'receptionist', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Hand In Money',
        to: '/income-handin',
        icon: <HandCoins size={18} />,
        roles: ['manager', 'supervisor', 'receptionist', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Sold Out',
        to: '/menu/sold-out',
        icon: <Ban size={18} />,
        roles: [
          'store_manager',
          'supervisor',
          'manager',
          'bar_attendant',
          'md',
          'admin'
        ]
      },
      {
        type: 'leaf',
        label: 'Daily Summary',
        to: '/day-summary',
        icon: <FileSpreadsheet size={18} />,
        roles: [
          'waiter',
          'bar_attendant',
          'cashier',
          'supervisor',
          'manager',
          'md',
          'admin',
          'accountant',
          'auditor'
        ]
      },
      {
        type: 'leaf',
        label: 'Shortages',
        to: '/money-check',
        icon: <Scale size={18} />,
        roles: ['cashier', 'manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Rooms and Halls',
        to: '/venues',
        icon: <BedDouble size={18} />,
        roles: ['manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Notifications',
        to: '/notifications',
        icon: <Bell size={18} />,
        roles: [
          'manager',
          'md',
          'admin',
          'waiter',
          'bar_attendant',
          'cashier',
          'supervisor',
          'store_manager'
        ]
      },
      {
        type: 'leaf',
        label: 'Glossary',
        to: '/glossary',
        icon: <BookOpen size={18} />
      },
      {
        type: 'leaf',
        label: 'Reports',
        to: '/reports',
        icon: <BarChart3 size={18} />,
        roles: ['manager', 'md', 'admin']
      }
    ]
  },
  {
    title: 'Bar',
    items: [
      {
        type: 'leaf',
        label: 'Bar Dashboard',
        to: '/bar',
        icon: <Wine size={18} />,
        roles: ['bar_attendant', 'manager', 'md']
      },
      {
        type: 'leaf',
        label: 'Bar Stock',
        to: '/bar/stock',
        icon: <Package size={18} />,
        roles: ['bar_attendant', 'manager', 'md']
      },
      {
        type: 'leaf',
        label: 'Bar Stock Sheet',
        to: '/stock/sheet',
        icon: <FileSpreadsheet size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Sell at the Bar',
        to: '/bar/sell',
        icon: <GlassWater size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar Orders',
        to: '/bar/orders',
        icon: <Receipt size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar Handover',
        to: '/bar/handover',
        icon: <Banknote size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar to Rooms',
        to: '/bar/rooms',
        icon: <BedDouble size={18} />,
        roles: ['bar_attendant', 'manager', 'md']
      },
      {
        type: 'leaf',
        label: 'Bar Waste',
        to: '/waste',
        icon: <Layers size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar Transfers',
        to: '/transfers',
        icon: <ArrowLeftRight size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar Reports',
        to: '/bar/reports',
        icon: <BarChart3 size={18} />,
        roles: ['bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Bar Count',
        to: '/stock-takes',
        icon: <ClipboardList size={18} />,
        roles: ['bar_attendant']
      }
    ]
  },
  {
    title: 'Sales',
    items: [
      {
        type: 'leaf',
        label: 'Orders',
        to: '/orders',
        icon: <Receipt size={18} />,
        roles: ['waiter', 'supervisor', 'manager']
      },
      {
        type: 'leaf',
        label: 'Bills',
        to: '/bills',
        icon: <FileText size={18} />,
        roles: ['waiter', 'cashier', 'supervisor', 'manager', 'bar_attendant']
      },
      {
        type: 'leaf',
        label: 'Guests Paying Later',
        to: '/pay-later',
        icon: <BedDouble size={18} />,
        roles: ['waiter', 'bar_attendant', 'cashier', 'supervisor', 'manager']
      },
      {
        type: 'leaf',
        label: 'Events',
        to: '/events',
        icon: <CalendarDays size={18} />,
        roles: ['manager', 'supervisor', 'store_manager']
      },
      {
        type: 'group',
        label: 'Payments',
        icon: <Banknote size={18} />,
        roles: ['cashier', 'supervisor', 'manager', 'waiter', 'bar_attendant'],
        children: [
          { type: 'leaf', label: 'All Payments', to: '/payments' },
          {
            type: 'leaf',
            label: 'Pending Verification',
            to: '/payments/pending',
            perm: ['payment.verify']
          },
          { type: 'leaf', label: 'Cash Drops', to: '/cash-drops' },
          {
            type: 'leaf',
            label: 'Income Hand-ins',
            to: '/income-handin',
            perm: ['cash.drop.verify']
          },
          {
            type: 'leaf',
            label: 'Cash in Hand',
            to: '/cashier',
            roles: ['cashier', 'supervisor', 'manager']
          },
          {
            type: 'leaf',
            label: 'Petty Cash',
            to: '/petty-cash',
            roles: ['cashier', 'supervisor', 'manager']
          },
          {
            type: 'leaf',
            label: 'Cash Handovers',
            to: '/cash-handovers',
            roles: ['cashier', 'supervisor', 'manager']
          },
          {
            type: 'leaf',
            label: 'My Handover',
            to: '/handover',
            // Waiters' own cash summary; the bar uses Bar Handover, the cashier confirms drops
            roles: ['waiter', 'supervisor', 'manager']
          }
        ]
      }
    ]
  },

  {
    title: 'Store',
    items: [
      {
        type: 'leaf',
        label: 'Dispatch Queue',
        to: '/store/queue',
        perm: ['store.queue.view'],
        icon: <Package size={18} />,
        roles: ['store_manager', 'manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Issue Slips',
        to: '/store/slips',
        perm: ['store.queue.view'],
        icon: <FileText size={18} />,
        roles: ['store_manager', 'manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Purchase Orders',
        to: '/purchase-orders',
        icon: <ShoppingCart size={18} />,
        roles: ['store_manager', 'manager']
      },
      {
        type: 'leaf',
        label: 'Kitchen Day',
        to: '/kitchen',
        icon: <ChefHat size={18} />,
        roles: ['store_manager', 'manager', 'supervisor']
      },
      {
        type: 'leaf',
        label: 'Reorder List',
        to: '/reorder',
        icon: <ListChecks size={18} />,
        roles: ['store_manager', 'manager']
      },
      {
        type: 'leaf',
        label: 'Suppliers',
        to: '/suppliers',
        icon: <Truck size={18} />,
        roles: ['store_manager', 'manager']
      }
    ]
  },

  {
    title: 'Operations',
    items: [
      {
        type: 'group',
        label: 'Stock',
        icon: <Package size={18} />,
        roles: ['store_manager', 'supervisor', 'manager'],
        children: [
          { type: 'leaf', label: 'Batches', to: '/stock/batches' },
          {
            type: 'leaf',
            label: 'Portion Inventory',
            to: '/stock/portion-inventory'
          },
          { type: 'leaf', label: 'Ledger', to: '/stock/ledger' },
          { type: 'leaf', label: 'Balance', to: '/stock/balance' },
          { type: 'leaf', label: 'Stock Sheet', to: '/stock/sheet' },
          { type: 'leaf', label: 'Bulk Issues', to: '/stock/bulk-issues' },
          { type: 'leaf', label: 'Stock Items', to: '/stock/items' },
          { type: 'leaf', label: 'Portion Rules', to: '/stock/portion-rules' },
          { type: 'leaf', label: 'Stock Takes', to: '/stock-takes' },
          { type: 'leaf', label: 'Variances', to: '/stock-takes/variances' }
        ]
      },
      {
        type: 'leaf',
        label: 'Approvals',
        to: '/approvals',
        // Managers decide; the MD only gets the notifications
        perm: [
          'transfer.approve',
          'bar.order.approve',
          'adjustment.approve',
          'stock_take.approve'
        ],
        icon: <CheckCircle2 size={18} />,
        roles: ['manager', 'admin']
      },
      {
        type: 'group',
        label: 'Transfers',
        icon: <ArrowLeftRight size={18} />,
        roles: ['store_manager', 'supervisor', 'manager', 'md'],
        children: [{ type: 'leaf', label: 'All Transfers', to: '/transfers' }]
      },
      {
        type: 'group',
        label: 'Production',
        icon: <Wrench size={18} />,
        roles: ['store_manager', 'manager'],
        children: [
          { type: 'leaf', label: 'Batches', to: '/production' },
          { type: 'leaf', label: 'Variances', to: '/production/variances' },
          { type: 'leaf', label: 'Thresholds', to: '/variance-thresholds' }
        ]
      },
      {
        type: 'group',
        label: 'Staff Meals',
        icon: <Users size={18} />,
        roles: ['store_manager', 'supervisor', 'manager'],
        children: [
          { type: 'leaf', label: 'All Meals', to: '/staff-meals' },
          { type: 'leaf', label: 'Daily View', to: '/staff-meals/daily' }
        ]
      },
      {
        type: 'group',
        label: 'Operations',
        icon: <Layers size={18} />,
        roles: ['store_manager', 'supervisor', 'manager'],
        children: [
          { type: 'leaf', label: 'Waste', to: '/waste' },
          { type: 'leaf', label: 'Returns', to: '/returns' },
          // Cash disputes between waiters and cashiers: not for the store
          {
            type: 'leaf',
            label: 'Disputes',
            to: '/disputes',
            roles: ['supervisor', 'manager']
          }
        ]
      }
    ]
  },
  {
    title: 'Management',
    items: [
      {
        type: 'group',
        label: 'Menu',
        icon: <MenuIcon size={18} />,
        roles: ['manager', 'md', 'admin', 'supervisor', 'store_manager'],
        children: [
          {
            type: 'leaf',
            label: 'New Product',
            to: '/menu/new-product',
            roles: ['manager', 'md', 'admin'],
            hideFor: ['auditor']
          },
          { type: 'leaf', label: 'Master Items', to: '/menu/master-items' },
          { type: 'leaf', label: 'Menu Items', to: '/menu' },
          {
            type: 'leaf',
            label: 'Portion Definitions',
            to: '/portion-definitions'
          },
          { type: 'leaf', label: 'Recipes', to: '/recipes' },
          { type: 'leaf', label: 'Staff Menu', to: '/staff-menu' }
        ]
      },
      {
        type: 'leaf',
        label: 'Properties',
        to: '/properties',
        icon: <Building2 size={18} />,
        roles: ['manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Users',
        to: '/users',
        perm: ['user.manage'],
        icon: <Users size={18} />,
        roles: ['manager', 'md', 'admin']
      },
      {
        type: 'leaf',
        label: 'Access',
        to: '/admin/access',
        icon: <ShieldCheck size={18} />,
        roles: ['admin']
      },
      {
        type: 'leaf',
        label: 'Bulk Import',
        to: '/admin/bulk-import',
        icon: <FileSpreadsheet size={18} />,
        roles: ['md', 'admin'],
        hideFor: ['auditor']
      },
      {
        type: 'group',
        label: 'System',
        icon: <ShieldCheck size={18} />,
        roles: ['manager', 'md', 'admin'],
        children: [
          { type: 'leaf', label: 'Adjustments', to: '/adjustments' },
          { type: 'leaf', label: 'Reconciliation', to: '/reconciliation' },
          { type: 'leaf', label: 'Exceptions', to: '/exceptions' },
          { type: 'leaf', label: 'Audit Log', to: '/audit' }
        ]
      }
    ]
  }
]

// The accountant: the books, and the records behind them (read only)
const leaf = (label: string, to: string, icon: ReactNode): NavEntry => ({
  type: 'leaf',
  label,
  to,
  icon
})
const accountantSections: { title: string; items: NavEntry[] }[] = [
  {
    title: 'Books',
    items: [
      leaf('Accounts', '/accounts', <BookOpenCheck size={18} />),
      leaf('Money (live)', '/finance/overview', <TrendingUp size={18} />),
      leaf('Income Statement', '/finance', <Landmark size={18} />),
      leaf('Cost of Sales', '/finance/cost-of-sales', <Calculator size={18} />),
      leaf('Profit per Item', '/finance/items', <Tags size={18} />),
      leaf('eTIMS', '/etims', <BadgeCheck size={18} />)
    ]
  },
  {
    title: 'Records',
    items: [
      leaf('Cash Handovers', '/cash-handovers', <Wallet size={18} />),
      leaf('Petty Cash', '/petty-cash', <Banknote size={18} />),
      leaf('Guests Paying Later', '/pay-later', <HandCoins size={18} />),
      leaf('Purchase Orders', '/purchase-orders', <Truck size={18} />),
      leaf('Stock Sheet', '/stock/sheet', <FileSpreadsheet size={18} />),
      leaf('Reports', '/reports', <BarChart3 size={18} />)
    ]
  },
  {
    title: 'Help',
    items: [leaf('Glossary', '/glossary', <BookOpen size={18} />)]
  }
]

// MD / admin: overview first, then the money, then the rest
const GROUP_SECTION_ORDER = [
  'Overview',
  'Books',
  'Finance',
  'Sales',
  'Operations',
  'Store',
  'Bar',
  'Management'
]
const groupSections = [...navSections, accountantSections[0]].sort(
  (a, b) =>
    GROUP_SECTION_ORDER.indexOf(a.title) - GROUP_SECTION_ORDER.indexOf(b.title)
)

export function AppShell ({ children }: { children?: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure()
  const [navQ, setNavQ] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const seesNotifications = !!auth.user
  const unread = useUnreadCount(seesNotifications)

  if (!auth.isReady || !auth.user) {
    return (
      <Center h='100vh'>
        <Loader />
      </Center>
    )
  }

  const isGroupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant')
  const accountantOnly = auth.user.roles.every(r => r.code === 'accountant')
  const printOnly = auth.user.roles.every(r => r.code === 'print_station')
  const sections = printOnly
    ? [
        {
          title: 'Printing',
          items: [
            {
              type: 'leaf',
              label: 'Print Station',
              to: '/print-station',
              icon: <Printer size={18} />
            } as NavEntry
          ]
        }
      ]
    : accountantOnly
    ? accountantSections
    : isGroupLevel
    ? groupSections
    : navSections
  const canSee = (entry: {
    roles?: string[]
    perm?: string[]
    hideFor?: string[]
  }) => {
    if (entry.hideFor?.some(r => auth.hasRole(r))) return false
    const roleOk =
      !entry.roles || isGroupLevel || entry.roles.some(r => auth.hasRole(r))
    const permOk = !entry.perm || entry.perm.some(p => auth.hasPermission(p))
    return roleOk && permOk
  }

  // Search: every page this person can open, matched on its name or its menu group
  const needle = navQ.trim().toLowerCase()
  const found = needle
    ? sections
        .flatMap(sec =>
          sec.items
            .filter(canSee)
            .flatMap(it =>
              it.type === 'leaf'
                ? [
                    {
                      to: it.to,
                      label: it.label,
                      icon: it.icon,
                      where: sec.title
                    }
                  ]
                : it.children
                    .filter(canSee)
                    .map(c => ({
                      to: c.to,
                      label: c.label,
                      icon: it.icon,
                      where: `${sec.title} · ${it.label}`
                    }))
            )
        )
        .filter(f => `${f.label} ${f.where}`.toLowerCase().includes(needle))
    : []

  const allLeafPaths = navSections.flatMap(section =>
    section.items.flatMap(item =>
      item.type === 'leaf' ? [item.to] : item.children.map(c => c.to)
    )
  )

  const activePath = allLeafPaths
    .filter(path => currentPath === path || currentPath.startsWith(path + '/'))
    .sort((a, b) => b.length - a.length)[0]

  const initial = auth.user.full_name?.[0] ?? '?'
  const primaryRole = auth.user.roles[0]?.code

  return (
    <MantineAppShell
      header={{ height: { base: 56, sm: 60 } }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding={{ base: 'sm', sm: 'md' }}
    >
      <MantineAppShell.Header
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-2)',
          background: 'white'
        }}
      >
        <Group
          h='100%'
          px={{ base: 'sm', sm: 'md' }}
          justify='space-between'
          wrap='nowrap'
        >
          <Group gap='xs' wrap='nowrap' style={{ minWidth: 0, flex: 1 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom='sm'
              size='sm'
              aria-label='Toggle navigation'
            />
            <Group gap={8} wrap='nowrap' style={{ minWidth: 0 }}>
              <ThemeIcon
                size={30}
                radius='md'
                variant='gradient'
                gradient={{ from: 'blue', to: 'cyan', deg: 135 }}
                style={{ flexShrink: 0 }}
              >
                <Package size={16} />
              </ThemeIcon>
              {/* Hide long title on mobile, show short version */}
              <Text
                fw={700}
                size='md'
                style={{ letterSpacing: '-0.01em' }}
                visibleFrom='sm'
                truncate
              >
                Straight Inventory
              </Text>
              <Text
                fw={700}
                size='sm'
                style={{ letterSpacing: '-0.01em' }}
                hiddenFrom='sm'
                truncate
              >
                Straight
              </Text>
            </Group>
          </Group>

          <ActingProperty />
          <RefreshButton size={36} />
          {seesNotifications && (
            <UnstyledButton
              component={Link}
              to='/notifications'
              aria-label='Notifications'
              mr={4}
              style={{
                position: 'relative',
                padding: 8,
                borderRadius: 10,
                flexShrink: 0,
                color: '#495057'
              }}
            >
              <Bell size={20} />
              {!!unread.data?.unread && (
                <Box
                  component='span'
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 0,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 8,
                    background: unread.data.critical ? '#E03131' : '#FF3040',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: '16px',
                    textAlign: 'center'
                  }}
                >
                  {unread.data.unread > 99 ? '99+' : unread.data.unread}
                </Box>
              )}
            </UnstyledButton>
          )}
          <Menu shadow='md' width={220} position='bottom-end' radius='md'>
            <Menu.Target>
              <UnstyledButton
                style={{
                  padding: '4px 6px',
                  borderRadius: 10,
                  transition: 'background 120ms ease',
                  flexShrink: 0
                }}
              >
                <Group gap='xs' wrap='nowrap'>
                  <Avatar size={30} radius='xl' color='blue'>
                    {initial}
                  </Avatar>
                  <Box visibleFrom='sm'>
                    <Text size='sm' fw={600} lh={1.1}>
                      {auth.user.full_name}
                    </Text>
                    {primaryRole && (
                      <Text size='xs' c='dimmed' lh={1.2}>
                        {primaryRole}
                      </Text>
                    )}
                  </Box>
                  <ChevronDown
                    size={14}
                    opacity={0.5}
                    style={{
                      display: 'var(--mantine-hidden-from-sm-display, block)'
                    }}
                  />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{auth.user.username}</Menu.Label>
              <Menu.Divider />
              <Menu.Item
                color='red'
                leftSection={<LogOut size={14} />}
                onClick={() => {
                  auth.logout()
                  window.location.replace(appPath('/login'))
                }}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        p={0}
        style={{
          background: '#0f172a',
          borderRight: '1px solid #1e293b'
        }}
      >
        <Box px='sm' pt='sm' visibleFrom='sm'>
          <TextInput
            placeholder='Find a page…'
            size='xs'
            value={navQ}
            onChange={e => setNavQ(e.currentTarget.value)}
            leftSection={<Search size={14} />}
            onKeyDown={e => {
              if (e.key === 'Escape') setNavQ('')
              if (e.key === 'Enter' && found[0]) {
                navigate({ to: found[0].to })
                setNavQ('')
              }
            }}
            styles={{
              input: {
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff'
              }
            }}
          />
        </Box>
        <ScrollArea style={{ flex: 1 }} scrollbarSize={6} type='hover'>
          <Stack gap={0} p='sm'>
            {navQ.trim() && (
              <Stack gap={2}>
                {found.length === 0 && (
                  <Text
                    size='xs'
                    px='sm'
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    No page matches
                  </Text>
                )}
                {found.map(f => (
                  <NavLink
                    key={f.to}
                    component={Link}
                    to={f.to}
                    label={f.label}
                    description={f.where}
                    leftSection={f.icon}
                    onClick={() => {
                      setNavQ('')
                      close()
                    }}
                    className='app-nav-link'
                    styles={navLinkStyles(false)}
                  />
                ))}
              </Stack>
            )}
            {!navQ.trim() &&
              sections.map((section, sIdx) => {
                const visibleItems = section.items.filter(item => canSee(item))
                if (visibleItems.length === 0) return null

                return (
                  <Box
                    key={section.title}
                    mb={sIdx === sections.length - 1 ? 0 : 4}
                  >
                    <Text
                      size='xs'
                      fw={600}
                      tt='uppercase'
                      px='sm'
                      pt={sIdx === 0 ? 4 : 16}
                      pb={6}
                      style={{
                        letterSpacing: 1,
                        color: 'rgba(255,255,255,0.4)'
                      }}
                    >
                      {section.title}
                    </Text>

                    <Stack gap={2}>
                      {visibleItems.map(item => {
                        if (item.type === 'leaf') {
                          const active = activePath === item.to
                          return (
                            <NavLink
                              key={item.to}
                              component={Link}
                              to={item.to}
                              label={item.label}
                              leftSection={item.icon}
                              rightSection={<NavPill tos={[item.to]} />}
                              active={active}
                              onClick={close}
                              className='app-nav-link'
                              styles={navLinkStyles(active)}
                            />
                          )
                        }

                        const childVisible = item.children.filter(c =>
                          canSee(c)
                        )
                        if (childVisible.length === 0) return null

                        const groupActive = childVisible.some(
                          c => activePath === c.to
                        )

                        return (
                          <NavLink
                            key={item.label}
                            label={item.label}
                            leftSection={item.icon}
                            defaultOpened={groupActive}
                            active={groupActive}
                            className='app-nav-link'
                            styles={navLinkStyles(groupActive)}
                            rightSection={
                              <Group gap={6} wrap='nowrap'>
                                <NavPill tos={childVisible.map(c => c.to)} />
                                <ChevronRight
                                  size={14}
                                  style={{
                                    transition: 'transform 150ms ease',
                                    opacity: 0.5
                                  }}
                                />
                              </Group>
                            }
                          >
                            {childVisible.map(child => {
                              const active = activePath === child.to
                              return (
                                <NavLink
                                  key={child.to}
                                  component={Link}
                                  to={child.to}
                                  label={child.label}
                                  rightSection={<NavPill tos={[child.to]} />}
                                  active={active}
                                  onClick={close}
                                  className='app-nav-link'
                                  styles={subNavLinkStyles(active)}
                                />
                              )
                            })}
                          </NavLink>
                        )
                      })}
                    </Stack>
                  </Box>
                )
              })}
          </Stack>
        </ScrollArea>

        <Box
          p='sm'
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)'
          }}
        >
          <Group gap='xs' wrap='nowrap'>
            <Avatar size={32} radius='xl' color='blue'>
              {initial}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size='xs' fw={600} c='white' truncate>
                {auth.user.full_name}
              </Text>
              <Text
                size='xs'
                truncate
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                @{auth.user.username}
              </Text>
            </Box>
            <UnstyledButton
              onClick={() => {
                auth.logout()
                window.location.replace(appPath('/login'))
              }}
              style={{
                padding: 6,
                borderRadius: 8,
                color: 'rgba(255,255,255,0.6)'
              }}
              title='Logout'
            >
              <LogOut size={16} />
            </UnstyledButton>
          </Group>
        </Box>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main
        style={{ background: 'var(--mantine-color-gray-0)' }}
      >
        <ToDropBanner />
        <ToCountBanner />
        <WaitingBanner />
        <CashHeldBanner />
        {children ?? <Outlet />}
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}

function navLinkStyles (active: boolean) {
  return {
    root: {
      borderRadius: 8,
      padding: '8px 12px',
      color: active ? 'white' : 'rgba(255,255,255,0.72)',
      background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
      fontWeight: active ? 600 : 500,
      transition: 'background 120ms ease, color 120ms ease'
    },
    label: { fontSize: 13.5 },
    section: {
      color: active ? 'var(--mantine-color-blue-4)' : 'inherit'
    }
  } as const
}

function subNavLinkStyles (active: boolean) {
  return {
    root: {
      borderRadius: 6,
      padding: '6px 12px 6px 40px',
      color: active ? 'white' : 'rgba(255,255,255,0.6)',
      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
      fontWeight: active ? 600 : 400,
      transition: 'background 120ms ease, color 120ms ease'
    },
    label: { fontSize: 13 }
  } as const
}
