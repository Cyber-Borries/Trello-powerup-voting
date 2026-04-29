import './styles.css';
import { DEFAULT_COUNTRIES, friendlyStorageError, getAllowedCountries, setAllowedCountries } from './storage';

const t = window.TrelloPowerUp.iframe();

const form = document.querySelector<HTMLFormElement>('#settings-form');
const countriesInput = document.querySelector<HTMLTextAreaElement>('#countries');
const message = document.querySelector<HTMLElement>('#message');
const saveButton = document.querySelector<HTMLButtonElement>('#save-settings');

void initialize();

async function initialize(): Promise<void> {
  if (!form || !countriesInput) {
    return;
  }

  const countries = await getAllowedCountries(t);
  countriesInput.value = countries.join(', ');

  form.addEventListener('submit', (event) => void saveSettings(event));
  await t.sizeTo('#content');
}

async function saveSettings(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  setBusy(true);
  setMessage('');

  try {
    if (!t.memberCanWriteToModel('board')) {
      setMessage('You need Trello board write access to change voting settings.', true);
      return;
    }

    const countries = parseCountries(countriesInput?.value || '');
    await setAllowedCountries(t, countries.length ? countries : DEFAULT_COUNTRIES);
    setMessage('Settings saved.');
  } catch (error) {
    setMessage(friendlyStorageError(error), true);
  } finally {
    setBusy(false);
  }
}

function parseCountries(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((country) => country.trim())
        .filter(Boolean)
    )
  );
}

function setBusy(isBusy: boolean): void {
  if (saveButton) {
    saveButton.disabled = isBusy;
  }
}

function setMessage(text: string, isError = false): void {
  if (!message) {
    return;
  }

  message.textContent = text;
  message.classList.toggle('error', isError);
}
