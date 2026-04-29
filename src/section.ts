import './styles.css';
import { formatDate, getVotes, toVoteView } from './storage';

const t = window.TrelloPowerUp.iframe();
const content = document.querySelector<HTMLElement>('#section-content');

t.render(async () => {
  if (!content) {
    return;
  }

  const votes = (await getVotes(t)).map(toVoteView).sort((a, b) => a.country.localeCompare(b.country));

  if (!votes.length) {
    content.innerHTML = '<p class="empty">No country votes yet.</p>';
    await t.sizeTo('#content');
    return;
  }

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Country</th>
            <th>Voter</th>
            <th>Vote type</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${votes
            .map(
              (vote) => `
                <tr>
                  <td>${escapeHtml(vote.country)}</td>
                  <td>${escapeHtml(vote.memberName)}</td>
                  <td><span class="pill ${vote.voteType === 'Blocker' ? 'danger' : ''}">${escapeHtml(vote.voteType)}</span></td>
                  <td>${escapeHtml(vote.comment)}</td>
                  <td>${escapeHtml(formatDate(vote.updatedAt))}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  await t.sizeTo('#content');
});

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
