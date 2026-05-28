import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { buildApiUrl, buildAssetUrl } from "../lib/api";
import heroPlatform from "../assets/hero.png";

export default function EduAssistHome() {
  const [openMenu, setOpenMenu] = useState({
    type: null,
    source: null,
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const pageRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pageRef.current && !pageRef.current.contains(e.target)) {
        setOpenMenu({ type: null, source: null });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    fetchLeaderboard();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await axios.get(buildApiUrl("/api/senior/leaderboard"));

      if (res.data.status) {
        const data = [...(res.data.leaderboard || [])];

        data.sort((a, b) => {
          if ((b.totalPoints || 0) !== (a.totalPoints || 0)) {
            return (b.totalPoints || 0) - (a.totalPoints || 0);
          }
          return (b.doubtsSolved || 0) - (a.doubtsSolved || 0);
        });

        let rank = 1;
        const rankedData = data.map((item, index) => {
          if (index > 0) {
            const prev = data[index - 1];
            if (
              (item.totalPoints || 0) !== (prev.totalPoints || 0) ||
              (item.doubtsSolved || 0) !== (prev.doubtsSolved || 0)
            ) {
              rank = index + 1;
            }
          }

          return {
            ...item,
            rank,
          };
        });

        setLeaderboard(rankedData.slice(0, 5));
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const toggleMenu = (type, source) => {
    setOpenMenu((prev) => {
      if (prev.type === type && prev.source === source) {
        return { type: null, source: null };
      }
      return { type, source };
    });
  };

  const getStudentImage = (student) => {
  const rawImage =
    student?.photo ||
    student?.profilePic ||
    student?.profilePhoto ||
    student?.image ||
    student?.imageUrl ||
    student?.photoUrl ||
    "";

  if (!rawImage) return "/default-profile.png";

  if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
    return rawImage;
  }

  const cleanPath = String(rawImage).replace(/^\/+/, "");
  return buildAssetUrl(cleanPath, "/uploads");
};

  const getStudentName = (student) => {
  if (student?.name) return student.name;
  if (student?.studentName) return student.studentName;
  if (student?.fullName) return student.fullName;
  if (student?.username) return student.username;
  if (student?.student?.name) return student.student.name;
  if (student?.seniorName) return student.seniorName;
  if (student?.juniorName) return student.juniorName;

  if (student?.seniorEmail) {
    return student.seniorEmail.split("@")[0];
  }

  if (student?.email) {
    return student.email.split("@")[0];
  }

  return "Student";
};

  const getStudentRole = (student) => {
    return student?.role || "Senior";
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `#${rank}`;
  };

  const renderLoginMenu = (source, alignClass = "left-1/2 -translate-x-1/2") =>
    openMenu.type === "login" && openMenu.source === source ? (
      <div
        className={`absolute ${alignClass} mt-3 w-56 rounded-lg overflow-hidden z-[200] ea-home-menu`}
      >
        <a
          href="/adminlogin"
          className="block px-4 py-3 transition"
        >
          Admin Login
        </a>
        <a
          href="/login/junior"
          className="block px-4 py-3 transition"
        >
          Junior Login
        </a>
        <a
          href="/login/senior"
          className="block px-4 py-3 transition"
        >
          Senior Login
        </a>
      </div>
    ) : null;

  const renderRegisterMenu = (source, alignClass = "left-1/2 -translate-x-1/2") =>
    openMenu.type === "register" && openMenu.source === source ? (
      <div
        className={`absolute ${alignClass} mt-3 w-56 rounded-lg overflow-hidden z-[200] ea-home-menu`}
      >
        <a
          href="/register/junior"
          className="block px-4 py-3 transition"
        >
          Junior Register
        </a>
        <a
          href="/register/senior"
          className="block px-4 py-3 transition"
        >
          Senior Register
        </a>
      </div>
    ) : null;

  return (
    <div
      ref={pageRef}
      className="min-h-screen font-sans antialiased overflow-x-hidden ea-home-shell"
    >
      <div className="ea-home-atmosphere" aria-hidden="true">
        <div className="ea-home-aurora ea-home-aurora-one" />
        <div className="ea-home-depth-grid" />
        <div className="ea-home-scanline" />
        <div className="ea-home-constellation" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 ea-home-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:rotate-12 transition duration-300 ea-brand-mark">
              EA
            </div>
            <span className="text-2xl font-extrabold tracking-tight relative ea-brand-name">
              Edu Assist
              <span className="ea-nav-underline"></span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="font-medium transition relative group ea-nav-link">
              How it Works
              <span className="ea-nav-underline"></span>
            </a>
            <a href="#roles" className="font-medium transition relative group ea-nav-link">
              For Juniors / Seniors
              <span className="ea-nav-underline"></span>
            </a>
            <a href="#join" className="font-medium transition relative group ea-nav-link">
              Join Now
              <span className="ea-nav-underline"></span>
            </a>
            <a href="/help" className="font-medium transition relative group ea-nav-link">
              Help
              <span className="ea-nav-underline"></span>
            </a>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                onClick={() => toggleMenu("login", "nav")}
                className="px-4 sm:px-5 py-2 font-medium transition relative group ea-nav-action"
              >
                Login
                <span className="ea-nav-underline"></span>
              </button>
              {renderLoginMenu("nav", "right-0")}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleMenu("register", "nav")}
                className="text-white px-5 sm:px-6 py-2.5 rounded-lg font-medium shadow-md transition transform hover:scale-105 hover:shadow-xl relative overflow-hidden group ea-nav-primary"
              >
                <span className="relative z-10">Register</span>
                <span className="ea-action-sweep"></span>
              </button>
              {renderRegisterMenu("nav", "right-0")}
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 md:pt-40 md:pb-24 text-white relative overflow-visible z-20 ea-home-hero">
        <div className="absolute inset-0 ea-hero-grid pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none ea-hero-particle-field" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-16 items-center">
            <div className="text-left ea-hero-copy">
              <div className="inline-flex mb-8 ea-hero-kicker">
                <span>MCA Mentorship Platform</span>
                <span>Live Mission Network</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
                Edu Assist
                <br />
                <span className="ea-hero-title-accent">
                  Mentor missions, unlocked.
                </span>
              </h1>

              <p className="text-xl md:text-2xl mb-10 max-w-3xl font-light ea-hero-subcopy">
                Junior MCA students launch doubts into a guided senior mentor network with ranking, recognition, and fast concept-deep answers.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 md:gap-6 relative z-[150]">
                <div className="relative">
                  <button
                    onClick={() => toggleMenu("register", "hero")}
                    className="text-lg md:text-xl font-semibold px-10 py-5 rounded-lg shadow-2xl transition transform hover:scale-105 hover:rotate-1 relative overflow-hidden group ea-hero-primary"
                  >
                    <span className="relative z-10">Register</span>
                    <span className="ea-action-sweep"></span>
                  </button>
                  {renderRegisterMenu("hero")}
                </div>

                <div className="relative">
                  <button
                    onClick={() => toggleMenu("login", "hero")}
                    className="text-lg md:text-xl font-semibold px-10 py-5 rounded-lg shadow-2xl transition transform hover:scale-105 hover:-rotate-1 relative overflow-hidden group ea-hero-secondary"
                  >
                    <span className="relative z-10">Login</span>
                    <span className="ea-action-sweep"></span>
                  </button>
                  {renderLoginMenu("hero")}
                </div>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-3 max-w-2xl ea-hero-metrics" aria-label="Platform highlights">
                <div>
                  <strong>XP</strong>
                  <span>Mentor rank loop</span>
                </div>
                <div>
                  <strong>1:1</strong>
                  <span>Doubt guidance</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Queue visibility</span>
                </div>
              </div>
            </div>

            <div className="ea-hero-visual" aria-hidden="true">
              <div className="ea-hero-console">
                <div className="ea-console-topline">
                  <span>MENTOR GRID</span>
                  <span>ONLINE</span>
                </div>
                <div className="ea-console-stage">
                  <img src={heroPlatform} alt="" className="ea-console-platform" />
                  <div className="ea-console-energy" />
                  <div className="ea-console-route ea-console-route-one" />
                  <div className="ea-console-route ea-console-route-two" />
                  <div className="ea-console-node ea-console-node-one">Ask</div>
                  <div className="ea-console-node ea-console-node-two">Match</div>
                  <div className="ea-console-node ea-console-node-three">Grow</div>
                </div>
                <div className="ea-console-feed">
                  <span>Junior doubt queued</span>
                  <span>Senior mentor matched</span>
                  <span>XP awarded</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-12 md:mt-20 relative z-10 ea-leaderboard-wrap">
        <div className="rounded-lg shadow-2xl p-6 md:p-8 ea-leaderboard-panel">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">
                Mentor Leaderboard
              </h3>
              <p className="mt-1">
                Highest ranked seniors by points, solved doubts, and impact.
              </p>
            </div>

            <button
              onClick={fetchLeaderboard}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition self-start md:self-auto ea-refresh-button"
            >
              Refresh
            </button>
          </div>

          {loadingLeaderboard ? (
            <div className="py-12 text-center ea-muted-text">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center">
              <h4 className="text-2xl font-bold mb-2">
                No champions yet
              </h4>
              <p className="text-lg max-w-2xl mx-auto ea-muted-text">
                Be the first to ask a doubt, solve one, and claim the top spot on
                the Edu Assist leaderboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((student, index) => {
                const imageUrl = getStudentImage(student);

                return (
                  <div
                    key={`${student.rank}-${student.id || student.email || student.name || index}`}
                    className="flex items-center justify-between gap-4 p-4 md:p-5 rounded-lg transition ea-leader-row"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg text-white font-bold text-sm shrink-0 ea-rank-badge">
                        {getRankBadge(student.rank || index + 1)}
                      </div>

                      {imageUrl ? (
                        <img
                          src={getStudentImage(student)}
                          alt={getStudentName(student)}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-sm shrink-0 ea-avatar-ring"
                          onError={(e) => {
                            e.currentTarget.src = "/default-profile.png";
                          }}
                        />
                      ) : null}

                      <div
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full font-bold items-center justify-center shadow-sm shrink-0 ea-avatar-ring ea-avatar-fallback"
                        style={{ display: imageUrl ? "none" : "flex" }}
                      >
                        {getStudentName(student).charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-base md:text-lg font-bold truncate">
                          {getStudentName(student)}
                        </h4>
                        <p className="text-sm truncate ea-muted-text">
                          {getStudentRole(student)}
                        </p>
                        <p className="text-sm font-medium ea-accent-text">
                          {student.doubtsSolved || 0} doubts solved
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl md:text-2xl font-extrabold ea-score-text">
                        {student.totalPoints || 0}
                      </div>
                      <div className="text-xs md:text-sm ea-muted-text">
                        points
                      </div>
                      <div className="ea-level-bar mt-2 w-20" aria-hidden="true">
                        <span style={{ width: `${Math.min(100, Math.max(12, student.totalPoints || 0))}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <section id="how" className="py-20 md:py-28 relative ea-home-section ea-home-how">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            How the Mission Loop Works
          </h2>
          <p className="text-xl text-center mb-16 max-w-3xl mx-auto ea-section-copy">
            A fast, role-based mentorship flow designed to feel clear, rewarding, and alive.
          </p>

          <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
            {[
              {
                step: "1",
                title: "Ask",
                desc: "Post your doubt with text or screenshot",
                icon: "Ask",
              },
              {
                step: "2",
                title: "Match",
                desc: "Get help from the right senior mentor",
                icon: "Match",
              },
              {
                step: "3",
                title: "Grow",
                desc: "Learn faster and improve together",
                icon: "Grow",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative p-10 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 group ea-process-card"
              >
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg ea-step-chip">
                  {item.step}
                </div>

                <div className="text-4xl font-bold mb-6 ea-process-icon">
                  {item.icon}
                </div>

                <h3 className="text-3xl font-bold mb-4">
                  {item.title}
                </h3>

                <p className="text-lg mb-4 ea-section-copy">{item.desc}</p>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${33 + index * 33}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="py-20 md:py-28 relative ea-home-section ea-home-roles">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-2 lg:order-1 ea-role-panel ea-role-junior">
              <div className="inline-block mb-4 px-4 py-2 rounded-lg text-sm font-semibold ea-track-badge">
                Junior Track
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-8">
                For Junior MCA Students
              </h3>
              <p className="text-xl mb-8 leading-relaxed ea-section-copy">
                Stuck on concepts, debugging, assignments or placements prep?
                Get quick guidance from seniors.
              </p>
              <ul className="space-y-5 text-lg mb-8">
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Relatable explanations from recent seniors</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Availability during exam and assignment time</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Build confidence before internals and placements</span>
                </li>
              </ul>
            </div>

            <div className="order-1 lg:order-2 ea-role-panel ea-role-senior">
              <div className="inline-block mb-4 px-4 py-2 rounded-lg text-sm font-semibold ea-track-badge">
                Senior Track
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-8">
                For Senior MCA Students
              </h3>
              <p className="text-xl mb-8 leading-relaxed ea-section-copy">
                Reinforce your own knowledge, guide juniors, and build your
                mentoring profile.
              </p>
              <ul className="space-y-5 text-lg mb-8">
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Revise core subjects by teaching</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Earn recognition through leaderboard ranking</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-2xl ea-accent-text">-&gt;</span>
                  <span>Showcase mentoring skills</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="py-24 text-white text-center relative overflow-hidden ea-home-cta">
        <div className="absolute inset-0 pointer-events-none ea-cta-spark-field" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Bridge the Gap. Strengthen the Batch.
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90">
            Join the mentorship-driven doubt-solving platform built for MCA
            students.
          </p>

          <div className="relative inline-block">
            <button
              onClick={() => toggleMenu("register", "cta")}
              className="inline-block text-2xl font-bold px-14 py-6 rounded-lg shadow-2xl transition transform hover:scale-105 hover:rotate-1 relative overflow-hidden group ea-hero-primary"
            >
              <span className="relative z-10">Register</span>
              <span className="ea-action-sweep"></span>
            </button>

            {renderRegisterMenu("cta")}
          </div>
        </div>
      </section>

      <footer className="py-12 ea-home-footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-left">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ea-brand-mark">
                  EA
                </div>
                <span className="font-bold">Edu Assist</span>
              </div>
              <p className="text-sm">Making MCA learning collaborative.</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#how" className="transition">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#join" className="transition">
                    Join Now
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="/help" className="transition">
                    Help
                  </a>
                </li>
                <li>
                  <a href="#" className="transition">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="transition">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-lg font-medium">
              (c) {new Date().getFullYear()} Edu Assist
            </p>
            <p className="mt-3 text-sm">
              MCA Mentorship Platform - Connecting Juniors and Seniors
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
