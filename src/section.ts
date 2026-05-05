import './styles.css';
import { formatDate, getVotes, toVoteView } from './storage';

const STORAGE_TIMEOUT_MS = 8000;

const content = document.querySelector<HTMLElement>('#section-content');
const powerUp = window.TrelloPowerUp;

if (!powerUp) {
  showStartupError('Trello Power-Up client did not load.');
  throw new Error('Trello Power-Up client did not load.');
}

const t = powerUp.iframe();

content?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  if (target.closest('[data-action="vote"]')) {
    void openVotePopup();
  }
});

void renderSection();
t.render(() => {
  void renderSection();
});

async function renderSection(): Promise<void> {
  if (!content) {
    return;
  }

  try {
    const votes = (await withTimeout(getVotes(t), STORAGE_TIMEOUT_MS, 'Trello storage did not respond.'))
      .map(toVoteView)
      .sort((a, b) => a.country.localeCompare(b.country));

    if (!votes.length) {
      content.innerHTML = `
        <div class="section-header">
          <p class="empty">No country votes yet.</p>
          <button type="button" data-action="vote">Vote as Country</button>
        </div>
      `;
      await t.sizeTo('#content');
      return;
    }

    content.innerHTML = `
      <div class="section-header">
        <p class="empty">${votes.length} ${votes.length === 1 ? 'country vote' : 'country votes'}</p>
        <button type="button" data-action="vote">Vote as Country</button>
      </div>
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
  } catch (error) {
    content.innerHTML = `<p class="message error">Could not load country votes. ${escapeHtml(String(error))}</p>`;
    await t.sizeTo('#content');
  }
}

async function openVotePopup(): Promise<void> {
  await t.popup({
    title: 'Vote as Country',
    url: t.signUrl('./vote.html'),
    height: 360
  });

  window.setTimeout(() => {
    void renderSection();
  }, 500);
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

function showStartupError(text: string): void {
  if (content) {
    content.innerHTML = `<p class="message error">${escapeHtml(text)}</p>`;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}
