import { blockerCount, uniqueCountries, VOTE_LABELS } from './storage';
import type { ReportCard, StoredVote } from './types';

const CSV_COLUMNS = [
  'Card ID',
  'Card Name',
  'List Name',
  'Card URL',
  'Total Votes',
  'Countries',
  'Blocker Count',
  'Voter Name',
  'Voter Country',
  'Vote Type',
  'Comment',
  'Updated At'
];

export function buildVotingCsv(reportCards: ReportCard[]): string {
  const rows = reportCards.flatMap((reportCard) => {
    const countries = uniqueCountries(reportCard.votes).join('; ');
    const blockers = blockerCount(reportCard.votes);

    return reportCard.votes.map((vote) => voteRow(reportCard, vote, countries, blockers));
  });

  return [CSV_COLUMNS, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function voteRow(reportCard: ReportCard, vote: StoredVote, countries: string, blockers: number): string[] {
  return [
    reportCard.card.id,
    reportCard.card.name,
    reportCard.listName,
    reportCard.card.url || '',
    String(reportCard.votes.length),
    countries,
    String(blockers),
    vote.n,
    vote.c,
    VOTE_LABELS[vote.v],
    vote.x || '',
    vote.ua
  ];
}

function escapeCsvValue(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
