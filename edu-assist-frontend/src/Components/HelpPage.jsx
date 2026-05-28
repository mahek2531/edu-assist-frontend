import React, { useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  Home,
  LifeBuoy,
  LogIn,
  MessageSquareText,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { buildApiUrl } from '../lib/api';

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState('faq');
  const [openFaq, setOpenFaq] = useState(null);

  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  const [requestEmail, setRequestEmail] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');

  const faqList = [
    {
      question: 'What is Edu Assist?',
      answer:
        'Edu Assist is a mentorship-based doubt solving platform where junior MCA students can post doubts and senior MCA students can solve them after admin verification.',
    },
    {
      question: 'Who can use Edu Assist?',
      answer:
        'Junior MCA students can use it to post doubts, senior MCA students can use it to solve doubts, and the admin manages verification and platform activity.',
    },
    {
      question: 'Why is admin verification required?',
      answer:
        'Admin verification helps keep the platform safe, organized, and academically useful by checking student accounts and posted doubts before they are fully available.',
    },
    {
      question: 'What happens after a doubt is posted?',
      answer:
        'After a junior posts a doubt, the admin verifies it. Once verified, seniors can view it, accept it, chat with the junior, and submit a solution.',
    },
    {
      question: 'How are leaderboard points calculated?',
      answer:
        'Senior students receive points based on solved doubts and ratings given by juniors. Higher points improve their leaderboard rank.',
    },
  ];

  const howToUseSteps = [
    {
      title: 'Register or Login',
      text: 'Choose your role as Junior or Senior and login using your registered account or Google login.',
    },
    {
      title: 'Complete Profile',
      text: 'Make sure your roll number and profile photo are added properly before using the dashboard.',
    },
    {
      title: 'Post or Solve Doubts',
      text: 'Juniors can post doubts with optional attachments. Seniors can accept verified doubts and submit solutions.',
    },
    {
      title: 'Use Chat and Remarks',
      text: 'Once a doubt is accepted, junior and senior can communicate using doubt-specific chat. After solving, juniors can submit ratings and comments.',
    },
    {
      title: 'Track Progress',
      text: 'Students can view their dashboards, solved doubts, posted doubts, and leaderboard progress.',
    },
  ];

  const navItems = [
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
    { key: 'how', label: 'How to Use', icon: Rocket },
    { key: 'support', label: 'Contact / Support', icon: LifeBuoy },
    { key: 'requests', label: 'My Help Requests', icon: ClipboardList },
  ];

  const selectForm = (type) => {
    setFormType(type);
    setSubmitMsg({ type: '', text: '' });
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const closeForm = () => {
    setFormType('');
    setSubmitMsg({ type: '', text: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitHelp = async (e) => {
    e.preventDefault();
    setSubmitMsg({ type: '', text: '' });

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setSubmitMsg({ type: 'error', text: 'Please fill all fields before submitting.' });
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      type: formType,
    };

    try {
      const res = await axios.post(buildApiUrl('/api/help/submit'), payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data?.status || res.data?.success) {
        setSubmitMsg({
          type: 'success',
          text: res.data?.message || 'Your request has been submitted successfully.',
        });

        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });

        setTimeout(() => {
          setFormType('');
          setSubmitMsg({ type: '', text: '' });
        }, 2000);
      } else {
        setSubmitMsg({
          type: 'error',
          text: res.data?.message || 'Failed to submit request.',
        });
      }
    } catch (err) {
      setSubmitMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error submitting request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMyRequests = async () => {
    setRequestMsg('');
    setMyRequests([]);

    if (!requestEmail.trim()) {
      setRequestMsg('Please enter your email address.');
      return;
    }

    setLoadingRequests(true);

    try {
      const res = await axios.get(
        buildApiUrl(`/api/help/my?email=${encodeURIComponent(requestEmail.trim())}`)
      );

      if (res.data?.status || res.data?.success) {
        const requests =
          res.data?.requests ||
          res.data?.helpRequests ||
          res.data?.data ||
          [];

        setMyRequests(requests);
        if (requests.length === 0) {
          setRequestMsg('No requests found for this email.');
        }
      } else {
        setRequestMsg(res.data?.message || 'No requests found.');
      }
    } catch (err) {
      setRequestMsg(err.response?.data?.message || 'Unable to load your requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const getFormHeading = () => {
    if (formType === 'FAQ') return 'Ask a Question';
    if (formType === 'SUPPORT') return 'Contact Support';
    if (formType === 'PROBLEM') return 'Report a Technical Problem';
    return 'Submit Request';
  };

  const getFormDescription = () => {
    if (formType === 'FAQ') {
      return 'Ask any doubt about how to use Edu Assist.';
    }
    if (formType === 'SUPPORT') {
      return 'Contact the admin team for account, verification, or general support.';
    }
    if (formType === 'PROBLEM') {
      return 'Report bugs, errors, page issues, or any technical problem.';
    }
    return '';
  };

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen ea-help-shell">
      <nav className="sticky top-0 z-40 ea-command-nav ea-help-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm ea-brand-mark">
              EA
            </div>
            <span className="text-2xl font-bold ea-brand-name">Edu Assist</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="font-medium transition ea-help-nav-link">
              <Home size={17} aria-hidden="true" />
              Home
            </a>
            <a href="/login" className="font-medium transition ea-help-nav-link">
              <LogIn size={17} aria-hidden="true" />
              Login
            </a>
            <a href="/" className="px-5 py-2 rounded-lg font-medium transition ea-help-nav-primary">
              <Rocket size={17} aria-hidden="true" />
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <header className="ea-help-hero">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5 ea-help-kicker">
                <Sparkles size={16} aria-hidden="true" />
                Help Command Center
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Mission support for every Edu Assist role.
              </h1>
              <p className="mt-5 text-lg leading-relaxed ea-help-hero-copy">
                Find answers, learn the platform flow, contact support, report technical issues, and track submitted requests in one premium command surface.
              </p>
            </div>

            <div className="ea-help-status-panel" aria-hidden="true">
              <div className="ea-help-status-top">
                <span>SUPPORT GRID</span>
                <span>ONLINE</span>
              </div>
              <div className="ea-help-status-grid">
                <div>
                  <HelpCircle size={24} />
                  <strong>FAQ</strong>
                  <span>Quick answers</span>
                </div>
                <div>
                  <ShieldCheck size={24} />
                  <strong>Guide</strong>
                  <span>Safe workflow</span>
                </div>
                <div>
                  <MessageSquareText size={24} />
                  <strong>Support</strong>
                  <span>Admin review</span>
                </div>
                <div>
                  <ClipboardList size={24} />
                  <strong>Requests</strong>
                  <span>Status tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 ea-help-main">
        <div className="flex mb-8 rounded-lg overflow-x-auto ea-tab-rail ea-help-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`flex-1 min-w-[160px] py-4 px-6 text-center font-medium transition-all ${
                  activeSection === item.key ? 'is-active' : ''
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        {activeSection === 'faq' && (
          <section className="ea-help-panel">
            <div className="flex justify-between items-start gap-4 mb-6 ea-help-section-head">
              <div>
                <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                <p className="mt-2">Quick answers about Edu Assist and its workflow.</p>
              </div>
              <button
                onClick={() => selectForm('FAQ')}
                className="px-5 py-2 rounded-lg text-sm font-medium transition ea-help-action-primary"
              >
                <MessageSquareText size={16} aria-hidden="true" />
                Ask Here
              </button>
            </div>

            <div className="rounded-lg overflow-hidden ea-help-accordion">
              {faqList.map((faq, index) => (
                <div key={index} className="ea-help-accordion-item">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center gap-5 transition"
                  >
                    <span className="font-semibold">{faq.question}</span>
                    <span className={`ea-help-chevron ${openFaq === index ? 'is-open' : ''}`}>
                      <ChevronDown size={20} aria-hidden="true" />
                    </span>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5 leading-relaxed ea-help-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'how' && (
          <section className="ea-help-panel">
            <div className="mb-6 ea-help-section-head">
              <h2 className="text-2xl font-bold">How to Use Edu Assist</h2>
              <p className="mt-2">Follow these simple steps to use the platform correctly.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {howToUseSteps.map((step, index) => (
                <div key={index} className="rounded-lg p-6 ea-help-step-card">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-4 ea-help-step-number">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'support' && (
          <section className="ea-help-panel">
            <div className="mb-6 ea-help-section-head">
              <h2 className="text-2xl font-bold">Contact and Support</h2>
              <p className="mt-2">
                Choose what you need help with and submit the form. Your request will be visible to the admin.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-8">
              <button
                onClick={() => selectForm('FAQ')}
                className="rounded-lg p-6 text-left transition ea-help-action-card"
              >
                <HelpCircle size={26} aria-hidden="true" />
                <h3 className="text-lg font-bold mb-2">Ask Here</h3>
                <p className="text-sm">Ask a question about Edu Assist usage.</p>
              </button>

              <button
                onClick={() => selectForm('SUPPORT')}
                className="rounded-lg p-6 text-left transition ea-help-action-card"
              >
                <LifeBuoy size={26} aria-hidden="true" />
                <h3 className="text-lg font-bold mb-2">Contact / Support</h3>
                <p className="text-sm">Get help for account, login, or verification issues.</p>
              </button>

              <button
                onClick={() => selectForm('PROBLEM')}
                className="rounded-lg p-6 text-left transition ea-help-action-card"
              >
                <AlertTriangle size={26} aria-hidden="true" />
                <h3 className="text-lg font-bold mb-2">Report a Problem</h3>
                <p className="text-sm">Report bugs, page errors, or technical problems.</p>
              </button>
            </div>
          </section>
        )}

        {formType && (
          <section className="rounded-lg p-6 md:p-8 mb-8 ea-help-form-panel">
            <div className="flex justify-between items-start gap-4 mb-6 ea-help-section-head">
              <div>
                <h2 className="text-2xl font-bold">{getFormHeading()}</h2>
                <p className="mt-2">{getFormDescription()}</p>
              </div>
              <button
                onClick={closeForm}
                className="ea-help-close-button"
                type="button"
                aria-label="Close help form"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitHelp} className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg outline-none ea-help-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg outline-none ea-help-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Enter subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg outline-none ea-help-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg outline-none resize-none ea-help-input"
                />
              </div>

              {submitMsg.text && (
                <div
                  className={`md:col-span-2 p-4 rounded-lg text-sm font-medium ea-help-message ${
                    submitMsg.type === 'success' ? 'is-success' : 'is-error'
                  }`}
                >
                  {submitMsg.type === 'success' ? (
                    <CheckCircle2 size={17} aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={17} aria-hidden="true" />
                  )}
                  {submitMsg.text}
                </div>
              )}

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 rounded-lg font-semibold transition ea-help-submit ${
                    submitting ? 'is-loading' : ''
                  }`}
                >
                  <Send size={17} aria-hidden="true" />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-3 rounded-lg font-semibold transition ea-help-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {activeSection === 'requests' && (
          <section>
            <div className="rounded-lg p-6 md:p-8 ea-help-panel">
              <div className="ea-help-section-head">
                <h2 className="text-2xl font-bold mb-2">My Help Requests</h2>
                <p className="mb-6">
                  Enter your email to check your submitted help requests, their status, and admin response.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg outline-none ea-help-input"
                />
                <button
                  onClick={fetchMyRequests}
                  disabled={loadingRequests}
                  className={`px-6 py-3 rounded-lg font-semibold transition ea-help-submit ${
                    loadingRequests ? 'is-loading' : ''
                  }`}
                >
                  <ClipboardList size={17} aria-hidden="true" />
                  {loadingRequests ? 'Loading...' : 'View Requests'}
                </button>
              </div>

              {requestMsg && (
                <div className="p-4 rounded-lg text-sm font-medium mb-5 ea-help-message is-info">
                  <MessageSquareText size={17} aria-hidden="true" />
                  {requestMsg}
                </div>
              )}

              {myRequests.length > 0 && (
                <div className="space-y-4">
                  {myRequests.map((item) => (
                    <div key={item.id} className="rounded-lg p-5 ea-help-request-card">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div>
                          <p className="font-bold">{item.subject || item.title || '-'}</p>
                          <p className="text-sm">
                            {item.type || item.category || 'HELP'} - {formatDate(item.createdAt || item.submittedAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ea-help-status ${
                            (item.status || 'PENDING') === 'RESOLVED'
                              ? 'is-resolved'
                              : 'is-pending'
                          }`}
                        >
                          {item.status || 'PENDING'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-semibold mb-1">Your Message</p>
                        <p className="whitespace-pre-wrap">
                          {item.message || item.description || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-1">Admin Response</p>
                        <p className="whitespace-pre-wrap">
                          {item.adminResponse || 'No response yet.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default HelpPage;
