// Mock data for development and demonstration

export const mockUsers = [
  {
    id: 1,
    email: 'admin@captivenet.com',
    username: 'admin',
    first_name: 'Admin',
    last_name: 'Principal',
    role: 'ADMIN' as const,
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: false,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    email: 'superadmin@captivenet.com',
    username: 'superadmin',
    first_name: 'Super',
    last_name: 'Administrateur',
    role: 'SUPERADMIN' as const,
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: true,
    created_at: '2024-01-01T09:00:00Z'
  },
  {
    id: 3,
    email: 'user@example.com',
    username: 'user_demo',
    first_name: 'Jean',
    last_name: 'Dupont',
    role: 'SUBSCRIBER' as const,
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: false,
    created_at: '2024-01-05T14:30:00Z'
  }
]

export const mockPlans = [
  {
    id: 1,
    name: 'Accès Invité 1H',
    plan_type: 'TEMPORARY',
    data_quota_gb: 1,
    time_quota_hours: 1,
    max_devices: 1,
    price: 0.00
  },
  {
    id: 2,
    name: 'Accès Invité 1 Jour',
    plan_type: 'TEMPORARY',
    data_quota_gb: 5,
    time_quota_hours: 24,
    max_devices: 1,
    price: 2.99
  },
  {
    id: 3,
    name: 'Mensuel Standard',
    plan_type: 'MONTHLY',
    data_quota_gb: 100,
    time_quota_hours: 720,
    max_devices: 5,
    price: 29.99
  }
]

export const mockDevices = [
  {
    id: 1,
    name: 'iPhone de Jean',
    mac_address: 'AA:BB:CC:DD:EE:FF',
    device_type: 'smartphone',
    last_ip: '192.168.1.45',
    last_seen: '2024-01-15T14:30:00Z',
    is_revoked: false,
    stats: {
      total_sessions: 25,
      total_data_gb: 12.5,
      total_time_hours: 45.2
    },
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'MacBook Pro',
    mac_address: 'BB:CC:DD:EE:FF:AA',
    device_type: 'laptop',
    last_ip: '192.168.1.67',
    last_seen: '2024-01-14T16:45:00Z',
    is_revoked: false,
    stats: {
      total_sessions: 18,
      total_data_gb: 34.2,
      total_time_hours: 67.8
    },
    created_at: '2024-01-02T11:30:00Z'
  }
]

export const mockActiveSessions = [
  {
    id: 1,
    user: {
      email: 'jean.dupont@example.com',
      role: 'SUBSCRIBER',
      name: 'Jean Dupont'
    },
    device: {
      name: 'iPhone de Jean',
      mac: 'AA:BB:CC:DD:EE:FF',
      type: 'smartphone'
    },
    network: {
      ip: '192.168.1.45',
      speed: '50 Mbps'
    },
    usage: {
      dataUsed: 157286400, // bytes
      dataQuota: 107374182400, // 100 GB
      timeUsed: 7200, // seconds
      timeQuota: 2592000, // 720 hours
      duration: 7200
    },
    status: 'ACTIVE' as const,
    startTime: '2024-01-15T12:30:00Z',
    lastActivity: '2024-01-15T14:30:00Z'
  },
  {
    id: 2,
    user: {
      email: 'Code: ABC12345',
      role: 'GUEST',
      name: 'Invité ABC12345'
    },
    device: {
      name: 'Appareil Invité',
      mac: 'FF:EE:DD:CC:BB:AA',
      type: 'smartphone'
    },
    network: {
      ip: '192.168.1.67',
      speed: '25 Mbps'
    },
    usage: {
      dataUsed: 89478485, // bytes
      dataQuota: 5368709120, // 5 GB
      timeUsed: 2700, // seconds
      timeQuota: 86400, // 24 hours
      duration: 2700
    },
    status: 'WARNING' as const,
    startTime: '2024-01-15T13:45:00Z',
    lastActivity: '2024-01-15T14:30:00Z'
  }
]

