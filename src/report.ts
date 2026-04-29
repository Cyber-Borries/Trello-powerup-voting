import './styles.css';
import { buildVotingCsv, downloadCsv } from './csv';
import { blockerCount, getVotes, uniqueCountries, VOTE_LABELS } from './storage';
import type { ReportCard, TrelloCard, TrelloList } from './types';

const t = window.TrelloPowerUp.iframe();
const reportContent = document.querySelector<HTMLElement>('#report-content');
const exportButton = document.querySelector<HTMLButtonElement>('#export-csv');

let reportCards: ReportCard[] = [];

void loadReport();

exportButton?.addEventListener('click', () => {
  if (!reportCards.length) {
    return;
  }

  downloadCsv(buildVotingCsv(reportCards), `country-feature-votes-${new Date().toISOString().slice(0, 10)}.csv`);
});

async function loadReport(): Promise<void> {
  try {
    const [cards, lists] = await Promise.all([t.cards('id', 'name', 'url', 'idList'), t.lists('id', 'name')]);
    const listNames = new Map((lists as TrelloList[]).map((list) => [list.id, list.name]));
    const cardsWithVotes = await Promise.all(
      (cards as TrelloCard[]).map(async (card) => ({
        card,
        listName: listNames.get(card.idList || '') || 'Unknown list',
        votes: await getVotes(t, card.id)
      }))
    );

    reportCards = cardsWithVotes.filter((item) => item.votes.length > 0);
    renderReport();
    await t.sizeTo('#content');
  } catch (error) {
    if (reportContent) {
      reportContent.innerHTML = `<p class="message error">Could not load the voting report. ${escapeHtml(String(error))}</p>`;
    }
  }
}

function renderReport(): void {
  if (!reportContent || !exportButton) {
    return;
  }

  exportButton.disabled = !reportCards.length;

  if (!reportCards.length) {
    reportContent.innerHTML = '<p class="empty">No country votes found on visible cards.</p>';
    return;
  }

  reportContent.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Card</th>
            <th>List</th>
            <th>Total</th>
            <th>Countries</th>
            <th>Blockers</th>
            <th>Voters</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${reportCards.map(renderReportRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderReportRow(reportCard: ReportCard): string {
  const countries = uniqueCountries(reportCard.votes);
  const blockers = blockerCount(reportCard.votes);
  const voters = reportCard.votes.map((vote) => `${vote.n} (${vote.c}, ${VOTE_LABELS[vote.v]})`).join('; ');

  return `
    <tr>
      <td><strong>${escapeHtml(reportCard.card.name)}</strong></td>
      <td>${escapeHtml(reportCard.listName)}</td>
      <td>${reportCard.votes.length}</td>
      <td>${escapeHtml(countries.join(', '))}</td>
      <td><span class="pill ${blockers > 0 ? 'danger' : ''}">${blockers}</span></td>
      <td>${escapeHtml(voters)}</td>
      <td>${reportCard.card.url ? `<a class="button-link" href="${escapeHtml(reportCard.card.url)}" target="_blank" rel="noreferrer">Open</a>` : ''}</td>
    </tr>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char];
  });
}
