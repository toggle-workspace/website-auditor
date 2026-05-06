'use client';

import { AuditReport } from '@/lib/types';
import { ratingLabel } from '@/lib/utils/score';

// @react-pdf/renderer primitives — only imported when this module is dynamically loaded client-side
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { backgroundColor: '#0f172a', padding: 32, fontFamily: 'Helvetica', color: '#f1f5f9' },
  header: { marginBottom: 24 },
  appName: { fontSize: 10, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  url: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#f8fafc', marginBottom: 4 },
  date: { fontSize: 9, color: '#64748b' },
  overallRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 },
  overallLabel: { fontSize: 10, color: '#94a3b8' },
  overallScore: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#f8fafc', marginLeft: 8 },
  scoreGrid: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  scoreBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 6, padding: 8, alignItems: 'center' },
  scoreVal: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#f8fafc' },
  scoreLabel: { fontSize: 7, color: '#64748b', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#f8fafc', marginBottom: 6, paddingBottom: 3, borderBottom: '1px solid #1e293b' },
  checkRow: { flexDirection: 'row', marginBottom: 3 },
  checkDot: { fontSize: 8, marginRight: 5 },
  checkText: { fontSize: 8, color: '#94a3b8', flex: 1 },
  checkPass: { color: '#22c55e' },
  checkFail: { color: '#ef4444' },
  checkWarn: { color: '#f59e0b' },
  recItem: { fontSize: 8, color: '#a5b4fc', marginBottom: 2, paddingLeft: 8 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#334155' },
});

function ScoreBox({ label, score }: { label: string; score: number | null }) {
  const color = score == null ? '#64748b' : score >= 90 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.scoreBox}>
      <Text style={[styles.scoreVal, { color }]}>{score ?? '—'}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

function CheckItem({ label, status, detail }: { label: string; status: string; detail?: string }) {
  const dotStyle = status === 'pass' ? styles.checkPass : status === 'warning' ? styles.checkWarn : styles.checkFail;
  const dot = status === 'pass' ? '✓' : status === 'warning' ? '!' : '✗';
  return (
    <View style={styles.checkRow}>
      <Text style={[styles.checkDot, dotStyle]}>{dot}</Text>
      <Text style={styles.checkText}>{label}{detail ? ` — ${detail}` : ''}</Text>
    </View>
  );
}

interface Props {
  report: AuditReport;
}

export default function AuditPdfDocument({ report }: Props) {
  const date = new Date(report.auditedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = report.performance.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seo = report.seo.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ux = report.ux.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bugs = report.bugs.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const traffic = report.traffic.data as any;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.appName}>Website Audit Report</Text>
          <Text style={styles.url}>{report.url}</Text>
          <Text style={styles.date}>Audited: {date}</Text>
          <View style={styles.overallRow}>
            <Text style={styles.overallLabel}>Overall Score:</Text>
            <Text style={styles.overallScore}>{report.overallScore ?? '—'}/100</Text>
          </View>
        </View>

        <View style={styles.scoreGrid}>
          <ScoreBox label="Performance" score={report.performance.score} />
          <ScoreBox label="SEO" score={report.seo.score} />
          <ScoreBox label="UX" score={report.ux.score} />
          <ScoreBox label="Bugs" score={report.bugs.score} />
          <ScoreBox label="Traffic" score={report.traffic.score} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance — {report.performance.score ?? 'N/A'}/100</Text>
          {perf?.mobile?.coreWebVitals?.slice(0, 4).map((v: { id: string; label: string; displayValue: string; rating: string }) => (
            <CheckItem
              key={v.id}
              label={`${v.label}: ${v.displayValue}`}
              status={v.rating === 'good' ? 'pass' : v.rating === 'needs-improvement' ? 'warning' : 'fail'}
            />
          ))}
          {report.performance.error && (
            <Text style={[styles.checkText, { color: '#ef4444' }]}>{report.performance.error}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SEO Analysis — {report.seo.score ?? 'N/A'}/100</Text>
          {seo?.checks?.map((c: { id: string; label: string; status: string; recommendation?: string }) => (
            <CheckItem key={c.id} label={c.label} status={c.status} detail={c.status !== 'pass' ? c.recommendation : undefined} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UX Improvements — {report.ux.score ?? 'N/A'}/100</Text>
          {ux?.checks?.map((c: { id: string; label: string; status: string; detail?: string }) => (
            <CheckItem key={c.id} label={c.label} status={c.status} detail={c.status !== 'pass' ? c.detail : undefined} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bug Detection — {report.bugs.score ?? 'N/A'}/100</Text>
          {bugs?.checks?.map((c: { id: string; label: string; status: string; detail?: string }) => (
            <CheckItem key={c.id} label={c.label} status={c.status} detail={c.status !== 'pass' ? c.detail : undefined} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Traffic Potential — {report.traffic.score ?? 'N/A'}/100</Text>
          {traffic?.pageRankAvailable && (
            <CheckItem label={`Domain Authority: ${traffic.domainAuthority?.toFixed(1)}/10`} status="pass" />
          )}
          <CheckItem
            label={`Core Web Vitals: ${ratingLabel(traffic?.coreWebVitalsRating ?? 'unknown')}`}
            status={traffic?.coreWebVitalsRating === 'good' ? 'pass' : traffic?.coreWebVitalsRating === 'needs-improvement' ? 'warning' : 'fail'}
          />
          {traffic?.recommendations?.map((rec: string, i: number) => (
            <Text key={i} style={styles.recItem}>• {rec}</Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Website Auditor — {report.domain}</Text>
          <Text style={styles.footerText}>Generated {date}</Text>
        </View>
      </Page>
    </Document>
  );
}