export const mockUserQuotas = [
  {
    id: 3,
    user: {
      email: 'jean.dupont@example.com',
      name: 'Jean Dupont',
      role: 'SUBSCRIBER'
    },
    subscription: {
      plan_name: 'Mensuel Standard',
      status: 'ACTIVE'
    },
    quotas: {
      data: {
        used: 85899345920, // 80 GB in bytes
        total: 107374182400, // 100 GB
        percent: 80
      },
      time: {
        used: 518400, // 144 hours in seconds
        total: 2592000, // 720 hours
        percent: 20
      },
      devices: {
        used: 3,
        total: 5
      }
    },
    alerts: ['Quota données à 80%'],
    lastActivity: '2024-01-15T14:30:00Z'
  },
  {
    id: 4,
    user: {
      email: 'marie.martin@example.com',
      name: 'Marie Martin',
      role: 'SUBSCRIBER'
    },
    subscription: {
      plan_name: 'Mensuel Standard',
      status: 'ACTIVE'
    },
    quotas: {
      data: {
        used: 96636764160, // 90 GB
        total: 107374182400, // 100 GB
        percent: 90
      },
      time: {
        used: 2332800, // 648 hours
        total: 2592000, // 720 hours
        percent: 90
      },
      devices: {
        used: 5,
        total: 5
      }
    },
    alerts: ['Quota données à 90%', 'Quota temps à 90%', 'Limite appareils atteinte'],
    lastActivity: '2024-01-15T13:15:00Z'
  }
]

export const mockSystemMetrics = {
  system: {
    cpu_usage: 45,
    memory_usage: 67,
    disk_usage: 23,
    uptime_hours: 720,
    load_average: [1.2, 1.5, 1.8]
  },
  network: {
    active_sessions: 89,
    total_bandwidth_mbps: 450,
    packets_per_second: 15420,
    errors_per_hour: 3
  },
  database: {
    connections: 12,
    queries_per_second: 245,
    cache_hit_ratio: 94,
    slow_queries: 2
  },
  application: {
    response_time_ms: 145,
    error_rate_percent: 0.1,
    requests_per_minute: 1250,
    active_users: 156
  },
  alerts: [
    {
      id: 1,
      type: 'warning' as const,
      message: 'Utilisation mémoire élevée sur le serveur principal',
      timestamp: '2024-01-15T14:25:00Z'
    },
    {
      id: 2,
      type: 'info' as const,
      message: 'Maintenance programmée ce soir à 2h00',
      timestamp: '2024-01-15T14:20:00Z'
    }
  ]
}

export const mockUsageData = {
  current_period: {
    data: {
      used: 48318382080, // 45 GB in bytes
      quota: 107374182400, // 100 GB
      percent: 45
    },
    time: {
      used: 459000, // 127.5 hours in seconds
      quota: 2592000, // 720 hours
      percent: 17.7
    },
    devices: {
      active: 3,
      max: 5
    }
  },
  subscription: {
    plan_name: 'Mensuel Standard',
    status: 'ACTIVE',
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-02-01T00:00:00Z',
    auto_renew: true
  },
  recent_sessions: [
    {
      id: 1,
      device_name: 'iPhone de Jean',
      start_time: '2024-01-15T12:30:00Z',
      duration: 7200,
      data_used: 157286400
    },
    {
      id: 2,
      device_name: 'MacBook Pro',
      start_time: '2024-01-14T09:15:00Z',
      duration: 14400,
      data_used: 524288000
    }
  ],
  monthly_trends: [
    {
      month: 'Janvier 2024',
      data_gb: 45.2,
      time_hours: 127.5,
      sessions: 23
    },
    {
      month: 'Décembre 2023',
      data_gb: 67.8,
      time_hours: 189.2,
      sessions: 31
    }
  ]
}

export const mockSessionData = {
  id: 'sess_123456',
  status: 'ACTIVE' as const,
  user: {
    email: 'guest-demo1234@temp.local',
    role: 'GUEST'
  },
  device: {
    name: 'Appareil Invité',
    mac: 'AA:BB:CC:DD:EE:FF'
  },
  network: {
    ip: '192.168.1.45',
    speed: '50 Mbps'
  },
  usage: {
    dataUsed: 157286400, // ~150 MB
    dataQuota: 5368709120, // 5 GB
    timeUsed: 5400, // 1.5 hours
    timeQuota: 86400 // 24 hours
  },
  startTime: '2024-01-15T13:00:00Z',
  lastActivity: '2024-01-15T14:30:00Z',
  expiresAt: '2024-01-16T13:00:00Z'
}