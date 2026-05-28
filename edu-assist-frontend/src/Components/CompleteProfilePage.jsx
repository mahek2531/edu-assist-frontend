import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { buildApiUrl, buildAssetUrl } from '../lib/api';
import { AuthPortalScene, Feedback } from './ui/GameUI';

const CompleteProfilePage = () => {
  const { role } = useParams();
  const navigate = useNavigate();

  const isJunior = role === 'junior';
  const isSenior = role === 'senior';
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

  const [student, setStudent] = useState(null);
  const [rollNumber, setRollNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [expertiseSubjects, setExpertiseSubjects] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    document.body.classList.add('ea-dark-body');
    return () => document.body.classList.remove('ea-dark-body');
  }, []);

  useEffect(() => {
    if (!isJunior && !isSenior) {
      navigate('/login');
      return;
    }

    const storageKey = isJunior ? 'juniorUser' : 'seniorUser';
    const storedUser = localStorage.getItem(storageKey);
    const storedRole = localStorage.getItem('role');

    if (!storedUser || storedRole !== role) {
      navigate(`/login/${role}`);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setStudent(parsed);
      setRollNumber(parsed.rollNumber || '');
      setExpertiseSubjects(parsed.expertiseSubjects || '');
      setPreview(parsed.photo ? buildAssetUrl(parsed.photo) : '');

      const hasRollNumber = parsed.rollNumber && String(parsed.rollNumber).trim();
      const hasUploadedPhoto =
        parsed.photo &&
        String(parsed.photo).trim() &&
        !String(parsed.photo).trim().startsWith('http');

      if (hasRollNumber && hasUploadedPhoto) {
        navigate(isJunior ? '/juniorDashboard' : '/seniorDashboard');
      }
    } catch (err) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(isJunior ? 'juniorUserId' : 'seniorUserId');
      localStorage.removeItem('role');
      navigate(`/login/${role}`);
    }
  }, [role, isJunior, isSenior, navigate]);

  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setPhoto(selectedFile || null);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleExpertiseChange = (subject) => {
    const selectedSubjects = expertiseSubjects
      ? expertiseSubjects.split(',').filter(Boolean)
      : [];
    const nextSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject)
      : [...selectedSubjects, subject];
    setExpertiseSubjects(nextSubjects.join(','));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!student?.id) {
      setErrorMsg('Student session not found. Please login again.');
      return;
    }

    if (!rollNumber.trim()) {
      setErrorMsg('Roll number is required');
      return;
    }

    if (!photo) {
      setErrorMsg('Profile photo is required. Please upload your photo.');
      return;
    }

    if (isSenior && !expertiseSubjects) {
      setErrorMsg('Please select at least one expertise subject');
      return;
    }

    const formData = new FormData();
    formData.append('rollNumber', rollNumber.trim());
    formData.append('photo', photo);

    if (isSenior) {
      formData.append('expertiseSubjects', expertiseSubjects);
    }

    const endpoint = isJunior
      ? `/api/junior/complete-google-profile/${student.id}`
      : `/api/senior/complete-google-profile/${student.id}`;

    setLoading(true);

    try {
      const res = await axios.put(buildApiUrl(endpoint), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status) {
        const updatedStudent = res.data.student;
        const storageKey = isJunior ? 'juniorUser' : 'seniorUser';
        const idKey = isJunior ? 'juniorUserId' : 'seniorUserId';

        localStorage.setItem(storageKey, JSON.stringify(updatedStudent));
        localStorage.setItem(idKey, updatedStudent.id);
        localStorage.setItem('role', role);

        setSuccessMsg('Profile completed successfully. Redirecting...');

        setTimeout(() => {
          navigate(isJunior ? '/juniorDashboard' : '/seniorDashboard');
        }, 1000);
      } else {
        setErrorMsg(res.data.message || 'Failed to complete profile');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('juniorUser');
    localStorage.removeItem('juniorUserId');
    localStorage.removeItem('seniorUser');
    localStorage.removeItem('seniorUserId');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    navigate(`/login/${role}`);
  };

  if (!student) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 ea-onboarding-shell ea-auth-stage -z-10" />
      <div className="min-h-screen flex flex-col justify-center px-4 py-10 relative z-10">
        <AuthPortalScene variant={isJunior ? 'junior' : 'senior'} />
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-8 ea-command-panel ea-auth-card ea-profile-terminal relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              EA
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600 mt-2">
              Add your roll number and upload your profile photo to continue.
            </p>
            <div className="mt-5 ea-level-bar" aria-label="Profile completion progress">
              <span
                style={{
                  width: `${rollNumber.trim() && (photo || preview)
                      ? 100
                      : rollNumber.trim() || photo || preview
                        ? 62
                        : 28
                    }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-semibold text-white">{student.name}</p>
            <p className="text-sm text-indigo-200 break-all">{student.email}</p>
          </div>

          {errorMsg && <Feedback type="error">{errorMsg}</Feedback>}
          {successMsg && <Feedback type="success">{successMsg}</Feedback>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter your roll number"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Google photo is not used as final profile photo. Please upload your own profile photo.
              </p>
            </div>

            {isSenior && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Expertise Subjects <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expertiseOptions.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium transition hover:border-indigo-300"
                    >
                      <input
                        type="checkbox"
                        value={subject}
                        checked={expertiseSubjects.split(',').includes(subject)}
                        onChange={() => handleExpertiseChange(subject)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <div className="flex items-center gap-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 p-4">
                <img
                  src={preview}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border border-indigo-500/30"
                />
                <div>
                  <p className="font-semibold text-white">Photo Preview</p>
                  <p className="text-sm text-indigo-200">This photo will appear on your dashboard.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition shadow-lg ea-auth-submit"
            >
              {loading && <span className="ea-auth-button-loader" aria-hidden="true" />}
              {loading ? 'Saving...' : 'Complete Profile & Continue'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-4 text-sm text-gray-500 hover:text-red-600 transition"
          >
            Logout and use another account
          </button>
        </div>
      </div>
    </>
  );
};

export default CompleteProfilePage;