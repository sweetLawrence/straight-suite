import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, NavLink, Select, Divider } from '@mantine/core'
import {
  LayoutDashboard,
  LogOut,
  Calendar,
  BedDouble,
  Percent,
  Building2,
  ChevronDown,
  DoorOpen,
  Images,
  Users,
  Settings,
  BarChart3,
  KeyRound,
  Utensils,
  WalletCards,
  MessageCircle
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

import { PROPERTIES } from '../constants/properties'

export default function AuthenticatedLayout () {
  const role = useAuthStore(s => s.role)
  const userPropertyId = useAuthStore(s => s.userPropertyId)
  const selectedPropertyId = useAuthStore(s => s.selectedPropertyId)
  const setSelectedProperty = useAuthStore(s => s.setSelectedProperty)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout () {
    logout()
    navigate('/login', { replace: true })
  }

  const currentProperty = PROPERTIES.find(
    p => p.value === (selectedPropertyId || userPropertyId)
  )

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding='lg'
      className='bg-gray-50'
    >
      <AppShell.Header className='flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600'>
            <Building2 size={18} className='text-white' />
          </div>
          <span className='text-xl font-bold text-gray-800'>
            Straight<span className='text-primary-600'> OS</span>
          </span>
        </div>

        <div className='flex items-center gap-4'>
          {role === 'superadmin' ? (
            <Select
              data={PROPERTIES}
              value={selectedPropertyId}
              onChange={v => v && setSelectedProperty(v)}
              w={240}
              placeholder='Select property'
              styles={theme => ({
                input: {
                  backgroundColor: theme.colors.gray[50],
                  borderColor: theme.colors.gray[200],
                  fontWeight: 500,
                  '&:focus': {
                    borderColor: theme.colors.primary[6]
                  }
                }
              })}
              rightSection={<ChevronDown size={16} className='text-gray-500' />}
            />
          ) : (
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-200'>
              <Building2 size={16} className='text-primary-600' />
              <span className='text-sm font-medium text-gray-700'>
                {PROPERTIES.find(p => p.value === userPropertyId)?.label ??
                  'No property'}
              </span>
            </div>
          )}
        </div>
      </AppShell.Header>

      <AppShell.Navbar className='bg-white border-r border-gray-200 shadow-sm'>
        <div className='flex flex-col h-full'>
          {/* Scrollable nav items container */}
          <div className='flex-1 overflow-y-auto pt-6 px-3'>
            {/* Property badge */}
            <div className='mb-6 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200'>
              <p className='text-xs font-medium text-primary-700 uppercase tracking-wider'>
                Property
              </p>
              <p className='text-sm font-semibold text-gray-800 truncate'>
                {currentProperty?.label || 'No property selected'}
              </p>
            </div>

            <Divider className='mb-4' />

            <div className='space-y-1'>
              <NavLink
                label='Dashboard'
                leftSection={<LayoutDashboard size={18} />}
                onClick={() => navigate('/dashboard')}
                active={isActive('/dashboard')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />
              <NavLink
                label='Bookings'
                leftSection={<Calendar size={18} />}
                onClick={() => navigate('/bookings')}
                active={isActive('/bookings')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='In-House Guests'
                leftSection={<KeyRound size={16} />}
                onClick={() => navigate('/in-house')}
                active={isActive('/in-house')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='Room Types'
                leftSection={<BedDouble size={18} />}
                onClick={() => navigate('/room-types')}
                active={isActive('/room-types')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='Physical Rooms'
                leftSection={<DoorOpen size={16} />}
                onClick={() => navigate('/rooms')}
                active={isActive('/rooms')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='Pricing'
                leftSection={<Percent size={18} />}
                onClick={() => navigate('/pricing')}
                active={isActive('/pricing')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='Restaurant Menu'
                leftSection={<Utensils size={16} />}
                onClick={() => navigate('/menu')}
                active={isActive('/menu')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='Content'
                leftSection={<Images size={16} />}
                onClick={() => navigate('/content')}
                active={isActive('/content')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              <NavLink
                label='WhatsApp Handoffs'
                leftSection={<MessageCircle size={16} />}
                onClick={() => navigate('/whatsapp-handoffs')}
                active={isActive('/whatsapp-handoffs')}
                className='rounded-lg transition-all duration-200 hover:translate-x-1'
                styles={theme => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: theme.colors.primary[6],
                      color: theme.white,
                      fontWeight: 600
                    },
                    '&[data-active]:hover': {
                      backgroundColor: theme.colors.primary[7]
                    },
                    '&:hover': {
                      backgroundColor: theme.colors.gray[0]
                    }
                  }
                })}
              />

              {role === 'superadmin' && (
                <NavLink
                  label='Payments Page'
                  leftSection={<WalletCards size={16} />}
                  onClick={() => navigate('/payments')}
                  active={isActive('/payments')}
                  className='rounded-lg transition-all duration-200 hover:translate-x-1'
                  styles={theme => ({
                    root: {
                      '&[data-active]': {
                        backgroundColor: theme.colors.primary[6],
                        color: theme.white,
                        fontWeight: 600
                      },
                      '&[data-active]:hover': {
                        backgroundColor: theme.colors.primary[7]
                      },
                      '&:hover': {
                        backgroundColor: theme.colors.gray[0]
                      }
                    }
                  })}
                />
              )}

              {role === 'superadmin' && (
                <NavLink
                  label='Staff Accounts'
                  leftSection={<Users size={16} />}
                  onClick={() => navigate('/staff')}
                  active={isActive('/staff')}
                  className='rounded-lg transition-all duration-200 hover:translate-x-1'
                  styles={theme => ({
                    root: {
                      '&[data-active]': {
                        backgroundColor: theme.colors.primary[6],
                        color: theme.white,
                        fontWeight: 600
                      },
                      '&[data-active]:hover': {
                        backgroundColor: theme.colors.primary[7]
                      },
                      '&:hover': {
                        backgroundColor: theme.colors.gray[0]
                      }
                    }
                  })}
                />
              )}

              {(role === 'admin' || role === 'superadmin') && (
                <NavLink
                  label='Reports'
                  leftSection={<BarChart3 size={16} />}
                  onClick={() => navigate('/reports')}
                  active={isActive('/reports')}
                  className='rounded-lg transition-all duration-200 hover:translate-x-1'
                  styles={theme => ({
                    root: {
                      '&[data-active]': {
                        backgroundColor: theme.colors.primary[6],
                        color: theme.white,
                        fontWeight: 600
                      },
                      '&[data-active]:hover': {
                        backgroundColor: theme.colors.primary[7]
                      },
                      '&:hover': {
                        backgroundColor: theme.colors.gray[0]
                      }
                    }
                  })}
                />
              )}
              {(role === 'admin' || role === 'superadmin') && (
                <NavLink
                  label='Settings'
                  leftSection={<Settings size={16} />}
                  onClick={() => navigate('/settings')}
                  active={isActive('/settings')}
                  className='rounded-lg transition-all duration-200 hover:translate-x-1'
                  styles={theme => ({
                    root: {
                      '&[data-active]': {
                        backgroundColor: theme.colors.primary[6],
                        color: theme.white,
                        fontWeight: 600
                      },
                      '&[data-active]:hover': {
                        backgroundColor: theme.colors.primary[7]
                      },
                      '&:hover': {
                        backgroundColor: theme.colors.gray[0]
                      }
                    }
                  })}
                />
              )}
            </div>
          </div>

          {/* Fixed bottom section */}
          <div className='flex-shrink-0 border-t border-gray-200 pt-4 px-3 pb-4'>
            <div className='flex items-center gap-2 px-3 py-2 mb-2'>
              <div className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' />
              <span className='text-xs text-gray-500'>System Online</span>
            </div>

            <NavLink
              label='Log Out'
              leftSection={<LogOut size={18} />}
              onClick={handleLogout}
              className='rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 hover:translate-x-1'
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: '#fef2f2'
                  }
                }
              }}
            />

            <p className='mt-4 text-[10px] text-gray-400 text-center'>v2.0.1</p>
          </div>
        </div>
      </AppShell.Navbar>

      <AppShell.Main className='bg-gray-50'>
        <div className='animate-fadeIn'>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
