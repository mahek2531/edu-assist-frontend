import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, RadioTower, Sparkles, Trophy, Zap } from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export const PageTransition = ({ children }) => (
  <motion.div
    className="ea-route-stage"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const AmbientBackground = ({ variant = 'default', density = 8 }) => {
  const nodeCount = Math.min(density, 4);
  const nodes = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, index) => ({
        id: index,
        left: `${(index * 23 + 8) % 100}%`,
        top: `${(index * 31 + 12) % 100}%`,
        size: 5 + ((index * 7) % 10),
        delay: `${(index % 5) * 0.45}s`,
        duration: `${7 + (index % 4) * 1.6}s`,
      })),
    [nodeCount]
  );

  return (
    <div className={`ea-ambient-root ea-ambient-${variant}`} aria-hidden="true">
      <div className="ea-ambient-grid" />
      <div className="ea-ambient-orb ea-ambient-orb-one" />
      <div className="ea-ambient-nodes">
        {nodes.map((node) => (
          <span
            key={node.id}
            style={{
              left: node.left,
              top: node.top,
              width: node.size,
              height: node.size,
              animationDelay: node.delay,
              animationDuration: node.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const AuthPortalScene = ({ variant = 'student' }) => (
  <div className={`ea-auth-portal-scene ea-auth-portal-${variant}`} aria-hidden="true">
    <div className="ea-auth-portal-ring" />
    <div className="ea-auth-portal-core" />
    <div className="ea-auth-portal-beams">
      <span />
      <span />
      <span />
      <span />
    </div>
    <div className="ea-auth-portal-chips">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  </div>
);

export const PasswordSentinel = ({
  visible = false,
  focused = false,
  typing = false,
  className = '',
}) => {
  const state = visible ? 'revealed' : typing ? 'typing' : focused ? 'focused' : 'idle';

  return (
    <div className={cx('ea-password-sentinel', `ea-password-sentinel-${state}`, className)} aria-hidden="true">
      <div className="ea-sentinel-antenna" />
      <div className="ea-sentinel-face">
        <span className="ea-sentinel-eye ea-sentinel-eye-left" />
        <span className="ea-sentinel-eye ea-sentinel-eye-right" />
        <span className="ea-sentinel-lid ea-sentinel-lid-left" />
        <span className="ea-sentinel-lid ea-sentinel-lid-right" />
        <span className="ea-sentinel-hand ea-sentinel-hand-left" />
        <span className="ea-sentinel-hand ea-sentinel-hand-right" />
      </div>
      <div className="ea-sentinel-glow" />
    </div>
  );
};

export const SectionTransition = ({ children, className = '' }) => (
  <motion.div
    className={cx('ea-section-transition', className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const AnimatedCounter = ({ value, suffix = '' }) => {
  const numericValue = Number(value);
  const [displayValue, setDisplayValue] = useState(Number.isFinite(numericValue) ? numericValue : value);

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(value);
      return undefined;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(numericValue);
      return undefined;
    }

    let frameId;
    const startValue = Number(displayValue) || 0;
    const distance = numericValue - startValue;
    const startedAt = performance.now();
    const duration = 780;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + distance * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [numericValue, value]);

  if (!Number.isFinite(numericValue)) {
    return <>{value}</>;
  }

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
};

export const GameCard = ({ children, className = '', interactive = false }) => (
  <motion.div
    className={cx('ea-card', interactive && 'ea-card-interactive', className)}
    whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
    whileTap={interactive ? { scale: 0.99 } : undefined}
    transition={{ type: 'spring', stiffness: 340, damping: 26 }}
  >
    {children}
  </motion.div>
);

export const GameButton = ({
  children,
  className = '',
  variant = 'primary',
  disabled = false,
  ...props
}) => (
  <motion.button
    className={cx('ea-button', `ea-button-${variant}`, className)}
    whileHover={disabled ? undefined : { y: -3, scale: 1.015 }}
    whileTap={disabled ? undefined : { scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 420, damping: 20 }}
    disabled={disabled}
    {...props}
  >
    <span className="ea-button-ripple" aria-hidden="true" />
    <span className="ea-button-shine" aria-hidden="true" />
    <span className="ea-button-content">{children}</span>
  </motion.button>
);

export const GameBadge = ({ children, tone = 'brand', className = '' }) => (
  <span className={cx('ea-badge', `ea-badge-${tone}`, className)}>
    <Sparkles size={14} aria-hidden="true" />
    {children}
  </span>
);

export const GameLoader = ({ label = 'Syncing mission data...' }) => (
  <div className="ea-loader-wrap" role="status" aria-live="polite">
    <div className="ea-loader-orbit" aria-hidden="true">
      <span />
      <span />
      <Loader2 size={26} />
    </div>
    <div className="ea-loader-bars" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
    <p>{label}</p>
  </div>
);

export const EmptyState = ({
  title = 'Nothing here yet',
  text = 'Your next action will bring this area to life.',
  icon = 'trophy',
}) => {
  const Icon = icon === 'award' ? Award : Trophy;

  return (
    <div className="ea-empty-state">
      <div className="ea-empty-radar" aria-hidden="true" />
      <div className="ea-empty-icon">
        <Icon size={30} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
};

export const Feedback = ({ type = 'info', children }) => (
  <motion.div
    className={cx('ea-feedback', `ea-feedback-${type}`)}
    initial={{ opacity: 0, y: 12, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
  >
    <span className="ea-feedback-ping" aria-hidden="true">
      {type === 'success' ? <Trophy size={16} /> : type === 'error' ? <RadioTower size={16} /> : <Zap size={16} />}
    </span>
    {children}
  </motion.div>
);

export const GameModal = ({ children, className = '' }) => (
  <motion.div
    className="ea-modal-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22 }}
  >
    <motion.div
      className={cx('ea-modal-panel', className)}
      initial={{ opacity: 0, y: 28, scale: 0.92, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
    >
      {children}
    </motion.div>
  </motion.div>
);

export const StatCard = ({ label, value, icon, tone = 'brand' }) => (
  <GameCard className={cx('ea-stat-card', `ea-stat-${tone}`)} interactive>
    <div className="ea-stat-icon">{icon}</div>
    <div>
      <p>{label}</p>
      <strong><AnimatedCounter value={value} /></strong>
    </div>
  </GameCard>
);

export default {
  AmbientBackground,
  AnimatedCounter,
  AuthPortalScene,
  EmptyState,
  Feedback,
  GameBadge,
  GameButton,
  GameCard,
  GameModal,
  GameLoader,
  PageTransition,
  PasswordSentinel,
  SectionTransition,
  StatCard,
};
