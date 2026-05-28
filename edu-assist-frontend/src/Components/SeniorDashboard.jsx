// src/pages/SeniorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, buildAssetUrl } from '../lib/api';
import {
  LayoutDashboard,
  BookCheck,
  User,
  LogOut,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  Edit
} from 'lucide-react';
import { AmbientBackground, EmptyState, GameLoader } from './ui/GameUI';

const SeniorDashboard = () => {
  const navigate = useNavigate();
  const expertiseOptions = [
    'Java',
    'DBMS',
    'Python',
    'Web Development',
    'Maths',
    'Operating System',
    'Computer Network',
    'DSA',
  ];
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Available verified doubts (to be solved)
  const [availableDoubts, setAvailableDoubts] = useState([]);
  const [loadingDoubts, setLoadingDoubts] = useState(false);
  const [doubtsError, setDoubtsError] = useState('');

  // More doubts (unmatched/open doubts visible to all seniors)
  const [moreDoubts, setMoreDoubts] = useState([]);
  const [loadingMoreDoubts, setLoadingMoreDoubts] = useState(false);
  const [moreDoubtsError, setMoreDoubtsError] = useState('');

  // My doubts (accepted by me)
  const [myDoubts, setMyDoubts] = useState([]);
  const [loadingMyDoubts, setLoadingMyDoubts] = useState(false);
  const [myDoubtsError, setMyDoubtsError] = useState('');

  // Solved doubts with full details (solutions & remarks)
  const [solvedDoubts, setSolvedDoubts] = useState([]);
  const [loadingSolvedDoubts, setLoadingSolvedDoubts] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');

  // Solving flow
  const [selectedDoubtId, setSelectedDoubtId] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionFile, setSolutionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // doubtId → 'accepting' | 'submitting' | false

  // Expanded doubt for viewing solution & remarks
  const [expandedDoubtId, setExpandedDoubtId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState({});

  // Profile
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Edit Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    expertiseSubjects: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('seniorUser');
const role = localStorage.getItem('role');

if (!storedUser || role !== 'senior') {
  navigate('/login/senior');
  return;
}

try {
  const parsed = JSON.parse(storedUser);
  const hasRollNumber = parsed.rollNumber && String(parsed.rollNumber).trim();
  const hasUploadedPhoto =
    parsed.photo &&
    String(parsed.photo).trim() &&
    !String(parsed.photo).trim().startsWith('http');

  if (!hasRollNumber || !hasUploadedPhoto) {
    navigate('/complete-profile/senior');
    return;
  }

  setUser(parsed);
  fetchAvailableDoubts(parsed.id);
  fetchMyDoubts(parsed.id);
  fetchSolvedDoubts(parsed.id);
  fetchLeaderboard();
  fetchProfile(parsed.id);
} catch (err) {
  localStorage.removeItem('seniorUser');
  localStorage.removeItem('seniorUserId');
  localStorage.removeItem('role');
  navigate('/login/senior');
}

  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchSolvedDoubts(user.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchAvailableDoubts = async (seniorId = user?.id) => {
    if (!seniorId) {
      setDoubtsError('Senior session not found. Please login again.');
      return;
    }

    setLoadingDoubts(true);
    setDoubtsError('');

    try {
      const res = await axios.get(buildApiUrl(`/api/senior/verifiedDoubts?seniorId=${seniorId}`));
      if (res.data.status) {
        setAvailableDoubts(res.data.doubts || res.data.availableDoubts || res.data.VerifiedDoubts || []);
      } else {
        setDoubtsError(res.data.message || 'No available doubts found');
      }
    } catch (err) {
      setDoubtsError(err.response?.data?.message || 'Failed to load available doubts');
    } finally {
      setLoadingDoubts(false);
    }
  };

  const fetchMoreDoubts = async () => {
    setLoadingMoreDoubts(true);
    setMoreDoubtsError('');

    try {
      const res = await axios.get(buildApiUrl('/api/senior/openDoubts'));
      if (res.data.status) {
        setMoreDoubts(res.data.doubts || []);
      } else {
        setMoreDoubtsError(res.data.message || 'No more doubts found');
      }
    } catch (err) {
      setMoreDoubtsError(err.response?.data?.message || 'Failed to load more doubts');
    } finally {
      setLoadingMoreDoubts(false);
    }
  };

  const fetchMyDoubts = async (seniorId) => {
    setLoadingMyDoubts(true);
    setMyDoubtsError('');

    try {
      const res = await axios.get(buildApiUrl(`/api/senior/doubts/${seniorId}`));
      if (res.data.status) {
        setMyDoubts(res.data.doubts || []);
      } else {
        setMyDoubtsError(res.data.message || 'No doubts found');
      }
    } catch (err) {
      setMyDoubtsError(err.response?.data?.message || 'Failed to load your doubts');
    } finally {
      setLoadingMyDoubts(false);
    }
  };

  const fetchSolvedDoubts = async (seniorId) => {
    setLoadingSolvedDoubts(true);

    try {
      const res = await axios.get(buildApiUrl(`/api/senior/solutions/${seniorId}`));
      if (res.data.status) {
        setSolvedDoubts(res.data.doubts || []);
      }
    } catch (err) {
      console.error('Failed to load solved doubts:', err);
    } finally {
      setLoadingSolvedDoubts(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    setLeaderboardError('');

    try {
      const res = await axios.get(buildApiUrl('/api/senior/leaderboard'));
      if (res.data.status) {
        let data = res.data.leaderboard || [];
        data.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.doubtsSolved - a.doubtsSolved;
        });

        let rankedData = [];
        let rank = 1;
        for (let i = 0; i < data.length; i++) {
          if (i > 0) {
            const prev = data[i - 1];
            const curr = data[i];
            if (curr.totalPoints === prev.totalPoints && curr.doubtsSolved === prev.doubtsSolved) {
              // Tie
            } else {
              rank = i + 1;
            }
          }
          rankedData.push({ ...data[i], rank });
        }

        setLeaderboard(rankedData);
      } else {
        setLeaderboardError(res.data.message || 'No leaderboard data available');
      }
    } catch (err) {
      setLeaderboardError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchProfile = async (id) => {
    setLoadingProfile(true);
    setProfileError('');

    try {
      const res = await axios.get(buildApiUrl(`/api/senior/profile/${id}`));
      if (res.data.status) {
        const student = res.data.student;
setProfile(student);

const actualStudent = student?.id ? student : student?.get || student;

const updatedUser = {
  id: actualStudent.id,
  photo: actualStudent.photo,
  name: actualStudent.name,
  email: actualStudent.email,
  rollNumber: actualStudent.rollNumber,
  expertiseSubjects: actualStudent.expertiseSubjects,
  verified: actualStudent.verified,
  autoVerified: actualStudent.autoVerified
};

setUser(updatedUser);
localStorage.setItem('seniorUser', JSON.stringify(updatedUser));
localStorage.setItem('seniorUserId', actualStudent.id);

// Pre-fill edit form
setEditForm({
  name: actualStudent.name || '',
  email: actualStudent.email || '',
  rollNumber: actualStudent.rollNumber || '',
  password: '',
  expertiseSubjects: actualStudent.expertiseSubjects || ''
});

      } else {
        setProfileError(res.data.message || 'Profile not found');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleExpertiseChange = (subject) => {
    const selectedSubjects = editForm.expertiseSubjects
      ? editForm.expertiseSubjects.split(',').filter(Boolean)
      : [];
    const nextSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject)
      : [...selectedSubjects, subject];

    setEditForm({ ...editForm, expertiseSubjects: nextSubjects.join(',') });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMsg({ type: '', text: '' });
    setUpdatingProfile(true);

    // Prepare payload - only include fields that have values
    const payload = {};
    if (editForm.name.trim()) payload.name = editForm.name.trim();
    if (editForm.email.trim()) payload.email = editForm.email.trim();
    if (editForm.rollNumber.trim()) payload.rollNumber = editForm.rollNumber.trim();
    if (editForm.password.trim()) payload.password = editForm.password.trim();
    payload.expertiseSubjects = editForm.expertiseSubjects;

    // If no changes
    if (Object.keys(payload).length === 0) {
      setUpdateMsg({ type: 'info', text: 'No changes to save' });
      setUpdatingProfile(false);
      return;
    }

    try {
      const res = await axios.put(
        buildApiUrl(`/api/senior/update/${user.id}`),
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.status) {
        setUpdateMsg({ type: 'success', text: res.data.message || 'Profile updated successfully!' });
        await fetchProfile(user.id);
        setIsEditingProfile(false);
      } else {
        setUpdateMsg({ type: 'error', text: res.data.message || 'Failed to update profile' });
      }
    } catch (err) {
      setUpdateMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error updating profile. Please try again.'
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAcceptDoubt = async (doubtId) => {
    if (!window.confirm('Do you want to accept this doubt and open the chat?')) return;

    setActionLoading((prev) => ({ ...prev, [doubtId]: 'accepting' }));

    try {
      const res = await axios.post(
        buildApiUrl(`/api/doubt/accept/${doubtId}/${user.id}`)
      );

      if (res.data.status) {
        setAvailableDoubts((prev) => prev.filter((d) => d.id !== doubtId));
        await fetchMyDoubts(user.id);
        await fetchChatMessages(doubtId);
        setSelectedDoubtId(doubtId);
        setActiveSection('my-doubts');
        alert('Doubt accepted successfully. Chat is now open in My Doubts.');
      } else {
        alert(res.data.message || 'Failed to accept doubt');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting doubt');
    } finally {
      setActionLoading((prev) => ({ ...prev, [doubtId]: false }));
    }
  };

  const handleSubmitSolution = async (doubtId) => {
    if (!solutionText.trim()) {
      alert('Please enter your solution text');
      return;
    }

    const shouldCloseChat = window.confirm(
      'Do you also want to close the chat after submitting the solution? Click OK for Yes, Cancel for No.'
    );

    setSubmitting(true);
    setActionLoading((prev) => ({ ...prev, [doubtId]: 'submitting' }));

    const formData = new FormData();
    formData.append('solutionText', solutionText);
    if (solutionFile) {
      formData.append('solutionPic', solutionFile);
    }

    try {
      const res = await axios.post(
        buildApiUrl(`/api/doubt/submit-solution/${doubtId}/${user.id}?closeChat=${shouldCloseChat}`),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data.status) {
        alert(res.data.message || 'Solution submitted successfully!');
        setSolutionText('');
        setSolutionFile(null);
        setSelectedDoubtId(null);
        fetchAvailableDoubts(user.id);
        fetchMyDoubts(user.id);
        fetchSolvedDoubts(user.id);
        fetchChatMessages(doubtId);
      } else {
        alert(res.data.message || 'Failed to submit solution');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting solution');
    } finally {
      setSubmitting(false);
      setActionLoading((prev) => ({ ...prev, [doubtId]: false }));
    }
  };


  const fetchChatMessages = async (doubtId) => {
    try {
      const res = await axios.get(buildApiUrl(`/api/chat/${doubtId}/${user.id}/SENIOR`));
      if (res.data.status) {
        setChatMessages((prev) => ({ ...prev, [doubtId]: res.data.messages || [] }));
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  const handleSendChatMessage = async (doubtId) => {
    const message = (chatInput[doubtId] || '').trim();
    if (!message) return;

    try {
      const res = await axios.post(
        buildApiUrl(`/api/chat/send/${doubtId}/${user.id}/SENIOR`),
        { message },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.status) {
        setChatInput((prev) => ({ ...prev, [doubtId]: '' }));
        fetchChatMessages(doubtId);
        fetchMyDoubts(user.id);
      } else {
        alert(res.data.message || 'Failed to send message');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending message');
    }
  };

  const handleCloseChat = async (doubtId) => {
    if (!window.confirm('Do you want to close this chat? After closing, no more messages can be sent.')) return;

    try {
      const res = await axios.post(buildApiUrl(`/api/doubt/close-chat/${doubtId}/${user.id}/SENIOR`));
      if (res.data.status) {
        alert(res.data.message || 'Chat closed successfully');
        fetchMyDoubts(user.id);
        fetchSolvedDoubts(user.id);
        fetchChatMessages(doubtId);
      } else {
        alert(res.data.message || 'Failed to close chat');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing chat');
    }
  };

  const handleLogout = () => {
  localStorage.removeItem('seniorUser');
  localStorage.removeItem('seniorUserId');
  localStorage.removeItem('role');
  navigate('/login/senior');
};

  const getDoubtStudentName = (doubt) => (
    doubt.studentName ||
    doubt.juniorName ||
    doubt.student?.name ||
    doubt.junior?.name ||
    doubt.askedBy ||
    'Junior Student'
  );

  const getDoubtStudentEmail = (doubt) => (
    doubt.studentEmail ||
    doubt.juniorEmail ||
    doubt.student?.email ||
    doubt.junior?.email ||
    doubt.email ||
    ''
  );

  const getDoubtDate = (doubt) => (
    doubt.doubtRaisedAt ||
    doubt.createdAt ||
    doubt.raisedAt ||
    doubt.date
  );

  const getDoubtAttachment = (doubt) => (
    doubt.doubtPic ||
    doubt.attachment ||
    doubt.attachmentUrl ||
    doubt.imageUrl
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 ea-dashboard-shell ea-dashboard-senior">
      <AmbientBackground variant="senior" density={10} />
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm fixed w-full z-50 ea-command-nav ea-senior-command-nav">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] h-16 items-center gap-4">
            <div className="flex items-center gap-3 shrink-0 ea-senior-brand">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                EA
              </div>
              <span className="text-xl font-bold text-gray-900">Edu Assist</span>
            </div>

            <div className="hidden md:flex items-center justify-center gap-2 lg:gap-3 min-w-0 ea-senior-nav-links">
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'dashboard' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveSection('verified-doubts');
                  fetchAvailableDoubts(user.id);
                }}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'verified-doubts' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <BookCheck size={18} /> Available Doubts
              </button>

              <button
                onClick={() => {
                  setActiveSection('more-doubts');
                  fetchMoreDoubts();
                }}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'more-doubts' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <BookCheck size={18} /> More Doubts
              </button>

              <button
                onClick={() => {
                  setActiveSection('my-doubts');
                  fetchMyDoubts(user.id);
                }}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'my-doubts' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <BookCheck size={18} /> My Doubts
              </button>

              <button
                onClick={() => {
                  setActiveSection('leaderboard');
                  fetchLeaderboard();
                }}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'leaderboard' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Trophy size={18} /> Leaderboard
              </button>

              <button
                onClick={() => setActiveSection('profile')}
                className={`flex items-center gap-2 font-medium transition ea-senior-nav-button ${
                  activeSection === 'profile' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <User size={18} /> Profile
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0 min-w-0 ea-senior-user-actions">
              <div className="flex items-center gap-3 min-w-0 ea-senior-user-chip">
                <img
                  src={buildAssetUrl((profile?.photo || user?.photo || 'default-avatar.png'))}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-purple-100 shrink-0"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/36?text=User')}
                />
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 text-sm shrink-0 ea-senior-logout"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ea-command-main ea-section-choreography">
        {/* Dashboard Overview */}
        {activeSection === 'dashboard' && (
          <div className="space-y-10">
            <div className="bg-white rounded-2xl shadow p-8 ea-command-hero">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                Senior MCA Student • Helping juniors grow
              </p>
              <div className="mt-6 max-w-xl">
                <div className="flex items-center justify-between text-sm font-semibold text-purple-700 mb-2">
                  <span>Mentor rank progress</span>
                  <span>{Math.min(100, myDoubts.filter(d => d.status === 'SOLVED').length * 25)}%</span>
                </div>
                <div className="ea-level-bar">
                  <span style={{ width: `${Math.min(100, Math.max(12, myDoubts.filter(d => d.status === 'SOLVED').length * 25))}%` }} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Available Doubts</h3>
                  <BookCheck className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Solve verified doubts posted by juniors</p>
                <button
                  onClick={() => {
                    setActiveSection('verified-doubts');
                    fetchAvailableDoubts(user.id);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  View Available Doubts
                </button>
              </div>

              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">More Doubts</h3>
                  <BookCheck className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Browse unmatched open doubts from juniors</p>
                <button
                  onClick={() => {
                    setActiveSection('more-doubts');
                    fetchMoreDoubts();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  View More Doubts
                </button>
              </div>

              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">My Doubts</h3>
                  <BookCheck className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">View doubts you've accepted</p>
                <button
                  onClick={() => {
                    setActiveSection('my-doubts');
                    fetchMyDoubts(user.id);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  View My Doubts
                </button>
              </div>

              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Leaderboard</h3>
                  <Trophy className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">See how you rank among seniors</p>
                <button
                  onClick={() => {
                    setActiveSection('leaderboard');
                    fetchLeaderboard();
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  View Leaderboard
                </button>
              </div>

              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
                  <User className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Update your information & photo</p>
                <button
                  onClick={() => setActiveSection('profile')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition"
                >
                  View Profile
                </button>
              </div>

              <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Help Stats</h3>
                  <MessageSquare className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Your contribution to juniors</p>
                <div className="text-2xl font-bold text-purple-700">
                  {myDoubts.filter(d => d.status === 'SOLVED').length} Doubts Solved
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Verified Doubts Section */}
        {activeSection === 'verified-doubts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Available Verified Doubts</h2>
                <button
                  onClick={() => {
                    setActiveSection('more-doubts');
                    fetchMoreDoubts();
                  }}
                  className="bg-white hover:bg-gray-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  More Doubts
                </button>
              </div>
              <button
                onClick={() => fetchAvailableDoubts(user.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Refresh List
              </button>
            </div>

            {loadingDoubts ? (
              <GameLoader label="Scanning verified mission queue..." />
            ) : doubtsError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {doubtsError}
              </div>
            ) : availableDoubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow">
                <EmptyState title="Queue is clear" text="No verified unsolved doubts are available right now. Refresh when you are ready for the next mission." icon="award" />
              </div>
            ) : (
              <div className="space-y-6">
                {availableDoubts.map((doubt) => {
                  const isSelected = selectedDoubtId === doubt.id;
                  const isLoading = actionLoading[doubt.id];

                  return (
                    <div key={doubt.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="p-6 border-b">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doubt.subject}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Raised on {new Date(doubt.doubtRaisedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                            VERIFIED
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="text-gray-700 mb-4 font-medium">
                          Asked by: {doubt.askedBy || 'Junior Student'}
                        </p>
                        <p className="text-gray-700 whitespace-pre-line mb-6">{doubt.description}</p>

                        {doubt.doubtPic && (
                            <div className="mb-4">
                              <a
                                href={buildAssetUrl(doubt.doubtPic)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                              >
                                <ImageIcon size={18} className="text-blue-600" />
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-gray-800">View attachment</p>
                                  <p className="text-xs text-gray-500">{doubt.doubtPic}</p>
                                </div>
                              </a>
                            </div>
                          )}

                        <div className="mt-8 border-t pt-6">
                          {!isSelected ? (
                            <button
                              onClick={() => handleAcceptDoubt(doubt.id)}
                              disabled={!!isLoading}
                              className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white transition ${
                                isLoading
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {isLoading === 'accepting' ? 'Accepting...' : 'Ready to Solve'}
                            </button>
                          ) : (
                            <div className="space-y-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Your Solution
                                </label>
                                <textarea
                                  value={solutionText}
                                  onChange={(e) => setSolutionText(e.target.value)}
                                  rows={6}
                                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Explain your solution step by step..."
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <ImageIcon size={18} /> Optional Image / Diagram
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100"
                                  disabled={submitting}
                                />
                                {solutionFile && (
                                  <p className="mt-2 text-sm text-gray-600">
                                    Selected: {solutionFile.name}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                  onClick={() => handleSubmitSolution(doubt.id)}
                                  disabled={submitting || !solutionText.trim()}
                                  className={`px-8 py-3 rounded-lg font-medium transition ${
                                    submitting || !solutionText.trim()
                                      ? 'bg-gray-400 cursor-not-allowed text-white'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                                  }`}
                                >
                                  {submitting ? 'Submitting...' : 'Submit Solution'}
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedDoubtId(null);
                                    setSolutionText('');
                                    setSolutionFile(null);
                                  }}
                                  disabled={submitting}
                                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* More Doubts Section */}
        {activeSection === 'more-doubts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-white">More Doubts</h2>
                <button
                  onClick={() => {
                    setActiveSection('verified-doubts');
                    fetchAvailableDoubts(user.id);
                  }}
                  className="bg-white hover:bg-gray-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  Available Doubts
                </button>
              </div>
              <button
                onClick={fetchMoreDoubts}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Refresh List
              </button>
            </div>

            {loadingMoreDoubts ? (
              <GameLoader label="Searching open mission board..." />
            ) : moreDoubtsError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {moreDoubtsError}
              </div>
            ) : moreDoubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow">
                <EmptyState title="No open missions" text="The unmatched doubt board is quiet for now. Check again after the next student post." icon="trophy" />
              </div>
            ) : (
              <div className="space-y-6">
                {moreDoubts.map((doubt) => {
                  const isLoading = actionLoading[doubt.id];
                  const doubtDate = getDoubtDate(doubt);
                  const attachment = getDoubtAttachment(doubt);
                  const studentEmail = getDoubtStudentEmail(doubt);

                  return (
                    <div key={doubt.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="p-6 border-b">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doubt.subject}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Raised on {doubtDate ? new Date(doubtDate).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                            OPEN
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-4">
                          <p className="text-gray-700 font-medium">
                            Asked by: {getDoubtStudentName(doubt)}
                          </p>
                          {studentEmail && (
                            <p className="text-sm text-gray-500 break-all">{studentEmail}</p>
                          )}
                        </div>

                        <p className="text-gray-700 whitespace-pre-line mb-6">{doubt.description}</p>

                        {attachment && (
                          <div className="mb-4">
                            <a
                              href={buildAssetUrl(attachment)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                            >
                              <ImageIcon size={18} className="text-blue-600" />
                              <div className="text-left">
                                <p className="text-sm font-semibold text-gray-800">View attachment</p>
                                <p className="text-xs text-gray-500">{attachment}</p>
                              </div>
                            </a>
                          </div>
                        )}

                        <div className="mt-8 border-t pt-6">
                          <button
                            onClick={() => handleAcceptDoubt(doubt.id)}
                            disabled={!!isLoading}
                            className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white transition ${
                              isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {isLoading === 'accepting' ? 'Accepting...' : 'Ready to Solve'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Doubts Section */}
        {activeSection === 'my-doubts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">My Doubts</h2>
              <button
                onClick={() => fetchMyDoubts(user.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Refresh List
              </button>
            </div>

            {loadingMyDoubts ? (
              <GameLoader label="Loading accepted missions..." />
            ) : myDoubtsError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {myDoubtsError}
              </div>
            ) : myDoubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow">
                <EmptyState title="No accepted missions" text="Accept a verified doubt to open your mentor mission timeline." icon="award" />
              </div>
            ) : (
              <div className="space-y-6">
                {myDoubts.map((doubt) => {
                  const isSelected = selectedDoubtId === doubt.id;
                  const isLoading = actionLoading[doubt.id];
                  const status = doubt.status;
                  const isExpanded = expandedDoubtId === doubt.id;
                  const fullDoubt = solvedDoubts.find((d) => d.id === doubt.id);

                  return (
                    <div key={doubt.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="p-6 border-b">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doubt.subject}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Raised on {new Date(doubt.doubtRaisedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            status === 'SOLVING' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'SOLVED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="text-gray-700 mb-4 font-medium">
                          Asked by: {doubt.askedBy || 'Junior Student'}
                        </p>
                        <p className="text-gray-700 whitespace-pre-line mb-6">{doubt.description}</p>


                        {doubt.chatEnabled && (
                          <div className="mt-6 border-t pt-6">
                            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <MessageSquare size={18} /> Doubt Chat
                              </h4>

                              <div className="flex items-center gap-2">
                                {doubt.chatClosed ? (
                                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                    Chat Closed
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCloseChat(doubt.id)}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
                                  >
                                    Close Chat
                                  </button>
                                )}

                                <button
                                  onClick={() => fetchChatMessages(doubt.id)}
                                  className="px-4 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium transition"
                                >
                                  Refresh Chat
                                </button>
                              </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50 p-3 space-y-3">
                              {(chatMessages[doubt.id] || []).length === 0 ? (
                                <p className="text-sm text-gray-500">No messages yet.</p>
                              ) : (
                                (chatMessages[doubt.id] || []).map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`p-3 rounded-lg ${
                                      msg.senderRole === 'SENIOR'
                                        ? 'bg-purple-100 ml-8'
                                        : 'bg-white mr-8 border'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1 gap-3">
                                      <span className="text-sm font-semibold text-gray-800">{msg.senderName}</span>
                                      <span className="text-xs text-gray-500">
                                        {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ''}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {!doubt.chatClosed && (
                              <div className="mt-3 flex gap-3">
                                <input
                                  type="text"
                                  value={chatInput[doubt.id] || ''}
                                  onChange={(e) =>
                                    setChatInput((prev) => ({ ...prev, [doubt.id]: e.target.value }))
                                  }
                                  placeholder="Type your message..."
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <button
                                  onClick={() => handleSendChatMessage(doubt.id)}
                                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {fullDoubt?.solutionPic && (
                          <div className="mt-4">
                            <a
                              href={buildAssetUrl(fullDoubt.solutionPic)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                            >
                              <ImageIcon size={18} className="text-green-600" />
                              <div className="text-left">
                                <p className="text-sm font-semibold text-gray-800">View solution attachment</p>
                                <p className="text-xs text-gray-500">{fullDoubt.solutionPic}</p>
                              </div>
                            </a>
                          </div>
                        )}

                        <div className="mt-8 border-t pt-6">
                          {status === 'SOLVING' && !isSelected ? (
                            <button
                              onClick={() => {
                                setSelectedDoubtId(doubt.id);
                                fetchChatMessages(doubt.id);
                              }}
                              disabled={!!isLoading}
                              className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white transition ${
                                isLoading
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              Give Solution
                            </button>
                          ) : status === 'SOLVING' && isSelected ? (
                            <div className="space-y-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Your Solution
                                </label>
                                <textarea
                                  value={solutionText}
                                  onChange={(e) => setSolutionText(e.target.value)}
                                  rows={6}
                                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Explain your solution step by step..."
                                  disabled={submitting}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <ImageIcon size={18} /> Optional Image / Diagram
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100"
                                  disabled={submitting}
                                />
                                {solutionFile && (
                                  <p className="mt-2 text-sm text-gray-600">
                                    Selected: {solutionFile.name}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                  onClick={() => handleSubmitSolution(doubt.id)}
                                  disabled={submitting || !solutionText.trim()}
                                  className={`px-8 py-3 rounded-lg font-medium transition ${
                                    submitting || !solutionText.trim()
                                      ? 'bg-gray-400 cursor-not-allowed text-white'
                                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                                  }`}
                                >
                                  {submitting ? 'Submitting...' : 'Submit Solution'}
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedDoubtId(null);
                                    setSolutionText('');
                                    setSolutionFile(null);
                                  }}
                                  disabled={submitting}
                                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : status === 'SOLVED' ? (
                            <div>
                              <button
                                onClick={async () => {
                                  if (!isExpanded && user?.id) {
                                    await fetchSolvedDoubts(user.id);
                                  }
                                  setExpandedDoubtId(isExpanded ? null : doubt.id);
                                }}
                                className="w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                              >
                                {isExpanded ? 'Hide Solution & Remarks' : 'View Solution & Remarks'}
                              </button>

                              {isExpanded && fullDoubt && (
                                <div className="mt-6 flex flex-col md:flex-row gap-6 border-t pt-6">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                      <MessageSquare size={18} /> Your Solution
                                    </h4>
                                    <p className="text-gray-800 whitespace-pre-line mb-4">{fullDoubt.solutionText}</p>
                                    {fullDoubt.solutionPic && (
                                      <img
                                        src={buildAssetUrl(fullDoubt.solutionPic)}
                                        alt="Solution"
                                        className="max-h-64 rounded-lg border object-contain bg-gray-50 mb-4"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                    )}
                                    <p className="text-sm text-gray-600">
                                      Submitted at: {new Date(fullDoubt.solutionSubmittedAt).toLocaleString()}
                                    </p>
                                  </div>

                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                      <MessageSquare size={18} /> Remarks
                                    </h4>
                                    <p className="text-gray-800 mb-4 whitespace-pre-line">{fullDoubt?.comments && fullDoubt.comments.trim() ? fullDoubt.comments : 'No comments provided'}</p>
                                    <p className="text-sm font-medium">
                                      Rating: {fullDoubt?.rating ? `${fullDoubt.rating} / 5` : 'No rating yet'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Section */}
        {activeSection === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold ea-dashboard-section-title">Leaderboard</h2>
              <button
                onClick={fetchLeaderboard}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Refresh
              </button>
            </div>

            {loadingLeaderboard ? (
              <GameLoader label="Calculating mentor ranks..." />
            ) : leaderboardError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {leaderboardError}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-white rounded-2xl shadow">
                <EmptyState title="Ranks pending" text="Leaderboard data will activate once mentor progress is available." icon="trophy" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Doubts Solved</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {leaderboard.map((entry) => (
                        <tr key={entry.seniorId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-purple-700">
                            {entry.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {entry.seniorEmail}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">
                            {entry.doubtsSolved}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-900">
                            {entry.totalPoints}
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

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto ea-command-panel">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                  <Edit size={18} /> Edit Profile
                </button>
              )}
            </div>

            {loadingProfile ? (
              <GameLoader label="Loading mentor profile..." />
            ) : profileError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {profileError}
              </div>
            ) : profile ? (
              isEditingProfile ? (
                // Edit Profile Form
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                    <input
                      type="text"
                      value={editForm.rollNumber}
                      onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="Enter your roll number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Expertise Subjects</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {expertiseOptions.map((subject) => (
                        <label
                          key={subject}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium transition hover:border-purple-300"
                        >
                          <input
                            type="checkbox"
                            value={subject}
                            checked={editForm.expertiseSubjects.split(',').includes(subject)}
                            onChange={() => handleExpertiseChange(subject)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="Enter new password (optional)"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className={`flex-1 py-3 rounded-lg font-medium text-white transition ${
                        updatingProfile ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {updatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setUpdateMsg({ type: '', text: '' });
                      }}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>

                  {updateMsg.text && (
                    <div className={`mt-6 p-4 rounded-xl text-center border ${
                      updateMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                      updateMsg.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                      'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {updateMsg.text}
                    </div>
                  )}
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="flex flex-col items-center md:items-start">
                    <img
                      src={buildAssetUrl(profile.photo || 'default-avatar.png')}
                      alt="Profile"
                      className="w-40 h-40 rounded-full object-cover border-4 border-purple-100 shadow-md mb-6"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/160?text=Senior')}
                    />
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-bold">{profile.name}</h3>
                      <p className="text-gray-600">{profile.email}</p>
                      <p className="text-sm text-gray-500 mt-1">Roll No: {profile.rollNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm text-gray-500">Member Since</label>
                      <p className="text-lg">
                        {profile.registeredAt
                          ? new Date(profile.registeredAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <p className="text-gray-500 text-center py-8">No profile data available</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SeniorDashboard;
