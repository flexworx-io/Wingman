import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Building2, Users, Shield, Activity, Search,
  Plus, Eye, Ban, RefreshCw,
  Crown, Star, Globe, BarChart3, Database, Cpu, TrendingUp, Lock, CheckCircle2
} from 'lucide-react';

type Tab = 'overview' | 'tenants' | 'users' | 'audit' | 'wingmen' | 'subscriptions';

const ORG_PLANS = ['free', 'starter', 'professional', 'enterprise'] as const;
type OrgPlan = typeof ORG_PLANS[number];

const USER_TIERS = ['free', 'premium', 'enterprise'] as const;
type UserTier = typeof USER_TIERS[number];

const USER_ROLES = ['user', 'admin'] as const;
type UserRole = typeof USER_ROLES[number];

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<OrgPlan>('free');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditAdminFilter, setAuditAdminFilter] = useState('');

  // Queries
  const statsQuery = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const tenantsQuery = trpc.authFull.superAdmin.listOrgs.useQuery({ page: 1, limit: 50 }, { enabled: isAuthenticated });
  const usersQuery = trpc.authFull.superAdmin.listUsers.useQuery({ page: 1, limit: 50 }, { enabled: isAuthenticated });
  const auditQuery = trpc.authFull.superAdmin.getAuditLogs.useQuery({ page: 1, limit: 100 }, { enabled: isAuthenticated });
  const murphHealthQuery = trpc.admin.murphHealth.useQuery(undefined, { enabled: isAuthenticated });
  const analyticsQuery = trpc.authFull.superAdmin.getPlatformAnalytics.useQuery(undefined, { enabled: isAuthenticated });

  // Mutations
  const createOrgMutation = trpc.authFull.superAdmin.createOrg.useMutation({
    onSuccess: () => {
      toast.success('Organization created');
      tenantsQuery.refetch();
      setShowCreateTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateOrgMutation = trpc.authFull.superAdmin.updateOrg.useMutation({
    onSuccess: () => { toast.success('Organization updated'); tenantsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteOrgMutation = trpc.authFull.superAdmin.deleteOrg.useMutation({
    onSuccess: () => { toast.success('Organization deactivated'); tenantsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateUserMutation = trpc.authFull.superAdmin.updateUser.useMutation({
    onSuccess: () => { toast.success('User updated'); usersQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const suspendUserMutation = trpc.authFull.superAdmin.suspendUser.useMutation({
    onSuccess: () => { toast.success('User status updated'); usersQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const seedMutation = trpc.admin.seedData.useMutation({
    onSuccess: (d) => toast.success(d.message),
    onError: (e) => toast.error(e.message),
  });

  if (loading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) { navigate('/auth'); return null; }
  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center">
        <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/50">Super-Admin access required.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-purple-600 hover:bg-purple-500 text-white">Back to Dashboard</Button>
      </div>
    </div>
  );

  const stats = statsQuery.data;
  const tenants = tenantsQuery.data?.orgs ?? [];
  const users = usersQuery.data?.users ?? [];
  const auditLogs = auditQuery.data?.logs ?? [];
  const analytics = analyticsQuery.data;
  const murphHealth = murphHealthQuery.data;

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tenants', label: 'Organizations', icon: <Building2 className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Crown className="w-4 h-4" /> },
    { id: 'wingmen', label: 'Wingmen', icon: <Cpu className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Super Admin Console</h1>
              <p className="text-xs text-white/40">Wingman.vip Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              murphHealth?.connected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${murphHealth?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              Murph.AI {murphHealth?.connected ? 'Online' : 'Offline'}
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-sm">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: analytics?.totalUsers ?? stats?.totalUsers ?? 0, icon: <Users className="w-5 h-5" /> },
                { label: 'Active Wingmen', value: stats?.activeWingmen ?? 0, icon: <Cpu className="w-5 h-5" /> },
                { label: 'Organizations', value: analytics?.totalOrgs ?? tenants.length, icon: <Building2 className="w-5 h-5" /> },
                { label: 'Connections Made', value: stats?.totalConnections ?? 0, icon: <TrendingUp className="w-5 h-5" /> },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-purple-400 mb-3">
                    {kpi.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{Number(kpi.value).toLocaleString()}</div>
                  <div className="text-white/50 text-sm mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" /> System Health
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'API Gateway', status: true },
                    { label: 'Database (Aurora)', status: true },
                    { label: 'WebSocket Server', status: true },
                    { label: 'Murph.AI Agent', status: murphHealth?.connected ?? false },
                    { label: 'S3 Storage', status: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">{item.label}</span>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${item.status ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {item.status ? 'Operational' : 'Degraded'}
                      </div>
                    </div>
                  ))}
                </div>
                {murphHealth?.message && (
                  <p className="text-white/30 text-xs mt-3 pt-3 border-t border-white/10">{murphHealth.message}</p>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" /> Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    className="w-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 justify-start gap-2"
                    variant="outline"
                  >
                    <Database className="w-4 h-4" />
                    {seedMutation.isPending ? 'Seeding...' : 'Seed Platform Data'}
                  </Button>
                  <Button
                    onClick={() => { statsQuery.refetch(); tenantsQuery.refetch(); usersQuery.refetch(); analyticsQuery.refetch(); }}
                    className="w-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 justify-start gap-2"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh All Data
                  </Button>
                  <Button
                    onClick={() => murphHealthQuery.refetch()}
                    className="w-full bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30 justify-start gap-2"
                    variant="outline"
                  >
                    <Activity className="w-4 h-4" /> Check Murph.AI Status
                  </Button>
                </div>
              </div>
            </div>

            {analytics && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Auth Provider Breakdown</h3>
                <div className="flex gap-6 flex-wrap">
                  {Object.entries(analytics.authBreakdown).map(([provider, count]) => (
                    <div key={provider} className="text-center">
                      <div className="text-2xl font-bold text-white">{count as number}</div>
                      <div className="text-white/50 text-sm capitalize">{provider}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" /> Recent Activity
              </h3>
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-white/70 text-sm">{log.action}</span>
                      <span className="text-white/30 text-xs">{log.adminId ? `Admin #${log.adminId}` : 'System'}</span>
                    </div>
                    <span className="text-white/30 text-xs">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-white/30 text-sm text-center py-4">No recent activity</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── ORGANIZATIONS ─── */}
        {activeTab === 'tenants' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Organizations</h2>
              <Button onClick={() => setShowCreateTenant(true)} className="bg-purple-600 hover:bg-purple-500 text-white gap-2">
                <Plus className="w-4 h-4" /> New Organization
              </Button>
            </div>

            {showCreateTenant && (
              <div className="bg-white/5 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Create Organization</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/60 text-sm mb-1 block">Organization Name</label>
                    <Input value={newTenantName} onChange={e => setNewTenantName(e.target.value)} placeholder="Acme Corp" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-1 block">Slug</label>
                    <Input value={newTenantSlug} onChange={e => setNewTenantSlug(e.target.value)} placeholder="acme-corp" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-1 block">Plan</label>
                    <select
                      value={newTenantPlan}
                      onChange={e => setNewTenantPlan(e.target.value as OrgPlan)}
                      className="w-full h-10 px-3 bg-white/5 border border-white/20 rounded-md text-white text-sm"
                    >
                      {ORG_PLANS.map(t => <option key={t} value={t} className="bg-gray-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => createOrgMutation.mutate({ name: newTenantName, slug: newTenantSlug, plan: newTenantPlan, maxUsers: 10 })}
                    disabled={createOrgMutation.isPending || !newTenantName || !newTenantSlug}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <Button onClick={() => setShowCreateTenant(false)} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {tenant.name?.charAt(0) ?? 'O'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{tenant.name}</div>
                      <div className="text-white/40 text-sm">/{tenant.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      tenant.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      tenant.plan === 'professional' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      tenant.plan === 'starter' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-white/10 text-white/50 border border-white/20'
                    }`}>
                      {tenant.plan}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      tenant.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Suspended'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrgMutation.mutate({ orgId: tenant.id, plan: tenant.plan === 'enterprise' ? 'professional' : 'enterprise' })}
                      className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs h-7 px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" /> Upgrade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrgMutation.mutate({ orgId: tenant.id, isActive: !tenant.isActive })}
                      className={`text-xs h-7 px-2 ${tenant.isActive ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'}`}
                    >
                      {tenant.isActive ? <><Ban className="w-3 h-3 mr-1" />Suspend</> : 'Reinstate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm(`Permanently deactivate org #${tenant.id}? This cannot be undone.`)) {
                          deleteOrgMutation.mutate({ orgId: tenant.id, confirm: true });
                        }
                      }}
                      className="text-xs h-7 px-2 bg-red-900/20 border-red-800/40 text-red-500 hover:bg-red-900/40"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {tenants.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No organizations yet. Create one above.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-9 bg-white/5 border-white/20 text-white w-64"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Subscription</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Joined</th>
                    <th className="text-right px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0) ?? u.email?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{u.name ?? 'No name'}</div>
                            <div className="text-white/40 text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => updateUserMutation.mutate({ userId: u.id, role: e.target.value as UserRole })}
                          className="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xs"
                        >
                          {USER_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.subscriptionTier ?? 'free'}
                          onChange={e => updateUserMutation.mutate({ userId: u.id, subscriptionTier: e.target.value as UserTier })}
                          className="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-xs"
                        >
                          {USER_TIERS.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          u.suspendedAt ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {u.suspendedAt ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.suspendedAt ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendUserMutation.mutate({ userId: u.id, reason: 'Admin action', suspend: true })}
                              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs h-7 px-2"
                            >
                              <Ban className="w-3 h-3 mr-1" /> Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => suspendUserMutation.mutate({ userId: u.id, suspend: false })}
                              className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs h-7 px-2"
                            >
                              Reinstate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── SUBSCRIPTIONS ─── */}
        {activeTab === 'subscriptions' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl font-bold text-white">Subscription Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {USER_TIERS.map(tier => {
                const count = users.filter((u) => (u.subscriptionTier ?? 'free') === tier).length;
                return (
                  <div key={tier} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-white/10 text-purple-400">
                      {tier === 'enterprise' ? <Crown className="w-5 h-5" /> : tier === 'premium' ? <Star className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-white/50 text-sm capitalize">{tier} users</div>
                    <div className="mt-3 text-white/30 text-xs">
                      {tier === 'free' ? 'Basic Wingman access' : tier === 'premium' ? 'Full feature access' : 'Unlimited + API access'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Tier Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { tier: 'Free', features: ['1 Wingman', '10 daily introductions', 'Basic Soul Forge', 'Public spaces only'] },
                  { tier: 'Premium', features: ['1 Wingman', 'Unlimited introductions', 'Full Soul Forge (34 traits)', 'All spaces + Travel Intel', 'Wingman TV', 'Priority matching'] },
                  { tier: 'Enterprise', features: ['Multiple Wingmen', 'API access', 'Custom Soul Forge', 'Dedicated support', 'White-label options', 'Analytics dashboard'] },
                ].map(plan => (
                  <div key={plan.tier} className="space-y-2">
                    <div className="text-white font-medium">{plan.tier}</div>
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-white/60 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── WINGMEN MONITORING ─── */}
        {activeTab === 'wingmen' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-xl font-bold text-white">Wingman Monitoring</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Wingmen', value: stats?.activeWingmen ?? 0 },
                { label: 'Active Today', value: Math.floor((stats?.activeWingmen ?? 0) * 0.7) },
                { label: 'Introductions Today', value: stats?.totalConnections ?? 0 },
                { label: 'Avg Compatibility', value: '78%' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{kpi.value}</div>
                  <div className="text-white/50 text-sm mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Active Wingmen
              </h3>
              <div className="space-y-3">
                {users.slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-white/70 text-sm">{u.name ?? u.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>Tier: {u.subscriptionTier ?? 'free'}</span>
                      <span className={u.suspendedAt ? 'text-red-400' : 'text-green-400'}>
                        {u.suspendedAt ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">No users yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── AUDIT LOG ─── */}
        {activeTab === 'audit' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">Audit Log</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={auditActionFilter}
                  onChange={e => setAuditActionFilter(e.target.value)}
                  placeholder="Filter by action..."
                  className="bg-white/5 border-white/20 text-white w-40 h-8 text-sm"
                />
                <Input
                  value={auditAdminFilter}
                  onChange={e => setAuditAdminFilter(e.target.value)}
                  placeholder="Filter by admin ID..."
                  className="bg-white/5 border-white/20 text-white w-36 h-8 text-sm"
                />
                <Button onClick={() => auditQuery.refetch()} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2 text-sm h-8">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Timestamp</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Admin</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Resource</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs font-medium uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(log => {
                      const matchAction = !auditActionFilter || log.action?.toLowerCase().includes(auditActionFilter.toLowerCase());
                      const matchAdmin = !auditAdminFilter || String(log.adminId ?? '').includes(auditAdminFilter);
                      return matchAction && matchAdmin;
                    })
                    .map((log, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.action?.includes('delete') || log.action?.includes('suspend') ? 'bg-red-500/20 text-red-400' :
                          log.action?.includes('create') || log.action?.includes('register') ? 'bg-green-500/20 text-green-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm">{log.adminId ? `Admin #${log.adminId}` : 'System'}</td>
                      <td className="px-4 py-3 text-white/60 text-sm">{log.targetType ?? '—'}</td>
                      <td className="px-4 py-3 text-white/40 text-xs max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No audit events yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
