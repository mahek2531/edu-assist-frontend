import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl, buildAssetUrl } from '../lib/api';
import { AmbientBackground, AnimatedCounter, EmptyState, GameLoader } from './ui/GameUI';

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [juniors, setJuniors] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('juniors');
  const [activeHelpCategory, setActiveHelpCategory] = useState('ALL_PENDING');
  const [adminResponses, setAdminResponses] = useState({});

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) {
      window.location.href = '/adminlogin';
      return;
    }

    try {
      const parsed = JSON.parse(storedAdmin);
      setAdmin(parsed);
      fetchAllData();
    } catch (err) {
      localStorage.removeItem('admin');
      window.location.href = '/adminlogin';
    }
  }, []);

  const tryGet = async (urls) => {
    for (const url of urls) {
      try {
        const res = await axios.get(url);
        return res;
      } catch (err) {
        // try next
      }
    }
    throw new Error('All GET endpoints failed');
  };

  const tryPost = async (urls, body = {}) => {
    for (const url of urls) {
      try {
        const res = await axios.post(url, body);
        return res;
      } catch (err) {
        // try next
      }
    }
    throw new Error('All POST endpoints failed');
  };

  const tryDelete = async (urls) => {
    for (const url of urls) {
      try {
        const res = await axios.delete(url);
        return res;
      } catch (err) {
        // try next
      }
    }
    throw new Error('All DELETE endpoints failed');
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const [juniorsRes, seniorsRes, doubtsRes, leaderboardRes, helpRes] = await Promise.allSettled([
        axios.get(buildApiUrl('/api/admin/juniors')),
        axios.get(buildApiUrl('/api/admin/seniors')),
        axios.get(buildApiUrl('/api/doubt/posted')),
        axios.get(buildApiUrl('/api/admin/leaderboard')),
        tryGet([
          buildApiUrl('/api/help/all'),
          buildApiUrl('/api/admin/help/all'),
          buildApiUrl('/api/help')
        ])
      ]);

      const isOk = (res) =>
        res.status === 'fulfilled' &&
        (res.value?.data?.success === true || res.value?.data?.status === true);

      if (isOk(juniorsRes)) {
        setJuniors(
          juniorsRes.value.data.juniors ||
          juniorsRes.value.data.students ||
          juniorsRes.value.data.data ||
          []
        );
      } else {
        setJuniors([]);
      }

      if (isOk(seniorsRes)) {
        setSeniors(
          seniorsRes.value.data.seniors ||
          seniorsRes.value.data.students ||
          seniorsRes.value.data.data ||
          []
        );
      } else {
        setSeniors([]);
      }

      if (isOk(doubtsRes)) {
        setDoubts(
          doubtsRes.value.data.Doubts ||
          doubtsRes.value.data.doubts ||
          doubtsRes.value.data.data ||
          []
        );
      } else {
        setDoubts([]);
      }

      if (isOk(leaderboardRes)) {
        let data = leaderboardRes.value.data.leaderboard || [];
        data.sort((a, b) => {
          if ((b.totalPoints ?? 0) !== (a.totalPoints ?? 0)) {
            return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
          }
          return (b.doubtsSolved ?? 0) - (a.doubtsSolved ?? 0);
        });

        const rankedData = [];
        let currentRank = 1;

        for (let i = 0; i < data.length; i++) {
          if (i > 0) {
            const prev = data[i - 1];
            const curr = data[i];
            if (
              (curr.totalPoints ?? 0) !== (prev.totalPoints ?? 0) ||
              (curr.doubtsSolved ?? 0) !== (prev.doubtsSolved ?? 0)
            ) {
              currentRank = i + 1;
            }
          }
          rankedData.push({ ...data[i], rank: currentRank });
        }

        setLeaderboard(rankedData);
      } else {
        setLeaderboard([]);
      }

      if (helpRes.status === 'fulfilled') {
        const helpData = helpRes.value.data;
        const requests =
          helpData.helpRequests ||
          helpData.requests ||
          helpData.data ||
          [];

        requests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setHelpRequests(requests);
      } else {
        setHelpRequests([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudent = async (type, id) => {
    setActionLoading((prev) => ({ ...prev, [`${type}-${id}`]: true }));

    const endpoints =
      type === 'junior'
        ? [
          buildApiUrl(`/api/admin/verify-junior/${id}`),
          buildApiUrl(`/api/admin/juniors/verify/${id}`)
        ]
        : [
          buildApiUrl(`/api/admin/verify-senior/${id}`),
          buildApiUrl(`/api/admin/seniors/verify/${id}`)
        ];

    try {
      const res = await tryPost(endpoints);

      if (res.data.success || res.data.status) {
        alert(res.data.message || `${type} verified successfully`);
        fetchAllData();
      } else {
        alert(res.data.message || 'Verification failed');
      }
    } catch (err) {
      alert('Error during verification');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${type}-${id}`]: false }));
    }
  };

  const handleVerifyDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to verify this doubt?')) return;

    setActionLoading((prev) => ({ ...prev, [`doubt-${doubtId}`]: true }));

    try {
      const res = await axios.post(buildApiUrl(`/api/doubt/verify/${doubtId}`));

      if (res.data.status) {
        alert(res.data.message || 'Doubt verified successfully');
        await fetchAllData();
      } else {
        alert(res.data.message || 'Verification failed');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error verifying doubt');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`doubt-${doubtId}`]: false }));
    }
  };

  const handleVerifyAllDoubts = async () => {
    if (!window.confirm('Verify ALL pending doubts?')) return;

    setActionLoading((prev) => ({ ...prev, verifyAllDoubts: true }));

    try {
      const res = await tryPost([
        buildApiUrl('/api/admin/approve-doubts'),
        buildApiUrl('/api/doubt/approve-all')
      ]);

      if (res.data.status || res.data.success) {
        alert(res.data.message || 'All pending doubts approved successfully');
        fetchAllData();
      } else {
        alert(res.data.message || 'Bulk approval failed');
      }
    } catch (err) {
      alert('Error approving all doubts');
    } finally {
      setActionLoading((prev) => ({ ...prev, verifyAllDoubts: false }));
    }
  };

  const handleRejectDoubt = async (doubtId) => {
    if (!window.confirm('Reject this doubt?')) return;

    setActionLoading((prev) => ({ ...prev, [`doubt-${doubtId}`]: true }));

    try {
      const res = await axios.post(buildApiUrl(`/api/doubt/reject/${doubtId}`));

      if (res.data.status) {
        alert(res.data.message || 'Doubt rejected successfully');
        await fetchAllData();
      } else {
        alert(res.data.message || 'Rejection failed');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting doubt');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`doubt-${doubtId}`]: false }));
    }
  };

  const handleResolveHelpRequest = async (helpId) => {
    if (!window.confirm('Mark this help request as resolved?')) return;

    setActionLoading((prev) => ({ ...prev, [`help-${helpId}`]: true }));

    try {
      const res = await tryPost(
        [
          buildApiUrl(`/api/help/resolve/${helpId}`),
          buildApiUrl(`/api/help/update-status/${helpId}`),
          buildApiUrl(`/api/admin/help/resolve/${helpId}`)
        ],
        {
          adminResponse: adminResponses[helpId] || ''
        }
      );

      if (res.data.status || res.data.success) {
        alert(res.data.message || 'Help request updated successfully');
        setAdminResponses((prev) => ({ ...prev, [helpId]: '' }));
        fetchAllData();
      } else {
        alert(res.data.message || 'Failed to update help request');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Resolve endpoint not available yet in backend');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`help-${helpId}`]: false }));
    }
  };

  const getSavedAdminResponse = (item) => (
    item.adminResponse ||
    item.response ||
    item.reply ||
    ''
  );

  const handleDeleteJunior = async (id) => {
    if (!window.confirm('Are you sure you want to delete this junior student?')) return;

    setActionLoading((prev) => ({ ...prev, [`delete-junior-${id}`]: true }));

    try {
      const res = await tryDelete([
        buildApiUrl(`/api/junior/delete/${id}`),
        buildApiUrl(`/api/junior/${id}`)
      ]);

      if (res.data?.status || res.data?.success || res.status === 200) {
        alert(res.data?.message || 'Junior deleted successfully');
        fetchAllData();
      } else {
        alert(res.data?.message || 'Failed to delete junior');
      }
    } catch (error) {
      console.error('Error deleting junior:', error);
      alert(error.response?.data?.message || 'Error deleting junior');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-junior-${id}`]: false }));
    }
  };

  const handleDeleteSenior = async (id) => {
    if (!window.confirm('Are you sure you want to delete this senior student?')) return;

    setActionLoading((prev) => ({ ...prev, [`delete-senior-${id}`]: true }));

    try {
      const res = await axios.delete(buildApiUrl(`/api/senior/delete/${id}`));

      if (res.data?.status || res.data?.success || res.status === 200) {
        alert(res.data?.message || 'Senior deleted successfully');
        fetchAllData();
      } else {
        alert(res.data?.message || 'Failed to delete senior');
      }
    } catch (error) {
      console.error('Error deleting senior:', error);
      alert(error.response?.data?.message || 'Error deleting senior');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-senior-${id}`]: false }));
    }
  };

  const handleDelete = async (type, id) => {
    if (type === 'junior') {
      await handleDeleteJunior(id);
    } else if (type === 'senior') {
      await handleDeleteSenior(id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('role');
    window.location.href = '/adminlogin';
  };

  const getVerificationBadge = (item) => {
    if (item?.verificationStatus) {
      if (item.verificationStatus === 'AUTO_VERIFIED') return 'Auto Verified';
      if (item.verificationStatus === 'VERIFIED') return 'Verified';
      return 'Pending';
    }

    if (item?.autoVerified === true) return 'Auto Verified';
    if (item?.verified === true) return 'Verified';
    return 'Pending';
  };

  const getVerificationBadgeClass = (item) => {
    const status = getVerificationBadge(item);
    if (status === 'Auto Verified') return 'bg-blue-100 text-blue-800';
    if (status === 'Verified') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const normalizedHelpRequests = useMemo(() => {
    return helpRequests.map((item) => ({
      ...item,
      normalizedType: (item.type || item.category || item.requestType || 'HELP').toUpperCase()
    }));
  }, [helpRequests]);

  const filteredHelpRequests = useMemo(() => {
    if (activeHelpCategory === 'SOLVED') {
      return normalizedHelpRequests.filter(
        (item) => (item.status || 'PENDING').toUpperCase() === 'RESOLVED'
      );
    }

    if (activeHelpCategory === 'ALL_PENDING') {
      return normalizedHelpRequests.filter(
        (item) => (item.status || 'PENDING').toUpperCase() !== 'RESOLVED'
      );
    }

    return normalizedHelpRequests.filter(
      (item) =>
        item.normalizedType === activeHelpCategory &&
        (item.status || 'PENDING').toUpperCase() !== 'RESOLVED'
    );
  }, [normalizedHelpRequests, activeHelpCategory]);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center ea-dashboard-shell ea-dashboard-admin">
        <AmbientBackground variant="admin" density={10} />
        <GameLoader label="Initializing command console..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ea-dashboard-shell ea-dashboard-admin">
      <AmbientBackground variant="admin" density={12} />
      <header className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white shadow-lg ea-admin-command-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-800 font-bold text-xl shadow">
              EA
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Edu Assist Admin</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-semibold">{admin.name || 'Administrator'}</p>
              <p className="text-sm text-indigo-200">{admin.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 ea-command-main ea-section-choreography">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Juniors', value: juniors.length, tone: 'text-indigo-700' },
            { label: 'Seniors', value: seniors.length, tone: 'text-purple-700' },
            { label: 'Doubts', value: doubts.length, tone: 'text-cyan-700' },
            { label: 'Help Requests', value: helpRequests.length, tone: 'text-amber-700' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow p-5 ea-mission-card">
              <p className="text-sm font-semibold text-gray-500">{item.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${item.tone}`}>
                <AnimatedCounter value={item.value} />
              </p>
              <div className="ea-level-bar mt-3" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(16, item.value * 10))}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl shadow-sm overflow-x-auto ea-tab-rail">
          {['juniors', 'seniors', 'doubts', 'help', 'leaderboard', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 px-6 text-center font-medium transition-all ${activeTab === tab
                ? 'border-b-4 border-indigo-600 text-indigo-700 bg-indigo-50'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
            >
              {tab === 'juniors'
                ? 'Juniors'
                : tab === 'seniors'
                  ? 'Seniors'
                  : tab === 'doubts'
                    ? 'Posted Doubts'
                    : tab === 'help'
                      ? 'Help Requests'
                      : tab === 'leaderboard'
                        ? 'Leaderboard'
                        : 'Admin Profile'}
            </button>
          ))}
        </div>

        {loading ? (
          <GameLoader label="Syncing admin telemetry..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'juniors' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Junior MCA Students ({juniors.length})
                  </h2>
                  <button
                    onClick={fetchAllData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Refresh
                  </button>
                </div>

                {juniors.length === 0 ? (
                  <div className="bg-white rounded-xl shadow">
                    <EmptyState title="No juniors detected" text="Junior accounts will appear here as soon as registrations enter the console." icon="award" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Photo</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Verified</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {juniors.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                  src={item.photo ? buildAssetUrl(item.photo) : 'https://via.placeholder.com/40'}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/40';
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">{item.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">{item.rollNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getVerificationBadgeClass(item)}`}>
                                  {getVerificationBadge(item)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-3">
                                  {getVerificationBadge(item) === 'Pending' && (
                                    <button
                                      onClick={() => handleVerifyStudent('junior', item.id)}
                                      disabled={actionLoading[`junior-${item.id}`]}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${actionLoading[`junior-${item.id}`]
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                      {actionLoading[`junior-${item.id}`] ? 'Verifying...' : 'Verify'}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDelete('junior', item.id)}
                                    disabled={actionLoading[`delete-junior-${item.id}`]}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${actionLoading[`delete-junior-${item.id}`]
                                      ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                      }`}
                                  >
                                    {actionLoading[`delete-junior-${item.id}`] ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'seniors' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Senior MCA Students ({seniors.length})
                  </h2>
                  <button
                    onClick={fetchAllData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Refresh
                  </button>
                </div>

                {seniors.length === 0 ? (
                  <div className="bg-white rounded-xl shadow">
                    <EmptyState title="No seniors detected" text="Mentor accounts will appear here when senior registrations are available." icon="trophy" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Photo</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Verified</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {seniors.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                  src={item.photo ? buildAssetUrl(item.photo) : 'https://via.placeholder.com/40'}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/40';
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">{item.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">{item.rollNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getVerificationBadgeClass(item)}`}>
                                  {getVerificationBadge(item)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-3">
                                  {getVerificationBadge(item) === 'Pending' && (
                                    <button
                                      onClick={() => handleVerifyStudent('senior', item.id)}
                                      disabled={actionLoading[`senior-${item.id}`]}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${actionLoading[`senior-${item.id}`]
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                      {actionLoading[`senior-${item.id}`] ? 'Verifying...' : 'Verify'}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDelete('senior', item.id)}
                                    disabled={actionLoading[`delete-senior-${item.id}`]}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${actionLoading[`delete-senior-${item.id}`]
                                      ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                      }`}
                                  >
                                    {actionLoading[`delete-senior-${item.id}`] ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'doubts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Posted Doubts ({doubts.length})
                  </h2>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={fetchAllData}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Refresh
                    </button>

                    {doubts.some((d) => d.status === 'PENDING') && (
                      <button
                        onClick={handleVerifyAllDoubts}
                        disabled={actionLoading.verifyAllDoubts}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-sm ${actionLoading.verifyAllDoubts
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                      >
                        {actionLoading.verifyAllDoubts ? 'Verifying All...' : 'Verify All Doubts'}
                      </button>
                    )}
                  </div>
                </div>

                {doubts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow">
                    <EmptyState title="Mission board empty" text="Posted doubts will populate this moderation board when students submit them." icon="award" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Asked By</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Raised At</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {doubts.map((doubt) => (
                            <tr key={doubt.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {doubt.subject || '—'}
                              </td>
                              <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                                {doubt.description || '—'}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {doubt.askedBy || doubt.askerName || doubt.studentName || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">
                                {formatDate(doubt.doubtRaisedAt)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${doubt.status === 'SOLVED'
                                    ? 'bg-green-100 text-green-800'
                                    : doubt.status === 'REJECTED'
                                      ? 'bg-red-100 text-red-800'
                                      : doubt.status === 'APPROVED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : doubt.status === 'PENDING'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                  {doubt.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {!doubt.verified && doubt.status === 'PENDING' ? (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleVerifyDoubt(doubt.id)}
                                      disabled={actionLoading[`doubt-${doubt.id}`]}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition min-w-[70px] ${actionLoading[`doubt-${doubt.id}`]
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                      {actionLoading[`doubt-${doubt.id}`] ? '...' : 'Verify'}
                                    </button>

                                    <button
                                      onClick={() => handleRejectDoubt(doubt.id)}
                                      disabled={actionLoading[`doubt-${doubt.id}`]}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition min-w-[70px] ${actionLoading[`doubt-${doubt.id}`]
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                    >
                                      {actionLoading[`doubt-${doubt.id}`] ? '.' : 'Reject'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs italic">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'help' && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-white">
                    {activeHelpCategory === 'SOLVED' ? 'Solved Problems' : 'Help Requests'} ({filteredHelpRequests.length})
                  </h2>
                  <button
                    onClick={fetchAllData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Refresh
                  </button>
                </div>

                <div className="flex gap-3 mb-6 flex-wrap">
                  {[
                    { key: 'ALL_PENDING', label: 'All' },
                    { key: 'FAQ', label: 'FAQ' },
                    { key: 'SUPPORT', label: 'Support' },
                    { key: 'PROBLEM', label: 'Problem' },
                    { key: 'SOLVED', label: 'Solved Problems' }
                  ].map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setActiveHelpCategory(type.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeHelpCategory === type.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {filteredHelpRequests.length === 0 ? (
                  <div className="bg-white rounded-xl shadow">
                    <EmptyState
                      title={activeHelpCategory === 'SOLVED' ? 'No resolved signals' : 'No support signals'}
                      text={activeHelpCategory === 'SOLVED'
                        ? 'Resolved help requests will be archived here after admin action.'
                        : 'Incoming help requests for this filter will appear in this console.'}
                      icon="trophy"
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredHelpRequests.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl shadow border border-gray-200 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                {item.normalizedType}
                              </span>
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${(item.status || 'PENDING') === 'RESOLVED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                                  }`}
                              >
                                {item.status || 'PENDING'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.subject || '—'}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.name || '—'} • {item.email || '—'} • {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">User Message</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{item.message || '—'}</p>
                        </div>

                        {(item.status || 'PENDING') === 'RESOLVED' ? (
                          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Admin Response</p>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {getSavedAdminResponse(item) || 'No admin response added.'}
                            </p>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Response</label>
                            <textarea
                              rows={3}
                              value={adminResponses[item.id] ?? item.adminResponse ?? ''}
                              onChange={(e) =>
                                setAdminResponses((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                              placeholder="Write your response here..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                          </div>
                        )}

                        {(item.status || 'PENDING') === 'RESOLVED' ? (
                          <div className="text-green-700 text-sm font-medium">
                            This request has been resolved.
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResolveHelpRequest(item.id)}
                            disabled={actionLoading[`help-${item.id}`]}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${actionLoading[`help-${item.id}`]
                              ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                          >
                            {actionLoading[`help-${item.id}`] ? 'Updating...' : 'Mark as Resolved'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Leaderboard ({leaderboard.length})
                  </h2>
                  <button
                    onClick={fetchAllData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Refresh
                  </button>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="bg-white rounded-xl shadow">
                    <EmptyState title="Leaderboard offline" text="Senior rank telemetry will activate when leaderboard data is available." icon="trophy" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Photo</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Solved</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {leaderboard.map((item, index) => (
                            <tr key={item.seniorId || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-700">
                                #{item.rank || index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <img
                                  src={item.photo ? buildAssetUrl(item.photo) : 'https://via.placeholder.com/40'}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/40';
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {item.seniorName || item.name || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                                {item.seniorEmail || item.email || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                                {item.doubtsSolved ?? 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm font-semibold">
                                {item.totalPoints ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow p-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg">
                      {(admin?.name?.charAt(0) || 'A').toUpperCase()}
                    </div>
                    <p className="mt-4 text-sm text-gray-500">Administrator Account</p>
                  </div>

                  <div className="flex-1 w-full">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Profile</h2>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-sm text-gray-500 mb-2">Full Name</p>
                        <p className="text-lg font-semibold text-gray-900">{admin?.name || 'Administrator'}</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-sm text-gray-500 mb-2">Email Address</p>
                        <p className="text-lg font-semibold text-gray-900 break-all">{admin?.email || '—'}</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-sm text-gray-500 mb-2">Role</p>
                        <p className="text-lg font-semibold text-gray-900">{admin?.role || 'ADMIN'}</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-sm text-gray-500 mb-2">Account Status</p>
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
