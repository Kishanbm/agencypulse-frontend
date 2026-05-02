import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

export default function BillingCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-white rounded-3xl overflow-hidden text-center" style={{ border: '1px solid #ECECE6', boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#9CA3AF,#D1D5DB)' }} />

          <div className="px-8 py-10 space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" as const }}
              className="flex justify-center"
            >
              <div
                className="size-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(156,163,175,0.12)', border: '2px solid rgba(156,163,175,0.25)' }}
              >
                <XCircle className="size-10 text-muted-foreground" />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
              className="space-y-2"
            >
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                No Changes Made
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your subscription was not changed. You can upgrade at any time from the Billing settings page.
              </p>
            </motion.div>

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" as const }}
              className="rounded-2xl px-4 py-3.5 text-left"
              style={{ background: '#FAFAF7', border: '1px solid #ECECE6' }}
            >
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(91,71,224,0.10)' }}>
                  <CreditCard className="size-4" style={{ color: '#5B47E0' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Your current plan is still active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No charges were made to your payment method.</p>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.38, ease: "easeOut" as const }}
              className="space-y-2 pt-1"
            >
              <button
                onClick={() => navigate('/settings/billing', { replace: true })}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#111827,#1f2937)' }}
              >
                <CreditCard className="size-4" />
                View Billing Plans
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: '#FAFAF7', border: '1px solid #ECECE6', color: 'var(--muted-foreground)' }}
              >
                <ArrowLeft className="size-4" />
                Go Back
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
