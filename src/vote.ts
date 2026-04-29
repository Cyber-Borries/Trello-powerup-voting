import './styles.css';
import {
  friendlyStorageError,
  getAllowedCountries,
  getVotes,
  MAX_COMMENT_LENGTH,
  removeVote,
  setVotes,
  upsertVote
} from './storage';
import type { StoredVote, TrelloClient, VoteTypeCode } from './types';

const t = window.TrelloPowerUp.iframe();

const form = document.querySelector<HTMLFormElement>('#vote-form');
const countrySelect = document.querySelector<HTMLSelectElement>('#country');
const voteTypeSelect = document.querySelector<HTMLSelectElement>('#vote-type');
const commentInput = document.querySelector<HTMLTextAreaElement>('#comment');
const commentCount = document.querySelector<HTMLElement>('#comment-count');
const message = document.querySelector<HTMLElement>('#message');
const removeButton = document.querySelector<HTMLButtonElement>('#remove-vote');
const saveButton = document.querySelector<HTMLButtonElement>('#save-vote');

let currentMemberId = '';
let currentVote: StoredVote | undefined;

void initialize();

async function initialize(): Promise<void> {
  if (!form || !countrySelect || !voteTypeSelect || !commentInput || !commentCount || !removeButton || !saveButton) {
    return;
  }

  const [countries, member, votes] = await Promise.all([
    getAllowedCountries(t),
    t.member('id', 'fullName', 'username'),
    getVotes(t)
  ]);

  currentMemberId = String(member.id || t.getContext().member || '');
  currentVote = votes.find((vote) => vote.m === currentMemberId);

  countrySelect.innerHTML = countries.map((country) => `<option value="${escapeHtml(country)}">${escapeHtml(country)}</option>`).join('');

  if (currentVote) {
    countrySelect.value = currentVote.c;
    voteTypeSelect.value = currentVote.v;
    commentInput.value = currentVote.x || '';
  }

  updateCommentCount();
  updateRemoveButton();
  commentInput.addEventListener('input', updateCommentCount);
  form.addEventListener('submit', (event) => void saveVote(event, t));
  removeButton.addEventListener('click', () => void deleteVote(t));

  await t.sizeTo('#content');
}

async function saveVote(event: SubmitEvent, tClient: TrelloClient): Promise<void> {
  event.preventDefault();
  setBusy(true);
  setMessage('');

  try {
    if (!tClient.memberCanWriteToModel('card')) {
      setMessage('You need Trello card write access to save a country vote.', true);
      return;
    }

    const member = await tClient.member('id', 'fullName', 'username');
    const memberId = String(member.id || currentMemberId);
    const memberName = String(member.fullName || member.username || 'Unknown member');
    const country = countrySelect?.value || '';
    const voteType = (voteTypeSelect?.value || 's') as VoteTypeCode;
    const comment = (commentInput?.value || '').slice(0, MAX_COMMENT_LENGTH);
    const votes = await getVotes(tClient);

    await setVotes(tClient, upsertVote(votes, memberId, memberName, country, voteType, comment));
    setMessage('Vote saved.');
    await tClient.closePopup();
  } catch (error) {
    setMessage(friendlyStorageError(error), true);
  } finally {
    setBusy(false);
  }
}

async function deleteVote(tClient: TrelloClient): Promise<void> {
  setBusy(true);
  setMessage('');

  try {
    if (!tClient.memberCanWriteToModel('card')) {
      setMessage('You need Trello card write access to remove a country vote.', true);
      return;
    }

    const votes = await getVotes(tClient);
    await setVotes(tClient, removeVote(votes, currentMemberId));
    setMessage('Vote removed.');
    await tClient.closePopup();
  } catch (error) {
    setMessage(friendlyStorageError(error), true);
  } finally {
    setBusy(false);
  }
}

function updateCommentCount(): void {
  if (!commentInput || !commentCount) {
    return;
  }

  commentCount.textContent = `${commentInput.value.length}/${MAX_COMMENT_LENGTH}`;
}

function updateRemoveButton(): void {
  if (removeButton) {
    removeButton.disabled = !currentVote;
  }
}

function setBusy(isBusy: boolean): void {
  if (saveButton) {
    saveButton.disabled = isBusy;
  }

  if (removeButton) {
    removeButton.disabled = isBusy || !currentVote;
  }
}

function setMessage(text: string, isError = false): void {
  if (!message) {
    return;
  }

  message.textContent = text;
  message.classList.toggle('error', isError);
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
