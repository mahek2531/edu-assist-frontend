// src/pages/JuniorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, buildAssetUrl } from '../lib/api';
import {
  LayoutDashboard, PlusCircle, BookOpen, User, LogOut,
  Search, Image as ImageIcon, MessageSquare, Star, Edit
} from 'lucide-react';
import { AmbientBackground, EmptyState, GameLoader } from './ui/GameUI';

const JuniorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

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
    password: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  // Post doubt
  const [doubtForm, setDoubtForm] = useState({ subject: '', description: '', doubtPic: null });
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState({ type: '', text: '' });

  // My Doubts
  const [myDoubts, setMyDoubts] = useState([]);
  const [filteredDoubts, setFilteredDoubts] = useState([]);
  const [searchSubject, setSearchSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loadingDoubts, setLoadingDoubts] = useState(false);

  // Remarks form
  const [selectedRemarkDoubtId, setSelectedRemarkDoubtId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('juniorUser');
    const role = localStorage.getItem('role');

    if (!storedUser || role !== 'junior') {
      navigate('/login/junior');
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
        navigate('/complete-profile/junior');
        return;
      }

      setUser(parsed);
      fetchProfile(parsed.id);
      fetchMyDoubts(parsed.id);
    } catch (err) {
      localStorage.removeItem('juniorUser');
      localStorage.removeItem('juniorUserId');
      localStorage.removeItem('role');
      navigate('/login/junior');
    }

  }, [navigate]);

  const fetchProfile = async (id) => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const res = await axios.get(buildApiUrl(`/api/junior/profile/${id}`));
      if (res.data.status) {
        const student = res.data.student;
        setProfile(student);

        const updatedUser = {
          id: student.id,
          photo: student.photo,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          verified: student.verified,
          autoVerified: student.autoVerified
        };

        setUser(updatedUser);
        localStorage.setItem('juniorUser', JSON.stringify(updatedUser));
        localStorage.setItem('juniorUserId', student.id);

        setEditForm({
          name: student.name || '',
          email: student.email || '',
          rollNumber: student.rollNumber || '',
          password: ''
        });

      } else {
        setProfileError('Profile not found');
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setProfileError('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMsg({ type: '', text: '' });
    setUpdatingProfile(true);

    const payload = {};
    if (editForm.name.trim()) payload.name = editForm.name.trim();
    if (editForm.email.trim()) payload.email = editForm.email.trim();
    if (editForm.rollNumber.trim()) payload.rollNumber = editForm.rollNumber.trim();
    if (editForm.password.trim()) payload.password = editForm.password.trim();

    if (Object.keys(payload).length === 0) {
      setUpdateMsg({ type: 'info', text: 'No changes to save' });
      setUpdatingProfile(false);
      return;
    }

    try {
      const res = await axios.put(
        buildApiUrl(`/api/junior/update/${user.id}`),
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.status) {
        setUpdateMsg({ type: 'success', text: 'Profile updated successfully!' });
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

  const fetchMyDoubts = async (id) => {
    setLoadingDoubts(true);
    try {
      const res = await axios.get(buildApiUrl(`/api/junior/myDoubts/${id}`));
      if (res.data.status) {
        setMyDoubts(res.data.doubts || []);
        setFilteredDoubts(res.data.doubts || []);
      }
    } catch (err) {
      console.error('Doubts fetch failed:', err);
    } finally {
      setLoadingDoubts(false);
    }
  };

  useEffect(() => {
    let result = [...myDoubts];
    if (filterStatus !== 'ALL') {
      result = result.filter(d => d.status === filterStatus);
    }
    if (searchSubject.trim()) {
      const term = searchSubject.toLowerCase();
      result = result.filter(d => d.subject?.toLowerCase().includes(term));
    }
    setFilteredDoubts(result);
  }, [myDoubts, searchSubject, filterStatus]);

  const handlePostDoubt = async (e) => {
    e.preventDefault();
    setPostMsg({ type: '', text: '' });
    setPosting(true);

    if (!doubtForm.subject.trim() || !doubtForm.description.trim()) {
      setPostMsg({ type: 'error', text: 'Subject and description are required' });
      setPosting(false);
      return;
    }

    const formData = new FormData();
    formData.append('subject', doubtForm.subject.trim());
    formData.append('description', doubtForm.description.trim());
    if (doubtForm.doubtPic) formData.append('doubtPic', doubtForm.doubtPic);

    try {
      const res = await axios.post(
        buildApiUrl(`/api/doubt/post/${user.id}`),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (res.data.status) {
        setPostMsg({ type: 'success', text: 'Doubt posted successfully!' });
        setDoubtForm({ subject: '', description: '', doubtPic: null });
        setTimeout(() => {
          setActiveSection('dashboard');
          fetchMyDoubts(user.id);
        }, 1800);
      } else {
        setPostMsg({ type: 'error', text: res.data.message || 'Failed to post' });
      }
    } catch (err) {
      setPostMsg({ type: 'error', text: err.response?.data?.message || 'Error posting doubt' });
    } finally {
      setPosting(false);
    }
  };

  const handleSubmitRemarks = async (doubtId) => {
    if (rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }

    setSubmittingRemark(true);

    const payload = {
      comments: comments.trim(),
      rating: rating
    };

    try {
      const res = await axios.post(
        buildApiUrl(`/api/doubt/remarks/${doubtId}/${user.id}`),
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.success || res.data.status) {
        alert('Thank you! Your rating and comments have been submitted.');
        setSelectedRemarkDoubtId(null);
        setRating(0);
        setComments('');
        fetchMyDoubts(user.id); // refresh
      } else {
        alert(res.data.message || 'Failed to submit remarks');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting remarks');
    } finally {
      setSubmittingRemark(false);
    }
  };


  const fetchChatMessages = async (doubtId) => {
    try {
      const res = await axios.get(buildApiUrl(`/api/chat/${doubtId}/${user.id}/JUNIOR`));
      if (res.data.status) {
        setChatMessages((prev) => ({ ...prev, [doubtId]: res.data.messages || [] }));
      }
    } catch (err) {
      console.error('Chat fetch failed:', err);
    }
  };

  const handleSendChatMessage = async (doubtId) => {
    const message = (chatInput[doubtId] || '').trim();
    if (!message) return;

    try {
      const res = await axios.post(
        buildApiUrl(`/api/chat/send/${doubtId}/${user.id}/JUNIOR`),
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
      const res = await axios.post(buildApiUrl(`/api/doubt/close-chat/${doubtId}/${user.id}/JUNIOR`));
      if (res.data.status) {
        alert(res.data.message || 'Chat closed successfully');
        fetchMyDoubts(user.id);
        fetchChatMessages(doubtId);
      } else {
        alert(res.data.message || 'Failed to close chat');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing chat');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('juniorUser');
    localStorage.removeItem('juniorUserId');
    localStorage.removeItem('role');
    navigate('/login/junior');
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SOLVING: 'bg-blue-100 text-blue-800 border-blue-300',
      SOLVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 ea-dashboard-shell ea-dashboard-junior">
      <AmbientBackground variant="junior" density={9} />
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm fixed w-full z-50 ea-command-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                EA
              </div>
              <span className="text-xl font-bold text-gray-900">Edu Assist</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center gap-2 font-medium transition ${activeSection === 'dashboard' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>

              <button
                onClick={() => setActiveSection('post-doubt')}
                className={`flex items-center gap-2 font-medium transition ${activeSection === 'post-doubt' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
              >
                <PlusCircle size={18} /> Post Doubt
              </button>

              <button
                onClick={() => {
                  setActiveSection('my-doubts');
                  fetchMyDoubts(user.id);
                }}
                className={`flex items-center gap-2 font-medium transition ${activeSection === 'my-doubts' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
              >
                <BookOpen size={18} /> My Doubts
              </button>

              <button
                onClick={() => setActiveSection('profile')}
                className={`flex items-center gap-2 font-medium transition ${activeSection === 'profile' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
              >
                <User size={18} /> Profile
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <img
                  src={buildAssetUrl((profile?.photo || user?.photo || 'default-avatar.png'))}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-indigo-100"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/36?text=User';
                    e.target.onerror = null;
                  }}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ea-command-main ea-section-choreography">
        {/* Dashboard */}
        {activeSection === 'dashboard' && (
          <div className="space-y-10">
            <div className="bg-white rounded-2xl shadow p-8 ea-command-hero">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                Junior MCA Student • Ask anything, learn faster
              </p>
              <div className="mt-6 max-w-xl">
                <div className="flex items-center justify-between text-sm font-semibold text-indigo-700 mb-2">
                  <span>Learning quest progress</span>
                  <span>{Math.min(100, myDoubts.length * 20)}%</span>
                </div>
                <div className="ea-level-bar">
                  <span style={{ width: `${Math.min(100, Math.max(12, myDoubts.length * 20))}%` }} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow hover:shadow-md transition p-6 ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Post Doubt</h3>
                  <PlusCircle className="text-indigo-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Ask questions and get help from seniors</p>
                <button
                  onClick={() => setActiveSection('post-doubt')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
                >
                  Create Doubt
                </button>
              </div>

              <div className="bg-white rounded-xl shadow hover:shadow-md transition p-6 ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">My Doubts</h3>
                  <BookOpen className="text-green-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Track your questions and solutions</p>
                <button
                  onClick={() => {
                    setActiveSection('my-doubts');
                    fetchMyDoubts(user.id);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
                >
                  View Doubts
                </button>
              </div>

              <div className="bg-white rounded-xl shadow hover:shadow-md transition p-6 ea-mission-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Profile</h3>
                  <User className="text-purple-600" size={28} />
                </div>
                <p className="text-gray-600 mb-6">Manage your account & settings</p>
                <button
                  onClick={() => setActiveSection('profile')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post Doubt */}
        {activeSection === 'post-doubt' && (
          <div className="bg-white rounded-2xl shadow p-8 max-w-3xl mx-auto ea-command-panel">
            <h2 className="text-2xl font-bold mb-2">Post a New Doubt</h2>
            <p className="text-gray-600 mb-8">Be clear and specific — seniors are here to help</p>

            <form onSubmit={handlePostDoubt} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Subject / Topic *</label>
                <input
                  type="text"
                  value={doubtForm.subject}
                  onChange={(e) => setDoubtForm({ ...doubtForm, subject: e.target.value })}
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Java Multithreading, SQL Joins..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Detailed Description *</label>
                <textarea
                  value={doubtForm.description}
                  onChange={(e) => setDoubtForm({ ...doubtForm, description: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                  placeholder="Describe your problem, include code, errors, what you've tried..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Attach Image / Screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDoubtForm({ ...doubtForm, doubtPic: e.target.files[0] || null })}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={posting}
                className={`w-full py-4 rounded-xl text-white font-bold transition-all ${posting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
              >
                {posting ? 'Posting...' : 'Submit Doubt'}
              </button>

              {postMsg.text && (
                <div className={`mt-4 p-4 rounded-xl text-center ${postMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {postMsg.text}
                </div>
              )}
            </form>
          </div>
        )}

        {/* My Doubts */}
        {activeSection === 'my-doubts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">My Doubts</h2>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by subject..."
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="SOLVING">In Progress</option>
                  <option value="SOLVED">Solved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {loadingDoubts ? (
              <GameLoader label="Scanning your doubt missions..." />
            ) : filteredDoubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow">
                <EmptyState title="No missions found" text="Post a doubt or adjust the filters to reveal your active learning quests." icon="award" />
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDoubts.map((doubt) => {
                  const isRemarkFormOpen = selectedRemarkDoubtId === doubt.id;
                  const hasSolution = !!doubt.solutionText;
                  const hasRated = (doubt.rating !== undefined && doubt.rating > 0);

                  return (
                    <div key={doubt.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="p-6 border-b">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doubt.subject}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Posted: {new Date(doubt.doubtRaisedAt).toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(doubt.status)}
                        </div>
                      </div>

                      <div className="p-6">
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


                        {doubt.chatEnabled && (
                          <div className="border-t pt-6 mt-6">
                            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                              <h4 className="text-lg font-semibold flex items-center gap-2">
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
                                  className="px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium transition"
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
                                    className={`p-3 rounded-lg ${msg.senderRole === 'JUNIOR'
                                      ? 'bg-indigo-100 ml-8'
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
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                  onClick={() => handleSendChatMessage(doubt.id)}
                                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Solution Section - Visible only if solution exists */}
                        {hasSolution && (
                          <div className="border-t pt-6 mt-6">
                            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <MessageSquare size={18} /> Senior's Solution
                            </h4>
                            <p className="text-gray-800 whitespace-pre-line mb-4">{doubt.solutionText}</p>

                            {doubt.solutionPic && (
                              <div className="mt-4">
                                <a
                                  href={buildAssetUrl(doubt.solutionPic)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
                                >
                                  <ImageIcon size={18} className="text-green-600" />
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800">View solution attachment</p>
                                    <p className="text-xs text-gray-500">{doubt.solutionPic}</p>
                                  </div>
                                </a>
                              </div>
                            )}
                            {/* Show rating/comment if already submitted */}
                            {hasRated && (
                              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Star className="text-amber-500 fill-amber-500" size={20} />
                                  <span className="font-medium">Your Rating:</span>
                                  <span className="text-lg font-bold">{doubt.rating} / 5</span>
                                </div>
                                {doubt.comments && (
                                  <p className="text-gray-700">
                                    <span className="font-medium">Your Comment:</span> {doubt.comments}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Show "Post Remarks & Rating" button only if solved + has solution + not rated yet */}
                            {doubt.status === 'SOLVED' && !hasRated && !isRemarkFormOpen && (
                              <button
                                onClick={() => setSelectedRemarkDoubtId(doubt.id)}
                                className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                              >
                                Post Remarks & Rating
                              </button>
                            )}

                            {/* Remarks Form */}
                            {isRemarkFormOpen && (
                              <div className="mt-6 border-t pt-6">
                                <h5 className="text-lg font-semibold mb-4">Rate & Comment on Solution</h5>

                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1–5)</label>
                                  <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`transition-all ${rating >= star ? 'text-amber-400 scale-110' : 'text-gray-400 hover:text-amber-300'}`}
                                      >
                                        <Star size={32} className={rating >= star ? 'fill-amber-400' : 'fill-gray-300'} />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Comments (optional)</label>
                                  <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="How helpful was the solution? Any suggestions..."
                                  />
                                </div>

                                <div className="flex gap-4">
                                  <button
                                    onClick={() => handleSubmitRemarks(doubt.id)}
                                    disabled={submittingRemark || rating === 0}
                                    className={`px-6 py-3 rounded-lg font-medium transition ${submittingRemark || rating === 0
                                      ? 'bg-gray-400 cursor-not-allowed text-white'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      }`}
                                  >
                                    {submittingRemark ? 'Submitting...' : 'Submit Rating & Comment'}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedRemarkDoubtId(null);
                                      setRating(0);
                                      setComments('');
                                    }}
                                    disabled={submittingRemark}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                  <Edit size={18} /> Edit Profile
                </button>
              )}
            </div>

            {loadingProfile ? (
              <GameLoader label="Loading player profile..." />
            ) : profileError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
                {profileError}
              </div>
            ) : profile ? (
              isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                    <input
                      type="text"
                      value={editForm.rollNumber}
                      onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter your roll number"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter new password (optional)"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className={`flex-1 py-3 rounded-lg font-medium text-white transition ${updatingProfile ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
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
                    <div className={`mt-6 p-4 rounded-xl text-center border ${updateMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
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
                      className="w-40 h-40 rounded-full object-cover border-4 border-indigo-100 shadow-md mb-6"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/160?text=Profile';
                      }}
                    />
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-bold">{profile.name}</h3>
                      <p className="text-gray-600 mt-1">{profile.email}</p>
                      <p className="text-sm text-gray-500 mt-1">Roll No: {profile.rollNumber || 'N/A'}</p>
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
                    <div>
                      <label className="text-sm text-gray-500">Total Doubts Asked</label>
                      <p className="text-lg font-medium">{profile.doubtCount || myDoubts.length || 0}</p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <p className="text-red-600 text-center py-8">Failed to load profile data</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default JuniorDashboard;
